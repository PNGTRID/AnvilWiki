# 配置参考手册

> 把 AnvilWiki 从 demo 站（虚构游戏 "Anvil Quest"）换成你的目标游戏站点。
>
> 本文档按**文件**组织——你要改什么，就查对应文件的章节。不规定操作顺序，你想先改哪个都行。
>
> 核心原则：**只改配置层和内容层，代码层（src/pages/、src/components/、src/lib/）不动。**

---

## 文件索引

| 要改什么 | 去哪个文件 |
|---|---|
| 站点名称、域名、社交链接、游戏信息 | [src/config/site.ts](#1-site配置) |
| 导航分类（bosses / guides / codes...） | [src/config/navigation.ts](#2-navigation配置) |
| 主题色 | [src/styles/globals.css](#3-主题色) |
| 支持的语言 | [src/i18n/routing.ts](#4-语言列表) + [src/i18n/ui.ts](#4-语言列表) |
| 所有 UI 文案（首页、导航、页脚） | [src/locales/en.json](#5-ui文案) |
| favicon / Hero 图 / PWA | [public/](#6-静态资源) |
| 文章内容 | [src/content/wiki/](#7-mdx-文章) |
| 广告 key | Cloudflare 环境变量 `PUBLIC_ADSENSE_*`（参考 [Google AdSense](https://adsense.google.com/)） |

> 想自动化基础配置？运行 `pnpm apply-template`，它会交互式引导你完成 site.ts / navigation.ts / globals.css / routing.ts / locales 的修改。脚本化/CI 场景用 `pnpm apply-template --answers answers.json` 非交互驱动（与交互同一问答路径，答案缺失或多余都会响亮报告）。

---

## 初始化清理规范（fork 后哪些"没用的内容"会被删掉）

模板作为 demo 站分发，自带一批**demo 专属内容**——fork 做你自己的游戏站时它们全是累赘。两条初始化通道共享同一份删除清单：

| 通道 | 怎么触发 | 特点 |
|---|---|---|
| `pnpm apply-template`（本地 CLI） | 终端交互式，自己点确认 | 会改游戏名/主题/语言/栏目；删除前逐项确认 |
| Actions → **Initialize AnvilWiki** workflow | fork 仓库里点 Run workflow | 只做安全项（wrangler 重置 + 删 landing + 清 demo），**开 PR 前先跑 `pnpm build` 验证**再交给你审 |

**删除清单（两个通道一致，改动必须同步 `scripts/apply-template.ts` 与 `.github/workflows/setup.yml`）：**

| 类别 | 具体内容 | 说明 |
|---|---|---|
| demo 文章 | `src/content/wiki/*/*/*.mdx` 全部（目录结构保留） | CLI 清空后**每个所选栏目自动补 1 篇英文脚手架**，保证 build 不空转；同时自动填充所选栏目的 `nav.<key>` 标签与 `overview.<key>` 条目（英文默认值，供你翻译/改写——不填的话 fork 第一次 `pnpm check-config` 就是红的） |
| 空栏目目录 | 清空后仍为空、且不在所选栏目里的内容目录 | 未选栏目的空目录是「不可达分类」（template-audit 会拦），一并剪掉 |
| demo 配图 | **全部按文件名删**（整目录 rm -rf 已废除）：`src/assets/gallery/` 6 张画廊图、`public/images/articles/` 2 张内文图、`src/assets/covers/` 9 张封面；清单见 `scripts/lib/apply-rewrites.ts` 的 `DEMO_COVERS` / `DEMO_GALLERY_IMAGES` / `DEMO_ARTICLE_IMAGES`（`tests/apply-template.test.ts` 钉住与 setup.yml 的同步） | 按名删除而非通配——`public/images/articles/` 正是内容规范让你放**自己**内文图的地方，你的图绝不会被误删 |
| demo 站验证文件 | `public/` 根目录下 demo 站自己的搜索引擎验证 token（如 `google8362d9398114b66b.html`，清单 `DEMO_PUBLIC_FILES`） | 这是上游 demo 站域名的运维 token；你验证**自己的**站点时 GSC 会生成不同的随机文件名，按精确文件名删除绝不会误删你自己的验证文件 |
| 项目官网 | `src/components/landing/`、`src/config/landing.ts`、`src/pages/landing*`（含站内文档中心 /landing/docs）、`src/pages/zh/landing*`（中文官网）、`public/images/showcase/`、`public/images/wechat-qr.jpg` | fork 站不需要 AnvilWiki 项目自述页；`docs/handbook/` **markdown 源保留**当参考文档，只删路由 |
| 官网回链 | `src/config/project.ts` 的 `landingLinkEnabled` 翻为 `false` | 页面 header 的"返回官网"按钮随删随关 |
| demo 凭据 | `wrangler.toml` `[vars]` 重置：`SITE_URL` 换成你的域名，Giscus/Sponsor/CF Analytics 全部清空，AdSense 等可选槽留注释位 | 不重置的话，你站的评论区会指回官方仓库的 Discussions |
| demo 作者 | `src/config/authors.ts` 里 `// DEMO` 标记的作者条目 | 否则 Person JSON-LD 会引用虚构作者 |

**保留不删（有意设计）**：favicon/hero 图等二进制资产（CLI 生成不了，脚手架下一步指引你手动换）；`docs/handbook/` 手册源码。

**⚠️ 语言 JSON 分三类处理（重跑安全，按内容判定不只按文件名）**：未选择的语言里——① **demo 自带且仍是 demo 内容的**（`ja.json` 等，`site.name` 仍是 demo 站名）会被**直接删除**：它们装载着完整的 demo 游戏翻译，留着是身份泄漏，且 `pnpm check-config` 会对「locale 文件存在但不在 routing.ts」报错，fork 第一天 CI 就是红的；② **demo 文件名但内容已换成你游戏的**（比如上一轮运行选了 ja、这一轮没选）——内容判定发现 `site.name` 已不是 demo 站名，**只警告、绝不删除**；③ **你自己创建的** locale 文件（`pnpm new-locale` 加的等）同样**只警告、绝不删除**——重跑不能毁掉你的翻译工作。②③ 看到「Kept N locale file(s)」警告后自行决定删除或把该语言加进所选列表，处理前 `pnpm check-config` 会一直是红的。

**逃生口**：`pnpm apply-template --dry-run`（只打印不写入）、`--no-clear-content`（保留 demo 文章）、`--keep-landing`（保留项目官网）、`--answers answers.json`（非交互模式，复制第二个站/CI 时用）。

**事后体检**：`pnpm template-audit`——四层扫描（代码层无 demo 字符串 / 配置层是否还挂 demo 域名 / 内容层残留 / 换皮遗留文件），fork 站上线前跑一次确认没有"Anvil Quest"残留。

---

## 1. site 配置

**文件**：`src/config/site.ts`

这是站点信息的唯一来源。所有页面都从这里读站点名、域名、社交链接。

```ts
export const site = {
  name: 'Anvil Quest Wiki',          // → 改成 "{你的游戏名} Wiki"
  shortName: 'AQW',                  // → 缩写
  description: '...',                // → 含游戏名 + 核心关键词
  domain: 'anvilwiki.pages.dev',     // → 你的域名（不带 https://）
  tagline: '...',                    // → 副标题
  legalNotice: '...',                // → 法律声明
  contactEmail: '',                  // → 可选:公开联系邮箱(联系页渲染 mailto;没开任何社交渠道时必填)
  social: {
    official: 'https://...',         // → 游戏官网
    discord: 'https://...',          // → 没有就留 undefined
    youtube: 'https://...',
    twitter: 'https://...',
    reddit: 'https://...',
  },
  game: {
    name: 'Anvil Quest',             // → 游戏名
    platform: 'Steam',              // → Roblox / Steam / PS5 等
    developer: '...',               // → 开发商
    genre: 'Action RPG',            // → 游戏类型
    releaseDate: '2026-01-01',      // → 发售日（可选）
  },
};
```

**注意事项**：
- `domain` 不带 `https://` 协议前缀（协议由 `SITE_URL` 环境变量统一管理）
- 社交链接没有的留 `undefined`，不要删字段

---

## 2. navigation 配置

**文件**：`src/config/navigation.ts`

定义导航栏的分类。每个分类 = 一个内容类型（bosses / guides / codes...）。

```ts
export const NAVIGATION_CONFIG = [
  { key: 'bosses', path: '/bosses', icon: 'lucide:swords', isContentType: true, order: 1 },
  { key: 'guides', path: '/guides', icon: 'lucide:book-open', isContentType: true, order: 2 },
  { key: 'codes',  path: '/codes',  icon: 'lucide:gift',     isContentType: true, order: 3 },
  // → 改成你的游戏需要的内容分类。isContentType 与 order 都是必填
  //   （isContentType 标记"有 MDX 内容目录的分类"，order 控制导航排序）。
];
```

**必须同步的三处**（改了 navigation.ts 就必须同步另外两处）：

| 位置 | 例子 |
|---|---|
| `navigation.ts` 的 `key` | `bosses` |
| `en.json` 的 `nav.bosses` | `"bosses": "Bosses"`（显示文本） |
| `src/content/wiki/<locale>/bosses/` | 目录名必须 = key |

`icon` 从 [lucide 图标库](https://lucide.dev/)选，加 `lucide:` 前缀。

---

## 3. 主题色

**文件**：`src/styles/globals.css`（顶部 8 行：4 个变量 × 亮/暗）

```css
:root {
  --brand: 22 90% 52%;        /* 亮色主色（HSL，空格分隔） */
  --brand-light: 22 90% 62%;  /* 亮色浅色变体 */
  --brand-h: 22;              /* 色相（--brand-text 派生用） */
  --brand-s: 90%;             /* 饱和度（--brand-text 派生用） */
}
.dark {
  --brand: 22 85% 48%;        /* 暗色主色 */
  --brand-light: 22 85% 58%;  /* 暗色浅色变体 */
  --brand-h: 22;
  --brand-s: 85%;
}
```

**怎么换色**：把你的 hex 色值转成 HSL（用 [w3schools HSL 转换器](https://www.w3schools.com/colors/colors_hsl.asp) 或任何工具），替换这 8 行的值（`--brand-text` 由 `--brand-h/--brand-s` 自动派生，不用手改——漏改 h/s 会让文字色残留旧色相）。其他 CSS 变量（`--background` / `--foreground` / `--border` 等）通过 `var(--brand)` 自动跟随，不用改。

**验证**：
```bash
grep "brand" src/styles/globals.css          # 确认 8 行已更新
grep -rn "#[0-9a-fA-F]\{6\}" src/components/  # 确认组件里无硬编码 hex
```

---

## 4. 语言列表

**文件**：`src/i18n/routing.ts` + `src/i18n/ui.ts`

AnvilWiki 支持 as-needed 前缀策略：英文（默认）无 URL 前缀，其他语言带前缀（`/ja/...`、`/ru/...`）。

### routing.ts

```ts
export const locales = ['en', 'ja'] as const;
// → 改成你需要的语言，如 ['en', 'ja', 'ru', 'es']
```

### ui.ts

每加一个语言，需要在 ui.ts 注册 import：

```ts
import en from '~/locales/en.json';
import ja from '~/locales/ja.json';
// → 加新语言：import ru from '~/locales/ru.json';

export const messages = { en, ja /* , ru */ };
```

同时创建对应的空 JSON 文件（缺 key 会自动 fallback 英文）：

```bash
echo '{}' > src/locales/ru.json
```

**必须同步的三处**：
1. `routing.ts` 的 `locales` 数组
2. `src/locales/` 下实际存在的 JSON 文件
3. `ui.ts` 的 import + `messages` 对象

少同步任何一处，构建会报错。

---

## 5. UI 文案

**文件**：`src/locales/en.json`（英文真相源）+ `src/locales/<locale>.json`（其他语言）

所有用户可见的文字都在这里。**组件里不硬编码任何文字。**

### 主要命名空间

| 命名空间 | 内容 | 示例 |
|---|---|---|
| `site` | 站点名、描述、法律声明 | `site.name`、`site.description` |
| `nav` | 导航栏分类文本 | `nav.bosses: "Bosses"` |
| `overview` | 列表页标题和描述 | `overview.bosses.overviewTitle` |
| `home` | 首页所有文案 | `home.hero`、`home.start`、`home.explore` 等 |
| `footer` | 页脚 | `footer.copyrightText` |
| `shared` | 通用文案 | `shared.readMore`、`shared.noArticles` |

### 首页 home 命名空间结构

首页的数据结构详见 [PRD §6.5](./PRD.md#65-首页-home-命名空间)。关键字段：

- `home.meta.title` / `description`：SEO 元数据（title 50-60 字符，description 150-160 字符）
- `home.hero`：Hero 区域（`badge` / `title` / `description` / `ctaPrimary` / `ctaSecondary`）
- `home.start.cards[]`：QuickStart 卡片（4 张，每张含 `icon` + `href`）
- `home.explore.modules[]`：内容模块（当前 demo 为 6 个，每个含 `displayType` + `highlights[]`）
- `home.closingCta`：底部号召文案

**SEO 要求**：`home.explore.modules[].name` 必须包含游戏名。

### 多语言翻译

非英文 JSON 缺 key 时会通过 deepMerge 自动 fallback 英文。所以你可以先只翻译部分 key，不会崩溃。

不要翻译的内容：
- 法律页正文（硬编码英文）
- 文章正文（走 MDX 文件，放 `src/content/wiki/<locale>/`）

---

## 6. 静态资源

**目录**：`public/`

| 文件 | 说明 |
|---|---|
| `favicon.ico` / `favicon-16x16.png` / `favicon-32x32.png` | 浏览器标签图标 |
| `apple-touch-icon.png` | iOS 主屏图标（180×180） |
| `android-chrome-192x192.png` / `android-chrome-512x512.png` | Android 主屏图标 |
| `manifest.json` | PWA manifest（改 `name` / `short_name`） |
| `images/hero.webp` | Hero 图（模板自带可能是占位，必须换成真实图） |

**Hero 图**：模板自带的可能是占位文件。换成你的真实 Hero 图，格式推荐 WebP（体积最小）。如果你拿到的是 PNG/JPG，用任何工具转成 WebP 后覆盖。

**favicon / Hero 图生成**：模板自带 `pnpm gen-assets`——按你的主题色自动生成 favicon 全套（svg + 各尺寸 png）和首页大图 hero.webp（1200×630），直接覆盖 `public/` 里的同名文件，无需再手动去 [favicon.io](https://favicon.io/favicon-converter/)。想要自定义图案的仍然可以手动替换。

---

## 7. MDX 文章

**目录**：`src/content/wiki/<locale>/<category>/`

每篇文章是一个 `.mdx` 文件，使用 YAML frontmatter：

```mdx
---
title: "文章标题 - 游戏名"
description: "155 字符以内的描述，含关键词"
category: "bosses"
date: 2026-08-11
lastModified: 2026-08-11
image: "../../../../assets/covers/your-cover.png"
tags: ["boss", "guide"]
---

## 正文从 H2 开始
不写 H1——ArticlePage 自动用 title 渲染 H1。
```

文章格式详细说明见 [内容格式](./content-format.md)。

**分类目录名**必须与 `navigation.ts` 的 `key` 一致：`src/content/wiki/en/bosses/emberfang.mdx` → key = `bosses` → URL `/bosses/emberfang`。

**从其他格式迁移**：如果你的文章用的是 `export const metadata`（JS 元数据写法），需要手动改成 YAML frontmatter，详见 [内容格式 - 迁移](./content-format.md#从其他格式迁移文章)。

---

## 上线检查清单

```
□ site.ts 所有字段已换成新游戏
□ navigation.ts 分类与 content/ 子目录一致
□ globals.css 主题色已改（4 行）
□ routing.ts 语言与 locales/*.json 同步
□ en.json 无 demo 游戏名残留
□ favicon 全套已替换
□ hero 图是真实图片（非占位）
□ 所有 MDX frontmatter 通过 Zod schema（pnpm build 不报错）
□ sitemap URL 全部返回 200（pnpm check-sitemap）
□ SITE_URL 环境变量已配（含 https:// 协议，改 wrangler.toml 或 dashboard —— 注意 wrangler.toml 存在时会接管 dashboard，见 [deployment.md](./deployment.md)）
```

---

## 模板化进阶：audit + 沉淀

第一个站跑通之后，别急着直接复制仓库做第二个游戏——先花 15 分钟做两件事（完整讲法见学习手册第 9 章）：

**1. 跑模板健康检查**：

```bash
pnpm template-audit
```

它会从三层分离的角度打分（如「模板健康度：8/10」）：代码层有没有混进游戏专属字符串（❌ 必须修——那是框架层的违约）、配置层还绑着旧游戏多少、内容层有没有 draft 遗留、demo 图片资产和 `wrangler.toml` demo 值清干净没有。❌ 清零、⚠️ 逐条决定去留之后，这个仓库才是一个干净的模板。

**2. 沉淀换皮清单**：把「复制新站时必改哪些文件、必换哪些目录」写成 `docs/rebrand-checklist.md`（第 9 章有一段现成提示词可以生成初稿）。半年后复制第五个站时，照单执行，不用回忆任何细节。

之后每复制一个新站就是标准四步：复制仓库 → `pnpm apply-template` → 换内容层 → `pnpm build` 验证。批量铺内页见 `pnpm bulk-new-posts`（学习手册第 10 章）。

---

## 下一步

- [部署指南](./deployment.md)：部署到 Cloudflare Pages
- [内容格式](./content-format.md)：MDX 文章怎么写
- [SEO 说明](./seo.md)：SEO 工程化细节
- 回到 [README](../README.md)
