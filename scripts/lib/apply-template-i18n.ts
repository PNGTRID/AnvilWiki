/**
 * apply-template-i18n.ts — bilingual string table for the apply-template CLI.
 *
 * The CLI's prompts and progress output are user-facing and were English-only;
 * Chinese-speaking fork users read a wall of English to initialize their site.
 * This table carries every interactive-flow string in `en` and `zh`:
 *
 *   - Interactive TTY runs ask a language question first (1 = 中文, 2 =
 *     English; enter = the LANG-derived default).
 *   - Non-interactive runs (--answers, pipes, CI) NEVER ask — scripted answer
 *     files keep their exact positional order (18 entries before the site-type
 *     question, 19 since; both formats pinned by pnpm test:e2e) — and default
 *     to English. Pass `--lang zh` (or `--lang=zh`) to drive them in Chinese.
 *
 * Boundary: only the apply-template CLI's own flow strings live here. Errors
 * from the shared lib layer (scripts/lib/apply-rewrites.ts) and the
 * scripted-mode diagnostics (missing/malformed answers file, leftover
 * answers) stay English — they are template-drift/CI-facing, not part of the
 * interactive experience. The e2e-apply-template.mjs assertions pin a few
 * English phrases (`Base config complete`, `not in your chosen locales`,
 * `NOT demo content`); the en table must keep them verbatim (contract-tested
 * in tests/apply-template.test.ts).
 */

export type CliLang = 'en' | 'zh';

const en = {
  /** Headline printed once the language is resolved. `dry` appends the marker. */
  banner: (dry: boolean) =>
    `🎨 AnvilWiki apply-template CLI — base config (metadata, theme, nav, locales)${dry ? ' [DRY RUN]' : ''}\n`,
  rerunBanner: (name: string) => `♻️  Re-run detected — src/config/site.ts already carries "${name}".`,
  rerunNote:
    '   Prompt defaults below are your CURRENT values (enter = keep), not demo placeholders.\n',

  secIdentity: 'Game identity',
  secTheme: 'Theme color',
  secMetadata: 'Game metadata',
  secLocales: 'Locales (comma-separated, first = default)',
  secCategories: 'Content categories (comma-separated keys, lowercase)',
  secContentLayer: '⚠️  CONTENT LAYER',
  secHomePreset: '🏠  Homepage preset',
  secLanding: '🌐  PROJECT LANDING PAGE',
  secPlanned: (dry: boolean) =>
    `📋 Planned changes${dry ? ' (DRY RUN — nothing will be written)' : ''}`,
  secComplete: '✅ Base config complete.',

  qGameName: 'Full game name',
  qShortName: 'Short name (PWA / mobile)',
  qDomain: 'Domain (no protocol)',
  qTagline: 'Hero tagline',
  qDescription: 'Site description (SEO, 40-165 chars)',
  qLegalNotice: 'Legal / copyright notice',
  qOfficialUrl: 'Official game URL',
  qThemeColor: 'Theme color (#rrggbb)',
  qPlatform: 'Platform',
  qDeveloper: 'Developer / studio',
  qGenre: 'Genre',
  qReleaseDate: 'Release date (ISO, optional)',
  qLocales: 'Locales',
  qCategories: 'Categories',
  // Site type (qSiteType) — APPENDED after qRemoveLanding, before qProceed
  // (prompt #18, answer index 17): the original 18-answer positional order is
  // untouched, and 18-entry --answers files still work (legacy game-wiki).
  qSiteType: 'Site type',
  qPreset: 'Preset [1/2/3]',
  qClearContent: 'Clear demo content?',
  qRemoveLanding: 'Remove the project landing page (/landing)?',
  qProceed: '\nProceed with these changes?',

  hintCommonCategories: [
    '   Common: bosses, guides, items, codes, tier-list, characters.',
    '   By site type — game-wiki: bosses, guides, items, codes · coupon-hub: codes, guides, items · tutorial-hub: guides only · recipe-hub: recipes, guides, items.',
  ].join('\n'),
  siteTypeMenu: [
    '   1) game-wiki    — game wiki site (bosses/guides/items/codes — the current default)',
    '   2) coupon-hub   — deals & coupon site (codes become "Deals", plus tools & saving guides)',
    '   3) tutorial-hub — tutorial/knowledge-base site (guides become "Tutorials")',
    '   4) recipe-hub   — recipe site (recipes/guides become a kitchen site, plus kitchen tools)',
  ].join('\n'),
  siteTypeNote:
    '   Your pick decides which demo articles stay as starting content and which category labels fit.',
  siteTypeError: (value: string) => `❌ Invalid site type "${value}". Answer 1, 2, 3 or 4.`,
  siteCategoryMismatchError: (preset: string, allowed: string, chosen: string) =>
    `❌ Categories [${chosen}] do not fit the ${preset} site type — allowed: ${allowed}. Re-run and align the category answer (asked earlier) with the site type.`,
  presetMenu: [
    '   1) codes     — hero "All Codes", badge-list codes module (codes-driven sites)',
    '   2) guides    — hero wiki-style, steps module (guide-driven sites)',
    '   3) keep      — keep the demo homepage JSON as a starting point',
  ].join('\n'),

  contentLayerCount: (n: number) => `   ${n} article file(s) under src/content/wiki/ right now.`,
  contentLayerAware1: '   Clearing is CONTENT-AWARE: demo-authored articles are removed, and',
  contentLayerAware2: '   anything else (articles/scaffolds you wrote) is KEPT with a warning.',
  contentLayerAware3: '   Directory structure is preserved for you to drop in new content.',

  landingInfo1: '   /landing is a marketing page for the AnvilWiki project itself.',
  landingInfo2: '   Your game wiki does not need it. Removing it keeps your repo clean.',

  themeUnreadableWarn:
    '⚠️ Could not read the current theme color from src/styles/globals.css — defaulting to #f97316.',
  invalidHexError: (hex: string) => `❌ Invalid hex color "${hex}". Expected #rgb or #rrggbb.`,
  localesEnAddedWarn: '⚠️ "en" must be present (default locale). Adding it.',
  badLocalesError: (list: string) =>
    `❌ Invalid locale code(s): ${list}\n` +
    '   Accepted format: lowercase, starting with a letter — "en", "ja",\n' +
    '   "zh-tw", "pt-br" (letters/digits, hyphen-separated subtags of 2-8).',
  noCategoriesWarn: '⚠️ No categories provided. navigation.ts will be empty — fill it manually.',

  plannedGame: '   Game:        ',
  plannedShort: '   Short name:  ',
  plannedDomain: '   Domain:      ',
  plannedTheme: '   Theme:       ',
  plannedLocales: '   Locales:     ',
  plannedCategories: '   Categories:  ',
  plannedSiteType: '   Site type:   ',
  plannedNone: '(none)',
  plannedClear: '   Clear demo:  ',
  plannedLanding: '   Remove /landing: ',
  plannedYes: 'YES',
  plannedNo: 'no',
  plannedFilesHeader: '   Files to write:',
  plannedGlobalsNote: '     - src/styles/globals.css (4 theme lines only)',
  plannedWranglerNote: '     - wrangler.toml ([vars] reset to your domain, demo Giscus cleared)',
  plannedIndexNowNote: (file: string) =>
    `     - ${file} (generated once if missing; reused on re-runs)`,

  aborted: '\n🚫 Aborted. No files were changed.',
  applying: '\n🔧 Applying changes…',
  writePlanned: 'would write',

  wranglerDone: '   ✅ wrangler.toml ([vars] reset — demo Giscus config cleared)',
  indexNowDryKeep: (file: string) => `   ♻️  Would keep existing ${file}`,
  indexNowDryGen: (file: string) => `   🔑 Would generate ${file} once for zero-config IndexNow`,
  indexNowCreated: (file: string) => `   🔑 Generated ${file} (stable public IndexNow key)`,
  indexNowReused: (file: string) => `   ♻️  Reusing existing ${file}`,
  authorsDone: '   ✅ src/config/authors.ts (demo author removed)',
  authorsDriftWarn:
    '⚠️ No demo author block matched in src/config/authors.ts — either already removed on a previous run, or the file format changed. Verify the author registry manually.',

  orphanRemoved: (file: string) =>
    `   🗑️  Removed src/locales/${file} (locale not chosen — still demo translation leftover)`,
  orphanKeptWarn: (n: number, locales: string) =>
    `\n   ⚠️  Kept ${n} locale file(s) not in your chosen locales (${locales}) — NOT deleted:`,
  orphanKeptWhy1:
    '      These were kept because they are either not demo files, or demo-named files you',
  orphanKeptWhy2:
    '      already rewrote for your own game — either way they may hold translation work.',
  orphanKeptWhy3:
    "      Delete them yourself if they are leftovers — until then `pnpm check-config` stays red.",

  // Plural forms here reproduce the pre-i18n output byte-for-byte: the
  // v2.37.0 release banner promises scripted runs stay byte-identical, and
  // collapsing to "(s)" broke that for n=1.
  clearedArticles: (n: number, dry: boolean) =>
    `   🗑️  ${dry ? 'Would remove' : 'Removed'} ${n} demo article${n === 1 ? '' : 's'} under src/content/wiki/ (content-aware)`,
  clearedAssets: (n: number, dry: boolean) =>
    `   🖼️  ${dry ? 'Would remove' : 'Removed'} ${n} demo asset file(s) (covers/gallery/article images/public tokens, by name)`,
  keptFilesWarn: (n: number, names: string) =>
    `   ⚠️  Kept ${n} file(s) that are NOT demo content — they never mention the demo game (${names}). Delete them yourself if unwanted:`,
  scaffoldCreated: (n: number) =>
    `   📄 Created ${n} scaffold article${n === 1 ? '' : 's'} (one per category, en/)`,
  landingRemoved: (n: number) =>
    `   🗑️  Removed ${n} project landing page file${n === 1 ? '' : 's'} (src/components/landing/, src/config/landing*.ts, src/pages/landing* incl. the /landing/docs center, public/images/showcase/ + wechat-qr.jpg; docs/handbook markdown stays as repo docs)`,

  nextStepsHeader: '📌 Remaining tasks (see docs/apply-template.md):',
  nextIcons1: '   • Replace the icon set — your site still shows the demo anvil icons.',
  nextIcons2:
    '           Generate a full set from one image at https://favicon.io/favicon-converter/,',
  nextIcons3:
    '           then drag the files into public/ overwriting: favicon.ico, favicon.svg,',
  nextIcons4:
    '           favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png,',
  nextIcons5: '           android-chrome-192x192.png, android-chrome-512x512.png.',
  nextIcons6: '           Same for the homepage hero image: public/images/hero.webp / hero.svg.',
  nextIcons7:
    '           (CLI cannot generate binary assets — see the learning manual, lesson 11 "rebrand-your-site", or run pnpm gen-assets.)',
  nextHome: '   • Fill homepage modules in src/locales/<locale>.json',
  nextHomeDetail: '           (home.hero / start / explore / faq / updates).',
  nextArticles: '   • Add article MDX under src/content/wiki/<locale>/<category>/.',
  nextArticlesDetail: '           Then fill nav.<key> + overview.<key> in locale JSONs.',
  nextTranslate: '   • Translate non-English locale JSONs + copy MDX bodies.',
  nextSitemap:
    '   • After deploy, run `pnpm check-sitemap` to verify all URLs.',
  nextCommands: '\n   Then: pnpm dev    (preview)\n         pnpm build  (verify production build)\n',

  /** Extra "yes" spellings accepted by the y/N confirmations. */
  yesWords: ['y', 'yes'] as readonly string[],
};

export type CliStrings = typeof en;

const zh: CliStrings = {
  banner: (dry) =>
    `🎨 AnvilWiki apply-template CLI — 基础配置向导(站点元数据、主题色、导航、语言)${dry ? ' [试运行:只打印,不写入]' : ''}\n`,
  rerunBanner: (name) => `♻️  检测到重跑 — src/config/site.ts 当前已是 "${name}"。`,
  rerunNote: '   下面每题的默认值就是你「当前的值」(直接回车 = 保留),不再是 demo 占位。\n',

  secIdentity: '游戏身份',
  secTheme: '主题色',
  secMetadata: '游戏信息',
  secLocales: '站点语言(逗号分隔,第一个为默认语言)',
  secCategories: '内容栏目(逗号分隔的小写 key)',
  secContentLayer: '⚠️  内容层',
  secHomePreset: '🏠  首页预设',
  secLanding: '🌐  项目官网页',
  secPlanned: (dry) => `📋 计划修改${dry ? '(试运行 — 不会写入任何文件)' : ''}`,
  secComplete: '✅ 基础配置完成。',

  qGameName: '游戏完整名称',
  qShortName: '短名称(PWA / 手机端显示)',
  qDomain: '域名(不带 https:// 协议)',
  qTagline: '首页标语(tagline)',
  qDescription: '网站简介(SEO 用,40-165 字符)',
  qLegalNotice: '法律/版权声明',
  qOfficialUrl: '游戏官网链接',
  qThemeColor: '主题色(#rrggbb)',
  qPlatform: '平台',
  qDeveloper: '开发商/工作室',
  qGenre: '游戏类型',
  qReleaseDate: '发行日期(ISO 格式,可选)',
  qLocales: '语言列表',
  qCategories: '栏目列表',
  // 站点类型(qSiteType)——追加在 qRemoveLanding 之后、qProceed 之前(第 18 题、
  // 答案 index 17):原有 18 项答案位置序不动,18 项旧 --answers 文件仍然可用
  // (静默按 game-wiki 处理)。
  qSiteType: '站点类型',
  qPreset: '首页预设 [1/2/3]',
  qClearContent: '清除 demo 示例内容?',
  qRemoveLanding: '删除项目官网页(/landing)?',
  qProceed: '\n确认执行以上修改?',

  hintCommonCategories: [
    '   常用:bosses, guides, items, codes, tier-list, characters。',
    '   按站点类型 — game-wiki: bosses, guides, items, codes · coupon-hub: codes, guides, items · tutorial-hub: 仅 guides · recipe-hub: recipes, guides, items。',
  ].join('\n'),
  siteTypeMenu: [
    '   1) game-wiki    — 游戏 wiki 站(bosses/guides/items/codes——现在的默认)',
    '   2) coupon-hub   — 优惠码/折扣站(codes 变「优惠码」,另有工具库与省钱攻略)',
    '   3) tutorial-hub — 教程知识库站(guides 变「教程」)',
    '   4) recipe-hub   — 食谱站(recipes 食谱 + guides 变「下厨指南」+ 厨房工具)',
  ].join('\n'),
  siteTypeNote: '   选择决定哪些 demo 示例文章保留为起始内容,以及栏目标签用哪套语义。',
  siteTypeError: (value) => `❌ 站点类型 "${value}" 不合法,请回答 1、2、3 或 4。`,
  siteCategoryMismatchError: (preset, allowed, chosen) =>
    `❌ 所选栏目 [${chosen}] 不属于 ${preset} 站点类型 — 允许:${allowed}。请重跑并让栏目答案(在前面的题)与站点类型保持一致。`,
  presetMenu: [
    '   1) codes     — 首页大标 "All Codes"、兑换码徽章模块(适合兑换码驱动的站)',
    '   2) guides    — wiki 式首页、步骤模块(适合攻略驱动的站)',
    '   3) keep      — 保留 demo 首页 JSON 作为起点',
  ].join('\n'),

  contentLayerCount: (n) => `   当前 src/content/wiki/ 下有 ${n} 个文章文件。`,
  contentLayerAware1: '   清理是「内容感知」的:判定为 demo 的文章会被删除,',
  contentLayerAware2: '   其余(你自己写的文章/脚手架)会保留并逐个警告。',
  contentLayerAware3: '   目录结构保留,方便你直接放入新内容。',

  landingInfo1: '   /landing 是 AnvilWiki 模板项目自己的宣传页。',
  landingInfo2: '   你的游戏站用不到它,删掉可以让仓库保持干净。',

  themeUnreadableWarn: '⚠️ 无法从 src/styles/globals.css 读取当前主题色 — 回退默认 #f97316。',
  invalidHexError: (hex) => `❌ 颜色值 "${hex}" 不合法,应为 #rgb 或 #rrggbb 格式。`,
  localesEnAddedWarn: '⚠️ 语言列表必须包含 "en"(默认语言),已自动加上。',
  badLocalesError: (list) =>
    `❌ 非法的语言代码:${list}\n` +
    '   合法格式:小写、以字母开头 — "en"、"ja"、\n' +
    '   "zh-tw"、"pt-br"(字母/数字,连字符分段,每段 2-8 位)。',
  noCategoriesWarn: '⚠️ 未选择任何栏目,navigation.ts 会是空的 — 之后请手动补齐。',

  plannedGame: '   游戏:        ',
  plannedShort: '   短名称:      ',
  plannedDomain: '   域名:        ',
  plannedTheme: '   主题色:      ',
  plannedLocales: '   语言:        ',
  plannedCategories: '   栏目:        ',
  plannedSiteType: '   站点类型:    ',
  plannedNone: '(无)',
  plannedClear: '   清除 demo 内容:  ',
  plannedLanding: '   删除 /landing: ',
  plannedYes: '是',
  plannedNo: '否',
  plannedFilesHeader: '   将写入的文件:',
  plannedGlobalsNote: '     - src/styles/globals.css(仅 4 行主题色)',
  plannedWranglerNote: '     - wrangler.toml([vars] 重置为你的域名,清空 demo Giscus)',
  plannedIndexNowNote: (file) => `     - ${file}(缺失时生成一次;重跑复用)`,

  aborted: '\n🚫 已中止,没有改动任何文件。',
  applying: '\n🔧 正在应用修改…',
  writePlanned: '将写入',

  wranglerDone: '   ✅ wrangler.toml([vars] 已重置 — demo Giscus 配置已清空)',
  indexNowDryKeep: (file) => `   ♻️  将保留已有的 ${file}`,
  indexNowDryGen: (file) => `   🔑 将生成 ${file}(一次即可,IndexNow 零配置)`,
  indexNowCreated: (file) => `   🔑 已生成 ${file}(稳定公开的 IndexNow key)`,
  indexNowReused: (file) => `   ♻️  复用已有的 ${file}`,
  authorsDone: '   ✅ src/config/authors.ts(demo 作者已移除)',
  authorsDriftWarn:
    '⚠️ src/config/authors.ts 里没有匹配到 demo 作者块 — 可能上一轮已移除,或文件格式变了。请手动检查作者注册表。',

  orphanRemoved: (file) =>
    `   🗑️  已删除 src/locales/${file}(未选择该语言 — 仍是 demo 翻译残留)`,
  orphanKeptWarn: (n, locales) =>
    `\n   ⚠️  保留了 ${n} 个不在你所选语言(${locales})中的 locale 文件 — 未删除:`,
  orphanKeptWhy1: '      保留原因:它们要么不是 demo 文件,要么是文件名沿用 demo 但内容',
  orphanKeptWhy2: '      已经换成你游戏的 — 两种情况都可能装着你的翻译工作。',
  orphanKeptWhy3: '      若确认是残留请自行删除 — 删除前 `pnpm check-config` 会一直是红的。',

  clearedArticles: (n, dry) =>
    `   🗑️  ${dry ? '将删除' : '已删除'} src/content/wiki/ 下 ${n} 篇 demo 文章(内容感知判定)`,
  clearedAssets: (n, dry) =>
    `   🖼️  ${dry ? '将删除' : '已删除'} ${n} 个 demo 资产文件(封面/画廊/内文图/public token,按文件名删除)`,
  keptFilesWarn: (n, names) =>
    `   ⚠️  保留了 ${n} 个「非 demo 内容」的文件 — 它们从未提到 demo 游戏(${names})。若不需要请自行删除:`,
  scaffoldCreated: (n) => `   📄 已创建 ${n} 篇脚手架文章(每个所选栏目一篇,en/)`,
  landingRemoved: (n) =>
    `   🗑️  已删除 ${n} 个项目官网页文件(src/components/landing/、src/config/landing*.ts、src/pages/landing* 含 /landing/docs 文档中心、public/images/showcase/ + wechat-qr.jpg;docs/handbook 手册 markdown 保留作参考文档)`,

  nextStepsHeader: '📌 剩余任务(详见 docs/apply-template.md):',
  nextIcons1: '   • 换图标 — 你的站现在还是模板的铁砧图标。',
  nextIcons2: '           可在 https://favicon.io/favicon-converter/ 用一张图生成全套,',
  nextIcons3: '           然后把文件拖进 public/ 覆盖同名文件:favicon.ico、favicon.svg、',
  nextIcons4: '           favicon-16x16.png、favicon-32x32.png、apple-touch-icon.png、',
  nextIcons5: '           android-chrome-192x192.png、android-chrome-512x512.png。',
  nextIcons6: '           首页大图同理:public/images/hero.webp / hero.svg。',
  nextIcons7: '           (CLI 生成不了图片资产 — 见学习手册第 11 课「换成你的游戏」,或直接跑 pnpm gen-assets)',
  nextHome: '   • 填首页文案:src/locales/<语言>.json',
  nextHomeDetail: '           (home.hero / start / explore / faq / updates)。',
  nextArticles: '   • 在 src/content/wiki/<语言>/<栏目>/ 下写文章 MDX。',
  nextArticlesDetail: '           然后在语言 JSON 里补 nav.<key> + overview.<key>。',
  nextTranslate: '   • 翻译非英文的语言 JSON + 搬运/改写文章正文。',
  nextSitemap: '   • 部署后跑 \`pnpm check-sitemap\` 验证所有 URL 可访问。',
  nextCommands: '\n   然后:pnpm dev    (本地预览)\n         pnpm build  (验证生产构建)\n',

  yesWords: ['y', 'yes', '是'] as readonly string[],
};

export const APPLY_TEMPLATE_STRINGS: Record<CliLang, CliStrings> = { en, zh };

/**
 * Parse the `--lang <code>` / `--lang=<code>` CLI flag.
 * Returns `undefined` when the flag is absent (caller falls back to English or
 * the interactive question), `'invalid'` when present but not a known code —
 * the caller must fail LOUDLY (the repo's established pattern for bad input).
 */
export function langFromFlag(args: string[]): CliLang | 'invalid' | undefined {
  const idx = args.indexOf('--lang');
  const raw =
    idx >= 0
      ? args[idx + 1]
      : args.find((a) => a.startsWith('--lang='))?.split('=').slice(1).join('=');
  if (raw === undefined) {
    // `--lang` given as the last arg with no value is a user error, not absence.
    return idx >= 0 ? 'invalid' : undefined;
  }
  const v = raw.trim().toLowerCase();
  if (v === 'en' || v.startsWith('en-')) return 'en';
  if (v === 'zh' || v.startsWith('zh-')) return 'zh';
  return 'invalid';
}

/**
 * Interactive default from the terminal environment: a zh locale (zh_CN,
 * zh_TW, …) defaults the language question to 中文. Only consulted when the
 * question is actually asked (TTY); never for --answers/CI runs.
 */
export function envDefaultLang(env: NodeJS.ProcessEnv = process.env): CliLang {
  for (const key of ['LC_ALL', 'LC_MESSAGES', 'LANG', 'LANGUAGE']) {
    const v = env[key];
    if (!v) continue;
    return v.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }
  return 'en';
}
