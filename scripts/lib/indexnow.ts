/**
 * Shared IndexNow helpers.
 *
 * The protocol allows 8-128 characters from A-Z / a-z / 0-9 / "-".
 * Keep validation in one place so build-time key emission and submission
 * cannot silently disagree.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const INDEXNOW_KEY_RE = /^[A-Za-z0-9-]{8,128}$/;
export const INDEXNOW_REPO_KEY_FILE = '.indexnow-key';

export interface ResolvedIndexNowKey {
  key: string;
  source: 'repo' | 'env' | 'repo+env';
}

export interface EnsuredIndexNowKey {
  key: string;
  created: boolean;
  source: 'repo' | 'env-migrated' | 'wrangler-migrated' | 'generated';
}

/**
 * Load a local .env file into process.env. submit-indexnow and
 * write-indexnow-key run under tsx, which — unlike `astro build` (Vite) —
 * does NOT read .env: before this loader, the "local .env" copy of
 * INDEXNOW_KEY documented since v2.33.0 was dead config, and a local
 * submit-indexnow run silently fell back to whatever public/<key>.txt it
 * found. Existing process.env values win (CI/Actions vars are never
 * clobbered); a missing file is a no-op; a malformed file warns instead of
 * failing (the value may still arrive from the real environment).
 */
export function loadLocalEnv(filePath = '.env'): void {
  try {
    process.loadEnvFile(path.resolve(filePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    console.warn(
      `⚠️ Could not parse ${filePath} (${error instanceof Error ? error.message : String(error)}) — continuing with the process environment only.`,
    );
  }
}

export function normalizeIndexNowKey(raw: string | undefined | null): string | null {
  const value = raw?.trim() ?? '';
  if (!value) return null;
  if (!INDEXNOW_KEY_RE.test(value)) {
    throw new Error(
      'IndexNow key must be 8-128 characters using only A-Z, a-z, 0-9, or "-".',
    );
  }
  return value;
}

export function readRepositoryIndexNowKey(root = process.cwd()): string | null {
  const file = path.resolve(root, INDEXNOW_REPO_KEY_FILE);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, 'utf8').trim();
  if (!raw) throw new Error(`${INDEXNOW_REPO_KEY_FILE} cannot be empty.`);
  return normalizeIndexNowKey(raw);
}

function readWranglerIndexNowKey(root = process.cwd()): string | null {
  const file = path.resolve(root, 'wrangler.toml');
  if (!fs.existsSync(file)) return null;

  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^\s*INDEXNOW_KEY\s*=\s*["']([^"']+)["']\s*(?:#.*)?$/m);
  return match ? normalizeIndexNowKey(match[1]) : null;
}

export function resolveIndexNowKey(
  root = process.cwd(),
  legacyRaw = process.env.INDEXNOW_KEY,
): ResolvedIndexNowKey | null {
  const repoKey = readRepositoryIndexNowKey(root);
  const envKey = normalizeIndexNowKey(legacyRaw);

  if (repoKey && envKey && repoKey !== envKey) {
    throw new Error(
      `${INDEXNOW_REPO_KEY_FILE} and legacy INDEXNOW_KEY disagree. Keep one site key; do not rotate implicitly.`,
    );
  }
  if (repoKey) return { key: repoKey, source: envKey ? 'repo+env' : 'repo' };
  return envKey ? { key: envKey, source: 'env' } : null;
}

export function ensureRepositoryIndexNowKey(
  root = process.cwd(),
  legacyRaw = process.env.INDEXNOW_KEY,
): EnsuredIndexNowKey {
  const repoKey = readRepositoryIndexNowKey(root);
  const envKey = normalizeIndexNowKey(legacyRaw);
  const wranglerKey = readWranglerIndexNowKey(root);

  if (envKey && wranglerKey && envKey !== wranglerKey) {
    throw new Error('Legacy INDEXNOW_KEY and wrangler.toml INDEXNOW_KEY disagree.');
  }

  const legacyKey = envKey ?? wranglerKey;
  if (repoKey) {
    if (legacyKey && repoKey !== legacyKey) {
      throw new Error(
        `${INDEXNOW_REPO_KEY_FILE} disagrees with a legacy IndexNow key. Resolve the mismatch before continuing.`,
      );
    }
    return { key: repoKey, created: false, source: 'repo' };
  }

  const key = legacyKey ?? crypto.randomBytes(16).toString('hex');
  const target = path.resolve(root, INDEXNOW_REPO_KEY_FILE);
  fs.writeFileSync(target, `${key}\n`, { encoding: 'utf8', flag: 'wx' });

  return {
    key,
    created: true,
    source: envKey ? 'env-migrated' : wranglerKey ? 'wrangler-migrated' : 'generated',
  };
}

export function readWranglerSiteOrigin(root = process.cwd()): string | null {
  const file = path.resolve(root, 'wrangler.toml');
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^\s*SITE_URL\s*=\s*["']([^"']+)["']\s*(?:#.*)?$/m);
  return match ? normalizeSiteOrigin(match[1]) : null;
}

export function resolveRepositorySiteOrigin(
  root: string,
  fallbackSiteUrl: string,
  legacyRaw = process.env.SITE_URL,
): string {
  const legacy = legacyRaw?.trim();
  if (legacy) return normalizeSiteOrigin(legacy);
  return readWranglerSiteOrigin(root) ?? normalizeSiteOrigin(fallbackSiteUrl);
}

export function indexNowKeyFileName(key: string): string {
  const normalized = normalizeIndexNowKey(key);
  if (!normalized) throw new Error('IndexNow key cannot be empty.');
  return `${normalized}.txt`;
}

export function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

export function extractSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXmlEntities(match[1].trim()),
  );
}

export function normalizeSiteOrigin(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SITE_URL must use http or https, got ${url.protocol}`);
  }
  return url.origin;
}

export function isAcceptedIndexNowStatus(status: number): boolean {
  return status === 200 || status === 202;
}
