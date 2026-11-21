/** Free craps with the core bets: Pass, Don't Pass, Field, Any Seven, Place 6 and Place 8. */
import { useState } from 'preact/hooks';
import { Arc, ChipRack, ChipStack, Coach, Hud, Table, fmt, rnd, useBank, useBook } from './shared.tsx';

type Bet = 'pass' | 'dont' | 'field' | 'seven' | 'p6' | 'p8';
const ZERO: Record<Bet, number> = { pass: 0, dont: 0, field: 0, seven: 0, p6: 0, p8: 0 };
const BOX: { k: Bet; name: string; pays: string; edge: string; cls: string }[] = [
  { k: 'pass', name: 'Pass Line', pays: 'zahlt 1 zu 1', edge: 'Hausvorteil 1,41 %', cls: 'good' },
  { k: 'dont', name: "Don't Pass", pays: 'zahlt 1 zu 1', edge: 'Hausvorteil 1,36 %', cls: 'good' },
  { k: 'p6', name: 'Place 6', pays: 'zahlt 7 zu 6', edge: 'Hausvorteil 1,52 %', cls: 'good' },
  { k: 'p8', name: 'Place 8', pays: 'zahlt 7 zu 6', edge: 'Hausvorteil 1,52 %', cls: 'good' },
  { k: 'field', name: 'Field', pays: '3·4·9·10·11 · 2 doppelt · 12 dreifach', edge: 'Hausvorteil 2,78 %', cls: '' },
  { k: 'seven', name: 'Any Seven', pays: 'zahlt 4 zu 1', edge: 'Hausvorteil 16,67 %', cls: 'bad' },
];
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const ROT: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
function Die({ v, turns, rolling }: { v: number; turns: number; rolling: boolean }) {
  const [x, y] = ROT[v];
  return (
    <div class="dc-tilt"><div class={`dc-die${rolling ? ' roll' : ''}`} style={{ transform: `rotateX(${x + turns * 360}deg) rotateY(${y + turns * 360}deg)` }}>
      {[1, 2, 3, 4, 5, 6].map((f) => <div key={f} class={`dc-f f${f}`}>{Array.from({ length: 9 }, (_, i) => (PIPS[f].includes(i) ? <i key={i} /> : <span key={i} />))}</div>)}
    </div></div>
  );
}
export default function Craps() {
  const bank = useBank();
  const bk = useBook('craps');
  const [chip, setChip] = useState(5);
  const [coach, setCoach] = useState(true);
  const [bets, setBets] = useState<Record<Bet, number>>({ ...ZERO });
  const [st, setSt] = useState({ d: [3, 4] as [number, number], turns: 0, rolling: false, point: null as number | null, msg: 'Come-Out-Wurf: Setze auf Pass oder Don\'t Pass', tone: '', delta: null as number | null, hit: [] as Bet[] });
  const total = Object.values(bets).reduce((a, b) => a + b, 0);
  const allowed = (k: Bet) => (k === 'pass' || k === 'dont' ? st.point === null : k === 'p6' || k === 'p8' ? st.point !== null : true);
  const place = (k: Bet) => { if (st.rolling || !allowed(k) || chip > bank.bank) return; bank.add(-chip); setBets((b) => ({ ...b, [k]: b[k] + chip })); };
  const clear = () => { // only bets that are not locked by an established point
    const keep = st.point !== null ? { pass: bets.pass, dont: bets.dont } : { pass: 0, dont: 0 };
    bank.add(total - keep.pass - keep.dont); setBets({ ...ZERO, ...keep });
  };
  const roll = () => {
    if (st.rolling || total <= 0) return;
    bk.judge(bets.seven === 0 && bets.field === 0, bets.seven > 0 ? 'Any Seven hat 16,67 % Hausvorteil' : bets.field > 0 ? 'Field ist teurer als die Pass Line' : 'Nur Wetten mit niedrigem Hausvorteil');
    const d: [number, number] = [rnd(6) + 1, rnd(6) + 1]; const sum = d[0] + d[1];
    setSt((s) => ({ ...s, d, turns: s.turns + 2, rolling: true, hit: [], msg: 'Die Würfel rollen …', tone: '' }));
    setTimeout(() => {
      const nb = { ...bets }; let back = 0; let point = st.point; const hit: Bet[] = []; let text = `${sum} gewürfelt`;
      const win = (k: Bet, mult: number) => { back += nb[k] * (1 + mult); if (nb[k] > 0) hit.push(k); nb[k] = 0; };
      const lose = (k: Bet) => { nb[k] = 0; };
      const push = (k: Bet) => { back += nb[k]; nb[k] = 0; };
      // one-roll bets
      if ([3, 4, 9, 10, 11].includes(sum)) win('field', 1); else if (sum === 2) win('field', 2); else if (sum === 12) win('field', 3); else lose('field');
      if (sum === 7) win('seven', 4); else lose('seven');
      if (point === null) {
        if (sum === 7 || sum === 11) { win('pass', 1); lose('dont'); text += ' · Pass gewinnt'; }
        else if (sum === 2 || sum === 3) { lose('pass'); win('dont', 1); text += " · Craps, Don't Pass gewinnt"; }
        else if (sum === 12) { lose('pass'); push('dont'); text += ' · Craps, Don\'t Pass unentschieden'; }
        else { point = sum; text += ` · Point ist ${sum}`; }
      } else {
        if (sum === 6 && nb.p6 > 0) { back += nb.p6 * 7 / 6; hit.push('p6'); }
        if (sum === 8 && nb.p8 > 0) { back += nb.p8 * 7 / 6; hit.push('p8'); }
        if (sum === point) { win('pass', 1); lose('dont'); push('p6'); push('p8'); point = null; text += ' · Point getroffen, Pass gewinnt'; }
        else if (sum === 7) { lose('pass'); win('dont', 1); lose('p6'); lose('p8'); point = null; text += " · Seven Out, Don't Pass gewinnt"; }
      }
      const lost = total - Object.values(nb).reduce((a, b) => a + b, 0); const delta = back - lost;
      bank.add(back); setBets(nb);
      setSt((s) => ({ ...s, rolling: false, point, hit, delta, tone: delta > 0 ? 'win' : delta < 0 ? 'lose' : '', msg: `${text}${delta !== 0 ? ` · ${delta > 0 ? '+' : ''}${fmt(delta)}` : ''}` }));
      bk.round();
    }, 1250);
  };
  const tip = bets.seven > 0 ? 'Any Seven ist die teuerste Wette am Tisch: 16,67 % Hausvorteil. Das Lehrbuch lässt alle Einmal-Wetten in der Tischmitte aus.'
    : bets.field > 0 ? 'Field wirkt großzügig, weil viele Zahlen gewinnen. Die häufigsten Würfe 5, 6, 7 und 8 verlieren aber. Hausvorteil 2,78 %, doppelt so hoch wie Pass Line.'
    : st.point === null ? 'Im Come-Out-Wurf rät das Lehrbuch zu Pass Line (1,41 %) oder Don\'t Pass (1,36 %). Das sind die günstigsten Wetten im Spiel.'
    : `Der Point ist ${st.point}. Deine Pass- oder Don't-Pass-Wette bleibt stehen, bis der Point oder eine 7 fällt. Place 6 und Place 8 sind mit 1,52 % die einzigen Zusatzwetten, die das Lehrbuch gelten lässt.`;
  return (
    <Table>
      <Hud bank={bank.bank} bet={total} delta={st.delta} onReset={() => { bank.reset(); setBets({ ...ZERO }); setSt((s) => ({ ...s, point: null })); }} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
        <span class={`dc-puck ${st.point ? 'on' : 'off'}`}>{st.point ? `ON ${st.point}` : 'OFF'}</span>
        <span class="tg-label" style={{ margin: 0 }}>{st.point ? `Point ${st.point}` : 'Come-Out'}</span>
      </div>
      <div class="dc-stage"><Die v={st.d[0]} turns={st.turns} rolling={st.rolling} /><Die v={st.d[1]} turns={st.turns} rolling={st.rolling} /></div>
      <Arc top="Craps" sub="PASS LINE GEWINNT BEI 7 ODER 11" />
      <div class={`tg-msg ${st.tone}`} aria-live="polite">{st.msg}</div>
      <div class="tg-bets" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
        {BOX.map((x) => <button type="button" key={x.k} class={`tg-bet${st.hit.includes(x.k) ? ' hit' : ''}${allowed(x.k) ? '' : ' off'}`} onClick={() => place(x.k)} aria-disabled={!allowed(x.k)}><b>{x.name}</b><small>{x.pays}</small><span class={`edge ${x.cls}`}>{x.edge}</span>{bets[x.k] > 0 && <ChipStack amount={bets[x.k]} />}</button>)}
      </div>
      <div style={{ marginTop: '18px' }}><ChipRack value={chip} onPick={setChip} /></div>
      <div class="tg-actions">
        <button type="button" class="tg-btn" disabled={st.rolling || total === 0} onClick={roll}>Würfeln</button>
        <button type="button" class="tg-btn alt" disabled={st.rolling || total === 0} onClick={clear}>Löschen</button>
      </div>
      <Coach on={coach} setOn={setCoach} book={bk} tip={tip} />
    </Table>
  );
}
