import { spawnSync } from 'node:child_process';
import { loadOpsEnv } from './env.js';
import { loadSiteConfig } from './site.js';
import { createGscClient } from './providers/gsc.js';
import type { GscClient } from './providers/gsc.js';
import { queryCloudflare } from './providers/cloudflare.js';
import { OpsError } from './errors.js';

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
}

export interface DoctorDeps {
  ghVersion?: () => { ok: boolean; detail: string; fix?: string };
  gscClient?: GscClient;
  cfQuery?: typeof queryCloudflare;
}

function defaultGhVersion(): { ok: boolean; detail: string; fix?: string } {
  const res = spawnSync('gh', ['--version'], { encoding: 'utf8' });
  if (res.status === 0) return { ok: true, detail: (res.stdout ?? '').split('\n')[0] };
  return {
    ok: false,
    detail: 'gh CLI not found on PATH',
    fix: 'Install GitHub CLI: https://cli.github.com/ (needed for `anvil-ops submit` in P3)',
  };
}

export async function runDoctor(opts: { cwd: string; deps?: DoctorDeps }): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  const deps = opts.deps ?? {};

  // 1. site config
  let siteUrl: string | undefined;
  let beacon: string | undefined;
  // .env lives at the DISCOVERED repo root (site.root), not the cwd — running
  // doctor from a subdirectory must not falsely report "not configured"
  // (metrics/insights already resolve against site.root).
  let siteRoot: string | undefined;
  try {
    const site = loadSiteConfig(opts.cwd);
    siteRoot = site.root;
    siteUrl = site.siteUrl;
    beacon = site.cfBeaconToken;
    if (!site.siteUrl) {
      checks.push({
        name: 'site-config',
        ok: false,
        detail: `config found (${site.source}) but SITE_URL is not set`,
        fix:
          site.source === 'wrangler.toml'
            ? 'Set SITE_URL = "https://your-domain" under [vars] in wrangler.toml (must include https://).'
            : 'Add SITE_URL=https://your-domain to the .env file (your setup has no wrangler.toml — settings live in the Cloudflare dashboard, which anvil-ops cannot read).',
      });
    } else {
      checks.push({
        name: 'site-config',
        ok: true,
        detail: `repo root ${site.root}; SITE_URL=${site.siteUrl} (from ${site.source}); beacon=${site.cfBeaconToken ? 'set' : 'not set'}`,
      });
    }
  } catch (e) {
    const err = e instanceof OpsError ? e : new OpsError(String(e), '');
    checks.push({ name: 'site-config', ok: false, detail: err.message, fix: err.fix || 'Run anvil-ops inside your AnvilWiki fork.' });
  }

  // 2. gh
  const gh = deps.ghVersion ?? defaultGhVersion;
  checks.push({ name: 'gh', ...gh() });

  // 3. env / gsc
  const env = loadOpsEnv(siteRoot ?? opts.cwd);
  if (env.gscServiceAccount && siteUrl) {
    checks.push({ name: 'gsc-config', ok: true, detail: `service account ${env.gscServiceAccount.clientEmail}` });
    const client = deps.gscClient ?? createGscClient({ credential: env.gscServiceAccount, siteUrl });
    try {
      const sites = await client.listAccessibleSites();
      const wanted = siteUrl.endsWith('/') ? siteUrl : siteUrl + '/';
      if (sites.some((s) => s.replace(/\/$/, '') === wanted.replace(/\/$/, ''))) {
        checks.push({ name: 'gsc-access', ok: true, detail: `property ${wanted} accessible` });
      } else {
        checks.push({
          name: 'gsc-access',
          ok: false,
          detail: `property ${wanted} not in accessible list (${sites.length} sites)`,
          fix: 'Search Console > Settings > Users and permissions > Add user, add the service account email as Restricted.',
        });
      }
    } catch (e) {
      checks.push({
        name: 'gsc-access',
        ok: false,
        detail: e instanceof Error ? e.message || e.name : String(e) || 'unknown error',
        fix: 'Check the service account key and property sharing; re-run with a fresh key from Google Cloud IAM.',
      });
    }
  } else {
    checks.push({
      name: 'gsc-config',
      ok: true,
      // Env-gated by design (not an error), so `fix` (rendered only on FAIL)
      // wouldn't show — the guide pointer rides in the detail line instead,
      // at the exact moment a user learns metrics is running CF-only.
      detail:
        'GSC not configured — metrics will run CF-only (env-gated, not an error). To enable GSC metrics, follow the 5-minute setup guide: https://anvilwiki.pages.dev/landing/docs/ai-ops/',
    });
  }
  for (const p of env.problems) {
    checks.push({ name: 'gsc-config', ok: false, detail: p, fix: 'Fix the value in .env, then re-run `anvil-ops doctor`.' });
  }

  // 4. cf
  if (env.cfApiToken && env.cfAccountId && beacon) {
    checks.push({ name: 'cf-config', ok: true, detail: `token + account + beacon tag ${beacon}` });
    const q = deps.cfQuery ?? queryCloudflare;
    try {
      await q({ apiToken: env.cfApiToken, accountId: env.cfAccountId, siteTag: beacon, days: 1 });
      checks.push({ name: 'cf-access', ok: true, detail: 'GraphQL probe succeeded' });
    } catch (e) {
      const msg = e instanceof OpsError
        ? `${e.message} ${e.fix}`
        : e instanceof Error
          ? e.message || e.name
          : String(e) || 'unknown error';
      checks.push({
        name: 'cf-access',
        ok: false,
        detail: msg,
        fix: 'Create a token with Account > Analytics > Read (https://dash.cloudflare.com/profile/api-tokens) and set CF_API_TOKEN.',
      });
    }
  } else {
    const missing = [
      env.cfApiToken ? null : 'CF_API_TOKEN',
      env.cfAccountId ? null : 'CF_ACCOUNT_ID',
      beacon ? null : 'PUBLIC_CF_BEACON_TOKEN',
    ].filter(Boolean);
    checks.push({
      name: 'cf-config',
      ok: true,
      detail: `CF Analytics not configured (missing: ${missing.join(', ')}) — metrics will run GSC-only (env-gated, not an error)`,
    });
  }

  return { checks };
}

export function formatDoctor(report: DoctorReport): string {
  const lines = ['# anvil-ops doctor'];
  for (const c of report.checks) {
    lines.push(`- ${c.ok ? '[ok]' : '[FAIL]'} ${c.name}: ${c.detail}`);
    if (!c.ok && c.fix) lines.push(`  fix: ${c.fix}`);
  }
  const failed = report.checks.filter((c) => !c.ok).length;
  lines.push('', failed === 0 ? 'All checks passed.' : `${failed} check(s) failed.`);
  return lines.join('\n') + '\n';
}
