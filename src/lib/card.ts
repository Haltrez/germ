/** Game tile markup shared by server render (set:html) and the client-side lobby. */
export interface LobbyRec {
  s: string; // slug
  n: string; // name
  p: string; // provider name
  ps: string; // provider slug
  r: number | null; // max RTP
  v: string | null; // volatility code
  m: number | null; // max win
  c: string[]; // categories
  d: boolean; // has demo
  t: string | null; // thumbnail src
  x: boolean; // reviewed
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const palettes = [['#22d39f', '#16275a'], ['#7b66f5', '#0f1d40'], ['#e8a93a', '#2a1a4a'], ['#ff8a80', '#1b1440'], ['#4eeabb', '#2b1d6b'], ['#9d8cff', '#0b2a3a'], ['#f6cd68', '#0f2f4a'], ['#38bdf8', '#1e1b4b']];

export function cardHtml(r: LobbyRec, eager = false): string {
  const href = `/spielautomaten/${r.s}/`;
  let media: string;
  if (r.t) {
    const load = eager ? 'eager' : 'lazy';
    media = `<img src="${r.t}" alt="" aria-hidden="true" loading="${load}" decoding="async" class="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-xl">`
      + `<img src="${r.t}" alt="${esc(r.n)} Spielautomat" loading="${load}" decoding="async" width="270" height="360" class="relative h-full w-full object-contain p-1.5 transition duration-300 group-hover:scale-[1.04]">`;
  } else {
    let h = 0;
    for (const ch of r.s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b] = palettes[h % palettes.length];
    const ini = r.n.replace(/[^A-Za-zÄÖÜäöü0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    media = `<span class="absolute inset-0" style="background:linear-gradient(150deg,${a}e6,${b})"></span><span class="absolute bottom-3 left-3 font-display text-5xl text-white/95">${esc(ini)}</span>`;
  }
  return `<article class="group min-w-0">
  <a href="${href}" class="relative block aspect-[3/4] overflow-hidden rounded-xl border border-line bg-ink-900 transition group-hover:border-gold-400/70" aria-label="${esc(r.n)} kostenlos spielen">
    ${media}
    ${r.x ? '<span class="absolute left-2 top-2 rounded-md bg-ink-950/85 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-gold-300">Im Test</span>' : ''}
    <span class="absolute inset-x-2 bottom-2 hidden justify-center rounded-lg bg-gold-400 py-2 text-sm font-bold text-[#241600] shadow-lg group-hover:flex group-focus-within:flex">Demo spielen</span>
  </a>
  <h3 class="mt-2 font-title text-[0.95rem] font-bold leading-tight text-fg"><a href="${href}" class="block py-0.5 hover:text-gold-300">${esc(r.n)}</a></h3>
  <p class="text-xs text-subtle">${esc(r.p)}</p>
</article>`;
}
