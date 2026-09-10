/**
 * new-post.ts
 *
 * Interactive scaffold for creating a new MDX article.
 * Prompts for locale, category, slug, and title, then writes a template
 * MDX file with the correct frontmatter to src/content/wiki/<locale>/<category>/.
 *
 * Usage:
 *   pnpm new-post
 *   pnpm tsx scripts/new-post.ts
 */

import * as fs from 'node:fs';
import { todayIso } from './lib/today';
import * as path from 'node:path';
import { createLinePrompt } from './lib/prompt';

const CONTENT_BASE = path.resolve(process.cwd(), 'src/content/wiki');

// Read navigation categories from config so the prompt stays in sync.
// We avoid importing the .ts directly (would need tsx loader chaining) and
// instead read the file as text — simple and robust. Parse failures must be
// loud: a silent fallback list would prompt against the wrong vocabulary.
function readCategories(): string[] {
  const src = fs.readFileSync(path.resolve(process.cwd(), 'src/config/navigation.ts'), 'utf8');
  const keys = Array.from(src.matchAll(/key:\s*['"]([^'"]+)['"]/g)).map((m) => m[1]);
  if (keys.length === 0) {
    console.error('❌ Could not parse category keys from src/config/navigation.ts.');
    process.exit(1);
  }
  return keys;
}

function readLocales(): string[] {
  const src = fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/routing.ts'), 'utf8');
  const match = src.match(/locales\s*=\s*\[([^\]]+)\]/);
  if (!match) {
    console.error('❌ Could not parse locales from src/i18n/routing.ts.');
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



async function main() {
  const rl = createLinePrompt();

  const locales = readLocales();
  const categories = readCategories();

  console.log('\n📝 AnvilWiki — new article scaffold\n');

  const locale =
    (await rl.ask(`Locale [${locales.join('/')}], default "en": `)).trim() || 'en';
  if (!locales.includes(locale)) {
    console.error(`❌ Locale "${locale}" not in routing.ts. Available: ${locales.join(', ')}`);
    process.exit(1);
  }

  const category = (await rl.ask(`Category [${categories.join('/')}]: `)).trim();
  if (!category) {
    console.error('❌ Category is required.');
    process.exit(1);
  }
  if (!categories.includes(category)) {
    const proceed = (
      await rl.ask(
        `⚠️ "${category}" is not in navigation.ts. Create anyway? The build will FAIL (schema enum) until you add it to NAVIGATION_CONFIG. [y/N]: `,
      )
    )
      .trim()
      .toLowerCase();
    if (proceed !== 'y') process.exit(0);
  }

  const titleInput = (await rl.ask('Article title (e.g. "Emberfang Boss Guide"): ')).trim();
  if (!titleInput) {
    console.error('❌ Title is required.');
    process.exit(1);
  }

  const slugInput = (await rl.ask(`Slug [${slugify(titleInput)}]: `)).trim();
  const slug = slugify(slugInput || slugify(titleInput));
  if (!slug) {
    console.error('❌ Could not derive a valid slug.');
    process.exit(1);
  }

  const description = (await rl.ask('Description (40-165 chars, for SEO): ')).trim();
  if (description.length < 40 || description.length > 165) {
    console.warn(
      `⚠️ Description is ${description.length} chars — schema requires 40-165. The build will fail until you fix it.`,
    );
  }

  // Draft: visible in `pnpm dev`, excluded from the production build.
  const draftAnswer = (
    await rl.ask('Create as draft? (dev-only, not built) [y/N]: ')
  )
    .trim()
    .toLowerCase();
  const draft = draftAnswer === 'y' || draftAnswer === 'yes';

  rl.close();

  // Build the directory and file path.
  const dir = path.join(CONTENT_BASE, locale, category);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${slug}.mdx`);
  if (fs.existsSync(filePath)) {
    console.error(`❌ Already exists: ${filePath}`);
    process.exit(1);
  }

  const today = todayIso();
  // Escape backslashes FIRST, then quotes: an unescaped `\t`/`\G` inside a
  // YAML double-quoted scalar silently corrupts or breaks the frontmatter.
  const yamlQuote = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const template = `---
title: "${yamlQuote(titleInput)}"
description: "${yamlQuote(description)}"
category: "${category}"
date: ${today}
lastModified: ${today}
tags: []
draft: ${draft}
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

  fs.writeFileSync(filePath, template, 'utf8');

  console.log(`\n✅ Created: ${path.relative(process.cwd(), filePath)}`);
  const urlPath = locale === 'en' ? `/${category}/${slug}` : `/${locale}/${category}/${slug}`;
  console.log(`   URL: ${urlPath}`);
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
