/** Free blackjack: 6 decks, dealer stands on all 17s, blackjack pays 3:2, double after split, side bets Perfect Pairs and 21+3. */
import { useRef, useState } from 'preact/hooks';
import { Arc, CardView, ChipRack, ChipStack, Coach, Hud, Msg, Table, fmt, newShoe, sfx, useBank, useBook, type Card } from './shared.tsx';

type Move = 'H' | 'S' | 'D' | 'P';
interface Hand { cards: Card[]; bet: number; done: boolean; doubled: boolean; split: boolean; seat: number; out?: string; tone?: string }
const val = (c: Card) => (c.r === 14 ? 11 : Math.min(c.r, 10));
export function total(cards: Card[]) {
  let t = cards.reduce((a, c) => a + val(c), 0);
  let aces = cards.filter((c) => c.r === 14).length;
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return { t, soft: aces > 0 };
}
const isBJ = (h: Hand) => h.cards.length === 2 && !h.split && total(h.cards).t === 21;
const NAME: Record<Move, string> = { H: 'Karte', S: 'Halten', D: 'Verdoppeln', P: 'Teilen' };

/** Basic strategy for 4–8 decks, dealer stands on soft 17, double after split allowed. */
export function book(cards: Card[], up: Card, canDouble: boolean, canSplit: boolean): { m: Move; why: string } {
  const d = val(up); // 2..11
  const { t, soft } = total(cards);
  const dbl = (alt: Move): Move => (canDouble ? 'D' : alt);
  if (canSplit && cards.length === 2 && val(cards[0]) === val(cards[1])) {
    const p = val(cards[0]);
    const split =
      p === 11 || p === 8 ? true :
      p === 10 || p === 5 ? false :
      p === 9 ? (d <= 6 || d === 8 || d === 9) :
      p === 7 ? d <= 7 :
      p === 6 ? d <= 6 :
      p === 4 ? (d === 5 || d === 6) :
      d <= 7; // 2s and 3s
    if (split) return { m: 'P', why: p === 11 ? 'Asse immer teilen: Aus einer schwachen 12 werden zwei starke Starthände.' : p === 8 ? 'Achten immer teilen: 16 ist die schlechteste Hand am Tisch.' : `Paar ${p}er gegen ${d === 11 ? 'Ass' : d} teilen.` };
  }
  if (soft) {
    if (t >= 19) return { m: 'S', why: `Soft ${t} ist stark genug. Halten.` };
    if (t === 18) {
      if (d >= 3 && d <= 6) return { m: dbl('S'), why: 'Soft 18 gegen eine schwache Bankkarte: verdoppeln, sonst halten.' };
      if (d === 2 || d === 7 || d === 8) return { m: 'S', why: 'Soft 18 gegen 2, 7 oder 8: halten.' };
      return { m: 'H', why: 'Soft 18 gegen 9, 10 oder Ass reicht meist nicht. Karte nehmen.' };
    }
    const lo = t === 17 ? 3 : t >= 15 ? 4 : 5;
    if (d >= lo && d <= 6) return { m: dbl('H'), why: `Soft ${t} gegen ${d}: Die Bank ist schwach, verdoppeln.` };
    return { m: 'H', why: `Soft ${t} kann sich nicht überkaufen. Karte nehmen.` };
  }
  if (t >= 17) return { m: 'S', why: `Harte ${t}: immer halten.` };
  if (t >= 13) return d <= 6 ? { m: 'S', why: `${t} gegen ${d}: Die Bank überkauft sich oft. Halten.` } : { m: 'H', why: `${t} gegen ${d === 11 ? 'Ass' : d}: Die Bank hat vermutlich 17 oder mehr. Karte nehmen.` };
  if (t === 12) return d >= 4 && d <= 6 ? { m: 'S', why: '12 gegen 4, 5 oder 6: halten und die Bank ziehen lassen.' } : { m: 'H', why: '12 gegen 2, 3 oder 7 und höher: Karte nehmen.' };
  if (t === 11) return d <= 10 ? { m: dbl('H'), why: '11 ist die beste Hand zum Verdoppeln.' } : { m: 'H', why: '11 gegen Ass: nur eine Karte nehmen.' };
  if (t === 10) return d <= 9 ? { m: dbl('H'), why: '10 gegen 2 bis 9: verdoppeln.' } : { m: 'H', why: '10 gegen 10 oder Ass: nur eine Karte nehmen.' };
  if (t === 9) return d >= 3 && d <= 6 ? { m: dbl('H'), why: '9 gegen 3 bis 6: verdoppeln.' } : { m: 'H', why: '9: Karte nehmen.' };
  return { m: 'H', why: `Mit ${t} kannst du dich nicht überkaufen. Karte nehmen.` };
}

/** Perfect Pairs: the player's first two cards. Returns [name, payout to 1] or null. */
export function perfectPair(a: Card, b: Card): [string, number] | null {
  if (a.r !== b.r) return null;
  if (a.s === b.s) return ['Perfektes Paar', 25];
  const red = (c: Card) => c.s === 1 || c.s === 2;
  return red(a) === red(b) ? ['Farbiges Paar', 12] : ['Gemischtes Paar', 6];
}
/** 21+3: the player's first two cards plus the dealer's up card as a three-card poker hand. */
export function twentyOnePlus3(cs: Card[]): [string, number] | null {
  const r = cs.map((c) => c.r).sort((x, y) => x - y);
  const flush = cs.every((c) => c.s === cs[0].s);
  const trips = r[0] === r[2];
  const straight = (r[0] + 1 === r[1] && r[1] + 1 === r[2]) || (r[0] === 2 && r[1] === 3 && r[2] === 14);
  if (trips && flush) return ['Drilling in einer Farbe', 100];
  if (straight && flush) return ['Straight Flush', 40];
  if (trips) return ['Drilling', 30];
  if (straight) return ['Straße', 10];
  if (flush) return ['Flush', 5];
  return null;
}
type Spot = 'main' | 'pp' | 't3';
interface Seat { main: number; pp: number; t3: number; res: { t: string; w: boolean }[] }
const emptySeat = (): Seat => ({ main: 0, pp: 0, t3: 0, res: [] });

export default function Blackjack() {
  const bank = useBank('blackjack');
  const bk = useBook('blackjack');
  const [chip, setChip] = useState(5);
  const [coach, setCoach] = useState(true);
  const [, force] = useState(0);
  const g = useRef({ phase: 'bet' as 'bet' | 'dealing' | 'player' | 'dealer' | 'done', n: 1, seats: [emptySeat(), emptySeat(), emptySeat()], hands: [] as Hand[], dealer: [] as Card[], hole: true, cur: 0, msg: 'Ihre Einsätze, bitte!', tone: '', delta: null as number | null, side: 0, shoe: newShoe(6) }).current;
  const up = () => force((x) => x + 1);
  const draw = () => { if (g.shoe.length < 60) g.shoe = newShoe(6); return g.shoe.pop()!; };
  const active = () => g.seats.slice(0, g.n);
  const clearTable = () => { g.phase = 'bet'; g.hands = []; g.dealer = []; g.seats.forEach((s) => { s.res = []; }); g.msg = 'Ihre Einsätze, bitte!'; g.tone = ''; };
  const wipe = () => { g.seats = [emptySeat(), emptySeat(), emptySeat()]; };
  const staked0 = () => active().reduce((a, s) => a + (s.main > 0 ? s.main + s.pp + s.t3 : 0), 0);
  const setSeats = (n: number) => { if (g.phase === 'done') { clearTable(); } if (g.phase !== 'bet') return; g.n = n; sfx.chip(); up(); };

  const addBet = (i: number, spot: Spot) => {
    if (g.phase === 'done') { clearTable(); wipe(); }
    if (g.phase !== 'bet') return;
    const s = g.seats[i];
    if (staked0() + chip > bank.now()) { g.msg = 'Dafür reicht das Guthaben nicht.'; return up(); }
    if (spot === 'main') { if (s.main + chip <= 500) s.main += chip; }
    else if (s.main === 0) { g.msg = 'Nebenwetten brauchen einen Haupteinsatz.'; return up(); }
    else if (s[spot] + chip <= 100) s[spot] += chip;
    sfx.chip(); up();
  };
  const settle = () => {
    const d = total(g.dealer).t; const dBJ = g.dealer.length === 2 && d === 21;
    let back = 0, staked = 0;
    for (const h of g.hands) {
      staked += h.bet; const p = total(h.cards).t; let r = 0;
      if (p > 21) r = 0;
      else if (isBJ(h) && !dBJ) r = h.bet * 2.5;
      else if (dBJ && !isBJ(h)) r = 0;
      else if (d > 21 || p > d) r = h.bet * 2;
      else if (p === d) r = h.bet;
      back += r; const net = r - h.bet;
      h.out = net > 0 ? `+${fmt(net)}` : net === 0 ? 'Unentschieden' : fmt(net); h.tone = net > 0 ? 'w' : net < 0 ? 'l' : '';
    }
    bank.add(back); const main = back - staked; g.delta = main + g.side; g.phase = 'done'; g.hole = false;
    const sum = `${g.delta > 0 ? '+' : ''}${fmt(g.delta)}`;
    g.msg = g.hands.some(isBJ) && !dBJ && main > 0 ? `Blackjack! ${sum}` : dBJ && main < 0 ? `Die Bank hat Blackjack · ${sum}` : g.delta > 0 ? `Gewonnen! ${sum}` : g.delta === 0 ? 'Unentschieden – Einsatz zurück' : `Verloren · ${sum}`;
    g.tone = g.delta > 0 ? 'win' : g.delta < 0 ? 'lose' : 'push';
    if (g.delta > 0 && g.delta >= staked * 3) sfx.big();
    bk.round(); up();
  };
  const dealerPlay = () => {
    g.phase = 'dealer'; g.hole = false; g.msg = 'Die Bank zieht …'; up();
    const step = () => { if (total(g.dealer).t < 17) { g.dealer.push(draw()); up(); setTimeout(step, 650); } else setTimeout(settle, 450); };
    setTimeout(step, 700);
  };
  const next = () => {
    while (g.cur < g.hands.length && g.hands[g.cur].done) g.cur++;
    if (g.cur < g.hands.length) { const h = g.hands[g.cur]; if (h.cards.length === 1) { h.cards.push(draw()); if (h.cards[0].r === 14 || total(h.cards).t === 21) { h.done = true; return next(); } } g.msg = g.hands.length > 1 ? `Hand ${h.seat + 1}${h.split ? ' (geteilt)' : ''}: Ihr Zug` : 'Ihr Zug'; up(); return; }
    // the bank only draws if at least one hand is still live and not a natural
    if (g.hands.every((h) => total(h.cards).t > 21 || isBJ(h))) { g.hole = false; up(); setTimeout(settle, 500); } else dealerPlay();
  };
  const deal = (rebet = false) => {
    if (rebet) { clearTable(); if (staked0() > bank.now()) active().forEach((s) => { s.pp = 0; s.t3 = 0; }); if (staked0() > bank.now()) wipe(); }
    if (g.phase !== 'bet' || staked0() <= 0) return up();
    bank.add(-staked0()); g.delta = null; g.tone = ''; g.side = 0;
    // Hands are dealt and played from the player's right to left, as at a real table.
    g.hands = []; active().forEach((s, i) => { s.res = []; if (s.main > 0) g.hands.unshift({ cards: [], bet: s.main, done: false, doubled: false, split: false, seat: i }); });
    g.dealer = []; g.hole = true; g.cur = 0; g.phase = 'dealing'; g.msg = 'Die Karten kommen …'; up();
    // one card at a time: every hand, then the bank, then the second round
    const steps: (() => void)[] = [];
    for (let round = 0; round < 2; round++) { g.hands.forEach((h) => steps.push(() => h.cards.push(draw()))); steps.push(() => g.dealer.push(draw())); }
    steps.forEach((f, i) => setTimeout(() => { f(); up(); }, 250 + i * 420));
    setTimeout(afterDeal, 250 + steps.length * 420 + 150);
  };
  const afterDeal = () => {
    g.phase = 'player';
    let sideWin = false;
    for (const h of g.hands) {
      const s = g.seats[h.seat]; const [c1, c2] = h.cards; g.side -= s.pp + s.t3;
      if (s.pp > 0) { const r = perfectPair(c1, c2); if (r) { bank.add(s.pp * (r[1] + 1)); g.side += s.pp * (r[1] + 1); sideWin = true; } s.res.push({ t: r ? `PP: ${r[0]} ${r[1]}:1 · +${fmt(s.pp * r[1])}` : 'PP: kein Paar', w: !!r }); }
      if (s.t3 > 0) { const r = twentyOnePlus3([c1, c2, g.dealer[0]]); if (r) { bank.add(s.t3 * (r[1] + 1)); g.side += s.t3 * (r[1] + 1); sideWin = true; } s.res.push({ t: r ? `21+3: ${r[0]} ${r[1]}:1 · +${fmt(s.t3 * r[1])}` : '21+3: nichts', w: !!r }); }
    }
    if (sideWin) sfx.win();
    const dUp = val(g.dealer[0]); const dBJ = total(g.dealer).t === 21;
    if ((dUp === 11 || dUp === 10) && dBJ) { g.hands.forEach((h) => { h.done = true; }); g.msg = 'Einen Moment …'; up(); setTimeout(settle, 900); return; }
    g.hands.forEach((h) => { if (isBJ(h)) h.done = true; });
    g.msg = g.hands.length > 1 ? `Hand ${g.hands[0].seat + 1}: Ihr Zug` : 'Ihr Zug'; up(); if (g.hands[0].done) setTimeout(next, 700);
  };
  const cur = g.hands[g.cur];
  const canDouble = !!cur && g.phase === 'player' && cur.cards.length === 2 && bank.bank >= cur.bet;
  const canSplit = !!cur && g.phase === 'player' && !cur.split && cur.cards.length === 2 && val(cur.cards[0]) === val(cur.cards[1]) && bank.bank >= cur.bet;
  const tip = cur && g.phase === 'player' && !cur.done ? book(cur.cards, g.dealer[0], canDouble, canSplit) : null;
  const act = (m: Move) => {
    if (!cur || g.phase !== 'player' || !tip) return;
    bk.judge(m === tip.m, m === tip.m ? NAME[m] : `Lehrbuch: ${NAME[tip.m]}`);
    if (m === 'H') { cur.cards.push(draw()); if (total(cur.cards).t >= 21) cur.done = true; }
    else if (m === 'S') cur.done = true;
    else if (m === 'D') { bank.add(-cur.bet); sfx.chip(); cur.bet *= 2; cur.doubled = true; cur.cards.push(draw()); cur.done = true; }
    else if (m === 'P') {
      bank.add(-cur.bet); sfx.chip(); const [a, b] = cur.cards;
      const h1: Hand = { cards: [a, draw()], bet: cur.bet, done: false, doubled: false, split: true, seat: cur.seat };
      const h2: Hand = { cards: [b], bet: cur.bet, done: false, doubled: false, split: true, seat: cur.seat };
      if (a.r === 14 || total(h1.cards).t === 21) h1.done = true;
      g.hands.splice(g.cur, 1, h1, h2);
    }
    up(); if (!g.hands[g.cur] || g.hands[g.cur].done) setTimeout(next, 350);
  };
  const dt = total(g.hole ? g.dealer.slice(0, 1) : g.dealer).t;
  const staked = g.phase === 'bet' ? staked0() : g.hands.reduce((a, h) => a + h.bet, 0) + active().reduce((a, s) => a + (s.main > 0 ? s.pp + s.t3 : 0), 0);
  const bookCls = (m: Move) => (coach && tip?.m === m ? ' book' : '');
  const betting = g.phase === 'bet' || g.phase === 'done';
  const small = g.hands.length > 1;

  return (
    <Table tone={g.tone === 'push' ? '' : g.tone} say={g.msg} side={<>
      <Hud bank={bank.bank} bet={staked} delta={g.delta} onReset={() => { bank.reset(); up(); }} />
      {g.phase === 'player' ? (
        <div class="tg-actions">
          <button type="button" class={`tg-btn green${bookCls('H')}`} disabled={!tip} onClick={() => act('H')}>Karte</button>
          <button type="button" class={`tg-btn red${bookCls('S')}`} disabled={!tip} onClick={() => act('S')}>Halten</button>
          <button type="button" class={`tg-btn alt${bookCls('D')}`} disabled={!canDouble || !tip} onClick={() => act('D')}>Verdoppeln</button>
          <button type="button" class={`tg-btn alt${bookCls('P')}`} disabled={!canSplit || !tip} onClick={() => act('P')}>Teilen</button>
        </div>
      ) : g.phase !== 'dealer' && g.phase !== 'dealing' && (
        <>
          <div class="bj-n" role="group" aria-label="Anzahl der Hände">{[1, 2, 3].map((n) => <button type="button" key={n} class={g.n === n ? 'on' : ''} aria-pressed={g.n === n} onClick={() => setSeats(n)}>{n} {n === 1 ? 'Hand' : 'Hände'}</button>)}</div>
          <div style={{ marginTop: '12px' }}><ChipRack value={chip} onPick={(v) => { setChip(v); }} /></div>
          <div class="tg-actions">
            {g.phase === 'bet' ? <>
              <button type="button" class="tg-btn alt" disabled={staked0() === 0} onClick={() => { wipe(); up(); }}>Löschen</button>
              <button type="button" class="tg-btn" disabled={staked0() === 0} onClick={() => deal()}>Geben</button>
            </> : <>
              <button type="button" class="tg-btn" disabled={staked0() === 0 || active().reduce((a, s) => a + s.main, 0) > bank.bank} onClick={() => deal(true)}>Gleicher Einsatz ({fmt(staked0())})</button>
              <button type="button" class="tg-btn alt" onClick={() => { clearTable(); wipe(); up(); }}>Neuer Einsatz</button>
            </>}
          </div>
          <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: '.72rem', color: '#ffffffa0' }}>Jeton wählen, dann auf einen Kreis tippen. Perfect Pairs: 6 / 12 / 25 zu 1 · 21+3: 5 / 10 / 30 / 40 / 100 zu 1</p>
        </>
      )}
      </>} foot={<Coach on={coach} setOn={setCoach} book={bk} tip={tip ? <>{g.hands.length > 1 && cur && <b>Hand {cur.seat + 1}: </b>}<b>{NAME[tip.m]}.</b> {tip.why}</> : active().some((s) => s.pp + s.t3 > 0) ? 'Nebenwetten zahlen hoch, kosten aber mehr: Perfect Pairs hat rund 4 % Hausvorteil, 21+3 rund 3 %. Das Lehrbuch setzt sie nicht, weil die Hauptwette mit rund 0,5 % deutlich günstiger ist. Zum Ausprobieren mit Demo-Guthaben spricht nichts dagegen.' : 'Der Tipp erscheint, sobald du am Zug bist. Er folgt der Basisstrategie für 6 Decks. Mit ihr sinkt der Hausvorteil auf rund 0,5 %, verschwinden kann er nicht. Mehrere Hände ändern den Hausvorteil nicht, nur das Tempo.'} />}>
      <div class="tg-seat">
        <div class="tg-label">Bank</div>
        <div class="tg-hand">{g.dealer.map((c, i) => <CardView key={`d${i}`} card={c} down={i === 1 && g.hole} />)}</div>
        {g.dealer.length > 0 && <span class={`tg-total${dt > 21 ? ' bust' : ''}`}>{dt}</span>}
      </div>
      <Arc top="Blackjack zahlt 3 zu 2" sub="BANK HÄLT BEI ALLEN 17 · PERFECT PAIRS · 21+3" />
      <Msg tone={g.tone}>{g.msg}</Msg>
      <div class="bj-seats" data-n={g.n}>
        {active().map((s, si) => { const hs = g.hands.filter((h) => h.seat === si).reverse(); const seatBet = hs.length ? hs.reduce((a, h) => a + h.bet, 0) : s.main; return (
          <div class="bj-seat" key={si}>
            <div class="bj-hands">
              {hs.map((h) => { const hi = g.hands.indexOf(h); const { t, soft } = total(h.cards); return (
                <div class={`tg-seat${g.phase === 'player' && hi === g.cur ? ' turn' : ''}`} key={hi} style={{ opacity: g.phase === 'player' && hi !== g.cur ? 0.5 : 1 }}>
                  <div class="tg-hand">{h.cards.map((c, i) => <CardView key={`${hi}-${i}-${c.r}-${c.s}`} card={c} small={small} win={g.phase === 'done' && h.tone === 'w'} />)}</div>
                  {h.cards.length > 0 && <span class={`tg-total${t > 21 ? ' bust' : isBJ(h) ? ' bj' : ''}`}>{isBJ(h) ? 'Blackjack' : t > 21 ? `${t} · überkauft` : `${soft && t < 21 ? 'Soft ' : ''}${t}`}</span>}
                  {h.out && <span class={`bj-out ${h.tone}`}>{h.out}</span>}
                </div>); })}
            </div>
            <div class="bj-spots">
              <button type="button" class="tg-spot" onClick={() => addBet(si, 'main')} disabled={!betting} aria-label={`Hand ${si + 1}: Haupteinsatz setzen`}>{seatBet > 0 ? <ChipStack amount={seatBet} /> : g.n > 1 ? `Hand ${si + 1}` : 'Einsatz'}</button>
              <div class="bj-sides">
                {(['pp', 't3'] as const).map((k) => <button type="button" key={k} class={`tg-spot side${s.res.some((r) => r.w && r.t.startsWith(k === 'pp' ? 'PP' : '21+3')) ? ' hit' : ''}`} onClick={() => addBet(si, k)} disabled={!betting} aria-label={`Hand ${si + 1}: Nebenwette ${k === 'pp' ? 'Perfect Pairs' : '21+3'} setzen`}>{s[k] > 0 ? <ChipStack amount={s[k]} /> : k === 'pp' ? 'Perfect Pairs' : '21+3'}</button>)}
              </div>
            </div>
            <div class="tg-side-res">{s.res.map((r, i) => <span key={i} class={r.w ? 'w' : ''}>{r.t}</span>)}</div>
          </div>); })}
      </div>
    </Table>
  );
}
