import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  slotSchema,
  slotTextSchema,
  providerSchema,
  operatorSchema,
  authorSchema,
  guideSchema,
  glossarySchema,
  newsSchema,
} from './schemas/index.ts';

// Files starting with "_" are ignored (use them for templates/examples).
const json = (base: string) => glob({ pattern: '**/[^_]*.json', base });
const mdx = (base: string) => glob({ pattern: '**/[^_]*.{md,mdx}', base });

export const collections = {
  slots: defineCollection({ loader: json('./src/data/slots'), schema: slotSchema }),
  providers: defineCollection({ loader: json('./src/data/providers'), schema: providerSchema }),
  operators: defineCollection({ loader: json('./src/data/operators'), schema: operatorSchema }),
  authors: defineCollection({ loader: json('./src/data/authors'), schema: authorSchema }),
  slotTexts: defineCollection({ loader: mdx('./src/content/slot-texts'), schema: slotTextSchema }),
  guides: defineCollection({ loader: mdx('./src/content/ratgeber'), schema: guideSchema }),
  news: defineCollection({ loader: mdx('./src/content/news'), schema: newsSchema }),
  glossary: defineCollection({ loader: mdx('./src/content/glossar'), schema: glossarySchema }),
};
