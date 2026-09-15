/**
 * gen-assets — generate the theme-colored favicon set + hero image (v2.4).
 *
 * Usage:
 *   pnpm gen-assets            # regenerate assets whose inputs changed
 *   pnpm gen-assets --force    # ignore the cache manifest
 *
 * What it writes (IN PLACE, same filenames the template already references —
 * zero code changes needed; the fork lesson this closes: shipping the demo
 * anvil favicon to production because binary assets were "manual, later"):
 *   public/favicon.svg                    brand square + game initial (SVG <text>)
 *   public/favicon-16x16.png              ┐
 *   public/favicon-32x32.png              │ satori-rendered 512 square,
 *   public/apple-touch-icon.png (180)     │ sharp-resized per size
 *   public/android-chrome-192x192.png     │
 *   public/android-chrome-512x512.png     ┘
 *   public/images/hero.webp (1200×630)    brand gradient + site name (og default)
 *   public/manifest.json theme_color      synced to the live brand color
 *
 * Fonts: same pipeline as gen-covers — bundled OFL Lato for Latin, Noto Sans
 * CJK SC (downloaded once, subset per glyph) when the initial is CJK.
 *
 * favicon.ico is NOT regenerated (sharp cannot emit ICO). After this script
 * BaseLayout points browsers at favicon.svg/PNG, so the stale .ico is simply
 * never requested; delete it manually if you want.
 *
 * Cache: node_modules/.cache/gen-assets/manifest.json (stableHash of inputs;
 * cache lives OUTSIDE public/ so nothing extra ever ships to production).
 * Unchanged entries are skipped.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import subsetFont from 'subset-font';
import { site } from '~/config/site';
import { hslToHex, hasCjk, parseBrandHsl, stableHash, stripEmoji, subsetText } from '~/lib/covers';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(root, 'public');
const FONT_CACHE = join(root, 'node_modules/.cache/gen-covers/fonts');
const MANIFEST_VERSION = 1;
const FORCE = process.argv.includes('--force');

const NOTO_BASE = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF';

/** Contrast-safe text color on a brand-colored square (WCAG-ish luminance). */
function textColorOn(brandHsl: { h: number; s: number; l: number }): string {
  return brandHsl.l > 60 ? '#111827' : '#ffffff';
}

async function fontsFor(text: string) {
  const latin = (
    [
      ['Lato-Regular.ttf', 400],
      ['Lato-Bold.ttf', 700],
    ] as const
  ).map(([file, weight]) => ({
    name: 'Lato',
    data: readFileSync(join(root, 'scripts/fonts', file)),
    weight,
    style: 'normal' as const,
  }));
  if (!hasCjk(text)) return latin;

  // A single CJK initial: Noto Sans CJK SC covers han + kana glyphs alike.
  const file = 'NotoSansCJKsc-Regular.otf';
  let otf: Buffer | null = null;
  for (const dir of [join(root, 'scripts/fonts'), FONT_CACHE]) {
    const p = join(dir, file);
    if (existsSync(p)) {
      otf = readFileSync(p);
      break;
    }
  }
  if (!otf) {
    const url = `${NOTO_BASE}/SimplifiedChinese/${file}`;
    console.log('  downloading NotoSansCJKsc-Regular.otf (~16MB, cached for future runs) …');
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}. Offline? Pre-download the OTF into scripts/fonts/.`);
    otf = Buffer.from(await res.arrayBuffer());
    mkdirSync(FONT_CACHE, { recursive: true });
    writeFileSync(join(FONT_CACHE, file), otf);
  }
  return [
    ...latin,
    {
      name: 'Noto Sans CJK SC',
      data: await subsetFont(otf, subsetText(text), { targetFormat: 'sfnt' }),
      weight: 400 as const,
      style: 'normal' as const,
    },
  ];
}

async function renderPng(element: unknown, width: number, height: number, fonts: unknown[]) {
  const svg = await satori(element as never, {
    width,
    height,
    fonts: fonts as never,
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

async function main() {
  const css = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
  const brand = parseBrandHsl(css);
  if (!brand) {
    console.error('❌ could not parse --brand from src/styles/globals.css');
    process.exit(1);
  }
  const brandHex = hslToHex(brand.h, brand.s, brand.l);
  const brandDeep = hslToHex(brand.h, brand.s, Math.max(brand.l - 18, 12));
  const ink = textColorOn(brand);

  const initial = stripEmoji(site.game.name).trim().charAt(0).toUpperCase() || 'W';
  const gameName = stripEmoji(site.game.name).trim() || site.name;
  const heroTitle = stripEmoji(site.name).trim();

  const manifestPath = join(root, 'node_modules/.cache/gen-assets/manifest.json');
  mkdirSync(dirname(manifestPath), { recursive: true });
  const manifest: Record<string, string> = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {};
  const cacheKey = (name: string, ...inputs: string[]) =>
    stableHash(`${MANIFEST_VERSION}|${name}|${inputs.join('|')}`);
  const fresh = (name: string, hash: string) => FORCE || manifest[name] !== hash;

  console.log(`\n🎨 gen-assets — brand ${brandHex}, initial "${initial}"\n`);

  // 1. favicon.svg — handwritten SVG (browser renders the <text> with its own
  //    system fonts; no font embedding needed at this size).
  const svgHash = cacheKey('favicon.svg', brandHex, initial);
  if (fresh('favicon.svg', svgHash)) {
    writeFileSync(
      join(PUBLIC, 'favicon.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${brandHex}"/><text x="32" y="43" font-family="system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans CJK SC', sans-serif" font-size="34" font-weight="700" fill="${ink}" text-anchor="middle">${initial}</text></svg>\n`,
    );
    manifest['favicon.svg'] = svgHash;
    console.log('  ✅ public/favicon.svg');
  }

  // 2. PNG favicons — one 512px satori render, sharp-resized per size.
  const pngHash = cacheKey('favicon-png', brandHex, initial);
  if (fresh('favicon-png', pngHash)) {
    const fonts = await fontsFor(initial);
    const png512 = await renderPng(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: brandHex,
            color: ink,
            fontSize: 300,
            fontWeight: 700,
            fontFamily: hasCjk(initial) ? 'Noto Sans CJK SC' : 'Lato',
          },
          children: initial,
        },
      },
      512,
      512,
      fonts,
    );
    const sizes: Array<[string, number]> = [
      ['favicon-16x16.png', 16],
      ['favicon-32x32.png', 32],
      ['apple-touch-icon.png', 180],
      ['android-chrome-192x192.png', 192],
      ['android-chrome-512x512.png', 512],
    ];
    for (const [name, size] of sizes) {
      const buf =
        size === 512 ? png512 : await sharp(png512).resize(size, size, { fit: 'contain' }).png().toBuffer();
      writeFileSync(join(PUBLIC, name), buf);
      console.log(`  ✅ public/${name} (${size}×${size})`);
    }
    manifest['favicon-png'] = pngHash;
  }

  // 3. hero.webp — 1200×630 brand gradient + site name (the default og:image).
  const heroHash = cacheKey('hero.webp', brandHex, brandDeep, heroTitle);
  if (fresh('hero.webp', heroHash)) {
    const fonts = await fontsFor(heroTitle + gameName);
    const png = await renderPng(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `linear-gradient(135deg, ${brandHex} 0%, ${brandDeep} 100%)`,
            color: ink,
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 88,
                  fontWeight: 700,
                  fontFamily: hasCjk(heroTitle) ? 'Noto Sans CJK SC' : 'Lato',
                  textAlign: 'center',
                  padding: '0 60px',
                },
                children: heroTitle,
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 34,
                  marginTop: 24,
                  fontFamily: hasCjk(gameName) ? 'Noto Sans CJK SC' : 'Lato',
                  opacity: 0.85,
                },
                children: gameName,
              },
            },
          ],
        },
      },
      1200,
      630,
      fonts,
    );
    mkdirSync(join(PUBLIC, 'images'), { recursive: true });
    writeFileSync(join(PUBLIC, 'images/hero.webp'), await sharp(png).webp({ quality: 90 }).toBuffer());
    manifest['hero.webp'] = heroHash;
    console.log('  ✅ public/images/hero.webp (1200×630)');
  }

  // 4. manifest.json theme_color — keep the PWA color glued to the live brand.
  const manifestJsonPath = join(PUBLIC, 'manifest.json');
  const manifestJson = JSON.parse(readFileSync(manifestJsonPath, 'utf8'));
  if ((manifestJson.theme_color ?? '').toLowerCase() !== brandHex.toLowerCase()) {
    manifestJson.theme_color = brandHex;
    writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');
    console.log(`  ✅ public/manifest.json theme_color → ${brandHex}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('\n✅ Done. favicon.ico is intentionally left as-is (see script header).\n');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
