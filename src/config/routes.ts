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
 * Deliberately NOT included (see project notes):
 * - bonus-buy: feature purchase is not permitted for virtual slot machines
 *   in Germany (GlüStV 2021 § 22a). Only an informational guide may cover it.
 * - jackpot: jackpots are not permitted for virtual slot machines in Germany.
 */
export const CATEGORIES = [
  { code: 'book', slug: 'book-slots', label: 'Book-Slots', short: 'Book-Slots' },
  { code: 'hold-and-win', slug: 'hold-and-win', label: 'Hold & Win Slots', short: 'Hold & Win' },
  { code: 'megaways', slug: 'megaways', label: 'Megaways-Slots', short: 'Megaways' },
  { code: 'fruit', slug: 'fruechte-slots', label: 'Früchte-Slots', short: 'Früchte' },
  { code: 'classic', slug: 'klassiker', label: 'Klassiker', short: 'Klassiker' },
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
  { label: 'Ranglisten', href: '/ranglisten/' },
  { label: 'Spielotheken', href: '/echtgeld-spielotheken/' },
  { label: 'Ratgeber', href: '/ratgeber/' },
  { label: 'So prüfen wir', href: '/bewertungsmethodik/' },
];

export const FOOTER_LEGAL: { label: string; href: string }[] = [
  { label: 'Impressum', href: '/impressum/' },
  { label: 'Datenschutz', href: '/datenschutz/' },
  { label: 'Cookie-Richtlinie', href: '/cookie-richtlinie/' },
  { label: 'Affiliate-Hinweis', href: '/affiliate-hinweis/' },
  { label: 'Verantwortungsvoll spielen', href: '/verantwortungsvoll-spielen/' },
  { label: 'Über uns', href: '/ueber-uns/' },
  { label: 'Bewertungsmethodik', href: '/bewertungsmethodik/' },
];

/**
 * Hub pages that exist only as "im Aufbau" stubs until their phase is built.
 * They are noindex and excluded from the sitemap. Remove an entry when the real
 * page replaces the stub.
 */
export const STUB_PAGES: Record<string, { title: string; h1: string; phase: number }> = {
  '/ranglisten/': { title: 'Ranglisten: das Big Win Board', h1: 'Ranglisten', phase: 3 },
  '/ranglisten/neue-slots/': { title: 'Neue Slots kostenlos testen', h1: 'Neue Slots', phase: 3 },
  '/echtgeld-spielotheken/': { title: 'GGL-lizenzierte Spielotheken im Vergleich', h1: 'Online-Spielotheken mit deutscher Lizenz', phase: 4 },
  '/ratgeber/': { title: 'Ratgeber rund um Spielautomaten', h1: 'Ratgeber', phase: 6 },
  '/tools/': { title: 'Tools: Budget- und RTP-Rechner', h1: 'Tools', phase: 5 },
  '/glossar/': { title: 'Slot-Glossar: Begriffe einfach erklärt', h1: 'Glossar', phase: 6 },
};

/** Every path that must carry `noindex` and stay out of the sitemap. */
export const NOINDEX_PATHS = new Set<string>([...Object.keys(STUB_PAGES), '/404/']);
