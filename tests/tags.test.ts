import { describe, it, expect } from 'vitest';
import { videoObjectJsonLd, urlListJsonLd, imageObjectJsonLd } from '~/lib/seo';
import { slugifyTag, tagPath, tagsPath, recentPath } from '~/lib/url';

describe('slugifyTag', () => {
  it('lowercases and hyphenates whitespace', () => {
    expect(slugifyTag('Fire Boss')).toBe('fire-boss');
  });
  it('routes tags with surviving non-slug chars to the raw path (same as CJK)', () => {
    // Stripping just the punctuation would keep 'DPS Check!' → 'dps-check',
    // but a partial strip is exactly what collides mixed tags ('Roblox 焰牙'
    // and 'Roblox 攻略' would both strip to 'roblox-'). Any character outside
    // [a-z0-9-] surviving the fold → raw, and chip link vs route param still
    // match because both go through this single function.
    expect(slugifyTag('DPS Check!')).toBe('DPS Check!');
    expect(slugifyTag('Roblox 焰牙')).not.toBe(slugifyTag('Roblox 攻略'));
    expect(slugifyTag('DPS Check!')).toBe(slugifyTag(slugifyTag('DPS Check!')));
  });
  it('converts underscores to hyphens', () => {
    expect(slugifyTag('early_game')).toBe('early-game');
  });
  it('is idempotent', () => {
    expect(slugifyTag(slugifyTag('Ash Warden'))).toBe(slugifyTag('Ash Warden'));
  });
});

describe('tag/recent URL helpers', () => {
  it('builds unprefixed English paths', () => {
    expect(tagsPath('en')).toBe('/tags/');
    expect(tagPath('fire-boss', 'en')).toBe('/tags/fire-boss/');
    expect(recentPath('en')).toBe('/recent/');
  });
  it('prefixes non-default locales', () => {
    expect(tagsPath('ja')).toBe('/ja/tags/');
    expect(tagPath('fire-boss', 'ja')).toBe('/ja/tags/fire-boss/');
    expect(recentPath('ja')).toBe('/ja/recent/');
  });
});

describe('videoObjectJsonLd', () => {
  it('builds a VideoObject with YouTube thumbnail and embed URLs', () => {
    const json = videoObjectJsonLd({
      videoId: 'dQw4w9WgXcQ',
      title: 'Test',
      description: 'A test video description.',
      uploadDate: new Date('2026-01-01'),
    });
    expect(json['@type']).toBe('VideoObject');
    expect(json.name).toBe('Test');
    // description is one of Google's four required VideoObject fields —
    // omitting it gets the page's video rich result flagged in GSC.
    expect(json.description).toBe('A test video description.');
    expect(json.thumbnailUrl[0]).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(json.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(json.uploadDate).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('imageObjectJsonLd', () => {
  it('builds an ImageObject with contentUrl and optional caption', () => {
    const json = imageObjectJsonLd({ url: 'https://example.com/img.webp', caption: 'Arena' });
    expect(json['@type']).toBe('ImageObject');
    expect(json.contentUrl).toBe('https://example.com/img.webp');
    expect(json.name).toBe('Arena');
  });
  it('omits caption fields when no caption given', () => {
    const json = imageObjectJsonLd({ url: 'https://example.com/img.webp' });
    expect(json.name).toBeUndefined();
  });
});

describe('urlListJsonLd', () => {
  it('numbers items from 1 with absolute URLs preserved', () => {
    const json = urlListJsonLd({
      name: 'Fire',
      items: [
        { title: 'A', url: 'https://example.com/bosses/a' },
        { title: 'B', url: 'https://example.com/bosses/b' },
      ],
    });
    expect(json.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'A',
      url: 'https://example.com/bosses/a',
    });
    expect(json.itemListElement[1].position).toBe(2);
  });
});
