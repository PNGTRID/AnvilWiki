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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  DEMO_ADSTERRA_UNIT_MARKERS,
  DEMO_ARTICLE_IMAGES,
  DEMO_COVERS,
  DEMO_DOMAINS,
  DEMO_GAME_NAMES,
  DEMO_GALLERY_IMAGES,
  DEMO_PUBLIC_FILES,
  DEMO_VAR_VALUES,
  buildLocaleLabels,
  buildUiImports,
  buildUiMessagesEntries,
  classifyWikiArticles,
  isDemoArticleContent,
  isDemoLocaleContent,
  isDemoPublicFileContent,
  isDemoSiteTsIdentity,
  isLocaleCode,
  KNOWN_LOCALE_LABELS,
  localeIdent,
  localeKey,
  parseSiteTsIdentity,
  rerunPromptDefaults,
  rewriteLocaleJson,
  rewriteSiteTs,
  rewriteWranglerVars,
  tsEscape,
  UI_IMPORT_BLOCK_RE,
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
  'PUBLIC_GISCUS_REPO_ID = "R_kgDOT1aRPQ"',
  'PUBLIC_GISCUS_CATEGORY = "Announcements"',
  'PUBLIC_GISCUS_CATEGORY_ID = "DIC_kwDOT1aRPc4DDODo"',
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

describe('rewriteWranglerVars is value-aware (a re-run must not wipe the user env — S1)', () => {
  // A fork that already filled its own env (giscus app, analytics, ad slots)
  // re-runs apply-template for a copy tweak — the rewrite must carry those
  // values over, not reset everything to the blank template.
  const USER_WRANGLER = [
    'name = "anvilwiki"',
    '',
    '[vars]',
    'SITE_URL = "https://mygame.dev"',
    'PUBLIC_GISCUS_REPO = "user/their-game"',
    'PUBLIC_GISCUS_REPO_ID = "R_user123"',
    'PUBLIC_GISCUS_CATEGORY = "General"',
    'PUBLIC_GISCUS_CATEGORY_ID = "DIC_user"',
    'PUBLIC_GISCUS_MAPPING = "pathname"',
    'PUBLIC_CF_BEACON_TOKEN = "cf-beacon-user"',
    '#PUBLIC_ADSENSE_CLIENT = ""',
    '#PUBLIC_GA_ID = ""',
    '',
    '[env.production]',
    'name = "production"',
    '',
  ].join('\n');

  test('non-demo values are preserved across the rewrite', () => {
    const out = rewriteWranglerVars(makeInput(), USER_WRANGLER)!;
    expect(out).toContain('PUBLIC_GISCUS_REPO = "user/their-game"');
    expect(out).toContain('PUBLIC_GISCUS_REPO_ID = "R_user123"');
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY = "General"');
    expect(out).toContain('PUBLIC_CF_BEACON_TOKEN = "cf-beacon-user"');
    expect(out).toContain('PUBLIC_GISCUS_MAPPING = "pathname"');
  });

  test('a user value on a commented-out slot re-emits the line uncommented (they enabled it)', () => {
    const out = rewriteWranglerVars(
      makeInput(),
      USER_WRANGLER.replace('#PUBLIC_GA_ID = ""', 'PUBLIC_GA_ID = "G-USER1234"'),
    )!;
    expect(out).toContain('PUBLIC_GA_ID = "G-USER1234"');
    expect(out).not.toContain('#PUBLIC_GA_ID = "G-USER1234"');
  });

  test('bare TOML scalars (numbers/booleans, with or without a trailing comment) survive a re-run', () => {
    // A hand editor can drop the quotes entirely (`KEY = 42`). The old parser
    // matched neither form → keep=null → the value was silently reset. Bare
    // scalars are preserved verbatim and re-emitted double-quoted (Pages env
    // vars are strings anyway).
    const out = rewriteWranglerVars(
      makeInput(),
      USER_WRANGLER.replace('PUBLIC_CF_BEACON_TOKEN = "cf-beacon-user"', 'PUBLIC_CF_BEACON_TOKEN = 12345678')
        .replace('PUBLIC_GISCUS_MAPPING = "pathname"', 'PUBLIC_GISCUS_MAPPING = true # user hand-edit'),
    )!;
    expect(out).toContain('PUBLIC_CF_BEACON_TOKEN = "12345678"');
    expect(out).toContain('PUBLIC_GISCUS_MAPPING = "true"');
  });

  test('an empty bare value still resets (no value to preserve)', () => {
    const out = rewriteWranglerVars(
      makeInput(),
      USER_WRANGLER.replace('PUBLIC_CF_BEACON_TOKEN = "cf-beacon-user"', 'PUBLIC_CF_BEACON_TOKEN ='),
    )!;
    expect(out).toContain('PUBLIC_CF_BEACON_TOKEN = ""');
  });

  test('demo values are still cleared on a first run (blank template shape intact)', () => {
    const out = rewriteWranglerVars(makeInput(), LF_WRANGLER)!;
    expect(out).toContain('PUBLIC_GISCUS_REPO = ""');
    expect(out).toContain('PUBLIC_GISCUS_REPO_ID = ""');
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY = ""');
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY_ID = ""');
    // The demo Adsterra/GA values never leak: the shipped file's live unit keys
    // are all demo values, so they reset to the commented blank template lines.
    expect(out).not.toContain('72f65aae2e14988904cffe17cfe697e2');
    expect(out).toContain('#PUBLIC_GA_ID = ""');
  });

  test('SITE_URL always follows the CLI domain, even when it holds a non-demo value', () => {
    const out = rewriteWranglerVars(makeInput(), USER_WRANGLER)!;
    expect(out).toContain('SITE_URL = "https://testgame.pages.dev"');
    expect(out).not.toContain('https://mygame.dev');
  });

  test('a re-run over its own output is byte-identical (idempotent)', () => {
    const once = rewriteWranglerVars(makeInput(), USER_WRANGLER)!;
    const twice = rewriteWranglerVars(makeInput(), once)!;
    expect(twice).toBe(once);
    const demoOnce = rewriteWranglerVars(makeInput(), LF_WRANGLER)!;
    expect(rewriteWranglerVars(makeInput(), demoOnce)).toBe(demoOnce);
  });

  test('DEMO_VAR_VALUES covers every live value in the shipped wrangler.toml (drift guard)', () => {
    // If the demo gains a new non-empty env value that is not registered as a
    // demo value, a re-run would PRESERVE it into every fork — the exact leak
    // this list exists to prevent. Every uncommented [vars] value must either
    // be listed here or be empty.
    const toml = readFileSync(join(repoRoot, 'wrangler.toml'), 'utf8');
    const section = toml.match(/(?:^|\n)\[vars\]\r?\n([\s\S]*?)(?=\r?\n\[|$)/)?.[1] ?? '';
    const values = [...section.matchAll(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"(.*)"\s*$/gm)].map(
      (m) => m[2],
    );
    expect(values.length, 'the shipped wrangler.toml should carry demo values').toBeGreaterThan(0);
    // "pathname" is the template's GENERIC giscus mapping default (a user may
    // legitimately set "url"/"topic" — the rewrite preserves those), not demo
    // identity; it is deliberately not in DEMO_VAR_VALUES. "Announcements" is
    // deliberately not registered either (real forks legitimately use that
    // giscus category name) — its demo-ness is the PAIRED rule: demo category
    // name + demo category ID together, asserted below. Anything else
    // non-empty must be registered.
    const genericDefaults = new Set(['pathname']);
    for (const v of values) {
      expect(
        v === '' || genericDefaults.has(v) || v === 'Announcements' || DEMO_VAR_VALUES.includes(v),
        `unregistered demo value: "${v}"`,
      ).toBe(true);
    }
    // Paired-rule guard: the shipped file must carry Announcements TOGETHER
    // with the demo category ID (only that pair is auto-cleared; a fork with
    // its own ID keeps the name).
    if (values.includes('Announcements')) {
      expect(values).toContain('DIC_kwDOT1aRPc4DDODo');
    }
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
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026, demoLike));
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
      rewriteLocaleJson(makeInput({ categories: [{ key: 'bosses', icon: 'x' }] }), 'ja', 2026, translated),
    );
    expect(out.nav.bosses).toBe('ボス'); // kept, not reset to the placeholder
    expect(out.nav.home).toBe('ホーム');
    expect(out.nav.items).toBeUndefined(); // unchosen → gone
  });

  test('empty-string previous labels fall back to the defaults', () => {
    const broken = JSON.stringify({ nav: { bosses: '' } });
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026, broken));
    expect(out.nav.bosses).toBe('Bosses');
  });

  test('overview is regenerated for chosen keys only — demo overview text never leaks', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026, demoLike));
    expect(Object.keys(out.overview).sort()).toEqual(['bosses', 'codes', 'guides']);
    expect(out.overview.items).toBeUndefined();
    expect(out.overview.bosses.overviewTitle).toBe('All Bosses');
    expect(out.overview.bosses.overviewDescription).toContain('Test Game');
    expect(out.overview.bosses.overviewDescription).not.toContain('Anvil Quest');
  });

  test('fresh locale file (no existing): nav = fixed keys + chosen categories', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'zh', 2027));
    expect(out.nav.home).toBe('Home');
    expect(out.nav.bosses).toBe('Bosses');
    expect(out.nav.toggleTheme).toBe('Toggle theme');
    expect(out.site.name).toBe('Test Game Wiki');
    // The copyright year is the caller-supplied parameter, not a hidden
    // wall-clock read inside the pure layer (S5).
    expect(out.footer.copyrightText).toBe('© 2027 Test Game Wiki. All rights reserved.');
  });
});

describe('demo asset inventories stay in sync with setup.yml (drift has shipped before)', () => {
  test('image inventories stay in the setup rm list; public config uses the content-aware script', () => {
    const yml = readFileSync(join(repoRoot, '.github/workflows/setup.yml'), 'utf8');
    const listed = new Set(yml.match(/[\w-]+\.png/g) || []);
    const demoImages = new Set([
      ...DEMO_COVERS,
      ...DEMO_GALLERY_IMAGES,
      ...DEMO_ARTICLE_IMAGES,
    ]);
    for (const name of demoImages) {
      expect(listed.has(name), `${name} missing from setup.yml rm list`).toBe(true);
    }
    expect([...listed].sort()).toEqual([...demoImages].sort());
    expect(yml).toContain('scripts/clear-demo-public.ts');
    const script = readFileSync(join(repoRoot, 'scripts/clear-demo-public.ts'), 'utf8');
    expect(script).toContain("from './lib/apply-rewrites'");
    expect(script).toContain('isDemoPublicFileContent');
    for (const rel of DEMO_PUBLIC_FILES) {
      expect(yml).not.toContain(`public/${rel}`);
    }
    expect(yml).not.toMatch(/rm -rf src\/assets\/gallery/);
    expect(yml).not.toMatch(/rm -rf public\/images\/articles/);
  });

  test('demo public-file detection is content-aware for Adsterra units', () => {
    for (const [rel, marker] of Object.entries(DEMO_ADSTERRA_UNIT_MARKERS)) {
      expect(isDemoPublicFileContent(rel, `before ${marker} after`), rel).toBe(true);
      expect(isDemoPublicFileContent(rel, 'user-owned-ad-unit-key'), rel).toBe(false);
    }
    expect(
      isDemoPublicFileContent('google8362d9398114b66b.html', 'verification token'),
    ).toBe(true);
  });

  test('every demo public file is covered by the content registry (no silent-keep holes)', () => {
    for (const rel of DEMO_PUBLIC_FILES) {
      if (rel === 'google8362d9398114b66b.html') continue;
      expect(DEMO_ADSTERRA_UNIT_MARKERS, `${rel} has no demo unit marker`).toHaveProperty(rel);
    }
    // Registry keys must match the shipped demo unit files — a regenerated
    // demo key without updating the registry would silently keep demo
    // residue in forks (isDemoPublicFileContent defaults to keep).
    for (const [rel, marker] of Object.entries(DEMO_ADSTERRA_UNIT_MARKERS)) {
      const source = readFileSync(join(repoRoot, 'public', rel), 'utf8');
      expect(source, rel).toContain(marker);
    }
  });

  test('the inventories do not overlap', () => {
    const all = [
      ...DEMO_COVERS,
      ...DEMO_GALLERY_IMAGES,
      ...DEMO_ARTICLE_IMAGES,
      ...DEMO_PUBLIC_FILES,
    ];
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

describe('hyphen locales (zh-tw / pt-br) generate legal TypeScript', () => {
  test('ui.ts imports: camelCase binding, real hyphenated file path', () => {
    expect(buildUiImports(['en', 'zh-tw'])).toBe(
      "import en from '~/locales/en.json';\nimport zhTw from '~/locales/zh-tw.json';",
    );
    expect(buildUiImports(['pt-br'])).toBe("import ptBr from '~/locales/pt-br.json';");
  });

  test('ui.ts messages entries: hyphen keys quoted, plain keys stay bare', () => {
    expect(buildUiMessagesEntries(['en', 'zh-tw'])).toBe(
      '  en: en as Record<string, unknown>,\n  "zh-tw": zhTw as Record<string, unknown>,',
    );
  });

  test('routing labels: hyphen keys quoted (a bare `zh-tw:` parses as subtraction)', () => {
    // Joined with ',\n' — the caller wraps the block and adds the trailing comma.
    expect(buildLocaleLabels(['en', 'zh-tw'])).toBe("  en: 'English',\n  \"zh-tw\": 'zh-tw'");
  });

  test('plain locales keep the exact pre-hyphen-support output shape (byte-identical)', () => {
    expect(buildUiImports(['en', 'ja'])).toBe(
      "import en from '~/locales/en.json';\nimport ja from '~/locales/ja.json';",
    );
    expect(buildUiMessagesEntries(['en'])).toBe('  en: en as Record<string, unknown>,');
    expect(buildLocaleLabels(['en'])).toBe("  en: 'English'");
    expect(localeKey('en')).toBe('en');
    expect(localeIdent('en')).toBe('en');
  });

  test('localeIdent camel-cases every hyphen subtag', () => {
    expect(localeIdent('zh-tw')).toBe('zhTw');
    expect(localeIdent('pt-br')).toBe('ptBr');
  });

  test('locale validation accepts en/ja/zh-tw/pt-br, rejects 1abc / zh--tw / "zh tw"', () => {
    for (const ok of ['en', 'ja', 'zh-tw', 'pt-br']) {
      expect(isLocaleCode(ok), ok).toBe(true);
    }
    for (const bad of ['1abc', 'zh--tw', 'zh tw', '', 'zh_tw', 'ZH-TW', '-tw', 'en-']) {
      expect(isLocaleCode(bad), JSON.stringify(bad)).toBe(false);
    }
  });

  test('the ui.ts import-block regex re-matches previously-rewritten hyphen imports (re-run safety)', () => {
    // Before the [\w-]+ widening, `zh-tw.json` in the path matched nothing and
    // a re-run aborted with ❌ "Could not rewrite locale imports".
    const rewritten =
      "import en from '~/locales/en.json';\nimport zhTw from '~/locales/zh-tw.json';\n\nimport { defaultLocale } from './routing';";
    expect(UI_IMPORT_BLOCK_RE.test(rewritten)).toBe(true);
    expect(rewritten.replace(UI_IMPORT_BLOCK_RE, () => `${buildUiImports(['en', 'zh-tw'])}\n`)).toBe(
      "import en from '~/locales/en.json';\nimport zhTw from '~/locales/zh-tw.json';\n\nimport { defaultLocale } from './routing';",
    );
  });

  test('KNOWN_LOCALE_LABELS still covers the plain locales (routing labels unchanged)', () => {
    expect(KNOWN_LOCALE_LABELS.en).toBe('English');
    expect(KNOWN_LOCALE_LABELS.ja).toBe('日本語');
    expect(KNOWN_LOCALE_LABELS.zh).toBe('中文');
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
    const rebranded = rewriteLocaleJson(makeInput(), 'ja', 2026, demoEn);
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

describe('demo article clearing is content-aware (re-runs must keep user work)', () => {
  test('every shipped demo article carries the demo-game marker (marker drift guard)', () => {
    // Mirrors the locale marker guard above: if a template author ships a demo
    // article that never mentions the demo game, content-aware clearing would
    // KEEP it forever — this goes red in the template repo until the article
    // carries the marker. Vacuous in forks after a first-run clear.
    const base = join(repoRoot, 'src/content/wiki');
    const walk = (dir: string): string[] =>
      existsSync(dir)
        ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
            e.isDirectory()
              ? walk(join(dir, e.name))
              : /\.(mdx|md)$/.test(e.name)
                ? [join(dir, e.name)]
                : [],
          )
        : [];
    const files = walk(base);
    expect(files.length, 'the template repo should ship demo wiki articles').toBeGreaterThan(0);
    for (const file of files) {
      expect(
        isDemoArticleContent(readFileSync(file, 'utf8')),
        `${file} lacks the demo-game marker (${DEMO_GAME_NAMES.join(', ')}) — content-aware clearing would keep it`,
      ).toBe(true);
    }
  });

  test('the verdict is content-only: same path flips when rewritten for the fork game', () => {
    const asDemo = { rel: 'en/bosses/emberfang.mdx', src: '---\ntitle: Emberfang\n---\n\nAnvil Quest boss strategy.' };
    const rewritten = { rel: 'en/bosses/emberfang.mdx', src: '---\ntitle: Emberfang\n---\n\nMy own boss, rewritten for my game.' };
    const scaffold = { rel: 'en/bosses/getting-started.mdx', src: '---\ntitle: Getting Started\n---\n\nReplace this scaffold with your article.' };
    expect(classifyWikiArticles([asDemo]).demo).toHaveLength(1);
    expect(classifyWikiArticles([rewritten]).kept).toHaveLength(1);
    expect(classifyWikiArticles([rewritten]).demo).toHaveLength(0);
    expect(classifyWikiArticles([scaffold]).kept).toHaveLength(1);
  });

  test('rel path shape never flips the verdict (win32 callers normalize, content decides)', () => {
    const out = classifyWikiArticles([{ rel: 'en\\bosses\\emberfang.mdx', src: 'no demo mention here' }]);
    expect(out.kept).toHaveLength(1);
    expect(out.demo).toHaveLength(0);
  });

  test('setup.yml clears articles via the content-aware script (never a blanket find -delete)', () => {
    const yml = readFileSync(join(repoRoot, '.github/workflows/setup.yml'), 'utf8');
    expect(yml).not.toContain('find src/content/wiki');
    expect(yml).toContain('scripts/clear-demo-content.ts');
    const script = readFileSync(join(repoRoot, 'scripts/clear-demo-content.ts'), 'utf8');
    // Single source: the script must classify through the shared lib, never
    // carry its own copy of the demo-identity rule.
    expect(script).toContain("from './lib/apply-rewrites'");
    expect(script).toContain('classifyWikiArticles');
    // The clear step must sit between install and build: tsx needs
    // node_modules, and the build must validate the CLEARED tree.
    const installIdx = yml.indexOf('pnpm install --frozen-lockfile');
    const clearIdx = yml.indexOf('Clear demo articles (content-aware)');
    const buildIdx = yml.indexOf('pnpm build');
    expect(clearIdx).toBeGreaterThan(installIdx);
    expect(clearIdx).toBeLessThan(buildIdx);
  });
});

describe('setup.yml demo-author removal still matches the real authors.ts', () => {
  // setup.yml drops the demo author with an INLINE python regex (single use,
  // inside a heredoc — deliberately not worth a lib round-trip). That made it
  // the only place in the repo hardcoding 'Forge Master Kael': if authors.ts
  // changes shape, the regex silently no-ops and the fork ships the demo
  // author. This contract runs the ACTUAL pattern from setup.yml against the
  // ACTUAL authors.ts, so either side drifting goes red here.
  test('the inline python regex removes exactly the demo block, byte-preserving the rest', () => {
    const yml = readFileSync(join(repoRoot, '.github/workflows/setup.yml'), 'utf8');
    const literal = yml.match(/re\.sub\(r"((?:[^"\\]|\\.)*)", '\\n', s\)/);
    expect(literal, 'setup.yml demo-author re.sub literal not found — step rewritten?').toBeTruthy();
    const pyPattern = literal![1];
    // Python↔JS semantics for THIS pattern are 1:1: `.` is not dotall in
    // either, `\s` spans newlines in both, lazy `.*?` behaves identically.
    // re.sub replaces ALL occurrences → the `g` flag.
    const demoAuthorRe = new RegExp(pyPattern, 'g');
    const src = readFileSync(join(repoRoot, 'src/config/authors.ts'), 'utf8');
    const after = src.replace(demoAuthorRe, '\n');
    // The demo identity is gone — comment line AND entry line.
    expect(after).not.toContain('Forge Master Kael');
    expect(after).not.toContain('// DEMO');
    // Byte-preservation oracle: the demo block is the comment line directly
    // above the entry line; deleting exactly those two lines must equal the
    // regex output — anything else the regex touched fails here.
    const lines = src.split('\n');
    const start = lines.findIndex((l) => l.includes('// DEMO'));
    const end = lines.findIndex((l) => l.includes("'Forge Master Kael'"));
    expect(start).toBeGreaterThan(-1);
    expect(end).toBe(start + 1);
    const expected = [...lines.slice(0, start), ...lines.slice(end + 1)].join('\n');
    expect(after).toBe(expected);
    // The user-owned scaffolding survives untouched — the example comment,
    // the (now empty) registry object still closing cleanly right after it,
    // and the getAuthor helper that follows the registry in the real file.
    expect(after).toContain("// 'Yuan Ruiqin'");
    expect(after).toContain('export const authors: Record<string, AuthorInfo> = {');
    expect(after).toMatch(/'] },\n\};\n/);
    expect(after).toContain('export function getAuthor');
  });
});

describe('answer intake rejects newline/control characters (S9)', () => {
  // The CLI's ask() layer is the enforcement point (❌ + the question named);
  // it is thin CLI code exercised by test:e2e, so here we pin the pure
  // defense-in-depth: the escape helpers must never let a control char into
  // generated TS/TOML even if a caller bypasses the intake.
  test('tsEscape strips newlines/control chars before escaping quotes', () => {
    expect(tsEscape('plain')).toBe('plain');
    expect(tsEscape("keep 'this'")).toBe("keep \\'this\\'");
    expect(tsEscape('multi\nline')).not.toContain('\n');
    expect(tsEscape('cr\rlf')).toBe('crlf');
    // Tab is NOT stripped: it is a legal character inside TS/YAML scalars and
    // the shared guard deliberately allows it (same line as sync-codes).
    expect(tsEscape('null\u0000tab\u0009esc\u001Bdel\u007F')).toBe('nulltab\tescdel');
  });

  test('rewriteWranglerVars emits no raw control char even for a hostile domain', () => {
    const out = rewriteWranglerVars(makeInput({ domain: 'evil\n domain.example' }), LF_WRANGLER)!;
    expect(out).not.toContain('\r');
    // The newline is stripped, so SITE_URL stays a single well-formed TOML line
    // (exactly one line matches, no second line carries the value tail).
    const siteUrlLines = out!.split('\n').filter((l) => l.startsWith('SITE_URL ='));
    expect(siteUrlLines).toHaveLength(1);
    expect(siteUrlLines[0]).toMatch(/^SITE_URL = "https:\/\/[^"]*"$/);
    expect(siteUrlLines[0]).toContain('evil domain.example');
  });
});

describe('re-run identity detection (S12: re-run = confirm current, never demo defaults)', () => {
  // Mirrors the real shape rewriteSiteTs writes (single-quoted, escaped).
  const USER_SITE_TS = rewriteSiteTs(
    [
      "import type { SiteConfig } from '~/lib/site';",
      'export const site: SiteConfig = {',
      "  name: 'Anvil Quest Wiki',",
      "  shortName: 'AQ Wiki',",
      "  domain: 'anvil.wiki',",
      "  tagline: 'old',",
      "  description: 'old',",
      "  legalNotice: 'old',",
      "  social: { official: 'https://example.com' },",
      "  game: { name: 'Anvil Quest', platform: 'PC', developer: 'D', genre: 'G', releaseDate: '' },",
      '};',
    ].join('\n'),
    makeInput({
      gameName: "Assassin's Creed",
      shortName: 'ACS',
      domain: 'acshadows.guide',
      tagline: 'New tagline',
      description: 'New description for the site.',
      legalNotice: 'New notice',
      officialUrl: 'https://example.com/ac',
      platform: 'Console',
      developer: "Ubiser's",
      genre: 'Action',
      releaseDate: '2026-11-20',
    }),
  )!;

  test('parseSiteTsIdentity round-trips a rewritten site.ts, unescaping the values', () => {
    const id = parseSiteTsIdentity(USER_SITE_TS);
    expect(id).not.toBeNull();
    expect(id!.gameName).toBe("Assassin's Creed");
    expect(id!.name).toBe("Assassin's Creed Wiki");
    expect(id!.shortName).toBe('ACS');
    expect(id!.domain).toBe('acshadows.guide');
    expect(id!.developer).toBe("Ubiser's");
    expect(id!.officialUrl).toBe('https://example.com/ac');
    expect(id!.releaseDate).toBe('2026-11-20');
    // game.name is anchored to its game: { block — not the site-level name.
    expect(id!.gameName).not.toBe(id!.name);
  });

  test('unreadable site.ts (missing fields) parses to null → first-run defaults', () => {
    expect(parseSiteTsIdentity('export const site: SiteConfig = { name: "x" };')).toBeNull();
    expect(parseSiteTsIdentity('')).toBeNull();
  });

  test('isDemoSiteTsIdentity: full demo identity = demo; half-rebranded = NOT demo', () => {
    const id = parseSiteTsIdentity(USER_SITE_TS)!;
    // The fixture starts from demo values → rewritten by makeInput defaults...
    // assert both directions explicitly with synthetic identities:
    expect(
      isDemoSiteTsIdentity({ ...id, gameName: 'Anvil Quest', domain: 'anvil.wiki' }),
    ).toBe(true);
    expect(
      isDemoSiteTsIdentity({ ...id, gameName: 'Anvil Quest', domain: 'acshadows.guide' }),
    ).toBe(false); // half-rebranded: game renamed, domain forgotten → re-run semantics
    expect(
      isDemoSiteTsIdentity({ ...id, gameName: 'My Game', domain: 'anvil.wiki' }),
    ).toBe(false);
  });

  test('rerunPromptDefaults returns the current site.ts values verbatim', () => {
    const id = parseSiteTsIdentity(USER_SITE_TS)!;
    const d = rerunPromptDefaults(id);
    expect(d.gameName).toBe("Assassin's Creed");
    expect(d.domain).toBe('acshadows.guide');
    expect(d.tagline).toBe('New tagline');
    expect(d.platform).toBe('Console');
    // An empty optional value stays an empty default (releaseDate is optional).
    const empty = rerunPromptDefaults({ ...id, releaseDate: '' });
    expect(empty.releaseDate).toBe('');
  });

  test('the shipped demo site.ts parses as the demo identity (drift guard)', () => {
    const raw = readFileSync(join(repoRoot, 'src/config/site.ts'), 'utf8');
    const id = parseSiteTsIdentity(raw);
    expect(id).not.toBeNull();
    expect(isDemoSiteTsIdentity(id!)).toBe(true);
    expect(DEMO_DOMAINS).toContain(id!.domain);
  });
});

describe('rewriteWranglerVars parses hand-edited TOML forms (round-15: silent env resets)', () => {
  // A fork owner hand-edits wrangler.toml — trailing inline comments and
  // single-quoted literal strings are both valid TOML. The old
  // `"(.*)"\s*$` parse missed them, and the value-aware rewrite silently
  // RESET the value to blank on a re-run.
  const HAND_EDITED = [
    'name = "anvilwiki"',
    '',
    '[vars]',
    'SITE_URL = "https://mygame.dev"',
    'PUBLIC_GA_ID = "G-ABC123" # production property',
    "PUBLIC_SPONSOR_URL = 'https://buymeacoffee.com/mygame'",
    'PUBLIC_CF_BEACON_TOKEN = "cf#token" # trailing comment after a #-bearing value',
    '',
    '[env.production]',
    'name = "production"',
    '',
  ].join('\n');

  test('a trailing inline comment no longer drops the value', () => {
    const out = rewriteWranglerVars(makeInput(), HAND_EDITED)!;
    expect(out).toContain('PUBLIC_GA_ID = "G-ABC123"');
  });

  test('a single-quoted TOML literal is parsed and re-emitted double-quoted', () => {
    const out = rewriteWranglerVars(makeInput(), HAND_EDITED)!;
    expect(out).toContain('PUBLIC_SPONSOR_URL = "https://buymeacoffee.com/mygame"');
  });

  test('a value containing # survives intact (no premature comment split)', () => {
    const out = rewriteWranglerVars(makeInput(), HAND_EDITED)!;
    expect(out).toContain('PUBLIC_CF_BEACON_TOKEN = "cf#token"');
  });
});

describe('giscus category "Announcements" (round-15: demo-value collision)', () => {
  test('a fork with its OWN category ID + the common name survives the re-run', () => {
    const src = LF_WRANGLER.replace('"DIC_kwDOT1aRPc4DDODo"', '"DIC_forkOwnId"');
    const out = rewriteWranglerVars(makeInput(), src)!;
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY = "Announcements"');
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY_ID = "DIC_forkOwnId"');
  });

  test('the demo pair (Announcements + demo category ID) is still cleared', () => {
    const out = rewriteWranglerVars(makeInput(), LF_WRANGLER)!;
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY = ""');
    expect(out).toContain('PUBLIC_GISCUS_CATEGORY_ID = ""');
  });
});

describe('parseSiteTsIdentity reads hand-edited double-quoted site.ts (round-15)', () => {
  // The old single-quote-only field regex returned null for a hand-edited
  // double-quoted file, and a null identity makes a re-run fall back to demo
  // defaults with no ♻️ banner — the destructive direction.
  const DOUBLE_QUOTED = [
    "import type { SiteConfig } from '~/lib/site';",
    'export const site: SiteConfig = {',
    '  name: "My Game Wiki",',
    '  shortName: "MGW",',
    '  domain: "mygame.dev",',
    '  tagline: "Tagline",',
    '  description: "Description",',
    '  legalNotice: "Notice",',
    '  social: { official: "https://example.com" },',
    '  game: {',
    '    name: "My Game",',
    '    platform: "PC",',
    '    developer: "D",',
    '    genre: "G",',
    '    releaseDate: "",',
    '  },',
    '};',
  ].join('\n');

  test('double-quoted literals parse instead of nulling the identity', () => {
    const id = parseSiteTsIdentity(DOUBLE_QUOTED);
    expect(id).not.toBeNull();
    expect(id!.name).toBe('My Game Wiki');
    expect(id!.shortName).toBe('MGW');
    expect(id!.domain).toBe('mygame.dev');
    expect(id!.gameName).toBe('My Game');
    expect(id!.officialUrl).toBe('https://example.com');
  });

  test('mixed quote styles parse too', () => {
    const id = parseSiteTsIdentity(DOUBLE_QUOTED.replace('  shortName: "MGW",', "  shortName: 'MGW',"));
    expect(id).not.toBeNull();
    expect(id!.shortName).toBe('MGW');
    expect(id!.name).toBe('My Game Wiki');
  });
});
