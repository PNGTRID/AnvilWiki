import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildInsights, collectInsights, formatInsights, parseStaleCodes, THRESHOLDS } from '../src/core/insights.js';
import type { GscQueryResult } from '../src/core/providers/gsc.js';
import type { CfQueryResult } from '../src/core/providers/cloudflare.js';
import { OpsError } from '../src/core/errors.js';

const gsc = (rows: GscQueryResult['rows']): GscQueryResult => ({
  rows,
  totals: {
    clicks: rows.reduce((s, r) => s + r.clicks, 0),
    impressions: rows.reduce((s, r) => s + r.impressions, 0),
    ctr: 0.02,
    position: 5,
  },
});

describe('buildInsights rules', () => {
  it('rule low-ctr: page with impressions>=200 and ctr<3% triggers', () => {
    const r = buildInsights({
      gsc: gsc([
        { page: 'https://x.com/a', query: 'q1', clicks: 2, impressions: 300, ctr: 0.006, position: 12 },
        { page: 'https://x.com/a', query: 'q2', clicks: 3, impressions: 200, ctr: 0.015, position: 11 },
        { page: 'https://x.com/b', query: 'q3', clicks: 50, impressions: 300, ctr: 0.16, position: 2 },
      ]),
    });
    const low = r.filter((i) => i.rule === 'low-ctr');
    expect(low).toHaveLength(1);
    expect(low[0].finding).toContain('https://x.com/a');
    expect(low[0].docs).toMatch(/anvil-new-article/);
  });

  it('rule rank-5-15: query with impressions>=100 and position 5..15 triggers', () => {
    const r = buildInsights({
      gsc: gsc([
        { page: 'https://x.com/a', query: 'good target', clicks: 5, impressions: 150, ctr: 0.03, position: 9 },
        { page: 'https://x.com/a', query: 'too low impr', clicks: 5, impressions: 40, ctr: 0.03, position: 9 },
        { page: 'https://x.com/a', query: 'too high rank', clicks: 5, impressions: 150, ctr: 0.03, position: 3 },
      ]),
    });
    const rank = r.filter((i) => i.rule === 'rank-5-15');
    expect(rank).toHaveLength(1);
    expect(rank[0].finding).toContain('good target');
  });

  it('rule zero-impression: gsc rows with impressions==0 trigger', () => {
    const r = buildInsights({
      gsc: gsc([{ page: 'https://x.com/ghost', query: 'q', clicks: 0, impressions: 0, ctr: 0, position: 0 }]),
    });
    const z = r.filter((i) => i.rule === 'zero-impression');
    expect(z).toHaveLength(1);
    expect(z[0].docs).toMatch(/seo/);
  });

  it('rule traffic-mix: cf page with visits>=50 but low gsc clicks triggers', () => {
    const cf: CfQueryResult = {
      totals: { visits: 500 },
      pages: [
        { page: 'https://x.com/a', visits: 200 },
        { page: 'https://x.com/tiny', visits: 10 },
      ],
    };
    const r = buildInsights({
      cf,
      gsc: gsc([{ page: 'https://x.com/a', query: 'q', clicks: 2, impressions: 50, ctr: 0.04, position: 20 }]),
    });
    const tm = r.filter((i) => i.rule === 'traffic-mix');
    expect(tm).toHaveLength(1);
    expect(tm[0].finding).toContain('https://x.com/a');
  });

  it('rule stale-codes: each stale page becomes an insight', () => {
    const r = buildInsights({ staleCodesPages: ['src/content/wiki/en/codes/main.mdx'] });
    const st = r.filter((i) => i.rule === 'stale-codes');
    expect(st).toHaveLength(1);
    expect(st[0].docs).toMatch(/anvil-update-codes/);
  });

  it('no gsc input: only stale-codes can trigger (degraded mode)', () => {
    const r = buildInsights({ staleCodesPages: ['a.mdx'] });
    expect(r.every((i) => i.rule === 'stale-codes')).toBe(true);
  });
});

describe('formatInsights', () => {
  it('sorts by severity and mentions degraded sources', () => {
    const list = buildInsights({
      staleCodesPages: ['a.mdx'],
      gsc: gsc([{ page: 'https://x.com/a', query: 'q', clicks: 0, impressions: 300, ctr: 0.001, position: 12 }]),
    });
    const md = formatInsights(list, ['cf']);
    expect(md).toContain('# Insights');
    expect(md).toContain('cf');
    const lowCtrIdx = md.indexOf('low-ctr');
    const staleIdx = md.indexOf('stale-codes');
    expect(lowCtrIdx).toBeGreaterThan(-1);
    expect(lowCtrIdx).toBeLessThan(staleIdx);
  });

  it('thresholds are exported constants', () => {
    expect(THRESHOLDS.lowCtr).toBe(0.03);
    expect(THRESHOLDS.rankMin).toBe(5);
    expect(THRESHOLDS.rankMax).toBe(15);
  });

  it('parseStaleCodes extracts only codes rows', () => {
    const stdout = [
      '## Content freshness audit (2026-08-18)',
      '| Priority | Article | Category | Age | Why |',
      '|---|---|---|---|---|',
      '| P0 | `src/content/wiki/en/codes/main.mdx` | codes | 45d | 45d since last verify |',
      '| P1 | `src/content/wiki/en/bosses/emberfang.mdx` | bosses | 95d | stale 95d |',
    ].join('\n');
    expect(parseStaleCodes(stdout)).toEqual(['src/content/wiki/en/codes/main.mdx']);
  });
});

describe('collectInsights AIO probe failure', () => {
  function tmpSite(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ops-insights-'));
    writeFileSync(join(dir, 'wrangler.toml'), '[vars]\nSITE_URL = "https://wiki.example.com"\n');
    writeFileSync(join(dir, '.env'), `GSC_SERVICE_ACCOUNT_JSON=${JSON.stringify({ client_email: 'e@x', private_key: 'k' })}\n`);
    return dir;
  }

  it('keeps the per-status OpsError fix in the surfaced error (probe is never fatal)', async () => {
    const r = await collectInsights({
      cwd: tmpSite(),
      days: 7,
      run: () => ({ status: 1, stdout: '', stderr: '' }),
      gscClientFactory: () => ({
        async query() {
          return { rows: [], totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 } };
        },
        async listAccessibleSites() {
          return [];
        },
        async probeAiOverviews() {
          throw new OpsError('Google Search Console API error 429: quota exceeded', 'Rate limited by Google — wait a minute and re-run.');
        },
      }),
    });
    expect(r.aio?.error).toContain('wait a minute');
    expect(r.aio?.error).toContain('Fix:');
  });
});
