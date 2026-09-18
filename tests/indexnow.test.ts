import { describe, expect, test } from 'vitest';
import {
  extractSitemapLocs,
  indexNowKeyFileName,
  isAcceptedIndexNowStatus,
  normalizeIndexNowKey,
  normalizeSiteOrigin,
} from '../scripts/lib/indexnow';

describe('IndexNow protocol helpers', () => {
  test('accepts the documented key alphabet and length, rejects invalid values', () => {
    expect(normalizeIndexNowKey('AbC-12345678')).toBe('AbC-12345678');
    expect(normalizeIndexNowKey('')).toBeNull();
    expect(normalizeIndexNowKey(undefined)).toBeNull();
    expect(() => normalizeIndexNowKey('short')).toThrow(/8-128/);
    expect(() => normalizeIndexNowKey('abcdefgh_')).toThrow(/A-Z/);
    expect(() => normalizeIndexNowKey('a'.repeat(129))).toThrow(/8-128/);
  });

  test('builds the root key filename without changing the configured key', () => {
    expect(indexNowKeyFileName('AbC-12345678')).toBe('AbC-12345678.txt');
  });

  test('extracts and decodes sitemap loc values', () => {
    expect(
      extractSitemapLocs(
        '<urlset><url><loc>https://example.com/a/?x=1&amp;y=2</loc></url></urlset>',
      ),
    ).toEqual(['https://example.com/a/?x=1&y=2']);
  });

  test('normalizes a configured site to its origin', () => {
    expect(normalizeSiteOrigin('https://example.com/path/')).toBe('https://example.com');
    expect(() => normalizeSiteOrigin('ftp://example.com')).toThrow(/http or https/);
  });

  test('treats only protocol success codes as accepted', () => {
    expect(isAcceptedIndexNowStatus(200)).toBe(true);
    expect(isAcceptedIndexNowStatus(202)).toBe(true);
    expect(isAcceptedIndexNowStatus(403)).toBe(false);
  });
});
