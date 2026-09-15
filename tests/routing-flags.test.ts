/**
 * routing-flags reader tests — the shared regex extraction from
 * src/i18n/routing.ts used by six scripts (check-config, check-i18n,
 * check-content, bulk-new-posts, new-post, sync-codes).
 *
 * Two contract layers:
 *   - success: the real routing.ts parses (pins the accepted shape against
 *     the file apply-template / new-locale actually write), and the
 *     tolerant-but-loud defaultLocale form accepts both annotation styles;
 *   - failure: a missing file or mangled declaration is LOUD — console.error
 *     with ❌ + process.exit(1), never a silent fallback (the old
 *     check-content defaultLocale regex silently assumed 'en').
 *
 * process.exit is mocked to THROW so no fall-through code can run past a
 * failure path (and the exit code is asserted via the thrown sentinel).
 */
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readDefaultLocale, readLocales } from '../scripts/lib/routing-flags';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Write a routing.ts fixture under <tmp>/src/i18n/ and return the fake root. */
function makeRoutingFixture(content: string): string {
  const root = fs.mkdtempSync(join(tmpdir(), 'anvil-routing-'));
  fs.mkdirSync(join(root, 'src', 'i18n'), { recursive: true });
  fs.writeFileSync(join(root, 'src', 'i18n', 'routing.ts'), content, 'utf8');
  return root;
}

describe('readLocales / readDefaultLocale — success', () => {
  test('parses the real repo routing.ts', () => {
    expect(readLocales(repoRoot)).toEqual(['en', 'ja']);
    expect(readDefaultLocale(repoRoot)).toBe('en');
  });

  test('default root is the process cwd (repo root under vitest)', () => {
    expect(readLocales()).toEqual(['en', 'ja']);
  });

  test('accepts defaultLocale with and without the `: Locale` annotation', () => {
    const annotated = makeRoutingFixture(
      "export const locales = ['en', 'ja'] as const;\nexport const defaultLocale: Locale = 'ja';\n",
    );
    expect(readDefaultLocale(annotated)).toBe('ja');

    const bare = makeRoutingFixture(
      "export const locales = ['en', 'ja'] as const;\nexport const defaultLocale = 'ja';\n",
    );
    expect(readDefaultLocale(bare)).toBe('ja');
  });

  test('accepts locales without `as const` and with double quotes', () => {
    const root = makeRoutingFixture('export const locales = ["en", "pt-br"];\n');
    expect(readLocales(root)).toEqual(['en', 'pt-br']);
  });
});

describe('readLocales / readDefaultLocale — loud failures', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as never);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('missing routing.ts → ❌ + exit 1 (no silent fallback)', () => {
    const root = fs.mkdtempSync(join(tmpdir(), 'anvil-routing-'));
    expect(() => readLocales(root)).toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('src/i18n/routing.ts'));

    expect(() => readDefaultLocale(root)).toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
  });

  test('mangled locales declaration → ❌ + exit 1 with the expected shape', () => {
    const noExport = makeRoutingFixture("const locales = ['en', 'ja'] as const;\n");
    expect(() => readLocales(noExport)).toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('export const locales'));

    const empty = makeRoutingFixture('export const locales = [] as const;\n');
    expect(() => readLocales(empty)).toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('export const locales'));
  });

  test('mangled defaultLocale declaration → ❌ + exit 1 with the expected shape', () => {
    const missing = makeRoutingFixture("export const locales = ['en', 'ja'] as const;\n");
    expect(() => readDefaultLocale(missing)).toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('defaultLocale'));

    const notAString = makeRoutingFixture(
      "export const locales = ['en', 'ja'] as const;\nexport const defaultLocale: Locale = DEFAULT;\n",
    );
    expect(() => readDefaultLocale(notAString)).toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('defaultLocale'));
  });
});
