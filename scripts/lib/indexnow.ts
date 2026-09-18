/**
 * Shared IndexNow helpers.
 *
 * The protocol allows 8-128 characters from A-Z / a-z / 0-9 / "-".
 * Keep validation in one place so build-time key emission and submission
 * cannot silently disagree.
 */

export const INDEXNOW_KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

export function normalizeIndexNowKey(raw: string | undefined | null): string | null {
  const value = raw?.trim() ?? '';
  if (!value) return null;
  if (!INDEXNOW_KEY_RE.test(value)) {
    throw new Error(
      'INDEXNOW_KEY must be 8-128 characters using only A-Z, a-z, 0-9, or "-".',
    );
  }
  return value;
}

export function indexNowKeyFileName(key: string): string {
  const normalized = normalizeIndexNowKey(key);
  if (!normalized) throw new Error('IndexNow key cannot be empty.');
  return `${normalized}.txt`;
}

export function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

export function extractSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXmlEntities(match[1].trim()),
  );
}

export function normalizeSiteOrigin(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SITE_URL must use http or https, got ${url.protocol}`);
  }
  return url.origin;
}

export function isAcceptedIndexNowStatus(status: number): boolean {
  return status === 200 || status === 202;
}
