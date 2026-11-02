/**
 * [WHY]:    官网教程线（/landing/tutorials + /zh/landing/tutorials）需要一组
 *           纯函数承载 URL、排序与「同题材下一篇」逻辑;lib/handbook.ts 是同族先例,
 *           但教程线多一个蓝图 §6.5 的固定转化件——尾部三件套的「同题材下一篇推荐」,
 *           线性 prev/next 不够用,需要一个 topic 维度。
 * [INPUT]:  tutorials collection 的条目列表(id 形如 "<locale>/<slug>"、data 含
 *           order);调用方astro 路由与测试注入,本模块零 astro:content 依赖——
 *           依赖 astro:content 的代码进不了 Vitest(lib/handbook 同一规则)。
 * [OUTPUT]: parseTutorialId / sortTutorials / tutorialsForLocale / prevNext /
 *           nextInTopic / tutorialsForPreset / tutorialPath,被 tutorials 路由
 *           四件、DirectionCards 方向卡与 tests/tutorials.test.ts 消费;
 *           TUTORIAL_TOPICS 与 TUTORIAL_META 是首批 6 篇的单源注册表
 *           (slug→题材 / slug→preset+手册课),尾部 CTA 由 TUTORIAL_META 驱动。
 * [BOUND]:  不做渲染、不读文件系统、不含任何文案(文案在 landing-en/zh.ts 的
 *           tutorials 段);新增教程只动内容文件与 TUTORIAL_TOPICS/TUTORIAL_META
 *           两张表,不改函数;handbook collection 与本模块无任何 import 关系。
 *           🚨 本文件是 fork 保留的 survive 文件——有意不在 LANDING_PATHS/
 *           setup.yml rm/e2e 缺席断言三通道清单,且必须保持不在:tests/
 *           tutorials.test.ts 与 tests/landing-paths.test.ts 静态 import 它,
 *           删了 fork CI 即红。教程线的清理对象是 src/content/tutorials 集合
 *           与 tutorials 路由(LANDING_PATHS 已登记),营销注册表随本文件留在
 *           代码层,勿顺手「补全三通道」(RootGateway survive 同型反向缺口)。
 * [PROTOCOL]: 新增导出/改 URL 形态时,同步 tests/tutorials.test.ts 与本头注释。
 */

export const TUTORIAL_LOCALES = ['en', 'zh'] as const;
export type TutorialLocale = (typeof TUTORIAL_LOCALES)[number];

/** The three site-type topics the tutorial line is organized around. */
export type TutorialTopic = 'codes' | 'site' | 'growth';

/** The three apply-template site presets a tutorial's tail CTA points at. */
export type TutorialPreset = 'game-wiki' | 'coupon-hub' | 'tutorial-hub' | 'recipe-hub';

/** Minimal shape shared by collection entries (structural typing keeps this testable). */
export interface TutorialLike {
  id: string;
  data: { order: number; [k: string]: unknown };
}

/** Full shape used by the tutorials pages (CollectionEntry-compatible). */
export interface TutorialEntry {
  id: string;
  data: {
    title: string;
    description: string;
    order: number;
    updated: Date;
    tldr?: string;
  };
}

export interface ParsedTutorialId {
  locale: TutorialLocale;
  slug: string;
}

/**
 * 首批 6 篇的题材注册表:slug → 题材。「同题材下一篇」按这里判定;
 * 未注册的 slug 落入 'growth'(兜底,不炸)——新增教程必须登记。
 */
export const TUTORIAL_TOPICS: Record<string, TutorialTopic> = {
  'build-a-game-codes-site': 'codes',
  'build-a-coupon-site': 'codes',
  'ai-one-day-content-site': 'site',
  'start-a-tutorial-site': 'site',
  'get-indexed-by-google': 'growth',
  'game-wiki-monetization': 'growth',
  'start-a-recipe-site': 'site',
  'keyword-research-for-content-sites': 'growth',
  'set-up-website-ads': 'growth',
  'deploy-on-cloudflare-pages': 'site',
};

/**
 * 尾部 CTA 注册表:slug → 该教程对应的站点类型 preset + 深入手册课
 * (handbook slug——手册 URL 由 handbookPath() 按 locale 拼接)。
 * 「怎么用模板」仍由 docs center 承担(蓝图 §6.4 双层原则),教程正文链接过去。
 * docsSlug 可选:recipe 线暂无对应手册课,缺省时尾部不渲染手册链接
 * (宁缺毋错——链到不相干的课比没有更伤信任)。
 */
export const TUTORIAL_META: Record<
  string,
  { preset: TutorialPreset; docsSlug?: string }
> = {
  'build-a-game-codes-site': { preset: 'game-wiki', docsSlug: 'codes-page' },
  'build-a-coupon-site': { preset: 'coupon-hub', docsSlug: 'codes-page' },
  'ai-one-day-content-site': { preset: 'game-wiki', docsSlug: 'first-article' },
  'start-a-tutorial-site': { preset: 'tutorial-hub', docsSlug: 'first-article' },
  'get-indexed-by-google': { preset: 'game-wiki', docsSlug: 'get-on-google' },
  'game-wiki-monetization': { preset: 'game-wiki', docsSlug: 'enable-ads' },
  'start-a-recipe-site': { preset: 'recipe-hub' },
  'keyword-research-for-content-sites': { preset: 'game-wiki', docsSlug: 'find-candidates' },
  'set-up-website-ads': { preset: 'game-wiki', docsSlug: 'enable-ads' },
  'deploy-on-cloudflare-pages': { preset: 'game-wiki', docsSlug: 'run-your-site' },
};

/**
 * Parse a tutorial entry id ("en/build-a-coupon-site" — defensively strips a
 * possible ".md" suffix, same gotcha as wiki entry ids) into locale + slug.
 * Returns null for ids that don't match <locale>/<slug>.
 */
export function parseTutorialId(id: string): ParsedTutorialId | null {
  const clean = id.replace(/\.md$/i, '');
  const sep = clean.indexOf('/');
  if (sep <= 0) return null;
  const locale = clean.slice(0, sep) as TutorialLocale;
  const slug = clean.slice(sep + 1);
  if (!slug || !(TUTORIAL_LOCALES as readonly string[]).includes(locale)) return null;
  return { locale, slug };
}

/** Sort: ascending reading order. */
export function sortTutorials<T extends TutorialLike>(tutorials: T[]): T[] {
  return [...tutorials].sort((a, b) => a.data.order - b.data.order);
}

/** Filter + sort tutorials of one locale, ready for hub lists and prev/next. */
export function tutorialsForLocale<T extends TutorialLike>(tutorials: T[], locale: TutorialLocale): T[] {
  return sortTutorials(tutorials.filter((t) => parseTutorialId(t.id)?.locale === locale));
}

/**
 * Tutorials of one locale mapped to an apply-template preset via
 * TUTORIAL_META — the grouping behind the landing "pick a direction" cards
 * and the hub's per-direction sections. Slugs absent from TUTORIAL_META land
 * in NO group (they stay on the hub through nothing: the grouping contract
 * test pins every tutorial slug as registered, so an omission fails CI
 * instead of silently vanishing from the face of the site).
 */
export function tutorialsForPreset<T extends TutorialLike>(
  tutorials: T[],
  preset: TutorialPreset,
): T[] {
  return sortTutorials(
    tutorials.filter((t) => TUTORIAL_META[parseTutorialId(t.id)?.slug ?? '']?.preset === preset),
  );
}

/**
 * Linear previous/next neighbors across the whole line (handbook's prevNext
 * shape, minus the manual split — the tutorial line is one reading path).
 * Pass an already locale-filtered list.
 */
export function prevNext<T extends TutorialLike>(
  sorted: T[],
  id: string,
): { prev: T | null; next: T | null } {
  const idx = sorted.findIndex((t) => t.id === id);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

/**
 * 同题材下一篇 (the tail trio's recommendation slot): the next tutorial in
 * reading order that shares the current one's topic; when the line runs out
 * within the topic, falls back to the overall next so the slot never dead-ends
 * mid-line. Returns null only at the very end of the line. Unregistered slugs
 * fall back to plain linear next (they have no topic to match).
 */
export function nextInTopic<T extends TutorialLike>(sorted: T[], id: string): T | null {
  const { next } = prevNext(sorted, id);
  if (!next) return null;
  const topic = TUTORIAL_TOPICS[parseTutorialId(id)?.slug ?? ''];
  if (!topic) return next;
  const onward = sorted.slice(sorted.findIndex((t) => t.id === id) + 1);
  return onward.find((t) => TUTORIAL_TOPICS[parseTutorialId(t.id)?.slug ?? ''] === topic) ?? next;
}

/** Public URL of a tutorial page for a given landing locale (trailingSlash:'always'). */
export function tutorialPath(locale: TutorialLocale, slug: string, isHub = false): string {
  const base = locale === 'en' ? '/landing/tutorials' : `/zh/landing/tutorials`;
  // trailingSlash:'always' — hub and article URLs both end with "/".
  return isHub || !slug ? `${base}/` : `${base}/${slug}/`;
}
