/**
 * AGENTS.md suite-count consistency — the commands table claims "N suites
 * (a, b, …)"; this pins the claim to reality. The count drifted 3× in ten
 * days (12 → missed the v2.18.0 community-digest addition → 14 → 16), and
 * AGENTS.md is loaded into every agent session, so a stale list quietly
 * misleads daily. Adding a suite without updating AGENTS.md now goes red.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const agents = readdirSync(join(root, 'tests'))
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => f.replace(/\.test\.ts$/, ''))
  .sort();

describe('AGENTS.md suite-list consistency', () => {
  const line = readAgentsLine();

  test('the commands table quotes every suite that exists — no more, no fewer', () => {
    expect(line, 'AGENTS.md `pnpm test` line not found').toBeDefined();
    const claimed = line!.match(/\(([^)]+)\)/)![1].split(',').map((s) => s.trim()).sort();
    expect(claimed).toEqual(agents);
  });

  test('the quoted count matches the list', () => {
    const count = Number(line!.match(/Vitest — (\d+) suites/)?.[1]);
    expect(count).toBe(agents.length);
  });
});

function readAgentsLine(): string | undefined {
  const text = readAgentsText();
  return text.match(/pnpm test\s+# Vitest — .*/)?.[0];
}
function readAgentsText(): string {
  return readFileSync(join(root, 'AGENTS.md'), 'utf8');
}
