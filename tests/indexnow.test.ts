import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  ensureIndexNowKey,
  extractSitemapLocs,
  INDEXNOW_KEY_PATH,
  indexNowKeyFileName,
  isAcceptedIndexNowStatus,
  loadLocalEnv,
  normalizeIndexNowKey,
  normalizeSiteOrigin,
  readIndexNowKeyFile,
  resolveIndexNowKey,
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

  test('generates one stable repository key and reuses it on re-run', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-key-'));
    const first = ensureIndexNowKey(dir);
    const second = ensureIndexNowKey(dir);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.key).toBe(first.key);
    expect(first.key).toMatch(/^[a-f0-9]{64}$/);
    expect(readFileSync(join(dir, INDEXNOW_KEY_PATH), 'utf8')).toBe(`${first.key}\n`);
    expect(readIndexNowKeyFile(dir)).toBe(first.key);
  });

  test('repository key wins over the legacy env fallback and malformed files fail loudly', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-key-'));
    const old = process.env.INDEXNOW_KEY;
    process.env.INDEXNOW_KEY = 'EnvKey-12345678';
    try {
      writeFileSync(join(dir, INDEXNOW_KEY_PATH), 'FileKey-12345678\n');
      expect(resolveIndexNowKey(dir)).toEqual({ key: 'FileKey-12345678', source: 'file' });

      writeFileSync(join(dir, INDEXNOW_KEY_PATH), 'bad_key\n');
      expect(() => resolveIndexNowKey(dir)).toThrow(/8-128/);
    } finally {
      if (old === undefined) delete process.env.INDEXNOW_KEY;
      else process.env.INDEXNOW_KEY = old;
    }
  });

  test('legacy env remains available when the repository key file is absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'idx-key-'));
    const old = process.env.INDEXNOW_KEY;
    process.env.INDEXNOW_KEY = 'EnvKey-12345678';
    try {
      expect(resolveIndexNowKey(dir)).toEqual({ key: 'EnvKey-12345678', source: 'env' });
    } finally {
      if (old === undefined) delete process.env.INDEXNOW_KEY;
      else process.env.INDEXNOW_KEY = old;
    }
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
    expect(writer).toContain('resolveIndexNowKey');
    expect(writer).toContain('CF_PAGES_COMMIT_SHA');
    expect(writer).toContain('.well-known');
    expect(writer).toContain('anvilwiki-deploy.txt');
  });
});

describe('local .env loading (the documented "local .env" rotation copy must actually be read)', () => {
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

describe('submit-indexnow key-source contract (audit round 21 preserved)', () => {
  const cli = readFileSync('scripts/submit-indexnow.ts', 'utf8');

  test('uses the explicit repository key or legacy env, never public/*.txt scanning or submit-time generation', () => {
    // The dangerous retired fallback scanned public/*.txt and could silently
    // adopt a demo key. The new file source is one fixed, explicit path that
    // initialization owns; submission itself never invents or scans keys.
    expect(cli).not.toContain('detectCommittedKey');
    expect(cli).not.toContain('generateLocalKey');
    expect(cli).toContain('resolveIndexNowKey(ROOT)');
    expect(cli).toContain('loadLocalEnv()');
  });
});
