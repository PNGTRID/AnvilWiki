/**
 * Local-calendar date as YYYY-MM-DD.
 *
 * Content date stamps (frontmatter date/lastModified, audit "as of") must
 * follow the USER'S calendar, not UTC: `new Date().toISOString()` silently
 * rolls back a day for every run between local midnight and 01:00 UTC — and
 * this repo's automations are night owls (03:00 CST runs write yesterday's
 * date for 8 hours every night). Found by dogfooding sync-codes at 03:10 CST.
 */
export function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
