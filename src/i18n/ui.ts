/**
 * UI message loader — runtime bridge between locale JSON files and components.
 *
 * Responsibilities:
 *   - Load the messages object for a given locale.
 *   - deepMerge non-English locales over English, so missing keys fall back to English.
 *
 * Only manages UI text (nav labels, buttons, home content). Article body translation
 * is handled by src/i18n/content.ts (MDX file-based, per-article fallback).
 */

import en from '~/locales/en.json';
import ja from '~/locales/ja.json';

import { defaultLocale, type Locale } from './routing';

const messages: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  ja: ja as Record<string, unknown>,
};

/**
 * Deep-merge `source` over `base`. Arrays are replaced (not concatenated);
 * objects are merged recursively. Used to layer a partial translation over
 * the full English messages so missing keys transparently fall back.
 */
function deepMerge(
  base: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof base !== 'object' || base === null) return source;
  if (typeof source !== 'object' || source === null) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Get the full UI messages object for a locale, with English fallback.
 * Never throws — unknown locales return English.
 */
export function getUi(locale: string): typeof en {
  if (locale === defaultLocale) return en;
  const locMessages = isLocaleSafe(locale) ? messages[locale] : {};
  return deepMerge(en as Record<string, unknown>, locMessages) as typeof en;
}

/** The homepage `home` namespace (drives HomePage + the /faq pages). */
export type HomeUi = typeof en.home;
/** The `shared` namespace (cross-page labels). */
export type SharedUi = typeof en.shared;

/**
 * The homepage FAQ namespace (`home.faq`) for a locale — the single source
 * both /faq routes render from. Deduplicated from two page-level copies that
 * each carried a hardcoded English fallback masking key drift; typed against
 * en.json instead, so a renamed `home.faq` key fails typecheck (and
 * tests/home-ui.test.ts) rather than silently rendering an empty page.
 * ja and future locales inherit en values via getUi()'s deep-merge.
 */
export function getHomeFaq(locale: string): HomeUi['faq'] {
  return getUi(locale).home.faq;
}

/** Translation function: t('nav.bosses') → localized string. */
export function t(locale: string, key: string): unknown {
  const ui = getUi(locale);
  return key
    .split('.')
    .reduce<unknown>(
      (acc, k) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined,
      ui,
    );
}

function isLocaleSafe(value: string): value is Locale {
  return value in messages;
}
