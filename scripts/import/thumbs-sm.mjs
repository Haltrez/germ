/**
 * Creates the 240×180 variants in public/thumbs/sm used by the card srcset.
 * Run after thumbs.mjs: node scripts/import/thumbs-sm.mjs
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
const dir = 'public/thumbs';
mkdirSync(`${dir}/sm`, { recursive: true });
const files = readdirSync(dir).filter((f) => f.endsWith('.webp') && (process.argv.includes('--force') || !existsSync(`${dir}/sm/${f}`)));
for (let i = 0; i < files.length; i += 24) {
  await Promise.all(files.slice(i, i + 24).map((f) => sharp(`${dir}/${f}`).resize(240, 180).webp({ quality: 72 }).toFile(`${dir}/sm/${f}`)));
}
console.log(`${files.length} small thumbnails written`);
