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
import { describe, expect, test } from 'vitest';
import digest from '~/components/landing/community-digest.json';

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
});
