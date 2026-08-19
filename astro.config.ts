import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { locales, defaultLocale } from './src/i18n/routing';
import { site as siteConfig } from './src/config/site';

/**
 * Build a map of page path → lastmod ISO date, read from MDX frontmatter
 * (`lastModified` falling back to `date`). Used by the sitemap `serialize`
 * hook so Google gets the one sitemap field it actually trusts for crawl
 * scheduling (Google Search Central docs).
 *
 * Plain fs scan at config time — `astro:content` is not importable here.
 */
function buildLastmodMap(): Map<string, string> {
  const map = new Map<string, string>();
  const base = path.resolve('./src/content/wiki');
  if (!fs.existsSync(base)) return map;

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
        continue;
      }
      if (!entry.name.endsWith('.mdx')) continue;
      const src = fs.readFileSync(p, 'utf8');
      const fm = src.split('---')[1] ?? '';
      const lm = fm.match(/^lastModified:\s*(.+)$/m)?.[1]?.trim();
      const dt = fm.match(/^date:\s*(.+)$/m)?.[1]?.trim();
      const iso = (lm || dt || '').replace(/['"]/g, '');
      if (!iso) continue;
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) continue;

      // Path relative to the content base → locale/category/slug.
      const rel = path.relative(base, p).replace(/\.mdx$/, '');
      const [loc, cat, ...rest] = rel.split(path.sep);
      const slugPath = rest.join('/');
      const articlePath = loc === defaultLocale ? `/${cat}/${slugPath}` : `/${loc}/${cat}/${slugPath}`;
      map.set(articlePath, date.toISOString());

      // List pages: newest article in the category wins.
      const listPath = loc === defaultLocale ? `/${cat}` : `/${loc}/${cat}`;
      const existing = map.get(listPath);
      if (!existing || existing < date.toISOString()) {
        map.set(listPath, date.toISOString());
      }
    }
  };
  walk(base);
  return map;
}

const lastmodMap = buildLastmodMap();

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || `https://${siteConfig.domain}`,
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
      // Exclude the locale-router landing pages from the sitemap — they are
      // redirect-only splash pages, not content.
      filter: (page) => !/(^|\/)(zh\/)?landing\/?$/.test(new URL(page).pathname),
      // Inject <lastmod> from article frontmatter (see buildLastmodMap).
      serialize(item) {
        try {
          const pagePath = new URL(item.url).pathname;
          const lm = lastmodMap.get(pagePath);
          if (lm) item.lastmod = lm;
        } catch {
          /* non-URL entries keep default behavior */
        }
        return item;
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
