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

const VOL: Record<string, [string, string]> = {
  low: ['Niedrig', 'bg-mint-400/90 text-[#03241a]'],
  medium: ['Mittel', 'bg-[#7aa2ff] text-[#071433]'],
  high: ['Hoch', 'bg-gold-400 text-[#241600]'],
  'very-high': ['Sehr hoch', 'bg-coral-400 text-[#2a0705]'],
};
const pct = (n: number) => `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

export function cardHtml(r: LobbyRec, eager = false): string {
  const href = `/spielautomaten/${r.s}/`;
  let media: string;
  if (r.t) {
    media = `<img src="${r.t}" alt="${esc(r.n)} Spielautomat" loading="${eager ? 'eager' : 'lazy'}" decoding="async" width="480" height="360" class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]">`;
  } else {
    let h = 0;
    for (const ch of r.s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b] = palettes[h % palettes.length];
    media = `<span class="absolute inset-0 flex items-center justify-center p-3 text-center font-display text-2xl uppercase leading-none text-white/95" style="background:linear-gradient(150deg,${a}e6,${b})">${esc(r.n)}</span>`;
  }
  const vol = r.v && VOL[r.v] ? `<span class="absolute right-2 top-2 rounded-md px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide ${VOL[r.v][1]}">${VOL[r.v][0]}</span>` : '';
  const facts = [r.r !== null ? `RTP ${pct(r.r)}` : '', r.m !== null ? `Max ${r.m.toLocaleString('de-DE')}x` : ''].filter(Boolean).join(' · ');
  return `<article class="group min-w-0">
  <a href="${href}" class="relative block aspect-[4/3] overflow-hidden rounded-xl border border-line bg-ink-900 shadow-[0_10px_30px_-15px_rgb(0_0_0/0.8)] transition group-hover:border-gold-400/70" aria-label="${esc(r.n)} kostenlos spielen">
    ${media}
    ${r.x ? '<span class="absolute left-2 top-2 rounded-md bg-ink-950/85 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-gold-300">Im Test</span>' : ''}
    ${vol}
    <span class="absolute inset-0 flex items-center justify-center bg-ink-950/55 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
      <span class="flex items-center gap-2 rounded-full bg-gold-400 px-4 py-2 text-sm font-bold text-[#241600] shadow-lg"><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z" fill="currentColor"/></svg>${r.d ? 'Demo spielen' : 'Zum Slot'}</span>
    </span>
  </a>
  <h3 class="mt-2 truncate font-title text-[0.95rem] font-bold leading-tight text-fg"><a href="${href}" class="hover:text-gold-300">${esc(r.n)}</a></h3>
  <p class="truncate text-xs text-subtle">${esc(r.p)}${facts ? ` · ${facts}` : ''}</p>
</article>`;
}
