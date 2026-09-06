/**
 * bulk-new-posts.ts
 *
 * Batch scaffold: read a keyword list (CSV or TSV) and create one draft MDX
 * file per row under src/content/wiki/<locale>/<category>/<slug>.mdx — the
 * mechanical half of the "batch inner pages" workflow (the writing half is
 * the .agent/skills/anvil-batch-articles skill; see the learning handbook
 * chapter "Batch-create inner pages").
 *
 * Input columns (header row required, order free, case-insensitive):
 *   locale,category,slug,title[,description]
 *   - locale empty → defaults to "en"
 *   - description empty → a visible TODO placeholder is written (schema needs
 *     40-165 chars even for drafts — build validates every loaded file)
 *   - lines starting with "#" are comments; blank lines are skipped
 *
 * All rows are validated BEFORE anything is written (all-or-nothing on hard
 * errors): locale must be in routing.ts, category must be a navigation.ts
 * key, title ≤ 80 chars, description (when given) 40-165 chars, slugs are
 * normalized + checked for collisions — an existing target file is SKIPPED,
 * never overwritten.
 *
 * Every generated file starts as draft:true (dev-visible, excluded from the
 * production build) so a half-done batch never breaks `pnpm build`.
 *
 * Usage:
 *   pnpm bulk-new-posts                  # reads new-posts.csv / new-posts.tsv at repo root
 *   pnpm bulk-new-posts my-keywords.csv  # explicit file
 *   pnpm bulk-new-posts --dry-run        # print the plan, write nothing
 *   pnpm bulk-new-posts --require-output # exit 1 if 0 articles scaffolded (CI pipeline)
 *
 * Style matches scripts/new-post.ts (node builtins, emoji output).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { isBlankOrComment, parseDelimited } from './lib/delimited';

const ROOT = process.cwd();
const CONTENT_BASE = path.resolve(ROOT, 'src/content/wiki');
const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run') || ARGS.includes('-n');
// Used by auto-content.yml: scaffolding 0 articles (empty list, or every
// row already exists) exits 1 — a pipeline run must not pass all gates
// green and then quietly create no PR at all.
const REQUIRE_OUTPUT = ARGS.includes('--require-output');

const REQUIRED_COLUMNS = ['locale', 'category', 'slug', 'title'] as const;

interface Row {
  line: number;
  locale: string;
  category: string;
  slug: string;
  title: string;
  description: string;
}

// Same config-reading helpers as new-post.ts (regex-read, no imports).
// A silent fallback list would validate rows against the WRONG vocabulary if
// the source format drifts — parse failures must be loud, not papered over.
function readCategories(): string[] {
  const src = fs.readFileSync(path.resolve(ROOT, 'src/config/navigation.ts'), 'utf8');
  const keys = Array.from(src.matchAll(/key:\s*['"]([^'"]+)['"]/g)).map((m) => m[1]);
  if (keys.length === 0) {
    console.error('❌ Could not parse category keys from src/config/navigation.ts (expected `key: \'…\'` entries).');
    process.exit(1);
  }
  return keys;
}

function readLocales(): string[] {
  const src = fs.readFileSync(path.resolve(ROOT, 'src/i18n/routing.ts'), 'utf8');
  const match = src.match(/locales\s*=\s*\[([^\]]+)\]/);
  if (!match) {
    console.error('❌ Could not parse locales from src/i18n/routing.ts (expected `locales = [\'…\']`).');
    process.exit(1);
  }
  return Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g)).map((m) => m[1]);
}

/** Unicode-aware slug: keeps letters/numbers of ANY script (CJK included) so
 * `新手攻略` stays a usable slug — Astro percent-encodes it in URLs. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Minimal RFC-4180-ish delimited parser: shared in scripts/lib/delimited.ts. */

function findInputFile(): string | null {
  const isFlag = (a: string) => a.startsWith('--') || a === '-n';
  const argFile = ARGS.find((a) => !isFlag(a));
  if (argFile) {
    const abs = path.resolve(ROOT, argFile);
    if (!fs.existsSync(abs)) {
      console.error(`❌ Input file not found: ${argFile}`);
      return null;
    }
    if (!fs.statSync(abs).isFile()) {
      console.error(`❌ Input path is not a file: ${argFile}`);
      return null;
    }
    return argFile;
  }
  for (const candidate of ['new-posts.csv', 'new-posts.tsv']) {
    const abs = path.resolve(ROOT, candidate);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return candidate;
  }
  return null;
}

const NO_INPUT_IS_ERROR = ARGS.some((a) => !a.startsWith('--') && a !== '-n');

// ---------------------------------------------------------------------------
// Load + validate
// ---------------------------------------------------------------------------
const inputFile = findInputFile();
if (!inputFile) {
  console.log(`
📖 AnvilWiki bulk article scaffold

No list file found (looked for new-posts.csv / new-posts.tsv at the repo root).
Create one, or pass a path explicitly.

Usage:
  pnpm bulk-new-posts                  reads new-posts.csv (or .tsv) at the repo root
  pnpm bulk-new-posts <file>           explicit list file
  pnpm bulk-new-posts --dry-run        preview the plan, write nothing

Expected file (header required, order free; description optional):

  locale,category,slug,title,description
  en,bosses,iron-maw,"Iron Maw Boss Guide","How to beat Iron Maw in ..."
  en,guides,fishing-tips,Fishing Tips

Generated files start as draft:true — they show in pnpm dev but never reach
the production build until you flip draft off.`);
  // No default file + no explicit path = "nothing to do", not an error.
  // A named-but-missing file IS an error (handled in findInputFile).
  // --require-output flips even this into an error (pipeline usage: a run
  // with no input must fail, not pass green with nothing to PR).
  process.exit(NO_INPUT_IS_ERROR || REQUIRE_OUTPUT ? 1 : 0);
}

const locales = readLocales();
const categories = readCategories();
const raw = fs.readFileSync(path.resolve(ROOT, inputFile), 'utf8');
const { rows: table, unterminatedQuote } = parseDelimited(raw);
if (unterminatedQuote) {
  console.error(`❌ ${inputFile} has an unterminated quoted field — a " opened but never closed. Fix the quoting and re-run.`);
  process.exit(1);
}

if (table.length === 0) {
  console.error(`❌ ${inputFile} is empty.`);
  process.exit(1);
}

// The header is the first non-blank, non-comment row (the list may open
// with "#" comment lines). Row loop below starts after it.
const headerIdx = table.findIndex((cells) => !isBlankOrComment(cells));
if (headerIdx === -1) {
  console.error(`❌ ${inputFile} has no header row (expected columns: ${[...REQUIRED_COLUMNS, 'description'].join(', ')}).`);
  process.exit(1);
}
const headerRow = table[headerIdx];

const header = headerRow.map((h) => h.trim().toLowerCase());
const colIndex = (name: string) => header.indexOf(name);
for (const col of REQUIRED_COLUMNS) {
  if (colIndex(col) === -1) {
    console.error(`❌ Header is missing the "${col}" column (found: ${header.join(', ')}).`);
    process.exit(1);
  }
}

const errors: string[] = [];
const rows: Row[] = [];
const notes: string[] = [];
const seenTargets = new Map<string, number>(); // target path → first line

for (let r = headerIdx + 1; r < table.length; r++) {
  const cells = table[r];
  if (isBlankOrComment(cells)) continue;
  const line = r + 1;
  const get = (name: string) => (cells[colIndex(name)] ?? '').trim();

  let locale = get('locale');
  if (!locale) {
    locale = 'en';
    notes.push(`line ${line}: empty locale → defaulted to "en"`);
  }
  if (!locales.includes(locale)) {
    errors.push(`line ${line}: locale "${locale}" is not in routing.ts (${locales.join(', ')})`);
    continue;
  }

  const category = get('category');
  if (!categories.includes(category)) {
    errors.push(`line ${line}: category "${category}" is not a navigation.ts key (${categories.join(', ')})`);
    continue;
  }

  const title = get('title');
  if (!title) {
    errors.push(`line ${line}: title is empty`);
    continue;
  }
  if (title.length > 80) {
    errors.push(`line ${line}: title is ${title.length} chars (schema max 80)`);
    continue;
  }

  const rawSlug = get('slug');
  const slug = slugify(rawSlug);
  if (!slug) {
    errors.push(`line ${line}: could not derive a valid slug from "${rawSlug}"`);
    continue;
  }
  if (slug !== rawSlug) notes.push(`line ${line}: slug "${rawSlug}" normalized to "${slug}"`);

  let description = get('description');
  if (!description) {
    // The placeholder must itself satisfy the schema (40-165) — with a long
    // title the title-echoed variant would exceed 165 and break the build
    // (drafts are schema-validated too), so fall back to a fixed one.
    const withTitle = `[Draft scaffold] Replace this description (40-165 chars, SEO meta description) for "${title}" before publishing.`;
    description =
      withTitle.length <= 165
        ? withTitle
        : '[Draft scaffold] TODO: replace this with a 40-165 character SEO meta description before publishing.';
    notes.push(`line ${line}: empty description → TODO placeholder written (fill before publishing)`);
  } else if (description.length < 40 || description.length > 165) {
    errors.push(`line ${line}: description is ${description.length} chars (schema requires 40-165)`);
    continue;
  }

  const relPath = path.join('src/content/wiki', locale, category, `${slug}.mdx`);
  const dupLine = seenTargets.get(relPath);
  if (dupLine) {
    errors.push(`line ${line}: "${relPath}" also produced by line ${dupLine} (duplicate slug)`);
    continue;
  }
  seenTargets.set(relPath, line);

  rows.push({ line, locale, category, slug, title, description });
}

// ---------------------------------------------------------------------------
// Report + write
// ---------------------------------------------------------------------------
console.log(`\n📝 AnvilWiki — bulk article scaffold (${inputFile})\n`);

for (const note of notes) console.log(`  ℹ️  ${note}`);

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} invalid row${errors.length === 1 ? '' : 's'} — nothing written (fix the list and re-run):\n`);
  for (const e of errors) console.error(`  ❌ ${e}`);
  process.exit(1);
}

const created: Row[] = [];
const skipped: { row: Row; reason: string }[] = [];
for (const row of rows) {
  const filePath = path.join(CONTENT_BASE, row.locale, row.category, `${row.slug}.mdx`);
  if (fs.existsSync(filePath)) {
    skipped.push({ row, reason: 'target file already exists (never overwritten)' });
    continue;
  }
  created.push(row);
}

const today = todayIso();
// Escape backslashes FIRST, then quotes: an unescaped `\t`/`\G` inside a
// YAML double-quoted scalar silently corrupts or breaks the frontmatter.
const yamlQuote = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const template = (row: Row) => `---
title: "${yamlQuote(row.title)}"
description: "${yamlQuote(row.description)}"
category: "${row.category}"
date: ${today}
lastModified: ${today}
tags: []
draft: true
summary: "One-sentence direct answer (40-60 words). This becomes the Quick
  Answer card and the AI Overviews / featured snippet candidate."
---

## How do I …? ← write section headings as QUESTIONS

Answer the question directly in the FIRST paragraph after the heading,
in 40-60 words. Then expand into details. AI search engines (Google AI
Overviews, ChatGPT, Perplexity) preferentially cite question-shaped
headings followed by a concise direct answer.

## Next question-shaped heading

- Use native Markdown tables for stats (drop rates, loadouts) — they are
  mobile-scrollable and AI-parseable.
- Use ordered lists for step-by-step instructions.
- Do NOT write an H1 in the body — it is rendered from the title above.
`;

if (DRY_RUN) {
  console.log('\n🔍 Dry run — nothing written. Plan:\n');
  for (const row of created) {
    console.log(`  ＋ src/content/wiki/${row.locale}/${row.category}/${row.slug}.mdx  ← "${row.title}"`);
  }
  for (const { row, reason } of skipped) {
    console.log(`  − src/content/wiki/${row.locale}/${row.category}/${row.slug}.mdx  (${reason})`);
  }
  console.log(`\nPlan: create ${created.length}, skip ${skipped.length}. Re-run without --dry-run to write.`);
  process.exit(0);
}

for (const row of created) {
  const dir = path.join(CONTENT_BASE, row.locale, row.category);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${row.slug}.mdx`);
  fs.writeFileSync(filePath, template(row), 'utf8');
  const urlPath = row.locale === 'en' ? `/${row.category}/${row.slug}` : `/${row.locale}/${row.category}/${row.slug}`;
  console.log(`  ✅ Created: ${path.relative(ROOT, filePath)}  (${urlPath})`);
}
for (const { row, reason } of skipped) {
  console.log(`  ⏭️  Skipped: src/content/wiki/${row.locale}/${row.category}/${row.slug}.mdx — ${reason}`);
}

console.log(
  `\n📊 Generated ${created.length} article${created.length === 1 ? '' : 's'}, skipped ${skipped.length}.` +
    `\n   All start as draft:true (excluded from pnpm build). Next:` +
    `\n   1. Fill each body + description (the anvil-batch-articles skill does this in one pass)` +
    `\n   2. Verify: pnpm check-content && pnpm build` +
    `\n   3. Flip draft:false per article when it is ready to ship.`,
);

if (REQUIRE_OUTPUT && created.length === 0) {
  console.error(
    `\n❌ --require-output: 0 articles scaffolded (empty list, or every row already exists). Nothing to open a PR for.`,
  );
  process.exit(1);
}
