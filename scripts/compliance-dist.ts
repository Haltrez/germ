/**
 * Post-build audit of every generated HTML page in dist/.
 * Compliance (errors):
 *  - responsible-gambling notice: 18+, "Glücksspiel kann süchtig machen",
 *    helpline phone + check-dein-spiel.de link, link to /verantwortungsvoll-spielen/
 *  - illegal-offer phrases, hype wording and "Online Casino" only on informational pages
 *  - informational pages contain no affiliate links
 *  - every affiliate link: rel contains sponsored + nofollow, points to a GGL-verified
 *    operator's affiliateUrl, and the page contains an affiliate disclosure
 *  - time-restricted ad units are hidden in static HTML
 * SEO basics (errors): lang="de", one <h1>, title ≤ 60, description ≤ 155,
 *  canonical with trailing slash, unique titles, internal links resolve,
 *  noindex pages absent from the sitemap.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import { operatorSchema, type Operator } from '../src/schemas/index.ts';
import {
  ILLEGAL_OFFER_RULES,
  HYPE_RULES,
  CASINO_WORD_RULE,
  findPhraseViolations,
  isPromotable,
  rulesForContext,
} from '../src/lib/compliance.ts';
import { ADS, RG, SITE_URL } from '../src/config/site.ts';
import { ROOT, walk, readJson, Report } from './lib.ts';

const r = new Report();
const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) {
  console.error('dist/ not found – run astro build first');
  process.exit(1);
}

// Licensed operators' affiliate URLs
const allowedAffiliateUrls = new Set<string>();
for (const file of walk(join(ROOT, 'src/data/operators'), (p) => p.endsWith('.json') && !basename(p).startsWith('_'))) {
  const res = operatorSchema.safeParse(readJson(file));
  if (res.success && isPromotable(res.data as Operator) && res.data.affiliateUrl) allowedAffiliateUrls.add(res.data.affiliateUrl);
}

const pages = walk(DIST, (p) => p.endsWith('.html'));
const urlPathOf = (file: string) => {
  const p = file.slice(DIST.length).replace(/index\.html$/, '').replace(/\.html$/, '/');
  return p || '/';
};
const titles = new Map<string, string[]>();
let todoPages = 0;

const sitemapUrls = new Set<string>();
for (const sm of walk(DIST, (p) => /sitemap-\d+\.xml$/.test(p))) {
  for (const m of readFileSync(sm, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(new URL(m[1]).pathname);
}

const textOf = (root: HTMLElement) => {
  const clone = parse(root.toString());
  clone.querySelectorAll('script, style, noscript').forEach((n) => n.remove());
  // Navigation links to the GGL-only crypto page are allowed site-wide (the page itself lists only GGL operators).
  clone.querySelectorAll('a[href="/krypto-spielotheken/"]').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ');
};

for (const file of pages) {
  const path = urlPathOf(file);
  const is404 = path === '/404/';
  const html = readFileSync(file, 'utf8');
  const doc = parse(html);
  const where = path;

  // --- language & head
  if (doc.querySelector('html')?.getAttribute('lang') !== 'de') r.error(`${where}: <html lang="de"> missing`);
  const title = doc.querySelector('title')?.textContent.trim() ?? '';
  if (!title) r.error(`${where}: missing <title>`);
  else if ([...title].length > 60) r.error(`${where}: title is ${[...title].length} chars (>60): "${title}"`);
  titles.set(title, [...(titles.get(title) ?? []), path]);
  const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  if (!desc) r.error(`${where}: missing meta description`);
  else if ([...desc].length > 155) r.error(`${where}: description is ${[...desc].length} chars (>155)`);
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
  if (!is404 && (!canonical.startsWith(SITE_URL) || !canonical.endsWith('/'))) r.error(`${where}: bad canonical "${canonical}"`);
  const h1s = doc.querySelectorAll('h1').length;
  if (h1s !== 1) r.error(`${where}: expected exactly one <h1>, found ${h1s}`);
  const noindex = /noindex/.test(doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '');
  if (noindex && sitemapUrls.has(path)) r.error(`${where}: noindex page is listed in the sitemap`);
  if (!noindex && !is404 && sitemapUrls.size && !sitemapUrls.has(path)) r.warn(`${where}: indexable page missing from sitemap`);

  // --- responsible gambling notice
  const body = doc.querySelector('body')!;
  const text = textOf(body);
  if (!new RegExp(`${RG.minAge}\\s*Jahren|${RG.minAge}\\+`).test(text)) r.error(`${where}: 18+ notice missing`);
  if (!/Glücksspiel kann süchtig machen/.test(text)) r.error(`${where}: "Glücksspiel kann süchtig machen" missing`);
  if (!text.includes(RG.helplinePhone)) r.error(`${where}: helpline phone ${RG.helplinePhone} missing`);
  const links = body.querySelectorAll('a[href]');
  if (!links.some((a) => (a.getAttribute('href') ?? '').startsWith(RG.helplineUrl))) r.error(`${where}: link to ${RG.helplineUrl} missing`);
  if (!links.some((a) => a.getAttribute('href') === RG.rgPagePath)) r.error(`${where}: link to ${RG.rgPagePath} missing`);

  // --- wording
  const context = doc.querySelector('meta[name="compliance-context"]')?.getAttribute('content') ?? 'standard';
  const informational = context === 'informational';
  const rules = rulesForContext(context);
  const titleAndMeta = `${title} ${desc}`;
  for (const hit of findPhraseViolations(`${titleAndMeta} ${text}`, rules)) {
    r.error(`${where}: forbidden wording "${hit.match}" – ${hit.rule.reason}`);
  }
  // Even on informational pages, titles/descriptions must never target illegal-offer keywords.
  for (const hit of findPhraseViolations(titleAndMeta, ILLEGAL_OFFER_RULES.filter((x) => context !== 'ggl-crypto' || x.id !== 'crypto'))) {
    r.error(`${where}: title/description targets "${hit.match}"`);
  }

  // --- affiliate links
  const affiliateLinks = links.filter((a) => /\bsponsored\b/.test(a.getAttribute('rel') ?? '') || a.hasAttribute('data-affiliate'));
  if (affiliateLinks.length) {
    if (informational) r.error(`${where}: informational page contains ${affiliateLinks.length} affiliate link(s)`);
    if (!body.querySelector('[data-affiliate-disclosure]')) r.error(`${where}: affiliate links without disclosure`);
    for (const a of affiliateLinks) {
      const relAttr = a.getAttribute('rel') ?? '';
      const href = a.getAttribute('href') ?? '';
      if (!/\bsponsored\b/.test(relAttr) || !/\bnofollow\b/.test(relAttr)) r.error(`${where}: affiliate link ${href} lacks rel="sponsored nofollow"`);
      if (!allowedAffiliateUrls.has(href)) r.error(`${where}: affiliate link ${href} does not belong to a GGL-verified operator`);
    }
  }
  for (const a of links) {
    const href = a.getAttribute('href') ?? '';
    if (allowedAffiliateUrls.has(href) && !/\bsponsored\b/.test(a.getAttribute('rel') ?? '')) {
      r.error(`${where}: operator link ${href} is not marked rel="sponsored"`);
    }
  }

  // --- time-restricted ads
  if (ADS.virtualSlotAdsNightOnly) {
    for (const ad of body.querySelectorAll('[data-ad-unit="virtual-slot"]')) {
      if (!ad.hasAttribute('hidden')) r.error(`${where}: virtual-slot ad unit not hidden by default`);
    }
  }

  // --- internal links
  for (const a of links) {
    const href = a.getAttribute('href') ?? '';
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const clean = href.split(/[?#]/)[0];
    if (!clean) continue;
    const target = clean.endsWith('/') ? join(DIST, clean, 'index.html') : join(DIST, clean);
    if (!existsSync(target)) r.error(`${where}: broken internal link ${href}`);
    else if (!clean.endsWith('/') && !/\.[a-z0-9]+$/i.test(clean)) r.error(`${where}: internal link without trailing slash ${href}`);
  }

  if (/\bTODO\b/.test(text)) todoPages++;
}

for (const [t, ps] of titles) if (ps.length > 1) r.error(`duplicate <title> "${t}" on ${ps.join(', ')}`);
if (todoPages) r.warn(`${todoPages} page(s) still show visible TODO placeholders (expected before launch)`);
r.note(`Audited ${pages.length} HTML pages, ${sitemapUrls.size} sitemap URLs, ${allowedAffiliateUrls.size} allowed affiliate URLs`);
r.print('Compliance: built pages');
