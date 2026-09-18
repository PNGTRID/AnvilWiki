/**
 * apply-rewrites.ts — pure rewrite helpers for scripts/apply-template.ts.
 *
 * Extracted (verbatim where possible) so vitest can test them without
 * importing the interactive CLI: rewriteSiteTs (site.ts object literal),
 * rewriteLocaleJson (locale JSON shapes), rewriteWranglerVars (wrangler.toml
 * [vars] reset), the demo asset inventories shared with the "Clear demo
 * content" step in .github/workflows/setup.yml, and the content-aware demo
 * locale check. No fs/path access — callers own all IO.
 */

import { stripControlChars } from './delimited';


export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

/** English-default labels for the LOCALE_LABELS block in routing.ts. */
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
}


/**
 * Build a starter `home` namespace skeleton for a preset.
 * All copy uses the game name the user entered — placeholders to refine,
 * not demo-game leftovers. Module hrefs point at the categories they chose.
 */
function buildHomePreset(input: SkinInput): Record<string, unknown> | null {
  if (input.homePreset === 'keep') return null;
  const cats = input.categories.map((c) => c.key);
  const first = cats[0] ?? 'guides';
  const cap = (c: string) => c[0].toUpperCase() + c.slice(1);

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
          { number: '1', title: 'Codes', description: 'Free gold, XP, cosmetics', icon: 'lucide:gift', href: '/codes' },
          { number: '2', title: 'Bosses', description: 'Phase-by-phase strategy', icon: 'lucide:swords', href: '/bosses' },
          { number: '3', title: 'Tier list', description: 'Best weapons ranked', icon: 'lucide:bar-chart-3', href: `/${cats.find((c) => c !== 'codes') ?? first}` },
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
            href: '/codes',
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
          href: '/guides',
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
 */
export function rewriteSiteTs(src: string, input: SkinInput): string | null {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const newSite = `export const site: SiteConfig = {
  name: '${esc(input.gameName)} Wiki',
  shortName: '${esc(input.shortName)}',
  description: '${esc(input.description)}',
  domain: '${esc(input.domain)}',
  tagline: '${esc(input.tagline)}',
  legalNotice: '${esc(input.legalNotice)}',
  // Set a real address if you run no social channels — the contact page
  // renders it as a mailto link.
  contactEmail: '',
  social: {
    official: '${esc(input.officialUrl)}',
  },
  game: {
    name: '${esc(input.gameName)}',
    platform: '${esc(input.platform)}',
    developer: '${esc(input.developer)}',
    genre: '${esc(input.genre)}',
    releaseDate: '${esc(input.releaseDate)}',
  },
  // og:image dims of the SHIPPED hero.webp — if you replace public/images/hero.webp,
  // update these in src/config/site.ts to match (wrong dims mis-crop share cards).
  ogImageWidth: 1200,
  ogImageHeight: 630,
};`;
  const siteRe = /export const site: SiteConfig = \{[\s\S]*?\n\};/;
  if (!siteRe.test(src)) return null;
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


/**
 * Rewrite the per-locale JSON for the chosen skin. `copyrightYear` is passed
 * in by the caller (apply-template derives it from lib/today.ts) — this layer
 * stays pure, with no hidden dependency on the wall clock (a night run must
 * not stamp a different year than the CLI reported).
 */
export function rewriteLocaleJson(
  input: SkinInput,
  _locale: string,
  copyrightYear: number,
  existing?: string,
): string {
  // Start from existing (if any) or a minimal skeleton; reset site/footer/nav/overview.
  let obj: Record<string, unknown> = {};
  if (existing) {
    try {
      obj = JSON.parse(existing);
    } catch {
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
  const overview: Record<string, { overviewTitle: string; overviewDescription: string }> = {};
  for (const { key } of input.categories) {
    navCategories[key] = cap(key);
    overview[key] = {
      overviewTitle: `All ${cap(key)}`,
      overviewDescription: `${cap(key)} content for ${input.gameName}. Replace this overview text in the locale JSON — it feeds the category page title and description.`,
    };
  }
  // Keep a previous run's labels, but ONLY for keys this run still owns — a
  // demo category the forker did not choose must not leak back into nav as a
  // stale key nothing renders and no gate checks. Overlay order is
  // fixed keys < generated placeholders < previous labels, so labels a user
  // translated on an earlier run survive re-runs instead of being reset.
  const ownable = new Set([...Object.keys(navFixed), ...Object.keys(navCategories)]);
  const prevNav = Object.fromEntries(
    Object.entries((obj.nav ?? {}) as Record<string, unknown>).filter(
      ([k, v]) => ownable.has(k) && typeof v === 'string' && v.trim() !== '',
    ),
  );
  obj.nav = { ...navFixed, ...navCategories, ...prevNav };
  obj.overview = overview;
  // Homepage preset skeleton (unless 'keep').
  const home = buildHomePreset(input);
  if (home) obj.home = home;
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
 * demo Adsterra unit keys (all six, incl. the 320x50 anchor), and the demo
 * GA4 measurement ID. Exported for tests (a drift guard parses the shipped
 * wrangler.toml against this list).
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
  for (const line of section.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:"((?:\\.|[^"\\])*)"|'([^']*)'|([^#\s][^#]*?))\s*(?:#.*)?$/);
    if (m) existing.set(m[1], m[2] ?? m[3] ?? m[4]);
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
 */
export const DEMO_COVERS = [
  'beginner-guide-cover.png',
  'emberfang-cover.png',
  'stormcaller-cover.png',
  'weapon-tier-list-cover.png',
  'codes-cover.png',
  // v2.6.0 demo content batch — same by-name rule: never delete a cover a
  // fork user created. Keep in sync with setup.yml's rm -f list.
  'en-bosses-frostbound-monarch.png',
  'en-guides-forging-guide.png',
  'en-items-emberforged-armor-set.png',
  'en-items-forging-materials-guide.png',
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
  return rel === 'google8362d9398114b66b.html';
}

export const DEMO_PUBLIC_FILES = [
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

/**
 * Split wiki articles into demo-authored (safe to delete) and everything else
 * (the forker's own work — warn-and-keep). Pure: the caller owns all IO.
 */
export function classifyWikiArticles(entries: WikiArticleEntry[]): {
  demo: WikiArticleEntry[];
  kept: WikiArticleEntry[];
} {
  const demo: WikiArticleEntry[] = [];
  const kept: WikiArticleEntry[] = [];
  for (const entry of entries) {
    (isDemoArticleContent(entry.src) ? demo : kept).push(entry);
  }
  return { demo, kept };
}