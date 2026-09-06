/**
 * sync-codes.ts
 *
 * Deterministic batch updater for codes pages: read a CSV of redeem-code rows
 * and merge them into the structured `codes:` frontmatter array of existing
 * MDX pages under src/content/wiki/<locale>/codes/<slug>.mdx — the mechanical
 * half of the anvil-update-codes skill (see docs/content-pipeline.md).
 *
 * Input columns (header row required, order free, case-insensitive):
 *   locale,slug,code[,status][,reward][,expiryDate][,source]
 *   - locale empty → defaults to "en"; status empty → "active"
 *   - the same slug in every available locale is updated together (codes are
 *     not translated); reward/source text is copied as-given — review
 *     translations on non-en locales afterwards
 *   - lines starting with "#" are comments; blank lines are skipped
 *
 * Merge rules (never invents, never deletes):
 *   - a code not yet on the page is PREPENDED (newest first)
 *   - status expired flips the existing entry and KEEPS it (long-tail SEO)
 *   - empty optional CSV cells keep the existing frontmatter value
 *
 * Target pages must already exist — sync never creates pages (use
 * pnpm new-post / anvil-new-article for that). Every file is parsed and
 * validated BEFORE anything is written (all-or-nothing); a codes block the
 * flat-scalar parser cannot understand aborts loudly instead of rewriting.
 *
 * Usage:
 *   pnpm sync-codes                  # reads codes-sync.csv / codes-sync.tsv at repo root
 *   pnpm sync-codes my-codes.csv     # explicit file
 *   pnpm sync-codes --dry-run        # print the plan, write nothing
 *   pnpm sync-codes --locales=en,ja  # only apply rows for these locales
 *
 * Style matches scripts/bulk-new-posts.ts (node builtins, emoji output).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  mergeCodes,
  parseCodesBlock,
  parseCodesCsv,
  upsertCodesFrontmatter,
  type CodesCsvRow,
  type MergeStats,
} from './lib/sync-codes';

const ROOT = process.cwd();
const CONTENT_BASE = path.resolve(ROOT, 'src/content/wiki');
const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run') || ARGS.includes('-n');

const LOCALES_FLAG = ARGS.find((a) => a.startsWith('--locales'));
const LOCALE_FILTER = LOCALES_FLAG ? LOCALES_FLAG.split('=')[1]?.split(',').map((s) => s.trim()).filter(Boolean) : null;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Same config-reading helper as bulk-new-posts.ts (regex-read, no imports).
function readLocales(): string[] {
  const src = fs.readFileSync(path.resolve(ROOT, 'src/i18n/routing.ts'), 'utf8');
  const match = src.match(/locales\s*=\s*\[([^\]]+)\]/);
  if (!match) {
    console.error('❌ Could not parse locales from src/i18n/routing.ts (expected `locales = [\'…\']`).');
    process.exit(1);
  }
  return Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g)).map((m) => m[1]);
}

function findInputFile(): string | null {
  const isFlag = (a: string) => a.startsWith('--') || a === '-n';
  const argFile = ARGS.find((a) => !isFlag(a));
  if (argFile) {
    const abs = path.resolve(ROOT, argFile);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      console.error(`❌ Input file not found: ${argFile}`);
      return null;
    }
    return argFile;
  }
  for (const candidate of ['codes-sync.csv', 'codes-sync.tsv']) {
    const abs = path.resolve(ROOT, candidate);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return candidate;
  }
  return null;
}

const NO_INPUT_IS_ERROR = ARGS.some((a) => !a.startsWith('--') && a !== '-n');

const inputFile = findInputFile();
if (!inputFile) {
  console.log(`
🔁 AnvilWiki codes sync

No list file found (looked for codes-sync.csv / codes-sync.tsv at the repo root).
Create one, or pass a path explicitly.

Usage:
  pnpm sync-codes                  reads codes-sync.csv (or .tsv) at the repo root
  pnpm sync-codes <file>           explicit list file
  pnpm sync-codes --dry-run        preview the plan, write nothing
  pnpm sync-codes --locales=en,ja  only apply rows for these locales

Expected file (header required, order free; status/reward/expiryDate/source optional):

  locale,slug,code,status,reward,expiryDate,source
  en,all-codes,SUMMER-2026,active,"+500 Gold",Sep 30,Official Discord
  en,all-codes,FROSTPIKE,expired

Rules: new codes are prepended; expired flips keep the entry; empty optional
cells keep the existing values; codes data is synced to every locale that has
the same page. Pages must already exist — sync never creates or deletes.`);
  process.exit(NO_INPUT_IS_ERROR ? 1 : 0);
}

if (LOCALE_FILTER) {
  const locales = readLocales();
  const unknown = LOCALE_FILTER.filter((l) => !locales.includes(l));
  if (unknown.length > 0) {
    console.error(`❌ --locales: unknown locale(s) ${unknown.join(', ')} (routing.ts has: ${locales.join(', ')})`);
    process.exit(1);
  }
}

const locales = readLocales();
const raw = fs.readFileSync(path.resolve(ROOT, inputFile), 'utf8');
const { rows, errors, notes } = parseCodesCsv(raw, locales);

const filtered = LOCALE_FILTER
  ? rows.filter((r) => {
      if (LOCALE_FILTER.includes(r.locale)) return true;
      notes.push(`line ${r.line}: locale "${r.locale}" skipped (--locales filter)`);
      return false;
    })
  : rows;

// Group by target page, preserving first-appearance order.
const groups = new Map<string, CodesCsvRow[]>();
for (const row of filtered) {
  const key = `${row.locale}/${row.slug}`;
  const list = groups.get(key);
  if (list) list.push(row);
  else groups.set(key, [row]);
}

console.log(`\n🔁 AnvilWiki — codes sync (${inputFile})\n`);
for (const note of notes) console.log(`  ℹ️  ${note}`);

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} invalid row${errors.length === 1 ? '' : 's'} — nothing written (fix the list and re-run):\n`);
  for (const e of errors) console.error(`  ❌ ${e}`);
  process.exit(1);
}
if (filtered.length === 0) {
  console.log('\nNothing to do (no rows after filtering).');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Parse + merge every target file BEFORE writing anything (all-or-nothing)
// ---------------------------------------------------------------------------
interface Planned {
  filePath: string;
  label: string;
  output: string;
  stats: MergeStats;
}

const planned: Planned[] = [];
const fileErrors: string[] = [];
for (const [key, group] of groups) {
  const label = `src/content/wiki/${key.replace('/', '/codes/')}.mdx`;
  const filePath = path.join(CONTENT_BASE, key.split('/')[0], 'codes', `${key.split('/')[1]}.mdx`);
  if (!fs.existsSync(filePath)) {
    fileErrors.push(`${label} — target page does not exist (sync never creates pages; create it first)`);
    continue;
  }
  const fileText = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCodesBlock(fileText);
  if ('error' in parsed) {
    fileErrors.push(`${label} — ${parsed.error}`);
    continue;
  }
  const { merged, stats } = mergeCodes(parsed.codes, group);
  const upserted = upsertCodesFrontmatter(fileText, merged, todayIso());
  if ('error' in upserted) {
    fileErrors.push(`${label} — ${upserted.error}`);
    continue;
  }
  planned.push({ filePath, label, output: upserted.output, stats });
}

if (fileErrors.length > 0) {
  console.error(`\n❌ ${fileErrors.length} file${fileErrors.length === 1 ? '' : 's'} cannot be synced — nothing written:\n`);
  for (const e of fileErrors) console.error(`  ❌ ${e}`);
  process.exit(1);
}

const describeStats = (s: MergeStats): string => {
  const parts: string[] = [];
  if (s.added.length > 0) parts.push(`＋ ${s.added.length} new (${s.added.join(', ')})`);
  if (s.expiredFlipped.length > 0) parts.push(`💀 ${s.expiredFlipped.length} expired (${s.expiredFlipped.join(', ')})`);
  if (s.updated.length > 0) parts.push(`⟳ ${s.updated.length} updated (${s.updated.join(', ')})`);
  if (s.unchanged.length > 0) parts.push(`= ${s.unchanged.length} unchanged`);
  return parts.length > 0 ? parts.join(' · ') : 'no changes';
};

if (DRY_RUN) {
  console.log('\n🔍 Dry run — nothing written. Plan:\n');
  for (const p of planned) {
    console.log(`  ${p.label}\n    ${describeStats(p.stats)}`);
  }
  console.log('\nRe-run without --dry-run to write.');
  process.exit(0);
}

let touched = 0;
for (const p of planned) {
  fs.writeFileSync(p.filePath, p.output, 'utf8');
  touched += 1;
  console.log(`  ✅ ${p.label}`);
  console.log(`     ${describeStats(p.stats)}`);
}

console.log(
  `\n📊 Synced ${touched} page${touched === 1 ? '' : 's'}, lastModified → ${todayIso()}. Next:` +
    `\n   1. Review reward/source wording on non-en locales (sync copies text as-given)` +
    `\n   2. Verify: pnpm check-content && pnpm build` +
    `\n   3. Commit the pages (one commit per game keeps history reviewable).`,
);
