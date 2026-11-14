/**
 * Compliance rules shared by components (build-time guards) and the build
 * scripts (scripts/compliance-*.ts). Plain TS: no Astro imports.
 */
import type { Operator } from '../schemas/index.ts';

export interface PhraseRule {
  id: string;
  pattern: RegExp;
  reason: string;
}

/**
 * Phrases that promote illegal offers. Allowed only on pages explicitly marked
 * as informational (e.g. a guide explaining why such offers are illegal), and
 * those pages may not contain affiliate links.
 */
export const ILLEGAL_OFFER_RULES: PhraseRule[] = [
  { id: 'ohne-oasis', pattern: /\bohne\s+(?:die\s+)?oasis/i, reason: 'Promotes play without the OASIS block file' },
  { id: 'ohne-lugas', pattern: /\bohne\s+lugas/i, reason: 'Promotes play without LUGAS' },
  { id: 'ohne-limit', pattern: /\bohne\s+(?:einzahlungs|einsatz)?-?limits?\b/i, reason: 'Promotes play without limits' },
  { id: 'ohne-5-sekunden', pattern: /\bohne\s+(?:die\s+)?5[\s-]*sekunden/i, reason: 'Promotes play without the 5-second rule' },
  { id: 'ohne-lizenz', pattern: /\bohne\s+(?:deutsche|ggl|gültige)[\s-]*lizenz/i, reason: 'Promotes unlicensed operators' },
  { id: 'curacao', pattern: /cura[cç]ao[\s-]*(?:casino|lizenz|spielothek)/i, reason: 'Promotes Curaçao-licensed operators' },
  { id: 'anjouan', pattern: /anjouan/i, reason: 'Promotes Anjouan-licensed operators' },
  { id: 'crypto', pattern: /(?:krypto|crypto|bitcoin)[\s-]*(?:casino|spielothek|slots)/i, reason: 'Promotes crypto gambling' },
  { id: 'ohne-sperrdatei', pattern: /\bohne\s+sperrdatei/i, reason: 'Promotes play without the block file' },
  { id: 'ohne-verifizierung', pattern: /\bohne\s+(?:verifizierung|kyc)/i, reason: 'Promotes play without identity checks' },
];

/** Hype and urgency wording that the tone rules forbid outside informational pages. */
export const HYPE_RULES: PhraseRule[] = [
  { id: 'jetzt-gewinnen', pattern: /jetzt\s+gewinnen/i, reason: 'Promise of winning' },
  { id: 'jetzt-loslegen', pattern: /jetzt\s+loslegen/i, reason: 'Hype CTA' },
  { id: 'mega-boni', pattern: /mega[\s-]*boni|mega[\s-]*bonus/i, reason: 'Bonus hype' },
  { id: 'pures-adrenalin', pattern: /pures\s+adrenalin/i, reason: 'Hype' },
  { id: 'non-stop', pattern: /non[\s-]*stop/i, reason: 'Encourages continuous play' },
  { id: 'spielfreiheit', pattern: /spielfreiheit/i, reason: 'Hype (implies freedom from player protection)' },
  { id: 'gewinn-garantie', pattern: /(?:garantiert|sicher)(?:e[nrs]?)?\s+gewinn/i, reason: 'Promise of winning' },
  { id: 'schnell-reich', pattern: /schnell\s+reich/i, reason: 'Promise of winning' },
  { id: 'urgency', pattern: /nur\s+(?:noch\s+)?heute|letzte\s+chance|zeitlich\s+begrenzt/i, reason: 'Urgency' },
  { id: 'bonus-code', pattern: /bonus[\s-]*code/i, reason: 'Bonus-code hype' },
];

/** "Online Casino" may only appear in neutral, informational context. */
export const CASINO_WORD_RULE: PhraseRule = {
  id: 'online-casino',
  pattern: /online[\s-]*casinos?/i,
  reason: 'Use "Online-Spielothek" for slot sites; "Online Casino" only on informational pages',
};

/**
 * Page contexts:
 * - standard: all rules apply
 * - informational: neutral explanations; only hype rules apply; no affiliate links allowed
 * - ggl-crypto: the crypto page; crypto wording allowed because only GGL-verified
 *   operators can be listed (enforced by OperatorCta + dist audit); all other rules apply
 */
export type ComplianceContext = 'standard' | 'informational' | 'ggl-crypto';
export function rulesForContext(ctx: string): PhraseRule[] {
  if (ctx === 'informational') return HYPE_RULES;
  if (ctx === 'ggl-crypto') return [...ILLEGAL_OFFER_RULES.filter((r) => r.id !== 'crypto'), ...HYPE_RULES, CASINO_WORD_RULE];
  return [...ILLEGAL_OFFER_RULES, ...HYPE_RULES, CASINO_WORD_RULE];
}

export function findPhraseViolations(text: string, rules: PhraseRule[]) {
  const hits: { rule: PhraseRule; match: string }[] = [];
  for (const rule of rules) {
    const m = text.match(rule.pattern);
    if (m) hits.push({ rule, match: m[0] });
  }
  return hits;
}

/** The only CTA labels allowed on operator / real-money links. */
export const ALLOWED_CTA_LABELS = [
  'Zum Anbieter',
  'Echtgeld-Version ansehen',
  'Mehr erfahren',
  'Testbericht lesen',
] as const;
export type CtaLabel = (typeof ALLOWED_CTA_LABELS)[number];

export const AFFILIATE_REL = 'sponsored nofollow noopener';

export class ComplianceError extends Error {
  constructor(message: string) {
    super(`[compliance] ${message}`);
    this.name = 'ComplianceError';
  }
}

/** True only for operators that may appear in any promotional placement. */
export function isPromotable(op: Pick<Operator, 'gglLicensed' | 'licenseNumber' | 'gglWhitelistCheckedAt' | 'isPlaceholder'>) {
  return op.gglLicensed === true && !!op.licenseNumber && !!op.gglWhitelistCheckedAt && !op.isPlaceholder;
}

/** Throws (failing the build) if a non-promotable operator reaches a promotional component. */
export function assertPromotable(slug: string, op: Parameters<typeof isPromotable>[0]) {
  if (!isPromotable(op)) {
    throw new ComplianceError(
      `Operator "${slug}" is not GGL-licensed/verified and must not appear in promotional placements.`,
    );
  }
}

export function assertCtaLabel(label: string): asserts label is CtaLabel {
  if (!(ALLOWED_CTA_LABELS as readonly string[]).includes(label)) {
    throw new ComplianceError(`CTA label "${label}" is not allowed. Use one of: ${ALLOWED_CTA_LABELS.join(', ')}`);
  }
}

/**
 * Returns true if `date` (Berlin local time) falls inside the window in which
 * virtual-slot advertising is not allowed (06:00–21:00).
 */
export function isAdBlockedHour(hourBerlin: number, fromHour = 6, untilHour = 21) {
  return hourBerlin >= fromHour && hourBerlin < untilHour;
}
