/**
 * CHANGELOG release contract — turn the "update [Unreleased] pointer" release
 * SOP step from pure discipline into a gate.
 *
 * The incident class this pins: a release renames `## [Unreleased]` to
 * `## [x.y.z]` and forgets to (a) add a fresh empty Unreleased section and
 * (b) re-point the `[Unreleased]:` compare link. Recurred 5× (v2.2.0, the
 * v2.4.1–v2.6.2 six-release streak, v2.15.1 cleanup variant, v2.18.1) before
 * the nightly automation finally gated it here (2026-09-12).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const REPO = 'https://github.com/PNGTRID/AnvilWiki/';

describe('CHANGELOG release contract', () => {
  test('first version section is [Unreleased] — a release must never swallow it', () => {
    const first = changelog.match(/^## \[(.+?)\]/m)?.[1];
    expect(first, 'first `## [...]` section must be [Unreleased]').toBe('Unreleased');
  });

  test('[Unreleased] compare pointer exists and tracks the latest released version', () => {
    const latest = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
    expect(latest, 'at least one released version section must exist').toBeDefined();
    const link = changelog.match(/^\[Unreleased\]:\s*(\S+)/m)?.[1];
    expect(link).toBe(`${REPO}compare/v${latest}...HEAD`);
  });

  test('every released version section has a reference link', () => {
    const versions = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);
    expect(versions.length).toBeGreaterThan(5);
    for (const v of versions) {
      expect(changelog, `version ${v} has no [${v}]: reference link`).toContain(`[${v}]: ${REPO}`);
    }
  });
});
