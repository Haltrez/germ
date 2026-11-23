/**
 * Build-time indexing decisions that depend on data files (read via fs so
 * astro.config.mjs can use them for the sitemap filter).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const list = (dir: string, ext: RegExp) => {
  try {
    return readdirSync(join(root, dir)).filter((f) => ext.test(f) && !f.startsWith('_')).map((f) => f.replace(ext, ''));
  } catch {
    return [];
  }
};

export const hasReview = (slug: string) =>
  existsSync(join(root, 'src/content/slot-texts/de', `${slug}.mdx`)) || existsSync(join(root, 'src/content/slot-texts/de', `${slug}.md`));

/** True when the slot's data file has a playable demo. */
const hasDemo = (slug: string) => {
  try {
    const d = JSON.parse(readFileSync(join(root, 'src/data/slots', `${slug}.json`), 'utf8'));
    return typeof d.demoUrl === 'string' && d.demoUrl !== 'TODO' && d.demoUrl !== '';
  } catch {
    return false;
  }
};

/**
 * A slot page is indexable when it offers something of its own: a hand-written review or a playable demo.
 * Pages with neither stay on the site for visitors but are noindex and left out of the sitemap,
 * so search engines spend their visits on the stronger pages. They become indexable automatically
 * as soon as a review or a demo is added.
 */
export const slotIndexable = (slug: string) => hasReview(slug) || hasDemo(slug);

export function noindexSlotPaths(): Set<string> {
  return new Set(list('src/data/slots', /\.json$/).filter((s) => !slotIndexable(s)).map((s) => `/spielautomaten/${s}/`));
}
