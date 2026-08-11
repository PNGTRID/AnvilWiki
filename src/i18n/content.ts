/**
 * Article loader with language fallback.
 *
 * Two distinct behaviors (intentional asymmetry — see PRD §9.3):
 *
 *   - getEntryWithFallback(category, slug, locale):
 *       SINGLE article. If the requested locale version is missing,
 *       fall back to English (DO NOT 404). Direct URL access must always resolve.
 *
 *   - getEntriesByCategory(category, locale):
 *       LIST page. Does NOT fall back. If the locale has no articles,
 *       return empty array → list page shows the "no articles" empty state.
 *
 * Why the asymmetry: list = accuracy (don't advertise content that doesn't exist);
 * detail = reachability (a URL shared on social media must never break).
 */

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { defaultLocale, type Locale } from './routing';

export type WikiEntry = CollectionEntry<'wiki'>;

export interface ResolvedEntry {
  entry: WikiEntry;
  /** The locale actually served (may differ from requested if fell back). */
  servedLocale: Locale;
  /** True when the requested locale was missing and English was served instead. */
  isFallback: boolean;
}

/**
 * Parse an entry id like "en/bosses/gelum" or "ja/bosses/sub/gelum" into parts.
 * Returns null if the id doesn't match `<locale>/<category>/<...slug>`.
 */
export function parseEntryId(
  id: string,
): { locale: Locale; category: string; slug: string } | null {
  // Strip the .mdx extension that the glob loader includes in the id.
  const cleanId = id.replace(/\.mdx$/, '');
  const parts = cleanId.split('/');
  if (parts.length < 3) return null;
  const [locale, category, ...rest] = parts;
  if (!isLocaleSafe(locale)) return null;
  return { locale, category, slug: rest.join('/') };
}

function isLocaleSafe(value: string): value is Locale {
  return value === 'en' || value === 'ja';
}

/**
 * Load a single article. Falls back to English if the locale version is missing.
 * Returns null only when no version exists in any language (caller should 404).
 */
export async function getEntryWithFallback(
  category: string,
  slug: string,
  locale: Locale,
): Promise<ResolvedEntry | null> {
  // Note: getCollection() returns entry.id WITH the .mdx extension, but
  // getEntry() expects the id WITHOUT the extension. This is an Astro 5
  // inconsistency. We always query without extension here.
  const id = `${locale}/${category}/${slug}`;

  // 1. Try the requested locale first.
  const requested = await getEntry('wiki', id);
  if (requested) {
    return { entry: requested, servedLocale: locale, isFallback: false };
  }

  // 2. Fall back to English (default locale).
  if (locale !== defaultLocale) {
    const fallback = await getEntry('wiki', `${defaultLocale}/${category}/${slug}`);
    if (fallback) {
      return { entry: fallback, servedLocale: defaultLocale, isFallback: true };
    }
  }

  return null;
}

/**
 * List all articles in a category for a locale. Does NOT fall back to English.
 * An empty result means "this locale has no translated articles in this category".
 */
export async function getEntriesByCategory(
  category: string,
  locale: Locale,
): Promise<WikiEntry[]> {
  const all = await getCollection('wiki');
  return all
    .filter((e) => {
      const parsed = parseEntryId(e.id);
      return parsed?.locale === locale && parsed.category === category;
    })
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime()); // newest first
}

/**
 * List all articles in a category across ALL locales (for sitemap generation).
 */
export async function getAllEntriesByCategory(
  category: string,
): Promise<WikiEntry[]> {
  const all = await getCollection('wiki');
  return all
    .filter((e) => parseEntryId(e.id)?.category === category)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * All locales that have at least one article for a given (category, slug).
 * Used to generate hreflang alternates.
 */
export async function localesForEntry(
  category: string,
  slug: string,
): Promise<Locale[]> {
  const all = await getCollection('wiki');
  const found = new Set<Locale>();
  for (const entry of all) {
    const parsed = parseEntryId(entry.id);
    if (parsed?.category === category && parsed.slug === slug) {
      found.add(parsed.locale);
    }
  }
  // Always include default locale for x-default / fallback.
  found.add(defaultLocale);
  return Array.from(found);
}

/**
 * Recent articles for a locale (for homepage "Recent Updates").
 */
export async function getRecentEntries(
  locale: Locale,
  limit = 6,
): Promise<WikiEntry[]> {
  const all = await getCollection('wiki');
  return all
    .filter((e) => parseEntryId(e.id)?.locale === locale)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, limit);
}

/**
 * Related articles (by shared tags). Excludes the current article.
 */
export async function getRelatedEntries(
  current: WikiEntry,
  locale: Locale,
  limit = 3,
): Promise<WikiEntry[]> {
  if (current.data.tags.length === 0) return [];
  const all = await getCollection('wiki');
  const parsed = parseEntryId(current.id);
  if (!parsed) return [];

  return all
    .filter((e) => {
      if (e.id === current.id) return false;
      const p = parseEntryId(e.id);
      if (p?.locale !== locale) return false;
      return e.data.tags.some((t: string) => current.data.tags.includes(t));
    })
    .slice(0, limit);
}
