/**
 * check-i18n.ts
 *
 * Translation coverage report — answers "what is ja (or any locale) missing
 * relative to English?" without any manual directory diffing.
 *
 * Checks per non-default locale:
 *   1. Missing articles: every en/ MDX with no <locale>/ counterpart
 *      (same category/slug path). Also reports extra translations.
 *   2. Missing UI keys: deep key diff of src/locales/en.json vs
 *      src/locales/<locale>.json (missing keys fall back to English at
 *      runtime via deepMerge — this is a coverage report, not an error).
 *
 * Pure fs scan (no astro:content import) so it runs anywhere, fast.
 *
 * Usage:
 *   pnpm check-i18n                # report only, always exits 0
 *   pnpm check-i18n --strict       # exit 1 if anything is missing (articles OR UI keys)
 *   pnpm check-i18n --strict-ui    # exit 1 only if UI KEYS are missing (the CI gate)
 *
 * Why the CI gate is --strict-ui and not --strict: missing UI keys are a
 * template defect (a key was added to en.json but never translated — the
 * locale renders English silently), while missing ARTICLES are a content
 * choice (translation depth is up to the site owner; the detail-page
 * fallback is by design). Gates must fail on the former, never the latter.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { readDefaultLocale, readLocales } from './lib/routing-flags';
import { walkFiles } from './lib/walk';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const STRICT_UI = process.argv.includes('--strict-ui');
const CONTENT_BASE = path.resolve(ROOT, 'src/content/wiki');
const LOCALES_DIR = path.resolve(ROOT, 'src/locales');

// --- Locales from routing.ts (shared reader in scripts/lib/routing-flags.ts) ---
const locales = readLocales(ROOT);
// Read the REAL default locale — assuming locales[0] would drift when a fork
// reorders the array (apply-template guarantees 'en' exists, not that it's first).
const defaultLocale = readDefaultLocale(ROOT);
if (!locales.includes(defaultLocale)) {
  console.error(
    `❌ defaultLocale "${defaultLocale}" from src/i18n/routing.ts is not in the locales array (${locales.join(', ')})`,
  );
  process.exit(1);
}

/** All MDX paths under a locale dir, relative like "bosses/emberfang.mdx". */
function articleMap(locale: string): Map<string, string> {
  const map = new Map<string, string>();
  const dir = path.join(CONTENT_BASE, locale);
  for (const p of walkFiles(dir, { exts: ['.mdx'] })) {
    // Drafts are dev-only; don't report them as missing translations.
    const fm = fs.readFileSync(p, 'utf8').split('---')[1] ?? '';
    if (/^draft:\s*true\s*$/m.test(fm)) continue;
    map.set(path.relative(dir, p), path.basename(p, '.mdx'));
  }
  return map;
}

/** Flatten a JSON object into dot-paths ("shared.bossCard.hp"). */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flattenKeys(v, prefix ? `${prefix}.${k}` : k)
      : [prefix ? `${prefix}.${k}` : k],
  );
}

let missingAnything = false;
let missingUiKeys = false;

console.log(`\n🌐 i18n coverage report — default locale: ${defaultLocale}\n`);

const defaultArticles = articleMap(defaultLocale);
const defaultJson = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${defaultLocale}.json`), 'utf8'));
const defaultKeys = new Set(flattenKeys(defaultJson));

// Compare every NON-default locale against the default — never assume the
// default is locales[0] (apply-template only guarantees it exists, not that
// it's first in the array).
for (const locale of locales.filter((l) => l !== defaultLocale)) {
  console.log('━'.repeat(60));
  console.log(` ${locale}`);
  console.log('━'.repeat(60));

  // --- Articles ---
  const locArticles = articleMap(locale);
  const missing: string[] = [];
  for (const rel of defaultArticles.keys()) {
    if (!locArticles.has(rel)) missing.push(rel);
  }
  const extra: string[] = [];
  for (const rel of locArticles.keys()) {
    if (!defaultArticles.has(rel)) extra.push(rel);
  }

  const coverage =
    defaultArticles.size === 0
      ? 100
      : Math.round(((defaultArticles.size - missing.length) / defaultArticles.size) * 100);
  console.log(
    `   Articles: ${defaultArticles.size - missing.length}/${defaultArticles.size} translated (${coverage}%)`,
  );
  for (const m of missing) console.log(`   ⬜ missing:  ${locale}/${m.replace(/\.mdx$/, '')}`);
  for (const e of extra) console.log(`   ➕ extra:    ${locale}/${e.replace(/\.mdx$/, '')}`);
  if (missing.length > 0) missingAnything = true;

  // --- UI keys ---
  const locJsonPath = path.join(LOCALES_DIR, `${locale}.json`);
  if (!fs.existsSync(locJsonPath)) {
    console.log(`   ⚠️ No src/locales/${locale}.json — UI runs on English fallback.`);
    // A locale without its JSON is 100% English UI — a template defect under
    // --strict-ui (new-locale.ts scaffolds the file; its absence is a bug).
    missingUiKeys = true;
    continue;
  }
  const locKeys = new Set(
    flattenKeys(JSON.parse(fs.readFileSync(locJsonPath, 'utf8'))),
  );
  const missingKeys = [...defaultKeys].filter((k) => !locKeys.has(k)).sort();
  const coverageKeys =
    defaultKeys.size === 0 ? 100 : Math.round(((defaultKeys.size - missingKeys.length) / defaultKeys.size) * 100);
  console.log(
    `   UI keys:  ${defaultKeys.size - missingKeys.length}/${defaultKeys.size} translated (${coverageKeys}%)`,
  );
  // Print at most 15 missing keys — the list can be long for a fresh locale.
  for (const k of missingKeys.slice(0, 15)) console.log(`   ⬜ missing:  ${k}`);
  if (missingKeys.length > 15) console.log(`   … and ${missingKeys.length - 15} more`);
  if (missingKeys.length > 0) missingUiKeys = true;
  console.log('');
}

if (missingUiKeys) {
  console.log(`❌ Missing UI keys — the locale JSON is behind en.json (template defect).`);
} else {
  console.log(
    missingAnything
      ? `ℹ️ Missing items fall back to English at runtime (articles 404-never, UI deepMerge).`
      : `✅ All locales fully covered.`,
  );
}
if ((STRICT && missingAnything) || (STRICT_UI && missingUiKeys)) process.exit(1);
