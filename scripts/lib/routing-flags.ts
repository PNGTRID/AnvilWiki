/**
 * routing-flags.ts — regex readers for src/i18n/routing.ts.
 *
 * Six scripts (check-config, check-i18n, check-content, bulk-new-posts,
 * new-post, sync-codes) each used to re-parse routing.ts with their own
 * regex, and the copies had drifted into three variants — including a
 * defaultLocale reader that silently fell back to 'en' when a fork
 * reformatted the line. This module is the single extraction point:
 *
 *   - one tolerant-but-loud regex per declaration (accepts the shapes
 *     apply-template / new-locale write, including the `: Locale`
 *     annotation form);
 *   - parse failures are LOUD: ❌ + the expected declaration shape +
 *     process.exit(1). No silent fallbacks — validating rows or linting
 *     links against the WRONG locale list is worse than stopping.
 *
 * Regex-read (not `import`): routing.ts lives under src/ and scripts run
 * via tsx outside the Astro pipeline; the textual convention matches the
 * rest of scripts/ (see new-post.ts readCategories for the same idiom).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/** routing.ts path relative to the repo root (every caller's cwd). */
const ROUTING_REL = 'src/i18n/routing.ts';

function readRoutingSrc(root: string): string {
  const file = path.resolve(root, ROUTING_REL);
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    console.error(`❌ Could not read ${file} — run from the repo root (expected ${ROUTING_REL} to exist).`);
    process.exit(1);
  }
}

/**
 * The `locales` array from routing.ts, e.g. ['en', 'ja'].
 * Accepts both quote styles and an optional `as const`; fails loud when the
 * declaration is missing, mangled, or extracts to an empty list.
 */
export function readLocales(root: string = process.cwd()): string[] {
  const src = readRoutingSrc(root);
  const match = src.match(/export const locales\s*=\s*\[([^\]]*)\]/);
  const locales = match
    ? Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g)).map((m) => m[1])
    : [];
  if (locales.length === 0) {
    console.error(
      `❌ Could not parse locales from ${ROUTING_REL} — expected \`export const locales = ['en', 'ja'] as const;\``,
    );
    process.exit(1);
  }
  return locales;
}

/**
 * The `defaultLocale` string from routing.ts (normally 'en').
 * Accepts both `export const defaultLocale = 'xx'` and the annotated
 * `export const defaultLocale: Locale = 'xx'` — a fork that reformats or
 * drops the annotation must not silently fall back to 'en'. Fails loud.
 */
export function readDefaultLocale(root: string = process.cwd()): string {
  const src = readRoutingSrc(root);
  const match = src.match(/export const defaultLocale(?:: Locale)?\s*=\s*['"]([^'"]+)['"]/);
  if (!match) {
    console.error(
      `❌ Could not parse defaultLocale from ${ROUTING_REL} — expected \`export const defaultLocale = 'en';\` (with or without the \`: Locale\` annotation)`,
    );
    process.exit(1);
  }
  return match[1];
}
