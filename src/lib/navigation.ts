/**
 * Dynamic sidebar navigation — scans actual MDX files to build nav groups.
 *
 * Equivalent to the legacy template's getDynamicNavigation(). No hardcoded lists:
 * if you add an MDX file, it appears in the sidebar automatically.
 */

import { NAVIGATION_CONFIG } from '~/config/navigation';
import { getEntriesByCategory, parseEntryId } from '~/i18n/content';
import type { Locale } from '~/i18n/routing';
import type { WikiEntry } from '~/i18n/content';

export interface NavGroup {
  key: string;
  label: string;
  path: string;
  icon: string;
  count: number;
  entries: Array<{ title: string; slug: string; path: string }>;
}

/**
 * Build the sidebar navigation for a locale.
 * Groups come from NAVIGATION_CONFIG; entries come from actual MDX files.
 * Groups with zero entries in this locale are still shown (empty, so users
 * see the structure and know what content is coming).
 */
export async function getDynamicNavigation(
  locale: Locale,
  labels: Record<string, string>, // nav.<key> from locale JSON
): Promise<NavGroup[]> {
  const groups: NavGroup[] = [];

  for (const item of NAVIGATION_CONFIG) {
    const entries = await getEntriesByCategory(item.key, locale);
    groups.push({
      key: item.key,
      label: labels[item.key] ?? capitalize(item.key),
      path: item.path,
      icon: item.icon,
      count: entries.length,
      entries: entries.map((e) => {
        const parsed = parseEntryId(e.id);
        const slug = parsed?.slug ?? '';
        return {
          title: e.data.title,
          slug,
          path: `${item.path}/${slug}`,
        };
      }),
    });
  }

  return groups;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type { WikiEntry };
