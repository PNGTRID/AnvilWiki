/**
 * Ensure this fork has one stable repository-backed IndexNow key.
 *
 * Called by Initialize AnvilWiki. Existing repo/legacy keys are preserved;
 * a random key is generated only when the site has never had one.
 */
import { ensureRepositoryIndexNowKey, loadLocalEnv } from './lib/indexnow';

loadLocalEnv();
const result = ensureRepositoryIndexNowKey();

if (!result.created) {
  console.log('[IndexNow] .indexnow-key already exists; keeping the current site key.');
} else if (result.source === 'generated') {
  console.log('[IndexNow] Generated .indexnow-key for this site.');
} else {
  console.log(`[IndexNow] Migrated the existing ${result.source.replace('-migrated', '')} key into .indexnow-key.`);
}
