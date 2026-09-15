import { collectMetrics } from './metrics.js';
import { loadOpsEnv } from './env.js';
import type { GscCredential } from './env.js';
import { loadSiteConfig } from './site.js';
import { createGscClient } from './providers/gsc.js';
import type { GscClient, GscQueryResult, AioProbeResult } from './providers/gsc.js';
import type { CfQueryResult, queryCloudflare } from './providers/cloudflare.js';
import { OpsError } from './errors.js';
import { defaultRun, type RunFn } from './content.js';

// v1 thresholds (spec §6) — tune here, rules read only these.
export const THRESHOLDS = {
  lowCtrImpr: 200,
  lowCtr: 0.03,
  rankImpr: 100,
  rankMin: 5,
  rankMax: 15,
  cfTopVisits: 50,
  cfClickRatio: 20, // clicks < visits / ratio = "low clicks despite traffic"
};

export interface Insight {
  rule: string;
  severity: 'high' | 'medium' | 'low';
  finding: string;
  evidence: string;
  action: string;
  docs: string;
}

export interface InsightsInput {
  gsc?: GscQueryResult;
  cf?: CfQueryResult;
  staleCodesPages?: string[];
}

interface PageAgg {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

function aggregateByPage(rows: GscQueryResult['rows']): Map<string, PageAgg> {
  const map = new Map<string, PageAgg>();
  for (const r of rows) {
    const cur = map.get(r.page) ?? { page: r.page, clicks: 0, impressions: 0, ctr: 0 };
    cur.clicks += r.clicks;
    cur.impressions += r.impressions;
    map.set(r.page, cur);
  }
  for (const agg of map.values()) {
    agg.ctr = agg.impressions > 0 ? agg.clicks / agg.impressions : 0;
  }
  return map;
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function buildInsights(input: InsightsInput): Insight[] {
  const out: Insight[] = [];
  const byPage = input.gsc ? aggregateByPage(input.gsc.rows) : new Map<string, PageAgg>();

  // Rule 1: low CTR despite impressions -> rewrite title/description
  for (const agg of byPage.values()) {
    if (agg.impressions >= THRESHOLDS.lowCtrImpr && agg.ctr < THRESHOLDS.lowCtr) {
      out.push({
        rule: 'low-ctr',
        severity: 'high',
        finding: `${agg.page} shows ${agg.impressions} impressions but CTR ${(agg.ctr * 100).toFixed(1)}% (< ${(THRESHOLDS.lowCtr * 100).toFixed(0)}%)`,
        evidence: `clicks=${agg.clicks} impressions=${agg.impressions}`,
        action: 'Rewrite title/description to better match the queries shown in metrics; keep the direct-answer summary aligned.',
        docs: '.agent/skills/anvil-new-article (frontmatter title/description rules)',
      });
    }
  }

  // Rule 2: ranking 5-15 with real impressions -> internal links + deepen content
  if (input.gsc) {
    const seen = new Set<string>();
    for (const r of input.gsc.rows) {
      if (r.impressions >= THRESHOLDS.rankImpr && r.position >= THRESHOLDS.rankMin && r.position <= THRESHOLDS.rankMax) {
        if (seen.has(r.query)) continue;
        seen.add(r.query);
        out.push({
          rule: 'rank-5-15',
          severity: 'medium',
          finding: `Query "${r.query}" ranks #${r.position.toFixed(1)} (page 1-2 boundary) with ${r.impressions} impressions`,
          evidence: `page=${r.page} clicks=${r.clicks} position=${r.position.toFixed(1)}`,
          action: 'Add internal links from related high-traffic pages and deepen the section that answers this query.',
          docs: 'docs/content-format.md',
        });
      }
    }
  }

  // Rule 3: zero impressions -> indexing/internal-link check
  if (input.gsc) {
    for (const agg of byPage.values()) {
      if (agg.impressions === 0) {
        out.push({
          rule: 'zero-impression',
          severity: 'low',
          finding: `${agg.page} appears in GSC data with zero impressions`,
          evidence: 'impressions=0',
          action: 'Check the page is in sitemap.xml, linked from category/list pages, and not accidentally draft:true. Full coverage: compare against sitemap.',
          docs: 'docs/seo.md',
        });
      }
    }
  }

  // Rule 4: traffic mix — CF visits high, GSC clicks low
  if (input.cf && input.gsc) {
    for (const p of input.cf.pages) {
      if (p.visits < THRESHOLDS.cfTopVisits) continue;
      const gscAgg = byPage.get(p.page) ?? byPage.get(p.page.replace(/\/$/, '')) ?? byPage.get(p.page + '/');
      const clicks = gscAgg?.clicks ?? 0;
      if (clicks < p.visits / THRESHOLDS.cfClickRatio) {
        out.push({
          rule: 'traffic-mix',
          severity: 'medium',
          finding: `${p.page} gets ${p.visits} visits but only ${clicks} search clicks — traffic is mostly social/direct`,
          evidence: `cf_visits=${p.visits} gsc_clicks=${clicks}`,
          action: 'Either lean into the winning channel for this page, or improve its search alignment to capture the demand it proves.',
          docs: 'docs/seo.md',
        });
      }
    }
  }

  // Rule 5: stale codes pages
  for (const file of input.staleCodesPages ?? []) {
    out.push({
      rule: 'stale-codes',
      severity: 'high',
      finding: `Codes page not verified recently: ${file}`,
      evidence: 'refresh-audit flagged this page',
      action: 'Get the latest code list (official Discord/Trello), then run the anvil-update-codes skill.',
      docs: '.agent/skills/anvil-update-codes',
    });
  }

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// Extracts codes-page paths from refresh-audit's markdown table
// (rows look like: | P0 | `src/content/wiki/en/codes/x.mdx` | codes | 45d | ... |)
export function parseStaleCodes(stdout: string): string[] {
  const out: string[] = [];
  for (const m of stdout.matchAll(/\| P\d \| `([^`]+)` \| (\w+) \|/g)) {
    if (m[2] === 'codes') out.push(m[1]!);
  }
  return out;
}

export function formatInsights(list: Insight[], degraded: ('gsc' | 'cf')[], aio?: AioProbeResult): string {
  const lines = ['# Insights'];
  if (list.length === 0) {
    lines.push('', 'No actionable insights found for the current window.');
  }
  for (const i of list) {
    lines.push('', `## [${i.severity}] ${i.rule}`, `- Finding: ${i.finding}`, `- Evidence: ${i.evidence}`, `- Action: ${i.action}`, `- Docs: ${i.docs}`);
  }
  if (aio && (aio.rows.length > 0 || aio.error)) {
    lines.push('', '## AI Overviews top pages (experimental)', aio.note);
    if (aio.error) {
      lines.push(`- Probe failed: ${aio.error}`);
    } else {
      for (const r of aio.rows.slice(0, 10)) {
        lines.push(`- ${r.page} — impressions=${r.impressions} clicks=${r.clicks} pos=${r.position.toFixed(1)}`);
      }
      lines.push(
        `- Totals: impressions=${aio.totals.impressions} clicks=${aio.totals.clicks} over ${aio.rows.length} page(s)`,
      );
    }
  }
  if (degraded.length) {
    lines.push('', `Degraded (not configured, rules limited): ${degraded.join(', ')}. Run \`anvil-ops doctor\` to enable.`);
  }
  return lines.join('\n') + '\n';
}

export interface InsightsReport {
  list: Insight[];
  degraded: ('gsc' | 'cf')[];
  aio?: AioProbeResult;
}

/** Shared runner behind both `anvil-ops insights` (CLI) and the insights MCP tool. */
export async function collectInsights(opts: {
  cwd: string;
  days: number;
  run?: RunFn;
  gscClientFactory?: (o: { credential: GscCredential; siteUrl: string }) => GscClient;
  cfQuery?: typeof queryCloudflare;
  aiReferralsQuery?: Parameters<typeof collectMetrics>[0]['aiReferralsQuery'];
}): Promise<InsightsReport> {
  const site = loadSiteConfig(opts.cwd);
  const run = opts.run ?? defaultRun;

  // metrics are optional here: with no source at all we still surface rule 5
  let gsc: GscQueryResult | undefined;
  let cf: CfQueryResult | undefined;
  let degraded: ('gsc' | 'cf')[] = [];
  try {
    const metrics = await collectMetrics({
      cwd: site.root,
      days: opts.days,
      gscClientFactory: opts.gscClientFactory,
      cfQuery: opts.cfQuery,
      aiReferralsQuery: opts.aiReferralsQuery,
    });
    gsc = metrics.gsc;
    cf = metrics.cf;
    degraded = metrics.degraded;
  } catch (e) {
    if (e instanceof OpsError && /No analytics source/.test(e.message)) {
      degraded = ['gsc', 'cf'];
    } else {
      throw e;
    }
  }

  // AI Overviews probe (experimental): only with GSC credentials, never fatal.
  let aio: AioProbeResult | undefined;
  const env = loadOpsEnv(site.root);
  if (env.gscServiceAccount && site.siteUrl) {
    const factory = opts.gscClientFactory ?? createGscClient;
    const client = factory({ credential: env.gscServiceAccount, siteUrl: site.siteUrl });
    if (client.probeAiOverviews) {
      try {
        aio = await client.probeAiOverviews({ days: opts.days });
      } catch (e) {
        aio = {
          rows: [],
          totals: { clicks: 0, impressions: 0 },
          experimental: true,
          note: 'experimental: Google does not commit to exposing AI_OVERVIEWS via the searchAppearance filter — numbers are directional, not contractual.',
          // Keep the per-status OpsError fix (403 share / 429 retry / 401
          // re-key) — e.message alone would drop the actionable guidance.
          error:
            e instanceof OpsError
              ? `${e.message} Fix: ${e.fix}`
              : e instanceof Error
                ? e.message || e.name
                : String(e),
        };
      }
    }
  }

  const staleRun = run('pnpm', ['refresh-audit'], { cwd: site.root });
  const stale = staleRun.status === 0 ? parseStaleCodes(staleRun.stdout) : [];

  return { list: buildInsights({ gsc, cf, staleCodesPages: stale }), degraded, aio };
}
