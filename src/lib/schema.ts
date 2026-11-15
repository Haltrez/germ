/** schema.org JSON-LD builders. No ratings/AggregateRating by design. */
import { SITE_NAME, SITE_URL } from '../config/site.ts';

export type JsonLd = Record<string, unknown>;
export interface Crumb {
  name: string;
  href: string;
}

export const absUrl = (path: string) => new URL(path, SITE_URL).href;

export const organizationSchema = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: absUrl('/logo-512.png'),
});

export const websiteSchema = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  inLanguage: 'de-DE',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/spielautomaten/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbSchema = (crumbs: Crumb[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: absUrl(c.href),
  })),
});

export const faqSchema = (items: { q: string; a: string }[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

export const articleSchema = (a: {
  headline: string;
  description: string;
  path: string;
  authorName: string;
  authorPath?: string;
  /** Use 'Organization' while no named editor exists. */
  authorType?: 'Person' | 'Organization';
  authorImage?: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: a.headline,
  description: a.description,
  mainEntityOfPage: absUrl(a.path),
  inLanguage: 'de-DE',
  author: { '@type': a.authorType ?? 'Person', name: a.authorName, ...(a.authorImage ? { image: absUrl(a.authorImage) } : {}), ...(a.authorPath ? { url: absUrl(a.authorPath) } : {}) },
  publisher: { '@id': `${SITE_URL}/#organization` },
  datePublished: a.datePublished,
  dateModified: a.dateModified,
  ...(a.image ? { image: absUrl(a.image) } : {}),
});

export const itemListSchema = (name: string, items: { name: string; path: string }[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  numberOfItems: items.length,
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: absUrl(it.path) })),
});

/** Game entity for slot pages (no ratings). */
export const videoGameSchema = (g: { name: string; path: string; publisher: string; description: string; datePublished?: string }): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: g.name,
  url: absUrl(g.path),
  description: g.description,
  inLanguage: 'de-DE',
  genre: 'Spielautomat',
  gamePlatform: ['Webbrowser', 'Smartphone'],
  applicationCategory: 'Game',
  isAccessibleForFree: true,
  publisher: { '@type': 'Organization', name: g.publisher },
  ...(g.datePublished ? { datePublished: g.datePublished } : {}),
});
