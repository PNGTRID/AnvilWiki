import { OpsError } from '../errors.js';

export interface CfPageRow {
  page: string;
  visits: number;
}

export interface CfQueryResult {
  totals: { visits: number };
  pages: CfPageRow[];
}

const CF_GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

// API calls must fail fast, not hang the CLI on a stuck connection
// (AbortSignal.timeout = hard cap on the whole request).
const HTTP_TIMEOUT_MS = 30_000;

export function buildCfQuery(): string {
  return `query ($accountTag: string!, $filter: rumOperationsGroups_filter) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      rumOperationsGroups(limit: 100, filter: $filter, orderBy: [_count_DESC]) {
        count
        dimensions { rumPageUrl }
      }
    }
  }
}`;
}

export function buildCfVariables(args: { siteTag: string; days: number }): Record<string, unknown> {
  const to = new Date();
  const from = new Date(to.getTime() - args.days * 24 * 3600 * 1000);
  return {
    accountTag: '',
    filter: {
      _siteTag: args.siteTag,
      _datetime_geq: from.toISOString(),
      _datetime_lt: to.toISOString(),
    },
  };
}

export interface CfGroup {
  count?: number;
  dimensions?: { rumPageUrl?: string; rumRefererHost?: string };
}

function assertNoCfErrors(json: unknown): void {
  const withErrors = json as { errors?: { message?: string }[] };
  if (withErrors?.errors?.length) {
    throw new OpsError(
      'Cloudflare GraphQL error: ' + withErrors.errors.map((e) => e.message ?? '').join('; '),
      'If this is a field-validation error, inspect the live schema: curl -sS https://api.cloudflare.com/client/v4/graphql -H "Authorization: Bearer $CF_API_TOKEN" -H \'Content-Type: application/json\' --data \'{"query":"{ __type(name: \\"RumOperationsGroupsDimensionGroup\\") { fields { name } }"}\'',
    );
  }
}

export function parseCfResponse(json: unknown): CfQueryResult {
  assertNoCfErrors(json);
  const groups =
    (json as { data?: { viewer?: { accounts?: { rumOperationsGroups?: CfGroup[] }[] } } })
      ?.data?.viewer?.accounts?.[0]?.rumOperationsGroups ?? [];
  const pages = groups.map((g) => ({ page: g.dimensions?.rumPageUrl ?? '(unknown)', visits: g.count ?? 0 }));
  return { totals: { visits: pages.reduce((s, p) => s + p.visits, 0) }, pages };
}

export async function queryCloudflare(opts: {
  apiToken: string;
  accountId: string;
  siteTag: string;
  days: number;
  fetchImpl?: typeof fetch;
}): Promise<CfQueryResult> {
  const doFetch = opts.fetchImpl ?? fetch;
  const variables = buildCfVariables({ siteTag: opts.siteTag, days: opts.days });
  variables.accountTag = opts.accountId;
  const res = await doFetch(CF_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: buildCfQuery(), variables }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (res.status === 401 || res.status === 403) {
    throw new OpsError(
      `Cloudflare API returned ${res.status}.`,
      'Create an API token in the Cloudflare dashboard with permission Account > Analytics > Read, set CF_API_TOKEN in .env, then re-run `anvil-ops doctor`.',
    );
  }
  if (!res.ok) {
    throw new OpsError(`Cloudflare API returned ${res.status}.`, 'Re-run in a moment; if it persists run `anvil-ops doctor`.');
  }
  return parseCfResponse(await res.json());
}

// --- AI referral tracking -------------------------------------------------

/** Referrer hosts counted as "AI traffic" (client-side whitelist aggregation). */
export const AI_REFERRER_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'perplexity.ai',
  'gemini.google.com',
  'claude.ai',
  'copilot.microsoft.com',
] as const;

export interface AiReferralRow {
  host: string;
  requests: number;
  pageviews: number;
}

export interface AiReferralsResult {
  available: boolean;
  rows: AiReferralRow[];
  totals: { requests: number; pageviews: number };
  note?: string;
}

export interface CfReferrerGroup {
  host: string;
  count: number;
}

export function buildAiReferralQuery(): string {
  // rumRefererHost is the referrer-host dimension of the RUM dataset
  // (same channel as rumPageUrl above). If the schema ever rejects it, the
  // shared error path prints the introspection curl to check field names.
  return `query ($accountTag: string!, $filter: rumOperationsGroups_filter) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      rumOperationsGroups(limit: 100, filter: $filter, orderBy: [_count_DESC]) {
        count
        dimensions { rumRefererHost }
      }
    }
  }
}`;
}

export function parseAiReferralResponse(json: unknown): CfReferrerGroup[] {
  assertNoCfErrors(json);
  const groups =
    (json as { data?: { viewer?: { accounts?: { rumOperationsGroups?: CfGroup[] }[] } } })
      ?.data?.viewer?.accounts?.[0]?.rumOperationsGroups ?? [];
  return groups
    .map((g) => ({ host: g.dimensions?.rumRefererHost ?? '', count: g.count ?? 0 }))
    .filter((g) => g.host !== '');
}

export function isAiReferrerHost(host: string, whitelist: readonly string[] = AI_REFERRER_HOSTS): boolean {
  return whitelist.some((w) => host === w || host.endsWith('.' + w));
}

/** Aggregates raw per-host groups into whitelist rows (subdomains included) + totals. */
export function aggregateAiReferrals(groups: CfReferrerGroup[]): AiReferralsResult {
  const byHost = new Map<string, number>();
  for (const g of groups) {
    if (!isAiReferrerHost(g.host)) continue;
    byHost.set(g.host, (byHost.get(g.host) ?? 0) + g.count);
  }
  // The RUM beacon emits one operation per tracked pageview, so count maps to
  // both columns here (kept separate for forward compatibility with richer metrics).
  const rows = [...byHost.entries()]
    .map(([host, count]) => ({ host, requests: count, pageviews: count }))
    .sort((a, b) => b.requests - a.requests || a.host.localeCompare(b.host));
  const totals = {
    requests: rows.reduce((s, r) => s + r.requests, 0),
    pageviews: rows.reduce((s, r) => s + r.pageviews, 0),
  };
  return { available: true, rows, totals };
}

export async function fetchAiReferrals(opts: {
  apiToken?: string;
  accountId?: string;
  siteTag?: string;
  days: number;
  fetchImpl?: typeof fetch;
}): Promise<AiReferralsResult> {
  if (!opts.apiToken || !opts.accountId || !opts.siteTag) {
    return {
      available: false,
      rows: [],
      totals: { requests: 0, pageviews: 0 },
      note: 'AI referrals need Cloudflare credentials (CF_API_TOKEN + CF_ACCOUNT_ID + beacon tag) — skipped.',
    };
  }
  const doFetch = opts.fetchImpl ?? fetch;
  const variables = buildCfVariables({ siteTag: opts.siteTag, days: opts.days });
  variables.accountTag = opts.accountId;
  const res = await doFetch(CF_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: buildAiReferralQuery(), variables }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (res.status === 401 || res.status === 403) {
    throw new OpsError(
      `Cloudflare API returned ${res.status} (AI referrals).`,
      'Create an API token in the Cloudflare dashboard with permission Account > Analytics > Read, set CF_API_TOKEN in .env, then re-run `anvil-ops doctor`.',
    );
  }
  if (!res.ok) {
    throw new OpsError(`Cloudflare API returned ${res.status} (AI referrals).`, 'Re-run in a moment; if it persists run `anvil-ops doctor`.');
  }
  return aggregateAiReferrals(parseAiReferralResponse(await res.json()));
}
