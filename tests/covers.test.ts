/**
 * Pure-helper tests for `pnpm gen-covers` (src/lib/covers.ts).
 * Rendering itself (satori/resvg/CJK download) is exercised by running the
 * script — these pin the deterministic logic only.
 */
import { describe, expect, test } from 'vitest';
import {
  coverFilename,
  hasCjk,
  hexToHsl,
  hslToHex,
  parseBrandHsl,
  pickCjkScript,
  pickFontSize,
  spliceImageIntoFrontmatter,
  stableHash,
  stripEmoji,
  subsetText,
  titleWidthUnits,
} from '~/lib/covers';

describe('parseBrandHsl / hslToHex', () => {
  test('parses the light-mode --brand declaration', () => {
    const css = ':root {\n  --brand: 22 90% 52%;\n  --brand-light: 22 90% 62%;\n}';
    expect(parseBrandHsl(css)).toEqual({ h: 22, s: 90, l: 52 });
  });

  test('returns null when --brand is missing', () => {
    expect(parseBrandHsl(':root { --brand-light: 22 90% 62%; }')).toBeNull();
  });

  test('hslToHex matches known values', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
    expect(hslToHex(0, 0, 100)).toBe('#ffffff');
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });
});

describe('hexToHsl', () => {
  test('matches the reference values apply-template has always produced', () => {
    // Pinned against the previous inline implementation in apply-template.ts
    // (math was ported verbatim) — these feed globals.css + manifest.
    expect(hexToHsl('#f97316')).toEqual({ h: 25, s: 95, l: 53 });
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
  });

  test('expands #rgb shorthand and accepts uppercase', () => {
    expect(hexToHsl('#abc')).toEqual(hexToHsl('#aabbcc'));
    expect(hexToHsl('#F97316')).toEqual(hexToHsl('#f97316'));
  });

  test('rejects malformed input with null', () => {
    expect(hexToHsl('nothex')).toBeNull();
    expect(hexToHsl('#12345')).toBeNull();
    expect(hexToHsl('#1234g6')).toBeNull();
    expect(hexToHsl('')).toBeNull();
  });
});

describe('spliceImageIntoFrontmatter', () => {
  test('inserts after category on LF files, byte-identical EOL', () => {
    const src = "---\ntitle: T\ncategory: bosses\ndescription: D\n---\n\nBody";
    const out = spliceImageIntoFrontmatter(src, '../../assets/covers/x.png');
    expect(out).toBe(
      "---\ntitle: T\ncategory: bosses\nimage: '../../assets/covers/x.png'\ndescription: D\n---\n\nBody",
    );
    expect(out!.includes('\r')).toBe(false);
  });

  test('keeps a CRLF page uniformly CRLF (no mixed EOL, no doubled CR)', () => {
    const src = '---\r\ntitle: T\r\ncategory: bosses\r\ndescription: D\r\n---\r\n\r\nBody';
    const out = spliceImageIntoFrontmatter(src, 'c.png');
    expect(out).toContain("category: bosses\r\nimage: 'c.png'\r\n");
    expect(out).toContain('\r\n---\r\n');
    expect(out!.includes('\r\r')).toBe(false);
    // Uniform CRLF: after removing CRLF pairs, no bare LF remains.
    expect(out!.replace(/\r\n/g, '').includes('\n')).toBe(false);
  });

  test('falls back to description, then appends when neither exists', () => {
    expect(spliceImageIntoFrontmatter('---\ntitle: T\ndescription: D\n---\n', 'c.png')).toBe(
      "---\ntitle: T\ndescription: D\nimage: 'c.png'\n---\n",
    );
    expect(spliceImageIntoFrontmatter('---\ntitle: T\n---\n', 'c.png')).toBe(
      "---\ntitle: T\nimage: 'c.png'\n---\n",
    );
  });

  test('returns null without frontmatter or when an image already exists', () => {
    expect(spliceImageIntoFrontmatter('no frontmatter here', 'c.png')).toBeNull();
    expect(spliceImageIntoFrontmatter("---\nimage: a.png\n---\n", 'c.png')).toBeNull();
  });
});

describe('CJK detection', () => {
  test('hasCjk flags Han and kana, not Latin', () => {
    expect(hasCjk('Emberfang ボス攻略')).toBe(true);
    expect(hasCjk('完全ガイド')).toBe(true);
    expect(hasCjk('Plain English title')).toBe(false);
  });

  test('ja locale or kana picks JP glyph shapes; other Han picks SC', () => {
    expect(pickCjkScript('ja', '完全ガイド')).toBe('ja');
    expect(pickCjkScript('en', '火の玉')).toBe('ja'); // の is kana → JP glyphs
    expect(pickCjkScript('en', 'Anvil Quest')).toBeNull();
  });

  test('kana in text forces ja even on non-ja locale', () => {
    expect(pickCjkScript('en', 'ボス攻略')).toBe('ja');
    expect(pickCjkScript('en', '武器强度排行')).toBe('zh');
  });
});

describe('stripEmoji', () => {
  test('strips pictographs but keeps text', () => {
    expect(stripEmoji('Fire Titan ⚔️🔥')).toBe('Fire Titan');
    expect(stripEmoji('No emoji here')).toBe('No emoji here');
  });
});

describe('naming / hashing / subsetting', () => {
  test('coverFilename flattens the content id', () => {
    expect(coverFilename('en/bosses/emberfang')).toBe('en-bosses-emberfang.png');
    expect(coverFilename('ja/guides/beginner-guide')).toBe('ja-guides-beginner-guide.png');
  });

  test('stableHash is deterministic and hash-like', () => {
    expect(stableHash('abc')).toBe(stableHash('abc'));
    expect(stableHash('abc')).not.toBe(stableHash('abd'));
    expect(stableHash('abc')).toMatch(/^[0-9a-f]{8}$/);
  });

  test('subsetText dedupes and sorts glyphs', () => {
    expect(subsetText('abc', 'cbd')).toBe('abcd');
  });
});

describe('font sizing heuristics', () => {
  test('CJK chars count as full width, Latin as narrow', () => {
    expect(titleWidthUnits('ああ')).toBeGreaterThan(titleWidthUnits('aa'));
  });

  test('short titles get the max size, very long titles clamp to the floor', () => {
    expect(pickFontSize('Fire Titan')).toBe(84);
    const veryLong = 'x'.repeat(200);
    expect(pickFontSize(veryLong)).toBe(36);
  });
});
