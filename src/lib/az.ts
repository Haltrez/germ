/** A–Z directory helpers: group slots by first letter (digits → "0-9"). */
import type { SlotView } from './slots.ts';
export const letterOf = (name: string) => {
  const c = name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().charAt(0).toLowerCase();
  return /[a-z]/.test(c) ? c : '0-9';
};
export const LETTERS = ['0-9', ...'abcdefghijklmnopqrstuvwxyz'.split('')];
export function groupByLetter(views: SlotView[]) {
  const m = new Map<string, SlotView[]>();
  for (const v of views) { const l = letterOf(v.data.name); m.set(l, [...(m.get(l) ?? []), v]); }
  for (const list of m.values()) list.sort((a, b) => a.data.name.localeCompare(b.data.name, 'de'));
  return m;
}
