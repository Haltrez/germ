// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './src/config/site.ts';
import { NOINDEX_PATHS } from './src/config/routes.ts';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    mdx(),
    preact(),
    sitemap({
      // Pages marked noindex (stubs, filter views) never go into the sitemap.
      filter: (page) => !NOINDEX_PATHS.has(new URL(page).pathname),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
