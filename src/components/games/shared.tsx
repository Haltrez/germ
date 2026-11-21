/** Shared pieces for the free table games: cards, chips, bankroll, dealer, sounds, coach panel. */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

export interface Card { r: number; s: number } // r: 2..14 (11 J, 12 Q, 13 K, 14 A), s: 0♠ 1♥ 2♦ 3♣
const SUITS = ['♠', '♥', '♦', '♣'];
export const rankLabel = (r: number) => (r <= 10 ? String(r) : { 11: 'B', 12: 'D', 13: 'K', 14: 'A' }[r]!);

/** Unbiased random integer in [0, n) from the browser's crypto source. */
export function rnd(n: number) {
  const max = Math.floor(0xffffffff / n) * n;
  const buf = new Uint32Array(1);
  let x: number;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= max);
  return x % n;
}
export function newShoe(decks = 1): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d++) for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) cards.push({ r, s });
  for (let i = cards.length - 1; i > 0; i--) { const j = rnd(i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}

/* ---------- Sound (synthesised, no files) ---------- */
let ctx: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem('ksa-tg-mute') === '1'; } catch { /* ignore */ }
function ac() { if (muted) return null; try { ctx ??= new AudioContext(); if (ctx.state === 'suspended') void ctx.resume(); return ctx; } catch { return null; } }
function tone(f: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const c = ac(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, c.currentTime + at); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  o.connect(g).connect(c.destination); o.start(c.currentTime + at); o.stop(c.currentTime + at + dur + 0.02);
}
function noise(at: number, dur: number, hp: number, vol = 0.18) {
  const c = ac(); if (!c) return; const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + at);
}
export const sfx = {
  card: (at = 0) => noise(at, 0.07, 2500, 0.16),
  chip: () => { tone(2600, 0, 0.05, 'triangle', 0.1); tone(3400, 0.03, 0.05, 'triangle', 0.08); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.13)),
  big: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.08, 0.4, 'triangle', 0.14)),
  lose: () => { tone(220, 0, 0.25, 'sine', 0.1); tone(165, 0.14, 0.35, 'sine', 0.1); },
  dice: () => { for (let i = 0; i < 7; i++) noise(i * 0.11 + Math.random() * 0.03, 0.05, 1200, 0.22); },
  spin: () => { for (let i = 0; i < 34; i++) tone(1900, 0.06 * i + 0.0035 * i * i, 0.02, 'square', 0.035); },
  isMuted: () => muted,
  toggle: () => { muted = !muted; try { localStorage.setItem('ksa-tg-mute', muted ? '1' : '0'); } catch { /* ignore */ } return muted; },
};

/* ---------- Cards ---------- */
export function CardView({ card, down = false, small = false, win = false, i = 0 }: { card: Card; down?: boolean; small?: boolean; win?: boolean; i?: number }) {
  const red = card.s === 1 || card.s === 2;
  const court = card.r >= 11 && card.r <= 13;
  const suit = SUITS[card.s];
  useEffect(() => { sfx.card(i * 0.09); const t = setTimeout(() => window.dispatchEvent(new Event('ksa:card')), i * 90); return () => clearTimeout(t); }, []);
  return (
    <div class={`tg-card${down ? ' down' : ''}${small ? ' sm' : ''}${win ? ' win' : ''}`} style={{ animationDelay: `${i * 90}ms` }}>
      <div class="tg-card-in">
        <div class={`tg-face${red ? ' red' : ''}${court ? ' court' : ''}`}>
          <div class="ix">{rankLabel(card.r)}<span>{suit}</span></div>
          <div class="pip">{court ? <><i>{suit}</i><b>{{ 11: '♞', 12: '♛', 13: '♚' }[card.r]}</b><i>{suit}</i></> : card.r === 14 ? <span class="ace">{suit}</span> : suit}</div>
          <div class="ix b">{rankLabel(card.r)}<span>{suit}</span></div>
        </div>
        <div class="tg-back" />
      </div>
    </div>
  );
}

/* ---------- Chips and money ---------- */
export const CHIPS = [1, 5, 25, 100];
export function ChipRack({ value, onPick }: { value: number; onPick: (v: number) => void }) {
  return (
    <div class="tg-rack" role="group" aria-label="Jeton wählen">
      {CHIPS.map((v) => <button type="button" class={`tg-chip${v === value ? ' sel' : ''}`} data-v={v} aria-label={`Jeton ${v} Euro`} aria-pressed={v === value} onClick={() => { sfx.chip(); onPick(v); }} />)}
    </div>
  );
}
/** A small stack of chips representing an amount. */
export function ChipStack({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  const out: number[] = [];
  let rest = Math.floor(amount);
  for (const v of [100, 25, 5, 1]) while (rest >= v && out.length < 6) { out.push(v); rest -= v; }
  return <span class="tg-stack">{out.reverse().map((v) => <span class="tg-chip mini" data-v={v} />)}<em>{fmt(amount)}</em></span>;
}
/** Demo money, formatted in euros. */
export const fmt = (n: number) => `${n.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €`;

/** Demo bankroll of 1.000 € per game, kept per browser. */
export function useBank(game: string, start = 1000) {
  const key = `ksa-tg-bank-${game}`;
  const [bank, setBank] = useState(start);
  const ref = useRef(start);
  const set = (v: number) => { const x = Math.round(v * 100) / 100; ref.current = x; setBank(x); try { localStorage.setItem(key, String(x)); } catch { /* ignore */ } };
  useEffect(() => { try { const v = Number(localStorage.getItem(key)); if (v > 0) { ref.current = v; setBank(v); } } catch { /* ignore */ } }, []);
  return { bank, set, add: (d: number) => set(ref.current + d), reset: () => set(start), now: () => ref.current };
}

/**
 * Tracks how often the player follows the textbook move and tells the page
 * when someone has played a solid session, so it can show the real-money hint.
 */
export function useBook(game: string) {
  const [stat, setStat] = useState({ ok: 0, all: 0, rounds: 0 });
  const [last, setLast] = useState<null | { ok: boolean; text: string }>(null);
  const judge = (ok: boolean, text: string) => { setStat((s) => ({ ...s, ok: s.ok + (ok ? 1 : 0), all: s.all + 1 })); setLast({ ok, text }); };
  const round = () => setStat((s) => {
    const n = { ...s, rounds: s.rounds + 1 };
    const pct = n.all ? n.ok / n.all : 0;
    if (n.rounds >= 8 && n.rounds % 8 === 0 && n.all >= 6 && pct >= 0.8) window.dispatchEvent(new CustomEvent('ksa:goodplay', { detail: { game, pct: Math.round(pct * 100) } }));
    return n;
  });
  return { stat, last, judge, round, pct: stat.all ? Math.round((stat.ok / stat.all) * 100) : null };
}

export function Coach({ on, setOn, tip, book }: { on: boolean; setOn: (v: boolean) => void; tip: ComponentChildren; book: ReturnType<typeof useBook> }) {
  return (
    <aside class="tg-coach" aria-live="polite">
      <div class="row">
        <h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" /><path d="M4 21a2 2 0 0 1 2-2h13v2H6" /><path d="M9 8h6M9 12h4" /></svg>Buch-Tipp</h4>
        <label class="tg-switch"><input type="checkbox" checked={on} onChange={(e) => setOn((e.target as HTMLInputElement).checked)} />Tipps anzeigen</label>
      </div>
      {on && <p>{tip}</p>}
      <div class="row">
        {book.last ? <span class={`tg-verdict ${book.last.ok ? 'ok' : 'no'}`}>{book.last.ok ? '✔ Nach Lehrbuch' : '✘ Abweichung'} · {book.last.text}</span> : <span class="tg-verdict ok" style={{ opacity: 0.6 }}>Noch keine Entscheidung</span>}
        <span style={{ fontSize: '.78rem', color: '#ffffffb0' }}>Lehrbuch-Quote: <b style={{ color: '#fff' }}>{book.pct === null ? '–' : `${book.pct} %`}</b> ({book.stat.ok}/{book.stat.all})</span>
      </div>
      <div class="tg-meter"><i style={{ width: `${book.pct ?? 0}%` }} /></div>
    </aside>
  );
}

/* ---------- Dealer ---------- */
type Mood = 'idle' | 'win' | 'lose';
const MOUTH: Record<Mood, string> = { idle: 'M119 96 Q130 103 141 96', win: 'M116 93 Q130 112 144 93 Q130 99 116 93Z', lose: 'M121 99 Q130 95 139 99' };
export function Dealer({ mood, say }: { mood: Mood; say: string }) {
  const [deal, setDeal] = useState(0);
  useEffect(() => { const h = () => setDeal((d) => d + 1); window.addEventListener('ksa:card', h); return () => window.removeEventListener('ksa:card', h); }, []);
  return (
    <div class={`dl dl-${mood}`} aria-hidden="true">
      <svg viewBox="0 0 260 214">
        <defs>
          <linearGradient id="dl-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6cfa8" /><stop offset="1" stop-color="#dfa67c" /></linearGradient>
          <linearGradient id="dl-vest" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2f45" /><stop offset="1" stop-color="#0c0f1c" /></linearGradient>
          <linearGradient id="dl-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#d9dce8" /></linearGradient>
          <linearGradient id="dl-hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a2f1c" /><stop offset="1" stop-color="#1e120a" /></linearGradient>
          <radialGradient id="dl-gold" cx="35%" cy="30%"><stop offset="0" stop-color="#fff2c0" /><stop offset="1" stop-color="#c7922f" /></radialGradient>
        </defs>
        <g class="dl-body">
          <path d="M28 214 C28 160 56 136 100 128 L160 128 C204 136 232 160 232 214Z" fill="url(#dl-shirt)" />
          <path d="M28 214 C28 160 56 136 100 128 L126 196 L122 214Z" fill="url(#dl-vest)" /><path d="M232 214 C232 160 204 136 160 128 L134 196 L138 214Z" fill="url(#dl-vest)" />
          <path d="M100 128 L126 196" stroke="#f6cd68" stroke-width="1.6" /><path d="M160 128 L134 196" stroke="#f6cd68" stroke-width="1.6" />
          <circle cx="130" cy="170" r="2.6" fill="#b9bdcc" /><circle cx="130" cy="186" r="2.6" fill="#b9bdcc" /><circle cx="130" cy="202" r="2.6" fill="#b9bdcc" />
          <path d="M108 124 L130 146 L112 152Z" fill="#fff" stroke="#c9ccd8" /><path d="M152 124 L130 146 L148 152Z" fill="#fff" stroke="#c9ccd8" />
          <path d="M130 143 L112 133 L112 155Z M130 143 L148 133 L148 155Z" fill="#c81e2f" /><rect x="125" y="138" width="10" height="11" rx="3" fill="#8f1220" />
          <circle cx="86" cy="158" r="7" fill="url(#dl-gold)" stroke="#8a5c12" /><path d="M83 158l2 2 4-4" stroke="#5a3a08" stroke-width="1.6" fill="none" />
          <g class="dl-arm l"><path d="M40 168 C30 186 34 204 52 212 L78 212 C66 200 62 186 66 172Z" fill="url(#dl-shirt)" stroke="#c9ccd8" /><ellipse cx="68" cy="208" rx="15" ry="9" fill="url(#dl-skin)" /></g>
          <g class="dl-arm r" key={deal} data-deal={deal > 0 ? '1' : '0'}><path d="M220 168 C230 186 226 204 208 212 L182 212 C194 200 198 186 194 172Z" fill="url(#dl-shirt)" stroke="#c9ccd8" /><ellipse cx="192" cy="208" rx="15" ry="9" fill="url(#dl-skin)" /><rect class="dl-flick" x="170" y="198" width="26" height="17" rx="2.5" fill="#16255e" stroke="#fff" stroke-width="1.6" /></g>
        </g>
        <g class="dl-head">
          <rect x="118" y="104" width="24" height="26" rx="8" fill="#d79a70" />
          <ellipse cx="95" cy="74" rx="6" ry="10" fill="url(#dl-skin)" /><ellipse cx="165" cy="74" rx="6" ry="10" fill="url(#dl-skin)" />
          <ellipse cx="130" cy="70" rx="35" ry="42" fill="url(#dl-skin)" />
          <path d="M94 66 C90 30 112 14 134 16 C160 16 172 36 166 66 C160 46 146 38 128 40 C112 40 100 48 94 66Z" fill="url(#dl-hair)" /><path d="M112 26 C124 20 142 20 154 30" stroke="#7a5236" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <g class="dl-brow"><path d="M108 58 Q116 53 124 57" /><path d="M136 57 Q144 53 152 58" /></g>
          <g class="dl-eyes"><ellipse cx="116" cy="70" rx="7" ry="6" fill="#fff" /><ellipse cx="144" cy="70" rx="7" ry="6" fill="#fff" /><circle class="dl-pupil" cx="116" cy="71" r="3.4" fill="#2a1a10" /><circle class="dl-pupil" cx="144" cy="71" r="3.4" fill="#2a1a10" /><circle cx="117.2" cy="69.6" r="1" fill="#fff" /><circle cx="145.2" cy="69.6" r="1" fill="#fff" /></g>
          <g class="dl-lid"><ellipse cx="116" cy="70" rx="7.6" ry="6.6" fill="#e9b88f" /><ellipse cx="144" cy="70" rx="7.6" ry="6.6" fill="#e9b88f" /></g>
          <path d="M130 74 Q126 86 131 88" stroke="#c98d63" stroke-width="2" fill="none" stroke-linecap="round" />
          <circle class="dl-blush" cx="108" cy="88" r="7" /><circle class="dl-blush" cx="152" cy="88" r="7" />
          <path class="dl-mouth" d={MOUTH[mood]} />
        </g>
      </svg>
      <div class="dl-say" key={say}>{say}</div>
    </div>
  );
}
function Burst() {
  const parts = Array.from({ length: 30 }, (_, i) => ({ x: Math.round((Math.random() - 0.5) * 620), y: Math.round(-80 - Math.random() * 300), r: Math.round(Math.random() * 720 - 360), d: Math.round(Math.random() * 250), s: 0.6 + Math.random() * 0.9, c: i % 4 }));
  return <div class="tg-burst" aria-hidden="true">{parts.map((p, i) => <i key={i} data-c={p.c} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--r': `${p.r}deg`, '--s': String(p.s), animationDelay: `${p.d}ms` }} />)}</div>;
}

/** The whole scene: dealer behind a wood-rimmed felt table. `tone` drives the dealer's mood and the win effects. */
export function Table({ felt, tone = '', say = '', children }: { felt?: string; tone?: string; say?: string; children: ComponentChildren }) {
  const [n, setN] = useState(0);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } if (tone === 'win') { setN((x) => x + 1); sfx.win(); } else if (tone === 'lose') sfx.lose(); }, [tone, say]);
  return (
    <div class="tg" data-felt={felt}>
      <div class="tg-scene">
        <Dealer mood={tone === 'win' ? 'win' : tone === 'lose' ? 'lose' : 'idle'} say={say} />
        <div class="tg-rim"><div class={`tg-felt${tone === 'win' ? ' won' : ''}`}>
          <div class="tg-tray" aria-hidden="true">{[100, 25, 5, 1, 5, 25, 100].map((v, i) => <span key={i} class="tg-chip mini" data-v={v} />)}</div>
          <div class="tg-shoe" aria-hidden="true"><i /><i /><i /></div>
          <div class="tg-discard" aria-hidden="true" />
          {children}
          {n > 0 && <Burst key={n} />}
        </div></div>
      </div>
    </div>
  );
}
/** Large result banner on the felt (neutral prompts are spoken by the dealer). */
export function Msg({ tone, children }: { tone: string; children: ComponentChildren }) {
  return <div class={`tg-msg ${tone}`} aria-live="polite">{tone ? children : ' '}</div>;
}
export function Hud({ bank, bet, delta, onReset }: { bank: number; bet: number; delta?: number | null; onReset: () => void }) {
  const [m, setM] = useState(sfx.isMuted());
  return (
    <div class="tg-hud">
      <span class="tg-pill">Demo-Guthaben <b>{fmt(bank)}</b></span>
      {delta != null && delta !== 0 && <span class={`tg-pill ${delta > 0 ? 'win' : 'lose'}`}>Letzte Runde <b>{delta > 0 ? '+' : ''}{fmt(delta)}</b></span>}
      <span class="tg-pill">Einsatz <b>{fmt(bet)}</b></span>
      <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
        <button type="button" class="tg-icon" aria-label={m ? 'Ton einschalten' : 'Ton ausschalten'} aria-pressed={!m} onClick={() => setM(sfx.toggle())}>{m ? '🔇' : '🔊'}</button>
        <button type="button" class="tg-link" onClick={onReset}>Auf 1.000 € zurücksetzen</button>
      </span>
    </div>
  );
}
export function Arc({ top, sub }: { top: string; sub?: string }) {
  return (
    <svg class="tg-arc" viewBox="0 0 560 70" aria-hidden="true">
      <path id="tg-arc-p" d="M20 14 Q280 78 540 14" fill="none" />
      <text font-size="19" text-anchor="middle"><textPath href="#tg-arc-p" startOffset="50%">{top}</textPath></text>
      {sub && <text class="sub" x="280" y="66" text-anchor="middle">{sub}</text>}
    </svg>
  );
}
