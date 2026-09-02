/**
 * Handbook pure helpers — no astro:content imports here (same rule as
 * lib/url: anything that pulls astro:content can't run under Vitest).
 *
 * Covers: entry-id parsing, chapter sorting, prev/next within a manual,
 * and URL building for the /landing/docs routes.
 */

export type HandbookManual = 'learn' | 'dev';

export const HANDBOOK_LOCALES = ['en', 'zh'] as const;
export type HandbookLocale = (typeof HANDBOOK_LOCALES)[number];

/** Minimal shape shared by collection entries (structural typing keeps this testable). */
export interface ChapterLike {
  id: string;
  data: { manual: HandbookManual; order: number; [k: string]: unknown };
}

/** Full chapter shape used by the docs pages/components (CollectionEntry-compatible). */
export interface HandbookEntry {
  id: string;
  data: {
    title: string;
    description: string;
    manual: HandbookManual;
    order: number;
    icon: string;
    /** Stage label (learn manual's six stages); absent = render flat. */
    stage?: string;
    tldr?: string;
    updated?: Date;
  };
}

export interface ParsedHandbookId {
  locale: HandbookLocale;
  slug: string;
}

/**
 * Parse a handbook entry id ("en/pick-your-game" — defensively strips a
 * possible ".md" suffix, same gotcha as wiki entry ids) into locale + slug.
 * Returns null for ids that don't match <locale>/<slug>.
 */
export function parseHandbookId(id: string): ParsedHandbookId | null {
  const clean = id.replace(/\.md$/i, '');
  const sep = clean.indexOf('/');
  if (sep <= 0) return null;
  const locale = clean.slice(0, sep) as HandbookLocale;
  const slug = clean.slice(sep + 1);
  if (!slug || !(HANDBOOK_LOCALES as readonly string[]).includes(locale)) return null;
  return { locale, slug };
}

/** Sort: learn manual first, then dev; ascending order inside each manual. */
export function sortChapters<T extends ChapterLike>(chapters: T[]): T[] {
  return [...chapters].sort((a, b) => {
    if (a.data.manual !== b.data.manual) {
      return a.data.manual === 'learn' ? -1 : 1; // learn first
    }
    return a.data.order - b.data.order;
  });
}

/** Filter + sort chapters of one locale, ready for hub lists and prev/next. */
export function chaptersForLocale<T extends ChapterLike>(chapters: T[], locale: HandbookLocale): T[] {
  return sortChapters(chapters.filter((c) => parseHandbookId(c.id)?.locale === locale));
}

/**
 * Previous/next neighbors of a chapter, scoped to its own manual (no
 * cross-manual navigation — each handbook reads as one linear path).
 * Pass an already locale-filtered list.
 */
export function prevNext<T extends ChapterLike>(
  sorted: T[],
  id: string,
): { prev: T | null; next: T | null } {
  const manual = sorted.find((c) => c.id === id)?.data.manual;
  const line = sorted.filter((c) => c.data.manual === manual);
  const idx = line.findIndex((c) => c.id === id);
  if (idx === -1) return { prev: null, next: null };
  return { prev: idx > 0 ? line[idx - 1] : null, next: idx < line.length - 1 ? line[idx + 1] : null };
}

/** Public URL of a handbook chapter for a given landing locale. */
export function handbookPath(locale: HandbookLocale, slug: string, isHub = false): string {
  const base = locale === 'en' ? '/landing/docs' : `/zh/landing/docs`;
  // trailingSlash:'always' — hub and chapter URLs both end with "/".
  return isHub || !slug ? `${base}/` : `${base}/${slug}/`;
}

/** GitHub source URL ("Edit on GitHub" link). */
export function handbookSourceUrl(locale: HandbookLocale, slug: string): string {
  return `https://github.com/PNGTRID/AnvilWiki/blob/main/docs/handbook/${locale}/${slug}.md`;
}
