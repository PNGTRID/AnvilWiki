/**
 * Version-consistency one-shot check (check-* family member #7).
 *
 * Reads the seven sync surfaces and compares them via
 * lib/check-versions.ts (pure, tested in tests/versions.test.ts, which is
 * what actually gates CI through `pnpm test`). This CLI is the human-facing
 * red/green report for daily audits — same pattern as check-config.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkVersionConsistency } from './lib/check-versions';
import { todayIso } from './lib/today';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = (rel: string): string => readFileSync(join(root, rel), 'utf8');

const results = checkVersionConsistency({
  packageJson: read('package.json'),
  landingShared: read('src/config/landing-shared.ts'),
  changelog: read('CHANGELOG.md'),
  roadmap: read('docs/roadmap.md'),
  agents: read('AGENTS.md'),
  opsPackageJson: read('tools/anvil-ops/package.json'),
  skillSurfaces: Object.fromEntries(
    ['README.md', 'docs/README.md', 'docs/PRD.md', 'AGENTS.md'].map((f) => [f, read(f)]),
  ),
  todayIso: todayIso(),
});

console.log('## Version consistency check\n');
let failed = 0;
for (const r of results) {
  const mark = r.ok ? '✅' : '❌';
  if (!r.ok) failed++;
  console.log(`${mark} ${r.id}: ${r.detail}`);
  if (r.note) console.log(`   ⚠️  ${r.note}`);
}
console.log('');
if (failed > 0) {
  console.error(`❌ ${failed} version-consistency check(s) failed.`);
  process.exit(1);
}
console.log('✅ All version sync surfaces consistent.');
