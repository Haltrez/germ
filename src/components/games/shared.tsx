/** Shared pieces for the free table games: cards, chips, bankroll, coach panel. */
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

export function CardView({ card, down = false, small = false, win = false, i = 0 }: { card: Card; down?: boolean; small?: boolean; win?: boolean; i?: number }) {
  const red = card.s === 1 || card.s === 2;
  const court = card.r >= 11 && card.r <= 13;
  const suit = SUITS[card.s];
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

export const CHIPS = [1, 5, 25, 100];
export function ChipRack({ value, onPick }: { value: number; onPick: (v: number) => void }) {
  return (
    <div class="tg-rack" role="group" aria-label="Jeton wählen">
      {CHIPS.map((v) => <button type="button" class={`tg-chip${v === value ? ' sel' : ''}`} data-v={v} aria-label={`Jeton ${v}`} aria-pressed={v === value} onClick={() => onPick(v)} />)}
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
export const fmt = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 2 });

/** Play-money bankroll, kept per browser. */
export function useBank(start = 1000) {
  const [bank, setBank] = useState(start);
  const ref = useRef(start);
  const set = (v: number) => { const x = Math.round(v * 100) / 100; ref.current = x; setBank(x); try { localStorage.setItem('ksa-tg-bank', String(x)); } catch { /* ignore */ } };
  useEffect(() => { try { const v = Number(localStorage.getItem('ksa-tg-bank')); if (v > 0) { ref.current = v; setBank(v); } } catch { /* ignore */ } }, []);
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

export function Table({ felt, children }: { felt?: string; children: ComponentChildren }) {
  return <div class="tg" data-felt={felt}><div class="tg-rim"><div class="tg-felt">{children}</div></div></div>;
}
export function Hud({ bank, bet, delta, onReset }: { bank: number; bet: number; delta?: number | null; onReset: () => void }) {
  return (
    <div class="tg-hud">
      <span class="tg-pill">Spielgeld <b>{fmt(bank)}</b></span>
      {delta != null && delta !== 0 && <span class={`tg-pill ${delta > 0 ? 'win' : 'lose'}`}>Letzte Runde <b>{delta > 0 ? '+' : ''}{fmt(delta)}</b></span>}
      <span class="tg-pill">Einsatz <b>{fmt(bet)}</b></span>
      <button type="button" class="tg-link" onClick={onReset}>Guthaben zurücksetzen</button>
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
