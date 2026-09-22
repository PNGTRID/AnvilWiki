/**
 * Shared IndexNow helpers.
 *
 * The protocol allows 8-128 characters from A-Z / a-z / 0-9 / "-".
 * New forks keep one generated key in .indexnow-key. The legacy
 * INDEXNOW_KEY environment variable remains a fallback for existing sites.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const INDEXNOW_KEY_RE = /^[A-Za-z0-9-]{8,128}$/;
export const INDEXNOW_KEY_PATH = '.indexnow-key';

export type IndexNowKeySource = 'file' | 'env';

export interface IndexNowKeyInfo {
  key: string;
  source: IndexNowKeySource;
}

/**
 * Load a local .env file into process.env for backward compatibility.
 * Existing process.env values win; a missing file is a no-op.
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

export function indexNowKeyFileName(key: string): string {
  const normalized = normalizeIndexNowKey(key);
  if (!normalized) throw new Error('IndexNow key cannot be empty.');
  return `${normalized}.txt`;
}

/** Read the explicit repository key file. Missing is fine; empty/invalid is not. */
export function readIndexNowKeyFile(root = process.cwd()): string | null {
  const file = path.resolve(root, INDEXNOW_KEY_PATH);
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }

  const key = normalizeIndexNowKey(raw);
  if (!key) {
    throw new Error(`${INDEXNOW_KEY_PATH} exists but is empty.`);
  }
  return key;
}

/**
 * Resolve one key source only: the explicit repository file first, then the
 * legacy env/.env value. Deliberately never scans public/*.txt.
 */
export function resolveIndexNowKey(root = process.cwd()): IndexNowKeyInfo | null {
  const fileKey = readIndexNowKeyFile(root);
  if (fileKey) return { key: fileKey, source: 'file' };

  const envKey = normalizeIndexNowKey(process.env.INDEXNOW_KEY);
  return envKey ? { key: envKey, source: 'env' } : null;
}

/**
 * Create a stable per-site key exactly once. Re-runs reuse the existing file.
 * The key is public by IndexNow protocol design; committing this file is safe.
 */
export function ensureIndexNowKey(root = process.cwd()): { key: string; created: boolean } {
  const existing = readIndexNowKeyFile(root);
  if (existing) return { key: existing, created: false };

  const key = crypto.randomBytes(32).toString('hex');
  const file = path.resolve(root, INDEXNOW_KEY_PATH);
  try {
    fs.writeFileSync(file, `${key}\n`, { encoding: 'utf8', flag: 'wx' });
    return { key, created: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const raced = readIndexNowKeyFile(root);
    if (!raced) throw error;
    return { key: raced, created: false };
  }
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
