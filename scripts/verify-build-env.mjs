import { readFile } from 'node:fs/promises';
import { loadEnv } from 'vite';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const localEnv = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const siteUrlValue = (process.env.SITE_URL || localEnv.SITE_URL)?.trim();
const gaId = (process.env.PUBLIC_GA_ID || localEnv.PUBLIC_GA_ID)?.trim();
const gscVerification = (
  process.env.PUBLIC_GSC_VERIFICATION || localEnv.PUBLIC_GSC_VERIFICATION
)?.trim();
const isCloudflarePages = process.env.CF_PAGES === '1';
const errors = [];

function matchContent(pattern) {
  return html.match(pattern)?.[1];
}

if (isCloudflarePages && !siteUrlValue) {
  errors.push(
    'SITE_URL is missing from the Cloudflare Pages build. Configure it in the dashboard, or in wrangler.toml when intentionally using Wrangler configuration-as-code.',
  );
}

if (siteUrlValue) {
  let normalizedSiteUrl;

  try {
    const parsed = new URL(siteUrlValue);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('SITE_URL must use http:// or https://');
    }
    normalizedSiteUrl = siteUrlValue.replace(/\/$/, '');
  } catch {
    errors.push(`SITE_URL is not a valid absolute URL: ${siteUrlValue}`);
  }

  if (normalizedSiteUrl) {
    const expectedHomeUrl = `${normalizedSiteUrl}/`;
    const canonical = matchContent(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
    const ogUrl = matchContent(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
    const ogImage = matchContent(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

    if (canonical !== expectedHomeUrl) {
      errors.push(`Homepage canonical is ${canonical || 'missing'}; expected ${expectedHomeUrl}`);
    }
    if (ogUrl !== expectedHomeUrl) {
      errors.push(`Homepage og:url is ${ogUrl || 'missing'}; expected ${expectedHomeUrl}`);
    }
    if (!ogImage?.startsWith(`${normalizedSiteUrl}/`)) {
      errors.push(
        `Homepage og:image is ${ogImage || 'missing'}; expected an absolute URL under ${normalizedSiteUrl}`,
      );
    }
  }
}

if (gaId) {
  const loaderUrl = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  if (!html.includes(loaderUrl) || !html.includes('window.dataLayer') || !html.includes(gaId)) {
    errors.push(
      `PUBLIC_GA_ID is set to ${gaId}, but the Google tag is missing from dist/index.html.`,
    );
  }
}

if (
  gscVerification &&
  !html.includes(`<meta name="google-site-verification" content="${gscVerification}">`)
) {
  errors.push(
    'PUBLIC_GSC_VERIFICATION is set, but the verification meta tag is missing from dist/index.html.',
  );
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[build-env] ${error}`);
  throw new Error(
    `Production build environment verification failed with ${errors.length} error(s).`,
  );
}

console.log(
  `[build-env] Verified generated HTML${siteUrlValue ? ` for ${siteUrlValue.replace(/\/$/, '')}` : ''}.`,
);
if (gaId) console.log(`[build-env] Google tag verified for ${gaId}.`);
if (gscVerification) console.log('[build-env] Google Search Console verification tag verified.');
