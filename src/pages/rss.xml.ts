import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE_NAME } from '../config/site.ts';

/** Feed of newly added slot pages (only slots that have a German text). */
export async function GET(context: APIContext) {
  const [slots, texts] = await Promise.all([getCollection('slots'), getCollection('slotTexts')]);
  const bySlot = new Map(texts.filter((t) => t.data.locale === 'de').map((t) => [t.data.slot, t.data]));
  const items = slots
    .filter((s) => bySlot.has(s.id))
    .map((s) => {
      const t = bySlot.get(s.id)!;
      return {
        title: `${s.data.name} kostenlos spielen`,
        description: t.metaDescription,
        link: `/spielautomaten/${s.id}/`,
        pubDate: new Date(t.updated),
      };
    })
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `Neue Slots – ${SITE_NAME}`,
    description: 'Neu hinzugefügte kostenlose Spielautomaten mit Demo und offiziellen Herstellerdaten.',
    site: context.site!,
    items,
    customData: '<language>de-de</language>',
    trailingSlash: true,
  });
}
