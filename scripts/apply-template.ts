/**
 * apply-template.ts
 *
 * Interactive CLI that automates the base config changes described in
 * docs/apply-template.md (site.ts, navigation.ts, globals.css, routing.ts).
 *
 *   pnpm apply-template                   interactive: prompts for game metadata, theme color,
 *                               locales, and categories; rewrites the config files
 *                               (site.ts, navigation.ts, globals.css, routing.ts,
 *                               ui.ts, locales/*.json, manifest.json), clears
 *                               demo content (src/content/wiki/* MDX), and removes
 *                               the project landing page + in-site docs center
 *                               (/landing, /landing/docs) and its assets
 *                               (public/images/showcase/, wechat QR) — not
 *                               needed by fork users; docs/handbook markdown
 *                               is kept as repo docs.
 *   pnpm apply-template --dry-run         print every planned change, write nothing.
 *   pnpm apply-template --no-clear-content  keep demo MDX files in place.
 *   pnpm apply-template --keep-landing      keep the project landing page (/landing).
 *   pnpm apply-template --answers answers.json  non-interactive: JSON array of
 *                               raw answers, one per prompt in order ("" = enter
 *                               = default). For CI and scripted runs.
 *
 * What this does NOT do (left for the user, see docs/apply-template.md):
 *   - Homepage modules (home.hero / start / explore / faq in locales)
 *   - Article MDX + nav/overview labels per category
 *   - Translation of non-English locale JSON
 *   - favicon / hero image files (binary assets, user-provided)
 *
 * Conventions match scripts/new-post.ts: only node builtins, LinePrompt
 * (scripts/lib/prompt.ts) for input, regex-read of config files,
 * emoji-prefixed console output.
 */

import * as fs from 'node:fs';
import { todayIso } from './lib/today';
import { hexToHsl as hexToHslPure, hslToHex } from '~/lib/covers';
import * as path from 'node:path';
import { createLinePrompt, type LinePrompt } from './lib/prompt';
import { containsControlChar } from './lib/delimited';
import { walkDirs, walkFiles } from './lib/walk';
import {
  DEMO_ARTICLE_IMAGES,
  DEMO_COVERS,
  DEMO_GAME_NAMES,
  DEMO_GALLERY_IMAGES,
  DEMO_LOCALES,
  DEMO_PUBLIC_FILES,
  isDemoPublicFileContent,
  buildLocaleLabels,
  buildUiImports,
  buildUiMessagesEntries,
  classifyWikiArticles,
  isDemoLocaleContent,
  isDemoSiteTsIdentity,
  isLocaleCode,
  parseSiteTsIdentity,
  rerunPromptDefaults,
  rewriteLocaleJson,
  rewriteSiteTs as rewriteSiteTsBlock,
  rewriteWranglerVars,
  slugify,
  tsEscape,
  UI_IMPORT_BLOCK_RE,
  type SkinInput,
} from './lib/apply-rewrites';

const ROOT = process.cwd();
const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run') || ARGS.includes('-n');
const KEEP_CONTENT = ARGS.includes('--no-clear-content');
const KEEP_LANDING = ARGS.includes('--keep-landing');

// --answers <file> (or --answers=<file>): non-interactive mode for CI and
// scripted runs. The file is a JSON array of raw answers, one per prompt, in
// the exact order the CLI asks them ("" = press enter, i.e. the default).
// Walks the SAME ask/askBool code path — only the answer source changes.
// Parsed inside main() (loadScriptedAnswers), not at module load: a missing
// or malformed file must surface as the CLI's friendly ❌ + guidance instead
// of an unhandled top-level stack trace.
const answersIdx = ARGS.indexOf('--answers');
const ANSWERS_FILE =
  answersIdx >= 0 ? ARGS[answersIdx + 1] : ARGS.find((a) => a.startsWith('--answers='))?.split('=').slice(1).join('=');
let scripted: string[] | null = null;

/**
 * Load the --answers file into the module-level `scripted` queue. Called at
 * the very start of main(), before any prompt or file write.
 */
function loadScriptedAnswers(): void {
  if (!ANSWERS_FILE) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(path.resolve(ROOT, ANSWERS_FILE), 'utf8'));
  } catch (err) {
    console.error(
      `❌ Could not read the --answers file "${ANSWERS_FILE}": ${err instanceof Error ? err.message : err}`,
    );
    console.error(
      '   Expected a JSON file holding an ARRAY OF STRINGS — one entry per prompt, in order ("" = press enter).',
    );
    process.exit(1);
  }
  if (!Array.isArray(parsed) || parsed.some((a) => typeof a !== 'string')) {
    console.error('❌ --answers file must be a JSON array of strings (one per prompt, in order).');
    process.exit(1);
  }
  scripted = parsed as string[];
}

/**
 * Consume the next scripted answer. Empty string means "pressed enter" —
 * ask/askBool apply their own fallbacks, so return the raw value.
 */
function takeScriptedAnswer(question: string): string {
  if (!scripted || scripted.length === 0) {
    console.error(`❌ Ran out of scripted answers at prompt: "${question}" — the CLI has more prompts than the answers file has entries.`);
    process.exit(1);
  }
  const answer = scripted.shift() as string;
  console.log(`${question}: ${answer === '' ? '(enter)' : answer}`);
  return answer.trim();
}

// Leftover answers mean the file no longer matches the prompt sequence (a
// prompt was added or removed upstream) — warn instead of failing, but make
// it impossible to miss.
function warnOnLeftoverAnswers(): void {
  if (scripted && scripted.length > 0) {
    console.warn(`⚠️  ${scripted.length} scripted answer(s) left over — the answers file has MORE entries than the CLI has prompts. Update the file to match the prompt order.`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REL = (p: string) => path.relative(ROOT, p);
const read = (p: string) => fs.readFileSync(path.resolve(ROOT, p), 'utf8');

/**
 * Atomic write: same-directory temp file + rename. A process killed mid-write
 * (Ctrl-C, CI timeout) leaves a `.<name>.tmp` breadcrumb, never a truncated
 * site.ts / wrangler.toml / locale JSON — same pattern sync-codes.ts uses for
 * MDX pages. rename within one directory is atomic on POSIX and Windows.
 */
function writeAtomic(target: string, content: string): void {
  const abs = path.resolve(ROOT, target);
  const tmp = path.join(path.dirname(abs), `.${path.basename(abs)}.tmp`);
  try {
    fs.writeFileSync(tmp, content, 'utf8');
    fs.renameSync(tmp, abs);
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      // best-effort cleanup — the original error matters more
    }
    throw err;
  }
}

const write = (p: string, content: string) => {
  if (DRY_RUN) {
    console.log(`   ${dim('~')} would write ${REL(p)}`);
    return;
  }
  writeAtomic(p, content);
};

/** #rgb/#rrggbb → HSL with the CLI's friendly validation over the shared lib helper. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = hexToHslPure(hex);
  if (!c) {
    console.error(`❌ Invalid hex color "${hex}". Expected #rgb or #rrggbb.`);
    process.exit(1);
  }
  return c;
}

const hslStr = (c: { h: number; s: number; l: number }, lOffset: number) =>
  `${c.h} ${c.s}% ${Math.max(0, Math.min(100, c.l + lOffset))}%`;

/** Dim a string for dry-run output (ANSI escape; no chalk dependency). */
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

async function ask(rl: LinePrompt, question: string, fallback?: string): Promise<string> {
  const suffix = fallback !== undefined ? ` [${fallback}]: ` : ': ';
  const answer = scripted
    ? takeScriptedAnswer(question)
    : (await rl.ask(question + suffix)).trim();
  const value = answer || (fallback ?? '');
  // Newline/control characters cannot be written into site.ts / wrangler.toml
  // string literals without corrupting them. Interactive TTY input can't carry
  // them (line-based), but a --answers JSON entry can — reject at the intake
  // with the offending question named, before anything is written.
  if (containsControlChar(value)) {
    console.error(
      `❌ The answer for "${question}" contains a newline/control character — not valid in generated config files. Remove it and re-run.`,
    );
    process.exit(1);
  }
  return value;
}

async function askBool(rl: LinePrompt, question: string, fallback = false): Promise<boolean> {
  const answer = scripted
    ? takeScriptedAnswer(question)
    : (await rl.ask(`${question} [${fallback ? 'Y/n' : 'y/N'}]: `)).trim().toLowerCase();
  if (!answer) return fallback;
  return answer === 'y' || answer === 'yes';
}

// ---------------------------------------------------------------------------
// Rewriters
// ---------------------------------------------------------------------------

function rewriteSiteTs(input: SkinInput): string {
  // Rewrite the `site` object literal only. Everything else in the file stays.
  // Pure block rewrite lives in lib/apply-rewrites.ts (escaping + $-safe
  // function replacer, unit-tested); this wrapper owns the IO + failure gate.
  const filePath = 'src/config/site.ts';
  const rewritten = rewriteSiteTsBlock(read(filePath), input);
  if (rewritten === null) {
    console.error(`❌ Could not find site object in ${filePath}. Aborting (file untouched).`);
    process.exit(1);
  }
  return rewritten;
}

function rewriteNavigationTs(input: SkinInput): string {
  const filePath = 'src/config/navigation.ts';
  const src = read(filePath);
  const items = input.categories
    .map(
      (c, i) =>
        `  { key: '${c.key}', path: '/${c.key}', icon: '${c.icon}', isContentType: true, order: ${i + 1} }`,
    )
    .join(',\n');
  const newArray = `export const NAVIGATION_CONFIG: NavigationItem[] = [\n${items},\n];`;
  const navRe = /export const NAVIGATION_CONFIG: NavigationItem\[\] = \[[\s\S]*?\];/;
  if (!navRe.test(src)) {
    console.error(`❌ Could not find NAVIGATION_CONFIG in ${filePath}. Aborting.`);
    process.exit(1);
  }
  // Function replacer everywhere: string-mode replace would expand `$&`-style
  // sequences from user input into the rewritten file.
  return src.replace(navRe, () => newArray);
}

function rewriteGlobalsCss(input: SkinInput): string {
  const filePath = 'src/styles/globals.css';
  const src = read(filePath);
  const c = hexToHsl(input.themeHex);
  // Light: full saturation, l=52%. Light variant: +10% lightness.
  // Dark: -5% lightness, -5% saturation. Dark-light: dark + 10%.
  const lightMain = hslStr(c, 0);
  const lightAlt = hslStr(c, 10);
  const darkMain = `${c.h} ${Math.max(0, c.s - 5)}% ${Math.max(0, c.l - 4)}%`;
  const darkAlt = `${c.h} ${Math.max(0, c.s - 5)}% ${Math.max(0, c.l - 4 + 10)}%`;

  // Replace ONLY the 4 --brand / --brand-light value lines, line-wise, so the
  // rewrite still works if the user has added custom variables or changed
  // indentation inside :root / .dark (previous whole-block regex broke then).
  const lines = src.split('\n');
  let block: 'root' | 'dark' | null = null;
  let replaced = 0;
  const out = lines.map((line) => {
    if (/^\s*:root\s*\{/.test(line)) block = 'root';
    else if (/^\s*\.dark\s*\{/.test(line)) block = 'dark';
    else if (block && /^\s*\}/.test(line)) block = null;
    else if (block === 'root' && /^\s*--brand:/.test(line)) {
      replaced++;
      return line.replace(/(--brand:\s*)[^;]+;/, `$1${lightMain};`);
    } else if (block === 'root' && /^\s*--brand-light:/.test(line)) {
      replaced++;
      return line.replace(/(--brand-light:\s*)[^;]+;/, `$1${lightAlt};`);
    } else if (block === 'root' && /^\s*--brand-h:/.test(line)) {
      replaced++;
      return line.replace(/(--brand-h:\s*)[^;]+;/, `$1${c.h};`);
    } else if (block === 'root' && /^\s*--brand-s:/.test(line)) {
      replaced++;
      return line.replace(/(--brand-s:\s*)[^;]+;/, `$1${c.s}%;`);
    } else if (block === 'dark' && /^\s*--brand:/.test(line)) {
      replaced++;
      return line.replace(/(--brand:\s*)[^;]+;/, `$1${darkMain};`);
    } else if (block === 'dark' && /^\s*--brand-light:/.test(line)) {
      replaced++;
      return line.replace(/(--brand-light:\s*)[^;]+;/, `$1${darkAlt};`);
    } else if (block === 'dark' && /^\s*--brand-h:/.test(line)) {
      replaced++;
      return line.replace(/(--brand-h:\s*)[^;]+;/, `$1${c.h};`);
    } else if (block === 'dark' && /^\s*--brand-s:/.test(line)) {
      replaced++;
      return line.replace(/(--brand-s:\s*)[^;]+;/, `$1${Math.max(0, c.s - 5)}%;`);
    }
    return line;
  });
  if (replaced < 6) {
    console.error(
      `❌ Expected 6+ --brand/--brand-light/--brand-h/--brand-s lines in ${filePath}, found ${replaced}. Aborting.`,
    );
    process.exit(1);
  }
  return out.join('\n');
}

function rewriteRoutingTs(input: SkinInput): string {
  const filePath = 'src/i18n/routing.ts';
  const src = read(filePath);
  // Escape for a single-quoted TS literal: locale keys come from user input
  // (slugify's `|| raw` fallback can pass unusual characters through).
  const ts = tsEscape;
  const locs = input.locales.map((l) => `'${ts(l)}'`).join(', ');
  const newArray = `export const locales = [${locs}] as const;`;
  // Build LOCALE_LABELS with English defaults for unknown locales. Hyphen
  // locales (zh-tw) get quoted keys — a bare `zh-tw:` parses as subtraction.
  const labels = buildLocaleLabels(input.locales);
  const newLabels = `export const LOCALE_LABELS: Record<Locale, string> = {\n${labels},\n};`;
  const localesRe = /export const locales = \[[\s\S]*?\] as const;/;
  const labelsRe = /export const LOCALE_LABELS: Record<Locale, string> = \{[\s\S]*?\};/;
  if (!localesRe.test(src) || !labelsRe.test(src)) {
    console.error(`❌ Could not locate locales/LOCALE_LABELS blocks in ${filePath}. Aborting.`);
    process.exit(1);
  }
  let updated = src.replace(localesRe, () => newArray);
  updated = updated.replace(labelsRe, () => newLabels);
  return updated;
}

function rewriteUiTs(input: SkinInput): string {
  const filePath = 'src/i18n/ui.ts';
  const src = read(filePath);
  // Two separate edits:
  //   (a) the contiguous block of `import <ident> from '~/locales/<locale>.json';` lines
  //   (b) the `const messages = { ... }` map entries
  // The `import { defaultLocale, ... } from './routing'` line sits between them
  // and must NOT be touched. Both blocks come from lib/apply-rewrites.ts:
  // hyphen locales (zh-tw) need camelCase import bindings (zhTw) and quoted
  // object keys, and the block regex must re-match previously-rewritten files.
  const imports = buildUiImports(input.locales);
  const messagesEntries = buildUiMessagesEntries(input.locales);
  // (a) locale-JSON import block: one or more import lines.
  const importBlockRe = UI_IMPORT_BLOCK_RE;
  // (b) messages map: from `const messages` through the closing `};`.
  const messagesRe = /const messages: Record<Locale, Record<string, unknown>> = \{[\s\S]*?\};/;
  if (!importBlockRe.test(src) || !messagesRe.test(src)) {
    console.error(`❌ Could not rewrite locale imports in ${filePath}. Aborting.`);
    process.exit(1);
  }
  let updated = src.replace(importBlockRe, () => `${imports}\n`);
  updated = updated.replace(
    messagesRe,
    () => `const messages: Record<Locale, Record<string, unknown>> = {\n${messagesEntries}\n};`,
  );
  return updated;
}

function rewriteManifest(input: SkinInput): string {
  const filePath = 'public/manifest.json';
  const src = read(filePath);
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(src);
  } catch {
    console.error(`❌ Invalid JSON in ${filePath}.`);
    process.exit(1);
  }
  obj.name = `${input.gameName} Wiki`;
  obj.short_name = input.shortName;
  obj.description = input.description;
  const c = hexToHsl(input.themeHex);
  obj.theme_color = hslToHex(c.h, c.s, c.l);
  return JSON.stringify(obj, null, 2) + '\n';
}

/**
 * Count every .mdx/.md article under src/content/wiki/ (all locales). Shown
 * before the "Clear demo content?" question: on a re-run this number is the
 * user's OWN article count, not the demo's — the prompt must not pretend
 * otherwise. Full recursion via the shared walker (lib/walk.ts).
 */
function countWikiArticles(): number {
  return walkFiles(path.resolve(ROOT, 'src/content/wiki'), { exts: ['.mdx', '.md'] }).length;
}

/**
 * Clear demo articles content-aware (same rule as isDemoLocaleContent for
 * locale JSONs): only files positively identified as demo content (authored
 * around the demo game) are deleted; anything else under src/content/wiki/ —
 * the forker's own articles, rewrites of demo-path files, and a previous
 * run's scaffolds — is kept and reported. A re-run must never destroy user
 * work (v2.25.0 made the prompt honest; this makes the behavior match it).
 * Files come from the shared walker (full recursion + stable sort), so the
 * kept-warning order is deterministic (lexicographic by path) across
 * platforms — clear-demo-content.ts (the setup.yml channel) walks the same
 * way, so both channels report identically.
 */
function clearDemoContent(categories: { key: string }[]): { removed: number; kept: string[] } {
  const base = path.resolve(ROOT, 'src/content/wiki');
  if (!fs.existsSync(base)) return { removed: 0, kept: [] };
  const chosen = new Set(categories.map((c) => c.key));
  const entries = walkFiles(base, { exts: ['.mdx', '.md'] }).map((p) => ({
    rel: path.relative(base, p).split(path.sep).join('/'),
    src: fs.readFileSync(p, 'utf8'),
  }));
  const { demo, kept } = classifyWikiArticles(entries);
  if (!DRY_RUN) {
    for (const file of demo) fs.unlinkSync(path.join(base, file.rel));
    // Prune directories that are now empty AND not chosen — a leftover empty
    // dir is an unreachable category (template-audit flags it) and invites
    // creating articles for a nav that doesn't link it. Dirs holding kept
    // (user) files are never empty, so they survive untouched. Deepest-first
    // (reversed pre-order), and only BELOW locale level: locale dirs belong
    // to the locale loop (a freshly chosen locale is created empty and must
    // survive until its first article lands).
    for (const dir of walkDirs(base).reverse()) {
      const depth = path.relative(base, dir).split(path.sep).length;
      if (depth < 2) continue;
      if (!chosen.has(path.basename(dir)) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    }
  }
  return {
    removed: demo.length,
    kept: kept.map((f) => `src/content/wiki/${f.rel}`),
  };
}

function clearDemoAssets() {
  let removed = 0;
  // By-name everywhere, same rule as covers: public/images/articles/ is
  // where content-format.md tells fork authors to drop their own inline
  // card images — a wholesale rm -rf here would destroy that work on a
  // re-run. Demo dirs are only ever emptied of demo-named files.
  for (const [dir, demoFiles] of [
    ['src/assets/gallery', DEMO_GALLERY_IMAGES],
    ['public/images/articles', DEMO_ARTICLE_IMAGES],
  ] as const) {
    const dirPath = path.resolve(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const file of fs.readdirSync(dirPath)) {
      if (!demoFiles.includes(file)) continue;
      if (!DRY_RUN) fs.unlinkSync(path.join(dirPath, file));
      removed++;
    }
  }
  const covers = path.resolve(ROOT, 'src/assets/covers');
  if (fs.existsSync(covers)) {
    for (const file of fs.readdirSync(covers)) {
      if (DEMO_COVERS.includes(file)) {
        if (!DRY_RUN) fs.unlinkSync(path.join(covers, file));
        removed++;
      }
    }
  }
  // Demo public files, classified by content: a demo Adsterra unit is
  // removed only while it still carries the demo unit key, so a fork that
  // pasted its own snippets into the standard filenames (docs/ads.md)
  // survives reruns. The demo GSC token is the one exact-name exception —
  // a fork's own token filename can never collide.
  for (const file of DEMO_PUBLIC_FILES) {
    const p = path.resolve(ROOT, 'public', file);
    if (!fs.existsSync(p)) continue;
    const source = fs.readFileSync(p, 'utf8');
    if (!isDemoPublicFileContent(file, source)) continue;
    if (!DRY_RUN) fs.unlinkSync(p);
    removed++;
  }
  return removed;
}

/**
 * After clearing demo content, drop one scaffold article per chosen category
 * (English) so the site builds and list pages aren't empty. The scaffold
 * passes schema validation (description ≥ 40 chars) out of the box.
 */
function scaffoldContent(categories: { key: string }[]): number {
  const enBase = path.resolve(ROOT, 'src/content/wiki/en');
  // "tier-list" → "Tier List", so scaffold titles read naturally.
  const titleCase = (key: string) =>
    key
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  let created = 0;
  for (const { key } of categories) {
    const dir = path.join(enBase, key);
    if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'getting-started.mdx');
    if (!DRY_RUN && !fs.existsSync(file)) {
      writeAtomic(
        file,
        `---
title: "Getting Started with ${titleCase(key)} Guide"
description: "A starter article for the ${key} category. Replace this scaffold with your real ${key} content — keep the description between 40 and 165 characters for SEO."
category: "${key}"
date: ${todayIso()}
tags: []
---

## First section — write question-shaped headings

Replace this scaffold with your article. Remember: no H1 in the body (it is
rendered from the frontmatter title), and start each section with a direct
40-60 word answer for AI search engines.
`,
      );
      created++;
    }
  }
  return created;
}

/**
 * Files/dirs that make up the project landing page (/landing) and its in-site
 * docs center (/landing/docs + /zh/landing/docs).
 * Fork users don't need these routes — they are about the AnvilWiki project
 * itself, not their game wiki. The CLI removes them automatically.
 *
 * NOTE: docs/handbook/ (the handbook markdown SOURCE) is deliberately NOT in
 * this list — the learning manual's SOPs and AI prompts stay useful to fork
 * users as repo docs; only the landing ROUTES above are removed. The handbook
 * collection in src/content.config.ts becomes an unloaded leftover (its glob
 * base still exists), which builds cleanly.
 *
 * Directory counts in removeLandingPage() are top-level entries (approximate).
 */
const LANDING_PATHS = [
  'src/components/landing', // directory (16 components incl. docs hub/chapter/nav/comparison)
  'src/config/landing.ts', // facade re-exporting the split landing modules below
  'src/config/landing-types.ts', // LandingLocale + LandingContent types
  'src/config/landing-shared.ts', // PROJECT_VERSION + GitHub URLs + COMMUNITY_SITES
  'src/config/landing-en.ts', // English landing copy
  'src/config/landing-zh.ts', // Chinese landing copy
  'src/config/landing-templates.ts', // "wiki page templates" showcase copy (v2.32.0)
  'src/pages/landing.astro', // file — coexists with the src/pages/landing/ dir
  'src/pages/landing', // directory (docs hub + chapter routes)
  'src/pages/zh/landing.astro', // file — coexists with the src/pages/zh/landing/ dir
  'src/pages/zh/landing', // directory (zh docs routes)
  'public/images/showcase', // directory (demo screenshots + community site screenshots — landing only)
  'public/images/wechat-qr.jpg', // maintainer's personal QR — not needed by forks
  'public/_redirects', // 301s for renamed handbook lesson slugs — only the demo serves /landing/docs routes
];

function removeLandingPage(): number {
  let removed = 0;
  for (const rel of LANDING_PATHS) {
    const abs = path.resolve(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      // Count entries before deletion: reading the directory after rmSync()
      // throws ENOENT in non-dry-run mode.
      removed += fs.readdirSync(abs).length;
      if (!DRY_RUN) fs.rmSync(abs, { recursive: true, force: true });
    } else {
      if (!DRY_RUN) fs.unlinkSync(abs);
      removed++;
    }
  }
  // Also disable the demo header's "back to landing" link so the removal is
  // complete (the flag lives in project.ts, which survives this CLI).
  const projectPath = path.resolve(ROOT, 'src/config/project.ts');
  if (fs.existsSync(projectPath)) {
    const src = read('src/config/project.ts');
    const flipped = src.replace('landingLinkEnabled = true', 'landingLinkEnabled = false');
    if (flipped !== src) {
      if (!DRY_RUN) writeAtomic(projectPath, flipped);
      removed++;
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `\n🎨 AnvilWiki apply-template CLI — base config (metadata, theme, nav, locales)${DRY_RUN ? ' [DRY RUN]' : ''}\n`,
  );

  loadScriptedAnswers();

  const rl = createLinePrompt();

  // --- Collect inputs -----------------------------------------------------
  // Re-run = confirm current (S12): when src/config/site.ts already carries a
  // NON-demo identity, every text prompt defaults to the value site.ts holds
  // right now, so an enter-through re-run rewrites the site to exactly what it
  // already is instead of silently skinning it back to the demo. A first run
  // (still demo, or site.ts unreadable) keeps the demo-flavored defaults.
  const identity = fs.existsSync(path.resolve(ROOT, 'src/config/site.ts'))
    ? parseSiteTsIdentity(read('src/config/site.ts'))
    : null;
  const rerunDefaults =
    identity !== null && !isDemoSiteTsIdentity(identity) ? rerunPromptDefaults(identity) : null;
  if (rerunDefaults !== null && identity !== null) {
    console.log(`♻️  Re-run detected — src/config/site.ts already carries "${identity.name}".`);
    console.log('   Prompt defaults below are your CURRENT values (enter = keep), not demo placeholders.\n');
  }
  const d = rerunDefaults;

  console.log('━'.repeat(60));
  console.log('Game identity');
  console.log('━'.repeat(60));
  const gameName = await ask(rl, 'Full game name', d ? d.gameName : 'Anvil Quest');
  // Collapse whitespace runs first: split(' ') on a double-spaced name yields
  // empty words whose w[0] is undefined — the default spelled "UNDE Wiki".
  // (Skipped on a re-run: the current shortName is the default there.)
  const shortNameDefault = d
    ? d.shortName
    : gameName
        .trim()
        .split(/\s+/)
        .map((w) => w[0] ?? '')
        .join('')
        .slice(0, 4)
        .toUpperCase() + ' Wiki';
  const shortName = await ask(rl, 'Short name (PWA / mobile)', shortNameDefault);
  const domain = await ask(rl, 'Domain (no protocol)', d ? d.domain : 'anvilwiki.pages.dev');
  const tagline = await ask(rl, 'Hero tagline', d ? d.tagline : `Your home for everything ${gameName}`);
  const description = await ask(
    rl,
    'Site description (SEO, 40-165 chars)',
    d ? d.description : `Complete ${gameName} wiki with guides, codes, tier lists, and tips. Every page carries a last-verified date.`,
  );
  const legalNotice = await ask(
    rl,
    'Legal / copyright notice',
    d ? d.legalNotice : `${gameName} Wiki is a fan-made community site. Not affiliated with or endorsed by the game developer.`,
  );
  const officialUrl = await ask(rl, 'Official game URL', d ? d.officialUrl : 'https://example.com');

  console.log('\n' + '━'.repeat(60));
  console.log('Theme color');
  console.log('━'.repeat(60));
  const themeHex = await ask(rl, 'Theme color (#rrggbb)', '#f97316');
  const preview = hexToHsl(themeHex);
  console.log(`   → ${themeHex} = HSL(${preview.h}, ${preview.s}%, ${preview.l}%)`);

  console.log('\n' + '━'.repeat(60));
  console.log('Game metadata');
  console.log('━'.repeat(60));
  const platform = await ask(rl, 'Platform', d ? d.platform : 'Roblox');
  const developer = await ask(rl, 'Developer / studio', d ? d.developer : 'Forge Studios');
  const genre = await ask(rl, 'Genre', d ? d.genre : 'Fantasy RPG');
  const releaseDate = await ask(rl, 'Release date (ISO, optional)', d ? d.releaseDate : '');

  console.log('\n' + '━'.repeat(60));
  console.log('Locales (comma-separated, first = default)');
  console.log('━'.repeat(60));
  const localesInput = await ask(rl, 'Locales', 'en');
  const locales = localesInput
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => slugify(l) || l);
  if (locales.length === 0 || !locales.includes('en')) {
    console.warn('⚠️ "en" must be present (default locale). Adding it.');
    locales.unshift('en');
  }
  // Dedupe.
  const uniqueLocales = Array.from(new Set(locales));
  // Hyphen locales (zh-tw, pt-br) are fully supported — but only well-formed
  // lowercase codes can be safely injected into the generated routing.ts/ui.ts
  // (see localeKey/localeIdent in lib/apply-rewrites.ts). Fail LOUDLY before
  // any prompt completes or file is touched, in both interactive and
  // --answers modes (the repo's established pattern for bad input).
  const badLocales = uniqueLocales.filter((l) => !isLocaleCode(l));
  if (badLocales.length > 0) {
    console.error(
      `❌ Invalid locale code(s): ${badLocales.map((l) => JSON.stringify(l)).join(', ')}`,
    );
    console.error('   Accepted format: lowercase, starting with a letter — "en", "ja",');
    console.error('   "zh-tw", "pt-br" (letters/digits, hyphen-separated subtags of 2-8).');
    process.exit(1);
  }

  console.log('\n' + '━'.repeat(60));
  console.log('Content categories (comma-separated keys, lowercase)');
  console.log('━'.repeat(60));
  console.log('   Common: bosses, guides, items, codes, tier-list, characters');
  const catsInput = await ask(rl, 'Categories', '');
  const catKeys = catsInput
    .split(',')
    .map((c) => slugify(c.trim()))
    .filter(Boolean);
  // Default icons for known keys; others get a generic icon.
  const ICON_DEFAULTS: Record<string, string> = {
    bosses: 'lucide:swords',
    guides: 'lucide:book-open',
    items: 'lucide:package',
    codes: 'lucide:gift',
    'tier-list': 'lucide:bar-chart-3',
    characters: 'lucide:users',
    weapons: 'lucide:sword',
    maps: 'lucide:map',
    quests: 'lucide:scroll',
  };
  const categories = catKeys.map((key) => ({
    key,
    icon: ICON_DEFAULTS[key] ?? 'lucide:folder',
  }));
  if (categories.length === 0) {
    console.warn('⚠️ No categories provided. navigation.ts will be empty — fill it manually.');
  }

  let clearContent = false;
  if (!KEEP_CONTENT) {
    console.log('\n' + '━'.repeat(60));
    console.log('⚠️  CONTENT LAYER');
    console.log('━'.repeat(60));
    const articleCount = countWikiArticles();
    console.log(`   ${articleCount} article file(s) under src/content/wiki/ right now.`);
    console.log('   Clearing is CONTENT-AWARE: demo-authored articles are removed, and');
    console.log('   anything else (articles/scaffolds you wrote) is KEPT with a warning.');
    console.log('   Directory structure is preserved for you to drop in new content.');
    clearContent = await askBool(rl, 'Clear demo content?', false);
  }

  console.log('\n' + '━'.repeat(60));
  console.log('🏠  Homepage preset');
  console.log('━'.repeat(60));
  console.log('   1) codes     — hero "All Codes", badge-list codes module (codes-driven sites)');
  console.log('   2) guides    — hero wiki-style, steps module (guide-driven sites)');
  console.log('   3) keep      — keep the demo homepage JSON as a starting point');
  const presetAnswer = (await ask(rl, 'Preset [1/2/3]', '1')).trim();
  const homePreset: 'codes' | 'guides' | 'keep' =
    presetAnswer === '2' ? 'guides' : presetAnswer === '3' ? 'keep' : 'codes';

  let clearLanding = false;
  if (!KEEP_LANDING) {
    console.log('\n' + '━'.repeat(60));
    console.log('🌐  PROJECT LANDING PAGE');
    console.log('━'.repeat(60));
    console.log('   /landing is a marketing page for the AnvilWiki project itself.');
    console.log('   Your game wiki does not need it. Removing it keeps your repo clean.');
    clearLanding = await askBool(rl, 'Remove the project landing page (/landing)?', true);
  }

  // --- Summarize planned changes -----------------------------------------
  const skinInput: SkinInput = {
    gameName,
    shortName,
    domain,
    tagline,
    description,
    legalNotice,
    themeHex,
    platform,
    developer,
    genre,
    releaseDate,
    officialUrl,
    locales: uniqueLocales,
    categories,
    clearContent,
    clearLanding,
    homePreset,
  };

  console.log('\n' + '━'.repeat(60));
  console.log(`📋 Planned changes${DRY_RUN ? ' (DRY RUN — nothing will be written)' : ''}`);
  console.log('━'.repeat(60));
  console.log(`   Game:        ${gameName}`);
  console.log(`   Short name:  ${shortName}`);
  console.log(`   Domain:      ${domain}`);
  console.log(`   Theme:       ${themeHex} → HSL(${preview.h}, ${preview.s}%, ${preview.l}%)`);
  console.log(`   Locales:     ${uniqueLocales.join(', ')}`);
  console.log(`   Categories:  ${categories.map((c) => c.key).join(', ') || '(none)'}`);
  console.log(`   Clear demo:  ${clearContent ? 'YES' : 'no'}`);
  console.log(`   Remove /landing: ${skinInput.clearLanding ? 'YES' : 'no'}`);
  console.log('   Files to write:');
  console.log('     - src/config/site.ts');
  console.log('     - src/config/navigation.ts');
  console.log('     - src/styles/globals.css (4 theme lines only)');
  console.log('     - src/i18n/routing.ts');
  console.log('     - src/i18n/ui.ts');
  console.log(`     - src/locales/{${uniqueLocales.join(',')}}.json`);
  console.log('     - public/manifest.json');
  console.log('     - wrangler.toml ([vars] reset to your domain, demo Giscus cleared)');

  if (!DRY_RUN) {
    const proceed = await askBool(rl, '\nProceed with these changes?', false);
    rl.close();
    if (!proceed) {
      console.log('\n🚫 Aborted. No files were changed.');
      process.exit(0);
    }
  } else {
    rl.close();
  }

  // --- Apply -------------------------------------------------------------
  console.log('\n🔧 Applying changes…');

  write('src/config/site.ts', rewriteSiteTs(skinInput));
  console.log('   ✅ src/config/site.ts');

  write('src/config/navigation.ts', rewriteNavigationTs(skinInput));
  console.log('   ✅ src/config/navigation.ts');

  write('src/styles/globals.css', rewriteGlobalsCss(skinInput));
  console.log('   ✅ src/styles/globals.css');

  write('src/i18n/routing.ts', rewriteRoutingTs(skinInput));
  console.log('   ✅ src/i18n/routing.ts');

  write('src/i18n/ui.ts', rewriteUiTs(skinInput));
  console.log('   ✅ src/i18n/ui.ts');

  // Copyright year comes from the shared local-date helper — the pure rewrite
  // layer takes it as a parameter (no hidden wall-clock reads at night-run hours).
  const copyrightYear = Number(todayIso().slice(0, 4));
  for (const locale of uniqueLocales) {
    const localePath = `src/locales/${locale}.json`;
    const existing = fs.existsSync(path.resolve(ROOT, localePath))
      ? read(localePath)
      : undefined;
    write(localePath, rewriteLocaleJson(skinInput, locale, copyrightYear, existing));
    if (!DRY_RUN) {
      // Ensure content dir exists for this locale.
      fs.mkdirSync(path.resolve(ROOT, 'src/content/wiki', locale), { recursive: true });
    }
    console.log(`   ✅ ${localePath}`);
  }

  // Delete locale JSONs the forker did NOT choose — but ONLY demo-named files
  // (en/ja) that still CARRY demo content (site.name check, not just the
  // filename): pristine demo leftovers are an identity leak and keep
  // `pnpm check-config` red, but a file a previous run already rewrote for
  // the forker's own game (they chose ja then, not now) is translation work —
  // it takes the warn-and-keep path instead of a silent delete. Anything
  // else — a locale the user added via a previous run or `pnpm new-locale` —
  // is likewise reported, never deleted.
  if (!DRY_RUN && fs.existsSync(path.resolve(ROOT, 'src/locales'))) {
    const orphanLocales: string[] = [];
    for (const file of fs.readdirSync(path.resolve(ROOT, 'src/locales'))) {
      if (!file.endsWith('.json')) continue;
      const key = file.replace(/\.json$/, '');
      if (uniqueLocales.includes(key)) continue;
      if (
        DEMO_LOCALES.includes(key) &&
        isDemoLocaleContent(read(path.join('src/locales', file)))
      ) {
        fs.unlinkSync(path.resolve(ROOT, 'src/locales', file));
        console.log(`   🗑️  Removed src/locales/${file} (locale not chosen — still demo translation leftover)`);
      } else {
        orphanLocales.push(file);
      }
    }
    if (orphanLocales.length > 0) {
      console.warn(`\n   ⚠️  Kept ${orphanLocales.length} locale file(s) not in your chosen locales (${uniqueLocales.join(', ')}) — NOT deleted:`);
      for (const f of orphanLocales) console.warn(`      src/locales/${f}`);
      console.warn('      These were kept because they are either not demo files, or demo-named files you');
      console.warn('      already rewrote for your own game — either way they may hold translation work.');
      console.warn('      Delete them yourself if they are leftovers — until then `pnpm check-config` stays red.');
    }
  }

  write('public/manifest.json', rewriteManifest(skinInput));
  console.log('   ✅ public/manifest.json');

  const wrangler = fs.existsSync(path.resolve(ROOT, 'wrangler.toml'))
    ? rewriteWranglerVars(skinInput, read('wrangler.toml'))
    : null;
  if (wrangler !== null) {
    write('wrangler.toml', wrangler);
    console.log('   ✅ wrangler.toml ([vars] reset — demo Giscus config cleared)');
  }

  // Reset the demo author registry so fork sites don't inherit demo authors.
  const authorsPath = 'src/config/authors.ts';
  if (fs.existsSync(path.resolve(ROOT, authorsPath))) {
    const src = read(authorsPath);
    const cleaned = src.replace(/\n\s*\/\/ DEMO .*?\n\s*'[^']+'.*?\{[^}]*\},\n/, '\n');
    // Only claim success when the demo block actually matched — an upstream
    // authors.ts format change must not print a false ✅.
    if (cleaned !== src) {
      write(authorsPath, cleaned);
      console.log('   ✅ src/config/authors.ts (demo author removed)');
    }
  }

  if (clearContent) {
    const { removed, kept } = clearDemoContent(categories);
    const assets = clearDemoAssets();
    console.log(`   🗑️  ${DRY_RUN ? 'Would remove' : 'Removed'} ${removed} demo article${removed === 1 ? '' : 's'} under src/content/wiki/ (content-aware)`);
    console.log(`   🖼️  ${DRY_RUN ? 'Would remove' : 'Removed'} ${assets} demo asset file(s) (covers/gallery/article images/public tokens, by name)`);
    if (kept.length > 0) {
      console.warn(`   ⚠️  Kept ${kept.length} file(s) that are NOT demo content — they never mention the demo game (${DEMO_GAME_NAMES.join(', ')}). Delete them yourself if unwanted:`);
      for (const rel of kept) console.warn(`      ${rel}`);
    }
    if (categories.length > 0) {
      const s = scaffoldContent(categories);
      console.log(`   📄 Created ${s} scaffold article${s === 1 ? '' : 's'} (one per category, en/)`);
    }
  }

  if (skinInput.clearLanding) {
    const n = removeLandingPage();
    if (n > 0) {
      console.log(`   🗑️  Removed ${n} project landing page file${n === 1 ? '' : 's'} (src/components/landing/, src/config/landing*.ts, src/pages/landing* incl. the /landing/docs center, public/images/showcase/ + wechat-qr.jpg; docs/handbook markdown stays as repo docs)`);
    }
  }

  // --- Next steps --------------------------------------------------------
  console.log('\n' + '━'.repeat(60));
  console.log('✅ Base config complete.');
  console.log('━'.repeat(60));
  console.log('\n📌 Remaining tasks (see docs/apply-template.md):');
  console.log('   • Replace the icon set — your site still shows the demo anvil icons.');
  console.log('           Generate a full set from one image at https://favicon.io/favicon-converter/,');
  console.log('           then drag the files into public/ overwriting: favicon.ico, favicon.svg,');
  console.log('           favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png,');
  console.log('           android-chrome-192x192.png, android-chrome-512x512.png.');
  console.log('           Same for the homepage hero image: public/images/hero.webp / hero.svg.');
  console.log('           (CLI cannot generate binary assets — see the learning manual, chapter 3, step 5.)');
  console.log('   • Fill homepage modules in src/locales/<locale>.json');
  console.log('           (home.hero / start / explore / faq / updates).');
  console.log('   • Add article MDX under src/content/wiki/<locale>/<category>/.');
  console.log('           Then fill nav.<key> + overview.<key> in locale JSONs.');
  console.log('   • Translate non-English locale JSONs + copy MDX bodies.');
  console.log('   • After deploy, run `pnpm check-sitemap` to verify all URLs.');
  console.log('\n   Then: pnpm dev    (preview)');
  console.log('         pnpm build  (verify production build)\n');

  warnOnLeftoverAnswers();
}

main().catch((err) => {
  console.error('\n❌', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
