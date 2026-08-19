// 一次性脚本：生成 Aniimo Wiki 品牌资产（hero.webp + favicon 全套）。生成后可删除。
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const BRAND_GREEN = '#22c55e';
const BRAND_DARK = '#166534';

const heroSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_DARK}"/>
      <stop offset="55%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="${BRAND_GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="180" cy="540" r="160" fill="#ffffff" opacity="0.06"/>
  <circle cx="600" cy="315" r="290" fill="#ffffff" opacity="0.04"/>
  <text x="600" y="290" font-family="Segoe UI, Arial, sans-serif" font-size="110" font-weight="700"
        fill="#ffffff" text-anchor="middle">Aniimo Wiki</text>
  <text x="600" y="370" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="400"
        fill="#dcfce7" text-anchor="middle">Codes · Tier Lists · Aniilog Database · Guides</text>
  <text x="600" y="470" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="400"
        fill="#bbf7d0" text-anchor="middle" opacity="0.85">Fan-made community wiki — launching with Aniimo on September 16, 2026</text>
</svg>`;

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_DARK}"/>
      <stop offset="100%" stop-color="${BRAND_GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g fill="#ffffff">
    <ellipse cx="256" cy="180" rx="52" ry="44"/>
    <ellipse cx="150" cy="268" rx="42" ry="38" transform="rotate(-24 150 268)"/>
    <ellipse cx="362" cy="268" rx="42" ry="38" transform="rotate(24 362 268)"/>
    <path d="M 256 268 Q 200 330 216 392 Q 236 440 296 440 Q 356 440 376 392 Q 392 330 336 268 Q 296 244 256 268 Z"/>
  </g>
</svg>`;

const out = 'public';

// hero.webp（og:image 1200×630）
await sharp(Buffer.from(heroSvg)).webp({ quality: 90 }).toFile(`${out}/images/hero.webp`);

// favicon PNG 全套
const png32 = await sharp(Buffer.from(iconSvg)).resize(32, 32).png().toBuffer();
await sharp(Buffer.from(iconSvg)).resize(16, 16).png().toFile(`${out}/favicon-16x16.png`);
writeFileSync(`${out}/favicon-32x32.png`, png32);
await sharp(Buffer.from(iconSvg)).resize(180, 180).png().toFile(`${out}/apple-touch-icon.png`);
await sharp(Buffer.from(iconSvg)).resize(192, 192).png().toFile(`${out}/android-chrome-192x192.png`);
await sharp(Buffer.from(iconSvg)).resize(512, 512).png().toFile(`${out}/android-chrome-512x512.png`);

// favicon.ico（PNG-in-ICO 容器，32px）
const ico = Buffer.alloc(6 + 16 + png32.length);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type: icon
ico.writeUInt16LE(1, 4); // count
ico.writeUInt8(32, 6); // width
ico.writeUInt8(32, 7); // height
ico.writeUInt8(0, 8); // palette
ico.writeUInt8(0, 9); // reserved
ico.writeUInt16LE(1, 10); // planes
ico.writeUInt16LE(32, 12); // bpp
ico.writeUInt32LE(png32.length, 14); // size
png32.copy(ico, 22);
writeFileSync(`${out}/favicon.ico`, ico);

console.log('Assets generated: hero.webp + favicon set');
