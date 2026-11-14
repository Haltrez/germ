/**
 * Zod schemas for all data. Importable from Astro (content.config.ts) and from
 * plain Node (scripts/compliance-data.ts), so only `astro/zod` is imported here.
 *
 * Localisation: numeric/factual slot data (slots/*.json) is language-neutral.
 * Codes such as volatility, features and categories are stored as neutral codes
 * and translated in src/lib/i18n/de.ts. German review text for a slot lives in
 * src/content/slot-texts/de/<slug>.mdx, so a future Swedish version can add
 * slot-texts/sv/ without touching the numbers.
 */
import { z } from 'astro/zod';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slug = () => z.string().regex(SLUG, 'Slug: lowercase, digits, hyphens');

/** Any value that is not yet verified must be the literal string "TODO". */
export const TODO = z.literal('TODO');
export const todoOr = <T extends z.ZodType>(schema: T) => z.union([schema, TODO]);
export const isoDate = () => z.iso.date();

// ---------------------------------------------------------------- codes
export const VOLATILITY = ['low', 'medium', 'high', 'very-high'] as const;
export const FEATURES = [
  'free-spins',
  'expanding-symbols',
  'multipliers',
  'wilds',
  'sticky-wilds',
  'walking-wilds',
  'scatter-pays',
  'cascades',
  'cluster-pays',
  'megaways',
  'hold-and-win',
  'respins',
  'gamble',
  'retrigger',
] as const;
export const CATEGORY_CODES = ['book', 'hold-and-win', 'megaways', 'fruit', 'classic'] as const;
export const PAYMENT_METHODS = [
  'paypal',
  'paysafecard',
  'trustly',
  'klarna',
  'visa',
  'mastercard',
  'apple-pay',
  'google-pay',
  'bank-transfer',
  'skrill',
  'neteller',
  'crypto',
] as const;
export const LOCALES = ['de'] as const;

const localized = () => z.object({ de: z.string().min(1) });

// ---------------------------------------------------------------- Slot
export const rtpSchema = z.union([
  z.number().min(80).max(100),
  z.array(z.number().min(80).max(100)).min(1),
]);

export const slotSchema = z
  .object({
    name: z.string().min(1),
    provider: slug(),
    releaseDate: todoOr(isoDate()),
    /** Percent. A list means the provider ships several RTP versions. */
    rtp: todoOr(rtpSchema),
    /** RTP version typically used at German licensed sites, if known. */
    rtpDE: todoOr(z.number().min(80).max(100)).optional(),
    volatility: todoOr(z.enum(VOLATILITY)),
    maxWinMultiplier: todoOr(z.number().positive()),
    reels: todoOr(z.number().int().positive()),
    rows: todoOr(z.union([z.number().int().positive(), z.string().regex(/^\d+-\d+$/)])),
    /** Grid exactly as the provider writes it (e.g. "5×3"), when reels/rows are not separately confirmed. */
    grid: z.string().regex(/^\d+×\d+$/).optional(),
    winLines: todoOr(
      z.object({
        type: z.enum(['lines', 'ways', 'cluster', 'scatter-pays']),
        count: z.number().int().positive().optional(),
      }),
    ),
    /** Provider stake range in EUR. Licensed German sites cap at €1 per spin. */
    minStake: todoOr(z.number().positive()),
    maxStake: todoOr(z.number().positive()),
    features: z.array(z.enum(FEATURES)).default([]),
    themes: z.array(slug()).default([]),
    categories: z.array(z.enum(CATEGORY_CODES)).default([]),
    demoUrl: z.url().nullable(),
    demoSource: z.enum(['official-provider', 'licensed-aggregator', 'none']),
    demoSourceName: z.string().optional(),
    demoLicenseNote: z.string().optional(),
    demoAvailableInDE: todoOr(z.boolean()),
    /** Is the game offered at GGL-licensed sites in Germany? */
    availableInDE: todoOr(z.boolean()),
    gglOperatorSlugs: z.array(slug()).default([]),
    thumbnail: z.object({ src: z.string(), alt: z.string().min(5) }).optional(),
    screenshots: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string().min(5),
          width: z.number().int(),
          height: z.number().int(),
        }),
      )
      .default([]),
    /** Official game sheet(s) the numbers come from. */
    sourceUrls: z.array(z.url()).default([]),
    lastVerified: todoOr(isoDate()),
    /** true = curated by hand; importers never overwrite this file. */
    manual: z.boolean().default(false),
  })
  .superRefine((s, ctx) => {
    if (s.demoUrl && s.demoSource === 'none') {
      ctx.addIssue({ code: 'custom', message: 'demoUrl is set but demoSource is "none"', path: ['demoSource'] });
    }
    if (s.demoUrl && !s.demoLicenseNote) {
      ctx.addIssue({ code: 'custom', message: 'demoUrl requires demoLicenseNote', path: ['demoLicenseNote'] });
    }
    if (s.availableInDE !== true && s.gglOperatorSlugs.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Slot is not confirmed as available in DE but lists GGL operators',
        path: ['gglOperatorSlugs'],
      });
    }
  });

// ---------------------------------------------------------------- Slot text (German)
export const faqItemSchema = z.object({ q: z.string().min(5), a: z.string().min(10) });

export const slotTextSchema = z.object({
  slot: slug(),
  locale: z.enum(LOCALES),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(155),
  intro: z.string().min(50),
  howTo: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  faq: z.array(faqItemSchema).default([]),
  author: slug(),
  updated: isoDate(),
});

// ---------------------------------------------------------------- Provider
export const providerSchema = z.object({
  name: z.string().min(1),
  country: todoOr(z.string()),
  founded: todoOr(z.number().int().min(1900).max(2100)),
  availableAtGGLSites: todoOr(z.boolean()),
  description: localized(),
  logo: z.string().optional(),
  website: z.url().optional(),
  sourceUrls: z.array(z.url()).default([]),
});

// ---------------------------------------------------------------- Operator
export const ratingSchema = z.object({
  /** Weighted total 0–10, computed per /bewertungsmethodik/. */
  total: z.number().min(0).max(10),
  criteria: z.object({
    license: z.number().min(0).max(10),
    games: z.number().min(0).max(10),
    payments: z.number().min(0).max(10),
    protection: z.number().min(0).max(10),
    service: z.number().min(0).max(10),
  }),
  ratedAt: isoDate(),
});

export const operatorSchema = z
  .object({
    name: z.string().min(1),
    /** Marks scaffolding entries. Placeholders are never rendered publicly. */
    isPlaceholder: z.boolean().default(false),
    gglLicensed: z.boolean(),
    licenseNumber: z.string().nullable(),
    licenseHolder: todoOr(z.string()),
    gglWhitelistCheckedAt: isoDate().nullable(),
    affiliateUrl: z.url().nullable(),
    websiteUrl: todoOr(z.url()),
    bonusText: todoOr(z.string()),
    bonusTermsUrl: z.url().nullable().default(null),
    paymentMethods: z.array(z.enum(PAYMENT_METHODS)).default([]),
    slotSlugs: z.array(slug()).default([]),
    /** Short "Stark bei: …" tag, e.g. "PayPal-Auszahlung". */
    strengthTag: z.string().max(40).optional(),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    minDeposit: todoOr(z.number().nonnegative()),
    payoutSpeed: todoOr(z.string()),
    rating: ratingSchema.nullable().default(null),
    featured: z.boolean().default(false),
  })
  .superRefine((o, ctx) => {
    if (o.gglLicensed !== true) {
      if (o.affiliateUrl) {
        ctx.addIssue({ code: 'custom', message: 'Non-GGL operator must not have an affiliateUrl', path: ['affiliateUrl'] });
      }
      if (o.featured) {
        ctx.addIssue({ code: 'custom', message: 'Non-GGL operator must not be featured', path: ['featured'] });
      }
    } else {
      if (!o.licenseNumber) {
        ctx.addIssue({ code: 'custom', message: 'GGL operator needs licenseNumber', path: ['licenseNumber'] });
      }
      if (!o.gglWhitelistCheckedAt) {
        ctx.addIssue({ code: 'custom', message: 'GGL operator needs gglWhitelistCheckedAt', path: ['gglWhitelistCheckedAt'] });
      }
      if (o.isPlaceholder) {
        ctx.addIssue({ code: 'custom', message: 'A placeholder cannot be marked gglLicensed', path: ['isPlaceholder'] });
      }
    }
  });

// ---------------------------------------------------------------- Author
export const authorSchema = z.object({
  name: z.string().min(1),
  isPlaceholder: z.boolean().default(false),
  role: z.string(),
  bio: z.string(),
  expertise: z.array(z.string()).default([]),
  image: z.string().optional(),
  sameAs: z.array(z.url()).default([]),
});

// ---------------------------------------------------------------- Guide (Ratgeber)
export const guideSchema = z.object({
  title: z.string().min(5),
  metaTitle: z.string().max(60).optional(),
  description: z.string().max(155),
  author: slug(),
  published: isoDate(),
  updated: isoDate(),
  /**
   * "informational" pages may name illegal offers or "Online Casino" in a
   * neutral, explanatory way. They must not contain affiliate links.
   */
  complianceContext: z.enum(['standard', 'informational']).default('standard'),
  faq: z.array(faqItemSchema).default([]),
  relatedSlots: z.array(slug()).default([]),
  draft: z.boolean().default(false),
});

// ---------------------------------------------------------------- Glossary
export const glossarySchema = z.object({
  term: z.string().min(1),
  short: z.string().min(20).max(200),
  related: z.array(slug()).default([]),
  updated: isoDate(),
});

export type Slot = z.infer<typeof slotSchema>;
export type SlotText = z.infer<typeof slotTextSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type Operator = z.infer<typeof operatorSchema>;
export type Author = z.infer<typeof authorSchema>;
export type Guide = z.infer<typeof guideSchema>;
export type GlossaryTerm = z.infer<typeof glossarySchema>;
