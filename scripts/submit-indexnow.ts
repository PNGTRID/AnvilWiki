/**
 * submit-indexnow.ts
 *
 * Push every sitemap URL to IndexNow (https://indexnow.org) — Bing & friends
 * then recrawl on your schedule instead of theirs. Complements GSC (Google
 * is NOT part of IndexNow): GSC covers Google, this covers everything else.
 *
 * Reads the BUILT sitemap from dist/ (run `pnpm build` first) — no fetching,
 * the URLs in dist are exactly what went live.
 *
 * Key handling (protocol: https://indexnow.org/documentation):
 *   - The key is an 8-128 hex string; you must host it at
 *     https://<host>/<key>.txt with the key as the file's content.
 *   - This script auto-detects an existing public/<key>.txt (filename ==
 *     content, hex) and reuses it. Otherwise it generates one, writes
 *     public/<key>.txt and tells you to commit + deploy, then rerun — the
 *     push is only verifiable once the key file is live.
 *
 * Usage: pnpm submit-indexnow [--dry-run]
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, 'dist');
const PUBLIC_DIR = path.resolve(ROOT, 'public');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const DRY_RUN = process.argv.includes('--dry-run');

/** Collect <loc> URLs from dist/sitemap-index.xml, recursing into sub-sitemaps. */
function collectUrls(): string[] {
  const indexPath = path.join(DIST, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    console.error('\n❌ dist/sitemap-index.xml not found — run `pnpm build` first.\n');
    process.exit(1);
  }
  const urls: string[] = [];
  const seen = new Set<string>();
  const readLocs = (file: string): string[] =>
    (fs.readFileSync(file, 'utf8').match(/<loc>([^<]+)<\/loc>/g) ?? []).map((m) =>
      m.replace(/<\/?loc>/g, ''),
    );
  const stack = [indexPath];
  while (stack.length > 0) {
    const file = stack.pop() as string;
    for (const loc of readLocs(file)) {
      if (seen.has(loc)) continue;
      seen.add(loc);
      if (loc.endsWith('.xml')) stack.push(path.join(DIST, path.basename(new URL(loc).pathname)));
      else urls.push(loc);
    }
  }
  return urls;
}

/** Find an existing IndexNow key file in public/ (filename == content, hex). */
function detectKey(): { key: string; file: string } | null {
  if (!fs.existsSync(PUBLIC_DIR)) return null;
  for (const name of fs.readdirSync(PUBLIC_DIR)) {
    if (!/^[a-f0-9]{8,128}\.txt$/.test(name)) continue;
    const content = fs.readFileSync(path.join(PUBLIC_DIR, name), 'utf8').trim();
    if (content === name.replace(/\.txt$/, '')) return { key: content, file: name };
  }
  return null;
}

async function main() {
  const urls = collectUrls();
  if (urls.length === 0) {
    console.error('\n❌ No URLs found in the sitemap — nothing to push.\n');
    process.exit(1);
  }
  // All URLs in one sitemap share a host; IndexNow requires host == every
  // urlList entry's host. Derive it from the URLs themselves (always
  // self-consistent, whatever SITE_URL produced the build).
  const host = new URL(urls[0]).host;
  const rogue = urls.filter((u) => new URL(u).host !== host);
  if (rogue.length > 0) {
    console.error(`\n❌ ${rogue.length} sitemap URL(s) are on a different host than ${host} — fix SITE_URL and rebuild.\n`);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`\n📡 IndexNow dry run — host: ${host}, ${urls.length} URL(s)\n`);
    console.log('   (URL list:)');
    for (const u of urls) console.log(`   ${u}`);
    if (!detectKey()) {
      console.log('\n   🔑 No key file yet — a real run would generate public/<key>.txt (commit + deploy it, then rerun).');
    }
    return;
  }

  let existing = detectKey();
  if (!existing) {
    const key = crypto.randomBytes(16).toString('hex');
    const file = `${key}.txt`;
    fs.writeFileSync(path.join(PUBLIC_DIR, file), key);
    existing = { key, file };
    console.log(`\n🔑 Generated a new IndexNow key: public/${file}`);
    console.log('   The key must be reachable at https://' + host + '/' + file);
    console.log('   → commit it, deploy once, then rerun this script; this run may be rejected until then.\n');
  }

  const { key } = existing;
  const keyLocation = `https://${host}/${key}.txt`;
  console.log(`\n📡 IndexNow push — host: ${host}, ${urls.length} URL(s), key: ${key.slice(0, 8)}…\n`);

  // Protocol cap: 10,000 URLs per request.
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += 10_000) batches.push(urls.slice(i, i + 10_000));

  let failed = false;
  for (const batch of batches) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation, urlList: batch }),
    });
    // 200/202 = accepted; 400 bad input; 403 key invalid (not yet deployed?);
    // 422 URLs not on this host; 429 too many requests.
    const ok = res.status === 200 || res.status === 202;
    console.log(`   ${ok ? '✅' : '❌'} ${res.status} ${res.statusText} — ${batch.length} URL(s)`);
    if (!ok) {
      failed = true;
      if (res.status === 403) {
        console.log('      403 usually means the key file is not live yet — deploy public/' + key + '.txt and rerun.');
      }
    }
  }
  console.log(failed ? '\n❌ Push rejected — see above.\n' : '\n✅ Done. Bing & co. will recrawl on their schedule now.\n');
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
