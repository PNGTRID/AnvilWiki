/**
 * sync-codes unit tests — the deterministic codes frontmatter updater behind
 * `pnpm sync-codes` (scripts/sync-codes.ts). The pure functions in
 * scripts/lib/sync-codes.ts are pinned byte-for-byte: CSV validation must be
 * all-or-nothing, the merge must never delete codes, and the frontmatter
 * splice must preserve everything outside the codes block / lastModified.
 */
import { describe, expect, test } from 'vitest';
import {
  mergeCodes,
  parseCodesBlock,
  parseCodesCsv,
  serializeCodesBlock,
  upsertCodesFrontmatter,
  type CodesEntry,
} from '../scripts/lib/sync-codes';

const LOCALES = ['en', 'ja'];

const pageWithCodes = (codesBlock: string): string => `---
title: 'All Working Codes (August 2026)'
description: 'Every working Anvil Quest code in August 2026, tested daily. Redeem for gold, XP boosts, and exclusive cosmetics before they expire.'
category: 'codes'
date: 2026-08-14
lastModified: 2026-08-31
tags: ['codes', 'redeem']
summary: 'Summary line.'
${codesBlock}
---

## How do I redeem codes?

Body content that must survive the splice byte-for-byte.
`;

const demoBlock = `codes:
  - code: FORGE-2026
    reward: '+500 Gold'
    status: active
    expiryDate: 'Aug 31'
    source: 'Official Discord announcement'
  - code: FROSTPIKE
    reward: '+250 Gold'
    status: expired
    expiryDate: 'Aug 21'`;

describe('parseCodesCsv', () => {
  test('parses rows with defaults (locale → en, status → active) and skips comments/blanks', () => {
    const csv = [
      '# comment line',
      '',
      'locale,slug,code,status,reward,expiryDate,source',
      'en,all-codes,SUMMER-2026,active,"+500 Gold",Sep 30,Official Discord',
      'ja,all-codes,SUMMER-2026,,,',
      ',all-codes,PLAIN,,,',
    ].join('\n');
    const { rows, errors, notes } = parseCodesCsv(csv, LOCALES);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ locale: 'en', slug: 'all-codes', code: 'SUMMER-2026', status: 'active', reward: '+500 Gold', expiryDate: 'Sep 30', source: 'Official Discord' });
    expect(rows[1]).toMatchObject({ locale: 'ja', status: 'active', reward: '', expiryDate: '', source: '' });
    expect(rows[2]).toMatchObject({ locale: 'en', code: 'PLAIN' });
    expect(notes.some((n) => n.includes('defaulted to "en"'))).toBe(true);
  });

  test('rejects unknown locales, bad status, empty code/slug, oversize expiryDate — all-or-nothing', () => {
    const csv = [
      'locale,slug,code,status,expiryDate',
      'fr,all-codes,X,,,', // unknown locale
      'en,all-codes,Y,sold-out,', // bad status
      'en,all-codes,,,', // empty code
      'en,,Z,,', // empty slug
      `en,all-codes,W,,${'x'.repeat(41)}`, // expiryDate > 40 (schema cap)
    ].join('\n');
    const { rows, errors } = parseCodesCsv(csv, LOCALES);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(5);
  });

  test('rejects duplicate rows for the same page+code and a missing header column', () => {
    const dup = parseCodesCsv('locale,slug,code\nen,all-codes,A\nen,all-codes,A', LOCALES);
    expect(dup.errors.some((e) => e.includes('duplicate row'))).toBe(true);
    const noCol = parseCodesCsv('locale,slug\nen,all-codes', LOCALES);
    expect(noCol.errors[0]).toContain('missing the "code" column');
  });

  test('TSV input is auto-detected', () => {
    const { rows, errors } = parseCodesCsv('locale\tslug\tcode\nen\tall-codes\tTABBY', LOCALES);
    expect(errors).toEqual([]);
    expect(rows[0]?.code).toBe('TABBY');
  });
});

describe('mergeCodes', () => {
  const existing: CodesEntry[] = [
    { code: 'FORGE-2026', reward: '+500 Gold', status: 'active', expiryDate: 'Aug 31' },
    { code: 'FROSTPIKE', reward: '+250 Gold', status: 'expired', expiryDate: 'Aug 21' },
  ];
  const row = (over: Partial<{ code: string; status: 'active' | 'expired'; reward: string; expiryDate: string }>) => ({
    line: 2,
    locale: 'en',
    slug: 'all-codes',
    code: 'X',
    status: 'active' as const,
    reward: '',
    expiryDate: '',
    source: '',
    ...over,
  });

  test('new codes are prepended in CSV order; existing entries keep their order', () => {
    const { merged, stats } = mergeCodes(existing, [
      row({ code: 'NEW-B' }),
      row({ code: 'NEW-A' }),
    ]);
    expect(merged.map((c) => c.code)).toEqual(['NEW-B', 'NEW-A', 'FORGE-2026', 'FROSTPIKE']);
    expect(stats.added).toEqual(['NEW-B', 'NEW-A']);
    expect(merged[0]).toMatchObject({ code: 'NEW-B', status: 'active' });
  });

  test('active → expired flips are tracked and the entry is kept in place', () => {
    const { merged, stats } = mergeCodes(existing, [row({ code: 'FORGE-2026', status: 'expired' })]);
    expect(stats.expiredFlipped).toEqual(['FORGE-2026']);
    const forge = merged.find((c) => c.code === 'FORGE-2026');
    expect(forge?.status).toBe('expired');
    expect(merged.map((c) => c.code)).toContain('FORGE-2026');
  });

  test('empty optional CSV cells keep existing values; provided cells overwrite', () => {
    const { merged, stats } = mergeCodes(existing, [row({ code: 'FORGE-2026', reward: '+750 Gold' })]);
    expect(stats.updated).toEqual(['FORGE-2026']);
    expect(merged[0]).toMatchObject({ reward: '+750 Gold', expiryDate: 'Aug 31' });
    const again = mergeCodes(merged, [row({ code: 'FORGE-2026', reward: '+750 Gold' })]);
    expect(again.stats.unchanged).toEqual(['FORGE-2026']);
  });
});

describe('parseCodesBlock', () => {
  test('parses the demo page shape (single quotes, optional fields, bare codes)', () => {
    const parsed = parseCodesBlock(pageWithCodes(demoBlock));
    expect('error' in parsed && parsed.error).toBe(false);
    if ('error' in parsed) return;
    expect(parsed.hasBlock).toBe(true);
    expect(parsed.codes).toEqual([
      { code: 'FORGE-2026', reward: '+500 Gold', status: 'active', expiryDate: 'Aug 31', source: 'Official Discord announcement' },
      { code: 'FROSTPIKE', reward: '+250 Gold', status: 'expired', expiryDate: 'Aug 21' },
    ]);
  });

  test('handles double quotes, unquoted values, codes: [] and a missing block', () => {
    const mixed = pageWithCodes('codes:\n  - code: "DBL-1"\n    reward: "2× XP (30 min)"\n    status: expired');
    const parsed = parseCodesBlock(mixed);
    if ('error' in parsed) throw new Error(parsed.error);
    expect(parsed.codes[0]).toMatchObject({ code: 'DBL-1', status: 'expired', reward: '2× XP (30 min)' });

    const empty = parseCodesBlock(pageWithCodes('codes: []'));
    if ('error' in empty) throw new Error(empty.error);
    expect(empty).toEqual({ codes: [], hasBlock: true });

    const missing = parseCodesBlock('---\ntitle: X\n---\n\nBody.');
    if ('error' in missing) throw new Error(missing.error);
    expect(missing).toEqual({ codes: [], hasBlock: false });
  });

  test('aborts loudly on unknown keys, bad status, inline comments and malformed lines', () => {
    expect(parseCodesBlock(pageWithCodes('codes:\n  - code: A\n    note: hello'))).toHaveProperty('error');
    expect(parseCodesBlock(pageWithCodes('codes:\n  - code: A\n    status: maybe'))).toHaveProperty('error');
    expect(parseCodesBlock(pageWithCodes("codes:\n  - code: A\n    reward: '+5' # note"))).toHaveProperty('error');
    expect(parseCodesBlock(pageWithCodes('codes:\n  - code: A\n  - - weird'))).toHaveProperty('error');
    expect(parseCodesBlock('no frontmatter here')).toHaveProperty('error');
  });
});

describe('serializeCodesBlock + upsertCodesFrontmatter', () => {
  test('round-trips the demo block and is idempotent', () => {
    const page = pageWithCodes(demoBlock);
    const parsed = parseCodesBlock(page);
    if ('error' in parsed) throw new Error(parsed.error);
    const once = upsertCodesFrontmatter(page, parsed.codes, '2026-09-06');
    if ('error' in once) throw new Error(once.error);
    const reparsed = parseCodesBlock(once.output);
    if ('error' in reparsed) throw new Error(reparsed.error);
    expect(reparsed.codes).toEqual(parsed.codes);
    const twice = upsertCodesFrontmatter(once.output, reparsed.codes, '2026-09-06');
    if ('error' in twice) throw new Error(twice.error);
    expect(twice.output).toBe(once.output);
  });

  test('bumps lastModified, preserves body and other frontmatter keys', () => {
    const page = pageWithCodes(demoBlock);
    const parsed = parseCodesBlock(page);
    if ('error' in parsed) throw new Error(parsed.error);
    const out = upsertCodesFrontmatter(page, parsed.codes, '2026-09-06');
    if ('error' in out) throw new Error(out.error);
    expect(out.output).toContain('lastModified: 2026-09-06');
    expect(out.output).toContain("title: 'All Working Codes (August 2026)'");
    expect(out.output).toContain('Body content that must survive the splice byte-for-byte.');
    expect(out.output).not.toContain('lastModified: 2026-08-31');
  });

  test('inserts codes block and lastModified when absent', () => {
    const page = '---\ntitle: X\ndate: 2026-08-14\ncategory: codes\n---\n\nBody.';
    const out = upsertCodesFrontmatter(page, [{ code: 'NEW-1', status: 'active', reward: '+1 Gold' }], '2026-09-06');
    if ('error' in out) throw new Error(out.error);
    expect(out.output).toContain('lastModified: 2026-09-06');
    expect(out.output).toMatch(/codes:\n  - code: NEW-1\n    reward: '\+1 Gold'\n    status: active\n---/);
  });

  test('quotes values containing YAML-hostile characters (colons, quotes)', () => {
    const lines = serializeCodesBlock([{ code: 'WEIRD:CODE', status: 'active', reward: "say 'hi': +500", source: "a 'source'" }]);
    expect(lines).toEqual([
      'codes:',
      "  - code: 'WEIRD:CODE'",
      "    reward: 'say ''hi'': +500'",
      '    status: active',
      "    source: 'a ''source'''",
    ]);
  });
});
