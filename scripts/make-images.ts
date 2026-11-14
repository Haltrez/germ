/** Regenerates raster icons and the default OG image from SVG. Run: node scripts/make-images.ts */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const icon = readFileSync('public/favicon.svg');
await sharp(icon, { density: 900 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(icon, { density: 1200 }).resize(512, 512).png().toFile('public/logo-512.png');

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
 <radialGradient id="a" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="#7b66f5" stop-opacity=".35"/><stop offset="1" stop-color="#050a1c" stop-opacity="0"/></radialGradient>
 <radialGradient id="b" cx="0%" cy="100%" r="60%"><stop offset="0" stop-color="#22d39f" stop-opacity=".28"/><stop offset="1" stop-color="#050a1c" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1200" height="630" fill="#050a1c"/><rect width="1200" height="630" fill="url(#a)"/><rect width="1200" height="630" fill="url(#b)"/>
<g transform="translate(80 90) scale(3)">${readFileSync('public/favicon.svg', 'utf8').replace(/<\/?svg[^>]*>/g, '').replaceAll('id="g"', 'id="g2"').replaceAll('url(#g)', 'url(#g2)')}</g>
<text x="80" y="330" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="76" fill="#eef1fb">Kostenlose</text>
<text x="80" y="415" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="76" fill="#4eeabb">Spielautomaten</text>
<text x="80" y="490" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#a7b1d3">Spielgeld-Demos ohne Anmeldung · nur GGL-lizenzierte Spielotheken</text>
<text x="80" y="570" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#7c88b1">18+ · Glücksspiel kann süchtig machen · check-dein-spiel.de</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og-default.png');
console.log('Images written.');
