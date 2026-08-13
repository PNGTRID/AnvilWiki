import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import { loadEnv } from 'vite';

import { locales, defaultLocale } from './src/i18n/routing';

// Astro config runs before Vite exposes import.meta.env. Read local .env files
// explicitly, while preferring variables injected by Cloudflare Pages.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const siteUrl = (process.env.SITE_URL || env.SITE_URL || 'https://anvilwiki.pages.dev').replace(
  /\/$/,
  '',
);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'never',
  image: {
    // Emit explicit width/height on responsive <Image> output to prevent CLS.
    responsiveStyles: true,
  },
  // Prefetch all internal links on hover — faster page transitions, no
  // View Transitions runtime needed. Adds a small IntersectionObserver script.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  i18n: {
    // Spread to convert readonly tuple to mutable array (Astro's Locales type).
    locales: [...locales],
    defaultLocale,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale,
        locales: Object.fromEntries(locales.map((l) => [l, l])),
      },
    }),
    tailwind({ applyBaseStyles: false }),
    icon(),
  ],
  vite: {
    resolve: {
      alias: {
        '~': '/src',
      },
    },
  },
});
