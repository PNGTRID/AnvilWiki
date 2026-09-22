/**
 * submit-indexnow.ts
 *
 * Push sitemap URLs to IndexNow (https://indexnow.org) — Bing & other
 * participating search engines. Google is not part of IndexNow.
 *
 * Two modes:
 *   1. Local build (default): read URLs from dist/sitemap-index.xml.
 *   2. Production: --site https://example.com reads the deployed sitemap.
 *      Automation adds --wait-for-deploy <sha> + --wait-for-key so a Pages
 *      deployment is proven live before submission.
 *
 * Key source:
 *   1. .indexnow-key generated once during fork initialization (new default).
 *   2. Legacy INDEXNOW_KEY environment variable / local .env (compatibility).
 *
 * There is deliberately NO public/*.txt scanning fallback: audit round 21
 * proved that ambiguous scan could silently adopt a retired demo-site key.
 *
 * Usage:
 *   pnpm submit-indexnow
 *   pnpm submit-indexnow -- --dry-run
 *   pnpm submit-indexnow -- --site https://example.com --wait-for-key
 *   pnpm submit-indexnow -- --site https://example.com --wait-for-deploy <sha> --wait-for-key
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  extractSitemapLocs,
  indexNowKeyFileName,
  isAcceptedIndexNowStatus,
  loadLocalEnv,
  resolveIndexNowKey,
  normalizeSiteOrigin,
} from './lib/indexnow';

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, 'dist');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const REQUEST_TIMEOUT_MS = 20_000;
const DEFAULT_WAIT_SECONDS = 300;
const POLL_INTERVAL_MS = 5_000;

interface CliOptions {
  dryRun: boolean;
  site: string | null;
  waitForDeploy: string | null;
  waitForKey: boolean;
  waitSeconds: number;
}

function usage(): string {
  return [
    'Usage:',
    '  pnpm submit-indexnow',
    '  pnpm submit-indexnow -- --dry-run',
    '  pnpm submit-indexnow -- --site https://example.com --wait-for-key',
    '',
    'Options:',
    '  --site <origin>       Read the deployed sitemap instead of dist/.',
    '  --wait-for-key        Wait for the production key file before submit.',
    '  --wait-for-deploy <sha> Wait until Cloudflare serves this exact Git SHA.',
    '  --wait-seconds <n>    Max wait time (default: 300).',
    '  --dry-run             Print URLs without sending an IndexNow request.',
  ].join('\n');
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    site: null,
    waitForDeploy: null,
    waitForKey: false,
    waitSeconds: DEFAULT_WAIT_SECONDS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--wait-for-key') options.waitForKey = true;
    else if (arg === '--wait-for-deploy') options.waitForDeploy = argv[++index] ?? null;
    else if (arg === '--site') options.site = argv[++index] ?? null;
    else if (arg === '--wait-seconds') {
      const raw = argv[++index];
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || value < 0) {
        throw new Error('--wait-seconds requires a non-negative number.');
      }
      options.waitSeconds = value;
    } else if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
    }
  }

  if ((options.waitForKey || options.waitForDeploy) && !options.site) {
    throw new Error('--wait-for-key/--wait-for-deploy require --site <origin>.');
  }
  if (options.waitForDeploy && !/^[0-9a-f]{40}$/i.test(options.waitForDeploy)) {
    throw new Error('--wait-for-deploy requires a 40-character Git SHA.');
  }

  return options;
}

function readLocalSitemap(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

/** Collect <loc> URLs from dist/sitemap-index.xml, recursing into sub-sitemaps. */
function collectLocalUrls(): string[] {
  const indexPath = path.join(DIST, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/sitemap-index.xml not found — run `pnpm build` first.');
  }

  const urls = new Set<string>();
  const seenXml = new Set<string>();
  const stack = [indexPath];

  while (stack.length > 0) {
    const file = stack.pop();
    if (!file || seenXml.has(file)) continue;
    seenXml.add(file);

    for (const loc of extractSitemapLocs(readLocalSitemap(file))) {
      if (loc.endsWith('.xml')) {
        stack.push(path.join(DIST, path.basename(new URL(loc).pathname)));
      } else {
        urls.add(loc);
      }
    }
  }

  return [...urls].sort();
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'user-agent': 'AnvilWiki-IndexNow/1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GET ${url} returned HTTP ${response.status}`);
  return response.text();
}

/** Read a deployed sitemap index (or sitemap.xml fallback), recursively. */
async function collectRemoteUrls(siteOrigin: string): Promise<string[]> {
  const roots = [`${siteOrigin}/sitemap-index.xml`, `${siteOrigin}/sitemap.xml`];
  let root: { url: string; xml: string } | null = null;

  for (const candidate of roots) {
    try {
      root = { url: candidate, xml: await fetchText(candidate) };
      break;
    } catch {
      // Try the next conventional sitemap location.
    }
  }

  if (!root) throw new Error(`Could not load a sitemap from ${siteOrigin}.`);

  const urls = new Set<string>();
  const visited = new Set<string>();
  const stack = [root];

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item || visited.has(item.url)) continue;
    visited.add(item.url);

    for (const loc of extractSitemapLocs(item.xml)) {
      const url = new URL(loc);
      if (url.origin !== siteOrigin) {
        throw new Error(`Sitemap URL is outside configured SITE_URL: ${loc}`);
      }
      if (url.pathname.endsWith('.xml')) {
        stack.push({ url: url.href, xml: await fetchText(url.href) });
      } else {
        urls.add(url.href);
      }
    }
  }

  return [...urls].sort();
}

function assertSingleHost(urls: string[]): string {
  if (urls.length === 0) throw new Error('No URLs found in sitemap — nothing to push.');

  const host = new URL(urls[0]).host;
  const rogue = urls.find((url) => new URL(url).host !== host);
  if (rogue) throw new Error(`Sitemap mixes hosts; first host is ${host}, found ${rogue}`);

  return host;
}

async function deployedCommit(siteOrigin: string): Promise<string | null> {
  try {
    const value = (
      await fetchText(`${siteOrigin}/.well-known/anvilwiki-deploy.txt`)
    ).trim();
    return /^[0-9a-f]{40}$/i.test(value) ? value : null;
  } catch {
    return null;
  }
}

async function waitForDeployment(
  siteOrigin: string,
  expectedSha: string,
  waitSeconds: number,
): Promise<void> {
  const deadline = Date.now() + waitSeconds * 1_000;

  while (true) {
    const liveSha = await deployedCommit(siteOrigin);
    if (liveSha?.toLowerCase() === expectedSha.toLowerCase()) return;
    if (Date.now() >= deadline) {
      throw new Error(
        `Production deployment did not reach ${expectedSha} within ${waitSeconds}s (live: ${liveSha ?? 'unavailable'}).`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function keyIsLive(siteOrigin: string, key: string): Promise<boolean> {
  try {
    const body = (await fetchText(`${siteOrigin}/${indexNowKeyFileName(key)}`)).trim();
    return body === key;
  } catch {
    return false;
  }
}

async function waitForLiveKey(siteOrigin: string, key: string, waitSeconds: number): Promise<void> {
  const deadline = Date.now() + waitSeconds * 1_000;

  while (true) {
    if (await keyIsLive(siteOrigin, key)) return;
    if (Date.now() >= deadline) {
      throw new Error(
        `IndexNow key file is not live at ${siteOrigin}/${indexNowKeyFileName(key)} after ${waitSeconds}s. Ensure .indexnow-key (or legacy INDEXNOW_KEY) is available to the production build and redeploy.`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function submitBatch(
  host: string,
  key: string,
  keyLocation: string,
  urls: string[],
): Promise<number> {
  const payload = JSON.stringify({ host, key, keyLocation, urlList: urls });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: payload,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (isAcceptedIndexNowStatus(response.status)) return response.status;

    const body = (await response.text()).trim();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 3) {
      throw new Error(
        `IndexNow returned HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ''}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
  }

  throw new Error('IndexNow submission failed after retries.');
}

async function main(): Promise<void> {
  loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));
  const siteOrigin = options.site ? normalizeSiteOrigin(options.site) : null;

  if (siteOrigin && options.waitForDeploy) {
    console.log(
      `[IndexNow] Waiting for production deployment ${options.waitForDeploy}…`,
    );
    await waitForDeployment(siteOrigin, options.waitForDeploy, options.waitSeconds);
  }

  const urls = siteOrigin ? await collectRemoteUrls(siteOrigin) : collectLocalUrls();
  const host = assertSingleHost(urls);

  console.log(
    `[IndexNow] ${siteOrigin ? 'production' : 'local build'} sitemap: ${urls.length} URL(s), host ${host}`,
  );

  const found = resolveIndexNowKey(ROOT);

  if (options.dryRun) {
    for (const url of urls) console.log(url);
    console.log(
      found
        ? `[IndexNow] Key source: ${found.source}`
        : '[IndexNow] No .indexnow-key or legacy INDEXNOW_KEY configured — a real run would fail. Run template initialization or see docs/deployment.md.',
    );
    return;
  }

  if (!found) {
    throw new Error(
      'No IndexNow key is configured. New forks should run Initialize AnvilWiki or pnpm apply-template once to create .indexnow-key. ' +
        'Existing sites may keep using legacy INDEXNOW_KEY / .env. See docs/deployment.md.',
    );
  }

  const key = found.key;
  const sitemapOrigin = new URL(urls[0]).origin;
  const keyLocation = `${sitemapOrigin}/${indexNowKeyFileName(key)}`;

  if (siteOrigin) {
    if (options.waitForKey) {
      console.log(`[IndexNow] Waiting for ${keyLocation} to become live…`);
      await waitForLiveKey(siteOrigin, key, options.waitSeconds);
    } else if (!(await keyIsLive(siteOrigin, key))) {
      throw new Error(
        `IndexNow key file is not live at ${keyLocation}. Deploy the build with the same .indexnow-key (or legacy INDEXNOW_KEY) first.`,
      );
    }
  }

  console.log(`[IndexNow] Submitting ${urls.length} URL(s); key source: ${found.source}`);

  for (let index = 0; index < urls.length; index += 10_000) {
    const batch = urls.slice(index, index + 10_000);
    const status = await submitBatch(host, key, keyLocation, batch);
    console.log(`[IndexNow] HTTP ${status} — ${batch.length} URL(s)`);
  }

  console.log('[IndexNow] Done.');
}

main().catch((error) => {
  console.error('[IndexNow]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
