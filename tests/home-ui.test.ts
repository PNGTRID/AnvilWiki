/**
 * HomePage ↔ en.json contract — HomePage renders straight from the locale
 * JSON `home` namespace. Before the typed-surface fix every access went
 * through `as any`, so an en.json key rename silently blanked homepage
 * blocks with zero gate failures (check-i18n only compares locale↔en, not
 * component↔en). This test regex-scans the component frontmatter+template
 * for `home.<key>[.<sub>]` accesses — including `const <alias> =
 * home.<key>` section aliases — and deep-looks every dotted path up in
 * en.json. The /faq pages' accesses through getHomeFaq() are pinned the
 * same way against `home.faq`. A key rename now fails CI here AND at
 * typecheck (getUi returns `typeof en`) instead of at a user's screen.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import en from '~/locales/en.json';
import { getHomeFaq } from '~/i18n/ui';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const homePage = readFileSync(join(root, 'src/components/home/HomePage.astro'), 'utf8');
const faqPages = [
  'src/pages/faq.astro',
  'src/pages/[locale]/faq.astro',
].map((rel) => ({ rel, src: readFileSync(join(root, rel), 'utf8') }));

const homeJson = en.home as unknown as Record<string, unknown>;

/** Walk a dotted path ("start.cards") through the en.json home object. */
function lookup(path: string): unknown {
  let cur: unknown = homeJson;
  for (const seg of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(seg in (cur as Record<string, unknown>))) {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/** Every `home.<key>[.<sub>]` literal access in the component source. */
function directHomePaths(src: string): string[] {
  const paths: string[] = [];
  for (const m of src.matchAll(/home\.([A-Za-z_]\w*)(?:\??\.([A-Za-z_]\w*))?/g)) {
    paths.push(m[2] ? `${m[1]}.${m[2]}` : m[1]);
  }
  return paths;
}

/** Aliases declared as `const <alias>[: Type] = home.<key>` (section namespaces). */
function homeAliases(src: string): Map<string, string> {
  const aliases = new Map<string, string>();
  for (const m of src.matchAll(/const ([A-Za-z_]\w*)\s*(?::[^=]+)?=\s*home\.([A-Za-z_]\w+)/g)) {
    aliases.set(m[1], m[2]);
  }
  return aliases;
}

/** All access paths: direct `home.x[.y]` literals + `<alias>.<sub>` through declared aliases. */
function collectedHomePaths(): Set<string> {
  const paths = new Set(directHomePaths(homePage));
  for (const [alias, key] of homeAliases(homePage)) {
    for (const m of homePage.matchAll(new RegExp(`\\b${alias}\\.([A-Za-z_]\\w*)`, 'g'))) {
      paths.add(`${key}.${m[1]}`);
    }
  }
  return paths;
}

describe('HomePage ↔ en.json access contract', () => {
  test('the scanner actually sees the component (sanity against silent regex rot)', () => {
    const paths = collectedHomePaths();
    expect(paths.size).toBeGreaterThanOrEqual(10);
    expect(paths).toContain('meta.title');
    expect(paths).toContain('hero.title');
    expect(paths).toContain('start.cards');
  });

  test('every home.<key>[.<sub>] access (incl. aliases) exists in en.json', () => {
    const offenders: string[] = [];
    for (const path of collectedHomePaths()) {
      if (lookup(path) === undefined) offenders.push(path);
    }
    expect(
      offenders,
      `HomePage accesses keys missing from en.json "home":\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('/faq pages ↔ en.json home.faq contract', () => {
  test('home.faq exists with the shape both /faq routes render', () => {
    expect(homeJson.faq).toBeDefined();
    expect(lookup('faq.title')).toBeTypeOf('string');
    expect(lookup('faq.description')).toBeTypeOf('string');
    expect(Array.isArray(lookup('faq.items'))).toBe(true);
  });

  test('every faq.<key> access on both /faq routes exists under en.json home.faq', () => {
    const offenders: string[] = [];
    for (const { rel, src } of faqPages) {
      // Strip comments first — doc blocks mention "src/pages/faq.astro", a
      // filename, not a property access on the faq namespace.
      const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const m of codeOnly.matchAll(/\bfaq\.([A-Za-z_]\w*)/g)) {
        if (lookup(`faq.${m[1]}`) === undefined) offenders.push(`${rel}: faq.${m[1]}`);
      }
    }
    expect(offenders, `missing keys:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('getHomeFaq() serves the en.json namespace (and deep-merges partial locales)', () => {
    expect(getHomeFaq('en')).toEqual(en.home.faq);
    // ja.json carries its own faq; if a key were dropped there, getUi()'s
    // deep-merge must transparently fall back to en (never undefined).
    const jaFaq = getHomeFaq('ja');
    expect(jaFaq.title).toBeTypeOf('string');
    expect(jaFaq.title.length).toBeGreaterThan(0);
    expect(Array.isArray(jaFaq.items)).toBe(true);
  });
});
