/**
 * Emit the IndexNow ownership file into dist/ during postbuild.
 *
 * New forks keep one stable site key in .indexnow-key. Legacy INDEXNOW_KEY
 * remains supported for existing sites, but build-time code never invents or
 * rotates a key: generation belongs only to explicit site initialization.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { indexNowKeyFileName, loadLocalEnv, resolveIndexNowKey } from './lib/indexnow';

const root = process.cwd();
const dist = path.resolve(root, 'dist');

loadLocalEnv();
const resolved = resolveIndexNowKey(root);
const key = resolved?.key;

if (!key) {
  console.log('[IndexNow] No .indexnow-key or legacy INDEXNOW_KEY configured; key file emission skipped.');
  process.exit(0);
}

if (!fs.existsSync(dist)) {
  throw new Error('dist/ does not exist; write-indexnow-key must run after the Astro build.');
}

const filename = indexNowKeyFileName(key);
const target = path.join(dist, filename);
fs.writeFileSync(target, key, 'utf8');
console.log(`[IndexNow] Wrote dist/${filename}`);

// Cloudflare Pages exposes the Git commit SHA to the production build. Publish
// it as a tiny no-sitemap marker so the post-CI workflow can distinguish the
// NEW deployment from the previous one before reading the production sitemap.
// Without this, an already-live key file would make every later run race Pages.
const commitSha = process.env.CF_PAGES_COMMIT_SHA?.trim();
if (commitSha) {
  if (!/^[0-9a-f]{40}$/i.test(commitSha)) {
    throw new Error('CF_PAGES_COMMIT_SHA must be a 40-character Git SHA when set.');
  }
  const wellKnown = path.join(dist, '.well-known');
  fs.mkdirSync(wellKnown, { recursive: true });
  fs.writeFileSync(path.join(wellKnown, 'anvilwiki-deploy.txt'), commitSha, 'utf8');
  console.log('[IndexNow] Wrote dist/.well-known/anvilwiki-deploy.txt');
}
