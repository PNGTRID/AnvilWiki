/**
 * refresh-audit.ts
 *
 * Deterministic content-freshness audit (v1.8) — the engine behind the
 * `content-pipeline` GitHub Actions workflow. No LLM, no network, no file
 * mutations: it only reports. The workflow turns the report into an issue
 * for the maintainer; fixing content stays a human/AI-session decision.
 *
 * Rules (STALE_* thresholds live in src/lib/content-utils.ts — the same
 * source that drives the on-page outdated banner, so the audit and the page
 * can never disagree):
 *   - STALE categories (bosses, tier-list) older than 90 days → P1
 *   - codes articles older than 7 days → P0 (players assume daily updates)
 *   - codes articles older than 30 days → P0 + "likely contains dead codes"
 *   - codes pages whose frontmatter codes are ALL `DEMO-` placeholders are
 *     SKIPPED by the freshness rules: placeholder codes (the site-preset demo
 *     pages) can never be "verified", so auditing them would only produce
 *     permanent P0 noise. Fork users swapping in real codes restore the rule
 *     automatically (the marker lives in site-presets.ts).
 *   - homepage explore highlights (home.explore.modules badge-list) whose
 *     badge contradicts the same-locale codes page frontmatter — expired
 *     shown as Active → P0. Labels absent from the codes page fall back to
 *     the detail's own "expires <Mon DD>" date: lapsed while the badge still
 *     says Active → P0 too. en + ja only (the expired-badge vocabulary is
 *     curated per locale; an unknown locale's word would false-positive).
 *   - gameVersion behind the live game version is NOT auto-detectable —
 *     the report reminds the maintainer to check manually.
 *
 * Output: markdown report to stdout (+ $GITHUB_STEP_SUMMARY when set).
 * Always exits 0 — this is a report, not a gate.
 *
 * Usage: pnpm refresh-audit
 */

import * as fs from 'node:fs';
import { todayIso } from './lib/today';
import { STALE_AFTER_DAYS, STALE_CATEGORIES, TUTORIALS_STALE_AFTER_DAYS } from '~/lib/content-utils';
import { isPlaceholderCodesFrontmatter } from './lib/site-presets';
import { walkFiles } from './lib/walk';
import * as path from 'node:path';

const ROOT = process.cwd();
const BASE = path.resolve(ROOT, 'src/content/wiki');

const CODES_WARN_DAYS = 7;
const CODES_CRITICAL_DAYS = 30;

interface Item {
  priority: 'P0' | 'P1';
  file: string;
  category: string;
  /** Days since last touch; null for non-age items (homepage mismatches). */
  days: number | null;
  reason: string;
}

const files = walkFiles(BASE, { exts: ['.mdx'] });

const items: Item[] = [];
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const fm = src.split('---')[1] ?? '';
  if (/^draft:\s*true\s*$/m.test(fm)) continue; // drafts never published
  const category = fm.match(/^category:\s*['"]?([\w-]+)/m)?.[1] ?? '';
  const dateStr = fm.match(/^date:\s*(.+)$/m)?.[1]?.trim().replace(/['"]/g, '');
  const lmStr = fm.match(/^lastModified:\s*(.+)$/m)?.[1]?.trim().replace(/['"]/g, '');
  const refStr = lmStr || dateStr;
  if (!refStr) continue;
  const ref = new Date(refStr);
  if (Number.isNaN(ref.getTime())) continue;
  const days = Math.floor((now - ref.getTime()) / DAY);
  const rel = path.relative(ROOT, file);

  if (category === 'codes') {
    // All-DEMO- placeholder pages (site-preset demos) never "verify" — skip
    // instead of piling permanent P0 rows into the daily issue.
    if (isPlaceholderCodesFrontmatter(fm)) continue;
    if (days >= CODES_CRITICAL_DAYS) {
      items.push({
        priority: 'P0',
        file: rel,
        category,
        days,
        reason: `${days}d since last verify — likely contains dead codes`,
      });
    } else if (days >= CODES_WARN_DAYS) {
      items.push({ priority: 'P0', file: rel, category, days, reason: `${days}d unverified (players assume daily)` });
    }
  } else if (STALE_CATEGORIES.includes(category) && days >= STALE_AFTER_DAYS) {
    items.push({
      priority: 'P1',
      file: rel,
      category,
      days,
      reason: `stale ${days}d (> ${STALE_AFTER_DAYS}d) — banner shown on page`,
    });
  }
}

// ---------------------------------------------------------------------------
// Tutorials freshness sweep (2026-11-03 night-audit gap). refresh-audit's
// BASE is src/content/wiki, so the tutorials collection (10+ bilingual
// how-to pages and growing) had NO staleness view at all. Tutorials are
// evergreen (180d, not codes' 7d), use the required `updated` field, and
// en/zh twins share it (schema bilingual iron rule) — so scanning the en
// side alone covers both locales without duplicate rows.
// ---------------------------------------------------------------------------
const tutorialsBase = path.resolve(ROOT, 'src/content/tutorials/en');
if (fs.existsSync(tutorialsBase)) {
  for (const file of walkFiles(tutorialsBase, { exts: ['.md'] })) {
    const fm = fs.readFileSync(file, 'utf8').split('---')[1] ?? '';
    if (/^draft:\s*true\s*$/m.test(fm)) continue;
    const updatedStr = fm.match(/^updated:\s*(.+)$/m)?.[1]?.trim().replace(/['"]/g, '');
    if (!updatedStr) continue; // schema makes it required; degraded mode = gate's job
    const updated = new Date(updatedStr);
    if (Number.isNaN(updated.getTime())) continue;
    const days = Math.floor((now - updated.getTime()) / DAY);
    if (days >= TUTORIALS_STALE_AFTER_DAYS) {
      items.push({
        priority: 'P1',
        file: path.relative(ROOT, file),
        category: 'tutorials',
        days,
        reason: `stale ${days}d (> ${TUTORIALS_STALE_AFTER_DAYS}d) — platform UI/algorithms drift`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Homepage ↔ codes-page reconciliation (round 22). The landing "Codes"
// module renders highlight badges from hand-written locale JSON, while the
// source of truth for a code's status is the codes page frontmatter — and
// nothing else cross-checks the two (the freshness loop above never reads
// locale JSON). An expired code advertised as "Active" on the homepage is
// the exact trust-killer this audit exists to prevent.
// Scoped to en + ja: the expired-badge vocabulary is curated per locale, an
// unknown locale's word for "Expired" would false-positive.
// ---------------------------------------------------------------------------
const EXPIRED_BADGE: Record<string, RegExp> = {
  en: /^expired/i,
  ja: /期限切れ/,
};

/** Flat `codes:` frontmatter entries as [{ code, status }] (quote-tolerant). */
function parseCodesFrontmatter(fm: string): { code: string; status: string }[] {
  const entries: { code: string; status: string }[] = [];
  let current: { code: string; status: string } | null = null;
  for (const line of fm.split('\n')) {
    const codeVal = line.match(/^\s*-\s+code:\s*(.+?)\s*$/)?.[1];
    if (codeVal) {
      current = { code: codeVal.replace(/^['"]|['"]$/g, ''), status: '' };
      entries.push(current);
      continue;
    }
    const statusVal = line.match(/^\s+status:\s*(.+?)\s*$/)?.[1];
    if (statusVal && current) current.status = statusVal.replace(/^['"]|['"]$/g, '').toLowerCase();
  }
  return entries;
}

for (const [loc, expiredBadge] of Object.entries(EXPIRED_BADGE)) {
  const jsonPath = path.resolve(ROOT, 'src/locales', `${loc}.json`);
  if (!fs.existsSync(jsonPath)) continue;
  let json: Record<string, any>;
  try {
    json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    continue; // invalid locale JSON is check-config's report, not this audit's
  }
  // codes frontmatter across the locale's codes pages (first hit wins —
  // realistically there is one).
  const statusByCode = new Map<string, string>();
  for (const file of files.filter((f) =>
    path.relative(BASE, f).split(path.sep).join('/').startsWith(`${loc}/codes/`),
  )) {
    const fm = fs.readFileSync(file, 'utf8').split('---')[1] ?? '';
    for (const e of parseCodesFrontmatter(fm)) {
      if (!statusByCode.has(e.code)) statusByCode.set(e.code, e.status);
    }
  }

  const modules: any[] = json?.home?.explore?.modules ?? [];
  for (const module of modules) {
    if (module?.displayType !== 'badge-list') continue;
    for (const h of module?.highlights ?? []) {
      const label = String(h?.label ?? '');
      const badge = String(h?.badge ?? '');
      if (!label) continue;
      const fmStatus = statusByCode.get(label);
      if (fmStatus === 'expired' && !expiredBadge.test(badge)) {
        items.push({
          priority: 'P0',
          file: `src/locales/${loc}.json`,
          category: 'home-highlights',
          days: null,
          reason: `highlight "${label}" shows badge "${badge}" but the codes page frontmatter says expired`,
        });
      } else if (fmStatus === undefined && /^active/i.test(badge)) {
        // Label unknown to the codes page(s): fall back to the detail's own
        // "expires <Mon DD>" date — a lapsed date under an "Active" badge is
        // the same lie (parsed with the current year; undated rewards like
        // "cosmetic set" have no detail to contradict).
        const m = String(h?.detail ?? '').match(/expires\s+([A-Za-z]{3,9})\s+(\d{1,2})/);
        const t = m ? new Date(`${m[1]} ${m[2]}, ${new Date().getFullYear()}`).getTime() : NaN;
        if (!Number.isNaN(t) && t < now) {
          items.push({
            priority: 'P0',
            file: `src/locales/${loc}.json`,
            category: 'home-highlights',
            days: null,
            reason: `highlight "${label}" shows badge "${badge}" and its detail says "expires ${m?.[1]} ${m?.[2]}" — that date has passed`,
          });
        }
      }
    }
  }
}

items.sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity));

const today = todayIso();
const lines: string[] = [];
lines.push(`## Content freshness audit (${today})`);
lines.push('');
if (items.length === 0) {
  lines.push(`✅ Nothing stale. ${files.length} articles scanned.`);
} else {
  lines.push(`${items.length} item(s) need attention (${files.length} articles scanned):`);
  lines.push('');
  lines.push('| Priority | Article | Category | Age | Why |');
  lines.push('|---|---|---|---|---|');
  for (const it of items) {
    lines.push(`| ${it.priority} | \`${it.file}\` | ${it.category} | ${it.days === null ? '—' : `${it.days}d`} | ${it.reason} |`);
  }
  lines.push('');
  lines.push('**Suggested actions**');
  lines.push('- Codes pages: get the latest code list (official Discord/Trello), then run the `anvil-update-codes` skill.');
  lines.push('- Homepage highlight badges: reconcile `home.explore.modules` badge text with the codes page frontmatter — an expired code shown as "Active" is the first thing players try.');
  lines.push('- Stale boss/tier-list pages: re-verify mechanics against the current game version, bump `lastModified`.');
  lines.push('- Also spot-check `gameVersion` frontmatter against the live game version.');
}

const report = lines.join('\n');
console.log('\n' + report + '\n');

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, report + '\n', 'utf8');
}
