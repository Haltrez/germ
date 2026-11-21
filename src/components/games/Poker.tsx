/** Free Texas Hold'em (no limit) against three computer opponents. Blinds 5/10, 1.000 € stacks. */
import { useRef, useState } from 'preact/hooks';
import { CardView, ChipStack, Coach, Hud, Msg, Table, fmt, newShoe, sfx, useBank, useBook, type Card } from './shared.tsx';
import { cmp, evalHand, handName } from './Holdem.tsx';

const SB = 5, BB = 10;
interface P { name: string; stack: number; hole: Card[]; bet: number; total: number; folded: boolean; allin: boolean; acted: boolean; human: boolean; last: string; aggr: number; show: boolean; won: number; hand: string }
type Street = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'show';
type Kind = 'fold' | 'call' | 'raise';
const mk = (name: string, human: boolean, aggr: number): P => ({ name, stack: 1000, hole: [], bet: 0, total: 0, folded: false, allin: false, acted: false, human, last: '', aggr, show: false, won: 0, hand: '' });

/** Chance to win at showdown against `opp` random hands, by simulation. */
function equity(hole: Card[], board: Card[], opp: number, iters: number) {
  const known = new Set([...hole, ...board].map((c) => c.r * 4 + c.s));
  const rest: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) if (!known.has(r * 4 + s)) rest.push({ r, s });
  let score = 0;
  const need = opp * 2 + (5 - board.length);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < need; i++) { const j = i + Math.floor(Math.random() * (rest.length - i)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    const full = [...board, ...rest.slice(opp * 2, need)];
    const mine = evalHand([...hole, ...full]);
    let best = 1, ties = 1;
    for (let o = 0; o < opp; o++) { const c = cmp(evalHand([rest[o * 2], rest[o * 2 + 1], ...full]), mine); if (c > 0) { best = 0; break; } if (c === 0) ties++; }
    score += best ? 1 / ties : 0;
  }
  return score / iters;
}
/** Rough pre-flop strength 0..1 for the computer players. */
function pre(h: Card[]) {
  const [a, b] = h[0].r >= h[1].r ? h : [h[1], h[0]];
  if (a.r === b.r) return 0.55 + (a.r / 14) * 0.45;
  return Math.min(1, (a.r * 2 + b.r) / 44 + (a.s === b.s ? 0.06 : 0) + (a.r - b.r <= 2 ? 0.04 : 0));
}

export default function Poker() {
  const bank = useBank('poker');
  const bk = useBook('poker');
  const [coach, setCoach] = useState(true);
  const [, force] = useState(0);
  const g = useRef({ players: [mk('Du', true, 0), mk('Lena', false, 0.2), mk('Marco', false, 0.9), mk('Sofia', false, 0.5)], button: 3, deck: [] as Card[], board: [] as Card[], street: 'idle' as Street, cur: -1, currentBet: 0, minRaise: BB, msg: 'Bereit für die erste Hand?', tone: '', delta: null as number | null, start: 1000, tip: null as null | { k: Kind; why: string }, n: 0 }).current;
  const up = () => force((x) => x + 1);
  const me = g.players[0];
  const pot = () => g.players.reduce((a, p) => a + p.total, 0);
  const live = () => g.players.filter((p) => !p.folded);
  const pay = (p: P, amt: number) => { const a = Math.min(Math.max(amt, 0), p.stack); p.stack = Math.round((p.stack - a) * 100) / 100; p.bet += a; p.total += a; if (p.stack === 0) p.allin = true; if (p.human) bank.set(p.stack); };

  const finish = (text: string) => {
    g.street = 'show'; g.cur = -1; g.tip = null;
    g.delta = Math.round((me.stack - g.start) * 100) / 100;
    g.msg = `${text} · ${g.delta > 0 ? '+' : ''}${fmt(g.delta)}`; g.tone = g.delta > 0 ? 'win' : g.delta < 0 ? 'lose' : 'push';
    bk.round(); up();
  };
  const give = (p: P, amt: number) => { p.stack = Math.round((p.stack + amt) * 100) / 100; p.won += amt; if (p.human) bank.set(p.stack); };
  const showdown = () => {
    const inHand = live(); inHand.forEach((p) => { p.show = true; p.hand = handName(evalHand([...p.hole, ...g.board])); });
    // side pots by contribution level
    const levels = [...new Set(g.players.map((p) => p.total).filter((t) => t > 0))].sort((a, b) => a - b);
    let prev = 0; const names: string[] = [];
    for (const lv of levels) {
      const size = g.players.reduce((a, p) => a + Math.min(p.total, lv) - Math.min(p.total, prev), 0);
      const elig = inHand.filter((p) => p.total >= lv); prev = lv;
      if (!elig.length || size <= 0) continue;
      const scores = elig.map((p) => evalHand([...p.hole, ...g.board]));
      const best = scores.reduce((a, s) => (cmp(s, a) > 0 ? s : a));
      const winners = elig.filter((_, i) => cmp(scores[i], best) === 0);
      const share = Math.floor((size / winners.length) * 100) / 100;
      winners.forEach((w, i) => give(w, i === 0 ? size - share * (winners.length - 1) : share));
      winners.forEach((w) => { if (!names.includes(w.name)) names.push(w.name); });
    }
    const top = g.players.filter((p) => p.won > 0).sort((a, b) => b.won - a.won)[0];
    finish(names.includes('Du') ? `Du gewinnst mit ${me.hand}` : `${top.name} gewinnt mit ${top.hand}`);
  };
  const endStreet = () => {
    g.players.forEach((p) => { p.bet = 0; p.acted = false; if (!p.folded && !p.allin) p.last = ''; });
    g.currentBet = 0; g.minRaise = BB; g.cur = -1; g.tip = null;
    if (g.street === 'river') return showdown();
    if (g.street === 'preflop') { g.street = 'flop'; g.board.push(g.deck.pop()!, g.deck.pop()!, g.deck.pop()!); }
    else { g.street = g.street === 'flop' ? 'turn' : 'river'; g.board.push(g.deck.pop()!); }
    g.msg = g.street === 'flop' ? 'Der Flop' : g.street === 'turn' ? 'Der Turn' : 'Der River'; up();
    if (live().filter((p) => !p.allin).length <= 1) setTimeout(endStreet, 1200); else setTimeout(() => proceed(g.button), 900);
  };
  const book = (): { k: Kind; why: string } => {
    const opp = live().length - 1; const eq = equity(me.hole, g.board, opp, 600); const toCall = Math.min(g.currentBet - me.bet, me.stack);
    const fair = 1 / (opp + 1); const pct = Math.round(eq * 100);
    if (toCall <= 0) return eq > fair + 0.15 ? { k: 'raise', why: `Deine Gewinnchance liegt bei rund ${pct} % gegen ${opp} Gegner, deutlich über dem Schnitt. Setzen.` } : { k: 'call', why: `Rund ${pct} % Gewinnchance. Kein Grund zu setzen: schieben und die nächste Karte ansehen.` };
    const odds = toCall / (pot() + toCall); const need = Math.round(odds * 100);
    if (eq < odds) return { k: 'fold', why: `Du müsstest ${fmt(toCall)} für einen Pot von ${fmt(pot())} zahlen und bräuchtest ${need} % Gewinnchance. Du hast rund ${pct} %. Aufgeben.` };
    if (eq > fair + 0.25) return { k: 'raise', why: `Rund ${pct} % Gewinnchance, weit über den nötigen ${need} %. Erhöhen.` };
    return { k: 'call', why: `Du brauchst ${need} % Gewinnchance (Pot Odds) und hast rund ${pct} %. Mitgehen.` };
  };
  function proceed(from: number) {
    if (live().length === 1) { const w = live()[0]; give(w, pot()); return finish(w.human ? 'Alle geben auf, du gewinnst den Pot' : `${w.name} gewinnt den Pot`); }
    let idx = -1;
    for (let i = 1; i <= 4; i++) { const k = (from + i) % 4; const p = g.players[k]; if (!p.folded && !p.allin && (!p.acted || p.bet < g.currentBet)) { idx = k; break; } }
    if (idx === -1) return endStreet();
    g.cur = idx;
    if (idx === 0) { g.tip = book(); g.msg = 'Du bist dran'; up(); } else { g.msg = `${g.players[idx].name} überlegt …`; up(); setTimeout(() => bot(idx), 650 + Math.random() * 500); }
  }
  const act = (idx: number, kind: Kind, target = 0) => {
    const p = g.players[idx]; const toCall = g.currentBet - p.bet; const hadBet = g.currentBet > 0;
    if (kind === 'fold') { p.folded = true; p.last = 'Fold'; }
    else if (kind === 'call' || target <= g.currentBet) { pay(p, toCall); p.last = toCall <= 0 ? 'Check' : 'Call'; if (toCall > 0) sfx.chip(); }
    else {
      pay(p, target - p.bet); sfx.chip();
      if (p.bet > g.currentBet) { const size = p.bet - g.currentBet; if (size >= g.minRaise) g.minRaise = size; g.currentBet = p.bet; g.players.forEach((o) => { if (o !== p) o.acted = false; }); }
      p.last = `${hadBet ? 'Raise' : 'Bet'} ${fmt(p.bet)}`;
    }
    if (p.allin) p.last = 'All-in';
    p.acted = true; up(); proceed(idx);
  };
  const bot = (idx: number) => {
    if (g.cur !== idx) return;
    const p = g.players[idx]; const toCall = Math.min(g.currentBet - p.bet, p.stack); const potNow = pot(); const opp = live().length - 1; const r = Math.random();
    const raiseTo = (t: number) => act(idx, 'raise', Math.min(Math.max(Math.round(t / 5) * 5, g.currentBet + g.minRaise), p.bet + p.stack));
    if (g.street === 'preflop') {
      const s = pre(p.hole) + (r - 0.5) * 0.12 + p.aggr * 0.04;
      if (s > 0.84 && g.currentBet < BB * 9) return raiseTo(Math.max(g.currentBet * 3, BB * 3));
      if (s > 0.6 || (toCall <= BB && s > 0.46)) return toCall > p.stack * 0.45 && s < 0.8 ? act(idx, toCall > 0 ? 'fold' : 'call') : act(idx, 'call');
      return act(idx, toCall > 0 ? 'fold' : 'call');
    }
    const eq = equity(p.hole, g.board, opp, 140); const fair = 1 / (opp + 1);
    if (toCall <= 0) return eq > fair + 0.18 || r < 0.06 * (1 + p.aggr) ? raiseTo(potNow * (0.5 + p.aggr * 0.25)) : act(idx, 'call');
    const odds = toCall / (potNow + toCall);
    if (eq > fair + 0.3 && r < 0.55 + p.aggr * 0.2) return raiseTo(g.currentBet + potNow * 0.75);
    return eq > odds + 0.04 ? act(idx, 'call') : act(idx, 'fold');
  };
  const deal = () => {
    if (me.stack < BB) return;
    g.players.forEach((p) => { if (!p.human && p.stack < BB * 2) p.stack = 1000; Object.assign(p, { hole: [], bet: 0, total: 0, folded: false, allin: false, acted: false, last: '', show: false, won: 0, hand: '' }); });
    me.stack = bank.now(); g.start = me.stack; g.n++;
    g.button = (g.button + 1) % 4; g.deck = newShoe(1); g.board = []; g.street = 'preflop'; g.tone = ''; g.delta = null; g.tip = null;
    for (let r = 0; r < 2; r++) for (let i = 1; i <= 4; i++) g.players[(g.button + i) % 4].hole.push(g.deck.pop()!);
    const sb = (g.button + 1) % 4, bb = (g.button + 2) % 4;
    pay(g.players[sb], SB); g.players[sb].last = `Small Blind ${fmt(SB)}`; pay(g.players[bb], BB); g.players[bb].last = `Big Blind ${fmt(BB)}`;
    g.currentBet = BB; g.minRaise = BB; g.msg = 'Neue Hand'; up(); setTimeout(() => proceed(bb), 900);
  };
  const mine = (k: Kind, target = 0) => {
    if (g.cur !== 0 || !g.tip) return;
    const t = g.tip; const ok = k === t.k || (t.k === 'raise' && k === 'call');
    const NAMES: Record<Kind, string> = { fold: 'Aufgeben', call: g.currentBet - me.bet > 0 ? 'Mitgehen' : 'Schieben', raise: g.currentBet > 0 ? 'Erhöhen' : 'Setzen' };
    bk.judge(ok, ok ? NAMES[k] : `Lehrbuch: ${NAMES[t.k]}`); act(0, k, target);
  };
  const toCall = Math.min(g.currentBet - me.bet, me.stack);
  const myTurn = g.cur === 0 && g.street !== 'show' && g.street !== 'idle';
  const maxTo = me.bet + me.stack; const minTo = Math.min(g.currentBet + g.minRaise, maxTo);
  const sizeTo = (f: number) => Math.min(Math.max(Math.round((g.currentBet + f * (pot() + Math.max(toCall, 0))) / 5) * 5, minTo), maxTo);
  const canRaise = me.stack > Math.max(toCall, 0);
  const cls = (k: Kind) => (coach && myTurn && g.tip?.k === k ? ' book' : '');
  const idle = g.street === 'idle' || g.street === 'show';
  const role = (i: number) => (i === g.button ? 'D' : i === (g.button + 1) % 4 ? 'SB' : i === (g.button + 2) % 4 ? 'BB' : '');

  return (
    <Table felt="blue" tone={g.tone === 'push' ? '' : g.tone} say={g.msg} side={<>
      <Hud bank={me.human ? bank.bank : 0} bet={me.total} delta={g.delta} onReset={() => { if (!idle) return; bank.reset(); me.stack = 1000; up(); }} />
      {myTurn ? (
        <div class="tg-actions">
          <button type="button" class={`tg-btn red${cls('fold')}`} onClick={() => mine('fold')}>Aufgeben</button>
          <button type="button" class={`tg-btn green${cls('call')}`} onClick={() => mine('call')}>{toCall > 0 ? `Mitgehen ${fmt(toCall)}` : 'Schieben'}</button>
          {canRaise && sizeTo(0.5) < maxTo && <button type="button" class={`tg-btn alt${cls('raise')}`} onClick={() => mine('raise', sizeTo(0.5))}>{g.currentBet > 0 ? 'Erhöhen auf' : 'Setzen'} {fmt(sizeTo(0.5))}</button>}
          {canRaise && sizeTo(1) < maxTo && sizeTo(1) > sizeTo(0.5) && <button type="button" class="tg-btn alt" onClick={() => mine('raise', sizeTo(1))}>Pot {fmt(sizeTo(1))}</button>}
          {canRaise && <button type="button" class="tg-btn alt" onClick={() => mine('raise', maxTo)}>All-in {fmt(maxTo)}</button>}
        </div>
      ) : idle ? (
        <div class="tg-actions">
          {me.stack >= BB ? <button type="button" class="tg-btn" onClick={deal}>{g.street === 'idle' ? 'Karten geben' : 'Nächste Hand'}</button>
            : <button type="button" class="tg-btn" onClick={() => { bank.reset(); me.stack = 1000; up(); }}>Guthaben auf 1.000 € setzen</button>}
        </div>
      ) : <div class="tg-actions" style={{ minHeight: '52px' }} />}
      </>} foot={<Coach on={coach} setOn={setCoach} book={bk} tip={myTurn && g.tip ? <><b>{g.tip.k === 'fold' ? 'Aufgeben.' : g.tip.k === 'call' ? (toCall > 0 ? 'Mitgehen.' : 'Schieben.') : g.currentBet > 0 ? 'Erhöhen.' : 'Setzen.'}</b> {g.tip.why}</> : 'Der Tipp rechnet für jede Entscheidung deine ungefähre Gewinnchance aus und vergleicht sie mit den Pot Odds, also dem Preis fürs Mitgehen im Verhältnis zum Pot. Er rechnet gegen zufällige Hände. Wer viel setzt, hat meist bessere Karten, deshalb ist der Tipp eine Faustregel und keine perfekte Strategie.'} />}>
      <div class="pk-bots">
        {g.players.slice(1).map((p, k) => { const i = k + 1; return (
          <div class={`pk-seat${g.cur === i ? ' turn' : ''}${p.folded ? ' out' : ''}${p.won > 0 ? ' won' : ''}`} key={`${g.n}-${i}`}>
            <div class="pk-name"><b>{p.name}</b>{role(i) && g.street !== 'idle' && <i class={`pk-role ${role(i)}`}>{role(i)}</i>}<span>{fmt(p.stack)}</span></div>
            <div class="tg-hand">{p.hole.map((c, ci) => <CardView key={`${g.n}-${i}-${ci}`} card={c} small down={!p.show} i={ci} win={p.won > 0 && p.show} />)}</div>
            <div class="pk-info">{p.show && p.hand ? <span class="pk-tag h">{p.hand}</span> : p.last ? <span class={`pk-tag${p.folded ? ' f' : ''}`}>{p.last}</span> : null}{p.won > 0 && <span class="pk-tag w">+{fmt(p.won)}</span>}</div>
            <div class="pk-bet">{p.bet > 0 && <ChipStack amount={p.bet} />}</div>
          </div>); })}
      </div>
      <div class="pk-mid">
        <div class="tg-hand pk-board">{g.board.map((c, i) => <CardView key={`${g.n}-b${i}`} card={c} i={i < 3 ? i : 0} />)}{g.board.length === 0 && <span class="pk-empty">Texas Hold'em · Blinds {SB}/{BB} €</span>}</div>
        <div class="pk-pot"><span class="tg-pill">Pot <b>{fmt(pot())}</b></span></div>
      </div>
      <Msg tone={g.tone}>{g.msg}</Msg>
      <div class={`pk-me${g.cur === 0 ? ' turn' : ''}${me.won > 0 ? ' won' : ''}`}>
        <div class="pk-bet">{me.bet > 0 && <ChipStack amount={me.bet} />}</div>
        <div class="tg-hand">{me.hole.map((c, ci) => <CardView key={`${g.n}-me-${ci}`} card={c} i={ci} win={me.won > 0} />)}</div>
        <div class="pk-info">
          {role(0) && g.street !== 'idle' && <i class={`pk-role ${role(0)}`}>{role(0)}</i>}
          {me.hole.length > 0 && <span class="pk-tag h">{g.board.length ? handName(evalHand([...me.hole, ...g.board])) : me.hole[0].r === me.hole[1].r ? 'Ein Paar' : 'Starthand'}</span>}
          {me.last && <span class={`pk-tag${me.folded ? ' f' : ''}`}>{me.last}</span>}{me.won > 0 && <span class="pk-tag w">+{fmt(me.won)}</span>}
        </div>
      </div>
    </Table>
  );
}
