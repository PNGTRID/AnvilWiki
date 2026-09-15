import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSiteConfig } from '../src/core/site.js';
import { ConfigParseError, OpsError } from '../src/core/errors.js';

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'ops-site-'));
}

describe('loadSiteConfig', () => {
  it('reads [vars] from wrangler.toml in the given dir and strips trailing slash', () => {
    const dir = tmpDir();
    copyFileSync('test/fixtures/wrangler-full.toml', join(dir, 'wrangler.toml'));
    const cfg = loadSiteConfig(dir);
    expect(cfg.root).toBe(dir);
    expect(cfg.siteUrl).toBe('https://wiki.example.com');
    expect(cfg.cfBeaconToken).toBe('beacon123');
  });

  it('walks up parent dirs to find wrangler.toml', () => {
    const dir = tmpDir();
    copyFileSync('test/fixtures/wrangler-minimal.toml', join(dir, 'wrangler.toml'));
    const nested = join(dir, 'a', 'b');
    mkdirSync(nested, { recursive: true });
    const cfg = loadSiteConfig(nested);
    expect(cfg.root).toBe(dir);
    expect(cfg.siteUrl).toBeUndefined();
    expect(cfg.cfBeaconToken).toBeUndefined();
  });

  it('empty beacon token string = undefined (env-gated)', () => {
    const dir = tmpDir();
    writeFileSync(
      join(dir, 'wrangler.toml'),
      '[vars]\nSITE_URL = "https://x.com"\nPUBLIC_CF_BEACON_TOKEN = ""\n',
    );
    const cfg = loadSiteConfig(dir);
    expect(cfg.cfBeaconToken).toBeUndefined();
  });

  it('no wrangler.toml anywhere = OpsError with fix guidance', () => {
    const dir = tmpDir();
    expect(() => loadSiteConfig(dir)).toThrow(/wrangler\.toml/);
  });

  it('corrupt wrangler.toml throws ConfigParseError (NOT OpsError) with path + syntax hint', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'wrangler.toml'), '[vars\nSITE_URL = "broken"\n');
    try {
      loadSiteConfig(dir);
      expect.unreachable('should have thrown');
    } catch (e) {
      // NOT OpsError: resolveEffectiveRoot falls back to another registered
      // site on OpsError — a corrupt config must propagate loudly instead.
      expect(e).not.toBeInstanceOf(OpsError);
      expect(e).toBeInstanceOf(ConfigParseError);
      expect((e as Error).message).toContain(join(dir, 'wrangler.toml'));
      expect((e as Error).message).toMatch(/wrangler\.toml syntax/i);
    }
  });

  it('falls back to .env when wrangler.toml was deleted (learn-manual setup)', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, '.env'), 'SITE_URL=https://env-mode.com/\nPUBLIC_CF_BEACON_TOKEN=envtag\nCF_API_TOKEN=x\n');
    const cfg = loadSiteConfig(dir);
    expect(cfg.source).toBe('.env');
    expect(cfg.root).toBe(dir);
    expect(cfg.siteUrl).toBe('https://env-mode.com');
    expect(cfg.cfBeaconToken).toBe('envtag');
  });

  it('neither wrangler.toml nor .env = OpsError naming both options', () => {
    const dir = tmpDir();
    try {
      loadSiteConfig(dir);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as Error).message).toMatch(/wrangler\.toml/);
      expect((e as Error).message).toMatch(/\.env/);
    }
  });

  it('wrangler.toml takes precedence over .env when both exist', () => {
    const dir = tmpDir();
    copyFileSync('test/fixtures/wrangler-full.toml', join(dir, 'wrangler.toml'));
    writeFileSync(join(dir, '.env'), 'SITE_URL=https://should-not-win.com\n');
    const cfg = loadSiteConfig(dir);
    expect(cfg.source).toBe('wrangler.toml');
    expect(cfg.siteUrl).toBe('https://wiki.example.com');
  });
});
