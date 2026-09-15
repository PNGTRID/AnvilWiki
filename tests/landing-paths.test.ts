/**
 * Landing-layer trailing-slash contract — the site builds with
 * trailingSlash:'always' (see lib/url.ts): every internal link must end "/"
 * or each visit 308s once (hreflang pairs that disagree with the served URL
 * waste crawl budget and muddy canonical signals).
 *
 * The landing layer sits OUTSIDE the wiki i18n system, so localizePath()
 * doesn't build its URLs — the routes hand-write hreflang alternates and
 * header togglePaths as string literals. That is exactly where the slash got
 * forgotten (12+ route files plus config/landing.ts landingPath()). This test
 * reads the route sources and pins every href-forming literal to the slashed
 * form, following the file-reading pattern of tests/agents-consistency.test.ts.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { landingPath } from '~/config/landing';
import { handbookPath } from '~/lib/handbook';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every route file rendering through LandingLayout (both landing trees + the two root routes). */
function landingRouteFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.astro')) files.push(full);
    }
  };
  walk(join(root, 'src/pages/landing'));
  walk(join(root, 'src/pages/zh/landing'));
  files.push(join(root, 'src/pages/landing.astro'));
  files.push(join(root, 'src/pages/zh/landing.astro'));
  return files;
}

describe('landing layer trailing-slash contract', () => {
  test('the route sweep actually finds the landing files (no silent empty scan)', () => {
    expect(landingRouteFiles().length).toBeGreaterThanOrEqual(14);
  });

  test('landingPath() ends with "/" for both locales (logo href + toggle fallback)', () => {
    expect(landingPath('en')).toBe('/landing/');
    expect(landingPath('zh')).toBe('/zh/landing/');
  });

  test('handbookPath() (docs hreflang/toggle source) ends with "/"', () => {
    expect(handbookPath('en', '', true)).toBe('/landing/docs/');
    expect(handbookPath('en', 'weekly-ops')).toBe('/landing/docs/weekly-ops/');
    expect(handbookPath('zh', 'weekly-ops')).toBe('/zh/landing/docs/weekly-ops/');
  });

  test('each of the six alternates-bearing landing pages pins its hreflang pair WITH trailing slashes', () => {
    // [route file, en href path, zh href path] — the pages whose alternates
    // used to read `${siteUrl}/landing` and 308'd on every crawler visit.
    const expected: Array<[string, string, string]> = [
      ['src/pages/landing.astro', '/landing/', '/zh/landing/'],
      ['src/pages/zh/landing.astro', '/landing/', '/zh/landing/'],
      ['src/pages/landing/comparison.astro', '/landing/comparison/', '/zh/landing/comparison/'],
      ['src/pages/zh/landing/comparison.astro', '/landing/comparison/', '/zh/landing/comparison/'],
      ['src/pages/landing/community.astro', '/landing/community/', '/zh/landing/community/'],
      ['src/pages/zh/landing/community.astro', '/landing/community/', '/zh/landing/community/'],
    ];
    for (const [rel, enPath, zhPath] of expected) {
      const src = readFileSync(join(root, rel), 'utf8');
      expect(src, `${rel}: missing slashed en hreflang`).toContain(`href: \`\${siteUrl}${enPath}\``);
      expect(src, `${rel}: missing slashed zh hreflang`).toContain(`href: \`\${siteUrl}${zhPath}\``);
    }
  });

  test('every hand-written hreflang href in every landing route ends with "/"', () => {
    const offenders: string[] = [];
    for (const file of landingRouteFiles()) {
      const src = readFileSync(file, 'utf8');
      // Alternates are written as href: `${siteUrl}/landing/...` — capture the path.
      for (const m of src.matchAll(/href:\s*`\$\{siteUrl\}(\/landing[^`]*)`/g)) {
        if (!m[1].endsWith('/')) offenders.push(`${file}: ${m[1]}`);
      }
    }
    expect(offenders, `slashless landing hreflang hrefs:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('every string-literal togglePath in the landing routes ends with "/"', () => {
    const offenders: string[] = [];
    for (const file of landingRouteFiles()) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/togglePath(?:="([^"]+)"|\{([^}]+)\})/g)) {
        const value = (m[1] ?? m[2]).trim();
        // Skip non-literal forms (togglePath={handbookPath(...)} — its output
        // is pinned by the handbookPath() test above).
        if (!value.startsWith('/') || value.endsWith('/')) continue;
        offenders.push(`${file}: ${value}`);
      }
    }
    expect(offenders, `slashless togglePaths:\n${offenders.join('\n')}`).toEqual([]);
  });
});
