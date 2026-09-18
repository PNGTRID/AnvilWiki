/**
 * Emit the IndexNow ownership file into dist/ during postbuild.
 *
 * INDEXNOW_KEY is intentionally a build-time variable: every fork/site gets
 * its own key without committing a generated <key>.txt file to the template.
 * When unset, this script is a no-op and the default template stays clean.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { indexNowKeyFileName, normalizeIndexNowKey } from './lib/indexnow';

const dist = path.resolve(process.cwd(), 'dist');
const key = normalizeIndexNowKey(process.env.INDEXNOW_KEY);

if (!key) {
  console.log('[IndexNow] INDEXNOW_KEY not configured; key file emission skipped.');
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
