/** Free European roulette (single zero). Inside bets on single numbers plus all outside bets. */
import { useRef, useState } from 'preact/hooks';
import { Msg, sfx, ChipRack, Coach, Hud, Table, fmt, rnd, useBank, useBook } from './shared.tsx';

const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const col = (n: number) => (n === 0 ? 'g' : RED.has(n) ? 'r' : 'b');
const SEG = 360 / 37;
type Key = string; // "n17", "red", "black", "even", "odd", "low", "high", "d1".."d3", "c1".."c3"
const OUT: { k: Key; label: string; span: number }[] = [
  { k: 'low', label: '1–18', span: 2 }, { k: 'even', label: 'Gerade', span: 2 }, { k: 'red', label: 'Rot', span: 2 },
  { k: 'black', label: 'Schwarz', span: 2 }, { k: 'odd', label: 'Ungerade', span: 2 }, { k: 'high', label: '19–36', span: 2 },
];
function wins(k: Key, n: number): number { // returns payout multiple (profit per unit) or -1
  if (k[0] === 'n') return Number(k.slice(1)) === n ? 35 : -1;
  if (n === 0) return -1;
  switch (k) {
    case 'red': return RED.has(n) ? 1 : -1; case 'black': return !RED.has(n) ? 1 : -1;
    case 'even': return n % 2 === 0 ? 1 : -1; case 'odd': return n % 2 === 1 ? 1 : -1;
    case 'low': return n <= 18 ? 1 : -1; case 'high': return n >= 19 ? 1 : -1;
    case 'd1': return n <= 12 ? 2 : -1; case 'd2': return n > 12 && n <= 24 ? 2 : -1; case 'd3': return n > 24 ? 2 : -1;
    case 'c1': return n % 3 === 1 ? 2 : -1; case 'c2': return n % 3 === 2 ? 2 : -1; case 'c3': return n % 3 === 0 ? 2 : -1;
  }
  return -1;
}
function Wheel() {
  const R = 100, r1 = 62;
  const pt = (a: number, rad: number) => { const x = (a - 90) * Math.PI / 180; return [100 + rad * Math.cos(x), 100 + rad * Math.sin(x)]; };
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <defs><radialGradient id="rl-g" cx="50%" cy="50%"><stop offset="60%" stop-color="#0000" /><stop offset="100%" stop-color="#0007" /></radialGradient></defs>
      {WHEEL.map((n, i) => { const a0 = i * SEG - SEG / 2, a1 = a0 + SEG; const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r1), [x3, y3] = pt(a0, r1); const [tx, ty] = pt(i * SEG, 88);
        return <g key={n}><path d={`M${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r1} ${r1} 0 0 0 ${x3} ${y3}Z`} fill={n === 0 ? '#1fbf7a' : RED.has(n) ? '#e5484d' : '#222c46'} stroke="#0c1220" stroke-width="1" /><text x={tx} y={ty} fill="#fff" font-size="8.5" font-family="Anton,sans-serif" text-anchor="middle" dominant-baseline="central" transform={`rotate(${i * SEG} ${tx} ${ty})`}>{n}</text></g>; })}
      <circle cx="100" cy="100" r={R} fill="url(#rl-g)" /><circle cx="100" cy="100" r={r1} fill="#141c30" stroke="#0c1220" stroke-width="2" />
      {[0, 45, 90, 135].map((a) => <line x1={pt(a, 58)[0]} y1={pt(a, 58)[1]} x2={pt(a + 180, 58)[0]} y2={pt(a + 180, 58)[1]} stroke="#26334f" stroke-width="2" stroke-linecap="round" />)}
    </svg>
  );
}

export default function Roulette() {
  const bank = useBank('roulette');
  const bk = useBook('roulette');
  const [chip, setChip] = useState(5);
  const [coach, setCoach] = useState(true);
  const [bets, setBets] = useState<Record<Key, number>>({});
  const [spin, setSpin] = useState({ wheel: 0, ball: 0, busy: false, hit: null as number | null });
  const [msg, setMsg] = useState({ t: 'Setze deine Jetons', tone: '' });
  const [delta, setDelta] = useState<number | null>(null);
  const [hist, setHist] = useState<number[]>([]);
  const last = useRef<Record<Key, number>>({});
  const total = Object.values(bets).reduce((a, b) => a + b, 0);
  const place = (k: Key) => { if (spin.busy) return; if (spin.hit !== null) setSpin((s) => ({ ...s, hit: null })); if (total + chip > bank.bank) return; sfx.chip(); setBets((b) => ({ ...b, [k]: (b[k] ?? 0) + chip })); };
  const go = () => {
    if (spin.busy || total <= 0 || total > bank.bank) return;
    const share = total / bank.bank;
    bk.judge(share <= 0.05, share <= 0.05 ? 'Einsatz im Rahmen' : `${Math.round(share * 100)} % des Guthabens in einem Dreh`);
    bank.add(-total); last.current = bets; setDelta(null);
    const n = WHEEL[rnd(37)]; const i = WHEEL.indexOf(n);
    const wheel = spin.wheel + 720 + rnd(360);
    const target = (((i * SEG + wheel) % 360) + 360) % 360;
    let ball = spin.ball - 1440; ball -= ((((ball - target) % 360) + 360) % 360);
    sfx.spin(); setSpin({ wheel, ball, busy: true, hit: null }); setMsg({ t: 'Nichts geht mehr …', tone: '' });
    setTimeout(() => {
      let back = 0; for (const [k, v] of Object.entries(bets)) { const w = wins(k, n); if (w > 0) back += v * (w + 1); }
      bank.add(back); const d = back - total; setDelta(d); setHist((h) => [n, ...h].slice(0, 12));
      setSpin((s) => ({ ...s, busy: false, hit: n })); setBets({});
      setMsg({ t: `${n} ${n === 0 ? 'Grün' : RED.has(n) ? 'Rot' : 'Schwarz'} · ${d > 0 ? `+${fmt(d)}` : d === 0 ? '±0' : fmt(d)}`, tone: d > 0 ? 'win' : d < 0 ? 'lose' : 'push' });
      bk.round();
    }, 5400);
  };
  const cell = (k: Key, label: string, cls: string, style?: Record<string, string>) => (
    <button type="button" key={k} class={`rl-cell ${cls}${spin.hit !== null && wins(k, spin.hit) > 0 ? ' hit' : ''}`} style={style} onClick={() => place(k)} aria-label={`Auf ${label} setzen`}>
      {label}{bets[k] ? <span class="tg-chip mini" data-v={bets[k] >= 100 ? 100 : bets[k] >= 25 ? 25 : bets[k] >= 5 ? 5 : 1} title={fmt(bets[k])} /> : null}
    </button>
  );
  const straight = Object.keys(bets).filter((k) => k[0] === 'n').length;
  const tip = total === 0
    ? 'Beim europäischen Roulette hat jede Wette denselben Hausvorteil von 2,70 %. Kein Setzsystem ändert das. Was du wählen kannst, ist die Schwankung: Einfache Chancen wie Rot oder Schwarz treffen oft und zahlen 1 zu 1, eine einzelne Zahl trifft selten und zahlt 35 zu 1.'
    : total / bank.bank > 0.05 ? `Du setzt ${Math.round((total / bank.bank) * 100)} % deines Guthabens in einem Dreh. Das Lehrbuch rät zu höchstens rund 5 % pro Runde, damit eine Pechsträhne dich nicht sofort aus dem Spiel wirft.`
    : straight > 6 ? 'Viele Einzelzahlen zu belegen erhöht die Trefferzahl, aber nicht die Auszahlung im Schnitt. Der Hausvorteil bleibt 2,70 % auf jeden gesetzten Jeton.'
    : 'Einsatz im Rahmen. Denk daran: Die Kugel hat kein Gedächtnis. Nach fünfmal Rot ist Schwarz nicht wahrscheinlicher.';
  return (
    <Table felt="red" tone={msg.tone} say={msg.t} side={<>
      <Hud bank={bank.bank} bet={total} delta={delta} onReset={bank.reset} />
          <div style={{ marginTop: '16px' }}><ChipRack value={chip} onPick={setChip} /></div>
          <div class="tg-actions">
            <button type="button" class="tg-btn" disabled={spin.busy || total === 0} onClick={go}>Drehen</button>
            <button type="button" class="tg-btn alt" disabled={spin.busy || total === 0} onClick={() => setBets({})}>Löschen</button>
            <button type="button" class="tg-btn alt" disabled={spin.busy || total > 0 || !Object.keys(last.current).length || Object.values(last.current).reduce((a, b) => a + b, 0) > bank.bank} onClick={() => { setBets(last.current); setSpin((s) => ({ ...s, hit: null })); }}>Wiederholen</button>
          </div>
      </>} foot={<Coach on={coach} setOn={setCoach} book={bk} tip={tip} />}>
      <div class="rl-wrap">
        <div>
          <div class="rl-wheel">
            <div class="rl-rot" style={{ transform: `rotate(${spin.wheel}deg)` }}><Wheel /></div>
            <div class="rl-ballring" style={{ transform: `rotate(${spin.ball}deg)` }}><div class="rl-ball" /></div>
            <div class="rl-hub">{spin.hit ?? ''}</div>
          </div>
          <Msg tone={msg.tone}>{msg.t}</Msg>
          <div class="rl-hist" aria-label="Letzte Zahlen">{hist.map((n, i) => <span key={i} class={col(n)}>{n}</span>)}</div>
        </div>
        <div>
          <div class="rl-board">
            {cell('n0', '0', 'g')}
            {[3, 2, 1].map((row) => <>{Array.from({ length: 12 }, (_, c) => { const n = c * 3 + row; return cell(`n${n}`, String(n), col(n)); })}{cell(`c${row === 3 ? 3 : row}`, '2:1', 'out')}</>)}
</div>
          <div class="rl-out three">{cell('d1', '1. Dutzend', 'out')}{cell('d2', '2. Dutzend', 'out')}{cell('d3', '3. Dutzend', 'out')}</div>
          <div class="rl-out six">{OUT.map((o) => cell(o.k, o.label, `out${o.k === 'red' ? ' r' : o.k === 'black' ? ' b' : ''}`))}</div>
        </div>
      </div>
    </Table>
  );
}
