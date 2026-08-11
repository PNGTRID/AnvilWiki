/**
 * SEO utilities — JSON-LD builders and meta tag helpers.
 *
 * All builders return plain objects; the <JsonLd> component stringifies them.
 * Absolute URLs are produced via siteUrl + lib/url helpers.
 */

import { siteUrl } from '~/config/site';
import { site } from '~/config/site';
import { locales, defaultLocale, type Locale } from '~/i18n/routing';
import { absoluteUrl, detailPath, listPath } from './url';

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
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
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
  } = opts;
  const coverUrl = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/images/hero.webp`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: coverUrl,
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified ?? datePublished).toISOString(),
    author: { '@type': 'Organization', name: site.name },
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
}) {
  const { category, categoryLabel, title, slug, locale } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
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

/** Build the <title> string with consistent suffix. */
export function pageTitle(title: string): string {
  return `${title} — ${site.name}`;
}

/** Available locales for hreflang generation (imported by pages). */
export const allLocales: readonly Locale[] = locales;
