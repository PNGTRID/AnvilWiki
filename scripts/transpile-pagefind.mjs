/**
 * Postbuild hardening for the Pagefind bundles (runs right after
 * `pagefind --site dist`).
 *
 * 1. Transpile in place down to ES2018: pagefind-ui.js / pagefind.js ship
 *    untranspiled and full of optional chaining (?.) — a SyntaxError on old
 *    in-app webviews (WeChat X5, pre-13.4 Safari WebKit). PagefindUI then
 *    never mounts and the search dialog opens with no input inside.
 * 2. Cache-bust the runtime fetches with a per-deploy version query. The
 *    zone-level Browser Cache TTL clamps cache-control to 4h, which would
 *    keep serving a fixed bundle (or stale index hashes) for up to 4 hours
 *    after every deploy; a content-hash query on the UI import (HTML), the
 *    entry/worker references (pagefind.js) makes each deploy take effect
 *    immediately. Import specifiers, wasm and fragment assets are untouched.
 * 3. Lower range-syntax media queries (`width>=640px`) back to `min-width:`.
 *    Astro 7's scoped-style serializer emits range syntax in inline HTML
 *    styles regardless of cssMinify/inlineStylesheet config; pre-2023
 *    kernels (old X5, Safari <16.4) drop the whole rule at parse time.
 *    min-/max-width form is syntax-equivalent and universally supported.
 *    The WHOLE prelude (everything between `@media` and the following `{`)
 *    is captured, so compound preludes like
 *    `(hover: hover) and (width >= 768px)` get every parenthesized group
 *    lowered — a first-group-only matcher would leak the range syntax in
 *    the second group to the exact engines this guard exists for.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';

/**
 * Lower range syntax in EVERY parenthesized group of an @media prelude.
 * Exported for the contract tests — importing this module must not touch
 * dist/, so the CLI flow lives in main() behind the main-module guard.
 *
 * The rewrite rules per group are exactly the historic ones: `(width >= X)`
 * → `(min-width:X)`, `(height <= X)` → `(max-height:X)` (operator + trailing
 * whitespace collapse into the colon). Groups without a range, and preludes
 * without any range, pass through byte-for-byte; a paren-leading prelude
 * keeps the historic collapsed output shape (`@media(min-width:640px)`).
 * Nested parens inside a group (calc() in a feature range) are not lowered —
 * never emitted by Astro's scoped-style serializer.
 */
export const lowerRangeMedia = (s) =>
  s.replace(/@media\s*([^{}]+?)(?=\s*\{)/g, (media, prelude) => {
    if (!/(width|height)\s*(>=|<=)/.test(prelude)) return media;
    const lowered = prelude.replace(
      /\(([^()]*)\)/g,
      (group, cond) =>
        /(width|height)\s*(>=|<=)/.test(cond)
          ? `(${cond
              .replace(/\b(width|height)\s*>=\s*/g, 'min-$1:')
              .replace(/\b(width|height)\s*<=\s*/g, 'max-$1:')})`
          : group,
    );
    // Historic output shape: paren-leading preludes collapse the space after
    // @media (pre-D4 form); any other prelude keeps one separator space.
    return prelude.startsWith('(') ? `@media${lowered}` : `@media ${lowered}`;
  });

const main = async () => {
  const dist = join(process.cwd(), 'dist');
  const dir = join(dist, 'pagefind');

  // 1. Syntax lowering for every bundle.
  const files = (await readdir(dir)).filter((f) => f.endsWith('.js'));
  let lowered = 0;
  for (const file of files) {
    const path = join(dir, file);
    const source = await readFile(path, 'utf8');
    const { code } = await transform(source, {
      loader: 'js',
      target: ['es2018'],
      charset: 'utf8',
    });
    if (code !== source) {
      await writeFile(path, code);
      lowered++;
    }
  }

  // 2. Per-deploy version query (hash of the lowered UI bundle).
  const ui = await readFile(join(dir, 'pagefind-ui.js'), 'utf8');
  const v = createHash('sha256').update(ui).digest('hex').slice(0, 10);
  /* Only template-literal URL constructions are versioned: in the shipped
     bundles every fetch/import site ends with the filename right before a
     closing backtick, while regex literals (`/^(.*\/)pagefind.js.*$/` — the
     basePath derivation) and prose strings ("cached pagefind.js file") do not.
     A blanket replace would inject `?v=` into those too; inside a regex `?`
     is a quantifier, permanently breaking the match (verified against the
     1.5.2 bundles: 8 backtick sites versioned, 3 regex + 2 prose untouched). */
  const versioned = (s) =>
    s.replace(/(pagefind-entry\.json|pagefind-worker\.js|pagefind\.js)(?=`)/g, (m) => `${m}?v=${v}`);

  for (const file of files) {
    const path = join(dir, file);
    const source = await readFile(path, 'utf8');
    const next = versioned(source);
    if (next !== source) await writeFile(path, next);
  }

  // 3. Version the UI import in every built HTML page.
  const walkHtml = async (d) => {
    const entries = [];
    for (const name of await readdir(d, { withFileTypes: true })) {
      const p = join(d, name.name);
      if (name.isDirectory()) entries.push(...(await walkHtml(p)));
      else if (name.name.endsWith('.html')) entries.push(p);
    }
    return entries;
  };

  // 4. Range-syntax media query lowering (applies to HTML *and* built CSS so
  // the guard holds no matter which pipeline a stylesheet went through).
  const htmlPages = await walkHtml(dist);
  let bustHtml = 0;
  let loweredMedia = 0;
  for (const path of htmlPages) {
    const source = await readFile(path, 'utf8');
    let next = source;
    if (next.includes('/pagefind/pagefind-ui.js')) {
      next = next.replaceAll('/pagefind/pagefind-ui.js', `/pagefind/pagefind-ui.js?v=${v}`);
      bustHtml++;
    }
    const after = lowerRangeMedia(next);
    if (after !== next) {
      next = after;
      loweredMedia++;
    }
    if (next !== source) await writeFile(path, next);
  }
  for (const file of await readdir(join(dist, '_astro'))) {
    if (!file.endsWith('.css')) continue;
    const path = join(dist, '_astro', file);
    const source = await readFile(path, 'utf8');
    const next = lowerRangeMedia(source);
    if (next !== source) {
      await writeFile(path, next);
      loweredMedia++;
    }
  }

  console.log(
    `[transpile-pagefind] lowered ${lowered}/${files.length} bundles to ES2018; ` +
      `cache-bust v=${v} applied to ${bustHtml} pages; ` +
      `range-media lowered in ${loweredMedia} files`,
  );
};

// Run the CLI flow only when executed directly (`node
// scripts/transpile-pagefind.mjs` in postbuild) — an import (contract tests)
// must stay side-effect-free.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
