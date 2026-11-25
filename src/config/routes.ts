/**
 * Route registry: navigation, categories and stub pages.
 * Plain TS, importable from Node (astro.config.mjs and scripts).
 */

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

/**
 * Slot categories. `code` is language-neutral (used in data files),
 * `slug` / `label` are the German presentation.
 *
 * bonus-buy: demo-only category. Feature purchase is not offered at
 *   GGL-licensed sites; the category page says so explicitly.
 * Deliberately NOT included:
 * - jackpot: jackpots are not permitted for virtual slot machines in Germany.
 */
export const CATEGORIES = [
  { code: 'book', slug: 'book-slots', label: 'Book-Slots', short: 'Book-Slots' },
  { code: 'hold-and-win', slug: 'hold-and-win', label: 'Hold & Win Slots', short: 'Hold & Win' },
  { code: 'megaways', slug: 'megaways', label: 'Megaways-Slots', short: 'Megaways' },
  { code: 'fruit', slug: 'fruechte-slots', label: 'Früchte-Slots', short: 'Früchte' },
  { code: 'classic', slug: 'klassiker', label: 'Klassiker', short: 'Klassiker' },
  { code: 'bonus-buy', slug: 'bonus-buy-slots', label: 'Bonus-Buy-Slots', short: 'Bonus Buy' },
] as const;

export type CategoryCode = (typeof CATEGORIES)[number]['code'];

export const NAV: NavItem[] = [
  { label: 'Spielhalle', href: '/spielautomaten/' },
  {
    label: 'Kostenlos spielen',
    href: '/kategorien/',
    children: [
      ...CATEGORIES.map((c) => ({ label: c.label, href: `/kategorien/${c.slug}/` })),
      { label: 'Alle Hersteller', href: '/hersteller/' },
    ],
  },
  { label: 'Book-Slots', href: '/kategorien/book-slots/' },
  { label: 'Tischspiele', href: '/tischspiele/' },
  { label: 'Spielotheken', href: '/echtgeld-spielotheken/' },
  { label: 'Krypto-Spielotheken', href: '/krypto-spielotheken/' },
];

export const FOOTER_LEGAL: { label: string; href: string }[] = [
  { label: 'Impressum', href: '/impressum/' },
  { label: 'Datenschutz', href: '/datenschutz/' },
  { label: 'Cookie-Richtlinie', href: '/cookie-richtlinie/' },
  { label: 'Affiliate-Hinweis', href: '/affiliate-hinweis/' },
  { label: 'Verantwortungsvoll spielen', href: '/verantwortungsvoll-spielen/' },
  { label: 'Über uns', href: '/ueber-uns/' },
  { label: 'Kontakt', href: '/kontakt/' },
  { label: 'Bewertungsmethodik', href: '/bewertungsmethodik/' },
];

/**
 * Hub pages that exist only as "im Aufbau" stubs until their phase is built.
 * They are noindex and excluded from the sitemap. Remove an entry when the real
 * page replaces the stub.
 */
export const STUB_PAGES: Record<string, { title: string; h1: string; phase: number }> = {
};

/** True when a link points to a finished page (stubs are hidden from navigation). */
export const isLive = (href: string) => !(href.split(/[?#]/)[0] in STUB_PAGES);

/** Every path that must carry `noindex` and stay out of the sitemap. */
/** The Impressum carries the operator's legal name and stays out of search results. */
export const NOINDEX_PATHS = new Set<string>([...Object.keys(STUB_PAGES), '/404/', '/impressum/']);
