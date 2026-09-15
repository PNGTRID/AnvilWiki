import { JWT } from 'google-auth-library';
import { OpsError } from '../errors.js';
import type { GscCredential } from '../env.js';

export interface GscRow {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryResult {
  rows: GscRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number };
}

export interface AioPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface AioProbeResult {
  rows: AioPageRow[];
  totals: { clicks: number; impressions: number };
  /** Google has NOT committed to exposing AI_OVERVIEWS via searchAppearance — treat as directional. */
  experimental: true;
  note: string;
  /** Set when the probe itself failed (experimental — surfaced as a note, never fatal). */
  error?: string;
}

interface GscApiRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

// gaxios default is no timeout — a stuck googleapis.com connection would hang
// the CLI forever. API calls should fail in tens of seconds, not never.
const GSC_TIMEOUT_MS = 30_000;

function windowDays(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1); // GSC data lags ~2 days; end at yesterday
  const start = new Date(end);
  // Inclusive endpoints: "last N days" spans exactly N calendar days (the
  // old `end - days` produced N+1), so the window matches the --days label.
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

/**
 * gaxios throws on ANY non-2xx (validateStatus), so HTTP failures surface as
 * raw GaxiosError rejections — the 403 fix guidance below would otherwise be
 * dead code. Map rejections to OpsError with per-status fixes instead.
 */
function gscHttpError(e: unknown): OpsError {
  const err = e as { response?: { status?: number }; code?: string | number; message?: string };
  const code = Number(err.response?.status ?? err.code) || 0;
  const message = err.message ?? String(e);
  let fix: string;
  if (code === 403) {
    fix = 'Share the Search Console property with your service account email (Search Console > Settings > Users and permissions > Add user).';
  } else if (code === 401) {
    fix = 'The service account key was rejected — re-download the JSON key and update GSC_SERVICE_ACCOUNT_JSON, then re-run `anvil-ops doctor`.';
  } else if (code === 429) {
    fix = 'Rate limited by Google — wait a minute and re-run.';
  } else {
    fix = 'Check the service account key with `anvil-ops doctor` (also: network reachability of googleapis.com).';
  }
  return new OpsError(`Google Search Console API error ${code || 'network'}: ${message}`, fix);
}

async function gscRequest(
  auth: JWT,
  req: { url: string; method?: 'GET' | 'POST'; data?: unknown },
): Promise<unknown> {
  try {
    const res = await auth.request({ ...req, timeout: GSC_TIMEOUT_MS });
    return res.data;
  } catch (e) {
    throw gscHttpError(e);
  }
}

export function gscQueryUrl(siteUrl: string): string {
  // sc-domain: properties must be used verbatim (no trailing slash);
  // URL-prefix properties require the trailing slash before encoding.
  const property = siteUrl.startsWith('sc-domain:')
    ? siteUrl
    : siteUrl.endsWith('/')
      ? siteUrl
      : siteUrl + '/';
  return `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
}

function assertNotGscError(json: unknown): void {
  const maybeError = json as { error?: { code?: number; message?: string } };
  if (maybeError?.error) {
    const code = maybeError.error.code ?? 0;
    const fix =
      code === 403
        ? 'Share the Search Console property with your service account email (Search Console > Settings > Users and permissions > Add user).'
        : 'Check the service account key with `anvil-ops doctor`.';
    throw new OpsError(`Google Search Console API error ${code}: ${maybeError.error.message ?? 'unknown'}`, fix);
  }
}

export function parseGscResponse(json: unknown): GscQueryResult {
  assertNotGscError(json);
  const rows = ((json as { rows?: GscApiRow[] }).rows ?? []).map((r) => ({
    page: r.keys?.[0] ?? '',
    query: r.keys?.[1] ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const n = rows.length || 1;
  const totals = {
    clicks: rows.reduce((s, r) => s + r.clicks, 0),
    impressions,
    ctr: rows.reduce((s, r) => s + r.ctr * r.impressions, 0) / (impressions || 1),
    position: rows.reduce((s, r) => s + r.position, 0) / n,
  };
  return { rows, totals };
}

export interface GscClient {
  query(params: { days: number }): Promise<GscQueryResult>;
  listAccessibleSites(): Promise<string[]>;
  /** Optional so existing injected fakes in tests keep compiling; the real client always provides it. */
  probeAiOverviews?(params: { days: number }): Promise<AioProbeResult>;
}

export function buildAioRequestBody(days: number): Record<string, unknown> {
  return {
    ...windowDays(days),
    dimensions: ['page'],
    dimensionFilterGroups: [
      {
        groupType: 'and',
        filters: [{ dimension: 'searchAppearance', operator: 'equals', expression: 'AI_OVERVIEWS' }],
      },
    ],
    rowLimit: 25,
  };
}

export function parseAioResponse(json: unknown): { rows: AioPageRow[] } {
  assertNotGscError(json);
  const rows = ((json as { rows?: GscApiRow[] }).rows ?? []).map((r) => ({
    page: r.keys?.[0] ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
  return { rows };
}

export const AIO_EXPERIMENTAL_NOTE =
  'experimental: Google does not commit to exposing AI_OVERVIEWS via the searchAppearance filter — numbers are directional, not contractual.';

export function createGscClient(opts: { credential: GscCredential; siteUrl: string }): GscClient {
  const auth = new JWT({
    email: opts.credential.clientEmail,
    key: opts.credential.privateKey,
    scopes: [GSC_SCOPE],
  });
  return {
    async query({ days }) {
      const data = await gscRequest(auth, {
        url: gscQueryUrl(opts.siteUrl),
        method: 'POST',
        data: { ...windowDays(days), dimensions: ['page', 'query'], rowLimit: 1000 },
      });
      return parseGscResponse(data);
    },
    async listAccessibleSites() {
      const data = (await gscRequest(auth, {
        url: 'https://searchconsole.googleapis.com/webmasters/v3/sites',
      })) as { siteEntry?: { siteUrl?: string }[] };
      return (data.siteEntry ?? []).map((s) => s.siteUrl ?? '').filter(Boolean);
    },
    async probeAiOverviews({ days }): Promise<AioProbeResult> {
      const data = await gscRequest(auth, {
        url: gscQueryUrl(opts.siteUrl),
        method: 'POST',
        data: buildAioRequestBody(days),
      });
      const { rows } = parseAioResponse(data);
      return {
        rows,
        totals: {
          clicks: rows.reduce((s, r) => s + r.clicks, 0),
          impressions: rows.reduce((s, r) => s + r.impressions, 0),
        },
        experimental: true,
        note: AIO_EXPERIMENTAL_NOTE,
      };
    },
  };
}
