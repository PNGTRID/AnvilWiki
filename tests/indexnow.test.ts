import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  ensureRepositoryIndexNowKey,
  extractSitemapLocs,
  INDEXNOW_REPO_KEY_FILE,
  indexNowKeyFileName,
  isAcceptedIndexNowStatus,
  loadLocalEnv,
  normalizeIndexNowKey,
  normalizeSiteOrigin,
  readRepositoryIndexNowKey,
  resolveIndexNowKey,
  resolveRepositorySiteOrigin,
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

describe('repository-backed IndexNow key', () => {
  test('initialization generates once and reruns preserve the same key', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-repo-'));
    const first = ensureRepositoryIndexNowKey(dir, undefined);
    const second = ensureRepositoryIndexNowKey(dir, undefined);

    expect(first.created).toBe(true);
    expect(first.source).toBe('generated');
    expect(first.key).toMatch(/^[a-f0-9]{32}$/);
    expect(second).toEqual({ key: first.key, created: false, source: 'repo' });
    expect(readFileSync(join(dir, INDEXNOW_REPO_KEY_FILE), 'utf8').trim()).toBe(first.key);
  });

  test('initialization migrates a legacy key instead of rotating it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-migrate-'));
    const result = ensureRepositoryIndexNowKey(dir, 'LegacyKey-123456');

    expect(result).toEqual({
      key: 'LegacyKey-123456',
      created: true,
      source: 'env-migrated',
    });
    expect(readRepositoryIndexNowKey(dir)).toBe('LegacyKey-123456');
  });

  test('repo and legacy keys may agree but never silently disagree', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-drift-'));
    writeFileSync(join(dir, INDEXNOW_REPO_KEY_FILE), 'StableKey-123456\n');

    expect(resolveIndexNowKey(dir, 'StableKey-123456')).toEqual({
      key: 'StableKey-123456',
      source: 'repo+env',
    });
    expect(() => resolveIndexNowKey(dir, 'DifferentKey-123456')).toThrow(/disagree/);
  });

  test('production origin resolves from repo config without a GitHub variable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-site-'));
    writeFileSync(join(dir, 'wrangler.toml'), '[vars]\nSITE_URL = "https://wiki.example.test"\n');

    expect(resolveRepositorySiteOrigin(dir, 'https://fallback.example.test', undefined)).toBe(
      'https://wiki.example.test',
    );
  });
});

describe('local .env loading (legacy compatibility)', () => {
  test('fills process.env from a file without clobbering existing values', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-env-'));
    const envPath = join(dir, '.env');
    writeFileSync(envPath, 'IDX_TEST_FROM_FILE=from-file\nIDX_TEST_PRESET=from-file\n');
    process.env.IDX_TEST_PRESET = 'already-set';
    try {
      loadLocalEnv(envPath);
      expect(process.env.IDX_TEST_FROM_FILE).toBe('from-file');
      expect(process.env.IDX_TEST_PRESET).toBe('already-set');
    } finally {
      delete process.env.IDX_TEST_FROM_FILE;
      delete process.env.IDX_TEST_PRESET;
    }
  });

  test('a missing .env file is a silent no-op', () => {
    expect(() => loadLocalEnv(join(mkdtempSync(join(tmpdir(), 'idx-env-')), 'absent.env'))).not.toThrow();
  });
});

describe('submit-indexnow key-source contract', () => {
  const cli = readFileSync('scripts/submit-indexnow.ts', 'utf8');
  const writer = readFileSync('scripts/write-indexnow-key.ts', 'utf8');

  test('never scans public/*.txt and never generates during submit/build', () => {
    expect(cli).not.toContain('detectCommittedKey');
    expect(cli).not.toContain('randomBytes');
    expect(writer).not.toContain('randomBytes');
    expect(cli).toContain('resolveIndexNowKey(ROOT)');
    expect(writer).toContain('resolveIndexNowKey(root)');
  });

  test('production automation can resolve the site from repository config', () => {
    expect(cli).toContain('--site-from-config');
    expect(cli).toContain('resolveRepositorySiteOrigin(ROOT, configuredSiteUrl)');
  });
});
