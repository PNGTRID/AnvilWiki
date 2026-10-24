/**
 * Contract tests for the community digest data file
 * (src/components/landing/community-digest.json — appended daily by the
 * automation pipeline, spec:
 * docs/superpowers/specs/2026-09-08-community-digest-pipeline.md).
 *
 * CommunityHighlights.astro casts the JSON and deep-reads fields
 * (`r.stats.messages`, `r.quotes.length`, …), so a malformed daily append
 * would only surface as a build crash at render time. These tests pin the
 * spec's mechanical invariants (§4 schema / §5 self-check / §3.5 privacy
 * split) so a bad automation PR goes red in CI before human review.
 *
 * Deliberately NOT pinned here: content-level red lines (fabricated facts,
 * the specific-course review ban). Those are not mechanically checkable
 * without false positives on future legitimate content and stay with the
 * spec checklist + human review at PR merge.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import digest from '~/components/landing/community-digest.json';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

type Raw = Record<string, unknown>;

const data = digest as unknown as {
  schemaVersion: number;
  updated: string;
  since: string;
  categories: { id: string; items: Raw[] }[];
  daily: { date: string; summary: string; topics: string[] }[];
  reports?: Raw[];
};

const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHORT_DATE = /^\d{2}-\d{2}$/;

const CATEGORY_IDS = ['gold', 'pitfalls', 'qa', 'feedback', 'news'];
// Public subset of the 12-dim daily report (spec §3.5). The component
// deep-reads every one of these; exact-key-set also proves the owner-only
// dimensions never leaked in.
const PUBLIC_REPORT_KEYS = [
  'date',
  'stats',
  'quotes',
  'takeaways',
  'qa',
  'resources',
  'faq',
  'topics',
].sort();

// Privacy red line (spec §5 step 5 / §6.2): member identity beyond group
// nicknames must never reach the public file.
const PRIVACY_PATTERNS: [string, RegExp][] = [
  ['wxid', /wxid_\w+/i],
  ['official-account id', /gh_[A-Za-z0-9_]{4,}/],
  ['11-digit phone number', /(?<!\d)1[3-9]\d{9}(?!\d)/],
];

const reports = data.reports ?? [];
const dailyDates = data.daily.map((d) => d.date);

describe('community-digest.json contract (written daily by automation)', () => {
  test('top-level envelope is well-formed', () => {
    expect(data.schemaVersion).toBeGreaterThanOrEqual(2);
    expect(data.updated).toMatch(FULL_DATE);
    expect(data.since).toMatch(FULL_DATE);
  });

  test('categories: the fixed five ids in order, every item shaped for the component', () => {
    expect(data.categories.map((c) => c.id)).toEqual(CATEGORY_IDS);
    for (const cat of data.categories) {
      expect(cat.items.length, `category ${cat.id} is empty`).toBeGreaterThan(0);
      for (const item of cat.items) {
        expect(item.date, `${cat.id} item date`).toMatch(SHORT_DATE);
        if (cat.id === 'qa') {
          expect(typeof item.q, 'qa q').toBe('string');
          expect(item.q).toBeTruthy();
          expect(typeof item.a, 'qa a').toBe('string');
          expect(item.a).toBeTruthy();
        } else {
          expect(typeof item.title, `${cat.id} title`).toBe('string');
          expect(item.title).toBeTruthy();
          expect(typeof item.detail, `${cat.id} detail`).toBe('string');
          expect(item.detail).toBeTruthy();
          if (cat.id === 'feedback') {
            // New items are always "open"; the maintainer flips resolved ones
            // to "resolved" after shipping the fix (spec §3/§4).
            expect(['open', 'resolved'], 'feedback status').toContain(item.status);
          }
        }
        if (item.tags !== undefined) {
          expect(Array.isArray(item.tags), 'tags is an array').toBe(true);
        }
      }
    }
  });

  test('daily: strict YYYY-MM-DD descending, no duplicates, reaches back to since', () => {
    expect(dailyDates.length).toBeGreaterThan(0);
    for (let i = 1; i < dailyDates.length; i++) {
      expect(dailyDates[i] < dailyDates[i - 1], `${dailyDates[i]} after ${dailyDates[i - 1]}`).toBe(
        true,
      );
    }
    expect(dailyDates[dailyDates.length - 1]).toBe(data.since);
  });

  test('every curated item date has a daily line (spec §4 invariant 1)', () => {
    const suffixes = new Set(dailyDates.map((d) => d.slice(5)));
    for (const cat of data.categories) {
      for (const item of cat.items) {
        expect(suffixes.has(String(item.date)), `${cat.id} ${String(item.date)} in daily`).toBe(
          true,
        );
      }
    }
  });

  test('reports: exact public shape the component deep-reads, newest-first, no duplicates', () => {
    expect(reports.length).toBeGreaterThan(0);
    const dates: string[] = [];
    for (const r of reports) {
      expect(Object.keys(r).sort(), 'report keys').toEqual(PUBLIC_REPORT_KEYS);
      expect(r.date).toMatch(FULL_DATE);
      const stats = r.stats as Raw;
      expect(typeof stats.messages).toBe('number');
      expect(typeof stats.speakers).toBe('number');
      expect(typeof stats.peakHour).toBe('string');
      expect(typeof stats.heat).toBe('string');
      for (const key of ['quotes', 'takeaways', 'qa', 'resources', 'faq', 'topics']) {
        expect(Array.isArray(r[key]), `report ${key} is an array`).toBe(true);
      }
      dates.push(String(r.date));
    }
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] < dates[i - 1], `${dates[i]} after ${dates[i - 1]}`).toBe(true);
    }
  });

  test('report dates pair with curated days; newest report matches newest daily line', () => {
    const dailySet = new Set(dailyDates);
    for (const r of reports) {
      expect(dailySet.has(String(r.date)), `report ${String(r.date)} not in daily`).toBe(true);
    }
    expect(reports[0].date).toBe(data.daily[0].date);
  });

  test('daily summary parenthesized counts match the same-day report stats (when present)', () => {
    // The 2026-10-04 entry shipped "（13 条）" beside a same-day stats card
    // reading 12 — the only count in 49 issues of daily prose to contradict
    // its own structured stats field, and both render on the community page.
    // Pinned so this family goes red instead of drifting again. Only
    // parenthesized "N 条" counts are checked (the shape the pipeline
    // actually writes); counts stated in free prose stay unguarded on
    // purpose — that prose is content, not data.
    const statsByDate = new Map(reports.map((r) => [String(r.date), r.stats as Raw]));
    let checked = 0;
    for (const day of data.daily) {
      const m = day.summary.match(/[（(][^（）()]*?(\d+)\s*条[^（）()]*?[）)]/);
      if (!m) continue;
      const stats = statsByDate.get(day.date);
      if (!stats) continue;
      checked += 1;
      expect(
        Number(m[1]),
        `${day.date} summary says （${m[1]} 条） but same-day report stats.messages is ${String(
          stats.messages,
        )}`,
      ).toBe(stats.messages);
    }
    expect(checked, 'count-consistency checker matched nothing — regex or shape drifted').toBeGreaterThan(0);
  });

  test('all-time-high superlatives match the reports-array maximum (when present)', () => {
    // The 2026-10-14 summary shipped "历史新高日（389 条）" while the same
    // file's own reports array holds 432 (09-01) and 404 (09-08) — a
    // superlative with an in-repo fact source contradicting it. Pinned per
    // spec §7.3. Round 48 widened the literal: pinning only "历史新高" let
    // two historical false claims through in synonymous wording — the claim
    // survives a reword, so the gate enumerates the variants
    // (历史新高/破纪录/创纪录/史上最高). A variant may reconcile against ANY
    // numeric stat dimension (messages OR speakers): the 09-29 item
    // "新人涌入创纪录：49 人发言" is true against stats.speakers=49 (the
    // array-wide max) even though its messages=378 is not the messages max —
    // a day violates only when neither dimension reaches its maximum.
    // Verbatim quotes are speech and stay unguarded; windowed phrasing
    // ("五周来新高") is intentionally out of scope — only the all-time claim
    // has a mechanical source here.
    const SUPERLATIVE_VARIANTS = ['历史新高', '破纪录', '创纪录', '史上最高'];
    const statsOf = (fullDate: string): Record<string, number> | undefined => {
      const r = reports.find((x) => String(x.date) === fullDate);
      return r
        ? {
            messages: Number((r.stats as Raw).messages),
            speakers: Number((r.stats as Raw).speakers ?? NaN),
          }
        : undefined;
    };
    const hit = (text: string): string | undefined =>
      SUPERLATIVE_VARIANTS.find((v) => text.includes(v));
    const maxOf = (key: 'messages' | 'speakers'): number =>
      Math.max(...reports.map((r) => Number((r.stats as Raw)[key] ?? NaN)));
    const violates = (text: string, stats: Record<string, number> | undefined): boolean => {
      if (!hit(text) || !stats) return false;
      // Reconcile against any numeric dimension; unknown dimensions (NaN) never pass.
      return !['messages', 'speakers'].some((k) => stats[k] === maxOf(k as 'messages' | 'speakers'));
    };
    const maxMessages = maxOf('messages');
    const maxSpeakers = maxOf('speakers');
    for (const day of data.daily) {
      const stats = statsOf(day.date);
      if (violates(day.summary, stats)) {
        expect.fail(
          `${day.date} summary claims a superlative but stats ${JSON.stringify(stats)} reaches neither array max (messages ${maxMessages}, speakers ${maxSpeakers})`,
        );
      }
    }
    for (const category of data.categories) {
      for (const item of category.items) {
        const text = `${String(item.title ?? '')}${String(item.detail ?? '')}`;
        if (!hit(text)) continue;
        const fullDates = reports
          .map((r) => String(r.date))
          .filter((d) => d.endsWith(`-${String(item.date)}`));
        if (fullDates.length !== 1) continue; // ambiguous year — audit territory, not a gate
        if (violates(text, statsOf(fullDates[0]))) {
          expect.fail(
            `${fullDates[0]} curated item claims a superlative but stats ${JSON.stringify(statsOf(fullDates[0]))} reaches neither array max (messages ${maxMessages}, speakers ${maxSpeakers})`,
          );
        }
      }
    }
    // Liveness: the detector fires on a synthetic violator, so a silent
    // wording/shape drift cannot turn this into a permanently-green no-op.
    const fake = { messages: 389, speakers: 20 };
    expect(violates('历史新高日（389 条）', fake)).toBe(true);
    expect(violates('五周来新高日（389 条）', fake)).toBe(false);
    expect(violates('发言创纪录，热度空前', fake)).toBe(true);
    // A variant reconciles through ANY dimension — mirrors the real 09-29 item.
    expect(violates('新人涌入创纪录：49 人发言', { messages: 378, speakers: 49 })).toBe(false);
  });

  test('owner-only dimensions never leak into the public file (spec §3.5)', () => {
    const leaked = reports
      .flatMap((r) => Object.keys(r))
      .filter((k) =>
        ['unresolved', 'feedbackItems', 'activeMembers', 'newcomers', 'sentiment'].includes(k),
      );
    expect(leaked).toEqual([]);
  });

  test('privacy scan: no wxid / official-account id / phone number anywhere', () => {
    const raw = JSON.stringify(data);
    for (const [name, pattern] of PRIVACY_PATTERNS) {
      expect(raw, name).not.toMatch(pattern);
    }
  });

  test('file ends with exactly one trailing newline (daily-append ping-pong guard)', () => {
    // The 23:00 automation rewrites this file daily; it has twice stripped
    // the trailing newline, churning every later diff and tangling stacked
    // PRs. Pinned so a bare rewrite goes red in CI instead of ping-ponging.
    const raw = readFileSync(join(root, 'src/components/landing/community-digest.json'), 'utf8');
    expect(raw.endsWith('\n'), 'missing trailing newline').toBe(true);
    expect(raw.endsWith('\n\n'), 'more than one trailing newline').toBe(false);
  });
});
