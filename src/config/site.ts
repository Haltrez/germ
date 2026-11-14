/**
 * Central site configuration. Change the domain or brand name here only.
 * This file must stay importable from plain Node (no Astro imports) because
 * astro.config.mjs and the compliance scripts read it too.
 */

/** Bare domain, no protocol, no trailing slash. */
export const SITE_DOMAIN = 'kostenlosespielautomaten.de';

/** Brand / display name used in logo, header and schema.org data. */
export const SITE_NAME = 'KostenloseSpielautomaten';

export const SITE_URL = `https://${SITE_DOMAIN}`;

export const SITE_LOCALE = 'de' as const;
export const SITE_OG_LOCALE = 'de_DE';
export const SITE_TIMEZONE = 'Europe/Berlin';

/** Default social preview image (in /public). */
export const DEFAULT_OG_IMAGE = '/og-default.png';

/**
 * Company details for Impressum / schema. All TODO until the owner fills them in.
 * Pages render these placeholders visibly so they cannot go live unnoticed.
 */
export const COMPANY = {
  legalName: 'TODO: Firmenname inkl. Rechtsform',
  representative: 'TODO: Vertretungsberechtigte Person',
  street: 'TODO: Straße und Hausnummer',
  postalCode: 'TODO: PLZ',
  city: 'TODO: Ort',
  country: 'Deutschland',
  email: 'TODO: kontakt@kostenlosespielautomaten.de',
  phone: 'TODO: Telefonnummer',
  registerCourt: 'TODO: Registergericht',
  registerNumber: 'TODO: Handelsregisternummer',
  vatId: 'TODO: USt-IdNr. nach § 27a UStG',
  editorialResponsible: 'TODO: Verantwortliche Person nach § 18 Abs. 2 MStV (Name, Anschrift)',
  hostingProvider: 'TODO: Hosting-Anbieter (z. B. Cloudflare, Netlify oder Vercel) inkl. Anschrift',
} as const;

/** Responsible-gambling help resources shown on every page. */
export const RG = {
  minAge: 18,
  helplineName: 'BIÖG (ehemals BZgA) – Beratungstelefon zur Glücksspielsucht',
  helplinePhone: '0800 1 37 27 00',
  helplinePhoneHref: 'tel:+498001372700',
  helplineUrl: 'https://www.check-dein-spiel.de/',
  helplineUrlLabel: 'check-dein-spiel.de',
  rgPagePath: '/verantwortungsvoll-spielen/',
} as const;

/**
 * Advertising rules.
 * GlüStV 2021 § 5 Abs. 3: advertising for virtual slot machines on the internet
 * is not allowed between 06:00 and 21:00. Banner-style ad units (component
 * <AdSlot kind="virtual-slot">) are rendered `hidden` and only revealed by a
 * small client script outside that window, Europe/Berlin time. Editorial
 * content and comparison tables are not affected.
 */
export const ADS = {
  /** Master switch: no ad network is integrated yet. */
  enabled: false,
  /** When true, virtual-slot ad units are only visible 21:00–06:00 Berlin time. */
  virtualSlotAdsNightOnly: true,
  blockedFromHour: 6,
  blockedUntilHour: 21,
} as const;

/** Compliance thresholds used by the build scripts. */
export const COMPLIANCE = {
  /** Warn when an operator's GGL whitelist check is older than this. */
  gglRecheckWarnDays: 30,
  /** Fail the build when it is older than this. */
  gglRecheckFailDays: 90,
  /** German limits for virtual slot machines (GlüStV 2021 § 22a). */
  maxStakePerSpinEur: 1,
  minSecondsPerSpin: 5,
  maxSpinsPerMinute: 12,
  lugasDefaultMonthlyDepositLimitEur: 1000,
} as const;

/**
 * Hosts allowed as demo iframe sources. Only official provider demo servers or
 * a licensed demo aggregator with a written agreement. Empty until the owner
 * confirms sources; the build fails if a slot uses any other host.
 */
export const DEMO_HOST_ALLOWLIST: readonly string[] = [
  // Official public demo servers. Owner confirmed on 2026-11-14 that embedding is allowed.
  'demogamesfree.pragmaticplay.net',
  // Official public demo server of BGaming (linked from bgaming.com game pages).
  'demo.bgaming-network.com',
  // Play'n GO official demo launcher (linked from playngo.com game pages).
  'released.playngonetwork.com',
  // NetEnt official demo pages.
  'netent.com',
  // Hacksaw Gaming official demo server (build version resolved on click via version.json).
  'static-live.hacksawgaming.com',
];

/** Analytics: none installed. Anything added here must only load after consent. */
export const ANALYTICS = {
  provider: null as null | 'plausible' | 'matomo',
} as const;
