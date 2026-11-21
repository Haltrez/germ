/** Ranking lists built from the official slot data. */
import { getSlotViews, rtpMax, type SlotView } from './slots.ts';

export interface Ranking { slug: string; name: string; title: string; description: string; h1: string; intro: string; note: string; pick: (all: SlotView[]) => SlotView[] }
const today = () => new Date().toISOString().slice(0, 10);
const playable = (v: SlotView) => v.data.demoUrl !== 'TODO' && !!v.data.demoUrl;

export const RANKINGS: Ranking[] = [
  {
    slug: 'hoechster-rtp', name: 'Höchste Auszahlungsquote',
    title: 'Slots mit höchster Auszahlungsquote: Top 50 nach RTP',
    description: 'Die 50 Spielautomaten mit dem höchsten RTP laut Hersteller, mit kostenloser Demo. Dazu: warum die Quote bei deutschen Anbietern oft niedriger ist.',
    h1: 'Slots mit der höchsten Auszahlungsquote',
    intro: 'Diese 50 Spielautomaten haben laut Hersteller die höchste Auszahlungsquote (RTP) in unserer Datenbank. Jeden kannst du kostenlos als Demo testen.',
    note: 'Die Werte sind Herstellerangaben für die Standardversion. Viele Spiele gibt es in mehreren RTP-Stufen, und bei Anbietern mit deutscher Erlaubnis liegt die Quote wegen der Einsatzsteuer oft niedriger. Der tatsächliche Wert steht in den Spielregeln des Slots.',
    pick: (all) => all.filter((v) => playable(v) && rtpMax(v.data) !== null && rtpMax(v.data)! < 99.5).sort((a, b) => rtpMax(b.data)! - rtpMax(a.data)! || a.data.name.localeCompare(b.data.name, 'de')).slice(0, 50),
  },
  {
    slug: 'hoechster-max-win', name: 'Höchster Maximalgewinn',
    title: 'Slots mit dem höchsten Max Win: Top 50',
    description: 'Die 50 Spielautomaten mit dem höchsten Maximalgewinn laut Hersteller, vom 50.000-Fachen aufwärts. Mit Demo und Einordnung, wie selten der Max Win ist.',
    h1: 'Slots mit dem höchsten Maximalgewinn',
    intro: 'Diese 50 Spielautomaten haben laut Hersteller den höchsten Maximalgewinn als Vielfaches des Einsatzes. Alle sind als kostenlose Demo spielbar.',
    note: 'Der Maximalgewinn ist ein theoretischer Höchstwert, der extrem selten erreicht wird. Ein hoher Wert geht fast immer mit sehr hoher Volatilität einher: lange Phasen ohne Gewinn sind normal. Bei 1 € Höchsteinsatz in Deutschland fällt der Betrag in Euro entsprechend kleiner aus.',
    pick: (all) => all.filter((v) => playable(v) && typeof v.data.maxWinMultiplier === 'number').sort((a, b) => (b.data.maxWinMultiplier as number) - (a.data.maxWinMultiplier as number)).slice(0, 50),
  },
  {
    slug: 'neue-slots', name: 'Neue Slots',
    title: 'Neue Slots kostenlos testen: die 50 neuesten Spiele',
    description: 'Die 50 neuesten Spielautomaten in unserer Datenbank, sortiert nach Erscheinungsdatum. Jeden neuen Slot kannst du sofort kostenlos als Demo spielen.',
    h1: 'Neue Slots kostenlos testen',
    intro: 'Hier findest du die 50 zuletzt erschienenen Spielautomaten, sortiert nach dem Erscheinungsdatum des Herstellers. Die Liste aktualisiert sich mit jeder neuen Veröffentlichung.',
    note: 'Das Datum stammt vom Hersteller. Ob und wann ein neuer Slot bei Anbietern mit deutscher Erlaubnis startet, entscheidet jeder Anbieter selbst.',
    pick: (all) => all.filter((v) => playable(v) && typeof v.data.releaseDate === 'string' && v.data.releaseDate !== 'TODO' && v.data.releaseDate <= today()).sort((a, b) => String(b.data.releaseDate).localeCompare(String(a.data.releaseDate))).slice(0, 50),
  },
];
export async function rankingRows(r: Ranking) { return r.pick(await getSlotViews()); }
