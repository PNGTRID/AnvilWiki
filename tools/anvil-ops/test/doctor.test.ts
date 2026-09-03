import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runDoctor, formatDoctor } from '../src/core/doctor.js';
import type { GscClient } from '../src/core/providers/gsc.js';
import type { queryCloudflare } from '../src/core/providers/cloudflare.js';

function tmpSite(
  dotenv: string,
  toml = '[vars]\nSITE_URL = "https://wiki.example.com"\nPUBLIC_CF_BEACON_TOKEN = "tag1"\n',
): string {
  const dir = mkdtempSync(join(tmpdir(), 'ops-doctor-'));
  writeFileSync(join(dir, 'wrangler.toml'), toml);
  if (dotenv) writeFileSync(join(dir, '.env'), dotenv);
  return dir;
}

const ghOk = () => ({ ok: true, detail: 'gh version 2.x found' });
const gscOk: GscClient = {
  async query() {
    throw new Error('not used');
  },
  async listAccessibleSites() {
    return ['https://wiki.example.com/'];
  },
};
const cfOk = (async () => ({ totals: { visits: 0 }, pages: [] })) as unknown as typeof queryCloudflare;

describe('runDoctor', () => {
  it('all green when everything configured and reachable', async () => {
    const dir = tmpSite(`CF_API_TOKEN=t\nCF_ACCOUNT_ID=a\nGSC_SERVICE_ACCOUNT_JSON=${JSON.stringify({ client_email: 'e@x', private_key: 'k' })}\n`);
    const r = await runDoctor({ cwd: dir, deps: { ghVersion: ghOk, gscClient: gscOk, cfQuery: cfOk } });
    expect(r.checks.map((c) => c.name)).toEqual(['site-config', 'gh', 'gsc-config', 'gsc-access', 'cf-config', 'cf-access']);
    expect(r.checks.every((c) => c.ok)).toBe(true);
  });

  it('missing SITE_URL fails site-config with fix', async () => {
    const dir = tmpSite('', '[vars]\n');
    const r = await runDoctor({ cwd: dir, deps: { ghVersion: ghOk } });
    const site = r.checks.find((c) => c.name === 'site-config')!;
    expect(site.ok).toBe(false);
    expect(site.fix).toMatch(/SITE_URL/);
  });

  it('gsc-config skipped-ok when GSC not configured (env-gated)', async () => {
    const dir = tmpSite('CF_API_TOKEN=t\nCF_ACCOUNT_ID=a\n');
    const r = await runDoctor({ cwd: dir, deps: { ghVersion: ghOk, cfQuery: cfOk } });
    const gsc = r.checks.find((c) => c.name === 'gsc-config')!;
    expect(gsc.ok).toBe(true);
    expect(r.checks.find((c) => c.name === 'gsc-access')).toBeUndefined();
    // Discoverability contract: the degraded-mode line must carry the setup
    // guide (fix lines only render on FAIL, so the pointer lives in detail).
    expect(gsc.detail).toContain('https://anvilwiki.pages.dev/landing/docs/ai-ops/');
    expect(formatDoctor(r)).toContain('landing/docs/ai-ops');
  });

  it('gsc-access fails when property not shared with SA', async () => {
    const dir = tmpSite(`GSC_SERVICE_ACCOUNT_JSON=${JSON.stringify({ client_email: 'e@x', private_key: 'k' })}\n`);
    const gscNoAccess: GscClient = {
      async query() {
        throw new Error('x');
      },
      async listAccessibleSites() {
        return ['https://other.com/'];
      },
    };
    const r = await runDoctor({ cwd: dir, deps: { ghVersion: ghOk, gscClient: gscNoAccess } });
    const access = r.checks.find((c) => c.name === 'gsc-access')!;
    expect(access.ok).toBe(false);
    expect(access.fix).toMatch(/Users and permissions/);
  });

  it('formatDoctor renders markdown with per-check status', async () => {
    const dir = tmpSite('');
    const r = await runDoctor({ cwd: dir, deps: { ghVersion: ghOk } });
    const md = formatDoctor(r);
    expect(md).toContain('site-config');
    expect(md).toContain('gh');
  });
});
