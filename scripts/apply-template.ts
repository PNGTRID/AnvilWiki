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
 *                               = default). For CI and scripted runs. The site
 *                               type question is APPENDED last-but-one: 18-entry
 *                               files (pre-site-type) still work and default to
 *                               game-wiki; 19 entries answer it ("1"-"3").
 *   pnpm apply-template --lang zh          force the CLI UI language (en|zh).
 *                               Interactive TTY runs are asked instead (enter =
 *                               the LANG-derived default); --answers/piped/CI
 *                               runs never ask and default to English, so the
 *                               answer positional order stays stable.
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
import { hexToHsl as hexToHslPure, hslToHex, parseBrandHsl } from '~/lib/covers';
import * as path from 'node:path';
import { createLinePrompt, type LinePrompt } from './lib/prompt';
import { containsControlChar } from './lib/delimited';
import { walkDirs, walkFiles } from './lib/walk';
import { ensureIndexNowKey, INDEXNOW_KEY_PATH } from './lib/indexnow';
import { writeAtomic } from './lib/atomic';
import {
  DEMO_ARTICLE_IMAGES,
  DEMO_COVERS,
  DEMO_GAME_NAMES,
  DEMO_GALLERY_IMAGES,
  DEMO_LOCALES,
  DEMO_PUBLIC_FILES,
  isDemoPublicFileContent,
  buildLocaleLabels,
  buildScaffoldDescription,
  buildUiImports,
  buildUiMessagesEntries,
  classifyWikiArticles,
  coverNamesReferenced,
  isDemoLocaleContent,
  isDemoSiteTsIdentity,
  isLocaleCode,
  parseSiteTsIdentity,
  rerunPromptDefaults,
  rewriteLocaleJson,
  rewriteSiteTs as rewriteSiteTsBlock,
  rewriteWranglerVars,
  slugify,
  stripDemoAuthors,
  tsEscape,
  UI_IMPORT_BLOCK_RE,
  UI_MESSAGES_BLOCK_RE,
  type SkinInput,
} from './lib/apply-rewrites';
import {
  APPLY_TEMPLATE_STRINGS,
  envDefaultLang,
  langFromFlag,
  type CliLang,
  type CliStrings,
} from './lib/apply-template-i18n';
import {
  LEGACY_ANSWER_COUNT,
  SITE_PRESETS,
  siteTypeFromAnswer,
  type PresetId,
} from './lib/site-presets';

const ROOT = process.cwd();
const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run') || ARGS.includes('-n');
const KEEP_CONTENT = ARGS.includes('--no-clear-content');
const KEEP_LANDING = ARGS.includes('--keep-landing');

// CLI UI language. `--lang` forces it; otherwise an interactive TTY is asked
// (askLanguage below) and every non-interactive channel (--answers, pipes,
// CI) silently defaults to English so scripted answer order and the E2E's
// pinned output markers stay byte-stable. T is set in main() once resolved;
// until then it points at the English table for the pre-resolution paths.
const LANG_FLAG = langFromFlag(ARGS);
let T: CliStrings = APPLY_TEMPLATE_STRINGS.en;

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

// Atomic write (same-directory temp + rename) lives in lib/atomic.ts, shared
// with new-locale.ts — killed processes leave a .tmp breadcrumb, never a
// truncated config file.

const write = (p: string, content: string) => {
  if (DRY_RUN) {
    console.log(`   ${dim('~')} ${T.writePlanned} ${REL(p)}`);
    return;
  }
  writeAtomic(p, content);
};

/** #rgb/#rrggbb → HSL with the CLI's friendly validation over the shared lib helper. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = hexToHslPure(hex);
  if (!c) {
    console.error(T.invalidHexError(hex));
    process.exit(1);
  }
  return c;
}

const hslStr = (c: { h: number; s: number; l: number }, lOffset: number) =>
  `${c.h} ${c.s}% ${Math.max(0, Math.min(100, c.l + lOffset))}%`;

/**
 * The CURRENT theme color as hex, parsed from globals.css :root --brand via
 * the shared covers lib (parseBrandHsl + hslToHex — the same pair
 * rewriteManifest uses, so the manifest round-trips). Re-run default for the
 * theme-color prompt: an enter-through keeps the site's color instead of
 * resetting it to the first-run orange. Null when unreadable — the caller
 * warns and falls back to the historical first-run default.
 */
function currentThemeHex(): string | null {
  try {
    const hsl = parseBrandHsl(read('src/styles/globals.css'));
    return hsl ? hslToHex(hsl.h, hsl.s, hsl.l) : null;
  } catch {
    return null;
  }
}

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
  // Both branches normalize case: a scripted 'Y' must mean Yes exactly like a
  // typed 'Y' does (the scripted branch used to trim only and read as No).
  const answer = scripted
    ? takeScriptedAnswer(question).toLowerCase()
    : (await rl.ask(`${question} [${fallback ? 'Y/n' : 'y/N'}]: `)).trim().toLowerCase();
  if (!answer) return fallback;
  // zh UI also accepts 是; the table keeps the per-language list.
  return T.yesWords.includes(answer);
}

/**
 * The language question — bilingual itself, asked ONLY on an interactive TTY
 * outside --answers mode: a scripted run must not consume stdin lines that
 * belong to the answers file (LinePrompt queues everything it sees), and a
 * piped run has no human to ask. EOF reads as bare Enter → the fallback.
 */
async function askLanguage(rl: LinePrompt, fallback: CliLang): Promise<CliLang> {
  console.log('\n🌐 界面语言 / CLI language');
  console.log('   1) 中文 (Chinese)');
  console.log('   2) English');
  for (;;) {
    const raw = (
      await rl.ask(`选择界面语言 / Select CLI language [${fallback === 'zh' ? '1' : '2'}]: `)
    )
      .trim()
      .toLowerCase();
    if (raw === '') return fallback;
    if (raw === '1' || raw === 'zh' || raw === 'zh-cn' || raw === '中文') return 'zh';
    if (raw === '2' || raw === 'en') return 'en';
    // Not retry-capped on purpose: a capped loop would silently misalign a
    // pasted 18-line answer sheet (eaten lines shift every later answer).
    // The loop fails visibly instead, and the rejection names the right tool
    // for bulk input.
    console.log(
      '   请输入 1 或 2 / Please answer 1 or 2 (整段粘贴答案请改用 --answers <file> / pasting a full answer sheet? use --answers <file>).',
    );
  }
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
      (c) => `  { key: '${c.key}', path: '/${c.key}', icon: '${c.icon}', isContentType: true }`,
    )
    .join(',\n');
  // An empty selection must produce a VALID empty array — the naive
  // `[\n${items},\n]` spelled a leading-comma holey literal that did not
  // parse as NavigationItem[].
  const newArray =
    input.categories.length === 0
      ? 'export const NAVIGATION_CONFIG: NavigationItem[] = [];'
      : `export const NAVIGATION_CONFIG: NavigationItem[] = [\n${items},\n];`;
  const navRe = /export const NAVIGATION_CONFIG: NavigationItem\[\] = \[[\s\S]*?\];/;
  if (!navRe.test(src)) {
    console.error(`❌ Could not find NAVIGATION_CONFIG in ${filePath}. Aborting.`);
    process.exit(1);
  }
  // Function replacer everywhere: string-mode replace would expand `$&`-style
  // sequences from user input into the rewritten file.
  let result = src.replace(navRe, () => newArray);

  // Preset-only categories (e.g. `recipes`) live in a separate array below
  // NAVIGATION_CONFIG. Non-recipe forks must not carry them — check-config
  // parses every `key:` in this file and would demand en.json labels for
  // categories the fork's nav never shows. Recipe-hub keeps the array as-is
  // (its nav includes the key). The LEGAL_CONTENT_TYPES spread below the
  // array is structural code — no entries to strip.
  if (!input.categories.some((c) => c.key === 'recipes')) {
    const presetOnlyRe =
      /export const PRESET_ONLY_CATEGORIES: NavigationItem\[\] = \[[\s\S]*?\];/;
    if (presetOnlyRe.test(result)) {
      result = result.replace(
        presetOnlyRe,
        () => 'export const PRESET_ONLY_CATEGORIES: NavigationItem[] = [];',
      );
    }
  }
  return result;
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
  // Shared constant — the contract test that scans ui.ts OUTSIDE the rewritten
  // regions strips this exact regex, so both sides can never drift apart.
  const messagesRe = UI_MESSAGES_BLOCK_RE;
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
function clearDemoContent(
  categories: { key: string }[],
  selectedLocales: string[],
  preset: PresetId,
): { removed: number; kept: string[]; keptSrcs: string[] } {
  const base = path.resolve(ROOT, 'src/content/wiki');
  if (!fs.existsSync(base)) return { removed: 0, kept: [], keptSrcs: [] };
  const chosen = new Set(categories.map((c) => c.key));
  const entries = walkFiles(base, { exts: ['.mdx', '.md'] }).map((p) => ({
    rel: path.relative(base, p).split(path.sep).join('/'),
    src: fs.readFileSync(p, 'utf8'),
  }));
  // Two demo layers (classifyWikiArticles): the SITE_PRESETS registry decides
  // the coupon-hub/tutorial-hub demo articles — other presets' demos clear
  // unconditionally, the chosen preset's demos clear only for locales this
  // run did NOT pick (kept as starting content for the picked ones). The
  // Anvil Quest game-wiki demos keep clearing through the historical
  // content-marker rule.
  const { demo, kept } = classifyWikiArticles(entries, {
    selectedLocales,
    preset,
  });
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
    // Raw sources of the kept articles — clearDemoAssets spares the covers
    // these reference (preset starting content must build).
    keptSrcs: kept.map((f) => f.src),
  };
}

function clearDemoAssets(keptSrcs: readonly string[] = []) {
  let removed = 0;
  // Covers survive when a KEPT demo article references them: the chosen
  // preset's starting content ships with covers, and clearing the cover of a
  // kept article fails the fork's first build (Astro image() → ImageNotFound).
  // The locale dimension falls out naturally — an unchosen locale's articles
  // are deleted, so its covers stay unreferenced and clear. Channels below
  // (gallery/article images/public files) have no kept-article referencing
  // them in any preset, so they clear unconditionally as before.
  const spareCovers = coverNamesReferenced(keptSrcs);
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
      if (DEMO_COVERS.includes(file) && !spareCovers.has(file)) {
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
 * passes schema validation (description 40-165 chars, guarded for long
 * category keys by buildScaffoldDescription) out of the box.
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
description: "${buildScaffoldDescription(key)}"
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
  'src/pages/demo.astro', // demo wiki English homepage — root / is the landing gateway in the demo
  'src/pages/landing', // directory (docs hub + chapter routes)
  'src/pages/zh/landing.astro', // file — coexists with the src/pages/zh/landing/ dir
  'src/pages/zh/landing', // directory (zh docs routes)
  // Flagship tutorial line (v2.39+) — official-site marketing content
  // (src/content/tutorials collection + its landing routes). The collection
  // must NOT survive the fork: unlike docs/handbook (kept as repo docs) these
  // are demo-identity pages. Paths may not exist yet on older trees —
  // removeLandingPage skips missing entries, so listing them here is safe.
  'src/pages/landing/tutorials.astro', // tutorial hub (en)
  'src/pages/landing/tutorials', // directory ([slug] detail routes)
  'src/pages/zh/landing/tutorials.astro', // tutorial hub (zh)
  'src/pages/zh/landing/tutorials', // directory (zh [slug] detail routes)
  'src/content/tutorials', // tutorial collection source (en+zh .md)
  'public/images/showcase', // directory (demo screenshots + community site screenshots — landing only)
  'public/images/wechat-qr.jpg', // maintainer's personal QR — not needed by forks
  'public/_redirects', // 301s for renamed handbook lesson slugs — only the demo serves /landing/docs routes
];
// ⚠️ NEVER add src/components/RootGateway.astro to this list (unquoted here
// on purpose — the survive pin in tests/redirects.test.ts greps for the
// quoted form) — src/pages/index.astro statically imports it, so build-time
// module resolution runs even with landingLinkEnabled=false; deleting it
// makes the fork's build fail to resolve the import. Same for the setup.yml
// rm line. Pinned by the survive pins in tests/redirects.test.ts and the e2e
// positive tripwire.
//
// ⚠️ NEVER add src/lib/landing-tutorials.ts either — deliberate SURVIVE file:
// tests/tutorials.test.ts and tests/landing-paths.test.ts statically import
// it, so deleting it reddens fork CI. Only the tutorials collection
// (src/content/tutorials, listed above) and its routes are cleanup targets;
// see the survive note in that file's L3 header.

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
  // The flip must never be a silent no-op (audit round 21): a drifted pattern
  // would leave fork nav pointing at the deleted /landing/ routes with no
  // build error. Already-flipped files (re-runs) stay quiet.
  const projectPath = path.resolve(ROOT, 'src/config/project.ts');
  if (fs.existsSync(projectPath)) {
    const src = read('src/config/project.ts');
    const flipped = src.replace('landingLinkEnabled = true', 'landingLinkEnabled = false');
    if (flipped !== src) {
      if (!DRY_RUN) writeAtomic(projectPath, flipped);
      removed++;
    } else if (!src.includes('landingLinkEnabled = false')) {
      console.warn(
        '⚠️ Could not flip landingLinkEnabled in src/config/project.ts — pattern drifted? Disable the landing link manually, or the header will link at the removed /landing/ routes.',
      );
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadScriptedAnswers();

  // Pre-site-type --answers compatibility (site-presets.LEGACY_ANSWER_COUNT):
  // the qSiteType question was APPENDED, so an exactly-18-entry file is still
  // a valid pre-preset sheet — site type silently defaults to game-wiki,
  // qSiteType consumes nothing, one stderr note says so. 19 entries answer
  // qSiteType (validated "1"|"2"|"3", loud ❌ before any write); fewer than 18
  // keeps the existing loud Ran-out failure; more than 19 keeps the existing
  // leftover-answers warning at the end. The count is only meaningful BEFORE
  // any consumption (the queue shrinks as prompts eat it), hence detection
  // here at the top. Scripted diagnostics stay English (i18n boundary).
  const legacySiteTypeCompat = scripted !== null && scripted.length === LEGACY_ANSWER_COUNT;
  if (legacySiteTypeCompat) {
    console.warn(
      `ℹ️  ${LEGACY_ANSWER_COUNT}-answer answers file detected (pre-site-type format) — site type defaults to game-wiki. Insert the site-type answer ("1", "2" or "3") as entry ${LEGACY_ANSWER_COUNT + 1}, before the final Proceed answer, to choose it.`,
    );
  }

  if (LANG_FLAG === 'invalid') {
    console.error("❌ Unknown --lang value. Use 'en' or 'zh'.(--lang 语言代码只支持 en / zh)");
    process.exit(1);
  }

  const rl = createLinePrompt();

  // Resolve the UI language BEFORE anything user-facing prints: --lang wins,
  // then an interactive TTY gets the bilingual question (LANG-derived
  // default), then English — the byte-stable default for --answers/CI runs.
  let lang: CliLang = LANG_FLAG ?? 'en';
  if (LANG_FLAG === undefined && !scripted && process.stdin.isTTY) {
    lang = await askLanguage(rl, envDefaultLang());
  }
  T = APPLY_TEMPLATE_STRINGS[lang];

  console.log(T.banner(DRY_RUN));

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
    console.log(T.rerunBanner(identity.name));
    console.log(T.rerunNote);
  }
  const d = rerunDefaults;

  console.log('━'.repeat(60));
  console.log(T.secIdentity);
  console.log('━'.repeat(60));
  const gameName = await ask(rl, T.qGameName, d ? d.gameName : 'Anvil Quest');
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
  const shortName = await ask(rl, T.qShortName, shortNameDefault);
  const domain = await ask(rl, T.qDomain, d ? d.domain : 'anvilwiki.pages.dev');
  const tagline = await ask(rl, T.qTagline, d ? d.tagline : `Your home for everything ${gameName}`);
  const description = await ask(
    rl,
    T.qDescription,
    d ? d.description : `Complete ${gameName} wiki with guides, codes, tier lists, and tips. Every page carries a last-verified date.`,
  );
  const legalNotice = await ask(
    rl,
    T.qLegalNotice,
    d ? d.legalNotice : `${gameName} Wiki is a fan-made community site. Not affiliated with or endorsed by the game developer.`,
  );
  const officialUrl = await ask(rl, T.qOfficialUrl, d ? d.officialUrl : 'https://example.com');

  console.log('\n' + '━'.repeat(60));
  console.log(T.secTheme);
  console.log('━'.repeat(60));
  // Re-run = keep the CURRENT color as the default (the other 11 identity
  // prompts do the same via rerunPromptDefaults); a first run keeps the
  // historical demo orange.
  let themeDefault = '#f97316';
  if (rerunDefaults !== null) {
    const current = currentThemeHex();
    if (current !== null) {
      themeDefault = current;
    } else {
      console.warn(T.themeUnreadableWarn);
    }
  }
  const themeHex = await ask(rl, T.qThemeColor, themeDefault);
  const preview = hexToHsl(themeHex);
  console.log(`   → ${themeHex} = HSL(${preview.h}, ${preview.s}%, ${preview.l}%)`);

  console.log('\n' + '━'.repeat(60));
  console.log(T.secMetadata);
  console.log('━'.repeat(60));
  const platform = await ask(rl, T.qPlatform, d ? d.platform : 'Roblox');
  const developer = await ask(rl, T.qDeveloper, d ? d.developer : 'Forge Studios');
  const genre = await ask(rl, T.qGenre, d ? d.genre : 'Fantasy RPG');
  const releaseDate = await ask(rl, T.qReleaseDate, d ? d.releaseDate : '');

  console.log('\n' + '━'.repeat(60));
  console.log(T.secLocales);
  console.log('━'.repeat(60));
  const localesInput = await ask(rl, T.qLocales, 'en');
  const locales = localesInput
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => slugify(l) || l);
  if (locales.length === 0 || !locales.includes('en')) {
    console.warn(T.localesEnAddedWarn);
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
    console.error(T.badLocalesError(badLocales.map((l) => JSON.stringify(l)).join(', ')));
    process.exit(1);
  }

  console.log('\n' + '━'.repeat(60));
  console.log(T.secCategories);
  console.log('━'.repeat(60));
  console.log(T.hintCommonCategories);
  const catsInput = await ask(rl, T.qCategories, '');
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
    recipes: 'lucide:cake',
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
    console.warn(T.noCategoriesWarn);
  }

  let clearContent = false;
  if (!KEEP_CONTENT) {
    console.log('\n' + '━'.repeat(60));
    console.log(T.secContentLayer);
    console.log('━'.repeat(60));
    const articleCount = countWikiArticles();
    console.log(T.contentLayerCount(articleCount));
    console.log(T.contentLayerAware1);
    console.log(T.contentLayerAware2);
    console.log(T.contentLayerAware3);
    clearContent = await askBool(rl, T.qClearContent, false);
  }

  console.log('\n' + '━'.repeat(60));
  console.log(T.secHomePreset);
  console.log('━'.repeat(60));
  console.log(T.presetMenu);
  const presetAnswer = (await ask(rl, T.qPreset, '1')).trim();
  const homePreset: 'codes' | 'guides' | 'keep' =
    presetAnswer === '2' ? 'guides' : presetAnswer === '3' ? 'keep' : 'codes';

  let clearLanding = false;
  if (!KEEP_LANDING) {
    console.log('\n' + '━'.repeat(60));
    console.log(T.secLanding);
    console.log('━'.repeat(60));
    console.log(T.landingInfo1);
    console.log(T.landingInfo2);
    clearLanding = await askBool(rl, T.qRemoveLanding, true);
  }

  // --- Site type (qSiteType, appended) ------------------------------------
  // Prompt #18 / answer index 17 (after qRemoveLanding, before qProceed):
  // appended last-but-one so the original 18-answer positional order never
  // moved. An 18-entry --answers file takes the legacy path above and never
  // consumes an answer here.
  console.log('\n' + T.siteTypeMenu);
  console.log(T.siteTypeNote);
  let siteType: PresetId;
  if (legacySiteTypeCompat) {
    siteType = 'game-wiki';
  } else {
    const siteTypeAnswer = await ask(rl, T.qSiteType, '1');
    const resolved = siteTypeFromAnswer(siteTypeAnswer);
    if (resolved === null) {
      console.error(T.siteTypeError(siteTypeAnswer));
      process.exit(1);
    }
    siteType = resolved;
  }
  // Category narrowing is a POST-check by construction: qCategories is asked
  // at index 13, long before qSiteType at index 17, so the choice cannot be
  // narrowed at question time without shifting the answer order (a breaking
  // change the preset contract forbids). Instead the chosen set is validated
  // against the preset right after the site-type answer — LOUD exit before
  // ANY file write, on the same path for interactive and --answers runs.
  const presetCategories = SITE_PRESETS[siteType].categories;
  const invalidCategories = categories.filter((c) => !presetCategories.includes(c.key));
  if (invalidCategories.length > 0) {
    console.error(
      T.siteCategoryMismatchError(
        siteType,
        presetCategories.join(', '),
        invalidCategories.map((c) => c.key).join(', '),
      ),
    );
    process.exit(1);
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
    siteType,
  };

  console.log('\n' + '━'.repeat(60));
  console.log(T.secPlanned(DRY_RUN));
  console.log('━'.repeat(60));
  console.log(`${T.plannedGame}${gameName}`);
  console.log(`${T.plannedShort}${shortName}`);
  console.log(`${T.plannedDomain}${domain}`);
  console.log(`${T.plannedTheme}${themeHex} → HSL(${preview.h}, ${preview.s}%, ${preview.l}%)`);
  console.log(`${T.plannedLocales}${uniqueLocales.join(', ')}`);
  console.log(`${T.plannedCategories}${categories.map((c) => c.key).join(', ') || T.plannedNone}`);
  console.log(`${T.plannedSiteType}${siteType}`);
  console.log(`${T.plannedClear}${clearContent ? T.plannedYes : T.plannedNo}`);
  console.log(`${T.plannedLanding}${skinInput.clearLanding ? T.plannedYes : T.plannedNo}`);
  console.log(T.plannedFilesHeader);
  console.log('     - src/config/site.ts');
  console.log('     - src/config/navigation.ts');
  console.log(T.plannedGlobalsNote);
  console.log('     - src/i18n/routing.ts');
  console.log('     - src/i18n/ui.ts');
  console.log(`     - src/locales/{${uniqueLocales.join(',')}}.json`);
  console.log('     - public/manifest.json');
  console.log(T.plannedWranglerNote);
  console.log(T.plannedIndexNowNote(INDEXNOW_KEY_PATH));

  if (!DRY_RUN) {
    const proceed = await askBool(rl, T.qProceed, false);
    rl.close();
    if (!proceed) {
      console.log(T.aborted);
      process.exit(0);
    }
  } else {
    rl.close();
  }

  // --- Apply -------------------------------------------------------------
  console.log(T.applying);

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
  // The DEFAULT locale ('en' — routing.ts's defaultLocale, which this CLI
  // never rewrites) is rewritten FIRST: a brand-new locale file starts from
  // en's REWRITTEN OUTPUT (the user's identity), never the demo en.json still
  // on disk — cloning the disk file would leak the demo identity into the
  // new locale. Without the clone the fresh file shipped a ~76-key-shorter
  // skeleton (no $schema / search.* / shared.*) and turned the fork's first
  // `check-i18n --strict-ui` run red. Computed up front rather than "first
  // loop iteration" because check-i18n diffs against defaultLocale, not
  // locales[0] — a "ja,en" answer would otherwise clone from ja.
  const enPath = 'src/locales/en.json';
  const enOutput = rewriteLocaleJson(
    skinInput,
    'en',
    copyrightYear,
    fs.existsSync(path.resolve(ROOT, enPath)) ? read(enPath) : undefined,
  );
  for (const locale of uniqueLocales) {
    const localePath = `src/locales/${locale}.json`;
    if (locale === 'en') {
      write(localePath, enOutput);
    } else {
      const existing = fs.existsSync(path.resolve(ROOT, localePath))
        ? read(localePath)
        : undefined;
      write(
        localePath,
        rewriteLocaleJson(skinInput, locale, copyrightYear, existing, enOutput),
      );
    }
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
        console.log(T.orphanRemoved(file));
      } else {
        orphanLocales.push(file);
      }
    }
    if (orphanLocales.length > 0) {
      console.warn(T.orphanKeptWarn(orphanLocales.length, uniqueLocales.join(', ')));
      for (const f of orphanLocales) console.warn(`      src/locales/${f}`);
      console.warn(T.orphanKeptWhy1);
      console.warn(T.orphanKeptWhy2);
      console.warn(T.orphanKeptWhy3);
    }
  }

  write('public/manifest.json', rewriteManifest(skinInput));
  console.log('   ✅ public/manifest.json');

  const wrangler = fs.existsSync(path.resolve(ROOT, 'wrangler.toml'))
    ? rewriteWranglerVars(skinInput, read('wrangler.toml'))
    : null;
  if (wrangler !== null) {
    write('wrangler.toml', wrangler);
    console.log(T.wranglerDone);
  }

  if (DRY_RUN) {
    console.log(
      fs.existsSync(path.resolve(ROOT, INDEXNOW_KEY_PATH))
        ? T.indexNowDryKeep(INDEXNOW_KEY_PATH)
        : T.indexNowDryGen(INDEXNOW_KEY_PATH),
    );
  } else {
    const indexNow = ensureIndexNowKey(ROOT);
    console.log(
      indexNow.created
        ? T.indexNowCreated(INDEXNOW_KEY_PATH)
        : T.indexNowReused(INDEXNOW_KEY_PATH),
    );
  }

  // Reset the demo author registry so fork sites don't inherit demo authors.
  // The regex lives in lib/apply-rewrites.ts (stripDemoAuthors) so the
  // contract test can pin it against the real file and against setup.yml's
  // inline python copy.
  const authorsPath = 'src/config/authors.ts';
  if (fs.existsSync(path.resolve(ROOT, authorsPath))) {
    const src = read(authorsPath);
    const { cleaned, changed } = stripDemoAuthors(src);
    // Only claim success when the demo block actually matched — an upstream
    // authors.ts format change must not print a false ✅, and a silent no-op
    // (already removed on a previous run, or the format drifted) must not
    // pass unnoticed either.
    if (changed) {
      write(authorsPath, cleaned);
      console.log(T.authorsDone);
    } else {
      console.warn(T.authorsDriftWarn);
    }
  }

  if (clearContent) {
    const { removed, kept, keptSrcs } = clearDemoContent(categories, uniqueLocales, skinInput.siteType);
    const assets = clearDemoAssets(keptSrcs);
    console.log(T.clearedArticles(removed, DRY_RUN));
    console.log(T.clearedAssets(assets, DRY_RUN));
    if (kept.length > 0) {
      console.warn(T.keptFilesWarn(kept.length, DEMO_GAME_NAMES.join(', ')));
      for (const rel of kept) console.warn(`      ${rel}`);
    }
    if (categories.length > 0) {
      const s = scaffoldContent(categories);
      console.log(T.scaffoldCreated(s));
    }
  }

  if (skinInput.clearLanding) {
    const n = removeLandingPage();
    if (n > 0) {
      console.log(T.landingRemoved(n));
    }
  }

  // --- Next steps --------------------------------------------------------
  console.log('\n' + '━'.repeat(60));
  console.log(T.secComplete);
  console.log('━'.repeat(60));
  console.log(`\n${T.nextStepsHeader}`);
  console.log(T.nextIcons1);
  console.log(T.nextIcons2);
  console.log(T.nextIcons3);
  console.log(T.nextIcons4);
  console.log(T.nextIcons5);
  console.log(T.nextIcons6);
  console.log(T.nextIcons7);
  console.log(T.nextHome);
  console.log(T.nextHomeDetail);
  console.log(T.nextArticles);
  console.log(T.nextArticlesDetail);
  console.log(T.nextTranslate);
  console.log(T.nextSitemap);
  console.log(T.nextCommands);

  warnOnLeftoverAnswers();
}

main().catch((err) => {
  console.error('\n❌', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
