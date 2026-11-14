/**
 * Build-time indexing decisions that depend on data files (read via fs so
 * astro.config.mjs can use them for the sitemap filter).
 * A slot page is indexable only when an original German review exists at
 * src/content/slot-texts/de/<slug>.mdx. Data-only pages are noindex (no doorway pages).
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const list = (dir: string, ext: RegExp) => {
  try {
    return readdirSync(join(root, dir)).filter((f) => ext.test(f) && !f.startsWith('_')).map((f) => f.replace(ext, ''));
  } catch {
    return [];
  }
};

/** All slot pages carry a review (hand-written or data-driven), so none are noindex. */
export function noindexSlotPaths(): Set<string> {
  return new Set();
}

export const hasReview = (slug: string) =>
  existsSync(join(root, 'src/content/slot-texts/de', `${slug}.mdx`)) || existsSync(join(root, 'src/content/slot-texts/de', `${slug}.md`));
