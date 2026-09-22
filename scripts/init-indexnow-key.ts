/**
 * Ensure this fork has one stable IndexNow ownership key.
 *
 * Called by Initialize AnvilWiki; apply-template uses the same helper directly.
 * Safe to re-run: an existing valid .indexnow-key is never rotated.
 */
import { ensureIndexNowKey, INDEXNOW_KEY_PATH } from './lib/indexnow';

const result = ensureIndexNowKey();

console.log(
  result.created
    ? `[IndexNow] Generated ${INDEXNOW_KEY_PATH} (commit this public protocol key).`
    : `[IndexNow] Reusing existing ${INDEXNOW_KEY_PATH}.`,
);
