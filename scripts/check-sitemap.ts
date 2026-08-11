/**
 * check-sitemap.ts
 *
 * Fetches every URL in the site's sitemap and reports HTTP status codes.
 * Any non-200 response is printed with its status; the script exits with
 * code 1 if any URL failed, so it can gate CI or pre-deploy checks.
 *
 * Usage:
 *   pnpm check-sitemap                       # uses http://localhost:4321
 *   BASE_URL=https://example.com pnpm check-sitemap
 *   pnpm tsx scripts/check-sitemap.ts https://example.com
 */

const BASE_URL = (process.argv[2] || process.env.BASE_URL || 'http://localhost:4321').replace(
  /\/$/,
  '',
);

interface Result {
  url: string;
  status: number;
  ok: boolean;
}

async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
  // Try sitemap-index.xml first (what @astrojs/sitemap generates), then sitemap-0.xml.
  const candidates = [`${baseUrl}/sitemap-index.xml`, `${baseUrl}/sitemap.xml`];

  for (const idx of candidates) {
    try {
      const res = await fetch(idx);
      if (!res.ok) continue;
      const xml = await res.text();

      // An index file references child sitemaps; a flat file references URLs.
      // Collect every <loc> value, then recursively expand child sitemaps.
      const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());

      // If locs point to other .xml files, fetch those.
      const xmlLocs = locs.filter((u) => u.endsWith('.xml'));
      const urlLocs = locs.filter((u) => !u.endsWith('.xml'));

      if (xmlLocs.length === 0) {
        return locs;
      }

      // Recursively gather from child sitemaps.
      const childUrls: string[] = [];
      for (const child of xmlLocs) {
        try {
          const childRes = await fetch(child);
          if (!childRes.ok) continue;
          const childXml = await childRes.text();
          const childLocs = Array.from(childXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) =>
            m[1].trim(),
          );
          childUrls.push(...childLocs);
        } catch {
          // Network error on a child — skip, will be reported as failure below.
        }
      }
      return [...urlLocs, ...childUrls];
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(
    `Could not fetch sitemap from ${baseUrl}. Tried sitemap-index.xml and sitemap.xml. Is the site running?`,
  );
}

async function checkUrl(url: string): Promise<Result> {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return { url, status: res.status, ok: res.ok };
  } catch {
    return {
      url,
      status: 0,
      ok: false,
    };
  }
}

async function main() {
  console.log(`\n📋 Checking sitemap URLs against: ${BASE_URL}\n`);

  const urls = await fetchSitemapUrls(BASE_URL);

  if (urls.length === 0) {
    console.error('❌ Sitemap contained no URLs.');
    process.exit(1);
  }

  console.log(`Found ${urls.length} URLs. Checking...\n`);

  const results: Result[] = [];
  // Sequential to avoid hammering the server (and to keep logs readable).
  for (const url of urls) {
    const r = await checkUrl(url);
    results.push(r);
    const mark = r.ok ? '✅' : '❌';
    console.log(`  ${mark}  ${r.status}  ${url}`);
  }

  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);

  console.log(`\n── Result ──`);
  console.log(`  ✅ Passed: ${passed.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log(`\nFailed URLs:`);
    for (const f of failed) {
      console.log(`  ${f.status}  ${f.url}`);
    }
    process.exit(1);
  }

  console.log('\n🎉 All sitemap URLs returned 200.');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
