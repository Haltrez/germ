/**
 * Download official game images (thumbSource) and store them as small WebP files
 * in public/thumbs/<slug>.webp, then link them in the slot JSON.
 * Usage: node scripts/import/thumbs.mjs   (skips images that already exist)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = new URL('../../', import.meta.url).pathname;
const dataDir = join(root, 'src/data/slots');
const outDir = join(root, 'public/thumbs');
mkdirSync(outDir, { recursive: true });

const jobs = readdirSync(dataDir)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => ({ f, d: JSON.parse(readFileSync(join(dataDir, f), 'utf8')) }))
  .filter(({ d }) => d.thumbSource);

const byHost = new Map();
for (const j of jobs) {
  const h = new URL(j.d.thumbSource).hostname;
  byHost.set(h, [...(byHost.get(h) ?? []), j]);
}
let ok = 0, fail = 0;
await Promise.all([...byHost.values()].map(async (list) => {
  for (const { f, d } of list) {
    const slug = f.replace(/\.json$/, '');
    const out = join(outDir, `${slug}.webp`);
    try {
      if (!existsSync(out)) {
        const res = await fetch(d.thumbSource, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; slot-thumbs/1.0)' } });
        if (!res.ok) throw new Error(String(res.status));
        const buf = Buffer.from(await res.arrayBuffer());
        await sharp(buf).resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
        await new Promise((r) => setTimeout(r, 500));
      }
      d.thumbnail = { src: `/thumbs/${slug}.webp`, alt: `${d.name} Spielautomat` };
      writeFileSync(join(dataDir, f), JSON.stringify(d, null, 2) + '\n');
      ok++;
    } catch (e) {
      fail++;
    }
  }
}));
console.log(`thumbs: ${ok} ok, ${fail} failed`);
