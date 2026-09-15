/**
 * check-links.ts
 *
 * Internal-link audit — scans the BUILT site (dist/) for internal <a href>
 * and verifies every link resolves to an existing file. Catches the quiet
 * killers that neither typecheck nor check-sitemap find:
 *
 *   - an MDX body links to /bosses/old-slug after a rename
 *   - a homepage JSON quickLink points at an article that was never written
 *   - English-fallback masks a dead link only on some locales
 *
 * Why dist/ (not MDX source): the built HTML is the single complete truth —
 * it includes links from components, locale JSON, MDX bodies, and the 404
 * page, in every locale, with no AST parsing needed.
 *
 * Usage:
 *   pnpm build && pnpm check-links      # audit dist/
 *
 * Exits 1 on any broken internal link.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { walkFiles } from './lib/walk';

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  console.error('❌ dist/ not found — run `pnpm build` first.');
  process.exit(1);
}

/** Collect every dist HTML file once: path -> URL. */
const htmlFiles = walkFiles(DIST, { exts: ['.html'] });

/** Existing site paths (trailingSlash:'always' — both shapes tolerated on
 *  lookup). "/bosses/x" → exists if dist/bosses/x/index.html or
 *  dist/bosses/x.html exists. */
const knownPaths = new Set<string>(['/']);
for (const file of htmlFiles) {
  // Normalize to forward slashes — path.relative() yields "\" on Windows,
  // which would never match the URL-shaped hrefs.
  const rel = path
    .relative(DIST, file)
    .replace(/\\/g, '/')
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '');
  knownPaths.add('/' + rel.replace(/\/$/, ''));
}

const HREF_RE = /href="(\/[^"]*)"/g;
const broken = new Map<string, string[]>(); // link -> [pages...]
const soft404: string[] = []; // pages whose entire body is "Not Found"
let checked = 0;

for (const file of htmlFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const pagePath = path.relative(DIST, file).replace(/\\/g, '/');
  // A statically-served "Not Found" page returns HTTP 200 — a soft-404 that
  // status-code checks (check-sitemap) can't see. This caught [legal].astro
  // reading route params from Astro.props (all ja legal pages were shells).
  if (src.trim() === 'Not Found') soft404.push(pagePath);
  let m: RegExpExecArray | null;
  while ((m = HREF_RE.exec(src)) !== null) {
    const href = m[1];
    // Skip asset-like and non-page links.
    if (/\.(png|jpe?g|webp|svg|gif|ico|css|js|mjs|json|xml|txt|webmanifest|woff2?|avif)$/i.test(href))
      continue;
    if (href.startsWith('//')) continue;
    checked++;
    const clean = href.split('#')[0].split('?')[0];
    if (clean === '' || clean === '/') continue;
    if (!knownPaths.has(clean.replace(/\/$/, ''))) {
      const list = broken.get(href) ?? [];
      if (list.length < 3) list.push(pagePath);
      broken.set(href, list);
    }
  }
}

console.log(`\n🔗 Internal link audit — ${checked} links across ${htmlFiles.length} pages\n`);

if (soft404.length > 0) {
  console.log(`❌ ${soft404.length} soft-404 page(s) — body is literally "Not Found" (HTTP 200):`);
  for (const p of soft404) console.log(`   ${p}`);
  console.log('');
}

if (broken.size === 0) {
  if (soft404.length === 0) console.log('✅ All internal links resolve.');
  process.exit(soft404.length > 0 ? 1 : 0);
}

console.log(`❌ ${broken.size} broken internal link(s):\n`);
for (const [href, pages] of broken) {
  console.log(`   ${href}`);
  for (const p of pages) console.log(`      ↳ ${p}`);
  if (pages.length === 3) console.log('      ↳ …');
}
process.exit(1);
