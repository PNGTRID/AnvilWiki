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
import * as path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const CONTENT_BASE = path.resolve(process.cwd(), 'src/content/wiki');

// Read navigation categories from config so the prompt stays in sync.
// We avoid importing the .ts directly (would need tsx loader chaining) and
// instead read the file as text — simple and robust.
function readCategories(): string[] {
  try {
    const navPath = path.resolve(process.cwd(), 'src/config/navigation.ts');
    const src = fs.readFileSync(navPath, 'utf8');
    const matches = Array.from(src.matchAll(/key:\s*['"]([^'"]+)['"]/g));
    const keys = matches.map((m) => m[1]);
    return keys.length > 0 ? keys : ['bosses', 'guides', 'items', 'codes'];
  } catch {
    return ['bosses', 'guides', 'items', 'codes'];
  }
}

function readLocales(): string[] {
  try {
    const routingPath = path.resolve(process.cwd(), 'src/i18n/routing.ts');
    const src = fs.readFileSync(routingPath, 'utf8');
    const match = src.match(/locales\s*=\s*\[([^\]]+)\]/);
    if (!match) return ['en'];
    return Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g)).map((m) => m[1]);
  } catch {
    return ['en'];
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const rl = readline.createInterface({ input, output });

  const locales = readLocales();
  const categories = readCategories();

  console.log('\n📝 AnvilWiki — new article scaffold\n');

  const locale =
    (await rl.question(`Locale [${locales.join('/')}], default "en": `)).trim() || 'en';
  if (!locales.includes(locale)) {
    console.error(`❌ Locale "${locale}" not in routing.ts. Available: ${locales.join(', ')}`);
    process.exit(1);
  }

  const category = (await rl.question(`Category [${categories.join('/')}]: `)).trim();
  if (!category) {
    console.error('❌ Category is required.');
    process.exit(1);
  }
  if (!categories.includes(category)) {
    const proceed = (
      await rl.question(`⚠️ "${category}" is not in navigation.ts. Create anyway? [y/N]: `)
    )
      .trim()
      .toLowerCase();
    if (proceed !== 'y') process.exit(0);
  }

  const titleInput = (await rl.question('Article title (e.g. "Gelum Boss Guide"): ')).trim();
  if (!titleInput) {
    console.error('❌ Title is required.');
    process.exit(1);
  }

  const slugInput = (await rl.question(`Slug [${slugify(titleInput)}]: `)).trim();
  const slug = slugify(slugInput || slugify(titleInput));
  if (!slug) {
    console.error('❌ Could not derive a valid slug.');
    process.exit(1);
  }

  const description = (await rl.question('Description (40-165 chars, for SEO): ')).trim();
  if (description.length < 40) {
    console.warn(
      `⚠️ Description is ${description.length} chars — schema requires 40-165. You can edit it later.`,
    );
  }

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
  const template = `---
title: "${titleInput.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
category: "${category}"
date: ${today}
lastModified: ${today}
tags: []
---

## Overview

Start writing here. The first heading should be H2 (the H1 is rendered
automatically from the title above — do not add an H1 in the body).
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
