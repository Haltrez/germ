/** Free Casino Hold'em: ante, flop, then call (2x ante) or fold. Dealer qualifies with a pair of fours. */
import { useRef, useState } from 'preact/hooks';
import { Msg, Arc, CardView, ChipRack, ChipStack, Coach, Hud, Table, fmt, newShoe, useBank, useBook, type Card } from './shared.tsx';

const CAT = ['Höchste Karte', 'Ein Paar', 'Zwei Paare', 'Drilling', 'Straße', 'Flush', 'Full House', 'Vierling', 'Straight Flush'];
/** Best five-card poker hand out of up to seven cards, as a comparable score. */
export function evalHand(cards: Card[]): number[] {
  const byRank = new Map<number, number>();
  for (const c of cards) byRank.set(c.r, (byRank.get(c.r) ?? 0) + 1);
  const groups = [...byRank.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const straightHigh = (rs: number[]) => { const u = [...new Set(rs)].sort((a, b) => b - a); if (u[0] === 14) u.push(1); for (let i = 0; i + 4 < u.length; i++) if (u[i] - u[i + 4] === 4) return u[i]; return 0; };
  let flush: number[] | null = null;
  for (let s = 0; s < 4; s++) { const f = cards.filter((c) => c.s === s).map((c) => c.r).sort((a, b) => b - a); if (f.length >= 5) flush = f; }
  if (flush) { const sf = straightHigh(flush); if (sf) return [8, sf]; }
  if (groups[0][1] === 4) return [7, groups[0][0], Math.max(...cards.filter((c) => c.r !== groups[0][0]).map((c) => c.r))];
  if (groups[0][1] === 3 && groups[1]?.[1] >= 2) return [6, groups[0][0], groups[1][0]];
  if (flush) return [5, ...flush.slice(0, 5)];
  const st = straightHigh(cards.map((c) => c.r)); if (st) return [4, st];
  const rest = (ex: number[], n: number) => [...byRank.keys()].filter((r) => !ex.includes(r)).sort((a, b) => b - a).slice(0, n);
  if (groups[0][1] === 3) return [3, groups[0][0], ...rest([groups[0][0]], 2)];
  if (groups[0][1] === 2 && groups[1]?.[1] === 2) return [2, groups[0][0], groups[1][0], ...rest([groups[0][0], groups[1][0]], 1)];
  if (groups[0][1] === 2) return [1, groups[0][0], ...rest([groups[0][0]], 3)];
  return [0, ...rest([], 5)];
}
export const cmp = (a: number[], b: number[]) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] ?? 0) - (b[i] ?? 0); if (d) return d; } return 0; };
export const handName = (s: number[]) => (s[0] === 8 && s[1] === 14 ? 'Royal Flush' : CAT[s[0]]);
const antePays = (s: number[]) => (s[0] === 8 ? (s[1] === 14 ? 100 : 20) : s[0] === 7 ? 10 : s[0] === 6 ? 3 : s[0] === 5 ? 2 : 1);

/** Simplified call/fold rule of thumb for the flop decision. */
function book(hole: Card[], flop: Card[]): { call: boolean; why: string } {
  const all = [...hole, ...flop]; const s = evalHand(all); const board = evalHand(flop);
  if (s[0] > board[0] || (s[0] >= 1 && hole.some((h) => flop.some((f) => f.r === h.r))) || hole[0].r === hole[1].r) return { call: true, why: `Du hältst bereits ${handName(s)}. Mitgehen.` };
  if (hole.some((c) => c.r >= 13)) return { call: true, why: 'Mit Ass oder König auf der Hand lohnt sich das Mitgehen fast immer.' };
  for (let su = 0; su < 4; su++) if (all.filter((c) => c.s === su).length >= 4 && hole.some((c) => c.s === su)) return { call: true, why: 'Vier Karten zum Flush: Mitgehen.' };
  const u = [...new Set(all.map((c) => c.r))].sort((a, b) => a - b);
  for (let i = 0; i + 3 < u.length; i++) if (u[i + 3] - u[i] === 3 && u[i] > 2 && u[i + 3] < 14 && hole.some((c) => c.r >= u[i] && c.r <= u[i + 3])) return { call: true, why: 'Offener Straßenzug (vier Karten in Folge): Mitgehen.' };
  const fl = flop.map((c) => c.r).sort((a, b) => b - a);
  if (hole.some((c) => c.r > fl[1])) return { call: true, why: 'Mindestens eine deiner Karten schlägt zwei der drei Flop-Karten. Das reicht zum Mitgehen.' };
  return { call: false, why: 'Zwei niedrige Karten ohne Paar und ohne Zug. Das Lehrbuch gibt hier auf und spart den doppelten Einsatz.' };
}

export default function Holdem() {
  const bank = useBank('casino-holdem');
  const bk = useBook('casino-holdem');
  const [chip, setChip] = useState(5);
  const [coach, setCoach] = useState(true);
  const [ante, setAnte] = useState(0);
  const [st, setSt] = useState({ phase: 'bet' as 'bet' | 'flop' | 'show' | 'done', hole: [] as Card[], dealer: [] as Card[], board: [] as Card[], call: 0, msg: 'Setze deinen Ante', tone: '', delta: null as number | null, pName: '', dName: '' });
  const deck = useRef<Card[]>([]);
  const lastAnte = useRef(0);
  const addAnte = () => { if (st.phase === 'done') { setSt((s) => ({ ...s, phase: 'bet', hole: [], dealer: [], board: [], call: 0, msg: 'Setze deinen Ante', tone: '', pName: '', dName: '' })); setAnte(chip * 3 <= bank.bank ? chip : 0); return; } if (st.phase === 'bet' && (ante + chip) * 3 <= bank.bank && ante + chip <= 200) setAnte(ante + chip); };
  const deal = (a = ante) => {
    if (a <= 0 || a * 3 > bank.bank) return;
    deck.current = newShoe(1); const d = () => deck.current.pop()!;
    bank.add(-a); lastAnte.current = a; setAnte(a);
    setSt({ phase: 'flop', hole: [d(), d()], dealer: [d(), d()], board: [d(), d(), d()], call: 0, msg: 'Mitgehen (2x Ante) oder aufgeben?', tone: '', delta: null, pName: '', dName: '' });
  };
  const tip = st.phase === 'flop' ? book(st.hole, st.board) : null;
  const decide = (call: boolean) => {
    if (st.phase !== 'flop' || !tip) return;
    bk.judge(call === tip.call, call === tip.call ? (call ? 'Mitgehen' : 'Aufgeben') : `Lehrbuch: ${tip.call ? 'Mitgehen' : 'Aufgeben'}`);
    if (!call) { setSt((s) => ({ ...s, phase: 'done', msg: `Aufgegeben · ${fmt(-ante)}`, tone: 'lose', delta: -ante })); bk.round(); return; }
    bank.add(-ante * 2);
    const board = [...st.board, deck.current.pop()!, deck.current.pop()!];
    setSt((s) => ({ ...s, phase: 'show', call: ante * 2, board, msg: 'Turn und River …' }));
    setTimeout(() => {
      const p = evalHand([...st.hole, ...board]), dl = evalHand([...st.dealer, ...board]);
      const qualifies = dl[0] > 1 || (dl[0] === 1 && dl[1] >= 4); const c = cmp(p, dl);
      let back = 0, msg = '';
      if (!qualifies) { back = ante * (1 + antePays(p)) + ante * 2; msg = 'Die Bank qualifiziert sich nicht: Ante gewinnt, Call zurück'; }
      else if (c > 0) { back = ante * (1 + antePays(p)) + ante * 4; msg = `Gewonnen mit ${handName(p)}`; }
      else if (c === 0) { back = ante * 3; msg = 'Unentschieden – Einsätze zurück'; }
      else msg = `Die Bank gewinnt mit ${handName(dl)}`;
      bank.add(back); const delta = back - ante * 3;
      setSt((s) => ({ ...s, phase: 'done', msg: `${msg} · ${delta > 0 ? `+${fmt(delta)}` : delta === 0 ? '±0' : fmt(delta)}`, tone: delta > 0 ? 'win' : delta < 0 ? 'lose' : 'push', delta, pName: handName(p), dName: handName(dl) + (qualifies ? '' : ' · nicht qualifiziert') }));
      bk.round();
    }, 1500);
  };
  const showDealer = st.phase === 'done' && st.call > 0;
  return (
    <Table felt="purple" tone={st.tone} say={st.msg} side={<>
      <Hud bank={bank.bank} bet={st.phase === 'bet' ? ante : ante + st.call} delta={st.delta} onReset={bank.reset} />
      {st.phase === 'flop' ? (
        <div class="tg-actions">
          <button type="button" class={`tg-btn green${coach && tip?.call ? ' book' : ''}`} onClick={() => decide(true)}>Mitgehen ({fmt(ante * 2)})</button>
          <button type="button" class={`tg-btn red${coach && tip && !tip.call ? ' book' : ''}`} onClick={() => decide(false)}>Aufgeben</button>
        </div>
      ) : st.phase !== 'show' && (
        <>
          <div style={{ marginTop: '18px' }}><ChipRack value={chip} onPick={setChip} /></div>
          <div class="tg-actions">
            {st.phase === 'bet' ? <><button type="button" class="tg-btn alt" onClick={addAnte}>+ {chip} Ante</button><button type="button" class="tg-btn alt" disabled={ante === 0} onClick={() => setAnte(0)}>Löschen</button><button type="button" class="tg-btn" disabled={ante === 0} onClick={() => deal()}>Geben</button></>
              : <><button type="button" class="tg-btn" disabled={lastAnte.current * 3 > bank.bank} onClick={() => deal(lastAnte.current)}>Gleicher Ante ({fmt(lastAnte.current)})</button><button type="button" class="tg-btn alt" onClick={addAnte}>Neuer Einsatz</button></>}
          </div>
        </>
      )}
      </>} foot={<Coach on={coach} setOn={setCoach} book={bk} tip={tip ? <><b>{tip.call ? 'Mitgehen.' : 'Aufgeben.'}</b> {tip.why}</> : 'Die einzige Entscheidung fällt nach dem Flop: mitgehen oder aufgeben. Als Faustregel gilt, in etwa vier von fünf Händen mitzugehen. Aufgeben ist nur bei zwei niedrigen Karten ohne Paar und ohne Zug richtig. Der Hausvorteil liegt bei guter Spielweise bei gut 2 % des Ante.'} />}>
      <div class="tg-seat">
        <div class="tg-label">Bank</div>
        <div class="tg-hand" style={{ minHeight: '96px' }}>{st.dealer.map((c, i) => <CardView key={`d${i}`} card={c} small down={!showDealer} i={i} />)}</div>
        {st.dName && showDealer && <span class="tg-total">{st.dName}</span>}
      </div>
      <div class="tg-seat" style={{ marginTop: '10px' }}>
        <div class="tg-label">Gemeinschaftskarten</div>
        <div class="tg-hand">{st.board.map((c, i) => <CardView key={`b${i}`} card={c} i={i} />)}</div>
      </div>
      <Arc top="Casino Hold'em" sub="BANK QUALIFIZIERT SICH AB PAAR VIEREN" />
      <Msg tone={st.tone}>{st.msg}</Msg>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '26px', flexWrap: 'wrap' }}>
        <div class="tg-seat">
          <div class="tg-hand">{st.hole.map((c, i) => <CardView key={`h${i}`} card={c} i={i} />)}</div>
          {st.pName ? <span class="tg-total bj">{st.pName}</span> : st.hole.length > 0 && <span class="tg-total">{handName(evalHand([...st.hole, ...st.board]))}</span>}
        </div>
        <button type="button" class="tg-spot" style={{ margin: 0 }} onClick={addAnte} aria-label="Ante setzen">{ante > 0 ? <ChipStack amount={ante} /> : 'Ante'}</button>
        {st.call > 0 && <span class="tg-spot" style={{ cursor: 'default', margin: 0 }}><ChipStack amount={st.call} /></span>}
      </div>
    </Table>
  );
}
