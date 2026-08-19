/**
 * i18n routing — the single source of truth for supported locales.
 *
 * 👉 APPLY TEMPLATE: When adding/removing a language, sync THREE places:
 *   1. Here — locales array
 *   2. src/locales/<locale>.json — actual file must exist (can be `{}` to start)
 *   3. src/content/<locale>/ — directory must exist (can be empty)
 *
 * URL strategy (as-needed prefix):
 *   - English (default) has NO prefix: /bosses/emberfang
 *   - Other locales ARE prefixed:     /ja/bosses/emberfang
 *
 * This is configured in astro.config.ts via `i18n.routing.prefixDefaultLocale: false`.
 */

export const locales = ['en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** English label for each locale (used in language switcher). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
};

/** Whether the given locale is the default (English, no URL prefix). */
export function isDefaultLocale(locale: string): boolean {
  return locale === defaultLocale;
}

/** Type guard: narrow an arbitrary string to Locale. */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
