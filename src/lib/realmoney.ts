/** GGL-verified operators for real-money CTAs (box above reviews, demo prompt, table-game prompt). */
import { getCollection } from 'astro:content';
import { isPromotable, AFFILIATE_REL } from './compliance.ts';

export interface RealMoneyOp {
  id: string;
  name: string;
  logo: string | null;
  tag: string | null;
  /** Welcome offer as stated by the operator, if verified. */
  offer: string | null;
  href: string;
  rel: string;
  /** True when href is a tracked affiliate link (needs the "Anzeige" label). */
  affiliate: boolean;
}

export async function realMoneyOps(limit = 4): Promise<RealMoneyOp[]> {
  return (await getCollection('operators'))
    .filter((o) => isPromotable(o.data) && (o.data.affiliateUrl || o.data.websiteUrl !== 'TODO'))
    // These boxes and popups are advertising (labelled "Anzeige"): partners with a tracking link come first.
    // The editorial comparison on /echtgeld-spielotheken/ keeps its own order and is not affected.
    .sort((a, b) => Number(!!b.data.affiliateUrl) - Number(!!a.data.affiliateUrl) || a.data.sortOrder - b.data.sortOrder || (b.data.rating?.total ?? 0) - (a.data.rating?.total ?? 0))
    .slice(0, limit)
    .map((o) => ({
      id: o.id,
      name: o.data.name,
      logo: o.data.logo ?? null,
      tag: o.data.strengthTag ?? null,
      offer: o.data.bonusText !== 'TODO' ? o.data.bonusText : null,
      href: (o.data.affiliateUrl ?? o.data.websiteUrl) as string,
      rel: o.data.affiliateUrl ? AFFILIATE_REL : 'nofollow noopener',
      affiliate: !!o.data.affiliateUrl,
    }));
}
