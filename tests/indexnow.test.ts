import { readFileSync } from 'node:fs';
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

  test('CLI tolerates pnpm 11 forwarding the standalone script separator', () => {
    const cli = readFileSync('scripts/submit-indexnow.ts', 'utf8');
    expect(cli).toContain("if (arg === '--') continue;");
  });

  test('postbuild emits both ownership and Cloudflare deployment markers when configured', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    const writer = readFileSync('scripts/write-indexnow-key.ts', 'utf8');
    expect(pkg.scripts.postbuild).toContain('scripts/write-indexnow-key.ts');
    expect(writer).toContain('CF_PAGES_COMMIT_SHA');
    expect(writer).toContain('.well-known');
    expect(writer).toContain('anvilwiki-deploy.txt');
  });
});
