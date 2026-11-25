/**
 * IndexNow: tells Bing (and the engines that share its feed) about new pages.
 * Runs at the end of the production build. A page is submitted one deploy after it went live,
 * so the engine never gets a URL that is not reachable yet. Never fails the build.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const HOST = 'kostenlosespielautomaten.de';
const KEY = '4850ef99132974d2a692a30a57883598';
const urlsOf = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

try {
  if (!existsSync('dist/sitemap-0.xml')) process.exit(0);
  const built = urlsOf(readFileSync('dist/sitemap-0.xml', 'utf8'));
  let submitted = null; // URLs already sent, published by the previous deploy
  let live = [];        // URLs that are reachable right now (previous deploy)
  if (process.env.VERCEL_ENV === 'production') {
    const get = async (p) => { const r = await fetch(`https://${HOST}${p}`, { signal: AbortSignal.timeout(15000) }); return r.ok ? r.text() : null; };
    const s = await get('/indexnow.json'); if (s) submitted = JSON.parse(s).urls;
    const l = await get('/sitemap-0.xml'); if (l) live = urlsOf(l);
    const known = new Set(submitted ?? []);
    const fresh = live.filter((u) => !known.has(u)).slice(0, 10000);
    if (fresh.length) {
      const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: fresh }), signal: AbortSignal.timeout(20000) });
      console.log(`[indexnow] submitted ${fresh.length} URL(s), status ${r.status}`);
      if (r.status >= 400) live = submitted ?? []; // try again next deploy
    } else console.log('[indexnow] nothing new');
  }
  // What counts as "already sent" for the next deploy: everything that was live now. Outside production: the built list, so previews change nothing.
  writeFileSync('dist/indexnow.json', JSON.stringify({ urls: process.env.VERCEL_ENV === 'production' ? live : built }));
} catch (e) { console.log('[indexnow] skipped:', e?.message ?? e); }
