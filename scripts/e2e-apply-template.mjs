#!/usr/bin/env node
/**
 * e2e-apply-template.mjs — real-mode E2E for the apply-template CLI.
 *
 * Run `pnpm test:e2e` (CI job `e2e-template` runs exactly this). Three flows,
 * all against throwaway copies of the COMMITTED tree (git archive HEAD):
 *
 *   Flow 1 — 18 answers, game-wiki (the pre-site-type legacy format):
 *     the historical full regression — CLI output shape, re-run safety,
 *     fork build + check-config + check-i18n, ad purity. Also pins the NEW
 *     registry layer from the game-wiki side: coupon-hub AND tutorial-hub
 *     demo articles (en + ja) must be cleared by a game-wiki init.
 *   Flow 2 — 19 answers, coupon-hub: preset demos kept for chosen locales
 *     and cleared for unselected ones (ja), nav labels rewritten to the
 *     Deals/Saving Guides/Tools semantics, build + check-config +
 *     check-i18n + check-links all green.
 *   Flow 3 — 19 answers, tutorial-hub: only the guides category, tutorial
 *     demos kept for en / cleared for ja, coupon demos gone, every demo
 *     internal link resolves (check-links) — the "only a real fork triggers
 *     it" bug class this E2E exists for (three shipped that way before).
 *
 * Why this exists: apply-template has zero vitest coverage of its real
 * (non-dry-run) mode, which the demo repo never exercises — three real-mode
 * bugs shipped through all eight gates unnoticed (PR #10 ENOENT crash; home-
 * template schema drift crashing the fork's first build; a false-positive
 * success message). Gates cannot catch this class; only driving the CLI
 * against a throwaway copy can.
 *
 * Env:
 *   PRESET=codes|guides  flow-1 homepage preset to drive (default: codes)
 *   KEEP=1               keep the scratch dirs for debugging
 *
 * Note: `git archive HEAD` exports the COMMITTED tree — commit your changes
 * before running this locally if you want them covered.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rootSiteConfig = readFileSync(join(root, 'src/config/site.ts'), 'utf8');
// Field-order independent on purpose: pinning name-before-domain would make
// this guard silently pass (exit 0) if site.ts ever reorders its fields.
const isDemoTemplate =
  /name:\s*['"]Anvil Quest Wiki['"]/.test(rootSiteConfig) &&
  /domain:\s*['"]anvil\.wiki['"]/.test(rootSiteConfig);
if (!isDemoTemplate) {
  console.log('ℹ️  Configured fork detected — demo conversion E2E is not applicable; skipping.');
  process.exit(0);
}
const preset = process.env.PRESET === 'guides' ? 'guides' : 'codes';
const keep = process.env.KEEP === '1';
const win = process.platform === 'win32';

let failed = false;
const fail = (msg) => {
  console.error(`❌ ${msg}`);
  failed = true;
};
const step = (msg) => console.log(`\n▶ ${msg}`);

// One archive per run, extracted into per-flow scratch dirs; every scratch is
// removed on exit (unless KEEP=1).
const scratches = [];
let templateTar = null;
process.on('exit', () => {
  if (keep) {
    console.log(`\nℹ️  KEEP=1 — ${scratches.length} scratch dir(s) kept:`);
    for (const s of scratches) console.log(`   ${s}`);
    return;
  }
  for (const s of scratches) rmSync(s, { recursive: true, force: true });
});

function newScratch() {
  const scratch = mkdtempSync(join(tmpdir(), 'anvilwiki-e2e-'));
  scratches.push(scratch);
  if (templateTar === null) {
    step(`Export template (git archive HEAD) → ${scratch}`);
    templateTar = execSync('git archive HEAD', { cwd: root, maxBuffer: 512 * 1024 * 1024 });
  } else {
    step(`Export template (git archive HEAD, cached) → ${scratch}`);
  }
  execSync('tar -xf -', { input: templateTar, cwd: scratch });
  return scratch;
}

function installDeps(scratch) {
  step('pnpm install in scratch copy');
  execSync('pnpm install --prefer-offline', { cwd: scratch, stdio: 'inherit', shell: win });
}

/** Drive the CLI via --answers (non-interactive, same ask/askBool path). */
function runCli(scratch, answersFile) {
  step(`apply-template real mode (--answers ${answersFile})`);
  const cli = spawnSync(
    'pnpm',
    ['apply-template', '--answers', answersFile],
    {
      cwd: scratch,
      encoding: 'utf8',
      shell: win,
      timeout: 5 * 60 * 1000,
    },
  );
  if (cli.stdout) console.log(cli.stdout);
  if (cli.status !== 0) {
    if (cli.stderr) console.error(cli.stderr);
    fail(`apply-template exited ${cli.status}${cli.error ? ` (${cli.error.message})` : ''}`);
    process.exit(1);
  }
  if (!/Base config complete/.test(cli.stdout)) {
    fail('CLI exited 0 but never reached its completion marker');
    process.exit(1);
  }
  if (/left over/.test((cli.stdout || '') + (cli.stderr || ''))) {
    fail('answers file has MORE entries than the CLI has prompts — prompt sequence drifted');
    process.exit(1);
  }
  return cli;
}

function buildAndGate(scratch, { checkLinks = false } = {}) {
  step("pnpm build (the fork's first build must succeed)");
  execSync('pnpm build', { cwd: scratch, stdio: 'inherit', shell: win });
  step("pnpm check-config (the fork's first CI run must be green)");
  execSync('pnpm check-config', { cwd: scratch, stdio: 'inherit', shell: win });
  step("pnpm check-i18n --strict-ui (the fork's first CI run must be green)");
  execSync('pnpm check-i18n --strict-ui', { cwd: scratch, stdio: 'inherit', shell: win });
  if (checkLinks) {
    step('pnpm check-links (preset demo internal links must all resolve in dist)');
    execSync('pnpm check-links', { cwd: scratch, stdio: 'inherit', shell: win });
  }
}

const expectAbsent = (scratch, paths, why) => {
  for (const p of paths) {
    if (existsSync(join(scratch, p))) fail(`${why}: ${p}`);
  }
};
const expectPresent = (scratch, paths, why) => {
  for (const p of paths) {
    if (!existsSync(join(scratch, p))) fail(`${why}: ${p}`);
  }
};

// Demo article inventories of the NON-default presets (mirror
// scripts/lib/site-presets.ts — the registry contract tests keep the two in
// sync upstream; these literals pin what a REAL fork init must do to them).
const COUPON_DEMO_FILES = [
  'en/codes/pixelpad-codes.mdx',
  'en/codes/cloudnote-codes.mdx',
  'en/guides/black-friday-deals-guide.mdx',
  'en/guides/saas-discount-stacking-guide.mdx',
  'en/items/pixelpad-design-tool.mdx',
  'en/items/cloudnote-notes-app.mdx',
  'ja/codes/pixelpad-codes.mdx',
  'ja/codes/cloudnote-codes.mdx',
  'ja/guides/black-friday-deals-guide.mdx',
  'ja/guides/saas-discount-stacking-guide.mdx',
  'ja/items/pixelpad-design-tool.mdx',
  'ja/items/cloudnote-notes-app.mdx',
];

// Registry lists are locale-relative (they mirror site-presets.ts), but the
// assertions check the real tree — every use must map through wikiPath or
// the check is vacuous: an unprefixed path always "passes" expectAbsent (the
// file never existed at scratch/en/…) and always "fails" expectPresent.
// (First real e2e run caught exactly that: flow 1's cross-preset assertion
// passed vacuously while flow 2/3 failed on genuinely-present files.)
const wikiPath = (p) => `src/content/wiki/${p}`;
const TUTORIAL_DEMO_FILES = [
  'en/guides/pick-your-niche-tutorial.mdx',
  'en/guides/build-site-with-ai-tutorial.mdx',
  'en/guides/content-workflow-tutorial.mdx',
  'en/guides/monetize-site-tutorial.mdx',
  'ja/guides/pick-your-niche-tutorial.mdx',
  'ja/guides/build-site-with-ai-tutorial.mdx',
  'ja/guides/content-workflow-tutorial.mdx',
  'ja/guides/monetize-site-tutorial.mdx',
];

const RECIPE_DEMO_FILES = [
  'en/recipes/classic-vanilla-sponge-cake.mdx',
  'en/recipes/banana-bread.mdx',
  'en/recipes/chocolate-chip-cookies.mdx',
  'en/recipes/fluffy-pancakes.mdx',
  'en/recipes/tomato-garlic-pasta.mdx',
  'en/recipes/roasted-pumpkin-soup.mdx',
  'ja/recipes/classic-vanilla-sponge-cake.mdx',
  'ja/recipes/banana-bread.mdx',
  'ja/recipes/chocolate-chip-cookies.mdx',
  'ja/recipes/fluffy-pancakes.mdx',
  'ja/recipes/tomato-garlic-pasta.mdx',
  'ja/recipes/roasted-pumpkin-soup.mdx',
];

// ===========================================================================
// Flow 1 — 18 answers, game-wiki: the legacy full regression.
// ===========================================================================

// 1. Export the committed template.
const scratch = newScratch();

// 2. Install (pnpm store is shared → warm cache makes this fast).
installDeps(scratch);

// 3. Drive the CLI via --answers: 18 prompts (the pre-site-type format),
//    all defaults except game name / domain / locales / categories /
//    clear-content / preset / proceed. This MUST keep working unchanged —
//    the zero-breaking red line of the site-type presets.
step(`apply-template real mode (preset=${preset}, 18 legacy answers)`);
const answers = [
  'Test Game', // Full game name
  '', // Short name (default)
  'testgame.pages.dev', // Domain
  '', // Tagline
  '', // Description
  '', // Legal notice
  '', // Official URL
  '#3b82f6', // Theme color
  '', // Platform
  '', // Developer
  '', // Genre
  '', // Release date
  'en,zh', // Locales
  'bosses,guides,codes', // Categories
  'y', // Clear demo content? YES
  preset === 'guides' ? '2' : '1', // Homepage preset
  '', // Remove landing? (default yes)
  'y', // Proceed? YES
];
writeFileSync(join(scratch, 'e2e-answers.json'), JSON.stringify(answers, null, 2));
const cli = runCli(scratch, 'e2e-answers.json');
// Legacy-compat note: an 18-answer file must say (on stderr) that the site
// type defaulted to game-wiki — the only observable format difference.
if (!/pre-site-type format/.test((cli.stdout || '') + (cli.stderr || ''))) {
  fail('18-answer file did not trigger the pre-site-type compatibility note');
}

// 4. Assert the output shape — the exact fields the home components render.
step('Assert output shape');
for (const p of ['src/config/landing.ts', 'src/config/landing-types.ts', 'src/config/landing-shared.ts', 'src/config/landing-en.ts', 'src/config/landing-zh.ts', 'src/config/landing-templates.ts', 'src/components/landing', 'src/pages/landing.astro', 'src/pages/landing', 'src/pages/zh/landing.astro', 'src/pages/zh/landing', 'src/pages/landing/tutorials.astro', 'src/pages/landing/tutorials', 'src/pages/zh/landing/tutorials.astro', 'src/pages/zh/landing/tutorials', 'src/content/tutorials', 'src/pages/demo.astro', 'public/_redirects', 'public/images/showcase', 'public/images/wechat-qr.jpg']) {
  if (existsSync(join(scratch, p))) fail(`landing path still present after removal: ${p}`);
}
// Positive tripwire for the demo root gateway: index.astro statically imports
// this component, so it must SURVIVE every deletion channel — if it ever goes
// missing here, the fork build below would fail to resolve the import (P0).
if (!existsSync(join(scratch, 'src/components/RootGateway.astro'))) {
  fail('src/components/RootGateway.astro was deleted — index.astro statically imports it at build time, the fork build would fail to resolve the import (never list it in LANDING_PATHS/setup.yml)');
}
// Upstream's own search-console token must not ride along into forks
// (DEMO_PUBLIC_FILES, cleared by clearDemoAssets). Vacuous until the file is
// committed to the tree git archive snapshots — meaningful from then on.
if (existsSync(join(scratch, 'public/google8362d9398114b66b.html'))) {
  fail('demo search-console verification file still present — DEMO_PUBLIC_FILES was not cleared');
}
// Demo Adsterra unit pages (public/ads/*.html) carry the DEMO's ad-unit keys —
// config, not template content (DEMO_PUBLIC_FILES). Vacuous until committed.
for (const unit of ['sticky-320x50', 'sidebar-300x250', 'sidebar-160x300', 'sidebar-160x600', 'incontent-728x90', 'native-banner']) {
  if (existsSync(join(scratch, 'public', 'ads', `${unit}.html`))) {
    fail(`demo ad unit page still present after fork init: public/ads/${unit}.html — DEMO_PUBLIC_FILES was not cleared`);
  }
}
// Site-type registry layer, game-wiki side: a game-wiki fork init clears the
// coupon-hub AND tutorial-hub demo articles everywhere (cross-preset, both
// locales) — no orphan content for categories the narrowed nav no longer has.
step('Assert site-preset demos cleared by the game-wiki init');
expectAbsent(
  scratch,
  [...COUPON_DEMO_FILES, ...TUTORIAL_DEMO_FILES].map(wikiPath),
  'preset demo article still present after a game-wiki fork init — SITE_PRESETS registry layer did not clear it',
);
// ...and the historical content-marker layer is untouched (Anvil Quest demos).
expectAbsent(
  scratch,
  ['src/content/wiki/en/bosses/emberfang.mdx', 'src/content/wiki/en/codes/all-codes.mdx'],
  'Anvil Quest demo article still present — content-marker clearing regressed',
);
// Audit round 21 tripwires: the landing-link flip must have happened (a
// silent no-op leaves fork nav pointing at the deleted /landing/ routes),
// and the retired pre-env demo IndexNow key file must never ride along
// (DEMO_PUBLIC_FILES; vacuous while the file stays out of the tree —
// meaningful if anyone ever re-commits it).
const projectTs = readFileSync(join(scratch, 'src/config/project.ts'), 'utf8');
if (projectTs.includes('landingLinkEnabled = true')) {
  fail('landingLinkEnabled still true after landing removal — the flip went silently missing');
}
if (existsSync(join(scratch, 'public', '39a73e7c4264b418baa6757d20446910.txt'))) {
  fail('retired demo IndexNow key file still present — DEMO_PUBLIC_FILES regression');
}
const indexNowKeyPath = join(scratch, '.indexnow-key');
if (!existsSync(indexNowKeyPath)) {
  fail('.indexnow-key was not generated by apply-template');
}
const indexNowKey = readFileSync(indexNowKeyPath, 'utf8').trim();
if (!/^[a-f0-9]{64}$/.test(indexNowKey)) {
  fail('.indexnow-key is not a generated 64-char hex key');
}
const en = JSON.parse(readFileSync(join(scratch, 'src/locales/en.json'), 'utf8'));
const checks = [
  ['home.meta.title is a string', typeof en.home?.meta?.title === 'string'],
  ['home.meta.description is a string', typeof en.home?.meta?.description === 'string'],
  ['hero.ctaPrimary is a string (components render it as link text)', typeof en.home?.hero?.ctaPrimary === 'string'],
  ['hero.ctaSecondary is a string', typeof en.home?.hero?.ctaSecondary === 'string'],
  ['closingCta.primary is a string', typeof en.home?.closingCta?.primary === 'string'],
  ['start.cards[].number present (QuickStart renders the number badge)', typeof en.home?.start?.cards?.[0]?.number === 'string'],
  ['nav labels auto-filled for chosen categories (3-place rule)', ['bosses', 'guides', 'codes'].every((k) => typeof en.nav?.[k] === 'string')],
  ['game-wiki nav labels keep the TitleCase semantics', en.nav?.codes === 'Codes'],
  ['overview entries auto-filled for chosen categories', ['bosses', 'guides', 'codes'].every((k) => typeof en.overview?.[k]?.overviewTitle === 'string')],
  ['zh locale nav labels auto-filled too (check-config checks every locale)', (() => {
    const zh = JSON.parse(readFileSync(join(scratch, 'src/locales/zh.json'), 'utf8'));
    return ['bosses', 'guides', 'codes'].every((k) => typeof zh.nav?.[k] === 'string');
  })()],
  ['site.description makes no community/update promise it cannot keep', !/by the community|updated daily|tested daily/i.test(en.site?.description ?? '')],
  ['wrangler.toml has exactly one [vars] section (line-anchored rewrite)', (readFileSync(join(scratch, 'wrangler.toml'), 'utf8').match(/^\[vars\]/gm) || []).length === 1],
  ['wrangler.toml carries no demo Giscus VALUES', !readFileSync(join(scratch, 'wrangler.toml'), 'utf8').includes('PUBLIC_GISCUS_REPO = "PNGTRID')],
  ['wrangler.toml demo-intro warning block removed', !readFileSync(join(scratch, 'wrangler.toml'), 'utf8').includes('FORKERS READ THIS FIRST')],
  ['wrangler.toml carries no demo Adsterra KEYS (slot lines commented or absent — demo unit keys are config)', !/^\s*PUBLIC_ADSTERRA_SLOT_\w+ += +"[0-9a-f]{16,}"/m.test(readFileSync(join(scratch, 'wrangler.toml'), 'utf8'))],
];
for (const [name, ok] of checks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) fail(name);
}
if (failed) process.exit(1);

// 4.5 Re-run safety (2026-09-01 audit P1: apply-template used to delete ANY
// unchosen locale — a re-run destroyed locales the user had added). Run 1
// must have removed the demo's unchosen ja.json; a user-created ko.json must
// survive run 2 with a loud warning. removeLandingPage/clearDemoContent/
// wrangler rewrite are all idempotent, so run 2 must exit 0 and complete.
if (existsSync(join(scratch, 'src/locales/ja.json'))) {
  fail('demo ja.json still present — unchosen demo locale was not removed on run 1');
}
writeFileSync(join(scratch, 'src/locales/ko.json'), JSON.stringify({ nav: { home: '홈' } }, null, 2), 'utf8');
// A demo-NAMED locale whose content was already rewritten for the forker's own
// game (a previous run chose ja) must also survive: auto-delete is content-aware
// (site.name still demo?) — filename alone must not decide (24h-audit P2 follow-up).
writeFileSync(
  join(scratch, 'src/locales/ja.json'),
  JSON.stringify({ site: { name: 'My Game Wiki' }, nav: { home: 'ホーム' } }, null, 2),
  'utf8',
);
// Content-aware demo-article clearing (v2.25.1): a user-authored article must
// survive the re-run; a demo-authored one must go. The scaffold articles run 1
// created (no demo-game mentions) are the forker's now.
const userArticle = join(scratch, 'src/content/wiki/en/bosses/my-own-boss.mdx');
mkdirSync(dirname(userArticle), { recursive: true });
writeFileSync(
  userArticle,
  `---
title: "My Own Boss Guide"
description: "A user-authored article that must survive a template init re-run — content-aware demo clearing keeps everything the forker wrote."
category: "bosses"
date: 2026-09-15
draft: true
tags: []
---

## My own boss

Written by the forker. No demo game mentioned here.
`,
  'utf8',
);
const demoLeftover = join(scratch, 'src/content/wiki/en/bosses/demo-leftover.mdx');
writeFileSync(
  demoLeftover,
  `---
title: "Anvil Quest Boss Leftover"
description: "Mentions Anvil Quest so content-aware clearing classifies it as demo content and removes it on the re-run."
category: "bosses"
date: 2026-09-15
draft: true
tags: []
---

## Anvil Quest strategy

Demo leftover content.
`,
  'utf8',
);
step('apply-template re-run (idempotent, keeps user locales)');
const rerun = spawnSync(
  'pnpm',
  ['apply-template', '--answers', 'e2e-answers.json'],
  {
    cwd: scratch,
    encoding: 'utf8',
    shell: win,
    timeout: 5 * 60 * 1000,
  },
);
if (rerun.status !== 0) {
  if (rerun.stderr) console.error(rerun.stderr);
  fail(`apply-template RE-RUN exited ${rerun.status}${rerun.error ? ` (${rerun.error.message})` : ''}`);
  process.exit(1);
}
if (!/Base config complete/.test(rerun.stdout || '')) {
  fail('re-run exited 0 but never reached its completion marker');
  process.exit(1);
}
if (/left over/.test((rerun.stdout || '') + (rerun.stderr || ''))) {
  fail('re-run reports leftover answers — prompt sequence drifted');
}
// ⚠️ CLI warnings go to stderr (console.warn), completion markers to stdout.
if (!/not in your chosen locales/.test((rerun.stdout || '') + (rerun.stderr || ''))) {
  fail('re-run did not warn about the user-created locale');
}
if (!existsSync(join(scratch, 'src/locales/ko.json'))) {
  fail('re-run DELETED src/locales/ko.json — user locale destroyed (audit P1 regression)');
}
if (!existsSync(join(scratch, 'src/locales/ja.json'))) {
  fail('re-run DELETED the rebranded ja.json — content-aware check regressed to filename-only');
}
if (!/My Game Wiki/.test(readFileSync(join(scratch, 'src/locales/ja.json'), 'utf8'))) {
  fail('re-run overwrote the rebranded ja.json site.name with demo/placeholder content');
}
// Content-aware article clearing: user work survives, demo content goes.
if (!existsSync(userArticle)) {
  fail('re-run DELETED the user-authored article — content-aware demo clearing regressed to blanket deletion');
}
if (existsSync(demoLeftover)) {
  fail('re-run KEPT a demo-authored article — content-aware demo clearing did not classify it');
}
if (!/NOT demo content/.test((rerun.stdout || '') + (rerun.stderr || ''))) {
  fail('re-run did not warn about kept non-demo articles');
}
if (readFileSync(indexNowKeyPath, 'utf8').trim() !== indexNowKey) {
  fail('apply-template re-run rotated .indexnow-key — stable site identity was lost');
}
console.log('  ✅ user-authored article survived the re-run; demo-authored leftover was cleared');
console.log('  ✅ .indexnow-key survived the re-run unchanged');
// Heed the warning like a user would, so the gates below see a clean state.
rmSync(join(scratch, 'src/locales/ko.json'));
rmSync(join(scratch, 'src/locales/ja.json'));

// 5. The fork's first build must succeed.
step("pnpm build (the fork's first build must succeed)");
execSync('pnpm build', { cwd: scratch, stdio: 'inherit', shell: win });

// 5.5 The fork's first check-config run must be green — a fresh fork with a
// red consistency gate is a day-one trap (empty nav broke this in v2.6.0).
step("pnpm check-config (the fork's first CI run must be green)");
execSync('pnpm check-config', { cwd: scratch, stdio: 'inherit', shell: win });

// 5.6 The fork's first check-i18n --strict-ui run must be green too — a
// brand-new locale JSON written from the minimal skeleton used to miss the
// $schema/search/shared UI namespaces and redden CI on day one. The answers
// above choose zh with no pre-existing file, so this exercises the
// fresh-locale clone path end to end.
step("pnpm check-i18n --strict-ui (the fork's first CI run must be green)");
execSync('pnpm check-i18n --strict-ui', { cwd: scratch, stdio: 'inherit', shell: win });

step('Assert built pages');
const builtIndexNowKey = join(scratch, 'dist', `${indexNowKey}.txt`);
if (!existsSync(builtIndexNowKey) || readFileSync(builtIndexNowKey, 'utf8').trim() !== indexNowKey) {
  fail('postbuild did not emit the ownership file from .indexnow-key');
}
console.log('  ✅ postbuild emitted the stable IndexNow ownership file');
for (const p of ['dist/index.html', 'dist/zh/index.html']) {
  const html = readFileSync(join(scratch, p), 'utf8');
  if (!html.includes('<title>Test Game Wiki')) fail(`${p}: homepage <title> missing`);
  if (html.includes('object Object')) fail(`${p}: an object was rendered as [object Object]`);
}

// Ad purity end-to-end: every ad slot is env-gated (empty = renders nothing)
// and the demo's unit pages are fork-deleted, so a fresh fork's build must
// contain ZERO ad iframes — a single hit means demo config leaked into the
// template or a slot lost its env gate.
step('Assert zero ad iframes in the fork build');
const adRefs = [];
(function walkAds(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkAds(p);
    else if (e.name.endsWith('.html') && readFileSync(p, 'utf8').includes('src="/ads/')) adRefs.push(p);
  }
})(join(scratch, 'dist'));
if (adRefs.length) fail(`ad iframes rendered in the fork build (template must ship ad-free): ${adRefs.join(', ')}`);
console.log('  ✅ no ad iframes anywhere in dist');
if (failed) process.exit(1);
console.log('\n✅ Flow 1 (18 legacy answers, game-wiki) passed');

// ===========================================================================
// Flow 2 — 19 answers, coupon-hub: the first new site type end to end.
// ===========================================================================

const couponScratch = newScratch();
installDeps(couponScratch);
const couponAnswers = [
  'Test Deals', // Full site/game name
  '', // Short name (default)
  'testdeals.pages.dev', // Domain
  '', // Tagline
  '', // Description
  '', // Legal notice
  '', // Official URL
  '#3b82f6', // Theme color
  '', // Platform
  '', // Developer
  '', // Genre
  '', // Release date
  'en,zh', // Locales (ja NOT chosen — ja demos must clear)
  'codes,guides,items', // Categories (the coupon-hub set)
  'y', // Clear demo content? YES
  '1', // Homepage preset (codes → coupon hot-deals home)
  '', // Remove landing? (default yes)
  '2', // Site type: coupon-hub
  'y', // Proceed? YES
];
writeFileSync(join(couponScratch, 'e2e-answers.json'), JSON.stringify(couponAnswers, null, 2));
runCli(couponScratch, 'e2e-answers.json');

step('Assert coupon-hub fork shape');
// The chosen preset's demos survive as starting content — but ONLY for the
// chosen locales: the ja mirror articles must be gone (locale dimension).
expectPresent(
  couponScratch,
  COUPON_DEMO_FILES.filter((p) => p.startsWith('en/')).map(wikiPath),
  'coupon-hub demo missing after its own init — the chosen preset starting content was not kept',
);
expectAbsent(
  couponScratch,
  [
    ...COUPON_DEMO_FILES.filter((p) => p.startsWith('ja/')).map(wikiPath),
    ...TUTORIAL_DEMO_FILES.map(wikiPath), // other preset → cleared regardless of locale
    'src/content/wiki/en/bosses/emberfang.mdx', // Anvil Quest → content rule
  ],
  'unexpected demo residue in the coupon-hub fork',
);
// The narrowed category set means the bosses dir must be gone entirely.
if (existsSync(join(couponScratch, 'src/content/wiki/en/bosses'))) {
  fail('coupon-hub fork still has an en/bosses dir — bosses directory not cleared');
}
const couponEn = JSON.parse(readFileSync(join(couponScratch, 'src/locales/en.json'), 'utf8'));
const couponChecks = [
  ['nav labels follow the coupon-hub semantics (Deals/Saving Guides/Tools)', couponEn.nav?.codes === 'Deals' && couponEn.nav?.guides === 'Saving Guides' && couponEn.nav?.items === 'Tools'],
  ['home badge-list highlight is the CODE-PLACEHOLDER watermark', couponEn.home?.explore?.modules?.some((m) => m?.displayType === 'badge-list' && m?.highlights?.[0]?.label === 'CODE-PLACEHOLDER') === true],
  // Placeholder codes live in the demo ARTICLES, never in the locale JSON —
  // a fabricated-looking code in en.json would trip codes-consistency on the
  // template repo and lies to fork visitors.
  ['locale JSON carries no DEMO- placeholder codes', !/DEMO-/.test(JSON.stringify(couponEn))],
  ['game-wiki nav keys are gone (narrowed category set)', couponEn.nav?.bosses === undefined],
];
for (const [name, ok] of couponChecks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) fail(name);
}
if (failed) process.exit(1);
buildAndGate(couponScratch, { checkLinks: true });
console.log('\n✅ Flow 2 (19 answers, coupon-hub) passed');

// ===========================================================================
// Flow 3 — 19 answers, tutorial-hub: single-category fork, link integrity.
// ===========================================================================

const tutorialScratch = newScratch();
installDeps(tutorialScratch);
const tutorialAnswers = [
  'Test Tutorials', // Full site/game name
  '', // Short name (default)
  'testtutorials.pages.dev', // Domain
  '', // Tagline
  '', // Description
  '', // Legal notice
  '', // Official URL
  '#3b82f6', // Theme color
  '', // Platform
  '', // Developer
  '', // Genre
  '', // Release date
  'en,zh', // Locales (ja NOT chosen — ja demos must clear)
  'guides', // Categories (tutorial-hub keeps guides only)
  'y', // Clear demo content? YES
  '2', // Homepage preset (guides → tutorial home)
  '', // Remove landing? (default yes)
  '3', // Site type: tutorial-hub
  'y', // Proceed? YES
];
writeFileSync(join(tutorialScratch, 'e2e-answers.json'), JSON.stringify(tutorialAnswers, null, 2));
runCli(tutorialScratch, 'e2e-answers.json');

step('Assert tutorial-hub fork shape');
expectPresent(
  tutorialScratch,
  TUTORIAL_DEMO_FILES.filter((p) => p.startsWith('en/')).map(wikiPath),
  'tutorial-hub demo missing after its own init — the chosen preset starting content was not kept',
);
expectAbsent(
  tutorialScratch,
  [
    ...TUTORIAL_DEMO_FILES.filter((p) => p.startsWith('ja/')).map(wikiPath),
    ...COUPON_DEMO_FILES.map(wikiPath), // other preset → cleared regardless of locale
    'src/content/wiki/en/bosses/emberfang.mdx', // Anvil Quest → content rule
    'src/content/wiki/en/items', // narrowed set: guides only
    'src/content/wiki/en/codes',
  ],
  'unexpected demo residue in the tutorial-hub fork',
);
const tutorialEn = JSON.parse(readFileSync(join(tutorialScratch, 'src/locales/en.json'), 'utf8'));
const tutorialChecks = [
  ['guides nav label follows the tutorial-hub semantics', tutorialEn.nav?.guides === 'Tutorials'],
  ['narrowed set: no codes/items/bosses nav keys', tutorialEn.nav?.codes === undefined && tutorialEn.nav?.items === undefined && tutorialEn.nav?.bosses === undefined],
  ['home is the tutorial steps module', tutorialEn.home?.explore?.modules?.[0]?.displayType === 'steps'],
];
for (const [name, ok] of tutorialChecks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) fail(name);
}
if (failed) process.exit(1);
// check-links is the real fork-side gate for the demo internal-link whitelist:
// every /guides/... link the tutorials make must resolve in dist, and a stray
// /codes or /landing link would exit non-zero right here.
buildAndGate(tutorialScratch, { checkLinks: true });
console.log('\n✅ Flow 3 (19 answers, tutorial-hub) passed');

// ===========================================================================
// Flow 4 — 19 answers, recipe-hub: preset-only category (recipes) + tool
// frontmatter survival, fork link integrity.
// ===========================================================================
const recipeScratch = newScratch();
installDeps(recipeScratch);
const recipeAnswers = [
  'Test Recipes', // Full site/game name
  '', // Short name (default)
  'testrecipes.pages.dev', // Domain
  '', // Tagline
  '', // Description
  '', // Legal notice
  '', // Official URL
  '#3b82f6', // Theme color
  '', // Platform
  '', // Developer
  '', // Genre
  '', // Release date
  'en,zh', // Locales (ja NOT chosen — ja demos must clear)
  'recipes,guides,items', // Categories (the recipe-hub set)
  'y', // Clear demo content? YES
  '1', // Homepage preset (codes → recipe home)
  '', // Remove landing? (default yes)
  '4', // Site type: recipe-hub
  'y', // Proceed? YES
];
writeFileSync(join(recipeScratch, 'e2e-answers.json'), JSON.stringify(recipeAnswers, null, 2));
runCli(recipeScratch, 'e2e-answers.json');

step('Assert recipe-hub fork shape');
// The chosen preset's demos survive for chosen locales — en recipe demos stay
// (they carry the recipe frontmatter and cover references the build needs).
expectPresent(
  recipeScratch,
  RECIPE_DEMO_FILES.filter((p) => p.startsWith('en/')).map(wikiPath),
  'recipe-hub demo missing after its own init — preset starting content was not kept',
);
expectAbsent(
  recipeScratch,
  [
    ...RECIPE_DEMO_FILES.filter((p) => p.startsWith('ja/')).map(wikiPath),
    ...COUPON_DEMO_FILES.map(wikiPath), // other presets → cleared
    ...TUTORIAL_DEMO_FILES.map(wikiPath),
    'src/content/wiki/en/bosses/emberfang.mdx', // Anvil Quest → content rule
  ],
  'unexpected demo residue in the recipe-hub fork',
);
const recipeEn = JSON.parse(readFileSync(join(recipeScratch, 'src/locales/en.json'), 'utf8'));
const recipeChecks = [
  ['recipes nav label follows the recipe-hub semantics', recipeEn.nav?.recipes === 'Recipes'],
  ['no game-wiki nav keys remain', recipeEn.nav?.bosses === undefined && recipeEn.nav?.codes === undefined],
];
for (const [name, ok] of recipeChecks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) fail(name);
}
if (failed) process.exit(1);
buildAndGate(recipeScratch, { checkLinks: true });
console.log('\n✅ Flow 4 (19 answers, recipe-hub) passed');

console.log('\n✅ E2E passed — apply-template real mode produces buildable sites for all four flows');
