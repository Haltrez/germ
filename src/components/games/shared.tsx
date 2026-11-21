/** Shared pieces for the free table games: cards, chips, bankroll, dealer, sounds, coach panel. */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

export interface Card { r: number; s: number } // r: 2..14 (11 J, 12 Q, 13 K, 14 A), s: 0♠ 1♥ 2♦ 3♣
const SUITS = ['♠', '♥', '♦', '♣'];
export const rankLabel = (r: number) => (r <= 10 ? String(r) : { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[r]!);

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
  const suit = SUITS[card.s];
  useEffect(() => { sfx.card(i * 0.09); }, []);
  return (
    <div class={`tg-card${down ? ' down' : ''}${small ? ' sm' : ''}${win ? ' win' : ''}`} style={{ animationDelay: `${i * 90}ms` }}>
      <div class="tg-card-in">
        <div class={`tg-face${red ? ' red' : ''}${card.r >= 11 && card.r <= 13 ? ' court' : ''}`}>
          <b>{rankLabel(card.r)}</b><i>{suit}</i>
          <span class="c">{card.r >= 11 && card.r <= 13 ? <em>{rankLabel(card.r)}</em> : suit}</span>
          <u>KSA</u>
        </div>
        <div class="tg-back"><span class="ksa"><i>K</i><i>S</i><i>A</i></span></div>
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

/* ---------- Layout ---------- */
/** Game shell: control panel on the left, stage on the right, optional footer (coach) below. */
export function Table({ tone = '', say = '', side, foot, children }: { felt?: string; tone?: string; say?: string; side?: ComponentChildren; foot?: ComponentChildren; children: ComponentChildren }) {
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } if (tone === 'win') sfx.win(); else if (tone === 'lose') sfx.lose(); }, [tone, say]);
  return (
    <div class="tg" data-tone={tone}>
      <div class="tg-shell">
        <aside class="tg-side">{side}</aside>
        <div class="tg-stage"><p class="tg-status" aria-live="polite">{say}</p>{children}</div>
      </div>
      {foot}
    </div>
  );
}
/** Result pill on the stage (neutral prompts are shown in the status line). */
export function Msg({ tone, children }: { tone: string; children: ComponentChildren }) {
  return <div class="tg-msg-wrap">{tone ? <div class={`tg-msg ${tone}`} key={String(children)}>{children}</div> : null}</div>;
}
export function Hud({ bank, bet, delta, onReset }: { bank: number; bet: number; delta?: number | null; onReset: () => void }) {
  const [m, setM] = useState(sfx.isMuted());
  return (
    <div class="tg-hud">
      <div class="tg-bal"><span>Demo-Guthaben</span><b>{fmt(bank)}</b></div>
      <div class="tg-rows">
        <div><span>Einsatz</span><b>{fmt(bet)}</b></div>
        <div class={delta != null && delta !== 0 ? (delta > 0 ? 'up' : 'dn') : ''}><span>Letzte Runde</span><b>{delta == null ? '–' : `${delta > 0 ? '+' : ''}${fmt(delta)}`}</b></div>
      </div>
      <div class="tg-tools">
        <button type="button" class="tg-link" aria-pressed={!m} onClick={() => setM(sfx.toggle())}>{m ? 'Ton aus' : 'Ton an'}</button>
        <button type="button" class="tg-link" onClick={onReset}>Auf 1.000 € zurücksetzen</button>
      </div>
    </div>
  );
}
export function Arc({ top, sub }: { top: string; sub?: string }) {
  return <p class="tg-print">{top}{sub && <small>{sub}</small>}</p>;
}
