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
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test, vi } from 'vitest';
import {
  DEMO_ADSTERRA_UNIT_MARKERS,
  DEMO_ARTICLE_IMAGES,
  DEMO_COVERS,
  DEMO_DOMAINS,
  DEMO_GALLERY_IMAGES,
  DEMO_INDEXNOW_KEY_FILE,
  DEMO_PUBLIC_FILES,
  DEMO_SITE_OPTIONAL_VALUES,
  DEMO_VAR_VALUES,
  buildLocaleLabels,
  buildScaffoldDescription,
  buildUiImports,
  buildUiMessagesEntries,
  classifyWikiArticles,
  isDemoArticleContent,
  isDemoLocaleContent,
  isDemoPublicFileContent,
  isDemoSiteTsIdentity,
  isHomeSkeleton,
  isLocaleCode,
  isPlaceholderOverviewDesc,
  KNOWN_LOCALE_LABELS,
  coverNamesReferenced,
  localeIdent,
  localeKey,
  parseSiteTsIdentity,
  rerunPromptDefaults,
  rewriteLocaleJson,
  rewriteSiteTs,
  rewriteWranglerVars,
  stripDemoAuthors,
  tsEscape,
  UI_IMPORT_BLOCK_RE,
  UI_MESSAGES_BLOCK_RE,
  type SkinInput,
} from '../scripts/lib/apply-rewrites';
import {
  APPLY_TEMPLATE_STRINGS,
  envDefaultLang,
  langFromFlag,
} from '../scripts/lib/apply-template-i18n';
import {
  DEMO_CODE_PLACEHOLDER_PREFIX,
  LEGACY_ANSWER_COUNT,
  SITE_PRESETS,
  isPlaceholderCodesFrontmatter,
  siteTypeFromAnswer,
  type PresetId,
} from '../scripts/lib/site-presets';
import { CONTENT_TYPES, NAVIGATION_CONFIG, PRESET_ONLY_CATEGORIES } from '../src/config/navigation';

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
    siteType: 'game-wiki',
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

  test('keys outside the template are preserved verbatim and warned about (audit round 21 P2-2)', () => {
    // The template cannot know a fork's custom vars; silently dropping them
    // on a re-run was the destructive direction (values never committed to
    // git were unrecoverable). Preserved lines re-emit byte-for-byte, so the
    // rewrite stays idempotent; each one warns on stderr.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const withCustom = USER_WRANGLER.replace(
        '[env.production]',
        'PUBLIC_TWITTER_HANDLE = "@mygame"\nDISCORD_INVITE = "abc123"\n\n[env.production]',
      );
      const out = rewriteWranglerVars(makeInput(), withCustom)!;
      expect(out).toContain('PUBLIC_TWITTER_HANDLE = "@mygame"');
      expect(out).toContain('DISCORD_INVITE = "abc123"');
      expect(out).toContain('# Custom [vars] keys the template does not know are preserved verbatim.');
      expect(warn.mock.calls.some(([m]) => String(m).includes('PUBLIC_TWITTER_HANDLE'))).toBe(true);
      expect(warn.mock.calls.some(([m]) => String(m).includes('DISCORD_INVITE'))).toBe(true);
      const out2 = rewriteWranglerVars(makeInput(), out)!;
      expect(out2).toBe(out);
    } finally {
      warn.mockRestore();
    }
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
    // site.name is the demo marker isDemoLocaleContent trusts — without it
    // this fixture would classify as a re-run and take the overview/home
    // preservation paths instead of the wholesale demo overwrite.
    site: { name: 'Anvil Quest Wiki' },
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

  test('corrupt existing JSON: warns on stderr, output still valid + correctly reset', () => {
    // Rebuilding is the only way forward, but it must never be SILENT — a
    // hand-edited file losing every key the user added is the destructive
    // direction (same philosophy as isDemoLocaleContent's never-delete-
    // unreadable). The result must still parse and carry the reset namespaces.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026, '{ not json'));
      expect(out.site.name).toBe('Test Game Wiki');
      expect(out.nav.bosses).toBe('Bosses');
      expect(out.overview.bosses.overviewTitle).toBe('All Bosses');
      expect(out.footer.copyrightText).toContain('2026');
      expect(warn.mock.calls.some(([m]) => String(m).includes('not valid JSON'))).toBe(true);
    } finally {
      warn.mockRestore();
    }
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

describe('rewriteLocaleJson clones the default locale for brand-new files (fresh-locale UI key parity)', () => {
  // Simulates the CLI sequence: en (existing demo file) rewritten first, then
  // a brand-new locale with NO file on disk. The clone base must be the
  // REWRITTEN en output — cloning the demo en.json still on disk would leak
  // the demo identity into the new locale. Without the clone the fresh file
  // shipped a ~76-key-shorter skeleton (no $schema/search/shared) and the
  // fork's first `check-i18n --strict-ui` run went red.
  const demoEn = readFileSync(join(repoRoot, 'src/locales/en.json'), 'utf8');
  const enOut = rewriteLocaleJson(makeInput(), 'en', 2026, demoEn);
  const freshRaw = rewriteLocaleJson(makeInput(), 'zh', 2026, undefined, enOut);
  const fresh = JSON.parse(freshRaw);

  // Mirrors scripts/check-i18n.ts flattenKeys (arrays are leaf keys) — this
  // is exactly the key set `--strict-ui` diffs en vs <locale> on, so parity
  // here == green fork CI. Compared against the REWRITTEN en output (what
  // en.json holds after the same CLI run), not the demo file on disk: the
  // reset drops unchosen nav/overview keys, so the gate's reference moves.
  function flattenKeys(obj: unknown, prefix = ''): string[] {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null && !Array.isArray(v)
        ? flattenKeys(v, prefix ? `${prefix}.${k}` : k)
        : [prefix ? `${prefix}.${k}` : k],
    );
  }

  test('deep key set parity with the rewritten en output (strict-ui equivalence)', () => {
    expect(flattenKeys(fresh).sort()).toEqual(flattenKeys(JSON.parse(enOut)).sort());
  });

  test('zero demo identity strings in the fresh output', () => {
    expect(freshRaw).not.toContain('Anvil Quest');
    expect(fresh.site.name).toBe('Test Game Wiki');
    // The demo footer's "Play Anvil Quest" label must not ride the clone —
    // playGame is game-derived template text and is regenerated.
    expect(fresh.footer.playGame).toBe('Play Test Game');
  });

  test('nav/overview still follow the chosen categories, not the clone', () => {
    // The demo en.json ships an `items` category the input did not choose —
    // the reset (not the clone) decides these namespaces.
    expect(fresh.nav.items).toBeUndefined();
    expect(fresh.nav.bosses).toBe('Bosses');
    expect(fresh.nav.home).toBe('Home');
    expect(Object.keys(fresh.overview).sort()).toEqual(['bosses', 'codes', 'guides']);
    expect(fresh.overview.bosses.overviewTitle).toBe('All Bosses');
  });

  test('an existing file always wins over the clone base (re-run keeps user work)', () => {
    const existing = JSON.stringify({ customNamespace: { mine: 'keep me' } });
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'pt-br', 2026, existing, enOut));
    expect(out.customNamespace.mine).toBe('keep me');
    // No existing file AND no clone base → the pre-fix skeleton behavior is
    // unchanged (minimal output, the shape direct lib callers relied on).
    const bare = JSON.parse(rewriteLocaleJson(makeInput(), 'pt-br', 2026, undefined));
    expect(bare.customNamespace).toBeUndefined();
    expect(bare.shared).toBeUndefined();
  });
});

describe('home preset pickHref substitution is consistent per preferred key (round-22 audit)', () => {
  // The codes preset has TWO "codes" slots (quickstart card + explore
  // highlight). Independent "first unclaimed" picks used to diverge them
  // once earlier slots had claimed categories: with 4 chosen categories and
  // no codes, the card landed on cats[0] while the highlight fell through
  // to cats[3]. Substitution is memoized per key, so every slot for one
  // category lands on ONE page.
  const fourWithoutCodes = [
    { key: 'items', icon: 'lucide:package' },
    { key: 'guides', icon: 'lucide:book-open' },
    { key: 'tier-list', icon: 'lucide:bar-chart-3' },
    { key: 'bosses', icon: 'lucide:swords' },
  ];

  const codesCardHref = (home: { start: { cards: Array<{ title: string; href: string }> } }): string =>
    home.start.cards.find((c) => c.title === 'Codes')!.href;
  const codesModuleHref = (home: {
    explore: { modules: Array<{ name: string; href: string }> };
  }): string => home.explore.modules.find((m) => m.name === 'Active codes')!.href;

  test('both "codes" slots land on the SAME substituted page (4 chosen categories, no codes)', () => {
    const out = JSON.parse(
      rewriteLocaleJson(makeInput({ homePreset: 'codes', categories: fourWithoutCodes }), 'en', 2026),
    ) as { home: { start: { cards: Array<{ title: string; href: string }> }; explore: { modules: Array<{ name: string; href: string }> } } };
    expect(codesCardHref(out.home)).toBe('/items');
    expect(codesModuleHref(out.home)).toBe(codesCardHref(out.home));
  });

  test('codes chosen ⇒ both slots point at /codes (baseline unchanged)', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026)) as {
      home: { start: { cards: Array<{ title: string; href: string }> }; explore: { modules: Array<{ name: string; href: string }> } };
    };
    expect(codesCardHref(out.home)).toBe('/codes');
    expect(codesModuleHref(out.home)).toBe('/codes');
  });
});

describe('home preset hrefs resolve to chosen categories (no dead links on the fork homepage)', () => {
  const hrefsOf = (home: {
    start: { cards: { href: string }[] };
    explore: { modules: { href: string }[] };
    popular: { quickLinks: { href: string }[] };
  }): string[] => [
    ...home.start.cards.map((c) => c.href),
    ...home.explore.modules.map((m) => m.href),
    ...home.popular.quickLinks.map((q) => q.href),
  ];

  test("guides preset without a 'guides' category substitutes a chosen one and warns", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const out = JSON.parse(
        rewriteLocaleJson(
          makeInput({
            homePreset: 'guides',
            categories: [
              { key: 'items', icon: 'lucide:package' },
              { key: 'codes', icon: 'lucide:gift' },
            ],
          }),
          'en',
          2026,
        ),
      );
      const hrefs = hrefsOf(out.home);
      expect(hrefs.length).toBeGreaterThan(0);
      for (const h of hrefs) expect(['/items', '/codes'], h).toContain(h);
      expect(
        warn.mock.calls.some(([m]) => String(m).includes('"guides"') && String(m).includes('substituted')),
      ).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  test("codes preset without 'codes' substitutes in start.cards AND explore.modules", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const out = JSON.parse(
        rewriteLocaleJson(
          makeInput({
            homePreset: 'codes',
            categories: [
              { key: 'bosses', icon: 'lucide:swords' },
              { key: 'guides', icon: 'lucide:book-open' },
            ],
          }),
          'en',
          2026,
        ),
      );
      const hrefs = [
        ...hrefsOf(out.home),
        // The preset's fixed slots, spelled out: cards 1-3 + the codes module.
        out.home.start.cards[0].href,
        out.home.start.cards[1].href,
        out.home.start.cards[2].href,
        out.home.explore.modules[0].href,
      ];
      for (const h of hrefs) expect(['/bosses', '/guides'], h).toContain(h);
    } finally {
      warn.mockRestore();
    }
  });

  test('all preferred categories chosen → hrefs unchanged (stable default path)', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026));
    expect(out.home.start.cards.map((c: { href: string }) => c.href)).toEqual([
      '/codes',
      '/bosses',
      '/guides',
    ]);
    expect(out.home.explore.modules[0].href).toBe('/codes');
  });
});

describe('buildScaffoldDescription (scaffold must satisfy the 40-165 schema for any key)', () => {
  // The old template grew 2×len(key) past a ~144-char base: "walkthrough"
  // (11 chars) already exceeded the schema's max(165) and failed the fork's
  // FIRST build (drafts are schema-validated too).
  test('normal, long, and 40-char keys all land inside the schema window', () => {
    for (const key of ['bosses', 'walkthrough', 'achievements', 'a'.repeat(40)]) {
      const d = buildScaffoldDescription(key);
      expect(d.length, `key "${key}" → ${d.length} chars`).toBeGreaterThanOrEqual(40);
      expect(d.length, `key "${key}" → ${d.length} chars`).toBeLessThanOrEqual(165);
    }
  });

  test('a normal key keeps the keyed variant (echoes the category)', () => {
    expect(buildScaffoldDescription('bosses')).toContain('the bosses category');
  });

  test('an over-long key falls back to the fixed no-key sentence', () => {
    const d = buildScaffoldDescription('a'.repeat(60));
    expect(d).not.toContain('a'.repeat(60));
    expect(d.length).toBeLessThanOrEqual(165);
    expect(d.length).toBeGreaterThanOrEqual(40);
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
      // The exact-name files (search-console token, retired pre-env IndexNow
      // key file) have no content marker — their identity IS the name.
      if (rel === 'google8362d9398114b66b.html' || rel === DEMO_INDEXNOW_KEY_FILE) continue;
      expect(DEMO_ADSTERRA_UNIT_MARKERS, `${rel} has no demo unit marker`).toHaveProperty(rel);
    }
    // The retired key file is deleted by exact name regardless of content —
    // forks initialized from older trees must lose it on the next rerun.
    expect(isDemoPublicFileContent(DEMO_INDEXNOW_KEY_FILE, 'any content')).toBe(true);
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

  test('siteType is written only for non-default presets (game-wiki stays byte-identical)', () => {
    // Default: NO siteType line at all — the zero-breaking output contract.
    const gameWiki = rewriteSiteTs(SITE_TS, makeInput({ siteType: 'game-wiki' }));
    expect(gameWiki).not.toContain('siteType');
    // Non-default presets emit the build-time signal presentation variants read.
    expect(rewriteSiteTs(SITE_TS, makeInput({ siteType: 'coupon-hub' }))).toContain(
      "siteType: 'coupon-hub'",
    );
    expect(rewriteSiteTs(SITE_TS, makeInput({ siteType: 'tutorial-hub' }))).toContain(
      "siteType: 'tutorial-hub'",
    );
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

  test('ui.ts outside the CLI-rewritten regions never references a strippable locale import', () => {
    // rewriteUiTs replaces exactly two regions: the locale-JSON import block
    // and the `const messages` literal. A fork that drops a locale loses that
    // import — any OTHER code reference to its binding is a fork-only
    // "ja is not defined" ReferenceError at build (caught by e2e-template in
    // CI 2026-10-03: a deepFreeze(ja) statement sat outside the regions).
    // Comments are prose, not code, and are stripped before matching.
    // `en` is exempt: every fork keeps en, so its import always survives.
    const src = readFileSync(join(repoRoot, 'src/i18n/ui.ts'), 'utf8');
    const importBlock = UI_IMPORT_BLOCK_RE.exec(src)?.[0] ?? '';
    expect(importBlock, 'ui.ts must still carry the locale-JSON import block').toBeTruthy();
    const outside = src
      .replace(UI_IMPORT_BLOCK_RE, '')
      .replace(UI_MESSAGES_BLOCK_RE, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const ids = Array.from(importBlock.matchAll(/import (\w+) from/g)).map((m) => m[1]);
    for (const id of ids) {
      if (id === 'en') continue;
      expect(
        outside,
        `ui.ts references strippable locale import "${id}" outside the rewritten regions`,
      ).not.toMatch(new RegExp(`\\b${id}\\b`));
    }
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
  test('every shipped demo article is demo-identifiable: game marker OR preset-registry claim (marker drift guard)', () => {
    // Mirrors the locale marker guard above: if a template author ships a demo
    // article that is neither Anvil-Quest-marked nor registered in
    // SITE_PRESETS, BOTH clearing layers would KEEP it forever — this goes red
    // in the template repo until the article carries a marker or joins the
    // registry. Vacuous in forks after a first-run clear.
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
    const registryRels = new Set(
      Object.values(SITE_PRESETS).flatMap((p) =>
        Object.entries(p.demoArticles).flatMap(([locale, files]) =>
          files.map((f) => `${locale}/${f}`),
        ),
      ),
    );
    const files = walk(base);
    expect(files.length, 'the template repo should ship demo wiki articles').toBeGreaterThan(0);
    for (const file of files) {
      const rel = relative(base, file).split(sep).join('/');
      const src = readFileSync(file, 'utf8');
      expect(
        isDemoArticleContent(src) || registryRels.has(rel),
        `${file} is neither Anvil-Quest-marked nor in the SITE_PRESETS registry — demo clearing would keep it forever`,
      ).toBe(true);
    }
  });

  test('preset registry demos never rely on the Anvil Quest marker (the two layers stay disjoint)', () => {
    const base = join(repoRoot, 'src/content/wiki');
    for (const preset of Object.values(SITE_PRESETS)) {
      for (const [locale, files] of Object.entries(preset.demoArticles)) {
        for (const rel of files) {
          const src = readFileSync(join(base, locale, rel), 'utf8');
          expect(
            isDemoArticleContent(src),
            `${locale}/${rel} mentions the Anvil Quest demo game — a registry demo must be brand-independent`,
          ).toBe(false);
        }
      }
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

describe('rewriteSiteTs is value-aware on the optional hand-fill fields', () => {
  // The shipped template hardcodes contactEmail: '' and a bare
  // `social { official }` — a re-run used to silently CLEAR every optional
  // field the forker filled by hand (contactEmail, social.*, sameAs,
  // defaultAuthor). The rewrite must carry non-demo values across.
  const USER_FILLED = [
    "import type { SiteConfig } from '~/lib/site';",
    'export const site: SiteConfig = {',
    "  name: 'My Game Wiki',",
    "  shortName: 'MGW',",
    "  description: 'My description',",
    "  domain: 'mygame.dev',",
    "  tagline: 'Tagline',",
    "  legalNotice: 'Notice',",
    "  contactEmail: 'hi@mygame.dev',",
    '  social: {',
    "    official: 'https://example.com/mygame',",
    "    discord: 'https://discord.gg/myinvite',",
    "    youtube: 'https://youtube.com/@mygame',",
    "    twitter: 'https://twitter.com/mygame',",
    "    reddit: 'https://reddit.com/r/mygame',",
    '  },',
    '  sameAs: [',
    "    'https://store.steampowered.com/app/mygame',",
    "    'https://en.wikipedia.org/wiki/My_Game',",
    '  ],',
    '  game: {',
    "    name: 'My Game',",
    "    platform: 'PC',",
    "    developer: 'D',",
    "    genre: 'G',",
    "    releaseDate: '',",
    '  },',
    "  defaultAuthor: 'Jane the Wikiwright',",
    '  ogImageWidth: 1200,',
    '  ogImageHeight: 630,',
    '};',
  ].join('\n');

  test('hand-filled optional fields survive the rewrite (re-run safety)', () => {
    const out = rewriteSiteTs(USER_FILLED, makeInput())!;
    expect(out).toContain("contactEmail: 'hi@mygame.dev',");
    expect(out).toContain("discord: 'https://discord.gg/myinvite',");
    expect(out).toContain("youtube: 'https://youtube.com/@mygame',");
    expect(out).toContain("twitter: 'https://twitter.com/mygame',");
    expect(out).toContain("reddit: 'https://reddit.com/r/mygame',");
    expect(out).toContain("'https://store.steampowered.com/app/mygame',");
    expect(out).toContain("defaultAuthor: 'Jane the Wikiwright',");
    // Identity fields still follow the CLI answers, and the file parses as
    // far as the identity parser is concerned (round-trip).
    expect(out).toContain("name: 'Test Game Wiki',");
    expect(parseSiteTsIdentity(out)).not.toBeNull();
  });

  test('demo placeholder values are wiped on a first run (shipped-file drift guard)', () => {
    const demoSrc = readFileSync(join(repoRoot, 'src/config/site.ts'), 'utf8');
    const out = rewriteSiteTs(demoSrc, makeInput())!;
    for (const demo of DEMO_SITE_OPTIONAL_VALUES) {
      expect(out, demo).not.toContain(demo);
    }
    // Assert on the rewritten SITE BLOCK (the returned file also carries the
    // untouched interface declaration above it, whose optional fields spell
    // the same identifiers).
    const block = out.match(/export const site: SiteConfig = \{[\s\S]*?\n\};/)![0];
    // The blank-template shape is intact: no optional extras on a first run.
    expect(block).toContain("contactEmail: '',");
    expect(block).not.toContain('discord:');
    expect(block).not.toContain('defaultAuthor');
    expect(block).not.toContain('sameAs');
  });

  test('sameAs keeps user entries and drops demo ones in the same array', () => {
    const mixed = USER_FILLED.replace(
      "    'https://store.steampowered.com/app/mygame',",
      "    'https://example.com/anvil-quest',",
    );
    const out = rewriteSiteTs(mixed, makeInput())!;
    expect(out).toContain("'https://en.wikipedia.org/wiki/My_Game',");
    expect(out).not.toContain('https://example.com/anvil-quest');
  });

  test('a present-but-unreadable value warns instead of vanishing silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const compressed = USER_FILLED.replace(
        /  social: \{[\s\S]*?\},/,
        "  social: { official: 'https://example.com/mygame', discord: myInviteVariable },",
      );
      rewriteSiteTs(compressed, makeInput());
      expect(warn.mock.calls.some(([m]) => String(m).includes('social.discord'))).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  test('a re-run over its own output is byte-identical (idempotent)', () => {
    const once = rewriteSiteTs(USER_FILLED, makeInput())!;
    const twice = rewriteSiteTs(once, makeInput())!;
    expect(twice).toBe(once);
  });
});

describe('rewriteLocaleJson overview/home are re-run-aware (M2)', () => {
  // A non-demo file (user site.name) = a re-run: hand-written overview copy
  // for owned keys must survive, machine placeholders must regenerate, and a
  // preset overwrite of an edited home must warn.
  const userJson = JSON.stringify({
    site: { name: 'My Game Wiki' },
    overview: {
      bosses: {
        overviewTitle: 'Boss Compendium',
        overviewDescription: 'A hand-written index of every boss, updated weekly.',
      },
      guides: {
        overviewTitle: 'All Guides',
        overviewDescription:
          'Guides content for My Game. Replace this overview text in the locale JSON — it feeds the category page title and description.',
      },
    },
    home: {
      faq: { title: 'FAQ', items: [{ question: 'Is it out?', answer: 'Yes.' }] },
    },
  });

  test('re-run keeps hand-written overview copy for owned keys', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026, userJson));
    expect(out.overview.bosses.overviewTitle).toBe('Boss Compendium');
    expect(out.overview.bosses.overviewDescription).toBe(
      'A hand-written index of every boss, updated weekly.',
    );
  });

  test('re-run regenerates placeholder-shaped descriptions (a game rename stays fresh)', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026, userJson));
    expect(out.overview.guides.overviewDescription).toContain('Test Game');
    expect(out.overview.guides.overviewDescription).not.toContain('My Game');
    // Unowned keys still never leak back into the overview.
    expect(Object.keys(out.overview).sort()).toEqual(['bosses', 'codes', 'guides']);
  });

  test('re-run over an edited home warns before the preset replaces it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const raw = rewriteLocaleJson(makeInput(), 'en', 2026, userJson);
      expect(warn.mock.calls.some(([m]) => String(m).includes('home namespace'))).toBe(true);
      // The preset still lands (an explicit choice every run) — but loudly.
      expect(JSON.parse(raw).home.hero.title).toContain('Test Game');
    } finally {
      warn.mockRestore();
    }
  });

  test('a machine-skeleton home (previous preset output) is replaced silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const skeleton = JSON.stringify({
        site: { name: 'My Game Wiki' },
        home: {
          hero: { title: 'Old Game Codes' },
          explore: {
            modules: [
              {
                order: 1,
                name: 'Active codes',
                href: '/codes',
                displayType: 'badge-list',
                highlights: [
                  { label: 'CODE-PLACEHOLDER', detail: 'd', badge: 'NEW' },
                ],
              },
            ],
          },
          faq: { title: 'FAQ', items: [] },
        },
      });
      rewriteLocaleJson(makeInput(), 'en', 2026, skeleton);
      expect(warn.mock.calls.some(([m]) => String(m).includes('home namespace'))).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });

  test('first run over a demo file still overwrites wholesale (v2.6.3: no demo leak)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const demoFile = JSON.stringify({
        site: { name: 'Anvil Quest Wiki' },
        overview: {
          bosses: { overviewTitle: 'Anvil Quest Bosses', overviewDescription: 'demo boss text' },
        },
        home: { faq: { items: [{ question: 'demo?', answer: 'demo' }] } },
      });
      const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', 2026, demoFile));
      expect(out.overview.bosses.overviewTitle).toBe('All Bosses');
      expect(JSON.stringify(out)).not.toContain('Anvil Quest');
      // A non-skeleton demo home is replaced WITHOUT the re-run warning —
      // first-run semantics are untouched.
      expect(warn.mock.calls.some(([m]) => String(m).includes('home namespace'))).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });

  test('isPlaceholderOverviewDesc / isHomeSkeleton helpers (direct units)', () => {
    expect(isPlaceholderOverviewDesc('tier-list', 'Tier List content for Foo. Replace this overview text in the locale JSON — it feeds the category page title and description.')).toBe(true);
    expect(isPlaceholderOverviewDesc('tier-list', 'Hand-written tier list intro.')).toBe(false);
    // Empty/missing home is trivially a skeleton; user FAQ data is not.
    expect(isHomeSkeleton(undefined)).toBe(true);
    expect(isHomeSkeleton({ faq: { items: [] } })).toBe(true);
    expect(isHomeSkeleton({ faq: { items: [{ q: 1 }] } })).toBe(false);
    expect(isHomeSkeleton({ explore: { modules: [{ highlights: [{ label: 'Codes — updated daily' }] }] } })).toBe(false);
    expect(isHomeSkeleton({ explore: { modules: [{ highlights: [{ label: 'Step 1' }] }] } })).toBe(true);
  });
});

describe('stripDemoAuthors — the CLI authors.ts regex (real-file contract + setup.yml parity)', () => {
  test('removes exactly the demo block from the shipped authors.ts, byte-preserving the rest', () => {
    const src = readFileSync(join(repoRoot, 'src/config/authors.ts'), 'utf8');
    const once = stripDemoAuthors(src);
    expect(once.changed).toBe(true);
    expect(once.cleaned).not.toContain('Forge Master Kael');
    expect(once.cleaned).not.toContain('// DEMO');
    // Byte-preservation oracle: the demo block is the comment line directly
    // above the entry line; deleting exactly those two lines must equal the
    // regex output — anything else the regex touched fails here.
    const lines = src.split('\n');
    const start = lines.findIndex((l) => l.includes('// DEMO'));
    const end = lines.findIndex((l) => l.includes("'Forge Master Kael'"));
    expect(start).toBeGreaterThan(-1);
    expect(end).toBe(start + 1);
    const expected = [...lines.slice(0, start), ...lines.slice(end + 1)].join('\n');
    expect(once.cleaned).toBe(expected);
    // Idempotent: a re-run finds nothing and reports no-change — the CLI
    // warns instead of writing a false ✅.
    expect(stripDemoAuthors(once.cleaned).changed).toBe(false);
  });

  test('the CLI regex output equals the setup.yml python re.sub output (no channel drift)', () => {
    const yml = readFileSync(join(repoRoot, '.github/workflows/setup.yml'), 'utf8');
    const literal = yml.match(/re\.sub\(r"((?:[^"\\]|\\.)*)", '\\n', s\)/);
    expect(literal, 'setup.yml demo-author re.sub literal not found — step rewritten?').toBeTruthy();
    const src = readFileSync(join(repoRoot, 'src/config/authors.ts'), 'utf8');
    // Python↔JS semantics for THIS pattern are 1:1 (same argument as the
    // setup.yml contract test above); re.sub is global.
    const afterPy = src.replace(new RegExp(literal![1], 'g'), '\n');
    expect(stripDemoAuthors(src).cleaned).toBe(afterPy);
  });
});

describe('new-locale.ts single-sources locale helpers (drift guard)', () => {
  // new-locale.ts runs main() at import time, so the contract is a static
  // source scan — same pattern as tests/prompt.test.ts's CLI wiring pins.
  const src = readFileSync(join(repoRoot, 'scripts/new-locale.ts'), 'utf8');

  test('validates through the shared isLocaleCode (hyphen locales pass)', () => {
    expect(src).toContain("from './lib/apply-rewrites'");
    expect(src).toMatch(/\bisLocaleCode\b/);
    // The old 2-3-letter gate rejected zh-tw/pt-br — must not come back.
    expect(src).not.toMatch(/\^\[a-z\]\{2,3\}\$/);
    // The 15-entry local label table is gone — labels come from the lib.
    expect(src).not.toContain("'Italiano'");
    expect(src).not.toContain("'Bahasa Indonesia'");
  });

  test('injects legal TS for hyphen locales (localeKey/localeIdent)', () => {
    expect(src).toMatch(/\blocaleKey\b/);
    expect(src).toMatch(/\blocaleIdent\b/);
  });

  test('writes go through the shared atomic helper (no bare writeFileSync)', () => {
    expect(src).toContain('writeAtomic');
    expect(src).not.toMatch(/\bwriteFileSync\b/);
  });
});

describe('apply-template CLI bilingual UI (--lang + interactive language question)', () => {
  // The CLI speaks en or zh (scripts/lib/apply-template-i18n.ts). The table
  // is the whole contract: zh must mirror en key-for-key, and the ENGLISH
  // table must keep the exact phrases scripts/e2e-apply-template.mjs greps
  // for — a casual rewording of "Base config complete" would fail every CI
  // e2e run, not just look off.
  const cliSrc = readFileSync(join(repoRoot, 'scripts/apply-template.ts'), 'utf8');

  test('zh table mirrors the en table key-for-key (no silent drift)', () => {
    const { en, zh } = APPLY_TEMPLATE_STRINGS;
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
    // Type-level Record<keyof typeof en, string> enforces this at typecheck;
    // this runtime guard covers future refactors that loosen the annotation.
  });

  test('en table keeps the phrases pnpm test:e2e pins, verbatim', () => {
    const t = APPLY_TEMPLATE_STRINGS.en;
    expect(t.secComplete).toContain('Base config complete');
    expect(t.orphanKeptWarn(2, 'en, zh')).toContain('not in your chosen locales');
    expect(t.keptFilesWarn(1, 'X')).toContain('NOT demo content');
  });

  test('langFromFlag parses --lang zh / --lang=zh, regional tags, absence, and rejects the rest', () => {
    expect(langFromFlag(['--lang', 'zh'])).toBe('zh');
    expect(langFromFlag(['--lang=zh'])).toBe('zh');
    expect(langFromFlag(['--lang', 'zh-TW'])).toBe('zh');
    expect(langFromFlag(['--lang', 'en'])).toBe('en');
    expect(langFromFlag(['--lang', 'en-US'])).toBe('en');
    expect(langFromFlag(['--dry-run', '-n'])).toBeUndefined();
    expect(langFromFlag(['--lang'])).toBe('invalid'); // dangling flag = user error, not absence
    expect(langFromFlag(['--lang', 'fr'])).toBe('invalid');
    expect(langFromFlag(['--lang='])).toBe('invalid');
  });

  test('envDefaultLang: a zh terminal locale defaults the interactive question to 中文', () => {
    expect(envDefaultLang({ LANG: 'zh_CN.UTF-8' })).toBe('zh');
    expect(envDefaultLang({ LC_ALL: 'zh_TW', LANG: 'en_US.UTF-8' })).toBe('zh');
    expect(envDefaultLang({ LANGUAGE: 'zh:en' })).toBe('zh');
    expect(envDefaultLang({ LANG: 'en_US.UTF-8' })).toBe('en');
    expect(envDefaultLang({ LANG: 'C' })).toBe('en');
    expect(envDefaultLang({})).toBe('en');
  });

  test('the language question is TTY-gated and never consumes scripted answers', () => {
    // askLanguage must go through rl.ask DIRECTLY — the ask()/askBool helpers
    // divert to the scripted --answers queue, where a language question would
    // either eat the first of the 18 positional answers or stall a piped run.
    expect(cliSrc).toMatch(/await rl\.ask\(`选择界面语言/);
    // ...and the interactive ask is gated to non-scripted TTY runs only, so
    // --answers/piped/CI output (and the E2E's pinned markers) stay English.
    expect(cliSrc).toMatch(/LANG_FLAG === undefined && !scripted && process\.stdin\.isTTY/);
  });

  test('en count-lines keep the pre-i18n singular/plural forms (scripted output byte-stable)', () => {
    // The v2.37.0 release banner promises scripted runs stay byte-identical.
    // The i18n table initially collapsed these to "(s)", which changed the
    // n=1 lines; the plural logic must match the pre-i18n literals exactly.
    const t = APPLY_TEMPLATE_STRINGS.en;
    expect(t.clearedArticles(1, false)).toContain('1 demo article under');
    expect(t.clearedArticles(2, false)).toContain('2 demo articles under');
    expect(t.clearedArticles(1, true)).toContain('Would remove');
    expect(t.scaffoldCreated(1)).toContain('1 scaffold article (');
    expect(t.scaffoldCreated(3)).toContain('3 scaffold articles (');
    expect(t.landingRemoved(1)).toContain('1 project landing page file (');
    expect(t.landingRemoved(5)).toContain('5 project landing page files (');
  });
});

// ===========================================================================
// Site-type presets (qSiteType / SITE_PRESETS) — registry contract, --answers
// 18/19 compatibility, preset-aware locale rewrites, and the demo internal-
// link whitelist (the template-side twin of the fork's check-links gate).
// ===========================================================================

const registryRelSet = (): Set<string> =>
  new Set(
    Object.values(SITE_PRESETS).flatMap((p) =>
      Object.entries(p.demoArticles).flatMap(([locale, files]) => files.map((f) => `${locale}/${f}`)),
    ),
  );

describe('SITE_PRESETS registry ↔ disk demo files (bidirectional contract)', () => {
  const wikiBase = join(repoRoot, 'src/content/wiki');
  const coversBase = join(repoRoot, 'src/assets/covers');

  test('preset categories are LEGAL_CONTENT_TYPES subsets in catalog menu order', () => {
    // Preset-only keys (recipes) are legal content types but absent from the
    // game-wiki NAVIGATION_CONFIG — their menu order is defined by
    // PRESET_ONLY_CATEGORIES (appended after the game keys, in declared
    // order). The game-wiki preset must still use NAVIGATION_CONFIG keys only.
    const catalogOrder = [...NAVIGATION_CONFIG, ...PRESET_ONLY_CATEGORIES];
    const catalogKeys = catalogOrder.map((n) => n.key);
    for (const preset of Object.values(SITE_PRESETS)) {
      expect(preset.categories.length, `${preset.id}: at least one category`).toBeGreaterThan(0);
      const seen = new Set<string>();
      let cursor = -1;
      for (const key of preset.categories) {
        expect(
          catalogKeys,
          `${preset.id}: "${key}" is a legal category (catalog) key`,
        ).toContain(key);
        expect(seen.has(key), `${preset.id}: "${key}" listed once`).toBe(false);
        seen.add(key);
        const menuIndex = catalogOrder.findIndex((n) => n.key === key);
        expect(
          menuIndex,
          `${preset.id}: "${key}" must follow the catalog menu order`,
        ).toBeGreaterThan(cursor);
        cursor = menuIndex;
      }
      if (preset.id === 'game-wiki') {
        for (const key of preset.categories) {
          expect(
            CONTENT_TYPES,
            'game-wiki categories stay inside NAVIGATION_CONFIG (game menu only)',
          ).toContain(key);
        }
      }
    }
  });

  test('every registry demo article exists on disk (forward direction)', () => {
    for (const preset of Object.values(SITE_PRESETS)) {
      for (const [locale, files] of Object.entries(preset.demoArticles)) {
        for (const rel of files) {
          expect(
            existsSync(join(wikiBase, locale, rel)),
            `${preset.id}: src/content/wiki/${locale}/${rel} is registered but missing — create it or fix the registry`,
          ).toBe(true);
        }
      }
    }
  });

  test('every registry demo cover exists in src/assets/covers (forward direction)', () => {
    for (const preset of Object.values(SITE_PRESETS)) {
      for (const name of preset.demoAssets) {
        expect(
          existsSync(join(coversBase, name)),
          `${preset.id}: src/assets/covers/${name} is registered but missing — generate it (pnpm gen-covers) or fix the registry`,
        ).toBe(true);
      }
    }
  });

  test('DEMO_COVERS is the flat union of every preset demoAssets (single source, no dupes)', () => {
    const union = Object.values(SITE_PRESETS).flatMap((p) => p.demoAssets);
    expect(new Set(union).size).toBe(union.length);
    expect([...DEMO_COVERS].sort()).toEqual([...union].sort());
  });

  test('presets never claim the same demo file or asset (no cross-preset overlap)', () => {
    const rels = registryRelSet();
    expect(rels.size).toBe(
      Object.values(SITE_PRESETS).reduce(
        (n, p) => n + Object.values(p.demoArticles).flat().length,
        0,
      ),
    );
    const assets = Object.values(SITE_PRESETS).flatMap((p) => p.demoAssets);
    expect(new Set(assets).size).toBe(assets.length);
  });
});

describe('classifyWikiArticles registry layer (site-type demos + locale dimension)', () => {
  const couponDemo = SITE_PRESETS['coupon-hub'].demoArticles;
  const tutorialDemo = SITE_PRESETS['tutorial-hub'].demoArticles;
  const entry = (rel: string, src = 'demo body'): { rel: string; src: string } => ({ rel, src });

  test('chosen preset + chosen locale → kept as the preset starting content', () => {
    const rel = `en/${couponDemo.en[0]}`;
    const out = classifyWikiArticles([entry(rel)], {
      selectedLocales: ['en', 'zh'],
      preset: 'coupon-hub',
    });
    expect(out.kept).toHaveLength(1);
    expect(out.demo).toHaveLength(0);
  });

  test('chosen preset + unselected locale → cleared unconditionally (locale dimension)', () => {
    const files = couponDemo.ja.map((f) => entry(`ja/${f}`));
    const out = classifyWikiArticles(files, {
      selectedLocales: ['en', 'zh'],
      preset: 'coupon-hub',
    });
    expect(out.demo).toHaveLength(files.length);
    expect(out.kept).toHaveLength(0);
  });

  test('OTHER presets demos are cleared even in chosen locales (cross-preset, spec §3)', () => {
    const files = [
      ...tutorialDemo.en.map((f) => entry(`en/${f}`)),
      ...couponDemo.en.map((f) => entry(`en/${f}`)),
    ];
    const out = classifyWikiArticles(files, { selectedLocales: ['en'], preset: 'tutorial-hub' });
    expect(out.kept.map((e) => e.rel)).toEqual(tutorialDemo.en.map((f) => `en/${f}`));
    expect(out.demo.map((e) => e.rel)).toEqual(couponDemo.en.map((f) => `en/${f}`));
  });

  test('no options at all (setup.yml Initialize channel) → every registered demo cleared', () => {
    const files = [
      ...couponDemo.en.map((f) => entry(`en/${f}`)),
      ...couponDemo.ja.map((f) => entry(`ja/${f}`)),
      ...tutorialDemo.en.map((f) => entry(`en/${f}`)),
    ];
    expect(classifyWikiArticles(files).demo).toHaveLength(files.length);
    expect(classifyWikiArticles(files).kept).toHaveLength(0);
  });

  test('registry hit + chosen locale but NO preset info → kept (locales-only caller)', () => {
    const out = classifyWikiArticles([entry(`en/${couponDemo.en[0]}`)], { selectedLocales: ['en'] });
    expect(out.kept).toHaveLength(1);
  });

  test('Anvil Quest fallback unchanged: marked content cleared, user content kept', () => {
    const asDemo = { rel: 'en/bosses/emberfang.mdx', src: 'Anvil Quest strategy.' };
    const user = { rel: 'en/bosses/mine.mdx', src: 'My own boss guide.' };
    const out = classifyWikiArticles([asDemo, user], {
      selectedLocales: ['en'],
      preset: 'game-wiki',
    });
    expect(out.demo.map((e) => e.rel)).toEqual([asDemo.rel]);
    expect(out.kept.map((e) => e.rel)).toEqual([user.rel]);
  });

  test('win32 backslash rels never match the registry (content rule decides)', () => {
    const out = classifyWikiArticles(
      [{ rel: 'en\\codes\\pixelpad-codes.mdx', src: 'user article body' }],
      { selectedLocales: ['en'], preset: 'game-wiki' },
    );
    expect(out.kept).toHaveLength(1);
  });
});

describe('--answers 18/19 site-type compatibility (pure rules + CLI wiring pins)', () => {
  const cliSrc = readFileSync(join(repoRoot, 'scripts/apply-template.ts'), 'utf8');

  test('LEGACY_ANSWER_COUNT is 18 and siteTypeFromAnswer maps 1/2/3/4', () => {
    expect(LEGACY_ANSWER_COUNT).toBe(18);
    expect(siteTypeFromAnswer('1')).toBe('game-wiki');
    expect(siteTypeFromAnswer('2')).toBe('coupon-hub');
    expect(siteTypeFromAnswer('3')).toBe('tutorial-hub');
    expect(siteTypeFromAnswer('4')).toBe('recipe-hub');
    expect(siteTypeFromAnswer(' 2 ')).toBe('coupon-hub');
    for (const bad of ['', '0', '5', 'abc', 'game-wiki']) {
      expect(siteTypeFromAnswer(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  test('the CLI detects the legacy count before consuming answers and defaults silently to game-wiki', () => {
    // Detection must run BEFORE any prompt consumes an entry (the queue
    // shrinks as prompts eat it) — pinned at the top of main(), next to
    // loadScriptedAnswers.
    expect(cliSrc).toMatch(/scripted !== null && scripted\.length === LEGACY_ANSWER_COUNT/);
    expect(cliSrc).toMatch(/if \(legacySiteTypeCompat\) \{\s*\n\s*siteType = 'game-wiki';/);
  });

  test('an invalid qSiteType answer and a category×preset mismatch both exit loudly before writes', () => {
    expect(cliSrc).toMatch(/siteTypeFromAnswer\(siteTypeAnswer\)/);
    expect(cliSrc).toMatch(/T\.siteTypeError\(siteTypeAnswer\)/);
    // The category question is asked BEFORE qSiteType (index 13 vs 17), so
    // narrowing is a POST-check — it must sit between the site-type answer
    // and the first file write.
    const siteIdx = cliSrc.indexOf('T.siteTypeError');
    const mismatchIdx = cliSrc.indexOf('T.siteCategoryMismatchError');
    const firstWriteIdx = cliSrc.indexOf("write('src/config/site.ts'");
    expect(siteIdx).toBeGreaterThan(-1);
    expect(mismatchIdx).toBeGreaterThan(siteIdx);
    expect(mismatchIdx).toBeLessThan(firstWriteIdx);
  });

  test('qSiteType sits after qRemoveLanding and before qProceed in the prompt sequence', () => {
    const removeIdx = cliSrc.indexOf('T.qRemoveLanding');
    const siteIdx = cliSrc.indexOf('T.qSiteType');
    const proceedIdx = cliSrc.indexOf('T.qProceed');
    expect(removeIdx).toBeGreaterThan(-1);
    expect(siteIdx).toBeGreaterThan(removeIdx);
    expect(proceedIdx).toBeGreaterThan(siteIdx);
  });

  test('clearDemoContent forwards the chosen locales + preset to the shared classifier', () => {
    expect(cliSrc).toMatch(/classifyWikiArticles\(entries, \{\s*\n\s*selectedLocales,\s*\n\s*preset,/);
  });

  test('SkinInput carries siteType and the planned output names it', () => {
    const libSrc = readFileSync(join(repoRoot, 'scripts/lib/apply-rewrites.ts'), 'utf8');
    expect(libSrc).toMatch(/siteType: PresetId;/);
    expect(cliSrc).toMatch(/T\.plannedSiteType\}\$\{siteType\}/);
  });

  test('zh table mirrors the new site-type keys (zh-mirrors-en contract covers them)', () => {
    const { en, zh } = APPLY_TEMPLATE_STRINGS;
    for (const key of ['qSiteType', 'siteTypeMenu', 'siteTypeNote'] as const) {
      expect(typeof zh[key]).toBe('string');
      expect(zh[key]).not.toBe(en[key]); // translated, not copied
    }
    expect(zh.siteTypeError('9')).toContain('1、2、3 或 4');
    expect(en.siteTypeError('9')).toContain('1, 2, 3 or 4');
  });
});

describe('preset-aware rewriteLocaleJson (nav/overview labels + cross-preset key parity)', () => {
  const OVERVIEW_TAIL =
    '. Replace this overview text in the locale JSON — it feeds the category page title and description.';
  const allCats = [
    { key: 'bosses', icon: 'lucide:swords' },
    { key: 'guides', icon: 'lucide:book-open' },
    { key: 'items', icon: 'lucide:package' },
    { key: 'codes', icon: 'lucide:gift' },
  ];

  // Mirrors scripts/check-i18n.ts flattenKeys (arrays are leaf keys).
  function flattenKeys(obj: unknown, prefix = ''): string[] {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null && !Array.isArray(v)
        ? flattenKeys(v, prefix ? `${prefix}.${k}` : k)
        : [prefix ? `${prefix}.${k}` : k],
    );
  }

  test('the locale JSON key skeleton is identical across site types (same categories in)', () => {
    // Constraint e: the preset copy pack swaps VALUES, never keys — arrays are
    // leaves, so differing module counts/highlight lengths cannot move the key
    // set. Only category choices move it, hence the same cats for all three.
    const demoEn = readFileSync(join(repoRoot, 'src/locales/en.json'), 'utf8');
    const keySets = (['game-wiki', 'coupon-hub', 'tutorial-hub'] as PresetId[]).map((siteType) =>
      flattenKeys(
        JSON.parse(rewriteLocaleJson(makeInput({ siteType, categories: allCats }), 'en', 2026, demoEn)),
      ).sort(),
    );
    expect(keySets[0]).toEqual(keySets[1]);
    expect(keySets[0]).toEqual(keySets[2]);
  });

  test('game-wiki keeps the historical TitleCase labels byte-for-byte', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput({ siteType: 'game-wiki' }), 'en', 2026));
    expect(out.nav.codes).toBe('Codes');
    expect(out.overview.codes.overviewTitle).toBe('All Codes');
    expect(out.overview.codes.overviewDescription).toBe(`Codes content for Test Game${OVERVIEW_TAIL}`);
  });

  test('coupon-hub writes Deals/Saving Guides/Tools labels and deal-flavored overviews', () => {
    const out = JSON.parse(
      rewriteLocaleJson(makeInput({ siteType: 'coupon-hub', categories: allCats }), 'en', 2026),
    );
    expect(out.nav.codes).toBe('Deals');
    expect(out.nav.guides).toBe('Saving Guides');
    expect(out.nav.items).toBe('Tools');
    expect(out.overview.codes.overviewTitle).toBe('All Deals');
    expect(out.overview.codes.overviewDescription).toBe(`Active coupons and deals for Test Game${OVERVIEW_TAIL}`);
    expect(out.overview.items.overviewTitle).toBe('All Tools');
  });

  test('a FIRST run over the demo file does not let demo labels override the preset labels', () => {
    // The demo en.json carries English nav labels ('Codes'…). Before the
    // prevNav overlay was gated on re-runs, those rode the overlay on FIRST
    // runs too and a coupon fork got game-flavored "Codes" instead of
    // "Deals" (everything else preset-flavored). A demo-marked file is a
    // first run by definition (v2.6.3 semantics) — its labels must never
    // win for a preset-owned key.
    const demoFile = JSON.stringify({
      site: { name: 'Anvil Quest Wiki' },
      nav: { home: 'Home', bosses: 'Bosses', guides: 'Guides', items: 'Items', codes: 'Codes' },
    });
    const out = JSON.parse(
      rewriteLocaleJson(makeInput({ siteType: 'coupon-hub', categories: allCats }), 'en', 2026, demoFile),
    );
    expect(out.nav.codes).toBe('Deals');
    expect(out.nav.guides).toBe('Saving Guides');
    expect(out.nav.items).toBe('Tools');
  });

  test('a game-wiki FIRST run over the REAL demo ja.json keeps its Japanese labels (zero-breaking)', () => {
    // The shipped demo ja.json carries real Japanese nav labels (ボス…). The
    // pre-preset overlay kept them on first runs; gating the overlay on
    // re-runs regressed every non-default locale to English TitleCase
    // placeholders ("Bosses" where ボス belongs). game-wiki must stay
    // byte-identical to that behavior for every locale; only the
    // preset-owned-key scenario (coupon → Deals) suppresses first-run
    // labels. Reads the real src/locales/ja.json — synthetic English
    // fixtures cannot catch this (their demo labels equal the defaults).
    const realJa = readFileSync(join(repoRoot, 'src/locales/ja.json'), 'utf8');
    const ja = JSON.parse(realJa) as { site: { name: string }; nav: Record<string, string> };
    expect(ja.site.name).toBe('Anvil Quest Wiki'); // demo-marked → first run
    const out = JSON.parse(rewriteLocaleJson(makeInput({ siteType: 'game-wiki' }), 'ja', 2026, realJa));
    expect(out.nav.bosses).toBe('ボス');
    expect(out.nav.home).toBe('ホーム');
    expect(out.nav.codes).toBe('コード');
    expect(out.nav.search).toBe('検索');
    // The suppression stays scoped: the same real ja.json under coupon-hub
    // still takes the preset labels (the original fix's intent).
    const coupon = JSON.parse(
      rewriteLocaleJson(makeInput({ siteType: 'coupon-hub', categories: allCats }), 'ja', 2026, realJa),
    );
    expect(coupon.nav.codes).toBe('Deals');
    expect(coupon.nav.guides).toBe('Saving Guides');
    expect(coupon.nav.items).toBe('Tools');
  });

  test('tutorial-hub labels guides as Tutorials', () => {
    const out = JSON.parse(
      rewriteLocaleJson(
        makeInput({ siteType: 'tutorial-hub', categories: [{ key: 'guides', icon: 'x' }] }),
        'en',
        2026,
      ),
    );
    expect(out.nav.guides).toBe('Tutorials');
    expect(out.overview.guides.overviewTitle).toBe('All Tutorials');
    expect(out.overview.guides.overviewDescription).toBe(`Step-by-step tutorials from Test Game${OVERVIEW_TAIL}`);
  });

  test('placeholder overview detection covers every preset head (rename regenerates, hand edits stay)', () => {
    expect(isPlaceholderOverviewDesc('codes', `Active coupons and deals for X${OVERVIEW_TAIL}`)).toBe(true);
    expect(isPlaceholderOverviewDesc('codes', `Codes content for X${OVERVIEW_TAIL}`)).toBe(true);
    expect(isPlaceholderOverviewDesc('codes', 'Hand-written deals intro.')).toBe(false);
  });
});

describe('preset home builders (coupon/tutorial) keep the game-wiki shape and watermarks', () => {
  const catsFor = (id: PresetId) => SITE_PRESETS[id].categories.map((key) => ({ key, icon: 'lucide:gift' }));

  test('coupon-hub home: game-wiki key skeleton, hot-deals slots inside chosen categories', () => {
    const cats = catsFor('coupon-hub');
    const game = JSON.parse(
      rewriteLocaleJson(makeInput({ siteType: 'game-wiki', categories: cats }), 'en', 2026),
    ).home;
    const out = JSON.parse(
      rewriteLocaleJson(makeInput({ siteType: 'coupon-hub', categories: cats }), 'en', 2026),
    ).home;
    expect(Object.keys(out).sort()).toEqual(Object.keys(game).sort());
    // Fixed editorial slots (Hot deals / Tools / Saving guides) — independent
    // of the preset category order.
    expect(out.start.cards.map((c: { href: string }) => c.href)).toEqual(['/codes', '/items', '/guides']);
    expect(out.explore.modules[0].displayType).toBe('badge-list');
    expect(out.explore.modules[0].highlights[0].label).toBe('CODE-PLACEHOLDER');
    // quickLinks follow the preset's category order (NAVIGATION_CONFIG menu
    // order) but carry the coupon-hub labels.
    expect(out.popular.quickLinks.map((q: { label: string }) => q.label)).toEqual([
      'Saving Guides',
      'Tools',
      'Deals',
    ]);
    // Machine-skeleton watermark intact (a re-run may replace it silently).
    expect(isHomeSkeleton(out)).toBe(true);
    // Never a fabricated code in the home copy — placeholder codes live in
    // the preset demo ARTICLES only (never in en.json/ja.json highlights).
    expect(JSON.stringify(out)).not.toMatch(/DEMO-/);
  });

  test('tutorial-hub home: steps module, chosen-category hrefs, watermark intact', () => {
    const cats = catsFor('tutorial-hub');
    const out = JSON.parse(
      rewriteLocaleJson(makeInput({ siteType: 'tutorial-hub', categories: cats }), 'en', 2026),
    ).home;
    expect(out.start.cards.map((c: { href: string }) => c.href)).toEqual(['/guides']);
    expect(out.explore.modules[0].displayType).toBe('steps');
    expect(out.explore.modules[0].highlights.map((h: { label: string }) => h.label)).toEqual([
      'Step 1',
      'Step 2',
      'Step 3',
    ]);
    expect(isHomeSkeleton(out)).toBe(true);
  });

  test('homePreset "keep" still means keep on every site type (explicit user choice)', () => {
    for (const siteType of ['coupon-hub', 'tutorial-hub'] as PresetId[]) {
      const out = JSON.parse(rewriteLocaleJson(makeInput({ siteType, homePreset: 'keep' }), 'en', 2026));
      expect(out.home).toBeUndefined();
    }
  });
});

describe('preset demo internal links whitelist (template side of the fork check-links gate)', () => {
  // A fork's eight-gate CI runs `pnpm check-links` over dist/ (constraint a2),
  // while LANDING_PATHS deletes /landing and the preset narrows the retained
  // categories — so a demo article linking a deleted route or a category
  // outside its preset's set would redden EVERY fork of that type on day one.
  // The template repo gates the same fact statically: every internal markdown
  // link in a registered demo must stay inside the owning preset's retained
  // categories ∪ system pages (homepage/tags/recent/faq), and never /landing.
  const SYSTEM_SEGMENTS = new Set(['tags', 'recent', 'faq']);
  const wikiBase = join(repoRoot, 'src/content/wiki');

  for (const preset of Object.values(SITE_PRESETS)) {
    for (const [locale, files] of Object.entries(preset.demoArticles)) {
      for (const rel of files) {
        const full = `${locale}/${rel}`;
        test(`${full}: links stay inside ${preset.id} retained categories ∪ system pages`, () => {
          const raw = readFileSync(join(wikiBase, locale, rel), 'utf8');
          const closing = raw.indexOf('\n---', 3);
          const body = closing === -1 ? raw : raw.slice(closing + 4);
          const links = Array.from(body.matchAll(/\]\((\/[^)\s]*)\)/g)).map((m) => m[1]);
          expect(
            links.length,
            `${full}: at least 3 internal links (content-format rule)`,
          ).toBeGreaterThanOrEqual(3);
          const base = locale === 'en' ? '' : `/${locale}`;
          for (const href of links) {
            const noAnchor = href.split('#')[0] ?? '';
            if (noAnchor === '' || noAnchor === `${base}/`) continue; // same-page anchor / homepage
            expect(
              href.startsWith('/landing'),
              `${full}: ${href} links the fork-deleted /landing routes`,
            ).toBe(false);
            const first = (noAnchor.slice(base.length).split('/').filter(Boolean)[0] ?? '');
            expect(
              preset.categories.includes(first) || SYSTEM_SEGMENTS.has(first),
              `${full}: ${href} escapes the ${preset.id} whitelist (retained: ${preset.categories.join(', ')}; system: tags/recent/faq)`,
            ).toBe(true);
          }
        });
      }
    }
  }
});

describe('placeholder codes convention (refresh-audit freshness skip)', () => {
  test('all-DEMO- frontmatter is a placeholder page; anything else is not', () => {
    const fm = (codes: string[]) => ['codes:', ...codes.map((c) => `  - code: ${c}`)].join('\n');
    expect(isPlaceholderCodesFrontmatter(fm([`${DEMO_CODE_PLACEHOLDER_PREFIX}XXXX`]))).toBe(true);
    expect(isPlaceholderCodesFrontmatter(fm([`"${DEMO_CODE_PLACEHOLDER_PREFIX}AAAA"`]))).toBe(true);
    // One real code among placeholders → the page deserves freshness attention.
    expect(isPlaceholderCodesFrontmatter(fm([`${DEMO_CODE_PLACEHOLDER_PREFIX}AAAA`, 'REAL-CODE']))).toBe(false);
    // No codes entries at all → not a placeholder page (never skip silently).
    expect(isPlaceholderCodesFrontmatter('title: Deals')).toBe(false);
    expect(DEMO_CODE_PLACEHOLDER_PREFIX).toBe('DEMO-');
  });
});

describe('coverNamesReferenced (preset demo covers survive with their articles)', () => {
  test('extracts cover filenames from frontmatter image values', () => {
    const src = [
      '---',
      "title: 'x'",
      "image: '../../../../assets/covers/en-codes-pixelpad-codes.png'",
      '---',
      'body mentions src/assets/covers/ja-codes-cloudnote-codes.png inline too',
    ].join('\n');
    const names = coverNamesReferenced([src]);
    expect(names.has('en-codes-pixelpad-codes.png')).toBe(true);
    expect(names.has('ja-codes-cloudnote-codes.png')).toBe(true);
    expect(names.size).toBe(2);
  });

  test('empty input → empty set (game-wiki fork clears every registered cover)', () => {
    expect(coverNamesReferenced([]).size).toBe(0);
    expect(coverNamesReferenced(['no covers here']).size).toBe(0);
  });
});
