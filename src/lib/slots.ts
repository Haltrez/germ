/** Slot data access + presentation helpers (German). */
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type CategoryCode } from '../config/routes.ts';
import { volatilityLabel, featureLabel, UNVERIFIED } from './i18n/de.ts';
import type { Slot } from '../schemas/index.ts';

export type SlotEntry = CollectionEntry<'slots'>;
export type ProviderEntry = CollectionEntry<'providers'>;
export type SlotTextEntry = CollectionEntry<'slotTexts'>;

export interface SlotView {
  id: string;
  data: Slot;
  provider: ProviderEntry | undefined;
  text: SlotTextEntry | undefined;
  categories: CategoryCode[];
  /** All slot pages are indexable (hand-written or data-driven review). */
  indexable: boolean;
  /** Has a hand-written German review (src/content/slot-texts/de). */
  reviewed: boolean;
  path: string;
}

/**
 * Categories = explicit data + rules derived from official facts:
 * Megaways / Hold & Win from features, Book from the name.
 */
/** Fruit slots: recognised by name (fruit symbols and the classic "Hot" fruit series). */
const FRUIT_NAME = /fruit|frucht|früchte|cherr|melon|berry|lemon|sizzling|ultra hot|always hot|supra hot|fire hot|shining hot|red hot|hot to burn|burning hot|striking hot|hottest|joker|sevens|\b7s\b|777|fruity|juicy|plenty of fruit/i;
/** Classic slots: 3 reels, or a fruit/sevens slot with few fixed lines and no free spins, cascades or Megaways. */
function isClassic(s: Slot): boolean {
  if (s.reels === 3) return true;
  const wl = s.winLines;
  const fewLines = typeof wl === 'object' && wl !== null && 'count' in wl && wl.type === 'lines' && typeof wl.count === 'number' && wl.count <= 10;
  return fewLines && FRUIT_NAME.test(s.name) && !/\bbook\b/i.test(s.name) && !s.features.includes('free-spins') && !s.features.includes('cascades') && !s.features.includes('megaways');
}

export function deriveCategories(s: Slot): CategoryCode[] {
  const set = new Set<CategoryCode>(s.categories);
  if (s.features.includes('megaways')) set.add('megaways');
  if (s.features.includes('hold-and-win')) set.add('hold-and-win');
  if (s.features.includes('bonus-buy')) set.add('bonus-buy');
  if (/\bbook\b/i.test(s.name)) set.add('book');
  if (FRUIT_NAME.test(s.name)) set.add('fruit');
  if (isClassic(s)) set.add('classic');
  return CATEGORIES.map((c) => c.code).filter((c) => set.has(c));
}

let cache: Promise<SlotView[]> | null = null;
export function getSlotViews(): Promise<SlotView[]> {
  cache ??= (async () => {
    const [slots, providers, texts] = await Promise.all([
      getCollection('slots'),
      getCollection('providers'),
      getCollection('slotTexts'),
    ]);
    const prov = new Map(providers.map((p) => [p.id, p]));
    const txt = new Map(texts.filter((t) => t.data.locale === 'de').map((t) => [t.data.slot, t]));
    return slots
      .map((s) => ({
        id: s.id,
        data: s.data,
        provider: prov.get(s.data.provider),
        text: txt.get(s.id),
        categories: deriveCategories(s.data),
        indexable: true,
        reviewed: txt.has(s.id),
        path: `/spielautomaten/${s.id}/`,
      }))
      .sort((a, b) =>
        Number(b.reviewed) - Number(a.reviewed) ||
        Number(!!b.data.thumbnail) - Number(!!a.data.thumbnail) ||
        a.data.name.localeCompare(b.data.name, 'de'));
  })();
  return cache;
}

const de = (n: number, digits = 2) => n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const isTodo = (v: unknown): v is 'TODO' => v === 'TODO';

export function rtpText(s: Slot): string {
  if (isTodo(s.rtp)) return UNVERIFIED;
  if (Array.isArray(s.rtp)) {
    const sorted = [...s.rtp].sort((a, b) => b - a);
    return sorted.length === 1 ? `${de(sorted[0])} %` : `${de(sorted[sorted.length - 1])}–${de(sorted[0])} %`;
  }
  return `${de(s.rtp)} %`;
}
/** Highest published RTP, for sorting. */
export function rtpMax(s: Slot): number | null {
  if (isTodo(s.rtp)) return null;
  return Array.isArray(s.rtp) ? Math.max(...s.rtp) : s.rtp;
}
export const maxWinText = (s: Slot) =>
  isTodo(s.maxWinMultiplier) ? UNVERIFIED : `${s.maxWinMultiplier.toLocaleString('de-DE')}× Einsatz`;
const VOL_NOTE_DE: Record<string, string> = {
  'low-medium': 'niedrig bis mittel', 'medium-high': 'mittel bis hoch', 'low-high': 'niedrig bis hoch (variabel)', 'extreme': 'extrem',
};
export const volatilityText = (s: Slot) => {
  const note = s.volatilityNote?.toLowerCase();
  if (note && VOL_NOTE_DE[note]) return `${VOL_NOTE_DE[note]} (laut Hersteller)`;
  if (isTodo(s.volatility)) return UNVERIFIED;
  return volatilityLabel[s.volatility] + (note && /\d\/\d/.test(note) ? ` (${note} laut Hersteller)` : '');
};
export const layoutText = (s: Slot) =>
  !isTodo(s.reels) && !isTodo(s.rows)
    ? `${s.reels} Walzen × ${String(s.rows).replace('-', '–')} Reihen`
    : s.grid ? `${s.grid} (Angabe des Herstellers)` : UNVERIFIED;
export function winLinesText(s: Slot) {
  if (isTodo(s.winLines)) return UNVERIFIED;
  const { type, count } = s.winLines;
  if (type === 'scatter-pays') return 'Gewinne überall auf dem Spielfeld';
  if (type === 'cluster') return 'Cluster-Gewinne';
  if (type === 'ways') return count ? `${count.toLocaleString('de-DE')} Gewinnwege` : 'variable Gewinnwege';
  return count ? `${count} Gewinnlinien` : 'Gewinnlinien';
}
export const featureList = (s: Slot) => s.features.map((f) => featureLabel[f]);

/** Same provider and/or shared mechanics, best matches first. */
export function similarSlots(all: SlotView[], me: SlotView, n = 6) {
  const myCats = new Set(me.categories);
  const myFeat = new Set(me.data.features);
  return all
    .filter((o) => o.id !== me.id)
    .map((o) => ({
      o,
      score:
        (o.data.provider === me.data.provider ? 2 : 0) +
        o.categories.filter((c) => myCats.has(c)).length * 3 +
        o.data.features.filter((f) => myFeat.has(f)).length +
        (o.indexable ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.o.data.name.localeCompare(b.o.data.name, 'de'))
    .slice(0, n)
    .map((x) => x.o);
}

/** Compact record for the client-side lobby filter (served as /api/slots.json). */
export const lobbyRecord = (v: SlotView) => ({
  s: v.id,
  n: v.data.name,
  p: v.provider?.data.name ?? v.data.provider,
  ps: v.data.provider,
  r: rtpMax(v.data),
  v: isTodo(v.data.volatility) ? null : v.data.volatility,
  m: isTodo(v.data.maxWinMultiplier) ? null : v.data.maxWinMultiplier,
  c: v.categories,
  d: !!v.data.demoUrl,
  t: v.data.thumbnail?.src ?? null,
  x: v.reviewed,
});
