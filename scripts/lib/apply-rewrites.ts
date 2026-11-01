/**
 * apply-rewrites.ts — pure rewrite helpers for scripts/apply-template.ts.
 *
 * Extracted (verbatim where possible) so vitest can test them without
 * importing the interactive CLI: rewriteSiteTs (site.ts object literal),
 * rewriteLocaleJson (locale JSON shapes), buildScaffoldDescription (scaffold
 * frontmatter), rewriteWranglerVars (wrangler.toml
 * [vars] reset), the demo asset inventories shared with the "Clear demo
 * content" step in .github/workflows/setup.yml, and the content-aware demo
 * locale check. No fs/path access — callers own all IO.
 */

import { stripControlChars } from './delimited';
import { SITE_PRESETS, type PresetId } from './site-presets';


export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


/**
 * Frontmatter description for the per-category scaffold article
 * (apply-template's scaffoldContent). The placeholder must itself satisfy
 * the content schema (z.string().min(40).max(165)) — the old keyed template
 * grew 2×len(key) past a 144-char base, so a category key like
 * "walkthrough" (11 chars) already exceeded 165 and failed the fork's FIRST
 * build (drafts are schema-validated too). Same defense as bulk-new-posts:
 * the keyed variant while it fits (safe up to a 56-char key), a fixed
 * no-key sentence otherwise — never out of the [40, 165] window.
 */
export function buildScaffoldDescription(key: string): string {
  const withKey = `A starter article for the ${key} category. Replace this scaffold description (40-165 characters) before publishing.`;
  return withKey.length <= 165
    ? withKey
    : 'A starter article for this category. Replace this scaffold description (40-165 characters) before publishing.';
}


// ---------------------------------------------------------------------------
// Locale codes — hyphen locales (zh-tw, pt-br) are VALID input, but the value
// is injected into generated TypeScript, where a bare `zh-tw:` parses as
// subtraction and `import zh-tw` is an illegal identifier. Every injection
// site must go through localeKey / localeIdent below.
// ---------------------------------------------------------------------------

/**
 * A locale code apply-template accepts: lowercase, letter-first, hyphen-
 * separated subtags of 2-8 alphanumerics (`en`, `zh-tw`, `pt-br`). slugify()
 * keeps hyphens, so these are expected input; the shape constraint exists so
 * the generated routing.ts / ui.ts always parse.
 */
export const LOCALE_CODE_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]{2,8})*$/;

export function isLocaleCode(s: string): boolean {
  return LOCALE_CODE_RE.test(s);
}

/**
 * `zh-tw` → `zhTw` — a legal TS identifier for `import` bindings (the file
 * path keeps the real hyphenated name).
 */
export function localeIdent(locale: string): string {
  return locale
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

/**
 * Object key for a locale in generated TS: bare when the code is already a
 * legal identifier (`en:` — byte-identical to the pre-hyphen output, so
 * re-runs and diffs stay stable), double-quoted only when necessary
 * (`"zh-tw":`).
 */
export function localeKey(locale: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(locale) ? locale : JSON.stringify(locale);
}

/** English-default labels for the LOCALE_LABELS block in routing.ts.
 * new-locale.ts used to carry a second 15-entry table of its own — merged here
 * so both CLIs emit identical labels from one source (the extra six entries
 * below came from that table; buildLocaleLabels only ever gains proper labels
 * for them, no output regresses). */
export const KNOWN_LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  tr: 'Türkçe',
  pl: 'Polski',
};

/**
 * Escape a string for a single-quoted TS literal (backslash first).
 * Newline/control characters are STRIPPED as defense-in-depth: the CLI's ask()
 * layer rejects answers carrying them, but a direct lib caller must not be
 * able to inject a raw newline into generated TS either.
 */
export const tsEscape = (s: string) =>
  stripControlChars(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

/**
 * The LOCALE_LABELS entry lines for routing.ts (no braces — the caller wraps
 * them). Hyphen keys are quoted; labels fall back to the raw locale code.
 */
export function buildLocaleLabels(
  locales: string[],
  known: Record<string, string> = KNOWN_LOCALE_LABELS,
): string {
  return locales.map((l) => `  ${localeKey(l)}: '${tsEscape(known[l] ?? l)}'`).join(',\n');
}

/**
 * The `import <ident> from '~/locales/<locale>.json';` lines for ui.ts.
 * Bindings are camelCase identifiers (zh-tw → zhTw); the path keeps the real
 * hyphenated file name.
 */
export function buildUiImports(locales: string[]): string {
  return locales.map((l) => `import ${localeIdent(l)} from '~/locales/${l}.json';`).join('\n');
}

/** The `messages` map entry lines for ui.ts. */
export function buildUiMessagesEntries(locales: string[]): string {
  return locales.map((l) => `  ${localeKey(l)}: ${localeIdent(l)} as Record<string, unknown>,`).join('\n');
}

/**
 * One-or-more locale-JSON import lines in ui.ts. The PATH side must accept
 * hyphens (zh-tw.json) — with `\w+` only, a re-run over a previously-
 * rewritten file matches nothing and fails with ❌. The binding side stays
 * `\w+` because generated bindings are camelCase identifiers (localeIdent).
 */
export const UI_IMPORT_BLOCK_RE = /(?:import \w+ from '~\/locales\/[\w-]+\.json';\n)+/;

/**
 * The `const messages` map literal in ui.ts — the second CLI-rewritten
 * region. Single source shared by rewriteUiTs (apply-template.ts) and the
 * contract test that scans the code OUTSIDE the rewritten regions for
 * strippable locale identifiers: if those two described the regions
 * differently, the contract could silently stop covering the real rewrite.
 */
export const UI_MESSAGES_BLOCK_RE = /const messages: Record<Locale, Record<string, unknown>> = \{[\s\S]*?\};/;

export interface SkinInput {
  gameName: string;
  shortName: string;
  domain: string;
  tagline: string;
  description: string;
  legalNotice: string;
  themeHex: string;
  platform: string;
  developer: string;
  genre: string;
  releaseDate: string;
  officialUrl: string;
  locales: string[];
  categories: { key: string; icon: string }[];
  clearContent: boolean;
  clearLanding: boolean;
  /** Homepage preset: 'codes' | 'guides' | 'keep' */
  homePreset: 'codes' | 'guides' | 'keep';
  /**
   * Site type preset (qSiteType). Drives the nav/overview placeholder labels
   * and the homepage copy flavor; 'game-wiki' reproduces the pre-preset
   * output byte-for-byte (zero-breaking red line).
   */
  siteType: PresetId;
}


/**
 * Slot-href picker shared by every homepage preset builder.
 *
 * Preset slots carry fixed editorial ideas ("codes first, then bosses").
 * When the user did not choose that category, the literal href used to be
 * written anyway — a dead link on the homepage that reddened the fork's
 * first `check-links` run (popular.quickLinks was always dynamic via
 * cats.slice; this extends the same care to the fixed slots). Substitute
 * the first chosen category not yet claimed by an earlier slot
 * (deterministic: cats order), falling back to the first category, then to
 * the literal href when no categories exist at all (the CLI already warns
 * about that tree separately). Each real substitution warns on stderr; the
 * copy around it stays the user-editable placeholder it always was.
 *
 * The same preferred key can appear in several slots (the codes preset has
 * two "codes" slots: quickstart card + explore highlight). Substitution is
 * memoized per key so both slots land on ONE page — without the memo, each
 * call re-ran "first unclaimed" and a 4-category choice without codes
 * diverged them (earlier slots had claimed more categories by then). Also
 * collapses the duplicate per-slot warnings to one.
 */
function makePickHref(cats: string[]): {
  pick: (preferred: string) => string;
  isClaimed: (key: string) => boolean;
} {
  const claimed: string[] = [];
  const substituted = new Map<string, string>();
  const pick = (preferred: string): string => {
    if (cats.includes(preferred)) {
      if (!claimed.includes(preferred)) claimed.push(preferred);
      return `/${preferred}`;
    }
    const memo = substituted.get(preferred);
    if (memo !== undefined) return `/${memo}`;
    const actual = cats.find((c) => !claimed.includes(c)) ?? cats[0] ?? preferred;
    substituted.set(preferred, actual);
    if (actual !== preferred) {
      claimed.push(actual);
      console.warn(
        `⚠️ home preset expects the "${preferred}" category but it was not chosen — substituted "${actual}". Edit the home hrefs in the locale JSON to taste.`,
      );
    }
    return `/${actual}`;
  };
  // The game-wiki codes preset's third card computes its preferred key
  // OUTSIDE pick ("first category not yet claimed by an earlier card") —
  // expose the live claim state so that read keeps its exact semantics.
  return { pick, isClaimed: (key: string) => claimed.includes(key) };
}

/** Home-quicklink label for a category: the preset's nav override when it
 * defines one, else the single-word TitleCase the game-wiki preset uses. */
const homeQuickLinkLabel = (siteType: PresetId, key: string): string =>
  SITE_PRESETS[siteType].uiCopy.navLabels[key] ?? (key.charAt(0).toUpperCase() + key.slice(1));

/**
 * Homepage skeleton for the coupon-hub preset (deals/coupon sites). "热门优惠"
 * card deck first: the badge-list codes module doubles as the hot-deals slot.
 * Field shapes are the game-wiki homepage contract verbatim (same keys, same
 * types) — only the copy semantics differ, so check-i18n's key set and the
 * home components' rendering expectations hold for every site type. The
 * highlight label stays the CODE-PLACEHOLDER watermark (never a fabricated
 * code — placeholder codes live in the preset demo articles only).
 */
function buildCouponHome(input: SkinInput): Record<string, unknown> {
  const cats = input.categories.map((c) => c.key);
  const { pick: pickHref } = makePickHref(cats);
  const label = (key: string) => homeQuickLinkLabel(input.siteType, key);
  return {
    meta: {
      title: `${input.gameName} — Deals, Coupons & Saving Guides`,
      description: input.description,
    },
    updates: { title: 'Recent updates' },
    popular: {
      badge: 'Popular',
      title: 'Most read',
      quickLinks: cats.slice(0, 3).map((c) => ({ label: label(c), href: `/${c}` })),
    },
    closingCta: {
      title: 'Never overpay again',
      description: `Bookmark ${input.gameName} and check back before every purchase.`,
      primary: 'Browse all deals',
      secondary: 'Join the community',
    },
    hero: {
      badge: 'Verified deals',
      title: `${input.gameName} Deals`,
      description: `All working ${input.gameName} coupons and discounts, with expiry dates and money-saving guides.`,
      ctaPrimary: 'Browse deals',
      ctaSecondary: 'Saving guides',
    },
    start: {
      badge: 'Quick start',
      title: 'Jump straight in',
      cards: [
        { number: '1', title: 'Hot deals', description: 'Active coupons this week', icon: 'lucide:gift', href: pickHref('codes') },
        { number: '2', title: 'Tools', description: 'Software we cover', icon: 'lucide:package', href: pickHref('items') },
        { number: '3', title: 'Saving guides', description: 'Spend less, get more', icon: 'lucide:book-open', href: pickHref('guides') },
      ],
    },
    explore: {
      title: 'Explore',
      description: 'The essentials',
      modules: [
        {
          order: 1,
          name: 'Hot deals',
          description: 'Verified coupons, updated weekly',
          href: pickHref('codes'),
          displayType: 'badge-list',
          highlights: [
            { label: 'CODE-PLACEHOLDER', detail: 'Tap to copy on the deals page', badge: 'NEW' },
          ],
        },
      ],
    },
    faq: { title: 'FAQ', description: 'Common questions', items: [] },
  };
}

/**
 * Homepage skeleton for the tutorial-hub preset (how-to / knowledge-base
 * sites). Mirrors the game-wiki "guides" homepage shape with tutorial
 * wording; the steps module stays the isHomeSkeleton watermark (Step <n>).
 */
function buildTutorialHome(input: SkinInput): Record<string, unknown> {
  const cats = input.categories.map((c) => c.key);
  const { pick: pickHref } = makePickHref(cats);
  const label = (key: string) => homeQuickLinkLabel(input.siteType, key);
  return {
    meta: {
      title: `${input.gameName} — Tutorials & How-To Guides`,
      description: input.description,
    },
    updates: { title: 'Recent updates' },
    popular: {
      badge: 'Popular',
      title: 'Most read',
      quickLinks: cats.slice(0, 3).map((c) => ({ label: label(c), href: `/${c}` })),
    },
    closingCta: {
      title: 'Keep learning',
      description: `Bookmark ${input.gameName} — new tutorials land as the tools change.`,
      primary: 'Browse all tutorials',
      secondary: 'Join the community',
    },
    hero: {
      badge: 'Step-by-step tutorials',
      title: `${input.gameName} Tutorials`,
      description: `Practical ${input.gameName} tutorials that take you from zero to done — each with a quick answer and FAQ.`,
      ctaPrimary: 'Start learning',
      ctaSecondary: 'Browse all',
    },
    start: {
      badge: 'Quick start',
      title: 'New here?',
      cards: cats.slice(0, 4).map((c, i) => ({
        number: String(i + 1),
        title: label(c),
        description: `Browse ${label(c).toLowerCase()}`,
        icon: 'lucide:book-open',
        href: `/${c}`,
      })),
    },
    explore: {
      title: 'Explore',
      description: 'The learning path',
      modules: [
        {
          order: 1,
          name: 'Getting started',
          description: 'Follow the tutorials in order',
          href: pickHref('guides'),
          displayType: 'steps',
          highlights: [
            { label: 'Step 1', detail: 'Pick your topic', badge: '10 min' },
            { label: 'Step 2', detail: 'Build the site', badge: '1 hour' },
            { label: 'Step 3', detail: 'Publish and monetize', badge: 'ongoing' },
          ],
        },
      ],
    },
    faq: { title: 'FAQ', description: 'Common questions', items: [] },
  };
}

/**
 * Homepage skeleton for the recipe-hub preset (recipe / kitchen sites). Same
 * field contract as every other builder (identical keys, copy semantics
 * only); the badge-list module doubles as the featured-recipe slot and keeps
 * the RECIPE-PLACEHOLDER watermark — placeholder text only, real recipe
 * names live in the preset demo articles.
 */
function buildRecipeHome(input: SkinInput): Record<string, unknown> {
  const cats = input.categories.map((c) => c.key);
  const { pick: pickHref } = makePickHref(cats);
  const label = (key: string) => homeQuickLinkLabel(input.siteType, key);
  return {
    meta: {
      title: `${input.gameName} — Recipes & Kitchen Guides`,
      description: input.description,
    },
    updates: { title: 'Fresh out of the oven' },
    popular: {
      badge: 'Most baked',
      title: 'Reader favourites',
      quickLinks: cats.slice(0, 3).map((c) => ({ label: label(c), href: `/${c}` })),
    },
    closingCta: {
      title: 'Happy baking',
      description: `Bookmark ${input.gameName} — new recipes land every week.`,
      primary: 'Browse all recipes',
      secondary: 'Join the community',
    },
    hero: {
      badge: 'Tried and tested',
      title: `${input.gameName} Recipes`,
      description: `Every ${input.gameName} recipe is tested end to end, with ingredients, tools, and step-by-step photos.`,
      ctaPrimary: 'Browse recipes',
      ctaSecondary: 'Kitchen guides',
    },
    start: {
      badge: 'Quick start',
      title: 'Pick your next bake',
      cards: [
        { number: '1', title: 'All recipes', description: 'Tested classics first', icon: 'lucide:cake', href: pickHref('recipes') },
        { number: '2', title: 'Kitchen guides', description: 'Technique and prep', icon: 'lucide:book-open', href: pickHref('guides') },
        { number: '3', title: 'Kitchen tools', description: 'Gear we actually use', icon: 'lucide:wrench', href: pickHref('items') },
      ],
    },
    explore: {
      title: 'Explore',
      description: 'The essentials',
      modules: [
        {
          order: 1,
          name: 'Featured recipes',
          description: 'Reader favourites, updated weekly',
          href: pickHref('recipes'),
          displayType: 'badge-list',
          highlights: [
            { label: 'RECIPE-PLACEHOLDER', detail: 'Full recipe on its own page', badge: 'NEW' },
          ],
        },
      ],
    },
    faq: { title: 'FAQ', description: 'Common questions', items: [] },
  };
}

/**
 * Build a starter `home` namespace skeleton for a preset.
 * All copy uses the game name the user entered — placeholders to refine,
 * not demo-game leftovers. Module hrefs point at the categories they chose;
 * a fixed slot whose expected category was not picked substitutes a chosen
 * one (warn on stderr) instead of writing a dead link.
 *
 * Site types: game-wiki keeps the historical output below (byte-identical —
 * the zero-breaking red line); coupon-hub/tutorial-hub get their own builders
 * above with the SAME key skeleton (check-i18n's flattenKeys treats arrays as
 * leaves, so differing module counts/highlight lengths stay key-equal).
 */
function buildHomePreset(input: SkinInput): Record<string, unknown> | null {
  if (input.homePreset === 'keep') return null;
  if (input.siteType === 'coupon-hub') return buildCouponHome(input);
  if (input.siteType === 'tutorial-hub') return buildTutorialHome(input);
  if (input.siteType === 'recipe-hub') return buildRecipeHome(input);
  const cats = input.categories.map((c) => c.key);
  const first = cats[0] ?? 'guides';
  const cap = (c: string) => c[0].toUpperCase() + c.slice(1);
  const { pick: pickHref, isClaimed } = makePickHref(cats);

  // Field shapes MUST match what the home components render (HomePage reads
  // meta.title/meta.description, CTA fields are plain strings rendered as link
  // text, start.cards carry number/icon/href). A shape drift here crashes the
  // fork's first build — the demo JSON in src/locales/en.json is the contract.
  const common = {
    meta: {
      title:
        input.homePreset === 'codes'
          ? `${input.gameName} Wiki — Codes, Guides & Tier Lists`
          : `${input.gameName} Wiki — Guides, Bosses & Progression`,
      description: input.description,
    },
    updates: { title: 'Recent updates' },
    popular: {
      badge: 'Popular',
      title: 'Most read',
      quickLinks: cats.slice(0, 3).map((c) => ({ label: cap(c), href: `/${c}` })),
    },
    closingCta: {
      title: `Start your ${input.gameName} journey`,
      description: `Bookmark this wiki and check back after every game update.`,
      primary: 'Browse all',
      secondary: 'Join the community',
    },
  };

  if (input.homePreset === 'codes') {
    return {
      ...common,
      hero: {
        badge: 'Fan-made wiki',
        title: `${input.gameName} Codes`,
        description: `All working ${input.gameName} codes with expiry dates, plus guides and tier lists.`,
        ctaPrimary: 'Play now',
        ctaSecondary: 'Browse guides',
      },
      start: {
        badge: 'Quick start',
        title: 'Jump straight in',
        cards: [
          { number: '1', title: 'Codes', description: 'Free gold, XP, cosmetics', icon: 'lucide:gift', href: pickHref('codes') },
          { number: '2', title: 'Bosses', description: 'Phase-by-phase strategy', icon: 'lucide:swords', href: pickHref('bosses') },
          { number: '3', title: 'Tier list', description: 'Best weapons ranked', icon: 'lucide:bar-chart-3', href: pickHref(cats.find((c) => !isClaimed(c)) ?? first) },
        ],
      },
      explore: {
        title: 'Explore',
        description: 'The essentials',
        modules: [
          {
            order: 1,
            name: 'Active codes',
            description: 'Redeem before they expire',
            href: pickHref('codes'),
            displayType: 'badge-list',
            highlights: [
              { label: 'CODE-PLACEHOLDER', detail: 'Tap to copy on the codes page', badge: 'NEW' },
            ],
          },
        ],
      },
      faq: { title: 'FAQ', description: 'Common questions', items: [] },
    };
  }

  // 'guides' preset
  return {
    ...common,
    hero: {
      badge: input.gameName,
      title: `${input.gameName} Wiki`,
      description: `Complete ${input.gameName} guides — bosses, items, and progression.`,
      ctaPrimary: 'Start reading',
      ctaSecondary: 'Browse all',
    },
    start: {
      badge: 'Quick start',
      title: 'New here?',
      cards: cats.slice(0, 4).map((c, i) => ({
        number: String(i + 1),
        title: cap(c),
        description: `Browse ${c}`,
        icon: 'lucide:book-open',
        href: `/${c}`,
      })),
    },
    explore: {
      title: 'Explore',
      description: 'Content modules',
      modules: [
        {
          order: 1,
          name: 'Getting started',
          description: 'Step-by-step progression',
          href: pickHref('guides'),
          displayType: 'steps',
          highlights: [
            { label: 'Step 1', detail: 'Finish the tutorial', badge: '5 min' },
            { label: 'Step 2', detail: 'Claim starter codes', badge: '1 min' },
            { label: 'Step 3', detail: 'First boss run', badge: '15 min' },
          ],
        },
      ],
    },
    faq: { title: 'FAQ', description: 'Common questions', items: [] },
  };
}


/**
 * Demo placeholder values the shipped site.ts carries in its OPTIONAL,
 * hand-fill fields. rewriteSiteTs treats any non-empty current value that is
 * NOT in this list as user data and carries it across the rewrite (same
 * value-aware philosophy as rewriteWranglerVars); demo placeholders and
 * empties reset to the blank template silently — that is what a first run is
 * FOR. Exported so the contract test can drift-guard the shipped file.
 */
export const DEMO_SITE_OPTIONAL_VALUES: readonly string[] = [
  'https://discord.gg/example',
  'https://youtube.com/@example',
  'https://twitter.com/example',
  'https://reddit.com/r/anvilquest',
  // Demo official game URL — also the shipped sameAs[0] entry.
  'https://example.com/anvil-quest',
  'https://en.wikipedia.org/wiki/Anvil_Quest',
];

/**
 * Rewrite the `export const site: SiteConfig = { ... };` block in site.ts.
 * Returns null when the block cannot be found — the caller aborts loudly
 * without touching the file.
 *
 * Every user-supplied string is escaped for a single-quoted TS literal
 * (backslash FIRST, then quotes — otherwise a trailing backslash escapes the
 * closing quote and the file stops parsing) and inserted via a FUNCTION
 * replacer: string-mode replace expands `$&`/`$'`/`$$` sequences from user
 * input into the replacement, and an unescaped apostrophe in a game name
 * like "Assassin's …" previously produced a site.ts that did not parse.
 *
 * Value-aware backfill: the template hardcodes `contactEmail: ''` and a bare
 * `social { official }`, so a re-run used to silently CLEAR every optional
 * field the forker filled by hand (contactEmail, social.discord/youtube/
 * twitter/reddit, sameAs, defaultAuthor). The current values are read with
 * the same tsField anchors parseSiteTsIdentity uses; non-empty non-demo
 * values ride into the rewritten block. A field that is present but
 * unreadable (compressed one-line object, non-literal array entry…) warns
 * instead of vanishing silently — the destructive direction is never silent.
 * On a pristine demo file the output is byte-identical to the old template
 * (demo placeholders wipe, nothing extra is emitted).
 */
export function rewriteSiteTs(src: string, input: SkinInput): string | null {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const siteRe = /export const site: SiteConfig = \{[\s\S]*?\n\};/;
  if (!siteRe.test(src)) return null;

  const readOptional = (field: string): { value: string; unreadable: boolean } => {
    const m = tsField(field).exec(src);
    if (m) return { value: tsUnescape(m[1] ?? m[2]), unreadable: false };
    // Present but not a parseable quoted literal (empty strings DO match
    // tsField, so a miss here means the value could not be read at all).
    // The `?` in an interface declaration (`contactEmail?: string;`) blocks
    // both regexes, so the type block above never false-positives.
    if (new RegExp(`\\b${field}\\s*:`).test(src)) return { value: '', unreadable: true };
    return { value: '', unreadable: false };
  };
  const keepValue = (v: string): boolean =>
    v.trim() !== '' && !DEMO_SITE_OPTIONAL_VALUES.includes(v);

  const contact = readOptional('contactEmail');
  if (contact.unreadable) {
    console.warn(
      '⚠️ could not read the current contactEmail value in src/config/site.ts (unrecognized literal shape) — the rewrite drops it. Re-add it manually if it held your data.',
    );
  }
  const keptContactEmail = contact.unreadable ? '' : keepValue(contact.value) ? contact.value : '';

  const author = readOptional('defaultAuthor');
  if (author.unreadable) {
    console.warn(
      '⚠️ could not read the current defaultAuthor value in src/config/site.ts (unrecognized literal shape) — the rewrite drops it. Re-add it manually if it held your data.',
    );
  }
  const keptDefaultAuthor = author.unreadable ? '' : keepValue(author.value) ? author.value : '';

  const socialKept: [string, string][] = [];
  for (const field of ['discord', 'youtube', 'twitter', 'reddit'] as const) {
    const { value, unreadable } = readOptional(field);
    if (unreadable) {
      console.warn(
        `⚠️ could not read the current social.${field} value in src/config/site.ts (unrecognized literal shape) — the rewrite drops it. Re-add it manually if it held your data.`,
      );
    } else if (keepValue(value)) {
      socialKept.push([field, value]);
    }
  }

  // sameAs is an array of URL strings: keep the non-demo plain-string
  // entries. Non-literal residue (a spread, a computed entry) means the array
  // cannot be faithfully reconstructed — keep what parses, warn about the rest.
  let sameAs: string[] = [];
  const sameAsRe = /\bsameAs\s*:\s*\[([\s\S]*?)\]/;
  if (sameAsRe.test(src)) {
    const raw = sameAsRe.exec(src)![1];
    const literalRe = /'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g;
    const literals: string[] = [];
    for (const m of raw.matchAll(literalRe)) literals.push(tsUnescape(m[1] ?? m[2]));
    const residue = raw.replace(literalRe, '').replace(/[\s'",[\]]/g, '');
    if (residue !== '') {
      console.warn(
        '⚠️ could not fully parse the current sameAs array in src/config/site.ts (non-literal entries) — only the plain string entries were carried over. Re-add the rest manually.',
      );
    }
    sameAs = literals.filter(keepValue);
  }

  const socialBlock = [
    '  social: {',
    `    official: '${esc(input.officialUrl)}',`,
    ...socialKept.map(([field, value]) => `    ${field}: '${esc(value)}',`),
    '  },',
  ].join('\n');
  const sameAsBlock =
    sameAs.length > 0
      ? `  sameAs: [\n${sameAs.map((u) => `    '${esc(u)}',`).join('\n')}\n  ],\n`
      : '';
  const defaultAuthorBlock =
    keptDefaultAuthor !== '' ? `  defaultAuthor: '${esc(keptDefaultAuthor)}',\n` : '';
  // Site-type signal for presentation variants (deals list view). Written ONLY
  // for the non-default presets — a game-wiki fork emits no line at all, so the
  // default-path output stays byte-identical (zero-breaking red line).
  const siteTypeBlock =
    input.siteType !== 'game-wiki'
      ? `  // Written by apply-template — drives presentation variants (e.g. the coupon deals list).\n  siteType: '${input.siteType}',\n`
      : '';
  const newSite = `export const site: SiteConfig = {
  name: '${esc(input.gameName)} Wiki',
  shortName: '${esc(input.shortName)}',
  description: '${esc(input.description)}',
  domain: '${esc(input.domain)}',
  tagline: '${esc(input.tagline)}',
  legalNotice: '${esc(input.legalNotice)}',
${siteTypeBlock}  // Set a real address if you run no social channels — the contact page
  // renders it as a mailto link.
  contactEmail: '${esc(keptContactEmail)}',
${socialBlock}
${sameAsBlock}  game: {
    name: '${esc(input.gameName)}',
    platform: '${esc(input.platform)}',
    developer: '${esc(input.developer)}',
    genre: '${esc(input.genre)}',
    releaseDate: '${esc(input.releaseDate)}',
  },
${defaultAuthorBlock}  // og:image dims of the SHIPPED hero.webp — if you replace public/images/hero.webp,
  // update these in src/config/site.ts to match (wrong dims mis-crop share cards).
  ogImageWidth: 1200,
  ogImageHeight: 630,
};`;
  return src.replace(siteRe, () => newSite);
}


// ---------------------------------------------------------------------------
// Re-run identity detection (S12): a re-run must default prompts to the
// CURRENT site.ts values, not the demo placeholders — pressing enter through
// every prompt has to mean "confirm what is already there", never "silently
// re-skin the site back to the demo".
// ---------------------------------------------------------------------------

/** The demo domains a fork must rebrand away from (site.ts `domain` + SITE_URL). */
export const DEMO_DOMAINS = ['anvil.wiki', 'anvilwiki.pages.dev'];

export interface SiteTsIdentity {
  name: string;
  shortName: string;
  description: string;
  domain: string;
  tagline: string;
  legalNotice: string;
  officialUrl: string;
  gameName: string;
  platform: string;
  developer: string;
  genre: string;
  releaseDate: string;
}

/** Undo tsEscape's two escapes (`\\` → `\`, `\'` → `'`) — plus `\"` for
 * hand-edited double-quoted files (canonical CLI writes are single-quoted). */
const tsUnescape = (s: string) => s.replace(/\\(['"\\])/g, '$1');

/** A TS string literal on its own line (`  field: 'value',`) — single OR
 * double quoted. Canonical CLI output is single-quoted; the double-quote
 * branch exists so a hand-edited file still reads back as the user's
 * identity instead of null — null makes a re-run fall back to demo defaults
 * with no ♻️ banner, which is the destructive direction. */
const tsField = (field: string) =>
  new RegExp(`^\\s*${field}:\\s*(?:'((?:\\\\.|[^'\\\\])*)'|"((?:\\\\.|[^"\\\\])*)")`, 'm');

/**
 * Read the CURRENT identity back out of src/config/site.ts, with the same
 * anchors rewriteSiteTs writes (regex only — importing the TS module would
 * drag astro:content into a plain-node CLI). `game.name` is anchored to its
 * `game: {` block so the interface declaration above it can never match.
 * Returns null when a core field cannot be found — the caller falls back to
 * first-run defaults rather than guessing a half-read identity.
 */
export function parseSiteTsIdentity(src: string): SiteTsIdentity | null {
  const pick = (re: RegExp) => {
    const m = re.exec(src);
    return m?.[1] ?? m?.[2];
  };
  const raw = {
    name: pick(tsField('name')),
    shortName: pick(tsField('shortName')),
    description: pick(tsField('description')),
    domain: pick(tsField('domain')),
    tagline: pick(tsField('tagline')),
    legalNotice: pick(tsField('legalNotice')),
    officialUrl: pick(/official:\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")/),
    gameName: pick(/\bgame:\s*\{\s*name:\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")/),
    platform: pick(tsField('platform')),
    developer: pick(tsField('developer')),
    genre: pick(tsField('genre')),
    releaseDate: pick(tsField('releaseDate')),
  };
  // Empty strings are legal values (releaseDate is optional); MISSING fields are not.
  if (Object.values(raw).some((v) => v === undefined)) return null;
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, tsUnescape(v as string)]),
  ) as unknown as SiteTsIdentity;
}

/**
 * Is this identity still the untouched demo? Deliberately AND, not OR: a
 * HALF-rebranded site (game renamed, demo domain forgotten) must count as a
 * re-run and default to its current values — falling back to demo defaults
 * there would reset the user's game name on a careless enter-through.
 */
export function isDemoSiteTsIdentity(id: SiteTsIdentity): boolean {
  return id.gameName === DEMO_GAME_NAMES[0] && DEMO_DOMAINS.includes(id.domain);
}

export interface PromptDefaults {
  gameName: string;
  shortName: string;
  domain: string;
  tagline: string;
  description: string;
  legalNotice: string;
  officialUrl: string;
  platform: string;
  developer: string;
  genre: string;
  releaseDate: string;
}

/**
 * Prompt defaults for a RE-RUN: exactly what site.ts carries now, so an
 * enter-through rewrites the site to what it already is.
 */
export function rerunPromptDefaults(id: SiteTsIdentity): PromptDefaults {
  return {
    gameName: id.gameName,
    shortName: id.shortName,
    domain: id.domain,
    tagline: id.tagline,
    description: id.description,
    legalNotice: id.legalNotice,
    officialUrl: id.officialUrl,
    platform: id.platform,
    developer: id.developer,
    genre: id.genre,
    releaseDate: id.releaseDate,
  };
}


/** The fixed tail of a machine-generated overviewDescription. */
const OVERVIEW_PLACEHOLDER_TAIL =
  '. Replace this overview text in the locale JSON — it feeds the category page title and description.';

/**
 * Is this description still the machine placeholder a previous run wrote?
 * Every generator (game-wiki AND the site-type presets) appends the same
 * fixed OVERVIEW_PLACEHOLDER_TAIL; hand-edited copy drops it, so the tail
 * alone is the machine watermark. (The historical check also required the
 * "<Key> content for " head; the preset generators write deal/tutorial heads,
 * which must regenerate on a rename exactly like the game-wiki ones.) `key`
 * is kept in the signature for call-site stability.
 */
export function isPlaceholderOverviewDesc(key: string, desc: string): boolean {
  void key;
  return desc.endsWith(OVERVIEW_PLACEHOLDER_TAIL);
}

/**
 * Is this home namespace still a machine skeleton (a previous run's preset
 * output)? The presets always write an EMPTY faq.items and highlight labels
 * of exactly 'CODE-PLACEHOLDER' / 'Step <n>'; user data — FAQ entries or a
 * renamed highlight label — flips the verdict. (Copy edits confined to
 * hero/start strings are not detected — those fields carry no machine
 * watermark — so a fully hand-polished home should re-run with preset
 * "keep".) Used to warn before a preset overwrite, not to block it.
 */
export function isHomeSkeleton(home: unknown): boolean {
  if (home === null || typeof home !== 'object' || Array.isArray(home)) return true;
  const h = home as Record<string, unknown>;
  const faqItems = (h.faq as { items?: unknown } | undefined)?.items;
  if (Array.isArray(faqItems) && faqItems.length > 0) return false;
  const modules = (h.explore as { modules?: unknown } | undefined)?.modules;
  if (Array.isArray(modules)) {
    for (const mod of modules) {
      const highlights = (mod as { highlights?: unknown } | undefined)?.highlights;
      if (!Array.isArray(highlights)) continue;
      for (const hl of highlights) {
        const label = (hl as { label?: unknown } | undefined)?.label;
        if (
          typeof label === 'string' &&
          label !== 'CODE-PLACEHOLDER' &&
          !/^Step \d+$/.test(label)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Rewrite the per-locale JSON for the chosen skin. `copyrightYear` is passed
 * in by the caller (apply-template derives it from lib/today.ts) — this layer
 * stays pure, with no hidden dependency on the wall clock (a night run must
 * not stamp a different year than the CLI reported).
 *
 * `cloneBase` is the DEFAULT locale's just-rewritten output, passed by the
 * CLI when `existing` is undefined (a brand-new locale file): the clone
 * contributes the namespaces this rewrite does not own ($schema, search.*,
 * shared.*, the rest of footer) so the new file passes the fork's first
 * `check-i18n --strict-ui` run — new-locale.ts's whole-file en→<locale>
 * clone is the reference behavior, and without it the fresh file shipped a
 * ~76-key-shorter skeleton. It must be the REWRITTEN OUTPUT (the user's
 * identity), never the demo en.json still on disk. The resets below re-cover
 * site / footer.copyrightText / footer.playGame / nav / overview / home, so
 * the overlap is idempotent; when `existing` exists it always wins — a
 * re-run must never clobber the user's translations with the clone.
 */
export function rewriteLocaleJson(
  input: SkinInput,
  locale: string,
  copyrightYear: number,
  existing?: string,
  cloneBase?: string,
): string {
  // Start from existing (if any), else the clone base (new file), else a
  // minimal skeleton; reset site/footer/nav/overview.
  let obj: Record<string, unknown> = {};
  if (existing) {
    try {
      obj = JSON.parse(existing);
    } catch {
      // Same philosophy as isDemoLocaleContent's never-delete-unreadable:
      // rebuilding is the only way forward, but it must never be SILENT — a
      // hand-edited file losing every key the user added is the destructive
      // direction. stderr, like every other warn in this lib.
      console.warn(`⚠️ existing ${locale}.json is not valid JSON — rebuilt from skeleton`);
      obj = {};
    }
  } else if (cloneBase) {
    try {
      obj = JSON.parse(cloneBase);
    } catch {
      // cloneBase is this function's own JSON.stringify output (always
      // valid); the catch only guards a caller passing garbage.
      obj = {};
    }
  }
  // Always (re)write the site-level strings for this locale.
  obj.site = {
    name: `${input.gameName} Wiki`,
    shortName: input.shortName,
    description: input.description,
    tagline: input.tagline,
    legalNotice: input.legalNotice,
  };
  obj.footer = obj.footer ?? {};
  (obj.footer as Record<string, unknown>).copyrightText = `© ${copyrightYear} ${input.gameName} Wiki. All rights reserved.`;
  // playGame carries the game name ("Play Anvil Quest" in the demo JSON) —
  // left as-is it survives the reset and rides the clone into every fresh
  // locale, leaking the demo identity past the zero-demo-strings contract.
  // Like copyrightText it is game-derived template text, regenerated each
  // run; the remaining footer labels are generic and stay editable.
  (obj.footer as Record<string, unknown>).playGame = `Play ${input.gameName}`;
  // nav + overview are auto-filled for the chosen categories. Deliberately
  // NOT left empty: an empty nav means the fork's first `pnpm check-config`
  // run is red (3-place rule) and SiteHeader renders raw lowercase keys —
  // both on day one, before the user has written a single label. The English
  // defaults below are placeholders users translate/edit per locale.
  const cap = (key: string) =>
    key
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  const navFixed: Record<string, string> = {
    home: 'Home',
    toggleTheme: 'Toggle theme',
    menu: 'Menu',
    close: 'Close',
    search: 'Search',
    language: 'Language',
  };
  const navCategories: Record<string, string> = {};
  const generatedOverview: Record<string, { overviewTitle: string; overviewDescription: string }> = {};
  // Per-site-type placeholder copy (site-presets.ts). Unlisted keys fall back
  // to the historical TitleCase / "All <Key>" templates, so the game-wiki
  // preset (empty tables) writes byte-identical output. Every description
  // ends with OVERVIEW_PLACEHOLDER_TAIL so isPlaceholderOverviewDesc keeps
  // treating machine output — whatever the site type — as regenerable.
  const presetCopy = SITE_PRESETS[input.siteType].uiCopy;
  for (const { key } of input.categories) {
    navCategories[key] = presetCopy.navLabels[key] ?? cap(key);
    generatedOverview[key] = {
      overviewTitle: presetCopy.overviewTitles[key] ?? `All ${cap(key)}`,
      overviewDescription:
        (presetCopy.overviewDescriptions[key] ?? `${cap(key)} content for ${input.gameName}`).replace(
          '{game}',
          input.gameName,
        ) + OVERVIEW_PLACEHOLDER_TAIL,
    };
  }
  // Keep a previous run's labels, but ONLY for keys this run still owns AND
  // only on a genuine RE-RUN: on a first run the file still carries the
  // DEMO's labels, and a site type that owns a label for a key must win it
  // (a coupon fork kept the game demo's "Codes" instead of "Deals" when the
  // demo label rode the overlay). Scope the first-run suppression to exactly
  // that scenario: non-game-wiki presets reset every nav key to the preset /
  // TitleCase placeholders so no game-demo label leaks, while game-wiki
  // (empty preset tables) keeps the unconditional overlay — byte-identical
  // to the pre-preset behavior for EVERY locale, including ja (the demo
  // ja.json ships real Japanese labels). Re-runs always keep the user's own
  // labels. Overlay order is fixed keys < generated placeholders < previous
  // labels, so labels a user translated on an earlier run survive re-runs
  // instead of being reset.
  const rerun = existing !== undefined && !isDemoLocaleContent(existing);
  const ownable = new Set([...Object.keys(navFixed), ...Object.keys(navCategories)]);
  const prevNav = Object.fromEntries(
    Object.entries((obj.nav ?? {}) as Record<string, unknown>).filter(
      ([k, v]) =>
        ownable.has(k) &&
        typeof v === 'string' &&
        v.trim() !== '' &&
        (rerun || (input.siteType === 'game-wiki' && presetCopy.navLabels[k] === undefined)),
    ),
  );
  obj.nav = { ...navFixed, ...navCategories, ...prevNav };
  // overview + home are re-run-aware, like prevNav above — but gated on the
  // SAME demo marker the locale-deletion path trusts (isDemoLocaleContent):
  // a file that still carries the demo site.name is a FIRST run and must be
  // overwritten wholesale, or demo copy leaks into the fork (v2.6.3
  // semantics). Only a non-demo file can hold user copy worth keeping.
  if (rerun) {
    const prevOverview = (obj.overview ?? {}) as Record<string, unknown>;
    const keptOverview: Record<string, { overviewTitle: string; overviewDescription: string }> = {};
    for (const [key, gen] of Object.entries(generatedOverview)) {
      const prev = prevOverview[key] as
        | { overviewTitle?: unknown; overviewDescription?: unknown }
        | undefined;
      const prevTitle = prev?.overviewTitle;
      const prevDesc = prev?.overviewDescription;
      // Titles carry no game name (nothing to leak), so any non-empty string
      // is kept; descriptions survive only when actually edited — a previous
      // run's placeholder regenerates (isPlaceholderOverviewDesc).
      keptOverview[key] = {
        overviewTitle:
          typeof prevTitle === 'string' && prevTitle.trim() !== ''
            ? prevTitle
            : gen.overviewTitle,
        overviewDescription:
          typeof prevDesc === 'string' &&
          prevDesc.trim() !== '' &&
          !isPlaceholderOverviewDesc(key, prevDesc)
            ? prevDesc
            : gen.overviewDescription,
      };
    }
    obj.overview = keptOverview;
  } else {
    obj.overview = generatedOverview;
  }
  // Homepage preset skeleton (unless 'keep'). The preset is an explicit
  // choice on every run, so it still overwrites — but overwriting a home
  // that is NOT a machine skeleton (FAQ entries or edited highlight labels)
  // warns first, the same warn-before-destructive contract as the demo
  // content clearing.
  const home = buildHomePreset(input);
  if (home) {
    if (rerun && !isHomeSkeleton(obj.home)) {
      console.warn(
        `⚠️ the existing home namespace in ${locale}.json holds edited copy (FAQ entries or custom highlight labels) — the homepage preset will REPLACE it. Re-apply your edits afterwards, or re-run with preset "keep" to preserve it.`,
      );
    }
    obj.home = home;
  }
  return JSON.stringify(obj, null, 2) + '\n';
}


/**
 * Reset wrangler.toml [vars] for the forker's own site.
 *
 * Why: when wrangler.toml exists it is the SOLE source of truth for the
 * Cloudflare Pages project env (dashboard UI is ignored). The shipped file
 * carries the DEMO site's Giscus config — an unedited fork would silently
 * point its comment section at the original repo's GitHub Discussions.
 * We rewrite SITE_URL to the forker's domain and blank the Giscus values.
 *
 * Re-run safety: the rewrite is VALUE-AWARE. The current [vars] block is
 * parsed first; any non-empty value that is not a known demo value is USER
 * data (their Giscus app, their GA4 property, their beacon token…) and is
 * carried into the rewritten block — an apply-template re-run no longer
 * wipes env the user already filled. Demo values (DEMO_VAR_VALUES) and empty
 * values reset to the blank template; SITE_URL always follows the CLI's
 * domain answer; commented-out template lines (`#KEY = ""`) hold no value
 * and never participate in preservation.
 */

/**
 * Known demo env VALUES that must never survive a rewrite even though the
 * key now carries user data: the demo Giscus config (would point a fork's
 * comments at PNGTRID/AnvilWiki Discussions), both demo SITE_URL hosts, the
 * demo Adsterra unit keys (all six, incl. the 320x50 anchor), the demo
 * GA4 measurement ID, and the demo IndexNow key (forks must not submit
 * URLs under the demo site's ownership key). Exported for tests (a drift
 * guard parses the shipped wrangler.toml against this list).
 */
export const DEMO_VAR_VALUES: readonly string[] = [
  // Demo SITE_URL (canonical domain + the legacy pages.dev host)
  'https://anvil.wiki',
  'https://anvilwiki.pages.dev',
  // Demo Giscus
  'PNGTRID/AnvilWiki',
  'R_kgDOT1aRPQ',
  // NOTE: 'Announcements' is deliberately NOT here — it is GitHub's suggested
  // giscus category name, so real forks legitimately run with it. Whether
  // PUBLIC_GISCUS_CATEGORY is demo leftover is decided by the paired-ID rule
  // in isDemoVarValue below.
  'DIC_kwDOT1aRPc4DDODo',
  // Demo Adsterra unit keys
  '72f65aae2e14988904cffe17cfe697e2',
  'e0dce7760389a360cba34b93333ea2d0',
  '8fabf9ea9ed2d89cba2ff9888f939c26',
  '89fabda9f10bc13544cae84f0211d77c',
  'fba4ed072bed8749c56ebcf099b30f0e',
  'e2ad36227bacdad94a4bfe6a9a6d3dac',
  // Demo GA4 measurement ID
  'G-X10CG7N6P6',
  // Demo VibeCafé telemetry ids (product + web auth key)
  'cmvdec106000002nyeuo0o767',
  'vc_web_l7OmJ4CD2hLlHkHojq3-M7p0FsluYhiiRjAew-vwKG0',
  // Demo site's legacy IndexNow env key. New forks use .indexnow-key;
  // keep this registered so Initialize/apply-template strip the demo value
  // instead of carrying anvil.wiki ownership into a fork.
  '736d8608fdec899849d382dffdaf4dda78605ffe0f40e2f1dbb57c7390341bed',
];

/**
 * Demo-value test with key context. Flat list for unguessable values; the one
 * guessable demo value (category name "Announcements") only counts as demo
 * when paired with the demo category ID — a fork with its own ID and the same
 * name must survive a re-run (wiping it silently disabled their comments
 * while the preserved ID left the config self-contradictory).
 */
function isDemoVarValue(key: string, value: string, existing: Map<string, string>): boolean {
  if (DEMO_VAR_VALUES.includes(value)) return true;
  if (key === 'PUBLIC_GISCUS_CATEGORY' && value === 'Announcements') {
    return existing.get('PUBLIC_GISCUS_CATEGORY_ID') === 'DIC_kwDOT1aRPc4DDODo';
  }
  return false;
}

/** One [vars] line of the reset template, in shipped order. */
interface VarSpec {
  key: string;
  /** Comment lines rendered directly above this key's line. */
  comments?: string[];
  /** Render commented-out (`#KEY = ""`) unless a user value is preserved — optional slots a fork enables explicitly. */
  commented?: boolean;
  /** Shipped default when nothing is preserved (only PUBLIC_GISCUS_MAPPING is non-empty). */
  blank?: string;
}

const WRANGLER_VARS_TEMPLATE: VarSpec[] = [
  {
    key: 'SITE_URL',
    comments: ['Site (must include https:// protocol — Astro validates this as a URL)'],
  },
  {
    key: 'INDEXNOW_KEY',
    comments: [
      'Legacy IndexNow override — new forks generate .indexnow-key automatically.',
      'Leave blank unless migrating an existing env-backed deployment.',
    ],
    commented: true,
  },
  {
    key: 'PUBLIC_GISCUS_REPO',
    comments: [
      'Giscus comments — blank = comments disabled until you fill your own values.',
      'See docs/comments.md for how to get these from giscus.app.',
    ],
  },
  { key: 'PUBLIC_GISCUS_REPO_ID' },
  { key: 'PUBLIC_GISCUS_CATEGORY' },
  { key: 'PUBLIC_GISCUS_CATEGORY_ID' },
  { key: 'PUBLIC_GISCUS_MAPPING', blank: 'pathname' },
  {
    key: 'PUBLIC_SPONSOR_URL',
    comments: ['Sponsor card — blank = disabled. Fill PUBLIC_SPONSOR_URL to enable.'],
  },
  { key: 'PUBLIC_SPONSOR_IMAGE_URL' },
  { key: 'PUBLIC_CF_BEACON_TOKEN', comments: ['Cloudflare Web Analytics — blank = disabled.'] },
  {
    key: 'PUBLIC_ADSENSE_CLIENT',
    comments: ['Optional slots (empty = disabled) — fill HERE, not the dashboard:'],
    commented: true,
  },
  { key: 'PUBLIC_ADSENSE_SLOT_STICKY', commented: true },
  { key: 'PUBLIC_ADSENSE_SLOT_SIDEBAR', commented: true },
  { key: 'PUBLIC_ADSENSE_SLOT_INCONTENT', commented: true },
  {
    key: 'PUBLIC_ADSTERRA_SLOT_SIDEBAR_300X250',
    comments: [
      'Adsterra — for each slot you enable, also create public/ads/<name>.html with',
      'the snippet from the Adsterra dashboard (pattern: docs/ads.md 「广告位怎么挂」).',
    ],
    commented: true,
  },
  { key: 'PUBLIC_ADSTERRA_SLOT_INCONTENT_728X90', commented: true },
  { key: 'PUBLIC_ADSTERRA_SLOT_NATIVE_BANNER', commented: true },
  { key: 'PUBLIC_ADSTERRA_SLOT_STICKY_320X50', commented: true },
  { key: 'PUBLIC_ADSTERRA_SLOT_SIDEBAR_160X300', commented: true },
  { key: 'PUBLIC_ADSTERRA_SLOT_SIDEBAR_160X600', commented: true },
  {
    key: 'PUBLIC_VIBECAFE_PRODUCT_ID',
    comments: ['VibeCafé product telemetry — set BOTH this and the auth key to enable.'],
    commented: true,
  },
  { key: 'PUBLIC_VIBECAFE_AUTH_KEY', commented: true },
  { key: 'PUBLIC_GA_ID', commented: true },
  { key: 'PUBLIC_GSC_VERIFICATION', commented: true },
];

/**
 * The input parameter is deliberately the minimal shape the rewrite consumes
 * (`domain` for SITE_URL — the only key that always follows the CLI answer).
 * Any caller holding a full SkinInput satisfies it structurally.
 */
export function rewriteWranglerVars(input: { domain: string }, src: string): string | null {
  const filePath = 'wrangler.toml';
  // TOML basic strings: strip newline/control characters (defense-in-depth —
  // answers are rejected at the CLI's ask layer), then escape the backslash
  // first and the double quote second.
  const tomlStr = (s: string) =>
    stripControlChars(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  // Anchor [vars] at LINE START (the demo file's intro comment contains the
  // literal text "[vars]" mid-line — an unanchored match rewrote the comment
  // and left the real demo Giscus section below). Two JS regex traps here:
  // no `m` flag (with it, `$` means line-end, not file-end) and no `\Z`
  // (JS treats that as the literal character "Z" — the match silently fails
  // and the file ships unrewritten).
  // Tolerate CRLF working trees: .gitattributes forces LF at checkout, but a
  // fork user's editor may still convert the file before they run the CLI —
  // a bare `\n` after `[vars]` would silently fail on `\r\n` and leave the
  // demo Giscus values in place.
  const varsRe = /(^|\n)\[vars\]\r?\n[\s\S]*?(?=\r?\n\[|$)/;
  if (!varsRe.test(src)) {
    console.warn(`⚠️ Could not find [vars] section in ${filePath} — edit it manually.`);
    return null;
  }
  const eol = /(^|\n)\[vars\]\r\n/.test(src) ? '\r\n' : '\n';

  // Parse the CURRENT [vars] block's uncommented `KEY = "value"` lines.
  // Commented `#KEY = ""` placeholders hold no value and never participate.
  // Forms beyond the bare double-quoted line are valid TOML a hand editor
  // produces — a trailing inline comment (`KEY = "G-ABC" # prod`), a
  // single-quoted literal string, or a bare scalar (`KEY = 42` / `true`;
  // preserved verbatim and re-emitted quoted — Pages env vars are strings
  // anyway, and resetting a hand-set value is the destructive direction).
  // Failing to parse them used to make the value-aware rewrite silently
  // RESET that value on re-run. Value char classes are escape-aware so `\"`
  // inside doesn't end the string early.
  const section = src.match(/(?:^|\n)\[vars\]\r?\n([\s\S]*?)(?=\r?\n\[|$)/)?.[1] ?? '';
  const existing = new Map<string, string>();
  // Raw (trimmed) source lines keyed the same way — keys OUTSIDE the template
  // are re-emitted verbatim instead of dropped (audit round 21: the template
  // cannot know a fork's custom vars; losing them silently on a re-run is the
  // destructive direction, same philosophy as the warn-and-keep paths for
  // locale files and user articles).
  const existingRaw = new Map<string, string>();
  // Lines that are neither blank, a comment, nor parseable as KEY = value —
  // dotted keys (`MY.KEY = "x"`), tables of arrays, etc. The rewrite can only
  // re-emit what it parsed, so these lines are DROPPED from the rewritten
  // section; that must never happen silently.
  const unparsedLines: string[] = [];
  for (const line of section.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:"((?:\\.|[^"\\])*)"|'([^']*)'|([^#\s][^#]*?))\s*(?:#.*)?$/);
    if (m) {
      existing.set(m[1], m[2] ?? m[3] ?? m[4]);
      existingRaw.set(m[1], line.trim());
      continue;
    }
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    unparsedLines.push(trimmed);
  }
  for (const line of unparsedLines) {
    console.warn(
      `⚠️ [vars] line "${line}" could not be parsed (dotted key or unusual TOML?) and will be DROPPED from the rewritten [vars] section — move it outside [vars] or re-add it manually.`,
    );
  }
  const templateKeys = new Set(WRANGLER_VARS_TEMPLATE.map((spec) => spec.key));
  const unknownKeys = [...existing.keys()].filter((key) => !templateKeys.has(key));
  for (const key of unknownKeys) {
    console.warn(
      `⚠️ [vars] key "${key}" is not part of the template — its line is preserved verbatim at the end of the [vars] section. Remove it manually if unwanted.`,
    );
  }

  const lines: string[] = ['[vars]'];
  for (const spec of WRANGLER_VARS_TEMPLATE) {
    for (const c of spec.comments ?? []) lines.push(`# ${c}`);
    if (spec.key === 'SITE_URL') {
      // Always follows the CLI's domain answer (check-config's domain gate
      // compares it against site.ts, which the same run rewrites).
      lines.push(`SITE_URL = "https://${tomlStr(input.domain)}"`);
      continue;
    }
    const current = existing.get(spec.key);
    const keep =
      current !== undefined && current !== '' && !isDemoVarValue(spec.key, current, existing)
        ? current
        : null;
    const rendered =
      keep !== null
        ? `${spec.key} = "${tomlStr(keep)}"`
        : `${spec.key} = "${tomlStr(spec.blank ?? '')}"`;
    // A preserved value for a commented-out slot means the user explicitly
    // enabled it — re-emit it uncommented.
    lines.push(spec.commented && keep === null ? `#${rendered}` : rendered);
  }
  if (unknownKeys.length > 0) {
    lines.push('');
    lines.push('# Custom [vars] keys the template does not know are preserved verbatim.');
    for (const key of unknownKeys) {
      lines.push(existingRaw.get(key) ?? `${key} = "${tomlStr(existing.get(key) ?? '')}"`);
    }
  }
  const newVarsBlock = lines.join(eol);
  // Remove the demo-intro warning block: after the [vars] rewrite it would
  // claim "this file contains the DEMO SITE config" about values that are
  // now the forker's own — a stale, misleading comment. Anchors are ASCII:
  // the ⚠️ emoji is a multi-codepoint sequence that silently fails `⚠️+`.
  // The inserted block adopts the file's own EOL so the section is not left
  // with mixed line endings.
  const out = src.replace(varsRe, (_match, pre) => `${pre}${newVarsBlock}${eol}`);
  const demoIntroRe = /# .*FORKERS READ THIS FIRST[\s\S]*?# .*END FORKER WARNING.*\n?/;
  return demoIntroRe.test(out) ? out.replace(demoIntroRe, '') : out;
}


/**
 * Demo artwork inventories — deleted BY NAME, never by wildcard or whole
 * directory: public/images/articles/ is where docs/content-format.md tells
 * authors to put their own inline card images, so an rm -rf there would
 * destroy user work on a re-run. Keep in sync with the "Clear demo content"
 * step in .github/workflows/setup.yml — pinned by tests/apply-template.test.ts.
 *
 * DEMO_COVERS is the flat union of every site preset's demoAssets
 * (scripts/lib/site-presets.ts — the single source per preset). The order
 * below is deterministic (game-wiki → coupon-hub → tutorial-hub); the setup.yml
 * sync test compares SORTED sets, so grouping here is free.
 */
export const DEMO_COVERS = [
  ...SITE_PRESETS['game-wiki'].demoAssets,
  // v2.6.0 demo content batch — same by-name rule: never delete a cover a
  // fork user created. Keep in sync with setup.yml's rm -f list.
  ...SITE_PRESETS['coupon-hub'].demoAssets,
  ...SITE_PRESETS['tutorial-hub'].demoAssets,
  ...SITE_PRESETS['recipe-hub'].demoAssets,
];

export const DEMO_GALLERY_IMAGES = [
  'beginner-class-picks.png',
  'beginner-route.png',
  'emberfang-arena.png',
  'emberfang-mechanics.png',
  'stormcaller-arena.png',
  'stormcaller-mechanics.png',
];

export const DEMO_ARTICLE_IMAGES = [
  'weapon-frostpike.png',
  'weapon-voidforge.png',
];

/**
 * Demo Adsterra unit-key registry — the unique demo unit key embedded in
 * each public/ads/<name>.html. Classification is content-aware, NOT
 * filename-based: a fork that keeps the standard filenames but pastes its
 * own ad snippets (per docs/ads.md) must survive reruns of apply-template
 * and the setup.yml cleanup (real-fork report: a same-named unit holding
 * user ad code used to be deleted as demo residue). A file counts as demo
 * only while it still contains the demo key below.
 */
export const DEMO_ADSTERRA_UNIT_MARKERS: Record<string, string> = {
  'ads/sticky-320x50.html': 'e2ad36227bacdad94a4bfe6a9a6d3dac',
  'ads/sidebar-300x250.html': '72f65aae2e14988904cffe17cfe697e2',
  'ads/sidebar-160x300.html': '89fabda9f10bc13544cae84f0211d77c',
  'ads/sidebar-160x600.html': 'fba4ed072bed8749c56ebcf099b30f0e',
  'ads/incontent-728x90.html': 'e0dce7760389a360cba34b93333ea2d0',
  'ads/native-banner.html': '8fabf9ea9ed2d89cba2ff9888f939c26',
};

export function isDemoPublicFileContent(rel: string, source: string): boolean {
  // Upstream-owned domain-ops token at the public/ root — search-console
  // verification for the DEMO property itself. Deleted by exact name: a fork
  // verifying their own property generates a different random token
  // filename, so this can never collide with user work.
  const marker = DEMO_ADSTERRA_UNIT_MARKERS[rel];
  if (marker) return source.includes(marker);
  return rel === 'google8362d9398114b66b.html' || rel === DEMO_INDEXNOW_KEY_FILE;
}

/**
 * The pre-v2.33.0 manual-flow IndexNow key file — committed to public/ by the
 * old generate-and-commit flow and left behind when v2.33.0 moved the key to
 * env. Removed from the template tree in v2.34.0 (audit round 21): while it
 * stayed deployed it kept a git-history-public key valid as an ownership
 * token for the demo site, and every fork's build shipped it. Listed in
 * DEMO_PUBLIC_FILES so forks initialized from older trees lose it on their
 * next setup.yml rerun. Exact-name rule: a fork's OWN committed key file from
 * the same era has a different name and is never touched.
 */
export const DEMO_INDEXNOW_KEY_FILE = '39a73e7c4264b418baa6757d20446910.txt';

export const DEMO_PUBLIC_FILES = [
  DEMO_INDEXNOW_KEY_FILE,
  'google8362d9398114b66b.html',
  // Demo Adsterra unit pages (public/ads/<name>.html) — the demo's ad-unit
  // keys are config, not template content; a fork follows docs/ads.md and
  // pastes its own snippets. Keep in sync with setup.yml — pinned by
  // tests/apply-template.test.ts.
  'ads/sticky-320x50.html',
  'ads/sidebar-300x250.html',
  'ads/sidebar-160x300.html',
  'ads/sidebar-160x600.html',
  'ads/incontent-728x90.html',
  'ads/native-banner.html',
];

/** Locale JSONs the demo itself ships — auto-deletable ONLY while still demo content. */
export const DEMO_LOCALES = ['en', 'ja'];

/**
 * site.name values the demo's own locale JSONs ship (en and ja both use the
 * same English site name). Content, not filename, decides deletion: a
 * demo-named file the forker already rewrote for their own game (a previous
 * run chose that locale) holds their translation work and must fall into the
 * warn-and-keep path. Anything unclassifiable (corrupt JSON, missing
 * site.name) is kept too — never delete what cannot be read.
 */
export const DEMO_SITE_NAMES = ['Anvil Quest Wiki'];

export function isDemoLocaleContent(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as { site?: { name?: unknown } };
    return parsed?.site?.name !== undefined && DEMO_SITE_NAMES.includes(parsed.site.name as string);
  } catch {
    return false;
  }
}

/**
 * Game names the demo's own articles are authored around. Content, not
 * filename, decides deletion (same rule as isDemoLocaleContent): a first run
 * clears the demo articles; on a re-run, files the forker authored themselves
 * — including demo-path files they already rewrote for their own game and the
 * per-category scaffolds a previous run created — do not mention the demo
 * game and fall into the warn-and-keep path. No file-name manifest on
 * purpose: a manifest goes stale the moment a template author adds demo
 * content (or a fork adds their own article), while the content marker is
 * exactly the identity a rebrand replaces.
 */
export const DEMO_GAME_NAMES = ['Anvil Quest'];

export function isDemoArticleContent(src: string): boolean {
  return DEMO_GAME_NAMES.some((name) => src.includes(name));
}

export interface WikiArticleEntry {
  /** Path relative to src/content/wiki, forward slashes. */
  rel: string;
  src: string;
}

export interface ClassifyWikiOptions {
  /**
   * The locales this run keeps. A registry demo whose locale is NOT in this
   * list is cleared unconditionally (cross-preset + cross-locale): an
   * unselected locale's demo article would render nothing (astro skips
   * entries for undeclared locales) and is pure demo-identity residue.
   */
  selectedLocales?: string[];
  /**
   * The preset this run chose (SITE_PRESETS id). Registry demos of OTHER
   * presets are cleared regardless of locale — only the chosen preset's
   * demos survive as starting content (spec §3). Omitted on the setup.yml
   * Initialize channel, which has no preset input.
   */
  preset?: PresetId;
}

/**
 * Resolve a rel path ('<locale>/<category>/<slug>.mdx') to the preset whose
 * demoArticles registry claims it, or null. The registry is keyed
 * locale → paths-relative-to-src/content/wiki/<locale>/, so a lookup joins
 * the entry's locale segment back onto the rest of the path.
 */
function registryPresetFor(rel: string): PresetId | null {
  const slash = rel.indexOf('/');
  if (slash === -1) return null;
  const locale = rel.slice(0, slash);
  const rest = rel.slice(slash + 1);
  for (const preset of Object.values(SITE_PRESETS)) {
    if ((preset.demoArticles[locale] ?? []).includes(rest)) return preset.id;
  }
  return null;
}

/**
 * Split wiki articles into demo-authored (safe to delete) and everything else
 * (the forker's own work — warn-and-keep). Pure: the caller owns all IO.
 *
 * Two layers, checked in order:
 *   1. SITE_PRESETS registry (site-presets.ts) — the coupon-hub/tutorial-hub
 *      demo articles never mention the Anvil Quest game, so the historical
 *      content marker cannot see them. A registry hit clears or keeps per
 *      the options above; with NO options at all (clear-demo-content.ts /
 *      setup.yml Initialize — no locales or preset known) every registered
 *      demo is cleared, matching the workflow's "only safe deletions"
 *      semantics. A file claimed by the CHOSEN preset in a CHOSEN locale is
 *      kept as the preset's starting content.
 *   2. Fallback: the historical Anvil Quest content marker
 *      (isDemoArticleContent) — how the game-wiki demo articles have always
 *      been cleared, unchanged.
 * The bare (entries) call keeps its exact previous verdicts for Anvil Quest
 * content and now additionally clears the registry demos — that is the
 * intended single-source upgrade of the setup.yml channel.
 */
export function classifyWikiArticles(
  entries: WikiArticleEntry[],
  options?: ClassifyWikiOptions,
): {
  demo: WikiArticleEntry[];
  kept: WikiArticleEntry[];
} {
  const demo: WikiArticleEntry[] = [];
  const kept: WikiArticleEntry[] = [];
  const chosenLocales = options?.selectedLocales
    ? new Set(options.selectedLocales)
    : null;
  for (const entry of entries) {
    const presetId = registryPresetFor(entry.rel);
    if (presetId !== null) {
      const locale = entry.rel.slice(0, entry.rel.indexOf('/'));
      // NO options at all (setup.yml Initialize) keeps nothing registered —
      // without chosen locales there is no preset starting content to keep.
      const localeKept = chosenLocales !== null && chosenLocales.has(locale);
      const presetKept = options?.preset === undefined || options.preset === presetId;
      (localeKept && presetKept ? kept : demo).push(entry);
      continue;
    }
    (isDemoArticleContent(entry.src) ? demo : kept).push(entry);
  }
  return { demo, kept };
}

/**
 * Cover filenames referenced by the given article sources (frontmatter
 * `image:` values pointing into src/assets/covers/). Pure — the caller feeds
 * classifyWikiArticles' kept list so asset clearing can SPARE every cover a
 * surviving demo article references: preset starting content carries covers,
 * and a kept article whose cover was cleared fails the fork's first build
 * (Astro image() → ImageNotFound). Over-matching only spares an orphan file,
 * so the regex errs inclusive on purpose.
 */
export function coverNamesReferenced(srcs: readonly string[]): Set<string> {
  const names = new Set<string>();
  for (const src of srcs) {
    for (const m of src.matchAll(/assets\/covers\/([A-Za-z0-9][A-Za-z0-9._-]*)/g)) {
      names.add(m[1]);
    }
  }
  return names;
}

/**
 * The demo-author block regex apply-template runs against
 * src/config/authors.ts — extracted from the CLI so the contract test can pin
 * it against the REAL file (and against setup.yml's inline python copy: the
 * two channels must produce identical output or one of them silently drifts).
 */
export const DEMO_AUTHOR_BLOCK_RE = /\n\s*\/\/ DEMO .*?\n\s*'[^']+'.*?\{[^}]*\},\n/;

/**
 * Remove the demo author entry from src/config/authors.ts. `changed` is false
 * when nothing matched — already removed on a previous run, or the file
 * format drifted — and the caller warns instead of claiming success (a
 * format drift must never print a false ✅, and a silent no-op must never
 * pass unnoticed).
 */
export function stripDemoAuthors(src: string): { cleaned: string; changed: boolean } {
  const cleaned = src.replace(DEMO_AUTHOR_BLOCK_RE, '\n');
  return { cleaned, changed: cleaned !== src };
}