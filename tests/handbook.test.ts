/**
 * Handbook parity + frontmatter gate (docs/handbook/{en,zh}/*.md).
 *
 * The in-site docs center renders zh chapters at /zh/landing/docs with
 * hreflang pairs pointing at the en version — a missing half would produce
 * a lying hreflang or a dead alternate. 1:1 parity is therefore a hard
 * requirement, enforced here (build-time Zod covers field TYPES, this test
 * covers language PAIRING + ordering sanity).
 *
 * Pure fs scan (no astro:content under Vitest — see lib/url notes).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  chaptersForLocale,
  shortTitle,
  handbookPath,
  manualListRows,
  parseHandbookId,
  prevNext,
  sortChapters,
  type ChapterLike,
} from '~/lib/handbook';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HANDBOOK_DIR = path.resolve(ROOT, 'docs/handbook');

function listChapters(locale: string): string[] {
  const dir = path.join(HANDBOOK_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
}

function readFrontmatter(locale: string, file: string): Record<string, string> {
  const raw = fs.readFileSync(path.join(HANDBOOK_DIR, locale, file), 'utf8');
  const fm = raw.split('---')[1] ?? '';
  const out: Record<string, string> = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-zA-Z]+):\s*(.+)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

describe('handbook: en/zh parity (hard requirement)', () => {
  it('zh chapters mirror en chapters slug-for-slug', () => {
    expect(listChapters('zh'), 'every en chapter must have a zh twin (and vice versa)').toEqual(
      listChapters('en'),
    );
  });

  it('en and zh twins share manual + order', () => {
    for (const file of listChapters('en')) {
      const en = readFrontmatter('en', file);
      const zh = readFrontmatter('zh', file);
      expect(zh.manual, `${file}: manual differs between locales`).toBe(en.manual);
      expect(zh.order, `${file}: order differs between locales`).toBe(en.order);
    }
  });

  it('frontmatter carries the required fields', () => {
    for (const locale of ['en', 'zh']) {
      for (const file of listChapters(locale)) {
        const fm = readFrontmatter(locale, file);
        for (const key of ['title', 'description', 'manual', 'order']) {
          expect(fm[key], `${locale}/${file}: missing "${key}"`).toBeTruthy();
        }
        expect(['learn', 'dev'], `${locale}/${file}: manual must be learn|dev`).toContain(
          fm.manual,
        );
      }
    }
  });

  it('order is unique within each manual', () => {
    for (const locale of ['en', 'zh']) {
      const seen = new Map<string, string>();
      for (const file of listChapters(locale)) {
        const fm = readFrontmatter(locale, file);
        const key = `${fm.manual}:${fm.order}`;
        expect(seen.has(key), `${locale}/${file}: duplicate order ${key} (also ${seen.get(key)})`)
          .toBe(false);
        seen.set(key, file);
      }
    }
  });
});

describe('shortTitle: nav label derivation', () => {
  it('takes the text before the first colon', () => {
    expect(shortTitle('去哪挖候选:每天 20 分钟,把候选池填到 10 个')).toBe('去哪挖候选');
    expect(shortTitle('Run Your Site: See It Working in Three Steps')).toBe('Run Your Site');
  });

  it('prefers the earliest colon and handles full-width colons', () => {
    expect(shortTitle('A:B:C')).toBe('A');
    expect(shortTitle('开广告：时机与接入')).toBe('开广告');
  });

  it('appendix dot rule: keeps the part after " · "', () => {
    expect(shortTitle('附录 A · 作死红线总检查表')).toBe('作死红线总检查表');
    expect(shortTitle('Appendix A · The Red-Line Master List')).toBe('The Red-Line Master List');
  });

  it('falls back to the full title', () => {
    expect(shortTitle('加栏目与加语言')).toBe('加栏目与加语言');
  });

  it('frontmatter override wins when non-empty', () => {
    expect(
      shortTitle('让 AI 替你运营:GSC 数据接入、metrics 与 MCP', 'AI 运营与 GSC 接入'),
    ).toBe('AI 运营与 GSC 接入');
    expect(shortTitle('Run Ops with AI: GSC setup, metrics & MCP', 'AI ops & GSC setup')).toBe(
      'AI ops & GSC setup',
    );
  });

  it('blank or absent override falls back to derivation', () => {
    expect(shortTitle('Run Ops with AI: GSC setup, metrics & MCP', '   ')).toBe('Run Ops with AI');
    expect(shortTitle('加栏目与加语言', undefined)).toBe('加栏目与加语言');
  });
});

describe('manualListRows: stage grouping', () => {
  const ch = (stage?: string) => ({ data: { stage } });

  it('inserts a header only when the stage differs from the previous chapter', () => {
    expect(manualListRows([ch('A'), ch('A'), ch('B'), ch()])).toEqual([
      { type: 'stage', label: 'A' },
      { type: 'chapter', chapter: { data: { stage: 'A' } } },
      { type: 'chapter', chapter: { data: { stage: 'A' } } },
      { type: 'stage', label: 'B' },
      { type: 'chapter', chapter: { data: { stage: 'B' } } },
      { type: 'chapter', chapter: { data: {} } },
    ]);
  });

  it('re-opens the header when a stage resumes after an unstaged chapter', () => {
    const rows = manualListRows([ch('A'), ch(), ch('A')]);
    expect(rows.filter((r) => r.type === 'stage')).toEqual([
      { type: 'stage', label: 'A' },
      { type: 'stage', label: 'A' },
    ]);
  });

  it('renders flat when no chapter has a stage (dev manual)', () => {
    expect(manualListRows([ch(), ch(), ch()])).toEqual([
      { type: 'chapter', chapter: { data: {} } },
      { type: 'chapter', chapter: { data: {} } },
      { type: 'chapter', chapter: { data: {} } },
    ]);
  });
});

describe('lib/handbook pure functions', () => {
  const mk = (id: string, manual: 'learn' | 'dev', order: number): ChapterLike => ({
    id,
    data: { manual, order },
  });
  const list = [
    mk('zh/deploy', 'learn', 5),
    mk('en/pick', 'learn', 1),
    mk('en/deploy', 'learn', 4),
    mk('en/customize', 'dev', 2),
    mk('en/pick2', 'learn', 2),
    mk('en/arch', 'dev', 1),
  ];

  it('parseHandbookId strips .md and rejects junk', () => {
    expect(parseHandbookId('en/pick-your-game.md')).toEqual({ locale: 'en', slug: 'pick-your-game' });
    expect(parseHandbookId('zh/launch')).toEqual({ locale: 'zh', slug: 'launch' });
    expect(parseHandbookId('fr/launch')).toBeNull();
    expect(parseHandbookId('noseparator')).toBeNull();
    expect(parseHandbookId('en/')).toBeNull();
  });

  it('sortChapters: learn before dev, order ascending', () => {
    const sorted = sortChapters(list).map((c) => c.id);
    expect(sorted).toEqual(['en/pick', 'en/pick2', 'en/deploy', 'zh/deploy', 'en/arch', 'en/customize']);
  });

  it('chaptersForLocale filters one locale', () => {
    expect(chaptersForLocale(list, 'zh').map((c) => c.id)).toEqual(['zh/deploy']);
  });

  it('prevNext stays inside the same manual', () => {
    const en = chaptersForLocale(list, 'en');
    // Last learn chapter: has a dev chapter after it globally, but next must be null.
    expect(prevNext(en, 'en/deploy')).toEqual({
      prev: { id: 'en/pick2', data: { manual: 'learn', order: 2 } },
      next: null,
    });
    expect(prevNext(en, 'en/pick2').next?.id).toBe('en/deploy');
    expect(prevNext(en, 'en/customize').next).toBeNull();
    expect(prevNext(en, 'en/arch').prev).toBeNull();
    expect(prevNext(en, 'en/missing')).toEqual({ prev: null, next: null });
  });

  it('handbookPath builds locale-correct URLs', () => {
    expect(handbookPath('en', 'pick-your-game')).toBe('/landing/docs/pick-your-game/');
    expect(handbookPath('zh', 'pick-your-game')).toBe('/zh/landing/docs/pick-your-game/');
    expect(handbookPath('zh', '', true)).toBe('/zh/landing/docs/');
  });
});
