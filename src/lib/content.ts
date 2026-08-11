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
  getAllEntriesByCategory,
  localesForEntry,
  getRecentEntries,
  getRelatedEntries,
  parseEntryId,
  type WikiEntry,
  type ResolvedEntry,
} from '~/i18n/content';
