/**
 * refresh-audit.ts
 *
 * Deterministic content-freshness audit (v1.8) — the engine behind the
 * `content-pipeline` GitHub Actions workflow. No LLM, no network, no file
 * mutations: it only reports. The workflow turns the report into an issue
 * for the maintainer; fixing content stays a human/AI-session decision.
 *
 * Rules (mirror STALE_* in src/i18n/content.ts, kept in sync manually):
 *   - STALE categories (bosses, tier-list) older than 90 days → P1
 *   - codes articles older than 7 days → P0 (players assume daily updates)
 *   - codes articles older than 30 days → P0 + "likely contains dead codes"
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
import * as path from 'node:path';

const ROOT = process.cwd();
const BASE = path.resolve(ROOT, 'src/content/wiki');

// Keep in sync with src/i18n/content.ts.
const STALE_CATEGORIES = ['bosses', 'tier-list'];
const STALE_AFTER_DAYS = 90;
const CODES_WARN_DAYS = 7;
const CODES_CRITICAL_DAYS = 30;

interface Item {
  priority: 'P0' | 'P1';
  file: string;
  category: string;
  days: number;
  reason: string;
}

const files: string[] = [];
(function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.mdx')) files.push(p);
  }
})(BASE);

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

items.sort((a, b) => a.days - b.days);

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
    lines.push(`| ${it.priority} | \`${it.file}\` | ${it.category} | ${it.days}d | ${it.reason} |`);
  }
  lines.push('');
  lines.push('**Suggested actions**');
  lines.push('- Codes pages: get the latest code list (official Discord/Trello), then run the `anvil-update-codes` skill.');
  lines.push('- Stale boss/tier-list pages: re-verify mechanics against the current game version, bump `lastModified`.');
  lines.push('- Also spot-check `gameVersion` frontmatter against the live game version.');
}

const report = lines.join('\n');
console.log('\n' + report + '\n');

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, report + '\n', 'utf8');
}
