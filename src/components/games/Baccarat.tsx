/** Free baccarat (Punto Banco): 8 decks, banker pays 0.95 to 1, tie pays 8 to 1. */
import { useRef, useState } from 'preact/hooks';
import { Msg, sfx, Arc, CardView, ChipRack, ChipStack, Coach, Hud, Table, fmt, newShoe, useBank, useBook, type Card } from './shared.tsx';

type Side = 'player' | 'banker' | 'tie';
const pv = (c: Card) => (c.r === 14 ? 1 : c.r >= 10 ? 0 : c.r);
const tot = (cs: Card[]) => cs.reduce((a, c) => a + pv(c), 0) % 10;
/** Standard third-card rule for the banker. p3 is the value of the player's third card, or null. */
function bankerDraws(b: number, p3: number | null) {
  if (p3 === null) return b <= 5;
  if (b <= 2) return true; if (b === 3) return p3 !== 8; if (b === 4) return p3 >= 2 && p3 <= 7; if (b === 5) return p3 >= 4 && p3 <= 7; if (b === 6) return p3 === 6 || p3 === 7;
  return false;
}
const BOX: { k: Side; name: string; pays: string; edge: string; cls: string }[] = [
  { k: 'player', name: 'Spieler', pays: 'zahlt 1 zu 1', edge: 'Hausvorteil 1,24 %', cls: 'good' },
  { k: 'tie', name: 'Unentschieden', pays: 'zahlt 8 zu 1', edge: 'Hausvorteil 14,36 %', cls: 'bad' },
  { k: 'banker', name: 'Bank', pays: 'zahlt 0,95 zu 1', edge: 'Hausvorteil 1,06 %', cls: 'good' },
];
export default function Baccarat() {
  const bank = useBank('baccarat');
  const bk = useBook('baccarat');
  const [chip, setChip] = useState(5);
  const [coach, setCoach] = useState(true);
  const [bets, setBets] = useState<Record<Side, number>>({ player: 0, banker: 0, tie: 0 });
  const [st, setSt] = useState({ p: [] as Card[], b: [] as Card[], busy: false, win: null as Side | null, msg: 'Setze auf Spieler, Bank oder Unentschieden', tone: '', delta: null as number | null });
  const shoe = useRef(newShoe(8));
  const last = useRef({ player: 0, banker: 0, tie: 0 });
  const total = bets.player + bets.banker + bets.tie;
  const place = (k: Side) => { if (st.busy) return; if (st.win) setSt((s) => ({ ...s, win: null, p: [], b: [], msg: 'Setze deinen Einsatz', tone: '' })); if (total + chip <= bank.bank) { sfx.chip(); setBets((x) => ({ ...x, [k]: x[k] + chip })); } };
  const deal = () => {
    if (st.busy || total <= 0 || total > bank.bank) return;
    bk.judge(bets.tie === 0, bets.tie === 0 ? (bets.banker >= bets.player ? 'Bank ist die beste Wette' : 'Spieler ist fast so gut wie Bank') : 'Unentschieden hat 14,36 % Hausvorteil');
    if (shoe.current.length < 30) shoe.current = newShoe(8);
    const d = () => shoe.current.pop()!;
    const p = [d()], b = [d()]; p.push(d()); b.push(d());
    const steps: (() => void)[] = [];
    const pt = tot(p), bt = tot(b);
    let p3: Card | null = null, b3: Card | null = null;
    if (pt < 8 && bt < 8) { if (pt <= 5) p3 = d(); if (bankerDraws(bt, p3 ? pv(p3) : null)) b3 = d(); }
    bank.add(-total); last.current = bets;
    setSt({ p: p.slice(0, 2), b: b.slice(0, 2), busy: true, win: null, msg: 'Karten werden gegeben …', tone: '', delta: null });
    if (p3) steps.push(() => setSt((s) => ({ ...s, p: [...p, p3!], msg: 'Spieler zieht eine dritte Karte' })));
    if (b3) steps.push(() => setSt((s) => ({ ...s, b: [...b, b3!], msg: 'Bank zieht eine dritte Karte' })));
    steps.push(() => {
      const fp = tot(p3 ? [...p, p3] : p), fb = tot(b3 ? [...b, b3] : b);
      const win: Side = fp > fb ? 'player' : fb > fp ? 'banker' : 'tie';
      let back = 0;
      if (win === 'player') back = bets.player * 2; else if (win === 'banker') back = bets.banker * 1.95; else back = bets.tie * 9 + bets.player + bets.banker;
      bank.add(back); const delta = back - total;
      setSt((s) => ({ ...s, busy: false, win, delta, tone: delta > 0 ? 'win' : delta < 0 ? 'lose' : 'push', msg: `${win === 'player' ? 'Spieler gewinnt' : win === 'banker' ? 'Bank gewinnt' : 'Unentschieden'} ${fp} : ${fb} · ${delta > 0 ? `+${fmt(delta)}` : delta === 0 ? '±0' : fmt(delta)}` }));
      setBets({ player: 0, banker: 0, tie: 0 }); bk.round();
    });
    steps.forEach((f, i) => setTimeout(f, 1100 + i * 900));
  };
  const tip = bets.tie > 0 ? 'Unentschieden lockt mit 8 zu 1, hat aber 14,36 % Hausvorteil. Das Lehrbuch lässt diese Wette aus.'
    : total === 0 ? 'Baccarat ist reines Glück, es gibt keine Entscheidung nach dem Setzen. Das Lehrbuch ist kurz: Bank hat mit 1,06 % den niedrigsten Hausvorteil, Spieler liegt mit 1,24 % knapp dahinter. Unentschieden meiden.'
    : bets.banker > 0 ? 'Bank ist die Wette mit dem niedrigsten Hausvorteil (1,06 %), trotz 5 % Kommission auf den Gewinn.' : 'Spieler hat 1,24 % Hausvorteil und zahlt ohne Kommission. Eine solide Wahl.';
  return (
    <Table felt="blue" tone={st.tone} say={st.msg}>
      <Hud bank={bank.bank} bet={total} delta={st.delta} onReset={bank.reset} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {([['player', 'Spieler', st.p], ['banker', 'Bank', st.b]] as const).map(([k, name, cs]) => (
          <div class="tg-seat" key={k}>
            <div class="tg-label">{name}</div>
            <div class="tg-hand">{cs.map((c, i) => <CardView key={`${k}${i}`} card={c} i={i} win={st.win === k} />)}</div>
            {cs.length > 0 && <span class={`tg-total${st.win === k ? ' bj' : ''}`}>{tot(cs)}</span>}
          </div>
        ))}
      </div>
      <Arc top="Punto Banco" sub="DIE HAND NÄHER AN 9 GEWINNT" />
      <Msg tone={st.tone}>{st.msg}</Msg>
      <div class="tg-bets" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {BOX.map((x) => <button type="button" key={x.k} class={`tg-bet${st.win === x.k ? ' hit' : ''}`} onClick={() => place(x.k)}><b>{x.name}</b><small>{x.pays}</small><span class={`edge ${x.cls}`}>{x.edge}</span>{bets[x.k] > 0 && <ChipStack amount={bets[x.k]} />}</button>)}
      </div>
      <div style={{ marginTop: '18px' }}><ChipRack value={chip} onPick={setChip} /></div>
      <div class="tg-actions">
        <button type="button" class="tg-btn" disabled={st.busy || total === 0} onClick={deal}>Geben</button>
        <button type="button" class="tg-btn alt" disabled={st.busy || total === 0} onClick={() => setBets({ player: 0, banker: 0, tie: 0 })}>Löschen</button>
        <button type="button" class="tg-btn alt" disabled={st.busy || total > 0 || last.current.player + last.current.banker + last.current.tie === 0 || last.current.player + last.current.banker + last.current.tie > bank.bank} onClick={() => { setBets(last.current); setSt((s) => ({ ...s, win: null, p: [], b: [] })); }}>Wiederholen</button>
      </div>
      <Coach on={coach} setOn={setCoach} book={bk} tip={tip} />
    </Table>
  );
}
