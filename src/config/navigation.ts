/**
 * Navigation configuration — the single source of truth for content categories.
 *
 * 👉 APPLY TEMPLATE: Change this array when a new game has different content categories.
 *
 * The `key` MUST be identical in THREE places (rule enforced across the codebase):
 *   1. Here — NAVIGATION_CONFIG[].key
 *   2. src/locales/en.json — nav.<key> (display label) + overview.<key> (list page meta)
 *   3. src/content/wiki/<locale>/<key>/ — MDX directory name
 *
 * Changing this one file automatically affects: nav menu, URL routes, sitemap,
 * content loading, and the sidebar.
 */

// Icons are referenced by string name; astro-icon resolves them from src/icons/.
// We avoid importing the icon component here so this file stays framework-agnostic
// and can be read by non-Astro tooling (scripts, tests).
export interface NavigationItem {
  /** Category slug. Must match `src/content/wiki/<locale>/<key>/` directory name. */
  key: string;
  /** URL path segment. Must be `/${key}`. */
  path: string;
  /** Icon name from src/icons/ (without extension). */
  icon: string;
  /** Whether this category has MDX content (always true for content types). */
  isContentType: true;
}

/** Menu order = array order — every consumer renders by physical position. */
export const NAVIGATION_CONFIG: NavigationItem[] = [
  { key: 'bosses', path: '/bosses', icon: 'lucide:swords', isContentType: true },
  { key: 'guides', path: '/guides', icon: 'lucide:book-open', isContentType: true },
  { key: 'items', path: '/items', icon: 'lucide:package', isContentType: true },
  { key: 'codes', path: '/codes', icon: 'lucide:gift', isContentType: true },
];

/** Derived list of content type slugs (e.g. ['bosses', 'guides', 'items', 'codes']). */
export const CONTENT_TYPES: string[] = NAVIGATION_CONFIG.map((n) => n.key);

/**
 * Preset-only categories — legal content types that NO game-wiki menu shows.
 * Introduced by site-type presets (site-presets.ts): a recipe-hub fork's
 * apply-template-written navigation.ts carries `recipes` in NAVIGATION_CONFIG,
 * so its routes/sitemap/menu treat it exactly like any other category. The
 * demo repo never lists it here, which is why the demo builds no /recipes/
 * list page — recipe demo articles (noindex'd) are reachable by direct URL
 * only, keeping the game-wiki demo and every game-wiki fork free of preset
 * leftovers.
 *
 * ⚠️ This array is the ONLY place preset-only keys may be declared: the wiki
 * schema's legal-category enum derives from LEGAL_CONTENT_TYPES below, and
 * the recipe-hub preset registry references the same keys.
 */
export const PRESET_ONLY_CATEGORIES: NavigationItem[] = [
  { key: 'recipes', path: '/recipes', icon: 'lucide:cake', isContentType: true },
];

/**
 * Every legal frontmatter category = game-wiki menu keys ∪ preset-only keys.
 * The wiki schema validates against THIS union (a recipe-hub fork's
 * `category: 'recipes'` is legal; a typo still fails the build). Routes,
 * menus, and sitemap iterate CONTENT_TYPES only — the split is what keeps
 * preset content buildable without leaking into the game-wiki chrome.
 */
export const LEGAL_CONTENT_TYPES: string[] = [
  ...CONTENT_TYPES,
  ...PRESET_ONLY_CATEGORIES.map((n) => n.key),
];
