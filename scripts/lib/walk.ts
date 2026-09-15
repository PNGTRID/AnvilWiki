/**
 * walk.ts — the one recursive file walker for scripts/.
 *
 * Consolidates the six copy-pasted walk closures that had drifted across
 * check-content, check-links, check-i18n, refresh-audit and template-audit
 * (which had three alone). Semantics match every caller it replaces:
 *
 *   - depth-first over `root`; a missing root returns [] (callers like
 *     articleMap rely on that for locales with no content yet);
 *   - returns ABSOLUTE paths in deterministic order (entries sorted by name
 *     per directory, code-unit compare);
 *   - `exts`: keep files whose name ends with one of these (case-sensitive,
 *     e.g. ['.mdx']) — default: keep every file;
 *   - `skipDirs`: prune directories by name during the walk — default:
 *     none (callers walk scoped roots like src/content/wiki where
 *     node_modules/.git/dist cannot appear).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface WalkOptions {
  /** Keep only files whose name ends with one of these (e.g. ['.mdx']). Default: all files. */
  exts?: string[];
  /** Directory names to prune during the walk. Default: none. */
  skipDirs?: string[];
}

export function walkFiles(root: string, opts: WalkOptions = {}): string[] {
  const exts = opts.exts;
  const skipDirs = new Set(opts.skipDirs ?? []);
  const out: string[] = [];
  (function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(p);
      } else if (!exts || exts.some((e) => entry.name.endsWith(e))) {
        out.push(p);
      }
    }
  })(root);
  return out;
}
