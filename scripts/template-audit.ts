/**
 * template-audit.ts
 *
 * Template health check — answers "is this repo still a clean, reusable
 * AnvilWiki template, or has demo residue piled up?" Run it after your first
 * site works, BEFORE copying the repo for your second game (see the learning
 * handbook chapter "Templatize your site").
 *
 * Four checks (mirrors the code/config/content layering in AGENTS.md):
 *   1. Code-layer purity    — src/pages | components | lib must contain ZERO
 *                             demo-game strings. Usage examples inside comments
 *                             are fine; rendered strings are a violation.
 *   2. Config-layer rebrand — site.ts still on the demo domain / demo game
 *                             name? nav keys consistent with content dirs?
 *   3. Content-layer state  — article count per category (empty categories
 *                             surfaced), leftover draft:true files.
 *   4. Reskin leftovers     — demo artwork files, demo article content,
 *                             demo wrangler.toml [vars].
 *
 * Output: ✅ pass / ⚠️ attention / ❌ violation per item + a one-line health
 * score ("模板健康度 N/10"). Exit 1 only on ❌ violations (things that mean
 * the layering contract is broken); ⚠️ warnings are expected on the demo
 * repo itself and exit 0.
 *
 * Style matches check-config.ts: node builtins only, no deps, emoji output.
 *
 * Usage: pnpm template-audit
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DEMO_ARTICLE_IMAGES,
  DEMO_COVERS,
  DEMO_DOMAINS,
  DEMO_GALLERY_IMAGES,
  DEMO_PUBLIC_FILES,
  isDemoPublicFileContent,
} from './lib/apply-rewrites';
import { walkFiles } from './lib/walk';

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.resolve(ROOT, p), 'utf8');
const exists = (p: string) => fs.existsSync(path.resolve(ROOT, p));
const REL = (p: string) => path.relative(ROOT, p);

// ---------------------------------------------------------------------------
// Demo markers — the file inventories are IMPORTED from lib/apply-rewrites
// (the single source shared with apply-template's clearDemoAssets and the
// setup.yml rm list, pinned by tests/apply-template.test.ts). Local copies
// drifted before: this file's cover list was missing the v2.6.0 batch.
// ---------------------------------------------------------------------------
const DEMO_GAME_NAME = 'Anvil Quest';
/** Demo-game identifiers that must never appear in RENDERED code-layer output. */
const DEMO_CODE_STRINGS = ['anvil quest', 'anvilquest', 'emberfang', 'stormcaller'];
const DEMO_GISCUS_MARKERS = ['PNGTRID/AnvilWiki', 'R_kgDOT1aRPQ'];

let passed = 0;
let total = 0;
const violations: string[] = [];
const warnings: string[] = [];
const ok = (msg: string) => {
  passed++;
  console.log(`  ✅ ${msg}`);
};
const warn = (msg: string) => {
  warnings.push(msg);
  console.log(`  ⚠️  ${msg}`);
};
const fail = (msg: string) => {
  violations.push(msg);
  console.log(`  ❌ ${msg}`);
};
const info = (msg: string) => console.log(`  ℹ️  ${msg}`);
const check = (fn: () => void) => {
  total++;
  fn();
};

// ---------------------------------------------------------------------------
// Comment stripping (check 1): doc comments legitimately USE demo names as
// examples ("<StatBar label=\"Emberfang Shard\" />") — only strings that
// actually render are violations. Strip /* */ + <!-- --> + // comments while
// preserving line numbers.
// ---------------------------------------------------------------------------
function stripComments(src: string, isAstro: boolean): string {
  let out = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (isAstro) {
    out = out.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  }
  return out
    .split('\n')
    .map((line) => {
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] !== '/' || line[i + 1] !== '/') continue;
        const prev = line[i - 1];
        const next = line[i + 2];
        // Skip URL protocols (https://) and string edges ("//…").
        if (prev === ':' || prev === '"' || prev === "'") continue;
        // A real comment has whitespace or text after "//".
        if (next === undefined || /[\s\p{L}\p{Script=Han}]/u.test(next)) {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n');
}

console.log('\n🧰 AnvilWiki template health check\n');
console.log('━'.repeat(60));

// ---------------------------------------------------------------------------
// 1. Code-layer purity (framework must carry zero game strings)
// ---------------------------------------------------------------------------
console.log('\n1. 代码层纯净度（src/pages | components | lib 无 demo 游戏字符串）');
check(() => {
  const files = [
    ...walkFiles(path.resolve(ROOT, 'src/pages'), { exts: ['.astro', '.ts', '.js', '.mjs'] }),
    ...walkFiles(path.resolve(ROOT, 'src/components'), { exts: ['.astro', '.ts', '.js', '.mjs'] }),
    ...walkFiles(path.resolve(ROOT, 'src/lib'), { exts: ['.astro', '.ts', '.js', '.mjs'] }),
  ];
  let hits = 0;
  for (const file of files) {
    const stripped = stripComments(read(REL(file)), file.endsWith('.astro'));
    const lines = stripped.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      for (const needle of DEMO_CODE_STRINGS) {
        if (lower.includes(needle)) {
          fail(`${REL(file)}:${i + 1} contains demo string "${needle}" in live code — the framework layer must stay game-agnostic (AGENTS.md layering).`);
          hits++;
          break;
        }
      }
    }
  }
  if (hits === 0) ok(`${files.length} code-layer files scanned, zero demo-game strings in live code`);
});

// ---------------------------------------------------------------------------
// 2. Config-layer rebrand
// ---------------------------------------------------------------------------
console.log('\n2. 配置层完整度（site.ts 已换皮 + 分类三处一致）');
const siteSrc = read('src/config/site.ts');
const navSrc = read('src/config/navigation.ts');
const navKeys = Array.from(navSrc.matchAll(/key:\s*['"]([^'"]+)['"]/g)).map((m) => m[1]);

check(() => {
  const domain = siteSrc.match(/^\s*domain:\s*['"]([^'"]+)['"]/m)?.[1];
  if (!domain) {
    fail('could not parse `domain` in src/config/site.ts');
  } else if (DEMO_DOMAINS.includes(domain)) {
    warn(`site.ts domain is still a demo domain ("${domain}") — fine for the demo repo, but a fork must rebrand (pnpm apply-template) before its second site.`);
  } else {
    ok(`site.ts domain "${domain}" is not the demo domain`);
  }
});

check(() => {
  const siteName = siteSrc.match(/^\s*name:\s*['"]([^'"]+)['"]/m)?.[1];
  // Anchor game.name to the exported object (`game: {` immediately followed
  // by `name:`), otherwise the SiteConfig interface's `game: {` matches first.
  const gameName = siteSrc.match(/\bgame:\s*\{\s*name:\s*['"]([^'"]+)['"]/)?.[1];
  if (!siteName || !gameName) {
    fail(`could not parse ${!siteName ? 'site name' : ''}${!siteName && !gameName ? ' or ' : ''}${!gameName ? 'game.name' : ''} in src/config/site.ts`);
  } else {
    const demoFields: string[] = [];
    if (siteName.includes(DEMO_GAME_NAME)) demoFields.push(`site name "${siteName}"`);
    if (gameName === DEMO_GAME_NAME) demoFields.push(`game.name "${gameName}"`);
    if (demoFields.length > 0) {
      warn(`site.ts still carries the demo game in ${demoFields.join(' and ')} — a reusable template should already carry your game's name here.`);
    } else {
      ok(`site.ts identity "${siteName}" / game "${gameName}" is not the demo game`);
    }
  }
});

check(() => {
  let broken = false;
  let enJson: Record<string, any> | null = null;
  try {
    enJson = JSON.parse(read('src/locales/en.json'));
  } catch {
    fail('src/locales/en.json is not valid JSON');
    broken = true;
  }
  for (const key of navKeys) {
    if (enJson && !(key in (enJson.nav ?? {}))) {
      fail(`navigation key "${key}" has no en.json nav.${key} label (3-place rule)`);
      broken = true;
    }
    // A nav key without a content dir is NOT a violation — the list page
    // simply renders the empty state (same call as check-config.ts). The
    // empty category is surfaced as a warning in check 3 below.
    if (!exists(path.join('src/content/wiki/en', key))) {
      info(`src/content/wiki/en/${key}/ does not exist yet (list page shows the empty state)`);
    }
  }
  // Reverse direction: a content dir no nav key points at is unreachable.
  const enDir = path.resolve(ROOT, 'src/content/wiki/en');
  if (fs.existsSync(enDir)) {
    for (const dir of fs.readdirSync(enDir, { withFileTypes: true })) {
      if (dir.isDirectory() && !navKeys.includes(dir.name)) {
        fail(`src/content/wiki/en/${dir.name}/ exists but "${dir.name}" is not a navigation.ts key — the category is unreachable.`);
        broken = true;
      }
    }
  }
  if (!broken) ok(`${navKeys.length} nav keys consistent with en.json labels and content dirs`);
});

// ---------------------------------------------------------------------------
// 3. Content-layer state
// ---------------------------------------------------------------------------
console.log('\n3. 内容层可替换性（每类文章数 + draft 遗留）');
const contentBase = path.resolve(ROOT, 'src/content/wiki');
const locales = fs.existsSync(contentBase)
  ? fs.readdirSync(contentBase, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

check(() => {
  let empty = 0;
  for (const key of navKeys) {
    const dir = path.join(contentBase, 'en', key);
    const count = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).length
      : 0;
    if (count === 0) {
      warn(`category "${key}" has 0 articles in en — its list page shows the empty state.`);
      empty++;
    } else {
      info(`en/${key}: ${count} article${count === 1 ? '' : 's'}`);
    }
  }
  if (empty === 0) ok(`all ${navKeys.length} en categories have articles`);
});

// Non-en locales: informational only (list pages intentionally show the
// empty state per the i18n fallback rules).
for (const loc of locales.filter((l) => l !== 'en')) {
  const counts = navKeys.map((key) => {
    const dir = path.join(contentBase, loc, key);
    return fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).length
      : 0;
  });
  const totalArticles = counts.reduce((a, b) => a + b, 0);
  info(`${loc}: ${totalArticles} article${totalArticles === 1 ? '' : 's'} across ${navKeys.length} categories`);
}

check(() => {
  const drafts = walkFiles(contentBase, { exts: ['.mdx'] })
    .map(REL)
    .filter((rel) => /^draft:\s*true\b/m.test(read(rel)));
  if (drafts.length > 0) {
    warn(`${drafts.length} draft:true file${drafts.length === 1 ? '' : 's'} never built — publish (remove draft) or delete before templating: ${drafts.slice(0, 5).join(', ')}${drafts.length > 5 ? ' …' : ''}`);
  } else {
    ok('no draft:true leftovers in src/content/wiki/');
  }
});

// ---------------------------------------------------------------------------
// 4. Reskin leftovers
// ---------------------------------------------------------------------------
console.log('\n4. 换皮残留（demo 图片资产 + public/ demo 文件 + wrangler.toml demo 值）');

check(() => {
  const found: string[] = [];
  const coversDir = path.resolve(ROOT, 'src/assets/covers');
  if (fs.existsSync(coversDir)) {
    for (const file of fs.readdirSync(coversDir)) {
      if (DEMO_COVERS.includes(file)) found.push(`src/assets/covers/${file}`);
    }
  }
  if (found.length > 0) {
    warn(`demo cover art still present (${found.length}): ${found.join(', ')} — replaced by your own art, or removed by apply-template / setup.yml.`);
  } else {
    ok('no demo covers in src/assets/covers/');
  }
});

check(() => {
  const found: string[] = [];
  const galleryDir = path.resolve(ROOT, 'src/assets/gallery');
  if (fs.existsSync(galleryDir)) {
    for (const file of fs.readdirSync(galleryDir)) {
      if (DEMO_GALLERY_IMAGES.includes(file)) found.push(`src/assets/gallery/${file}`);
    }
  }
  const articlesDir = path.resolve(ROOT, 'public/images/articles');
  if (fs.existsSync(articlesDir)) {
    for (const file of fs.readdirSync(articlesDir)) {
      if (DEMO_ARTICLE_IMAGES.includes(file)) found.push(`public/images/articles/${file}`);
    }
  }
  if (found.length > 0) {
    warn(`demo article artwork still present (${found.length}): ${found.join(', ')}`);
  } else {
    ok('no demo gallery / inline article images');
  }
});

check(() => {
  // Demo public/ residue: the upstream search-console verification token plus
  // the demo Adsterra unit pages (public/ads/<name>.html) — they carry the
  // DEMO's ad-unit keys (config, not template content), so a fork must not
  // inherit them. apply-template's clearDemoAssets and setup.yml delete them;
  // this check catches repos that predate those lists or missed the step.
  const found = DEMO_PUBLIC_FILES.filter((f) => {
    const rel = path.join('public', f);
    if (!exists(rel)) return false;
    return isDemoPublicFileContent(f, read(rel));
  }).map((f) => `public/${f}`);
  if (found.length > 0) {
    warn(`demo public/ files still present (${found.length}): ${found.join(', ')} — deleted by apply-template / setup.yml; on a fork they leak demo ad-unit keys.`);
  } else {
    ok('no demo public/ residue (search-console token + ads unit pages)');
  }
});

check(() => {
  // Content-based (not filename-based): a fork may legitimately name its own
  // page "beginner-guide" or "all-codes", but no real article about THEIR
  // game contains the demo game's name. All 7 demo MDX files do.
  const found = walkFiles(contentBase, { exts: ['.mdx'] })
    .map(REL)
    .filter((rel) => new RegExp(DEMO_GAME_NAME, 'i').test(read(rel)));
  if (found.length > 0) {
    warn(`demo article content still present — ${found.length} file${found.length === 1 ? '' : 's'} still reference the demo game: ${found.slice(0, 8).join(', ')}${found.length > 8 ? ' …' : ''}. Expected on the demo repo; on a fork it means the content layer wasn't replaced (apply-template "Clear demo content").`);
  } else {
    ok('no demo articles in src/content/wiki/');
  }
});

check(() => {
  if (!exists('wrangler.toml')) {
    ok('no wrangler.toml (env managed in the Cloudflare dashboard)');
    return;
  }
  const siteUrl = read('wrangler.toml').match(/^SITE_URL\s*=\s*"([^"]+)"/m)?.[1];
  if (!siteUrl) {
    warn('wrangler.toml has no SITE_URL in [vars] — see docs/deployment.md');
  } else if (DEMO_DOMAINS.some((d) => siteUrl === `https://${d}`)) {
    warn(`wrangler.toml SITE_URL is still the demo "${siteUrl}" — while this file exists it OVERRIDES the dashboard; a fork must edit [vars] or delete the file.`);
  } else {
    ok(`wrangler.toml SITE_URL "${siteUrl}" is not the demo domain`);
  }
});

check(() => {
  if (!exists('wrangler.toml')) {
    ok('no wrangler.toml (nothing to check)');
    return;
  }
  const src = read('wrangler.toml');
  const hit = DEMO_GISCUS_MARKERS.find((m) => src.includes(m));
  if (hit) {
    warn(`wrangler.toml still points comments at the demo Giscus ("${hit}") — fork comments would land in PNGTRID/AnvilWiki discussions.`);
  } else {
    ok('wrangler.toml has no demo Giscus config');
  }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + '━'.repeat(60));
const health = `${passed}/${total}`;
if (violations.length > 0) {
  console.error(`\n❌ 模板健康度：${health} — ${violations.length} 项违反分层契约，先修复 ❌ 再复制第二个站。\n`);
  process.exit(1);
}
if (warnings.length > 0) {
  console.log(`\n⚠️  模板健康度：${health} — 建议修复 ${warnings.length} 项 ⚠️ 后复制第二个站（demo 仓库上这些警告是预期的）。\n`);
} else {
  console.log(`\n✅ 模板健康度：${health} — 模板干净，可以放心复制做下一个站。\n`);
}
