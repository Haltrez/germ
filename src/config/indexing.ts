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

export function noindexSlotPaths(): Set<string> {
  const reviewed = new Set(list('src/content/slot-texts/de', /\.mdx?$/));
  return new Set(list('src/data/slots', /\.json$/).filter((s) => !reviewed.has(s)).map((s) => `/spielautomaten/${s}/`));
}

export const hasReview = (slug: string) =>
  existsSync(join(root, 'src/content/slot-texts/de', `${slug}.mdx`)) || existsSync(join(root, 'src/content/slot-texts/de', `${slug}.md`));
