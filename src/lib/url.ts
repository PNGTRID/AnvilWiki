/**
 * URL construction utilities.
 *
 * Centralizes all locale-prefix logic so components never hand-build URLs.
 * English (default locale) has no prefix; other locales are prefixed.
 */

import { defaultLocale, isLocale, type Locale } from '~/i18n/routing';
import { siteUrl } from '~/config/site';

/** Build a path with the locale prefix applied (or none for default locale). */
export function localizePath(path: string, locale: Locale): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return cleanPath;
  // For the root path "/", avoid producing "/<locale>/" (trailing slash).
  // The site uses trailingSlash: 'never', so "/ja/" would 404.
  if (cleanPath === '/') return `/${locale}`;
  return `/${locale}${cleanPath}`;
}

/** Build an absolute URL (with domain) for a path + locale. */
export function absoluteUrl(path: string, locale: Locale): string {
  return `${siteUrl}${localizePath(path, locale)}`;
}

/** Home URL for a locale. */
export function homeUrl(locale: Locale): string {
  return localizePath('/', locale);
}

/** List page URL for a category + locale. e.g. localizeListPath('bosses', 'en') -> '/bosses' */
export function listPath(category: string, locale: Locale): string {
  return localizePath(`/${category}`, locale);
}

/** Article detail URL. e.g. detailPath('bosses', 'gelum', 'en') -> '/bosses/gelum' */
export function detailPath(category: string, slug: string, locale: Locale): string {
  return localizePath(`/${category}/${slug}`, locale);
}

/**
 * Generate hreflang alternates for an article/category page.
 * Returns a record suitable for injection as <link rel="alternate"> tags.
 * Always includes x-default → English.
 */
export function languageAlternates(
  buildPath: (locale: Locale) => string,
  locales: readonly Locale[],
): Array<{ hreflang: string; href: string }> {
  return locales.map((loc) => ({
    hreflang: loc,
    href: `${siteUrl}${buildPath(loc)}`,
  }));
}

/** Extract locale from a URL pathname. Returns default locale if none found. */
export function localeFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    return segments[0];
  }
  return defaultLocale;
}
