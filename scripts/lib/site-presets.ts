/**
 * site-presets.ts — the site-type preset registry for the apply-template CLI.
 *
 * [WHY]:    fork users do not only build game wikis. apply-template asks
 *           "what kind of site?" (qSiteType) and this registry decides, per
 *           type, which content categories fit, which demo articles ship as
 *           starting content, which demo covers belong to the type, and which
 *           English placeholder labels/overview copy the locale JSONs get.
 * [INPUT]:  Category keys must be subsets of NAVIGATION_CONFIG (src/config/
 *           navigation.ts) — the single source of legal category keys — and
 *           demoArticles/demoAssets paths must match real files on disk. Both
 *           invariants are pinned by tests/apply-template.test.ts (registry↔
 *           disk bidirectional contract, DEMO_COVERS precedent).
 * [OUTPUT]: Consumed by scripts/apply-template.ts (qSiteType question,
 *           post-answer category validation, planned output, 18/19 answer
 *           compatibility), scripts/lib/apply-rewrites.ts (classifyWikiArticles
 *           registry-based demo clearing incl. the locale dimension,
 *           rewriteLocaleJson nav/overview labels, buildHomePreset per-type
 *           homepage copy) and scripts/refresh-audit.ts (DEMO- placeholder
 *           codes skip). Vitest tests this file directly.
 * [BOUND]:  Pure data + pure functions — no fs, no interaction, no wall clock.
 *           Does NOT change the Zod schema or routes (URLs keep the existing
 *           category keys; semantics live in the copy layer only). The
 *           game-wiki preset must reproduce today's behavior byte-for-byte
 *           (zero-breaking red line), which is why game-wiki.demoArticles is
 *           EMPTY: the Anvil Quest demo articles keep being cleared by the
 *           existing content-marker rule (isDemoArticleContent), exactly as
 *           before the registry existed.
 * [PROTOCOL]: When adding a preset or touching a demo list, sync the demo
 *           files on disk, setup.yml's rm lists and
 *           scripts/lib/apply-rewrites.ts (DEMO_COVERS derives from
 *           demoAssets), then run tests/apply-template.test.ts. When the CLI
 *           prompt sequence changes, update LEGACY_ANSWER_COUNT.
 */

export type PresetId = 'game-wiki' | 'coupon-hub' | 'tutorial-hub' | 'recipe-hub';

/**
 * Per-preset English placeholder copy written into the locale JSONs by
 * rewriteLocaleJson. Users translate/edit per locale afterwards — same as the
 * TitleCase(key) defaults it replaces. Keys NOT listed fall back to the
 * historical TitleCase(key) / "All <Key>" templates, so game-wiki's empty
 * tables keep its output byte-identical. overviewDescriptions carry a
 * `{game}` placeholder substituted with the user's game/site name.
 */
export interface PresetUiCopy {
  /** nav.<key> label overrides (English placeholders), keyed by category key. */
  navLabels: Record<string, string>;
  /** overview.<key>.overviewTitle overrides. */
  overviewTitles: Record<string, string>;
  /** overview.<key>.overviewDescription overrides, `{game}` = game/site name. */
  overviewDescriptions: Record<string, string>;
}

export interface SitePreset {
  id: PresetId;
  /**
   * Content categories this site type keeps — a subset of NAVIGATION_CONFIG
   * keys in NAVIGATION_CONFIG menu order. The CLI validates the user's
   * category choice against this set AFTER qSiteType is answered (the
   * category question is asked earlier, so narrowing happens as a loud
   * post-check, never a silent filter).
   */
  categories: string[];
  /**
   * The preset's demo articles: locale → file paths relative to
   * src/content/wiki/<locale>/ (e.g. 'codes/pixelpad-codes.mdx'). Cleared or
   * kept by classifyWikiArticles:
   *   - locale NOT in the run's chosen locales → cleared unconditionally;
   *   - locale chosen AND the file belongs to the CHOSEN preset → kept as
   *     the preset's starting content;
   *   - belongs to a DIFFERENT preset → cleared regardless of locale
   *     (spec §3: only the chosen preset's demos survive).
   * With NO locale/preset info (the setup.yml Initialize channel) every
   * registered demo is cleared — Initialize only does safe deletions.
   */
  demoArticles: Record<string, string[]>;
  /**
   * The preset's demo cover files (bare filenames in src/assets/covers/,
   * same by-name clearing pattern as DEMO_COVERS). DEMO_COVERS in
   * apply-rewrites.ts is the flat union of every preset's demoAssets.
   */
  demoAssets: string[];
  uiCopy: PresetUiCopy;
}

// ---------------------------------------------------------------------------
// Registry — order matters only for readability; lookups are by id.
// ---------------------------------------------------------------------------

const gameWiki: SitePreset = {
  id: 'game-wiki',
  categories: ['bosses', 'guides', 'items', 'codes'],
  // Deliberately EMPTY: the Anvil Quest demo articles clear through the
  // existing content-marker rule (isDemoArticleContent). Registering them
  // here would make a game-wiki fork KEEP them as "starting content" and
  // break the zero-breaking red line.
  demoArticles: {},
  demoAssets: [
    'beginner-guide-cover.png',
    'emberfang-cover.png',
    'stormcaller-cover.png',
    'weapon-tier-list-cover.png',
    'codes-cover.png',
    'en-bosses-frostbound-monarch.png',
    'en-guides-forging-guide.png',
    'en-items-emberforged-armor-set.png',
    'en-items-forging-materials-guide.png',
  ],
  uiCopy: {
    // Empty tables → every label falls back to the historical
    // TitleCase(key) / "All <Key>" templates (byte-identical output).
    navLabels: {},
    overviewTitles: {},
    overviewDescriptions: {},
  },
};

const couponHub: SitePreset = {
  id: 'coupon-hub',
  // NAVIGATION_CONFIG menu order (guides < items < codes) — pinned by the
  // registry contract test; the deals-first emphasis lives in the homepage
  // copy, not in this list's order.
  categories: ['guides', 'items', 'codes'],
  demoArticles: {
    en: [
      'codes/pixelpad-codes.mdx',
      'codes/cloudnote-codes.mdx',
      'guides/black-friday-deals-guide.mdx',
      'guides/saas-discount-stacking-guide.mdx',
      'items/pixelpad-design-tool.mdx',
      'items/cloudnote-notes-app.mdx',
    ],
    ja: [
      'codes/pixelpad-codes.mdx',
      'codes/cloudnote-codes.mdx',
      'guides/black-friday-deals-guide.mdx',
      'guides/saas-discount-stacking-guide.mdx',
      'items/pixelpad-design-tool.mdx',
      'items/cloudnote-notes-app.mdx',
    ],
  },
  demoAssets: [
    'en-codes-pixelpad-codes.png',
    'en-codes-cloudnote-codes.png',
    'en-guides-black-friday-deals-guide.png',
    'en-guides-saas-discount-stacking-guide.png',
    'en-items-pixelpad-design-tool.png',
    'en-items-cloudnote-notes-app.png',
    'ja-codes-pixelpad-codes.png',
    'ja-codes-cloudnote-codes.png',
    'ja-guides-black-friday-deals-guide.png',
    'ja-guides-saas-discount-stacking-guide.png',
    'ja-items-pixelpad-design-tool.png',
    'ja-items-cloudnote-notes-app.png',
  ],
  uiCopy: {
    navLabels: {
      codes: 'Deals',
      guides: 'Saving Guides',
      items: 'Tools',
    },
    overviewTitles: {
      codes: 'All Deals',
      guides: 'All Saving Guides',
      items: 'All Tools',
    },
    // The machine placeholder tail (OVERVIEW_PLACEHOLDER_TAIL in
    // apply-rewrites.ts) is APPENDED by the rewrite layer — never embed it
    // here, or the regenerated description carries it twice.
    overviewDescriptions: {
      codes: 'Active coupons and deals for {game}',
      guides: 'Money-saving guides for {game}',
      items: 'Tools and software covered by {game}',
    },
  },
};

const tutorialHub: SitePreset = {
  id: 'tutorial-hub',
  categories: ['guides'],
  demoArticles: {
    en: [
      'guides/pick-your-niche-tutorial.mdx',
      'guides/build-site-with-ai-tutorial.mdx',
      'guides/content-workflow-tutorial.mdx',
      'guides/monetize-site-tutorial.mdx',
    ],
    ja: [
      'guides/pick-your-niche-tutorial.mdx',
      'guides/build-site-with-ai-tutorial.mdx',
      'guides/content-workflow-tutorial.mdx',
      'guides/monetize-site-tutorial.mdx',
    ],
  },
  demoAssets: [
    'en-guides-pick-your-niche-tutorial.png',
    'en-guides-build-site-with-ai-tutorial.png',
    'en-guides-content-workflow-tutorial.png',
    'en-guides-monetize-site-tutorial.png',
    'ja-guides-pick-your-niche-tutorial.png',
    'ja-guides-build-site-with-ai-tutorial.png',
    'ja-guides-content-workflow-tutorial.png',
    'ja-guides-monetize-site-tutorial.png',
  ],
  uiCopy: {
    navLabels: {
      guides: 'Tutorials',
    },
    overviewTitles: {
      guides: 'All Tutorials',
    },
    // Tail appended by the rewrite layer (see coupon-hub above).
    overviewDescriptions: {
      guides: 'Step-by-step tutorials from {game}',
    },
  },
};

const recipeHub: SitePreset = {
  id: 'recipe-hub',
  // 'recipes' is a PRESET-ONLY category (src/config/navigation.ts
  // PRESET_ONLY_CATEGORIES): legal in the wiki schema's LEGAL_CONTENT_TYPES
  // union, but absent from the game-wiki NAVIGATION_CONFIG — the game demo
  // and game-wiki forks build no /recipes/ list page. A recipe-hub fork's
  // apply-template-written navigation.ts carries it, so the fork behaves
  // like any single-category site.
  categories: ['guides', 'items', 'recipes'],
  demoArticles: {
    en: [
      'recipes/classic-vanilla-sponge-cake.mdx',
      'recipes/banana-bread.mdx',
      'recipes/chocolate-chip-cookies.mdx',
      'recipes/fluffy-pancakes.mdx',
      'recipes/tomato-garlic-pasta.mdx',
      'recipes/roasted-pumpkin-soup.mdx',
    ],
    ja: [
      'recipes/classic-vanilla-sponge-cake.mdx',
      'recipes/banana-bread.mdx',
      'recipes/chocolate-chip-cookies.mdx',
      'recipes/fluffy-pancakes.mdx',
      'recipes/tomato-garlic-pasta.mdx',
      'recipes/roasted-pumpkin-soup.mdx',
    ],
  },
  demoAssets: [
    'en-recipes-classic-vanilla-sponge-cake.png',
    'en-recipes-banana-bread.png',
    'en-recipes-chocolate-chip-cookies.png',
    'en-recipes-fluffy-pancakes.png',
    'en-recipes-tomato-garlic-pasta.png',
    'en-recipes-roasted-pumpkin-soup.png',
    'ja-recipes-classic-vanilla-sponge-cake.png',
    'ja-recipes-banana-bread.png',
    'ja-recipes-chocolate-chip-cookies.png',
    'ja-recipes-fluffy-pancakes.png',
    'ja-recipes-tomato-garlic-pasta.png',
    'ja-recipes-roasted-pumpkin-soup.png',
  ],
  uiCopy: {
    navLabels: {
      recipes: 'Recipes',
      guides: 'Kitchen Guides',
      items: 'Kitchen Tools',
    },
    overviewTitles: {
      recipes: 'All Recipes',
      guides: 'All Kitchen Guides',
      items: 'All Kitchen Tools',
    },
    overviewDescriptions: {
      recipes: 'Tried-and-true recipes from {game}',
      guides: 'Technique and prep guides for {game}',
      items: 'Tools and gear used in {game}',
    },
  },
};

export const SITE_PRESETS: Record<PresetId, SitePreset> = {
  'game-wiki': gameWiki,
  'coupon-hub': couponHub,
  'tutorial-hub': tutorialHub,
  'recipe-hub': recipeHub,
};

/** The site-type menu options in CLI answer order (qSiteType '1' | '2' | '3' | '4'). */
export const PRESET_ANSWER_ORDER: readonly PresetId[] = [
  'game-wiki',
  'coupon-hub',
  'tutorial-hub',
  'recipe-hub',
];

// ---------------------------------------------------------------------------
// --answers compatibility — the qSiteType question was APPENDED after the
// original 18 prompts, so an 18-entry answers file is still a valid pre-preset
// file (site type silently defaults to game-wiki) while 19+ is the current
// format. Pure helpers so the rules are vitest-testable without driving the
// interactive CLI.
// ---------------------------------------------------------------------------

/**
 * The --answers entry count that predates qSiteType. Files of exactly this
 * length take the legacy path (no answer consumed for qSiteType, site type
 * defaults to game-wiki, one stderr note); longer files are the current
 * format and MUST answer qSiteType at index LEGACY_ANSWER_COUNT (0-based).
 */
export const LEGACY_ANSWER_COUNT = 18;

/**
 * Map a qSiteType answer ('1' | '2' | '3') to its preset id. Returns null for
 * anything else — the caller fails loudly BEFORE any file write (the repo's
 * established pattern for bad input). An empty answer never reaches here: the
 * CLI's ask() applies the '1' default first.
 */
export function siteTypeFromAnswer(raw: string): PresetId | null {
  const index = Number(raw.trim()) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= PRESET_ANSWER_ORDER.length) return null;
  return PRESET_ANSWER_ORDER[index];
}

// ---------------------------------------------------------------------------
// Placeholder redeem codes — the coupon-hub demo ships DEMO-XXXX placeholder
// codes whose frontmatter `source` points at the fictional brand sites. They
// can never be "verified", so refresh-audit's codes freshness rule skips pages
// whose codes are ALL placeholders (fork users swapping in real codes restore
// the rule automatically). The prefix is owned here because the convention
// belongs to the preset demo system.
// ---------------------------------------------------------------------------

export const DEMO_CODE_PLACEHOLDER_PREFIX = 'DEMO-';

/**
 * True when the frontmatter chunk carries at least one `codes:` entry and
 * EVERY code value starts with the DEMO- placeholder prefix. Zero entries is
 * deliberately NOT a placeholder page (an emptied codes page still deserves
 * freshness attention, unlike an un-runnable placeholder).
 */
export function isPlaceholderCodesFrontmatter(fm: string): boolean {
  const codes: string[] = [];
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^\s*-\s+code:\s*(.+?)\s*$/);
    if (m) codes.push(m[1].replace(/^['"]|['"]$/g, ''));
  }
  return codes.length > 0 && codes.every((c) => c.startsWith(DEMO_CODE_PLACEHOLDER_PREFIX));
}
