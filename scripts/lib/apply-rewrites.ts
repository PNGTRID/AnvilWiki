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


export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


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


export function rewriteLocaleJson(input: SkinInput, _locale: string, existing?: string): string {
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
  (obj.footer as Record<string, unknown>).copyrightText = `© ${new Date().getFullYear()} ${input.gameName} Wiki. All rights reserved.`;
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
 */
export function rewriteWranglerVars(input: SkinInput, src: string): string | null {
  const filePath = 'wrangler.toml';
  // TOML basic strings: escape backslash first, then the double quote.
  const tomlStr = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const newVars = `[vars]
# Site (must include https:// protocol — Astro validates this as a URL)
SITE_URL = "https://${tomlStr(input.domain)}"
# Giscus comments — blank = comments disabled until you fill your own values.
# See docs/comments.md for how to get these from giscus.app.
PUBLIC_GISCUS_REPO = ""
PUBLIC_GISCUS_REPO_ID = ""
PUBLIC_GISCUS_CATEGORY = ""
PUBLIC_GISCUS_CATEGORY_ID = ""
PUBLIC_GISCUS_MAPPING = "pathname"
# Sponsor card — blank = disabled. Fill PUBLIC_SPONSOR_URL to enable.
PUBLIC_SPONSOR_URL = ""
PUBLIC_SPONSOR_IMAGE_URL = ""
# Cloudflare Web Analytics — blank = disabled.
PUBLIC_CF_BEACON_TOKEN = ""
# Optional slots (empty = disabled) — fill HERE, not the dashboard:
#PUBLIC_ADSENSE_CLIENT = ""
#PUBLIC_ADSENSE_SLOT_STICKY = ""
#PUBLIC_ADSENSE_SLOT_SIDEBAR = ""
#PUBLIC_ADSENSE_SLOT_INCONTENT = ""
#PUBLIC_GA_ID = ""
#PUBLIC_GSC_VERIFICATION = ""`;
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
  // Remove the demo-intro warning block: after the [vars] rewrite it would
  // claim "this file contains the DEMO SITE config" about values that are
  // now the forker's own — a stale, misleading comment. Anchors are ASCII:
  // the ⚠️ emoji is a multi-codepoint sequence that silently fails `⚠️+`.
  // The inserted block adopts the file's own EOL so the section is not left
  // with mixed line endings.
  const eol = /(^|\n)\[vars\]\r\n/.test(src) ? '\r\n' : '\n';
  const newVarsBlock = eol === '\r\n' ? newVars.replace(/\n/g, '\r\n') : newVars;
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
 * Upstream-owned domain-ops tokens at the public/ root — search-console
 * verification for the DEMO property itself. Deleted by exact name: a fork
 * verifying their own property generates a different random token filename,
 * so this can never collide with user work. Keep in sync with the "Clear
 * demo content" step in .github/workflows/setup.yml — pinned by
 * tests/apply-template.test.ts.
 */
export const DEMO_PUBLIC_FILES = [
  'google8362d9398114b66b.html',
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