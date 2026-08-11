/**
 * convert-from-seoscout.ts
 *
 * Converts MDX files from the seoscout format (which uses a JS
 * `export const metadata = { ... }` block) to AnvilWiki's YAML frontmatter
 * format (validated by Zod at build time).
 *
 * What it does, per file:
 *   1. Parses the `export const metadata = { ... }` block (best-effort,
 *      handles single-line and multi-line variants).
 *   2. Emits a YAML frontmatter block with the same fields.
 *   3. Strips the JS export line from the body.
 *   4. Writes the result to the output directory, preserving the
 *      <locale>/<category>/<slug>.mdx structure.
 *
 * Usage:
 *   pnpm tsx scripts/convert-from-seoscout.ts <input-dir> <output-dir>
 *   pnpm tsx scripts/convert-from-seoscout.ts requirements/articles src/content/wiki
 *
 * Fields mapped:
 *   title        → title (required)
 *   description  → description (required, 40-165 chars)
 *   category     → category (required)
 *   date         → date (required, ISO)
 *   lastModified → lastModified (optional)
 *   image        → image (optional)
 *   tags         → tags (optional, default [])
 *
 * Files that already use YAML frontmatter (start with `---`) are copied
 * unchanged so the script is idempotent.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface ParsedMeta {
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  lastModified?: string;
  image?: string;
  tags?: string[];
  [k: string]: unknown;
}

function parseMetadataBlock(src: string): { meta: ParsedMeta; body: string } | null {
  // Match `export const metadata = { ... }` — capture the object literal.
  const match = src.match(/export\s+const\s+metadata\s*=\s*\{([\s\S]*?)\n\}\s*;?\s*\n?/);
  if (!match) return null;

  const inner = match[0];
  const body = src.slice(inner.length);

  const meta: ParsedMeta = {};

  // Extract `key: "value"` pairs (string values).
  for (const m of inner.matchAll(/(\w+)\s*:\s*["'`]([^"'`]*)["'`]/g)) {
    (meta as Record<string, string>)[m[1]] = m[2];
  }

  // Extract `tags: ["a", "b"]` arrays.
  const tagsMatch = inner.match(/tags\s*:\s*\[([^\]]*)\]/);
  if (tagsMatch) {
    meta.tags = Array.from(tagsMatch[1].matchAll(/["'`]([^"'`]*)["'`]/g)).map((m) => m[1]);
  }

  // Extract boolean / number values if present (rare in metadata, but safe).
  for (const m of inner.matchAll(/(\w+)\s*:\s*(true|false|\d+(?:\.\d+)?)/g)) {
    const v = m[2];
    (meta as Record<string, unknown>)[m[1]] =
      v === 'true' ? true : v === 'false' ? false : Number(v);
  }

  return { meta, body };
}

function toYaml(meta: ParsedMeta): string {
  const lines: string[] = ['---'];

  const pushStr = (key: string, val: string | undefined, required = false) => {
    if (val === undefined || val === '') {
      if (required) lines.push(`${key}: ""  # TODO: fill in`);
      return;
    }
    // Escape double quotes in the value.
    lines.push(`${key}: "${val.replace(/"/g, '\\"')}"`);
  };

  pushStr('title', meta.title, true);
  pushStr('description', meta.description, true);
  pushStr('category', meta.category, true);
  pushStr('date', meta.date || new Date().toISOString().slice(0, 10));
  pushStr('lastModified', meta.lastModified || meta.date);
  pushStr('image', meta.image);

  if (meta.tags && meta.tags.length > 0) {
    lines.push(`tags: [${meta.tags.map((t) => `"${t}"`).join(', ')}]`);
  } else {
    lines.push('tags: []');
  }

  lines.push('---');
  return lines.join('\n');
}

function convertFile(srcPath: string, destPath: string): 'converted' | 'copied' | 'skipped' {
  const src = fs.readFileSync(srcPath, 'utf8');

  // Already YAML frontmatter → copy unchanged.
  if (src.trimStart().startsWith('---')) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, src, 'utf8');
    return 'copied';
  }

  const parsed = parseMetadataBlock(src);
  if (!parsed) {
    // No metadata block found — wrap the whole body with empty frontmatter.
    console.warn(
      `  ⚠️  No \`export const metadata\` found in ${srcPath}. Generating empty frontmatter.`,
    );
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const yaml = toYaml({});
    fs.writeFileSync(destPath, `${yaml}\n\n${src.trimStart()}\n`, 'utf8');
    return 'converted';
  }

  const { meta, body } = parsed;
  const yaml = toYaml(meta);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, `${yaml}\n\n${body.trimStart()}`, 'utf8');
  return 'converted';
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  const [inputDir, outputDir] = process.argv.slice(2);

  if (!inputDir || !outputDir) {
    console.error('Usage: pnpm tsx scripts/convert-from-seoscout.ts <input-dir> <output-dir>');
    console.error(
      'Example: pnpm tsx scripts/convert-from-seoscout.ts requirements/articles src/content/wiki',
    );
    process.exit(1);
  }

  const inputAbs = path.resolve(process.cwd(), inputDir);
  const outputAbs = path.resolve(process.cwd(), outputDir);

  const files = walk(inputAbs);
  if (files.length === 0) {
    console.log(`\nNo .mdx/.md files found in ${inputAbs}.`);
    console.log('Nothing to convert. (This is OK if you have no articles yet.)');
    process.exit(0);
  }

  console.log(`\n🔄 Converting ${files.length} file(s) from seoscout format...\n`);

  let converted = 0;
  let copied = 0;

  for (const file of files) {
    const rel = path.relative(inputAbs, file);
    const dest = path.join(outputAbs, rel);
    const result = convertFile(file, dest);
    if (result === 'converted') {
      converted++;
      console.log(`  ✏️  ${rel}`);
    } else {
      copied++;
      console.log(`  ✅  ${rel} (already YAML, copied)`);
    }
  }

  console.log(`\n── Done ──`);
  console.log(`  Converted: ${converted}`);
  console.log(`  Copied:   ${copied}`);
  console.log(`  Output:   ${outputAbs}\n`);

  if (converted > 0) {
    console.log('Next steps:');
    console.log('  1. Run pnpm build to verify the converted files pass schema validation.');
    console.log('  2. Manually review a few converted files for correctness.');
  }
}

main();
