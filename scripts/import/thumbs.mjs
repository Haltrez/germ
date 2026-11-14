/**
 * Build 4:3 game thumbnails (480x360 WebP, full-bleed) from official provider images.
 * If a slot has thumbLogo, the logo is composited centered over the background.
 * Usage: node scripts/import/thumbs.mjs [--force]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const W = 480, H = 360;
const force = process.argv.includes('--force');
const root = new URL('../../', import.meta.url).pathname;
const dataDir = join(root, 'src/data/slots');
const outDir = join(root, 'public/thumbs');
mkdirSync(outDir, { recursive: true });

const get = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; slot-thumbs/2.0)' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
};

/** Near-4:3 images are cropped; others are shown whole over a blurred fill (keeps titles visible). */
async function render(buf) {
  const meta = await sharp(buf).metadata();
  const ratio = (meta.width ?? W) / (meta.height ?? H);
  if (ratio > 1.2 && ratio < 1.5) return sharp(buf).resize(W, H, { fit: 'cover', position: 'centre' });
  const bg = await sharp(buf).resize(W, H, { fit: 'cover' }).blur(18).modulate({ brightness: 0.6 }).png().toBuffer();
  const fg = await sharp(buf).resize(W, H, { fit: 'inside' }).png().toBuffer();
  return sharp(await sharp(bg).composite([{ input: fg, gravity: 'center' }]).png().toBuffer());
}

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
await Promise.all([...byHost.values()].flatMap((list) => {
  // two workers per host
  const half = Math.ceil(list.length / 2);
  return [list.slice(0, half), list.slice(half)].map(async (part) => {
    for (const { f } of part) {
      const slug = f.replace(/\.json$/, '');
      const out = join(outDir, `${slug}.webp`);
      try {
        const d = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
        if (force || !existsSync(out)) {
          let img = d.thumbLogo
            ? sharp(await get(d.thumbSource)).resize(W, H, { fit: 'cover', position: 'centre' })
            : await render(await get(d.thumbSource));
          if (d.thumbLogo) {
            const logo = await sharp(await get(d.thumbLogo)).resize(Math.round(W * 0.82), Math.round(H * 0.62), { fit: 'inside' }).png().toBuffer();
            img = sharp(await img.png().toBuffer()).composite([{ input: logo, gravity: 'center' }]);
          }
          await img.webp({ quality: 74 }).toFile(out);
          await new Promise((r) => setTimeout(r, 250));
        }
        d.thumbnail = { src: `/thumbs/${slug}.webp`, alt: `${d.name} Spielautomat` };
        writeFileSync(join(dataDir, f), JSON.stringify(d, null, 2) + '\n');
        ok++;
      } catch {
        fail++;
      }
    }
  });
}));
console.log(`thumbs: ${ok} ok, ${fail} failed`);
