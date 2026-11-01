/**
 * Tutorials line contract (src/content/tutorials/{en,zh}/*.md).
 *
 * The /landing/tutorials hub + articles render zh pages with hreflang pairs
 * pointing at the en twin — a missing half would produce a lying hreflang or
 * a dead alternate. 1:1 slug parity is therefore a hard requirement, plus
 * the bilingual iron rule (en/zh twins share `updated` and `order`) and the
 * body-shape rules the wiki layer enforces via check-content (this
 * collection lives outside src/content/wiki, so it needs its own gate).
 *
 * Build-time Zod covers field TYPES; this suite covers language PAIRING,
 * ordering sanity, body shape, the lib pure functions, and the three
 * fork-removal channels for src/content/tutorials.
 *
 * Pure fs scan (no astro:content under Vitest — see lib/url notes).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  nextInTopic,
  parseTutorialId,
  prevNext,
  sortTutorials,
  TUTORIAL_META,
  tutorialsForLocale,
  tutorialsForPreset,
  tutorialPath,
  type TutorialLike,
} from '~/lib/landing-tutorials';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TUTORIALS_DIR = path.resolve(ROOT, 'src/content/tutorials');

function listTutorials(locale: string): string[] {
  const dir = path.join(TUTORIALS_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
}

function readFrontmatter(locale: string, file: string): Record<string, string> {
  const raw = fs.readFileSync(path.join(TUTORIALS_DIR, locale, file), 'utf8');
  const fm = raw.split('---')[1] ?? '';
  const out: Record<string, string> = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-zA-Z]+):\s*(.+)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function readBody(locale: string, file: string): string {
  const raw = fs.readFileSync(path.join(TUTORIALS_DIR, locale, file), 'utf8');
  return raw.split('---').slice(2).join('---');
}

/** Markdown internal links (href starts with "/"). */
function internalLinks(body: string): string[] {
  return [...body.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
}

describe('tutorials: en/zh parity (hard requirement)', () => {
  it('zh tutorials mirror en tutorials slug-for-slug', () => {
    expect(
      listTutorials('zh'),
      'every en tutorial must have a zh twin (and vice versa)',
    ).toEqual(listTutorials('en'));
  });

  it('frontmatter carries the required fields', () => {
    for (const locale of ['en', 'zh']) {
      for (const file of listTutorials(locale)) {
        const fm = readFrontmatter(locale, file);
        for (const key of ['title', 'description', 'order', 'updated', 'tldr']) {
          expect(fm[key], `${locale}/${file}: missing "${key}"`).toBeTruthy();
        }
      }
    }
  });

  it('en and zh twins share order AND updated (bilingual iron rule)', () => {
    for (const file of listTutorials('en')) {
      const en = readFrontmatter('en', file);
      const zh = readFrontmatter('zh', file);
      expect(zh.order, `${file}: order differs between locales`).toBe(en.order);
      expect(zh.updated, `${file}: updated differs between locales`).toBe(en.updated);
    }
  });

  it('order is unique across the line (single reading path)', () => {
    const seen = new Map<string, string>();
    for (const file of listTutorials('en')) {
      const fm = readFrontmatter('en', file);
      expect(seen.has(fm.order), `en/${file}: duplicate order ${fm.order} (also ${seen.get(fm.order)})`)
        .toBe(false);
      seen.set(fm.order, file);
    }
  });

  it('frontmatter stays inside the Zod bounds (title 80 / description 40-165 / tldr 480)', () => {
    // Mirrors the content.config.ts tutorials schema so a violation fails
    // HERE (fast, per-file message) instead of only at a full build.
    for (const locale of ['en', 'zh']) {
      for (const file of listTutorials(locale)) {
        const fm = readFrontmatter(locale, file);
        expect(fm.title.length, `${locale}/${file}: title >80`).toBeLessThanOrEqual(80);
        expect(
          fm.description.length,
          `${locale}/${file}: description outside 40-165 (${fm.description.length})`,
        ).toBeGreaterThanOrEqual(40);
        expect(fm.description.length, `${locale}/${file}: description outside 40-165`).toBeLessThanOrEqual(165);
        expect(fm.tldr.length, `${locale}/${file}: tldr >480`).toBeLessThanOrEqual(480);
      }
    }
  });
});

describe('tutorials: body shape', () => {
  it('no H1 in the body; the first heading is a question-shaped H2', () => {
    for (const locale of ['en', 'zh']) {
      for (const file of listTutorials(locale)) {
        const body = readBody(locale, file);
        expect(body, `${locale}/${file}: body contains an H1`).not.toMatch(/^# /m);
        const firstHeading = body.match(/^## (.+)$/m)?.[1];
        expect(firstHeading, `${locale}/${file}: body must start with an H2`).toBeTruthy();
        expect(
          firstHeading!.endsWith('?') || firstHeading!.endsWith('？'),
          `${locale}/${file}: first H2 is not question-shaped: "${firstHeading}"`,
        ).toBe(true);
      }
    }
  });

  it('every body carries at least 3 internal links, all trailing-slash', () => {
    for (const locale of ['en', 'zh']) {
      for (const file of listTutorials(locale)) {
        const links = internalLinks(readBody(locale, file));
        expect(links.length, `${locale}/${file}: fewer than 3 internal links`).toBeGreaterThanOrEqual(3);
        for (const href of links) {
          expect(href.endsWith('/'), `${locale}/${file}: internal link without trailing slash: ${href}`)
            .toBe(true);
        }
      }
    }
  });

  it('zh bodies never link bare /landing or /docs paths (twin pages live under /zh/)', () => {
    for (const file of listTutorials('zh')) {
      const body = readBody('zh', file);
      for (const href of internalLinks(body)) {
        if (/^\/landing|^\/docs/.test(href)) {
          expect(href.startsWith('/zh/'), `zh/${file}: locale-less landing link: ${href}`).toBe(true);
        }
      }
    }
  });
});

describe('lib/landing-tutorials pure functions', () => {
  const mk = (id: string, order: number): TutorialLike => ({ id, data: { order } });
  const list = [
    mk('zh/coupon', 2),
    mk('en/codes', 1),
    mk('en/deploy', 5),
    mk('en/ai-day', 3),
    mk('en/coupon', 2),
  ];

  it('parseTutorialId strips .md and rejects junk', () => {
    expect(parseTutorialId('en/codes.md')).toEqual({ locale: 'en', slug: 'codes' });
    expect(parseTutorialId('zh/coupon')).toEqual({ locale: 'zh', slug: 'coupon' });
    expect(parseTutorialId('fr/codes')).toBeNull();
    expect(parseTutorialId('noseparator')).toBeNull();
    expect(parseTutorialId('en/')).toBeNull();
  });

  it('sortTutorials: ascending order; tutorialsForLocale filters one locale', () => {
    expect(sortTutorials(list).map((t) => t.id)).toEqual([
      'en/codes',
      'zh/coupon',
      'en/coupon',
      'en/ai-day',
      'en/deploy',
    ]);
    expect(tutorialsForLocale(list, 'zh').map((t) => t.id)).toEqual(['zh/coupon']);
  });

  it('prevNext stays linear within a locale-filtered list', () => {
    const en = tutorialsForLocale(list, 'en');
    expect(prevNext(en, 'en/codes')).toEqual({ prev: null, next: en[1] });
    expect(prevNext(en, 'en/deploy')).toEqual({ prev: en[2], next: null });
    expect(prevNext(en, 'en/missing')).toEqual({ prev: null, next: null });
  });

  it('nextInTopic prefers the same-topic onward pick and falls back to linear next', () => {
    // Topic map (lib): codes → build-a-game-codes-site/build-a-coupon-site,
    // site → ai-one-day-content-site/start-a-tutorial-site, growth → the rest.
    const line = [
      mk('en/build-a-game-codes-site', 1),
      mk('en/some-future-tutorial', 2), // exists in the line, not yet in TUTORIAL_TOPICS
      mk('en/build-a-coupon-site', 3),
      mk('en/ai-one-day-content-site', 4),
      mk('en/start-a-tutorial-site', 5),
      mk('en/get-indexed-by-google', 6),
      mk('en/game-wiki-monetization', 7),
    ];
    // Same-topic next exists: codes 1 → 3 (skips the unregistered entry).
    expect(nextInTopic(line, 'en/build-a-game-codes-site')?.id).toBe('en/build-a-coupon-site');
    // Unregistered but present in the line → plain linear next.
    expect(nextInTopic(line, 'en/some-future-tutorial')?.id).toBe('en/build-a-coupon-site');
    // Topic exhausted → falls back to the linear next (never dead-ends mid-line).
    expect(nextInTopic(line, 'en/build-a-coupon-site')?.id).toBe('en/ai-one-day-content-site');
    // End of the line → null.
    expect(nextInTopic(line, 'en/game-wiki-monetization')).toBeNull();
    // Id not in the line at all → null (same semantics as handbook prevNext).
    expect(nextInTopic(line, 'en/nonexistent')).toBeNull();
  });

  it('tutorialPath builds locale-correct URLs (trailingSlash always)', () => {
    expect(tutorialPath('en', 'build-a-coupon-site')).toBe('/landing/tutorials/build-a-coupon-site/');
    expect(tutorialPath('zh', 'build-a-coupon-site')).toBe('/zh/landing/tutorials/build-a-coupon-site/');
    expect(tutorialPath('en', '', true)).toBe('/landing/tutorials/');
    expect(tutorialPath('zh', '', true)).toBe('/zh/landing/tutorials/');
  });

  it('tutorialsForPreset groups by TUTORIAL_META preset, sorted by reading order', () => {
    const line = [
      mk('en/build-a-coupon-site', 3),
      mk('en/game-wiki-monetization', 7),
      mk('en/build-a-game-codes-site', 1),
      mk('en/start-a-tutorial-site', 5),
      mk('en/some-future-tutorial', 4), // registered nowhere → lands in NO group
    ];
    expect(tutorialsForPreset(line, 'game-wiki').map((t) => t.id)).toEqual([
      'en/build-a-game-codes-site',
      'en/game-wiki-monetization',
    ]);
    expect(tutorialsForPreset(line, 'coupon-hub').map((t) => t.id)).toEqual(['en/build-a-coupon-site']);
    expect(tutorialsForPreset(line, 'tutorial-hub').map((t) => t.id)).toEqual(['en/start-a-tutorial-site']);
  });

  it('every en tutorial slug is registered in TUTORIAL_META (hub + DirectionCards grouping contract)', () => {
    // The hub sections and the landing direction cards render ONLY what
    // TUTORIAL_META groups — an unregistered slug would silently vanish from
    // the site's face while staying in the collection. Pin registration.
    for (const file of listTutorials('en')) {
      const slug = file.replace(/\.md$/i, '');
      expect(TUTORIAL_META[slug], `tutorial slug missing from TUTORIAL_META: ${slug}`).toBeDefined();
    }
  });
});

describe('tutorials: fork-removal three-channel sync', () => {
  const read = (rel: string) => fs.readFileSync(path.resolve(ROOT, rel), 'utf8');

  it('src/content/tutorials is registered in all three removal channels', () => {
    // apply-template LANDING_PATHS / setup.yml rm line / e2e absence
    // assertions — forgetting any one channel leaves the marketing content
    // behind in forks (v2.31.1-class drift).
    expect(read('scripts/apply-template.ts')).toContain("'src/content/tutorials'");
    expect(read('.github/workflows/setup.yml')).toContain('src/content/tutorials');
    expect(read('scripts/e2e-apply-template.mjs')).toContain('src/content/tutorials');
  });

  it('the tutorials routes + lib are covered by the directory-level channels', () => {
    // The four route paths live under src/pages/landing{,/zh} directories
    // already listed in LANDING_PATHS; the setup.yml rm line lists them
    // explicitly — pin the explicit forms so a future edit cannot drop them.
    const setup = read('.github/workflows/setup.yml');
    for (const p of [
      'src/pages/landing/tutorials.astro',
      'src/pages/landing/tutorials',
      'src/pages/zh/landing/tutorials.astro',
      'src/pages/zh/landing/tutorials',
    ]) {
      expect(setup).toContain(p);
    }
  });

  it('RootGateway is never listed for removal (survive pin echo)', () => {
    // tests/redirects.test.ts owns the survive pin; this echoes it for the
    // tutorials channels so a copy-paste edit cannot drag the component in.
    // The quoted form is what a removal list entry would look like.
    for (const rel of ['scripts/apply-template.ts', '.github/workflows/setup.yml']) {
      expect(read(rel), `${rel}: RootGateway must never be a quoted removal entry`).not.toContain(
        "'src/components/RootGateway.astro'",
      );
    }
    expect(read('scripts/apply-template.ts')).toMatch(/⚠️ NEVER add src\/components\/RootGateway\.astro/);
  });
});
