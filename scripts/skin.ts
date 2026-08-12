/**
 * skin.ts
 *
 * Interactive skinning CLI — automates Part 1-3 of docs/skinning.md.
 *
 *   pnpm skin                   interactive: prompts for game metadata, theme color,
 *                               locales, and categories; rewrites the CONFIG LAYER
 *                               (site.ts, navigation.ts, globals.css, routing.ts,
 *                               ui.ts, locales/*.json, manifest.json) and clears
 *                               the demo CONTENT LAYER (src/content/wiki/* MDX).
 *   pnpm skin --dry-run         print every planned change, write nothing.
 *   pnpm skin --no-clear-content  keep demo MDX files in place.
 *
 * What this does NOT do (left for the user / later parts of skinning.md):
 *   - Part 4: homepage modules (home.hero / start / explore / faq in locales)
 *   - Part 5: real article MDX + nav/overview labels per category
 *   - Part 6: translation of non-English locale JSON
 *   - favicon / hero image files (binary assets, user-provided)
 *
 * Conventions match scripts/new-post.ts: only node builtins, readline/prompts
 * for input, regex-read of config files, emoji-prefixed console output.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = process.cwd();
const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run') || ARGS.includes('-n');
const KEEP_CONTENT = ARGS.includes('--no-clear-content');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REL = (p: string) => path.relative(ROOT, p);
const read = (p: string) => fs.readFileSync(path.resolve(ROOT, p), 'utf8');
const write = (p: string, content: string) => {
  if (DRY_RUN) {
    console.log(`   ${dim('~')} would write ${REL(p)}`);
    return;
  }
  fs.writeFileSync(path.resolve(ROOT, p), content, 'utf8');
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Convert #rrggbb → "H S% L%" (space-separated, no hsl() wrapper, as globals.css expects). */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) {
    console.error(`❌ Invalid hex color "${hex}". Expected #rgb or #rrggbb.`);
    process.exit(1);
  }
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue *= 60;
  }
  return {
    h: Math.round(hue),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

const hslStr = (c: { h: number; s: number; l: number }, lOffset: number) =>
  `${c.h} ${c.s}% ${Math.max(0, Math.min(100, c.l + lOffset))}%`;

/** HSL → #rrggbb (for manifest theme_color). */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Dim a string for dry-run output (ANSI escape; no chalk dependency). */
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

async function ask(rl: readline.Interface, question: string, fallback?: string): Promise<string> {
  const suffix = fallback !== undefined ? ` [${fallback}]: ` : ': ';
  const answer = (await rl.question(question + suffix)).trim();
  return answer || (fallback ?? '');
}

async function askBool(rl: readline.Interface, question: string, fallback = false): Promise<boolean> {
  const answer = (await rl.question(`${question} [${fallback ? 'Y/n' : 'y/N'}]: `))
    .trim()
    .toLowerCase();
  if (!answer) return fallback;
  return answer === 'y' || answer === 'yes';
}

// ---------------------------------------------------------------------------
// Rewriters
// ---------------------------------------------------------------------------

interface SkinInput {
  gameName: string;
  shortName: string;
  domain: string;
  tagline: string;
  description: string;
  legalNotice: string;
  themeHex: string;
  platform: string;
  developer: string;
  genre: string;
  releaseDate: string;
  officialUrl: string;
  locales: string[];
  categories: { key: string; icon: string }[];
  clearContent: boolean;
}

function rewriteSiteTs(input: SkinInput): string {
  // Rewrite the `site` object literal only. Everything else in the file stays.
  const filePath = 'src/config/site.ts';
  const src = read(filePath);
  const newSite = `export const site: SiteConfig = {
  name: '${input.gameName} Wiki',
  shortName: '${input.shortName}',
  description: '${input.description.replace(/'/g, "\\'")}',
  domain: '${input.domain}',
  tagline: '${input.tagline.replace(/'/g, "\\'")}',
  legalNotice: '${input.legalNotice.replace(/'/g, "\\'")}',
  social: {
    official: '${input.officialUrl}',
  },
  game: {
    name: '${input.gameName}',
    platform: '${input.platform}',
    developer: '${input.developer}',
    genre: '${input.genre}',
    releaseDate: '${input.releaseDate}',
  },
};`;
  const siteRe = /export const site: SiteConfig = \{[\s\S]*?\n\};/;
  if (!siteRe.test(src)) {
    console.error(`❌ Could not find site object in ${filePath}. Aborting (file untouched).`);
    process.exit(1);
  }
  return src.replace(siteRe, newSite);
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
  return src.replace(navRe, newArray);
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
  const newVars = `  :root {
    /* Light mode theme color. */
    --nav-theme: ${lightMain};
    --nav-theme-light: ${lightAlt};
  }

  .dark {
    /* Dark mode theme color — slightly deeper. */
    --nav-theme: ${darkMain};
    --nav-theme-light: ${darkAlt};
  }`;
  // The original :root and .dark blocks live inside @layer base { ... }.
  // Replace from the first `:root {` through the closing of `.dark { ... }`.
  const themeRe = /  :root \{[\s\S]*?\.dark \{[\s\S]*?\n  \}/;
  if (!themeRe.test(src)) {
    console.error(`❌ Could not locate :root/.dark theme block in ${filePath}. Aborting.`);
    process.exit(1);
  }
  return src.replace(themeRe, newVars);
}

function rewriteRoutingTs(input: SkinInput): string {
  const filePath = 'src/i18n/routing.ts';
  const src = read(filePath);
  const locs = input.locales.map((l) => `'${l}'`).join(', ');
  const newArray = `export const locales = [${locs}] as const;`;
  // Build LOCALE_LABELS with English defaults for unknown locales.
  const KNOWN: Record<string, string> = {
    en: 'English',
    ja: '日本語',
    zh: '中文',
    ko: '한국어',
    es: 'Español',
    pt: 'Português',
    ru: 'Русский',
    fr: 'Français',
    de: 'Deutsch',
  };
  const labels = input.locales
    .map((l) => `  ${l}: '${KNOWN[l] ?? l}'`)
    .join(',\n');
  const newLabels = `export const LOCALE_LABELS: Record<Locale, string> = {\n${labels},\n};`;
  const localesRe = /export const locales = \[[\s\S]*?\] as const;/;
  const labelsRe = /export const LOCALE_LABELS: Record<Locale, string> = \{[\s\S]*?\};/;
  if (!localesRe.test(src) || !labelsRe.test(src)) {
    console.error(`❌ Could not locate locales/LOCALE_LABELS blocks in ${filePath}. Aborting.`);
    process.exit(1);
  }
  let updated = src.replace(localesRe, newArray);
  updated = updated.replace(labelsRe, newLabels);
  return updated;
}

function rewriteUiTs(input: SkinInput): string {
  const filePath = 'src/i18n/ui.ts';
  const src = read(filePath);
  // Two separate edits:
  //   (a) the contiguous block of `import <loc> from '~/locales/<loc>.json';` lines
  //   (b) the `const messages = { ... }` map entries
  // The `import { defaultLocale, ... } from './routing'` line sits between them
  // and must NOT be touched.
  const imports = input.locales
    .map((l) => `import ${l} from '~/locales/${l}.json';`)
    .join('\n');
  const messagesEntries = input.locales
    .map((l) => `  ${l}: ${l} as Record<string, unknown>,`)
    .join('\n');
  // (a) locale-JSON import block: one or more `import X from '~/locales/X.json';` lines.
  const importBlockRe = /(?:import \w+ from '~\/locales\/\w+\.json';\n)+/;
  // (b) messages map: from `const messages` through the closing `};`.
  const messagesRe = /const messages: Record<Locale, Record<string, unknown>> = \{[\s\S]*?\};/;
  if (!importBlockRe.test(src) || !messagesRe.test(src)) {
    console.error(`❌ Could not rewrite locale imports in ${filePath}. Aborting.`);
    process.exit(1);
  }
  let updated = src.replace(importBlockRe, `${imports}\n`);
  updated = updated.replace(
    messagesRe,
    `const messages: Record<Locale, Record<string, unknown>> = {\n${messagesEntries}\n};`,
  );
  return updated;
}

function rewriteLocaleJson(input: SkinInput, locale: string, existing?: string): string {
  // Start from existing (if any) or a minimal skeleton; reset site/footer/nav/overview.
  let obj: Record<string, unknown> = {};
  if (existing) {
    try {
      obj = JSON.parse(existing);
    } catch {
      obj = {};
    }
  }
  // Always (re)write the site-level strings for this locale.
  obj.site = {
    name: `${input.gameName} Wiki`,
    shortName: input.shortName,
    description: input.description,
    tagline: input.tagline,
    legalNotice: input.legalNotice,
  };
  obj.footer = obj.footer ?? {};
  (obj.footer as Record<string, unknown>).copyrightText = `© ${new Date().getFullYear()} ${input.gameName} Wiki. All rights reserved.`;
  // Clear nav + overview so the user re-fills them in Part 5 once categories are known.
  obj.nav = {};
  obj.overview = {};
  return JSON.stringify(obj, null, 2) + '\n';
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

function clearDemoContent() {
  const base = path.resolve(ROOT, 'src/content/wiki');
  if (!fs.existsSync(base)) return 0;
  let removed = 0;
  for (const localeDir of fs.readdirSync(base)) {
    const localePath = path.join(base, localeDir);
    const stat = fs.statSync(localePath);
    if (!stat.isDirectory()) continue;
    for (const catDir of fs.readdirSync(localePath)) {
      const catPath = path.join(localePath, catDir);
      if (!fs.statSync(catPath).isDirectory()) continue;
      for (const file of fs.readdirSync(catPath)) {
        if (file.endsWith('.mdx') || file.endsWith('.md')) {
          if (!DRY_RUN) fs.unlinkSync(path.join(catPath, file));
          removed++;
        }
      }
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `\n🎨 AnvilWiki skinning CLI — Part 1-3 (base metadata, theme, nav, locales)${DRY_RUN ? ' [DRY RUN]' : ''}\n`,
  );

  const rl = readline.createInterface({ input, output });

  // --- Collect inputs -----------------------------------------------------
  console.log('━'.repeat(60));
  console.log('Game identity');
  console.log('━'.repeat(60));
  const gameName = await ask(rl, 'Full game name', 'Anvil Quest');
  const shortNameDefault = gameName.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase() + ' Wiki';
  const shortName = await ask(rl, 'Short name (PWA / mobile)', shortNameDefault);
  const domain = await ask(rl, 'Domain (no protocol)', 'anvilwiki.pages.dev');
  const tagline = await ask(rl, 'Hero tagline', `Your home for everything ${gameName}`);
  const description = await ask(
    rl,
    'Site description (SEO, 40-165 chars)',
    `Complete ${gameName} wiki with guides, codes, tier lists, and tips. Updated by the community.`,
  );
  const legalNotice = await ask(
    rl,
    'Legal / copyright notice',
    `${gameName} Wiki is a fan-made community site. Not affiliated with or endorsed by the game developer.`,
  );
  const officialUrl = await ask(rl, 'Official game URL', 'https://example.com');

  console.log('\n' + '━'.repeat(60));
  console.log('Theme color');
  console.log('━'.repeat(60));
  const themeHex = await ask(rl, 'Theme color (#rrggbb)', '#f97316');
  const preview = hexToHsl(themeHex);
  console.log(`   → ${themeHex} = HSL(${preview.h}, ${preview.s}%, ${preview.l}%)`);

  console.log('\n' + '━'.repeat(60));
  console.log('Game metadata');
  console.log('━'.repeat(60));
  const platform = await ask(rl, 'Platform', 'Roblox');
  const developer = await ask(rl, 'Developer / studio', 'Forge Studios');
  const genre = await ask(rl, 'Genre', 'Fantasy RPG');
  const releaseDate = await ask(rl, 'Release date (ISO, optional)', '');

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
    console.log('   This will DELETE all demo MDX files under src/content/wiki/*/.');
    console.log('   Directory structure is preserved for you to drop in new content.');
    clearContent = await askBool(rl, 'Clear demo content?', false);
  }

  rl.close();

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
  console.log('   Files to write:');
  console.log('     - src/config/site.ts');
  console.log('     - src/config/navigation.ts');
  console.log('     - src/styles/globals.css (4 theme lines only)');
  console.log('     - src/i18n/routing.ts');
  console.log('     - src/i18n/ui.ts');
  console.log(`     - src/locales/{${uniqueLocales.join(',')}}.json`);
  console.log('     - public/manifest.json');

  if (!DRY_RUN) {
    const proceed = await (async () => {
      const rl2 = readline.createInterface({ input, output });
      const ok = await askBool(rl2, '\nProceed with these changes?', false);
      rl2.close();
      return ok;
    })();
    if (!proceed) {
      console.log('\n🚫 Aborted. No files were changed.');
      process.exit(0);
    }
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

  for (const locale of uniqueLocales) {
    const localePath = `src/locales/${locale}.json`;
    const existing = fs.existsSync(path.resolve(ROOT, localePath))
      ? read(localePath)
      : undefined;
    write(localePath, rewriteLocaleJson(skinInput, locale, existing));
    if (!DRY_RUN) {
      // Ensure content dir exists for this locale.
      fs.mkdirSync(path.resolve(ROOT, 'src/content/wiki', locale), { recursive: true });
    }
    console.log(`   ✅ ${localePath}`);
  }

  write('public/manifest.json', rewriteManifest(skinInput));
  console.log('   ✅ public/manifest.json');

  if (clearContent) {
    const n = clearDemoContent();
    console.log(`   🗑️  Removed ${n} demo MDX file${n === 1 ? '' : 's'} under src/content/wiki/`);
  }

  // --- Next steps --------------------------------------------------------
  console.log('\n' + '━'.repeat(60));
  console.log('✅ Base skinning (Part 1-3) complete.');
  console.log('━'.repeat(60));
  console.log('\n📌 Manual steps remaining (see docs/skinning.md):');
  console.log('   Part 1: Replace favicon files in public/ and hero.webp / hero.svg.');
  console.log('           (CLI cannot generate binary assets.)');
  console.log('   Part 4: Fill homepage modules in src/locales/<locale>.json');
  console.log('           (home.hero / start / explore / faq / updates).');
  console.log('   Part 5: Add real article MDX under src/content/wiki/<locale>/<category>/.');
  console.log('           Then fill nav.<key> + overview.<key> in locale JSONs.');
  console.log('   Part 6: Translate non-English locale JSONs + copy MDX bodies.');
  console.log('   Part 7: After deploy, run `pnpm check-sitemap` to verify all URLs.');
  console.log('\n   Then: pnpm dev    (preview)');
  console.log('         pnpm build  (verify production build)\n');
}

main().catch((err) => {
  console.error('\n❌', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
