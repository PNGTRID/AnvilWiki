import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'dotenv';
import { parse as parseToml } from 'smol-toml';
import { ConfigParseError, OpsError } from './errors.js';

export interface SiteConfig {
  root: string;
  siteUrl?: string;
  cfBeaconToken?: string;
  /** Where the config came from — learn-manual setups delete wrangler.toml and keep settings in the Cloudflare dashboard, so .env is the fallback. */
  source: 'wrangler.toml' | '.env';
}

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function fromVars(vars: Record<string, string>, root: string): SiteConfig {
  return {
    root,
    siteUrl: clean(vars['SITE_URL'])?.replace(/\/+$/, ''),
    cfBeaconToken: clean(vars['PUBLIC_CF_BEACON_TOKEN']),
    source: 'wrangler.toml',
  };
}

function fromDotenv(dir: string): SiteConfig | null {
  try {
    const vars = parse(readFileSync(join(dir, '.env'), 'utf8'));
    if (!vars['SITE_URL'] && !vars['PUBLIC_CF_BEACON_TOKEN']) return null;
    return {
      root: dir,
      siteUrl: clean(vars['SITE_URL'])?.replace(/\/+$/, ''),
      cfBeaconToken: clean(vars['PUBLIC_CF_BEACON_TOKEN']),
      source: '.env',
    };
  } catch {
    return null;
  }
}

export function loadSiteConfig(startDir: string): SiteConfig {
  let dir = resolve(startDir);
  const dotenvCandidates: string[] = [];
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'wrangler.toml'))) {
      const tomlPath = join(dir, 'wrangler.toml');
      // A raw smol-toml SyntaxError surfaces as a bare "Error: ..." with no
      // path or hint on every metrics/audit/submit path. Deliberately NOT an
      // OpsError (see ConfigParseError): a corrupt config must propagate, not
      // fall back to another registered site.
      let parsed: { vars?: Record<string, string> };
      try {
        parsed = parseToml(readFileSync(tomlPath, 'utf8')) as { vars?: Record<string, string> };
      } catch (e) {
        throw new ConfigParseError(tomlPath, e);
      }
      return fromVars(parsed.vars ?? {}, dir);
    }
    dotenvCandidates.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // No wrangler.toml anywhere: the learn manual has users delete it and use the
  // Cloudflare dashboard, so fall back to .env (walk back down nearest-first).
  for (const d of dotenvCandidates.reverse()) {
    const cfg = fromDotenv(d);
    if (cfg) return cfg;
  }
  throw new OpsError(
    'No site config found: no wrangler.toml (searched up from ' + startDir + ') and no .env with SITE_URL.',
    'Two supported setups: (1) keep wrangler.toml with a [vars] SITE_URL — note the file overrides the Cloudflare dashboard entirely; (2) the learn-manual setup (wrangler.toml deleted, settings in the Cloudflare dashboard) — then create a .env at the repo root with SITE_URL=https://your-domain (and optionally PUBLIC_CF_BEACON_TOKEN). See docs/deployment.md.',
  );
}
