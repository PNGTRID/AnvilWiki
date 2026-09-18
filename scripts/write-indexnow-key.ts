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
