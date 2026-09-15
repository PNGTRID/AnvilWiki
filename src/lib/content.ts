/**
 * Content access facade.
 *
 * Re-exports the article loaders from src/i18n/content.ts so that pages and
 * components import from a single `~/lib/content` namespace. This keeps the
 * i18n directory focused on locale concerns, while content queries are
 * discoverable in one place.
 */

export {
  getEntryWithFallback,
  getEntriesByCategory,
  localesForEntry,
  localesForCategory,
  getRecentEntries,
  getRelatedEntries,
  getTagsWithCounts,
  getEntriesByTag,
  tagLabelFor,
  localesForTag,
  type WikiEntry,
  type ResolvedEntry,
} from '~/i18n/content';

// Pure helpers live in content-utils (no astro:content import — vitest-loadable).
export {
  parseEntryId,
  isPossiblyOutdated,
  selectRelatedEntries,
  estimateReadMinutes,
  STALE_AFTER_DAYS,
  STALE_CATEGORIES,
} from '~/lib/content-utils';

export { slugifyTag } from '~/lib/url';
