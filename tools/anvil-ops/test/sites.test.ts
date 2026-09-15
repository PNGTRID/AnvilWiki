import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadSitesRegistry,
  saveSitesRegistry,
  resolveSitePath,
  listSites,
  resolveEffectiveRoot,
  sitesRegistryPath,
} from '../src/core/sites.js';
import { ConfigParseError, OpsError } from '../src/core/errors.js';

function tmpRegistryFile(): string {
  return join(mkdtempSync(join(tmpdir(), 'ops-sites-')), 'sites.toml');
}

function tmpSiteDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ops-sites-repo-'));
  writeFileSync(join(dir, 'wrangler.toml'), '[vars]\nSITE_URL = "https://s.example.com"\n');
  return dir;
}

describe('sites registry load/save', () => {
  it('missing file = empty registry, not an error', () => {
    const reg = loadSitesRegistry(tmpRegistryFile());
    expect(reg.sites).toEqual([]);
    expect(reg.defaultSite).toBeUndefined();
  });

  it('save/load roundtrip: optional siteUrl omitted when unset, kept when set', () => {
    const p = tmpRegistryFile();
    saveSitesRegistry(
      {
        defaultSite: 'main-wiki',
        sites: [
          { name: 'main-wiki', path: '/tmp/main' },
          { name: 'second', path: '/tmp/second', siteUrl: 'https://second.example.com' },
        ],
      },
      p,
    );
    const reg = loadSitesRegistry(p);
    expect(reg.defaultSite).toBe('main-wiki');
    expect(reg.sites[0]).toEqual({ name: 'main-wiki', path: '/tmp/main' });
    expect(reg.sites[1]).toEqual({ name: 'second', path: '/tmp/second', siteUrl: 'https://second.example.com' });
  });

  it('serialized file has no undefined/null keys (TOML has no null)', () => {
    const p = tmpRegistryFile();
    saveSitesRegistry({ sites: [{ name: 'a', path: '/tmp/a' }] }, p);
    const raw = readFileSync(p, 'utf8') as string;
    expect(raw).toContain('[[sites]]');
    expect(raw).toContain('name = "a"');
    expect(raw).not.toContain('siteUrl');
    expect(raw).not.toMatch(/null|undefined/);
  });

  it('save rejects duplicate names', () => {
    const p = tmpRegistryFile();
    expect(() =>
      saveSitesRegistry({ sites: [{ name: 'a', path: '/tmp/a' }, { name: 'a', path: '/tmp/b' }] }, p),
    ).toThrow(/unique/i);
  });

  it('save rejects non-absolute paths', () => {
    const p = tmpRegistryFile();
    expect(() => saveSitesRegistry({ sites: [{ name: 'a', path: 'relative/path' }] }, p)).toThrow(/absolute/i);
  });

  it('TOML parse error throws OpsError with fix guidance', () => {
    const p = tmpRegistryFile();
    writeFileSync(p, 'sites = [ whoops');
    expect(() => loadSitesRegistry(p)).toThrow(OpsError);
    try {
      loadSitesRegistry(p);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as OpsError).fix).toMatch(/sites add|delete/i);
    }
  });

  it('hand-edited registry with a relative path entry is rejected with the entry named', () => {
    const p = tmpRegistryFile();
    writeFileSync(p, '[[sites]]\nname = "a"\npath = "not/absolute"\n');
    expect(() => loadSitesRegistry(p)).toThrow(/sites\[0\].*absolute/s);
  });
});

describe('resolveSitePath', () => {
  it('returns the registered absolute path', () => {
    const p = tmpRegistryFile();
    saveSitesRegistry({ sites: [{ name: 'main-wiki', path: '/tmp/main' }] }, p);
    expect(resolveSitePath('main-wiki', p)).toBe('/tmp/main');
  });

  it('unknown name throws OpsError listing available sites', () => {
    const p = tmpRegistryFile();
    saveSitesRegistry({ sites: [{ name: 'main-wiki', path: '/tmp/main' }] }, p);
    expect(() => resolveSitePath('ghost', p)).toThrow(/main-wiki/);
    try {
      resolveSitePath('ghost', p);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as OpsError).fix).toMatch(/sites add/);
    }
  });

  it('empty registry names the empty state', () => {
    expect(() => resolveSitePath('ghost', tmpRegistryFile())).toThrow(/registry is empty/);
  });
});

describe('listSites', () => {
  it('marks non-existent paths as missing instead of erroring', () => {
    const p = tmpRegistryFile();
    const existing = tmpSiteDir();
    saveSitesRegistry({ sites: [{ name: 'here', path: existing }, { name: 'gone', path: '/nonexistent/gone' }] }, p);
    const sites = listSites(p);
    expect(sites[0]).toMatchObject({ name: 'here', missing: false });
    expect(sites[1]).toMatchObject({ name: 'gone', missing: true });
  });
});

describe('resolveEffectiveRoot', () => {
  it('explicit site name wins over cwd', () => {
    const p = tmpRegistryFile();
    saveSitesRegistry({ sites: [{ name: 'main-wiki', path: '/tmp/main' }] }, p);
    expect(resolveEffectiveRoot({ site: 'main-wiki', cwd: tmpSiteDir(), registryPath: p })).toBe('/tmp/main');
  });

  it('cwd with a site config wins over defaultSite', () => {
    const p = tmpRegistryFile();
    const cwd = tmpSiteDir();
    saveSitesRegistry({ defaultSite: 'other', sites: [{ name: 'other', path: '/tmp/other' }] }, p);
    expect(resolveEffectiveRoot({ cwd, registryPath: p })).toBe(cwd);
  });

  it('defaultSite is used when cwd has no site config', () => {
    const p = tmpRegistryFile();
    const registered = tmpSiteDir();
    saveSitesRegistry({ defaultSite: 'main-wiki', sites: [{ name: 'main-wiki', path: registered }] }, p);
    const empty = mkdtempSync(join(tmpdir(), 'ops-sites-empty-'));
    expect(resolveEffectiveRoot({ cwd: empty, registryPath: p })).toBe(registered);
  });

  it('returns cwd untouched when no site, no config and no defaultSite', () => {
    const empty = mkdtempSync(join(tmpdir(), 'ops-sites-empty-'));
    expect(resolveEffectiveRoot({ cwd: empty, registryPath: tmpRegistryFile() })).toBe(empty);
  });

  it('corrupt cwd wrangler.toml propagates loudly instead of falling back to defaultSite', () => {
    const p = tmpRegistryFile();
    const registered = tmpSiteDir();
    saveSitesRegistry({ defaultSite: 'main-wiki', sites: [{ name: 'main-wiki', path: registered }] }, p);
    // ConfigParseError is NOT an OpsError on purpose: silently redirecting a
    // write command to another registered site's repo would be the worst
    // interpretation of "cwd has no config".
    const corrupt = mkdtempSync(join(tmpdir(), 'ops-sites-corrupt-'));
    writeFileSync(join(corrupt, 'wrangler.toml'), '[vars\nSITE_URL = "broken"\n');
    expect(() => resolveEffectiveRoot({ cwd: corrupt, registryPath: p })).toThrow(/wrangler\.toml/);
    expect(() => resolveEffectiveRoot({ cwd: corrupt, registryPath: p })).toThrow(ConfigParseError);
  });
});

describe('sitesRegistryPath', () => {
  it('honors XDG_CONFIG_HOME when absolute', () => {
    expect(sitesRegistryPath({ XDG_CONFIG_HOME: '/xdg' })).toBe('/xdg/anvil-ops/sites.toml');
  });

  it('ignores relative XDG_CONFIG_HOME and falls back to ~/.config', () => {
    expect(sitesRegistryPath({ XDG_CONFIG_HOME: 'relative' })).toBe(
      join(homedir(), '.config', 'anvil-ops', 'sites.toml'),
    );
  });
});
