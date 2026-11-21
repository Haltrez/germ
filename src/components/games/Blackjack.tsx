/** Free blackjack: 6 decks, dealer stands on all 17s, blackjack pays 3:2, double after split. */
import { useRef, useState } from 'preact/hooks';
import { Arc, CardView, ChipRack, ChipStack, Coach, Hud, Table, fmt, newShoe, useBank, useBook, type Card } from './shared.tsx';

type Move = 'H' | 'S' | 'D' | 'P';
interface Hand { cards: Card[]; bet: number; done: boolean; doubled: boolean; split: boolean }
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

export default function Blackjack() {
  const bank = useBank();
  const bk = useBook('blackjack');
  const [chip, setChip] = useState(5);
  const [coach, setCoach] = useState(true);
  const [, force] = useState(0);
  const g = useRef({ phase: 'bet' as 'bet' | 'player' | 'dealer' | 'done', bet: 0, hands: [] as Hand[], dealer: [] as Card[], hole: true, cur: 0, msg: 'Setze deinen Einsatz', tone: '', delta: null as number | null, shoe: newShoe(6) }).current;
  const up = () => force((x) => x + 1);
  const draw = () => { if (g.shoe.length < 60) g.shoe = newShoe(6); return g.shoe.pop()!; };

  const addBet = () => { if (g.phase === 'done') { g.phase = 'bet'; g.bet = 0; g.hands = []; g.dealer = []; g.msg = 'Setze deinen Einsatz'; g.tone = ''; } if (g.phase !== 'bet') return; if (g.bet + chip <= bank.now() && g.bet + chip <= 500) g.bet += chip; up(); };
  const settle = () => {
    const d = total(g.dealer).t; const dBJ = g.dealer.length === 2 && d === 21;
    let back = 0, staked = 0;
    for (const h of g.hands) {
      staked += h.bet; const p = total(h.cards).t;
      if (p > 21) continue;
      if (isBJ(h) && !dBJ) back += h.bet * 2.5;
      else if (dBJ && !isBJ(h)) continue;
      else if (d > 21 || p > d) back += h.bet * 2;
      else if (p === d) back += h.bet;
    }
    bank.add(back); g.delta = back - staked; g.phase = 'done'; g.hole = false;
    g.msg = g.delta > 0 ? (g.hands.some(isBJ) && !dBJ ? `Blackjack! +${fmt(g.delta)}` : `Gewonnen! +${fmt(g.delta)}`) : g.delta === 0 ? 'Unentschieden – Einsatz zurück' : d === 21 && dBJ ? 'Die Bank hat Blackjack' : `Verloren ${fmt(g.delta)}`;
    g.tone = g.delta > 0 ? 'win' : g.delta < 0 ? 'lose' : '';
    bk.round(); up();
  };
  const dealerPlay = () => {
    g.phase = 'dealer'; g.hole = false; g.msg = 'Die Bank zieht …'; up();
    const step = () => { if (total(g.dealer).t < 17) { g.dealer.push(draw()); up(); setTimeout(step, 650); } else setTimeout(settle, 450); };
    setTimeout(step, 700);
  };
  const next = () => {
    while (g.cur < g.hands.length && g.hands[g.cur].done) g.cur++;
    if (g.cur < g.hands.length) { const h = g.hands[g.cur]; if (h.cards.length === 1) { h.cards.push(draw()); if (h.cards[0].r === 14 || total(h.cards).t === 21) { h.done = true; return next(); } } g.msg = g.hands.length > 1 ? `Hand ${g.cur + 1}: dein Zug` : 'Dein Zug'; up(); return; }
    if (g.hands.every((h) => total(h.cards).t > 21)) { g.hole = false; settle(); } else dealerPlay();
  };
  const deal = (rebet = false) => {
    if (rebet) { if (g.bet > bank.now()) g.bet = 0; g.phase = 'bet'; }
    if (g.phase !== 'bet' || g.bet <= 0) return;
    bank.add(-g.bet); g.delta = null; g.tone = '';
    g.hands = [{ cards: [draw()], bet: g.bet, done: false, doubled: false, split: false }]; g.dealer = [draw()]; g.hands[0].cards.push(draw()); g.dealer.push(draw());
    g.hole = true; g.cur = 0; g.phase = 'player';
    const dUp = val(g.dealer[0]); const dBJ = total(g.dealer).t === 21;
    if (isBJ(g.hands[0]) || ((dUp === 11 || dUp === 10) && dBJ)) { g.hands[0].done = true; up(); setTimeout(settle, 700); return; }
    g.msg = 'Dein Zug'; up();
  };
  const cur = g.hands[g.cur];
  const canDouble = !!cur && g.phase === 'player' && cur.cards.length === 2 && bank.bank >= cur.bet;
  const canSplit = !!cur && g.phase === 'player' && g.hands.length === 1 && cur.cards.length === 2 && val(cur.cards[0]) === val(cur.cards[1]) && bank.bank >= cur.bet;
  const tip = cur && g.phase === 'player' ? book(cur.cards, g.dealer[0], canDouble, canSplit) : null;
  const act = (m: Move) => {
    if (!cur || g.phase !== 'player' || !tip) return;
    bk.judge(m === tip.m, m === tip.m ? NAME[m] : `Lehrbuch: ${NAME[tip.m]}`);
    if (m === 'H') { cur.cards.push(draw()); if (total(cur.cards).t >= 21) cur.done = true; }
    else if (m === 'S') cur.done = true;
    else if (m === 'D') { bank.add(-cur.bet); cur.bet *= 2; cur.doubled = true; cur.cards.push(draw()); cur.done = true; }
    else if (m === 'P') { bank.add(-cur.bet); const [a, b] = cur.cards; g.hands = [{ cards: [a, draw()], bet: cur.bet, done: false, doubled: false, split: true }, { cards: [b], bet: cur.bet, done: false, doubled: false, split: true }]; if (a.r === 14) g.hands[0].done = true; if (total(g.hands[0].cards).t === 21) g.hands[0].done = true; g.cur = 0; }
    up(); if (!g.hands[g.cur] || g.hands[g.cur].done) setTimeout(next, 350);
  };
  const dt = total(g.hole ? g.dealer.slice(0, 1) : g.dealer).t;
  const staked = g.phase === 'bet' ? g.bet : g.hands.reduce((a, h) => a + h.bet, 0);
  const bookCls = (m: Move) => (coach && tip?.m === m ? ' book' : '');

  return (
    <Table>
      <Hud bank={bank.bank} bet={staked} delta={g.delta} onReset={() => { bank.reset(); up(); }} />
      <div class="tg-seat">
        <div class="tg-label">Bank</div>
        <div class="tg-hand">{g.dealer.map((c, i) => <CardView key={`d${i}`} card={c} down={i === 1 && g.hole} i={i} />)}</div>
        {g.dealer.length > 0 && <span class={`tg-total${dt > 21 ? ' bust' : ''}`}>{dt}</span>}
      </div>
      <Arc top="Blackjack zahlt 3 zu 2" sub="BANK HÄLT BEI ALLEN 17" />
      <div class={`tg-msg ${g.tone}`} aria-live="polite">{g.msg}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap' }}>
        {g.hands.length === 0 && <button type="button" class="tg-spot" onClick={addBet} aria-label="Einsatz setzen">{g.bet > 0 ? <ChipStack amount={g.bet} /> : 'Einsatz'}</button>}
        {g.hands.map((h, hi) => { const { t, soft } = total(h.cards); return (
          <div class="tg-seat" key={hi} style={{ opacity: g.phase === 'player' && hi !== g.cur ? 0.55 : 1 }}>
            <div class="tg-hand">{h.cards.map((c, i) => <CardView key={`${hi}-${i}`} card={c} small={g.hands.length > 1} i={i} win={g.phase === 'done' && isBJ(h)} />)}</div>
            <span class={`tg-total${t > 21 ? ' bust' : isBJ(h) ? ' bj' : ''}`}>{isBJ(h) ? 'Blackjack' : t > 21 ? `${t} · überkauft` : `${soft && t < 21 ? 'Soft ' : ''}${t}`}</span>
            <div style={{ marginTop: '10px', height: '50px' }}><ChipStack amount={h.bet} /></div>
          </div>); })}
      </div>
      {g.phase === 'player' ? (
        <div class="tg-actions">
          <button type="button" class={`tg-btn green${bookCls('H')}`} onClick={() => act('H')}>Karte</button>
          <button type="button" class={`tg-btn red${bookCls('S')}`} onClick={() => act('S')}>Halten</button>
          <button type="button" class={`tg-btn${bookCls('D')}`} disabled={!canDouble} onClick={() => act('D')}>Verdoppeln</button>
          <button type="button" class={`tg-btn alt${bookCls('P')}`} disabled={!canSplit} onClick={() => act('P')}>Teilen</button>
        </div>
      ) : g.phase !== 'dealer' && (
        <>
          <div style={{ marginTop: '18px' }}><ChipRack value={chip} onPick={(v) => { setChip(v); }} /></div>
          <div class="tg-actions">
            {g.phase === 'bet' && <button type="button" class="tg-btn alt" onClick={addBet}>+ {chip} setzen</button>}
            {g.phase === 'bet' && <button type="button" class="tg-btn alt" disabled={g.bet === 0} onClick={() => { g.bet = 0; up(); }}>Löschen</button>}
            {g.phase === 'bet' ? <button type="button" class="tg-btn" disabled={g.bet === 0} onClick={() => deal()}>Geben</button>
              : <><button type="button" class="tg-btn" disabled={g.bet > bank.bank} onClick={() => deal(true)}>Gleicher Einsatz ({fmt(g.bet)})</button><button type="button" class="tg-btn alt" onClick={() => { g.phase = 'bet'; g.bet = 0; g.hands = []; g.dealer = []; g.msg = 'Setze deinen Einsatz'; g.tone = ''; up(); }}>Neuer Einsatz</button></>}
          </div>
        </>
      )}
      <Coach on={coach} setOn={setCoach} book={bk} tip={tip ? <><b>{NAME[tip.m]}.</b> {tip.why}</> : 'Der Tipp erscheint, sobald du am Zug bist. Er folgt der Basisstrategie für 6 Decks. Mit ihr sinkt der Hausvorteil auf rund 0,5 %, verschwinden kann er nicht.'} />
    </Table>
  );
}
