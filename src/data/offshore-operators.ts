/**
 * Offshore (non-German-licensed) operators shown ONLY on /krypto-spielotheken/,
 * together with an offshore disclaimer. The dist audit allows these affiliate URLs
 * on that page only and requires the [data-offshore-disclaimer] block to be present.
 * Plain TS: imported by the page and by scripts/compliance-dist.ts.
 */
export const OFFSHORE_PAGE_PATH = '/krypto-spielotheken/';

export interface OffshoreOperator {
  id: string;
  name: string;
  /** Tracking link. Rendered as a sponsored link with an "Anzeige" label. */
  affiliateUrl?: string;
  /** Plain website link, used until a tracking link exists (no "Anzeige", rel="nofollow"). */
  websiteUrl?: string;
  license: string;
  logo?: string;
  /** Omit until the operator's current offer is confirmed. */
  bonusText?: string;
  bonusNote?: string;
  /** Shown first with the "Unsere Empfehlung" badge. */
  topPick?: boolean;
}

export const OFFSHORE_OPERATORS: OffshoreOperator[] = [
  {
    id: 'koalabet',
    name: 'KoalaBet',
    affiliateUrl: 'https://click.koalabetaffiliates.com/redirect.aspx?pid=2408&lpid=8&bid=1479',
    logo: '/operators/koalabet.png',
    license: 'Offshore-Lizenz (Komoren)',
    bonusText: 'Bis zu 700 $',
    bonusNote: 'Willkommensbonus',
    topPick: true,
  },
  {
    id: '7bitcasino',
    name: '7BitCasino',
    affiliateUrl: 'https://7bit.partners/pumbaxt1d',
    logo: '/operators/7bitcasino.svg',
    license: 'Offshore-Lizenz (Curaçao)',
    bonusText: '325 % + 250 Freispiele',
    bonusNote: 'Willkommensbonus',
  },
  {
    id: 'miraxcasino',
    name: 'Mirax Casino',
    affiliateUrl: 'https://mirax.partners/pozice6cz',
    logo: '/operators/miraxcasino.svg',
    license: 'Offshore-Lizenz (Curaçao)',
    bonusText: '325 % + 150 Freispiele',
    bonusNote: 'Willkommenspaket bis zu 5 BTC',
  },
  {
    id: 'playamo',
    name: 'PlayAmo',
    affiliateUrl: 'https://mo.zenlaneo.com/redirect.aspx?pid=422914&bid=1511&lpid=87',
    logo: '/operators/playamo.svg',
    license: 'Offshore-Lizenz (Curaçao)',
    bonusText: '200 € Bonus + 50 Freirunden',
    bonusNote: 'Willkommensbonus',
  },
  {
    id: 'duel',
    name: 'Duel',
    affiliateUrl: 'https://duel.com/r/scatterdrop',
    logo: '/operators/duel.svg',
    license: 'Offshore-Lizenz (Komoren)',
  },
];
