/**
 * SEO utilities — JSON-LD builders and meta tag helpers.
 *
 * All builders return plain objects; the <JsonLd> component stringifies them.
 * Absolute URLs are produced via siteUrl + lib/url helpers.
 */

import { siteUrl } from '~/config/site';
import { site } from '~/config/site';
import { defaultLocale, type Locale } from '~/i18n/routing';
import { detailPath, listPath } from './url';

/** Organization JSON-LD — injected globally in BaseLayout. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: siteUrl,
    logo: `${siteUrl}/android-chrome-512x512.png`,
    image: `${siteUrl}/images/hero.webp`,
    description: site.description,
    // Entity association: link the wiki to the game's canonical pages
    // (Steam / official site / Wikipedia) — knowledge-graph signal.
    ...(site.sameAs && site.sameAs.length > 0 ? { sameAs: site.sameAs } : {}),
  };
}

/** WebSite JSON-LD — injected on the homepage only. */
export function websiteJsonLd(locale: Locale = defaultLocale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: siteUrl,
    description: site.description,
    inLanguage: locale,
  };
}

/** Article JSON-LD — injected on article detail pages. */
export function articleJsonLd(opts: {
  title: string;
  description: string;
  image?: string;
  datePublished: Date;
  dateModified?: Date;
  category: string;
  slug: string;
  locale: Locale;
  /** Named author (E-E-A-T) — renders as Person; falls back to the Organization. */
  authorName?: string;
  /** Profile URLs folded into the Person's sameAs (knowledge-graph signal). */
  authorSameAs?: string[];
}) {
  const {
    title,
    description,
    image,
    datePublished,
    dateModified,
    category,
    slug,
    locale,
    authorName,
    authorSameAs,
  } = opts;
  const coverUrl = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/images/hero.webp`;
  const author = authorName
    ? {
        '@type': 'Person',
        name: authorName,
        ...(authorSameAs && authorSameAs.length > 0 ? { sameAs: authorSameAs } : {}),
      }
    : { '@type': 'Organization', name: site.name };
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: coverUrl,
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified ?? datePublished).toISOString(),
    author,
    publisher: {
      '@type': 'Organization',
      name: site.name,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/android-chrome-512x512.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}${detailPath(category, slug, locale)}`,
    },
  };
}

/** BreadcrumbList JSON-LD — injected on article detail pages. */
export function breadcrumbJsonLd(opts: {
  category: string;
  categoryLabel: string;
  title: string;
  slug: string;
  locale: Locale;
  /** Localized "Home" label (locale JSON nav.home). */
  homeLabel?: string;
}) {
  const { category, categoryLabel, title, slug, locale, homeLabel = 'Home' } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `${siteUrl}${locale === defaultLocale ? '' : `/${locale}`}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryLabel,
        item: `${siteUrl}${listPath(category, locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${siteUrl}${detailPath(category, slug, locale)}`,
      },
    ],
  };
}

/**
 * BreadcrumbList JSON-LD (2-level variant) for non-article pages
 * (list pages, FAQ, etc.). Home → pageLabel.
 *
 * Use breadcrumbJsonLd() for article pages (Home → Category → Article).
 */
export function simpleBreadcrumbJsonLd(opts: {
  /** Display name of the current page (e.g. category label or "FAQ"). */
  pageLabel: string;
  /** Absolute-or-relative path of the current page for a given locale. */
  path: string;
  locale: Locale;
  /** Localized "Home" label (locale JSON nav.home). */
  homeLabel?: string;
}) {
  const { pageLabel, path, locale, homeLabel = 'Home' } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `${siteUrl}${locale === defaultLocale ? '' : `/${locale}`}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageLabel,
        item: `${siteUrl}${path}`,
      },
    ],
  };
}

/** ItemList JSON-LD — injected on list pages. */
export function itemListJsonLd(opts: {
  category: string;
  categoryLabel: string;
  locale: Locale;
  items: Array<{ title: string; slug: string }>;
}) {
  const { category, categoryLabel, locale, items } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: categoryLabel,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.title,
      url: `${siteUrl}${detailPath(category, item.slug, locale)}`,
    })),
  };
}

/** FAQPage JSON-LD — for homepage FAQ section (eligible for SERP rich results). */
export function faqPageJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  };
}

/**
 * Generic ItemList JSON-LD for cross-category lists (tag pages, recent
 * updates) where itemListJsonLd()'s single-category URL shape doesn't fit.
 * Each item carries its own absolute URL.
 */
export function urlListJsonLd(opts: {
  name: string;
  items: Array<{ title: string; url: string }>;
}) {
  const { name, items } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.title,
      url: item.url,
    })),
  };
}

/** ImageObject JSON-LD — one per gallery image (Google Images eligibility). */
export function imageObjectJsonLd(opts: { url: string; caption?: string; alt?: string }) {
  const { url, caption, alt } = opts;
  // Prefer the author-written alt as the name; caption describes context.
  const name = alt ?? caption;
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: url,
    ...(name ? { name, description: caption ?? name } : {}),
  };
}

/**
 * VideoObject JSON-LD — one per embedded YouTube video on an article page.
 * Eligible for Google Video search results. Google's required fields are
 * name/description/thumbnailUrl/uploadDate — omitting description makes GSC
 * flag the page's video rich result (production report 2026-09-18). The
 * videos frontmatter is a bare ID list with no per-video metadata, so the
 * article's own description/publish date are the best available signals.
 */
export function videoObjectJsonLd(opts: {
  videoId: string;
  title: string;
  description: string;
  uploadDate: Date;
}) {
  const { videoId, title, description, uploadDate } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: [`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`],
    uploadDate: uploadDate.toISOString(),
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

/**
 * Build the <title> string with a smart suffix (three-site production
 * lesson: a fixed full-name suffix pushed keywords out of the ~60-char SERP
 * display window on long titles).
 * - title already carries the game name → no suffix (repetition buys nothing);
 * - title > 50 chars → short suffix (site.shortName) to stay in the window;
 * - otherwise → full site name.
 * BaseLayout's own suffix guard also checks all three names, so callers may
 * pass either a raw title or pageTitle() output without double suffixing.
 */
export function pageTitle(title: string): string {
  if (title.includes(site.game.name)) return title;
  const suffix = title.length > 50 ? site.shortName : site.name;
  return `${title} — ${suffix}`;
}

/** VideoGame JSON-LD — injected on the homepage for game entity recognition. */
export function videoGameJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: site.game.name,
    description: site.description,
    url: siteUrl,
    genre: site.game.genre,
    gamePlatform: site.game.platform,
    publisher: { '@type': 'Organization', name: site.game.developer },
    ...(site.game.releaseDate ? { datePublished: site.game.releaseDate } : {}),
  };
}
