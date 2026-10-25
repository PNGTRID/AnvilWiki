/**
 * Contract tests for scripts/lib/check-versions.ts.
 *
 * Two layers:
 *  1. Pure-function behavior on synthetic fixtures (drift in any single
 *     surface must flip exactly that one check to red).
 *  2. Live-repo wiring: the real files must pass today — this is the actual
 *     CI gate that turns the release-checklist discipline into a red build
 *     (same pattern as changelog.test.ts).
 */
import { describe, expect, test } from 'vitest';
import {
  ANVIL_SKILLS,
  checkVersionConsistency,
  type VersionCheckInputs,
} from '../scripts/lib/check-versions';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

const baseInputs = (): VersionCheckInputs => ({
  packageJson: JSON.stringify({ version: '2.38.0' }),
  landingShared: "export const PROJECT_VERSION = '2.38.0';",
  changelog: '## [Unreleased]\n\n## [2.38.0] - 2026-10-22\n',
  roadmap: '> **当前版本:v2.38.0**(2026-10-22 发布)。\n',
  agents:
    '**Status (as of 2026-10-22)**: 当前最新 **v2.38.0**(...)\n\nStandalone npm package (`anvilwiki-ops`, semver 1.0.6 as of v2.36.1, published to npm).',
  opsPackageJson: JSON.stringify({ version: '1.0.6' }),
  skillSurfaces: Object.fromEntries(
    ['README.md', 'docs/README.md', 'docs/PRD.md', 'AGENTS.md'].map((f) => [
      f,
      ANVIL_SKILLS.join(' '),
    ]),
  ),
  todayIso: '2026-10-25',
});

const checkOf = (checks: ReturnType<typeof checkVersionConsistency>, id: string) =>
  checks.find((c) => c.id === id);

describe('checkVersionConsistency (pure)', () => {
  test('consistent fixture is green across every check', () => {
    const checks = checkVersionConsistency(baseInputs());
    expect(checks.length).toBeGreaterThanOrEqual(9); // 5 version checks + 4 skill surfaces
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  test('each drifted surface flips exactly its own check', () => {
    const drift = (mutate: (x: VersionCheckInputs) => void): string[] => {
      const inputs = baseInputs();
      mutate(inputs);
      return checkVersionConsistency(inputs)
        .filter((c) => !c.ok)
        .map((c) => c.id);
    };
    expect(drift((x) => {
      x.landingShared = "export const PROJECT_VERSION = '2.37.0';";
    })).toEqual(['project-version']);
    expect(drift((x) => {
      x.changelog = '## [Unreleased]\n\n## [2.37.0] - old\n';
    })).toEqual(['changelog-latest']);
    expect(drift((x) => {
      x.roadmap = '> **当前版本:v2.37.0**(old)。\n';
    })).toEqual(['roadmap-header']);
    expect(drift((x) => {
      x.agents =
        '**Status (as of 2026-10-22)**: 当前最新 **v2.37.0**(...)\n\nStandalone npm package (`anvilwiki-ops`, semver 1.0.6 as of v2.36.1, published to npm).';
    })).toEqual(['agents-status']);
    expect(drift((x) => {
      x.opsPackageJson = JSON.stringify({ version: '1.0.7' });
    })).toEqual(['ops-version-line']);
  });

  test('a skill missing from one surface fails only that surface', () => {
    const inputs = baseInputs();
    inputs.skillSurfaces['docs/PRD.md'] = inputs.skillSurfaces['docs/PRD.md'].replace(
      'anvil-refresh',
      '',
    );
    const failed = checkVersionConsistency(inputs).filter((c) => !c.ok);
    expect(failed.map((c) => c.id)).toEqual(['skills-docs/PRD.md']);
    expect(failed[0].detail).toContain('anvil-refresh');
  });

  test('missing pattern (malformed surface) reports not-found instead of throwing', () => {
    const inputs = baseInputs();
    inputs.roadmap = 'no version line here';
    const checks = checkVersionConsistency(inputs);
    expect(checkOf(checks, 'roadmap-header')).toMatchObject({ ok: false });
  });

  test('as-of date older than 35 days attaches a note but stays green', () => {
    const inputs = baseInputs();
    inputs.agents =
      '**Status (as of 2026-08-01)**: 当前最新 **v2.38.0**(...)\n\nStandalone npm package (`anvilwiki-ops`, semver 1.0.6 as of v2.36.1, published to npm).';
    inputs.todayIso = '2026-10-25';
    const status = checkOf(checkVersionConsistency(inputs), 'agents-status');
    expect(status?.ok).toBe(true);
    expect(status?.note).toContain('85 days old');
  });

  test('fresh as-of date carries no note', () => {
    const status = checkOf(checkVersionConsistency(baseInputs()), 'agents-status');
    expect(status?.note).toBeUndefined();
  });
});

describe('live repo wiring (the actual gate)', () => {
  test('all real sync surfaces are consistent today', () => {
    const checks = checkVersionConsistency({
      packageJson: read('package.json'),
      landingShared: read('src/config/landing-shared.ts'),
      changelog: read('CHANGELOG.md'),
      roadmap: read('docs/roadmap.md'),
      agents: read('AGENTS.md'),
      opsPackageJson: read('tools/anvil-ops/package.json'),
      skillSurfaces: Object.fromEntries(
        (['README.md', 'docs/README.md', 'docs/PRD.md', 'AGENTS.md'] as const).map((f) => [
          f,
          read(f),
        ]),
      ),
      todayIso: new Date().toISOString().slice(0, 10),
    });
    const failed = checks.filter((c) => !c.ok);
    expect(failed.map((c) => `${c.id}: ${c.detail}`)).toEqual([]);
  });
});
