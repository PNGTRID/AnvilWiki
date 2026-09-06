/**
 * sync-codes.ts — pure functions behind `pnpm sync-codes` (scripts/sync-codes.ts).
 *
 * Deterministic batch updater for the structured `codes:` frontmatter array on
 * codes pages: a CSV of (locale, slug, code, status, …) rows is merged into
 * existing MDX frontmatter. It is the mechanical half of the anvil-update-codes
 * skill and never invents or deletes a code:
 *   - new codes are PREPENDED (newest first, mirroring the skill)
 *   - flipping to expired keeps the entry (long-tail "is X still working" SEO)
 *   - empty optional CSV cells keep the existing frontmatter value
 *
 * Everything here is pure (string in → string out) so vitest can pin the YAML
 * serialization byte-for-byte; the CLI only adds fs + argv. Frontmatter
 * handling is deliberately conservative: anything the flat-scalar parser
 * cannot understand aborts the file loudly instead of rewriting blind.
 */

import { isBlankOrComment, parseDelimited } from './delimited';

export type CodeStatus = 'active' | 'expired';

export interface CodesEntry {
  code: string;
  reward?: string;
  status: CodeStatus;
  expiryDate?: string;
  source?: string;
}

export interface CodesCsvRow {
  line: number; // 1-based CSV line, for error messages
  locale: string;
  slug: string;
  code: string;
  status: CodeStatus;
  reward: string; // '' = not provided
  expiryDate: string; // '' = not provided
  source: string; // '' = not provided
}

export interface CsvResult {
  rows: CodesCsvRow[];
  errors: string[];
  notes: string[];
}

export interface MergeStats {
  added: string[];
  updated: string[];
  expiredFlipped: string[];
  unchanged: string[];
}

const CODE_STATUSES: readonly CodeStatus[] = ['active', 'expired'];
const KNOWN_ENTRY_KEYS = ['code', 'reward', 'status', 'expiryDate', 'source'];
const CSV_COLUMNS = ['locale', 'slug', 'code', 'status', 'reward', 'expiryDate', 'source'];
const REQUIRED_COLUMNS = ['slug', 'code'] as const;

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Parse and validate a codes-sync CSV/TSV. All-or-nothing: hard errors
 * surface in `errors` and the caller must not write anything. */
export function parseCodesCsv(text: string, locales: readonly string[]): CsvResult {
  const { rows: table, unterminatedQuote } = parseDelimited(text);
  const result: CsvResult = { rows: [], errors: [], notes: [] };
  if (unterminatedQuote) {
    result.errors.push('input has an unterminated quoted field — a " opened but never closed');
    return result;
  }
  if (table.length === 0) {
    result.errors.push('input is empty');
    return result;
  }

  const headerIdx = table.findIndex((cells) => !isBlankOrComment(cells));
  if (headerIdx === -1) {
    result.errors.push(`no header row found (expected columns: ${CSV_COLUMNS.join(', ')})`);
    return result;
  }
  const header = table[headerIdx].map((h) => h.trim().toLowerCase());
  // Column names are camelCase (expiryDate) but the header is matched
  // case-insensitively so "expirydate" in the CSV works too.
  const colIndex = (name: string) => header.indexOf(name.toLowerCase());
  for (const col of REQUIRED_COLUMNS) {
    if (colIndex(col) === -1) {
      result.errors.push(`header is missing the "${col}" column (found: ${header.join(', ')})`);
    }
  }
  if (result.errors.length > 0) return result;

  const seen = new Set<string>(); // locale/slug/code → dedupe
  for (let r = headerIdx + 1; r < table.length; r++) {
    const cells = table[r];
    if (isBlankOrComment(cells)) continue;
    const line = r + 1;
    const get = (name: string) => (cells[colIndex(name)] ?? '').trim();

    let locale = get('locale');
    if (!locale) {
      locale = 'en';
      result.notes.push(`line ${line}: empty locale → defaulted to "en"`);
    }
    if (!locales.includes(locale)) {
      result.errors.push(`line ${line}: locale "${locale}" is not in routing.ts (${locales.join(', ')})`);
      continue;
    }

    const slug = get('slug');
    if (!slug) {
      result.errors.push(`line ${line}: slug is empty`);
      continue;
    }
    if (slug !== slug.toLowerCase()) {
      result.notes.push(`line ${line}: slug "${slug}" — target file must exist as-is; slugs are case-sensitive`);
    }

    const code = get('code');
    if (!code) {
      result.errors.push(`line ${line}: code is empty`);
      continue;
    }

    const statusRaw = get('status').toLowerCase();
    let status: CodeStatus = 'active';
    if (statusRaw && !CODE_STATUSES.includes(statusRaw as CodeStatus)) {
      result.errors.push(`line ${line}: status "${statusRaw}" is not active|expired`);
      continue;
    }
    if (!statusRaw) {
      status = 'active';
    } else {
      status = statusRaw as CodeStatus;
    }

    const expiryDate = get('expiryDate');
    if (expiryDate.length > 40) {
      result.errors.push(`line ${line}: expiryDate is ${expiryDate.length} chars (schema max 40)`);
      continue;
    }

    // A newline/control char inside a cell would be written into a single-
    // quoted YAML scalar literally, producing INVALID frontmatter that only
    // `pnpm build` would catch — far too late. Reject loudly at parse time.
    let hasControlError = false;
    for (const [name, value] of [['code', code], ['reward', get('reward')], ['expiryDate', expiryDate], ['source', get('source')]] as const) {
      if (/[\n\r\u0000-\u0008\u000B-\u001F\u007F]/.test(value)) {
        result.errors.push(`line ${line}: "${name}" contains a newline/control character (not valid in a YAML scalar)`);
        hasControlError = true;
      }
    }
    if (hasControlError) continue;

    const dedupeKey = `${locale}/${slug}/${code}`;
    if (seen.has(dedupeKey)) {
      result.errors.push(`line ${line}: duplicate row for ${locale}/${slug} code "${code}"`);
      continue;
    }
    seen.add(dedupeKey);

    result.rows.push({
      line,
      locale,
      slug,
      code,
      status,
      reward: get('reward'),
      expiryDate,
      source: get('source'),
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Merge (never deletes; new codes prepended)
// ---------------------------------------------------------------------------

export function mergeCodes(
  existing: CodesEntry[],
  rows: CodesCsvRow[],
): { merged: CodesEntry[]; stats: MergeStats } {
  const stats: MergeStats = { added: [], updated: [], expiredFlipped: [], unchanged: [] };
  const byCode = new Map<string, CodesEntry>();
  for (const entry of existing) byCode.set(entry.code, entry);

  const addedEntries: CodesEntry[] = [];
  for (const row of rows) {
    const current = byCode.get(row.code);
    if (!current) {
      const entry: CodesEntry = { code: row.code, status: row.status };
      if (row.reward) entry.reward = row.reward;
      if (row.expiryDate) entry.expiryDate = row.expiryDate;
      if (row.source) entry.source = row.source;
      addedEntries.push(entry);
      byCode.set(row.code, entry);
      stats.added.push(row.code);
      continue;
    }
    const before = JSON.stringify(current);
    const statusBefore = current.status;
    current.status = row.status;
    if (row.reward) current.reward = row.reward;
    if (row.expiryDate) current.expiryDate = row.expiryDate;
    if (row.source) current.source = row.source;
    if (JSON.stringify(current) === before) {
      stats.unchanged.push(row.code);
    } else if (statusBefore === 'active' && row.status === 'expired') {
      stats.expiredFlipped.push(row.code);
    } else {
      stats.updated.push(row.code);
    }
  }
  return { merged: [...addedEntries, ...existing], stats };
}

// ---------------------------------------------------------------------------
// Cross-locale fan-out
// ---------------------------------------------------------------------------

/** Expand per-locale rows to every locale that has the same slug page but no
 * explicit row — the anvil-update-codes skill's Step 3 semantics ("同步数据"
 * wherever a same-name page exists). Explicit rows always win (so per-locale
 * translated reward/source text stays possible); fan-out rows are shallow
 * clones of the slug's FIRST explicit row with only the locale changed, i.e.
 * reward/source text is copied as-given and needs a wording review on non-en
 * locales. Only `targetLocales` are filled (respects the --locales filter);
 * locales without an existing page are skipped (sync never creates pages). */
export function fanOutLocales(
  groups: Map<string, CodesCsvRow[]>,
  targetLocales: readonly string[],
  hasPage: (locale: string, slug: string) => boolean,
): { groups: Map<string, CodesCsvRow[]>; notes: string[] } {
  const notes: string[] = [];
  const expanded = new Map(groups);
  const covered = new Map<string, Set<string>>(); // slug → locales with rows
  const sources = new Map<string, CodesCsvRow>(); // slug → first explicit row
  for (const [key, rows] of groups) {
    const [locale, slug] = key.split('/');
    if (!covered.has(slug)) covered.set(slug, new Set());
    covered.get(slug)!.add(locale);
    if (!sources.has(slug)) sources.set(slug, rows[0]);
  }
  for (const [slug, source] of sources) {
    for (const locale of targetLocales) {
      if (covered.get(slug)!.has(locale)) continue;
      if (!hasPage(locale, slug)) continue;
      expanded.set(`${locale}/${slug}`, [{ ...source, locale, line: source.line }]);
      covered.get(slug)!.add(locale);
      notes.push(
        `slug "${slug}": locale "${locale}" has no CSV row → synced from the "${source.locale}" row (line ${source.line}); review reward/source wording`,
      );
    }
  }
  return { groups: expanded, notes };
}

// ---------------------------------------------------------------------------
// Frontmatter: parse the flat codes block
// ---------------------------------------------------------------------------

export interface ParsedCodes {
  codes: CodesEntry[];
  hasBlock: boolean; // an explicit `codes:` key exists (vs no key at all)
}

/** Scan one YAML scalar: returns its value plus any trailing content after a
 * properly closed quote (comments/garbage — which the caller must reject,
 * since an inline comment would be silently corrupted on rewrite). */
function scanYamlScalar(raw: string): { value: string; rest: string } | { error: string } {
  const v = raw.trim();
  if (v.startsWith("'")) {
    let i = 1;
    let out = '';
    while (i < v.length) {
      if (v[i] === "'") {
        if (v[i + 1] === "'") {
          out += "'";
          i += 2;
          continue;
        }
        break;
      }
      out += v[i];
      i++;
    }
    if (i >= v.length) return { error: 'unterminated single-quoted value' };
    return { value: out, rest: v.slice(i + 1) };
  }
  if (v.startsWith('"')) {
    let i = 1;
    let out = '';
    while (i < v.length) {
      if (v[i] === '\\') {
        out += v[i + 1] ?? '';
        i += 2;
        continue;
      }
      if (v[i] === '"') break;
      out += v[i];
      i++;
    }
    if (i >= v.length) return { error: 'unterminated double-quoted value' };
    return { value: out, rest: v.slice(i + 1) };
  }
  return { value: v, rest: '' };
}

/** Read a scalar and reject inline comments / trailing garbage. */
function readScalar(raw: string, lineNo: number): { value: string } | { error: string } {
  const scanned = scanYamlScalar(raw);
  if ('error' in scanned) return { error: `line ${lineNo}: ${scanned.error}` };
  if (scanned.rest.trim() !== '') {
    return { error: `line ${lineNo}: inline comments/trailing content are not supported in the codes block ("${raw.trim().slice(0, 40)}")` };
  }
  if (!raw.trim().startsWith("'") && !raw.trim().startsWith('"') && scanned.value.includes('#')) {
    return { error: `line ${lineNo}: inline comments are not supported in the codes block` };
  }
  return { value: scanned.value };
}

/** A CRLF-saved page (Windows editors are an explicit supported audience)
 * must sync like any other: parse on a normalized copy, and remember the
 * file's EOL so upsert can re-apply it instead of silently converting. */
function splitLines(fileText: string): { lines: string[]; eol: string } {
  const eol = fileText.includes('\r\n') ? '\r\n' : '\n';
  const lines = (eol === '\r\n' ? fileText.replace(/\r\n/g, '\n') : fileText).split('\n');
  return { lines, eol };
}

/** Parse the `codes:` frontmatter block. Conservative: any structure beyond
 * flat single-line scalars (nested maps, multiline strings, unknown keys,
 * comments inside the block) is a loud error, never a silent rewrite. */
export function parseCodesBlock(fileText: string): ParsedCodes | { error: string } {
  const { lines } = splitLines(fileText);
  if ((lines[0] ?? '').trim() !== '---') return { error: 'file does not start with a frontmatter --- delimiter' };
  let closing = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closing = i;
      break;
    }
  }
  if (closing === -1) return { error: 'frontmatter is not closed (no second ---)' };

  let codesLine = -1;
  for (let i = 1; i < closing; i++) {
    const m = lines[i].match(/^codes:\s*(.*)$/);
    if (m) {
      codesLine = i;
      if (m[1].trim() && m[1].trim() !== '[]') {
        return { error: `codes: has inline value "${m[1].trim()}" — only a block list or [] is supported` };
      }
      break;
    }
  }
  if (codesLine === -1) return { codes: [], hasBlock: false };

  // Block extends until the first non-blank, non-indented line.
  let end = closing;
  for (let i = codesLine + 1; i < closing; i++) {
    const l = lines[i];
    if (l.trim() === '') continue;
    if (/^\s/.test(l)) continue;
    end = i;
    break;
  }

  const codes: CodesEntry[] = [];
  let current: CodesEntry | null = null;
  for (let i = codesLine + 1; i < end; i++) {
    const l = lines[i];
    if (l.trim() === '') continue;
    const entryStart = l.match(/^\s*-\s+code:\s*(.*)$/);
    if (entryStart) {
      const codeRead = readScalar(entryStart[1], i + 1);
      if ('error' in codeRead) return codeRead;
      if (current) codes.push(current);
      if (!codeRead.value) return { error: `line ${i + 1}: codes entry has an empty code` };
      current = { code: codeRead.value, status: 'active' };
      continue;
    }
    const field = l.match(/^\s+([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (field && current) {
      const key = field[1];
      if (!KNOWN_ENTRY_KEYS.includes(key)) {
        return { error: `line ${i + 1}: unknown key "${key}" in codes entry (supported: ${KNOWN_ENTRY_KEYS.join(', ')})` };
      }
      if (key === 'code') return { error: `line ${i + 1}: "code" must start its entry ("- code: …")` };
      const valueRead = readScalar(field[2], i + 1);
      if ('error' in valueRead) return valueRead;
      const value = valueRead.value;
      if (key === 'status') {
        if (value !== 'active' && value !== 'expired') {
          return { error: `line ${i + 1}: status "${value}" is not active|expired` };
        }
        current.status = value;
      } else if (value) {
        if (key === 'reward') current.reward = value;
        else if (key === 'expiryDate') current.expiryDate = value;
        else if (key === 'source') current.source = value;
      }
      continue;
    }
    return { error: `line ${i + 1}: unrecognised line in codes block ("${l.trim().slice(0, 60)}") — manual review needed` };
  }
  if (current) codes.push(current);
  return { codes, hasBlock: true };
}

// ---------------------------------------------------------------------------
// Frontmatter: serialize + splice back
// ---------------------------------------------------------------------------

const quoteYaml = (v: string) => `'${v.replace(/'/g, "''")}'`;
const BARE_CODE = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

export function serializeCodesBlock(entries: CodesEntry[]): string[] {
  const lines: string[] = ['codes:'];
  for (const e of entries) {
    // Key order mirrors the demo page convention: code, reward, status, …
    lines.push(`  - code: ${BARE_CODE.test(e.code) ? e.code : quoteYaml(e.code)}`);
    if (e.reward) lines.push(`    reward: ${quoteYaml(e.reward)}`);
    lines.push(`    status: ${e.status}`);
    if (e.expiryDate) lines.push(`    expiryDate: ${quoteYaml(e.expiryDate)}`);
    if (e.source) lines.push(`    source: ${quoteYaml(e.source)}`);
  }
  return lines;
}

/** Replace (or insert) the codes block and bump lastModified. Everything
 * outside the touched lines is preserved byte-for-byte; the file's original
 * EOL style (LF or CRLF) is kept. */
export function upsertCodesFrontmatter(
  fileText: string,
  entries: CodesEntry[],
  today: string,
): { output: string } | { error: string } {
  const { lines, eol } = splitLines(fileText);
  if ((lines[0] ?? '').trim() !== '---') return { error: 'file does not start with a frontmatter --- delimiter' };
  let closing = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closing = i;
      break;
    }
  }
  if (closing === -1) return { error: 'frontmatter is not closed (no second ---)' };

  // 1) lastModified: replace in place, or insert after `date:` / before close.
  let lastModified = -1;
  let dateLine = -1;
  for (let i = 1; i < closing; i++) {
    if (/^lastModified:/.test(lines[i])) lastModified = i;
    if (/^date:/.test(lines[i])) dateLine = i;
  }
  if (lastModified !== -1) {
    lines[lastModified] = `lastModified: ${today}`;
  } else if (dateLine !== -1) {
    lines.splice(dateLine + 1, 0, `lastModified: ${today}`);
    closing += 1;
  } else {
    lines.splice(closing, 0, `lastModified: ${today}`);
    closing += 1;
  }

  // 2) codes block: replace existing lines, or insert before the closing ---.
  const block = serializeCodesBlock(entries);
  let codesLine = -1;
  for (let i = 1; i < closing; i++) {
    if (/^codes:/.test(lines[i])) {
      codesLine = i;
      break;
    }
  }
  if (codesLine !== -1) {
    let end = closing;
    for (let i = codesLine + 1; i < closing; i++) {
      if (lines[i].trim() === '') continue;
      if (/^\s/.test(lines[i])) continue;
      end = i;
      break;
    }
    lines.splice(codesLine, end - codesLine, ...block);
  } else {
    lines.splice(closing, 0, ...block);
  }
  return { output: lines.join(eol) };
}
