/**
 * todayIso unit tests — the shared local-calendar date stamp behind every
 * content-writing script (bulk-new-posts / sync-codes / new-post /
 * apply-template / refresh-audit). Regression: the previous inline
 * implementations used `toISOString()` (UTC), so nightly local runs wrote
 * YESTERDAY's date into frontmatter for the whole pre-01:00-UTC window —
 * caught by dogfooding sync-codes at 03:10 CST (wrote 09-09, was 09-10).
 */
import { describe, expect, test } from 'vitest';
import { todayIso } from '../scripts/lib/today';

describe('todayIso', () => {
  test('returns the LOCAL calendar date, not the UTC one', () => {
    const d = new Date();
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(todayIso()).toBe(local);
  });

  test('is zero-padded YYYY-MM-DD', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('never disagrees with toISOString by more than the UTC offset (sanity)', () => {
    // The whole point of the fix: local and UTC dates may differ by one day,
    // never more — guards against a future regression to epoch-based math.
    const utc = new Date().toISOString().slice(0, 10);
    const days = (s: string) => Date.parse(`${s}T00:00:00Z`) / 86_400_000;
    expect(Math.abs(days(todayIso()) - days(utc))).toBeLessThanOrEqual(1);
  });
});
