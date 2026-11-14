/**
 * Pre-build compliance check on the data files.
 * Fails the build if:
 *  - any data file violates its Zod schema (incl. operator licence rules),
 *  - a non-GGL operator has an affiliate link, is featured, or is referenced by a slot,
 *  - a GGL whitelist check is older than COMPLIANCE.gglRecheckFailDays,
 *  - a demo URL is not on DEMO_HOST_ALLOWLIST,
 *  - operator texts or non-informational MDX contain forbidden phrases.
 */
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  slotSchema,
  providerSchema,
  operatorSchema,
  authorSchema,
  type Slot,
  type Operator,
} from '../src/schemas/index.ts';
import {
  ILLEGAL_OFFER_RULES,
  HYPE_RULES,
  CASINO_WORD_RULE,
  findPhraseViolations,
  isPromotable,
} from '../src/lib/compliance.ts';
import { COMPLIANCE, DEMO_HOST_ALLOWLIST } from '../src/config/site.ts';
import { ROOT, walk, rel, readJson, Report } from './lib.ts';

const r = new Report();
const DATA = join(ROOT, 'src/data');
const isDataFile = (p: string) => p.endsWith('.json') && !basename(p).startsWith('_');

function load<T>(dir: string, schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: { issues: { path: PropertyKey[]; message: string }[] } } }) {
  const map = new Map<string, T>();
  for (const file of walk(join(DATA, dir), isDataFile)) {
    const id = basename(file, '.json');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) r.error(`${rel(file)}: file name must be a lowercase-hyphen slug`);
    let raw: unknown;
    try {
      raw = readJson(file);
    } catch (e) {
      r.error(`${rel(file)}: invalid JSON (${(e as Error).message})`);
      continue;
    }
    const res = schema.safeParse(raw);
    if (!res.success) {
      for (const issue of res.error!.issues) r.error(`${rel(file)}: ${issue.path.join('.') || '(root)'} – ${issue.message}`);
      continue;
    }
    map.set(id, res.data as T);
  }
  return map;
}

const slots = load<Slot>('slots', slotSchema);
const providers = load('providers', providerSchema);
const operators = load<Operator>('operators', operatorSchema);
const authors = load('authors', authorSchema);
r.note(`Loaded ${slots.size} slots, ${providers.size} providers, ${operators.size} operators, ${authors.size} authors`);

// ---- Operators
const today = Date.now();
let promotable = 0;
for (const [id, op] of operators) {
  if (isPromotable(op)) promotable++;
  if (op.gglLicensed && op.gglWhitelistCheckedAt) {
    const days = Math.floor((today - Date.parse(op.gglWhitelistCheckedAt)) / 86_400_000);
    if (days > COMPLIANCE.gglRecheckFailDays) r.error(`operator ${id}: GGL whitelist last checked ${days} days ago (max ${COMPLIANCE.gglRecheckFailDays})`);
    else if (days > COMPLIANCE.gglRecheckWarnDays) r.warn(`operator ${id}: GGL whitelist last checked ${days} days ago – please re-check`);
  }
  if (!isPromotable(op) && op.affiliateUrl) r.error(`operator ${id}: has affiliateUrl but is not promotable (GGL licence unverified or placeholder)`);
  const text = [op.name, op.bonusText, op.strengthTag ?? '', ...op.pros, ...op.cons].join('\n');
  for (const hit of findPhraseViolations(text, [...ILLEGAL_OFFER_RULES, ...HYPE_RULES, CASINO_WORD_RULE])) {
    r.error(`operator ${id}: forbidden wording "${hit.match}" (${hit.rule.reason})`);
  }
  if (op.isPlaceholder) r.note(`operator ${id}: placeholder (never rendered)`);
}
r.note(`${promotable} operator(s) are GGL-verified and promotable`);

// ---- Slots
for (const [id, s] of slots) {
  if (!providers.has(s.provider)) r.error(`slot ${id}: unknown provider "${s.provider}"`);
  for (const opSlug of s.gglOperatorSlugs) {
    const op = operators.get(opSlug);
    if (!op) r.error(`slot ${id}: unknown operator "${opSlug}"`);
    else if (!isPromotable(op)) r.error(`slot ${id}: lists operator "${opSlug}" which is not GGL-verified`);
  }
  if (s.demoUrl) {
    const host = new URL(s.demoUrl).hostname;
    if (!DEMO_HOST_ALLOWLIST.includes(host)) {
      r.error(`slot ${id}: demo host "${host}" is not on DEMO_HOST_ALLOWLIST (src/config/site.ts)`);
    }
  }
  if (s.sourceUrls.length === 0) r.warn(`slot ${id}: no sourceUrls (official game sheet) recorded`);
  const todos = Object.entries(s).filter(([, v]) => v === 'TODO').map(([k]) => k);
  if (todos.length) r.warn(`slot ${id}: unverified fields → ${todos.join(', ')}`);
}
for (const [id, op] of operators) {
  if (!isPromotable(op)) continue;
  for (const slotSlug of op.slotSlugs) {
    const s = slots.get(slotSlug);
    if (s && s.availableInDE !== true) r.error(`operator ${id}: lists slot "${slotSlug}" which is not confirmed availableInDE`);
  }
}

// ---- MDX / Markdown content: phrase lint unless marked informational
for (const file of walk(join(ROOT, 'src/content'), (p) => /\.mdx?$/.test(p))) {
  const src = readFileSync(file, 'utf8');
  const informational = /^complianceContext:\s*['"]?informational/m.test(src);
  const rules = informational ? HYPE_RULES : [...ILLEGAL_OFFER_RULES, ...HYPE_RULES, CASINO_WORD_RULE];
  for (const hit of findPhraseViolations(src, rules)) {
    r.error(`${rel(file)}: forbidden wording "${hit.match}" (${hit.rule.reason})`);
  }
}

r.print('Compliance: data');
