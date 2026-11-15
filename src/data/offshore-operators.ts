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
  affiliateUrl: string;
  license: string;
  bonusText: string;
  bonusNote?: string;
}

export const OFFSHORE_OPERATORS: OffshoreOperator[] = [
  {
    id: '7bitcasino',
    name: '7BitCasino',
    affiliateUrl: 'https://7bit.partners/pumbaxt1d',
    license: 'Offshore-Lizenz (Curaçao)',
    bonusText: '325 % + 250 Freispiele',
    bonusNote: 'Willkommensbonus',
  },
  {
    id: 'miraxcasino',
    name: 'Mirax Casino',
    affiliateUrl: 'https://mirax.partners/pozice6cz',
    license: 'Offshore-Lizenz (Curaçao)',
    bonusText: '325 % + 150 Freispiele',
    bonusNote: 'Willkommenspaket bis zu 5 BTC',
  },
];
