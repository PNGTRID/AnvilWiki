/**
 * apply-template rewrite tests — the pure layer extracted to
 * scripts/lib/apply-rewrites.ts (the interactive CLI itself stays covered by
 * pnpm test:e2e, which drives it for real).
 *
 * Covers the fork-safety bug classes the 2026-09-01 audit turned up:
 *   - wrangler.toml [vars] rewrite must survive CRLF working trees (P4: the
 *     LF-only regex silently skipped the rewrite and left demo Giscus values)
 *   - locale rewrites must not leak unchosen demo categories into nav, and
 *     must not reset labels a user already translated on a re-run (P3/P1)
 *   - the demo asset inventories must stay in sync with setup.yml's
 *     "Clear demo content" rm list (they have drifted before: the v2.6.0
 *     covers initially landed in neither list).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  DEMO_ARTICLE_IMAGES,
  DEMO_COVERS,
  DEMO_GALLERY_IMAGES,
  isDemoLocaleContent,
  rewriteLocaleJson,
  rewriteSiteTs,
  rewriteWranglerVars,
  type SkinInput,
} from '../scripts/lib/apply-rewrites';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function makeInput(overrides: Partial<SkinInput> = {}): SkinInput {
  return {
    gameName: 'Test Game',
    shortName: 'TG',
    domain: 'testgame.pages.dev',
    tagline: 'Forge your knowledge',
    description: 'Complete Test Game wiki with guides, codes, and tier lists. Every page carries a verified date.',
    legalNotice: 'Fan-made, not affiliated with the developer.',
    themeHex: '#3b82f6',
    platform: 'Roblox',
    developer: 'Test Studios',
    genre: 'RPG',
    releaseDate: '',
    officialUrl: 'https://example.com/game',
    locales: ['en'],
    categories: [
      { key: 'bosses', icon: 'lucide:swords' },
      { key: 'guides', icon: 'lucide:book-open' },
      { key: 'codes', icon: 'lucide:gift' },
    ],
    clearContent: true,
    clearLanding: true,
    homePreset: 'codes',
    ...overrides,
  };
}

const LF_WRANGLER = [
  '# AnvilWiki wrangler.toml — this file mentions [vars] in a comment, which',
  '# must NOT be mistaken for the real section (line-start anchoring).',
  'name = "anvilwiki"',
  'compatibility_date = "2025-01-01"',
  '',
  '[vars]',
  'SITE_URL = "https://anvilwiki.pages.dev"',
  'PUBLIC_GISCUS_REPO = "PNGTRID/AnvilWiki"',
  'PUBLIC_GISCUS_REPO_ID = "R_demo"',
  'PUBLIC_GISCUS_MAPPING = "pathname"',
  '',
  '[env.preview]',
  'name = "preview"',
  '',
].join('\n');

const CRLF_WRANGLER = LF_WRANGLER.replace(/\n/g, '\r\n');

describe('rewriteWranglerVars (P4: line-anchored + CRLF-tolerant)', () => {
  test('LF file: rewrites values, keeps the next section, ignores comment mentions', () => {
    const out = rewriteWranglerVars(makeInput(), LF_WRANGLER);
    expect(out).not.toBeNull();
    expect(out).toContain('SITE_URL = "https://testgame.pages.dev"');
    expect(out).toContain('PUBLIC_GISCUS_REPO = ""');
    expect(out).not.toContain('PNGTRID');
    expect((out!.match(/^\[vars\]/gm) || []).length).toBe(1);
    expect(out).toContain('[env.preview]');
    expect(out).toContain('# must NOT be mistaken for the real section');
    // LF in, LF out — no CRLF sneaks into the inserted block.
    expect(out).not.toContain('\r');
  });

  test('CRLF file: still matches, and the inserted block adopts CRLF (P4)', () => {
    const out = rewriteWranglerVars(makeInput(), CRLF_WRANGLER);
    expect(out).not.toBeNull();
    expect(out).toContain('SITE_URL = "https://testgame.pages.dev"\r\n');
    expect(out).toContain('PUBLIC_GISCUS_REPO = ""\r\n');
    expect((out!.match(/^\[vars\]/gm) || []).length).toBe(1);
    expect(out).toContain('[env.preview]');
    expect(out).not.toContain('PNGTRID');
  });

  test('no [vars] section → null (caller keeps the file and warns)', () => {
    expect(rewriteWranglerVars(makeInput(), 'name = "x"\n')).toBeNull();
  });
});

describe('rewriteLocaleJson (P3: no unchosen-category leak, re-run labels kept)', () => {
  const demoLike = JSON.stringify({
    nav: {
      home: 'Home',
      bosses: 'Bosses',
      guides: 'Guides',
      items: 'Items',
      codes: 'Codes',
      search: 'Search',
    },
    overview: {
      bosses: { overviewTitle: 'Anvil Quest Bosses', overviewDescription: 'demo boss text' },
      items: { overviewTitle: 'Items', overviewDescription: 'demo item text' },
    },
  });

  test('a demo category the forker did not choose is dropped from nav (was leaked before)', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', demoLike));
    expect(out.nav.items).toBeUndefined();
    expect(out.nav.bosses).toBe('Bosses');
    expect(out.nav.guides).toBe('Guides');
    expect(out.nav.codes).toBe('Codes');
    // Fixed UI keys survive from the previous file too.
    expect(out.nav.home).toBe('Home');
    expect(out.nav.search).toBe('Search');
  });

  test('labels a user translated on a previous run survive the re-run', () => {
    const translated = JSON.stringify({
      nav: { home: 'ホーム', bosses: 'ボス', items: 'アイテム' },
    });
    const out = JSON.parse(
      rewriteLocaleJson(makeInput({ categories: [{ key: 'bosses', icon: 'x' }] }), 'ja', translated),
    );
    expect(out.nav.bosses).toBe('ボス'); // kept, not reset to the placeholder
    expect(out.nav.home).toBe('ホーム');
    expect(out.nav.items).toBeUndefined(); // unchosen → gone
  });

  test('empty-string previous labels fall back to the defaults', () => {
    const broken = JSON.stringify({ nav: { bosses: '' } });
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', broken));
    expect(out.nav.bosses).toBe('Bosses');
  });

  test('overview is regenerated for chosen keys only — demo overview text never leaks', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', demoLike));
    expect(Object.keys(out.overview).sort()).toEqual(['bosses', 'codes', 'guides']);
    expect(out.overview.items).toBeUndefined();
    expect(out.overview.bosses.overviewTitle).toBe('All Bosses');
    expect(out.overview.bosses.overviewDescription).toContain('Test Game');
    expect(out.overview.bosses.overviewDescription).not.toContain('Anvil Quest');
  });

  test('fresh locale file (no existing): nav = fixed keys + chosen categories', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'zh'));
    expect(out.nav.home).toBe('Home');
    expect(out.nav.bosses).toBe('Bosses');
    expect(out.nav.toggleTheme).toBe('Toggle theme');
    expect(out.site.name).toBe('Test Game Wiki');
  });
});

describe('demo asset inventories stay in sync with setup.yml (drift has shipped before)', () => {
  test('every demo file is listed in the "Clear demo content" rm list — and nothing else', () => {
    const yml = readFileSync(join(repoRoot, '.github/workflows/setup.yml'), 'utf8');
    const listed = new Set(yml.match(/[\w-]+\.png/g) || []);
    const demo = new Set([...DEMO_COVERS, ...DEMO_GALLERY_IMAGES, ...DEMO_ARTICLE_IMAGES]);
    for (const name of demo) {
      expect(listed.has(name), `${name} missing from setup.yml rm list`).toBe(true);
    }
    expect([...listed].sort()).toEqual([...demo].sort());
    // The wholesale rm -rf of demo image dirs must never come back — the
    // directories hold fork users' own images (docs/content-format.md sends
    // them to public/images/articles/).
    expect(yml).not.toMatch(/rm -rf src\/assets\/gallery/);
    expect(yml).not.toMatch(/rm -rf public\/images\/articles/);
  });

  test('the three inventories do not overlap', () => {
    const all = [...DEMO_COVERS, ...DEMO_GALLERY_IMAGES, ...DEMO_ARTICLE_IMAGES];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('rewriteSiteTs (quote/backslash-safe, $-expansion-proof site.ts rewriting)', () => {
  const SITE_TS = [
    "import type { SiteConfig } from '~/lib/site';",
    '',
    'export const site: SiteConfig = {',
    "  name: 'Anvil Quest Wiki',",
    "  shortName: 'AQ Wiki',",
    "  description: 'demo description',",
    "  domain: 'anvilwiki.pages.dev',",
    "  tagline: 'demo tagline',",
    "  legalNotice: 'demo notice',",
    "  contactEmail: '',",
    '  social: {',
    "    official: 'https://example.com',",
    '  },',
    '  game: {',
    "    name: 'Anvil Quest',",
    "    platform: 'PC',",
    "    developer: 'Forge Studios',",
    "    genre: 'RPG',",
    "    releaseDate: '2026-01-01',",
    '  },',
    '  ogImageWidth: 1200,',
    '  ogImageHeight: 630,',
    '};',
    '',
    'export const other = 1;',
  ].join('\n');

  test("an apostrophe in the game name cannot break the string literal", () => {
    const out = rewriteSiteTs(SITE_TS, makeInput({ gameName: "Assassin's Creed Shadows" }));
    expect(out).toContain("name: 'Assassin\\'s Creed Shadows Wiki'");
  });

  test('every free-text field is escaped, not just the historical three', () => {
    const out = rewriteSiteTs(
      SITE_TS,
      makeInput({
        shortName: "O'B",
        domain: "x'y.dev",
        platform: "Robl'o",
        developer: "Dev's",
        genre: "RPG'X",
        releaseDate: "2026'",
        officialUrl: "https://ex.com/'q",
      }),
    );
    expect(out).toContain("shortName: 'O\\'B'");
    expect(out).toContain("domain: 'x\\'y.dev'");
    expect(out).toContain("official: 'https://ex.com/\\'q'");
    expect(out).toContain("platform: 'Robl\\'o'");
    expect(out).toContain("developer: 'Dev\\'s'");
    expect(out).toContain("genre: 'RPG\\'X'");
    expect(out).toContain("releaseDate: '2026\\''");
  });

  test("$& / $' from user input reach the file literally (function replacer)", () => {
    const out = rewriteSiteTs(SITE_TS, makeInput({ gameName: 'A$&B', tagline: "t$'x" }));
    expect(out).toContain("'A$&B Wiki'");
    expect(out).toContain("'t$\\'x'");
  });

  test('a trailing backslash cannot eat the closing quote (backslash doubled first)', () => {
    const out = rewriteSiteTs(SITE_TS, makeInput({ legalNotice: 'ends with backslash \\' }));
    expect(out).toContain("'ends with backslash \\\\'");
  });

  test('no site block → null (caller aborts, file untouched)', () => {
    expect(rewriteSiteTs('nothing here', makeInput())).toBeNull();
  });
});

describe('demo locale deletion is content-aware (rebranded locales must survive re-runs)', () => {
  test('the shipped demo locale files still carry the site.name marker (marker drift guard)', () => {
    for (const locale of ['en', 'ja']) {
      const raw = readFileSync(join(repoRoot, 'src/locales', `${locale}.json`), 'utf8');
      expect(isDemoLocaleContent(raw)).toBe(true);
    }
  });

  test('a rewritten demo-named locale is no longer demo content', () => {
    const demoEn = readFileSync(join(repoRoot, 'src/locales/en.json'), 'utf8');
    const rebranded = rewriteLocaleJson(makeInput(), 'ja', demoEn);
    expect(isDemoLocaleContent(rebranded)).toBe(false);
  });

  test('the marker is site.name, not any stray "Anvil Quest" mention', () => {
    expect(
      isDemoLocaleContent('{"note": "mentions Anvil Quest", "site": {"name": "My Game Wiki"}}'),
    ).toBe(false);
    expect(isDemoLocaleContent('{"site": {"name": "Anvil Quest Wiki"}}')).toBe(true);
  });

  test('corrupt JSON or missing site.name is never classified as demo (never delete unreadable)', () => {
    expect(isDemoLocaleContent('{ not json')).toBe(false);
    expect(isDemoLocaleContent('{"nav": {"home": "Home"}}')).toBe(false);
  });
});
