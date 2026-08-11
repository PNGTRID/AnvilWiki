# AnvilWiki 产品需求文档（PRD）

> **版本**：v0.1（初稿）
> **日期**：2026-08-11
> **状态**：设计中 · 待 review
> **维护者**：AnvilWiki 开源项目
> **协议**：MIT

---

## 目录

- [第 1 章 项目背景](#第-1-章-项目背景)
- [第 2 章 目标与非目标](#第-2-章-目标与非目标)
- [第 3 章 技术选型](#第-3-章-技术选型)
- [第 4 章 整体架构](#第-4-章-整体架构)
- [第 5 章 目录结构](#第-5-章-目录结构)
- [第 6 章 数据模型](#第-6-章-数据模型)
- [第 7 章 核心模块设计](#第-7-章-核心模块设计)
- [第 8 章 SEO 工程化](#第-8-章-seo-工程化)
- [第 9 章 多语言（i18n）](#第-9-章-多语言i18n)
- [第 10 章 广告系统](#第-10-章-广告系统)
- [第 11 章 换皮工作流](#第-11-章-换皮工作流)
- [第 12 章 部署方案](#第-12-章-部署方案)
- [第 13 章 测试与质量保障](#第-13-章-测试与质量保障)
- [第 14 章 开发路线图](#第-14-章-开发路线图)
- [第 15 章 开源运营](#第-15-章-开源运营)
- [附录 A 环境变量清单](#附录-a-环境变量清单)
- [附录 B 上线前检查清单](#附录-b-上线前检查清单)
- [附录 C 术语表](#附录-c-术语表)

---

## 第 1 章 项目背景

### 1.1 问题陈述

游戏 wiki 站点（game wiki site）是一种以搜索引擎为主要流量来源的内容站：围绕某款游戏（尤其是 Roblox、Steam 新游）的攻略、兑换码、tier list 等关键词，批量生产结构化文章，通过 SEO 获取自然流量，再通过广告（Adsterra / AdSense）变现。

这类站点的技术特征非常明确：

- **纯内容站**——无登录、无数据库、无实时数据，本质是 MDX/Markdown 文章 + 静态页面。
- **SEO 是生命线**——title / description / JSON-LD / sitemap / hreflang / 内链结构必须工程化自动生成。
- **多语言**——英文为主（SEO 最优），按热度补日/俄/葡/西等语言，缺失内容要能 fallback 英文不报错。
- **批量换皮**——同一套框架服务几十上百个不同游戏，换游戏只改配置和内容，不动框架代码。
- **免费部署 + 高带宽**——单个站流量周期 2-3 个月，流量峰值可能很高，需要免费且不限带宽的部署方案。

### 1.2 设计目标

AnvilWiki 围绕游戏 wiki 站点的技术特征，确立以下设计目标：

- **免费部署**：选择 Cloudflare Pages 作为默认部署平台，享受无限带宽 + 全球 CDN + 免费 SSL，单站流量再大也不产生费用。
- **高性能**：静态优先架构，零 JS by default，目标 Lighthouse Performance ≥ 95，Core Web Vitals 全绿。
- **SEO 工程化**：sitemap / JSON-LD / hreflang / robots / 内链结构全部由代码自动生成，填内容即生效。
- **多语言**：as-needed 前缀策略（英文无前缀），文章单篇 fallback 英文不 404，列表不 fallback。
- **批量换皮**：同一套框架服务几十上百个不同游戏，换游戏只改配置和内容，不动框架代码。
- **新手友好**：连 GitHub 仓库自动部署，无需理解适配器/middleware，30 分钟内完成 fork → 换皮 → 部署上线全流程。

> AnvilWiki 选择纯静态输出，部署到 Cloudflare Pages 无需适配器，直接托管 `dist/` 静态文件即可。

### 1.3 AnvilWiki 的定位

**AnvilWiki 是一个开源（MIT）的游戏 wiki 站点模板**，用 Astro + Cloudflare Pages 技术栈，让新手零成本免费部署上线，且与现有工具生态（seoscout 内容生成、same.new UI 克隆、换皮提示词工作流）保持兼容。

> **命名由来**：Anvil（铁砧）——锻造装备的基础工具，寓意这是「锻造游戏 wiki 站的基础模板」。

---

## 第 2 章 目标与非目标

### 2.1 核心目标

| # | 目标 | 验收标准 |
|---|---|---|
| G1 | **Cloudflare 原生部署** | 纯静态输出，零适配器，部署到 Cloudflare Pages 无需任何额外配置。 |
| G2 | **免费无限带宽** | 利用 Cloudflare Pages 静态站无限带宽，单站流量再大也不产生费用。 |
| G3 | **高性能** | Lighthouse Performance ≥ 95，Core Web Vitals（LCP/FID/CLS）全绿。 |
| G4 | **新手友好** | 新手照 README 30 分钟内完成 fork → 换皮 → 部署上线全流程。 |
| G5 | **SEO 工程化** | sitemap / JSON-LD / hreflang / robots / 内链全部由代码自动生成，填内容即生效。 |
| G6 | **多语言开箱即用** | as-needed 前缀策略（英文无前缀），文章单篇 fallback 英文不 404，列表不 fallback。 |
| G7 | **换皮工程化** | 4 阶段 7 Part 提示词流程，改配置不改框架代码。 |
| G8 | **广告就绪** | 内置 Adsterra iframe 隔离广告系统，环境变量驱动，新手填 key 即生效。 |
| G9 | **开源** | MIT 协议，中英双语 README，完整文档，欢迎社区贡献。 |

### 2.2 非目标（明确不做）

| # | 非目标 | 原因 |
|---|---|---|
| N1 | **不做服务端动态能力** | 无登录、无数据库、无实时数据。需要这些的场景请用 Next.js / SvelteKit。 |
| N2 | **不做可视化后台/CMS** | 内容靠 MDX 文件 + Git，文件系统即数据库。需要 CMS 的用户自行接 Astro DB / Decap CMS。 |
| N3 | **不做自动化内容生成** | 内容生成（seoscout 等）是独立工具链，AnvilWiki 只负责消费 MDX。但会提供格式适配说明。 |
| N4 | **不做 React/Vue/Svelte 全栈** | 交互组件用纯 Astro 原生 + 极少 vanilla JS。不为单一组件引入整个 framework runtime。 |
| N5 | **不绑定特定广告平台** | 默认接 Adsterra（社区主流），但广告组件抽象为通用 iframe 方案，可替换为任何广告网络。 |
| N6 | **不做内容运营教学** | AnvilWiki 是模板，不是教程。文档聚焦「怎么用模板」，不教选词/SEO 策略/外链建设。 |

### 2.3 目标用户画像

| 画像 | 特征 | AnvilWiki 如何服务 |
|---|---|---|
| **P1：有建站经验的开发者** | 有游戏 wiki 建站经验，会用 Cursor/Claude Code，想搭一套自己的站。 | 兼容现有工具生态（seoscout/same.new/换皮提示词），fork 即用，工具链无需切换。 |
| **P2：独立开发者** | 有前端基础，想快速做内容站变现。 | 提供完整文档 + 示例 demo，fork 即用。 |
| **P3：完全新手** | 无代码基础，只会按教程操作。 | README 写到截图级，Cloudflare Pages 零配置部署，5 分钟上线。 |

---

## 第 3 章 技术选型

### 3.1 技术选型概览

AnvilWiki 面向「游戏 wiki 站点」这一特定场景，在框架、部署、内容、SEO 等关键维度上做了如下选型：

| 维度 | AnvilWiki 选型 | 选型理由 |
|---|---|---|
| 定位 | 游戏 wiki 模板 | 专为游戏 wiki 内容站设计，覆盖攻略/兑换码/tier list 等典型内容形态。 |
| 框架 | Astro（轻量） | 静态优先、零 JS by default、岛屿架构（只在交互处 hydrate），Cloudflare 原生友好。 |
| 部署 | Cloudflare Pages（无限带宽） | 免费无限带宽 + 全球 CDN + 免费 SSL + Git 自动部署，匹配游戏站 2-3 个月高流量周期。 |
| Cloudflare 兼容 | 原生（纯静态，零适配器） | 纯静态输出，直接托管 `dist/`，无需任何 adapter。 |
| 内容管理 | Content Collections | 类型安全 + Zod schema 校验，构建时发现字段错误。 |
| 多语言 | Astro i18n as-needed | `prefixDefaultLocale: false` 实现默认语言（英文）无前缀。 |
| 首页模块 | JSON 驱动 8 模块 | 文案与组件解耦，换游戏只改 JSON，组件零改动。 |
| SEO 工程化 | 完整（sitemap/JSON-LD/hreflang/robots） | sitemap / JSON-LD（Organization/WebSite/Article/BreadcrumbList/ItemList/FAQPage）/ hreflang / robots 全部代码自动生成。 |
| 广告系统 | Adsterra iframe 隔离 | 每个广告位独立 html，避免 atOptions 串号；环境变量驱动，新手填 key 即生效。 |
| 换皮流程 | 4 阶段 7 Part 提示词 | 换游戏只改配置层 + 替换内容层，框架层不动。 |
| 游戏站适配 | 专为游戏站设计 | 内置游戏站特定的 SEO（ItemList/Breadcrumb）+ 兑换码/tier list 专用 displayType。 |

### 3.2 技术栈选型

| 层 | 选型 | 版本 | 理由 |
|---|---|---|---|
| **框架** | Astro | 5.x（最新稳定） | 静态优先，岛屿架构（只在交互处 hydrate），零 JS by default，Cloudflare 原生友好。 |
| **输出模式** | `output: 'static'` | — | 纯静态 HTML，无需 adapter，直接部署 Cloudflare Pages。 |
| **内容** | Content Layer API + `glob()` loader | 内置 | 类型安全，Zod schema 校验，构建时发现字段错误。配合 YAML frontmatter，替代 `export const metadata = {}` 方案。 |
| **MDX** | `@astrojs/mdx` | latest | 支持 MDX 组件，兼容 seoscout 输出。 |
| **样式** | Tailwind CSS | 4.x | 原子化 CSS，零运行时，主题色与组件样式解耦。 |
| **主题色** | CSS 变量 `--nav-theme` + `--nav-theme-light` | — | 换皮改 4 行（`:root` 2 行 + `.dark` 2 行），其他变量通过 `var()` 自动跟随。 |
| **图标** | lucide（通过 `astro-icon` 或 inline SVG） | latest | 兼容「禁止 emoji」规则。 |
| **UI 组件** | **纯 Astro 原生组件**（`.astro`） | — | 不引入 React/Vue runtime。FAQ 用原生 `<details>`，移动端菜单用 `<details>` 或极少 JS。 |
| **i18n** | Astro 内置 i18n + 自建 fallback 封装 | — | `routing.prefixDefaultLocale: false` 实现 as-needed 前缀。 |
| **sitemap** | `@astrojs/sitemap` | latest | 自动生成 sitemap.xml，支持 i18n alternate。 |
| **SEO** | 自建 JSON-LD 组件 + meta 工具函数 | — | Organization/WebSite/Article/BreadcrumbList/ItemList。 |
| **包管理** | pnpm | 9.x | 快、省磁盘、Cloudflare Pages 原生支持。 |
| **Node** | Node 20 LTS | — | Cloudflare Pages 默认支持，稳定。 |
| **部署** | Cloudflare Pages | — | 无限带宽 + 全球 CDN + 免费 SSL + Git 自动部署。 |
| **协议** | MIT | — | 最宽松，允许商用。 |

### 3.3 关键技术决策记录（ADR）

#### ADR-001：为什么选 Astro

AnvilWiki 选择 Astro 作为底层框架，基于以下优势：

- **静态优先**：默认输出纯静态 HTML，无需 adapter，直接部署 Cloudflare Pages。
- **零 JS by default**：页面默认不携带 framework runtime，只在交互处按需 hydrate（岛屿架构），客户端体积小。
- **Cloudflare 原生友好**：纯静态输出与 Cloudflare Pages 静态托管天然契合。
- **Content Collections**：内置类型安全的内容管理机制，配合 Zod schema 实现构建时字段校验。
- **框架 agnostic**：支持按需引入 React/Vue/Svelte island，未来扩展交互组件时不会被单一框架锁定。
- **i18n 内置**：原生支持 `prefixDefaultLocale: false`（as-needed 前缀策略），符合多语言 URL 规划。

#### ADR-002：为什么用纯 Astro 原生组件而不是 React islands

游戏 wiki 99% 的页面是静态展示（首页模块、文章页、列表页），只有极少数交互（FAQ 折叠、移动端菜单、广告关闭按钮）。纯 Astro 原生组件足够覆盖这些场景，无需引入 framework runtime。

**决策**：交互组件用纯 Astro 原生方案——
- FAQ 手风琴 → 原生 `<details>` + `<summary>`（零 JS）
- 移动端菜单 → `<details>` 或 5 行 vanilla JS
- 广告关闭按钮 → 3 行 vanilla JS（localStorage 记忆）
- 主题切换 → 5 行 vanilla JS（toggle `.dark` class）

**例外**：如果用户想要更复杂的交互（如搜索、评论），文档提供「如何接入 React island」的指南，但默认不带。

#### ADR-003：Cloudflare Pages vs Cloudflare Workers

Cloudflare 同时提供 Pages（静态托管）和 Workers（边缘计算）两种方案。AnvilWiki 是纯静态站点（无 SSR、无 API、无按需渲染），选择 **Pages** 的理由：

| 维度 | AnvilWiki 需求 | Pages 是否满足 |
|---|---|---|
| 托管 `dist/` 静态文件 | ✅ 需要 | ✅ 原生（`dist/` 直接托管） |
| 连 GitHub 自动构建部署 | ✅ 需要（新手零配置） | ✅ 原生（连 GitHub 自动构建） |
| UI 一键部署 | ✅ 需要（新手友好） | ✅ 原生 |
| 无限带宽 + 全球 CDN | ✅ 需要 | ✅ |
| 未来迁移到 Workers（若需要 SSR/API） | 可选 | ✅ 可平滑迁移 |

**决策**：默认 Pages（新手友好、静态站原生适配），文档补充 Workers 部署方式（进阶用户、需要 SSR/API 时）。

---

## 第 4 章 整体架构

### 4.1 三层架构

AnvilWiki 采用**三层分离**的架构设计：

```
┌─────────────────────────────────────────────────┐
│  框架层（固定，跨项目复用，fork 后不动）              │
│  ├── Astro 路由结构（src/pages/）                  │
│  ├── Content Collections 内容引擎                  │
│  ├── i18n 系统（as-needed 前缀 + fallback）        │
│  ├── SEO 组件（sitemap、JSON-LD、hreflang、robots）│
│  ├── 首页模块渲染器（4 种 displayType）             │
│  ├── 广告组件（iframe 隔离）                        │
│  └── 主题色 CSS 变量体系                            │
├─────────────────────────────────────────────────┤
│  配置层（每个游戏改一次）                            │
│  ├── src/config/site.ts      — 站点信息（名称/域名/社交） │
│  ├── src/config/navigation.ts — 内容类型定义        │
│  ├── src/i18n/routing.ts     — 支持语言列表         │
│  ├── src/styles/globals.css  — 主题色 CSS 变量      │
│  └── public/                 — favicon / hero / manifest │
├─────────────────────────────────────────────────┤
│  内容层（每次新站完全替换）                          │
│  ├── src/content/    — MDX 文章（按 locale/type 组织）│
│  └── src/locales/*.json — UI 文案 + 首页 home 命名空间 │
└─────────────────────────────────────────────────┘
```

**核心原则**：
- 改内容不动代码，改配置不重写框架。
- 换游戏 = 改配置层（~5 个文件） + 替换内容层（content/ 和 locales/）。
- 框架层 fork 后永不改动（除非升级 AnvilWiki 版本）。

### 4.2 数据流

```
开发者写 MDX 文章（带 frontmatter）
         │
         ▼
Astro 构建时（pnpm build）
  ├── Content Collections glob loader 扫描 src/content/**/*.mdx
  ├── Zod schema 校验 frontmatter（字段缺失立即报错，构建失败）
  ├── 为每篇文章生成类型安全的 entry（{ id, data, body, render() }）
  ├── 多语言 fallback 封装：getEntryWithFallback(type, slug, locale)
  ├── 动态路由 src/pages/[locale]/[...slug].astro 预生成所有静态 HTML
  ├── sitemap.xml.ts 扫描所有实际存在的 entry 生成 URL 列表
  ├── JSON-LD 组件为每页注入结构化数据
  └── 输出到 dist/
         │
         ▼
Cloudflare Pages（连 GitHub 自动部署）
  ├── 全球 CDN 分发 dist/ 静态文件
  ├── 无限带宽
  └── 自动 SSL
         │
         ▼
用户访问 / 搜索引擎爬取
```

### 4.3 渲染策略

| 页面类型 | 渲染方式 | 说明 |
|---|---|---|
| 首页 `/` | **静态（build-time）** | 构建时从 locales/en.json 读 home 命名空间渲染。 |
| 列表页 `/bosses` | **静态** | 构建时从 Content Collection 查询该分类所有文章。 |
| 文章页 `/bosses/gelum` | **静态** | 构建时从 Content Collection 取该文章 + fallback 逻辑。 |
| 法律页 `/about` 等 | **静态** | 硬编码英文正文（不翻译），复用 [locale] layout。 |
| sitemap.xml | **静态 endpoint** | 构建时生成。 |
| robots.txt | **静态 endpoint** | 构建时生成。 |

**全部静态**——这是性能和 Cloudflare 兼容性的根本保证。没有任何按需渲染（on-demand rendering），因此**不需要任何 adapter**。

---

## 第 5 章 目录结构

```
anvilwiki/
├── astro.config.mjs              # ⭐ Astro 配置（output/i18n/integrations/site URL）
├── content.config.ts             # ⭐ Content Collections schema 定义（Zod）
├── tailwind.config.mjs           # Tailwind 配置（扫描路径 + 主题色映射）
├── tsconfig.json                 # TypeScript 严格模式
├── package.json
├── pnpm-lock.yaml
├── wrangler.toml                 # Cloudflare Pages 配置（可选，用于 wrangler 本地预览）
├── .env.example                  # 环境变量模板（广告 key 等）
├── .gitignore
├── .nvmrc                        # Node 20 LTS
├── README.md                     # ⭐ 项目门面（中英双语，新手指南）
├── LICENSE                       # MIT
├── CONTRIBUTING.md               # 贡献指南
├── CHANGELOG.md                  # 版本变更
├── docs/
│   ├── PRD.md                    # ⭐ 本文档
│   ├── deployment.md             # Cloudflare Pages 部署详细指南
│   ├── skinning.md               # 换皮工作流（4 阶段 7 Part）
│   ├── content-format.md         # MDX 文章格式规范
│   ├── seo.md                    # SEO 工程化说明
│   ├── ads.md                    # 广告接入指南
│   └── migration-from-nextjs.md  # 从传统 Next.js 模板迁移指南
├── public/
│   ├── images/
│   │   └── hero.webp             # Hero 图（WebP，og:image 绝对路径引用）
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── manifest.json             # PWA manifest
│   ├── ads.txt                   # 广告授权
│   ├── ads/                      # ⭐ Adsterra iframe 隔离广告模板
│   │   ├── banner-320x50.html
│   │   ├── banner-300x250.html
│   │   ├── banner-728x90.html
│   │   ├── banner-468x60.html
│   │   ├── sidebar-160x600.html
│   │   └── sidebar-160x300.html
│   └── robots.txt                # （构建时由 endpoint 生成，此文件可不存在）
├── src/
│   ├── content/                  # ⭐ 内容层：MDX 文章
│   │   ├── en/
│   │   │   ├── bosses/
│   │   │   │   └── gelum.mdx     # → /bosses/gelum
│   │   │   └── guides/
│   │   │       └── beginner.mdx  # → /guides/beginner
│   │   └── ja/                   # 日文版（可选）
│   │       └── bosses/
│   │           └── gelum.mdx     # → /ja/bosses/gelum
│   ├── pages/                    # ⭐ 框架层：路由
│   │   ├── index.astro           # 根路径 → redirect 到默认语言首页
│   │   ├── [locale]/             # 语言前缀路由（英文无前缀由 prefixDefaultLocale:false 实现）
│   │   │   ├── index.astro       # 首页（JSON 驱动 8 模块）
│   │   │   ├── [...slug].astro   # ⭐ 统一路由：slug.length=1→列表页，>1→详情页
│   │   │   ├── privacy-policy.astro
│   │   │   ├── terms-of-service.astro
│   │   │   ├── copyright.astro
│   │   │   ├── about.astro
│   │   │   └── 404.astro
│   │   ├── sitemap.xml.ts        # ⭐ 动态 sitemap（扫描 Content Collection）
│   │   ├── robots.txt.ts         # 动态 robots
│   │   └── ads/                  # 广告 iframe 占位（如需 SSR 注入 key，否则用 public/ads/*.html）
│   ├── components/               # ⭐ 框架层：纯 Astro 组件
│   │   ├── layout/
│   │   │   ├── BaseLayout.astro  # <html>/<head>/global meta/Organization JSON-LD
│   │   │   └── LocaleLayout.astro # [locale] 公共外壳（Header + Footer + 主内容）
│   │   ├── header/
│   │   │   ├── SiteHeader.astro  # 导航栏 + Logo + 主题切换 + 语言切换
│   │   │   ├── LanguageSwitcher.astro
│   │   │   └── ThemeToggle.astro # 5 行 JS 的暗色切换
│   │   ├── footer/
│   │   │   └── SiteFooter.astro  # 社交链接 + 法律链接
│   │   ├── sidebar/
│   │   │   └── WikiSidebar.astro # ⭐ 动态导航（getDynamicNavigation 等价物）
│   │   ├── home/                 # 首页 8 模块组件
│   │   │   ├── Hero.astro
│   │   │   ├── VideoSection.astro
│   │   │   ├── RecentUpdates.astro
│   │   │   ├── StartHere.astro
│   │   │   ├── TrendingNow.astro
│   │   │   ├── AboutGame.astro
│   │   │   ├── ExploreModules.astro  # ⭐ 8 模块容器，按 displayType 分发
│   │   │   ├── FaqSection.astro      # 原生 <details> 手风琴
│   │   │   ├── FinalCta.astro
│   │   │   └── modules/
│   │   │       ├── CodeCards.astro   # displayType: code-cards
│   │   │       ├── StepByStep.astro  # displayType: step-by-step
│   │   │       ├── TierGrid.astro    # displayType: tier-grid
│   │   │       └── CardList.astro    # displayType: card-list
│   │   ├── article/
│   │   │   ├── ArticlePage.astro  # 详情页主体（H1 + MDX body + 面包屑 + 相关文章）
│   │   │   └── ListPage.astro     # 列表页主体（分类标题 + 文章卡片列表）
│   │   ├── seo/
│   │   │   └── JsonLd.astro       # ⭐ 通用 JSON-LD 注入组件
│   │   └── ads/
│   │       ├── AdBanner.astro     # iframe 广告组件（key 为空 return null）
│   │       ├── StickyBanner.astro # Sticky 320×50 + 关闭按钮
│   │       └── SidebarAd.astro    # 桌面端 fixed 侧边栏
│   ├── config/                   # ⭐ 配置层
│   │   ├── site.ts               # 站点信息（name/domain/social/gameMeta）
│   │   └── navigation.ts         # ⭐ NAVIGATION_CONFIG 单一真相源
│   ├── i18n/                     # ⭐ 框架层 + 配置层
│   │   ├── routing.ts            # ⭐ 语言列表唯一源（locales/defaultLocale）
│   │   ├── ui.ts                 # UI 文案加载器（deepMerge fallback）
│   │   └── content.ts            # ⭐ 文章加载封装（getEntryWithFallback 等）
│   ├── locales/                  # ⭐ 内容层：UI 文案
│   │   ├── en.json               # home.* / nav / footer / 分类 overview*
│   │   └── ja.json               # （deepMerge en，缺 key 自动回退）
│   ├── styles/
│   │   └── globals.css           # ⭐ --nav-theme / --nav-theme-light（4 行换皮）
│   └── lib/
│       ├── content.ts            # Content Collections 查询封装
│       ├── navigation.ts         # getDynamicNavigation()（扫描 content 生成分组）
│       ├── seo.ts                # JSON-LD 构造函数（Organization/Article/Breadcrumb/ItemList）
│       ├── url.ts                # URL 构造（locale 前缀、slug 转换、绝对路径）
│       └── ads.ts                # 广告 key 读取 + 条件渲染辅助
├── scripts/
│   ├── new-post.ts               # 脚手架：生成新文章 MDX 模板
│   ├── check-sitemap.ts          # 检查 sitemap 所有 URL 返回 200
│   └── convert-from-seoscout.ts  # seoscout MDX → AnvilWiki MDX 格式转换
└── .github/
    ├── workflows/
    │   └── ci.yml                # PR 检查（lint + typecheck + build）
    ├── ISSUE_TEMPLATE/
    │   ├── bug-report.md
    │   └── feature-request.md
    └── PULL_REQUEST_TEMPLATE.md
```

### 5.1 目录设计要点

1. **`src/content/` 而非根目录 `content/`**：Astro 5 的 Content Layer API 用 `glob({ base: './src/content' })` 显式指定，内容统一收敛在 `src/` 下，不污染项目根目录。
2. **`content.config.ts` 在根目录**：Astro 5 的约定（取代老的 `src/content/config.ts`）。
3. **配置文件集中在 `src/config/`**：新手换皮时只关注这一个目录 + `globals.css` + `locales/`。
4. **`scripts/` 提供脚手架**：降低新手写 MDX 的门槛。
5. **`docs/` 完整文档**：每个关注点一个文件，README 只做导航。

---

## 第 6 章 数据模型

### 6.1 MDX 文章 frontmatter schema

定义在 `content.config.ts`：

```typescript
// content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const wiki = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content' }),
  schema: z.object({
    // 必填
    title: z.string().max(70),              // SEO title，建议 50-60 字符
    description: z.string().min(50).max(160), // meta description，155 字符最佳
    category: z.string(),                   // 内容类型 slug，如 'bosses'/'guides'（须在 navigation.ts 定义）
    date: z.coerce.date(),                  // 发布日期
    // 可选
    lastModified: z.coerce.date().optional(), // 最后修改日期（影响 Article JSON-LD dateModified）
    image: z.string().optional(),           // 封面图（相对 /public 或绝对 URL），缺省用 hero.webp
    tags: z.array(z.string()).optional(),   // 标签（用于相关文章推荐）
    noindex: z.boolean().default(false),    // 是否禁止索引
  }),
});

export const collections = { wiki };
```

**Content Collections 的优势**：
- YAML frontmatter + Zod schema，**构建时校验**，字段缺失/类型错误立即 fail build。
- 类型安全的 entry（`{ id, data, body, render() }`），组件 props 自动推断，无需手动 cast。
- frontmatter 与正文分离，MDX 作者只关心内容，字段规范由 schema 强约束。

### 6.2 文章示例

```mdx
---
title: "Gelum Boss Guide - Complete Strategy"
description: "Complete strategy guide for defeating Gelum, including attack patterns, weaknesses, and recommended loadouts."
category: "bosses"
date: 2026-08-11
lastModified: 2026-08-12
image: "/images/gelum-cover.jpg"
tags: ["boss", "ice", "early-game"]
---

正文从 H2 开始（不写 H1，ArticlePage 自动用 title 渲染 H1）。

## Attack Patterns
...
```

### 6.3 站点配置 schema（`src/config/site.ts`）

```typescript
export interface SiteConfig {
  name: string;              // "Anvil Quest Wiki"（全站 title 后缀、JSON-LD name）
  shortName: string;         // "AQ Wiki"（PWA short_name、Logo 缩写）
  description: string;       // 站点描述（Organization JSON-LD、og:site_name）
  domain: string;            // "anvilquestwiki.wiki"（sitemap/robots 绝对 URL 拼接）
  tagline: string;           // 首页副标题
  legalNotice: string;       // 法律声明
  social: {
    official: string;        // 游戏官网
    discord?: string;
    youtube?: string;
    twitter?: string;
    reddit?: string;
  };
  game: {
    name: string;            // 游戏全名
    platform: string;        // "Roblox" / "Steam" / "Epic Games"
    developer: string;
    genre: string;
    releaseDate?: string;
  };
}

export const site: SiteConfig = {
  name: "Anvil Quest Wiki",
  shortName: "AQ Wiki",
  // ...用户换皮时改这里
};
```

### 6.4 导航配置 schema（`src/config/navigation.ts`）

```typescript
import type { LucideIcon } from 'lucide-astro';  // 或 astro-icon
import { Swords, BookOpen, Package, Gift } from 'lucide-astro';

export interface NavigationItem {
  key: string;              // 分类 slug（= content/ 子目录名 = URL 路径段）
  path: string;             // '/bosses'（= '/' + key）
  icon: LucideIcon;
  isContentType: true;      // 是否有 MDX 内容
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
  { key: 'bosses',  path: '/bosses',  icon: Swords,   isContentType: true },
  { key: 'guides',  path: '/guides',  icon: BookOpen, isContentType: true },
  { key: 'items',   path: '/items',   icon: Package,  isContentType: true },
  { key: 'codes',   path: '/codes',   icon: Gift,     isContentType: true },
];

// 自动派生
export const CONTENT_TYPES = NAVIGATION_CONFIG.map(n => n.key);
```

**关键约束**：
- `key` 必须与 `src/content/<locale>/<key>/` 子目录名一一对应。
- `key` 必须与 `locales/en.json` 的 `nav.<key>` 翻译键对应。
- 改这一个文件 → 导航菜单 / 路由 / sitemap / 内容加载全部自动跟随。

### 6.5 首页 JSON schema（`src/locales/en.json` 的 `home` 命名空间）

**首页 JSON 结构**（覆盖 hero / updates / start / popular / aboutGame / explore / faq / finalCta 八大区块）：

```json
{
  "site": {
    "name": "Anvil Quest Wiki",
    "shortName": "AQ Wiki",
    "description": "...",
    "tagline": "...",
    "legalNotice": "..."
  },
  "nav": {
    "home": "Home",
    "bosses": "Bosses",
    "guides": "Guides",
    "items": "Items",
    "codes": "Codes",
    "toggleTheme": "Toggle theme",
    "menu": "Menu"
  },
  "home": {
    "meta": { "title": "...", "description": "..." },
    "hero": {
      "eyebrow": "...",
      "title": "Anvil Quest Wiki",
      "description": "...",
      "stats": ["..."],
      "primaryCta": "...",
      "secondaryCta": "...",
      "tertiaryCta": "..."
    },
    "updates": { "title": "...", "browse": "..." },
    "start": {
      "eyebrow": "Start Here",
      "title": "Your Anvil Quest Journey",
      "cards": [
        { "number": "1", "title": "...", "description": "..." }
      ]
    },
    "popular": { "eyebrow": "...", "title": "...", "quickLinks": ["..."] },
    "aboutGame": {
      "title": "What is Anvil Quest?",
      "paragraphs": ["...", "..."],
      "stats": [{ "label": "Developer", "value": "..." }],
      "cta": "Explore All Guides"
    },
    "explore": {
      "title": "...",
      "description": "...",
      "modules": [
        {
          "order": 1,
          "name": "Anvil Quest Codes",
          "description": "...",
          "href": "/codes",
          "displayType": "code-cards",
          "highlights": [{ "label": "WELCOME", "detail": "...", "badge": "Active" }]
        }
      ]
    },
    "faq": {
      "title": "Frequently Asked Questions",
      "description": "...",
      "items": [{ "question": "What is Anvil Quest?", "answer": "..." }]
    },
    "finalCta": { "title": "...", "description": "...", "primary": "...", "secondary": "..." }
  },
  "footer": {
    "playGame": "Play Anvil Quest",
    "officialDiscord": "Official Discord",
    "officialYoutube": "Official YouTube",
    "copyright": "© 2026 Anvil Quest Wiki. Fan-made, not affiliated with..."
  },
  "overview": {
    "bosses": { "overviewTitle": "All Bosses", "overviewDescription": "..." },
    "guides": { "overviewTitle": "All Guides", "overviewDescription": "..." }
  },
  "shared": {
    "readMore": "Read more",
    "lastUpdated": "Last updated",
    "noArticles": "No articles yet",
    "relatedArticles": "Related Articles"
  }
}
```

**4 种 displayType**（首页 explore 模块的渲染类型）：
- `code-cards`：兑换码卡片（label + detail + badge）
- `step-by-step`：步骤指引（label 是数字 1-6）
- `tier-grid`：分级网格（label 是 S/A/B/C）
- `card-list`：链接列表（label 是短文字，**去 emoji 化**）

### 6.6 i18n 路由配置（`src/i18n/routing.ts`）

```typescript
export const locales = ['en', 'ja', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
```

**三处必须同步**（新增/删除语言时务必同时改动）：
1. `src/i18n/routing.ts` 的 `locales` 数组
2. `src/locales/` 下实际存在的 JSON 文件
3. `src/content/<locale>/` 下实际存在的目录（无内容也要建空目录）

---

## 第 7 章 核心模块设计

### 7.1 首页（HomePage）

**数据源**：`src/locales/<locale>.json` 的 `home` 命名空间。
**渲染**：`src/pages/[locale]/index.astro` 读 JSON，逐 section 渲染。
**交互**：FAQ 用原生 `<details>`（零 JS），移动端菜单用 `<details>`。

**首页结构（从上到下）**：
```
1. SiteHeader（导航栏）
2. Hero（标题 + 描述 + stats + CTA 按钮 + 视频预览）
3. VideoSection（YouTube 嵌入，紧跟 Hero）  ← 视频必须在 Hero 正下方（SEO + 用户停留时长）
4. RecentUpdates + StartHere（两栏：最近更新 + 新手教程卡片）
5. TrendingNow（横向滚动热门文章）
6. AboutGame（游戏介绍 + 数据卡片）
7. ExploreModules（8 个内容模块，按 displayType 渲染）
8. FaqSection（原生 <details> 手风琴）
9. FinalCta（底部 CTA）
10. SiteFooter
```

**关键决策**：
- 所有文案来自 JSON，组件不含游戏特定字符串。
- 模块级标题含主题名（SEO），子项不强制。
- `home.explore.modules` 数组固定 8 项，超出删除。

### 7.2 列表页（ListPage）

**路由**：`/[locale]/[contentType]`（如 `/bosses`、`/ja/bosses`）。
**数据源**：
- 标题/描述：`locales/<locale>.json` 的 `overview.<contentType>.overviewTitle/Description`。
- 文章列表：`lib/content.ts` 的 `getEntriesByCategory(contentType, locale)`。
**渲染**：文章卡片网格（封面 + 标题 + 描述 + 日期 + 阅读链接）。
**空状态**：无文章时显示 `shared.noArticles` 文案。
**SEO**：ItemList JSON-LD（每篇文章一个条目，含序号/URL/标题）。

**关键约束**：
- **列表不 fallback 英文**——该语言没翻译的文章不出现，列表为空就显示空状态。
- 防止「列表显示 28 篇但只有 1 篇有 MDX」导致 sitemap 产生 27 个 404。

### 7.3 详情页（ArticlePage）

**路由**：`/[locale]/[contentType]/[slug]`（如 `/bosses/gelum`）。
**数据源**：`lib/content.ts` 的 `getEntryWithFallback(contentType, slug, locale)`。
**渲染**：
- H1 = `entry.data.title`（MDX 正文不写 H1）。
- MDX body 通过 `entry.render()` 渲染。
- 面包屑：首页 → 分类 → 本篇。
- 元信息：发布日期、最后修改、阅读时间。
- 相关文章：按 `tags` 匹配，最多 3 篇。
**SEO**：Article + BreadcrumbList JSON-LD。

**关键约束**：
- **单篇文章 fallback 英文**——访问 `/ja/bosses/gelum` 若无日文版，显示英文版（metadata 也是英文），**不 404**。
- 这与列表页的「不 fallback」看似矛盾，实则合理：列表保证准确性（不展示没有的内容），详情保证可达性（直接 URL 访问不 404）。

### 7.4 侧边栏（WikiSidebar）

**数据源**：`lib/navigation.ts` 的 `getDynamicNavigation(locale)`。
**逻辑**：
1. 遍历 `NAVIGATION_CONFIG` 的所有 contentType。
2. 对每个 contentType，查询 `getEntriesByCategory(contentType, locale)`。
3. 按子目录分组（支持 `content/en/bosses/early-game/*.mdx` 嵌套）。
4. 渲染为可折叠的分组列表（原生 `<details>`）。
**多语言分组标题**：`locales/<locale>.json` 的 `overview.<contentType>.groupTitles` 映射（如日文 `bosses` → `ボス`）。

### 7.5 广告组件（详见第 10 章）

### 7.6 主题切换（ThemeToggle）

**零依赖方案**：
```astro
---
<!-- ThemeToggle.astro -->
---
<button id="theme-toggle" aria-label="Toggle theme" class="...">
  <!-- sun/moon icon -->
</button>
<script>
  const toggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
  toggle?.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  });
</script>
```

**关键**：script 放在 `<head>` 内联（避免 FOUC 闪烁），或在 BaseLayout 顶部加一个 blocking 的 theme-init script。

---

## 第 8 章 SEO 工程化

### 8.1 SEO 组件清单

| 组件/文件 | 作用 | 触发位置 |
|---|---|---|
| `BaseLayout.astro` | 全局 `<head>`：title 模板、description、og:*、twitter:*、Organization JSON-LD | 所有页面 |
| `JsonLd.astro` | 通用 JSON-LD 注入（接受 data prop） | 按需 |
| `lib/seo.ts` | JSON-LD 对象构造函数 | 各页面调用 |
| `sitemap.xml.ts` | 动态 sitemap | `/sitemap.xml` |
| `robots.txt.ts` | 动态 robots（含 sitemap 链接） | `/robots.txt` |

### 8.2 各页面 SEO 产出

#### 首页
- **title**：`home.meta.title`（独立配置，如 "Anvil Quest Wiki - Complete Guide"）。
- **JSON-LD**：
  - `Organization`（在 BaseLayout，全站都有）：name/url/logo/image。
  - `WebSite`（首页注入）：name + url + potentialAction（搜索 action，可选）。
  - `FAQPage`（可选，从 `home.faq.items` 构造，可能获得 SERP FAQ 折叠）。

#### 列表页
- **title**：`${overviewTitle} — ${site.name}` 或 fallback `${ContentType 大写} — ${site.name}`。
- **JSON-LD**：`ItemList`（每篇文章一个 ListItem，含 position/url/name）。

#### 文章页
- **title**：`${entry.title} — ${site.name}`。
- **description**：`entry.data.description`。
- **og:type**：`article`。
- **twitter:card**：`summary_large_image`。
- **og:image / twitter:image**：`entry.data.image`（缺省用 `/images/hero.webp`），**必须绝对路径**。
- **alternates.languages**：所有语言版本的 hreflang（`x-default` 指向英文）。
- **JSON-LD**：
  - `Article`：headline/description/image/datePublished/dateModified/author/publisher。
  - `BreadcrumbList`：首页 → 分类 → 本篇。

### 8.3 sitemap 生成规则（关键！）

**核心原则**：sitemap 必须只包含**实际存在的 MDX 文件**对应的 URL，**禁止**从硬编码数组生成。

```typescript
// src/pages/sitemap.xml.ts
import { getCollection } from 'astro:content';
import { SITE_URL } from 'astro:env';
import { locales, defaultLocale } from '~/i18n/routing';
import { CONTENT_TYPES } from '~/config/navigation';

export async function GET() {
  // 1. 扫描所有实际存在的 entry
  const entries = await getCollection('wiki');
  
  // 2. 为每个 entry × 每个语言生成 URL（含 hreflang alternate）
  const urls = entries.flatMap(entry => {
    // entry.id 格式：'en/bosses/gelum' 或 'ja/bosses/gelum'
    const [locale, contentType, ...slugParts] = entry.id.split('/');
    const slug = slugParts.join('/');
    return locales.map(loc => ({
      url: `${SITE_URL}${loc === defaultLocale ? '' : '/' + loc}/${contentType}/${slug}`,
      alternates: Object.fromEntries(locales.map(l => [l, /* ... */])),
    }));
  });
  
  // 3. 加上首页、列表页、法律页
  const staticUrls = [];
  for (const loc of locales) {
    const prefix = loc === defaultLocale ? '' : '/' + loc;
    staticUrls.push({ url: `${SITE_URL}${prefix}/` });                    // 首页
    for (const ct of CONTENT_TYPES) {
      staticUrls.push({ url: `${SITE_URL}${prefix}/${ct}` });             // 列表页
    }
    staticUrls.push({ url: `${SITE_URL}${prefix}/about` });               // 法律页
    // ...
  }
  
  // 4. 输出 XML
  return new Response(buildSitemapXml([...urls, ...staticUrls]), {
    headers: { 'Content-Type': 'application/xml' }
  });
}
```

> **实现细节**：实际推荐用 `@astrojs/sitemap` 集成（自动处理 alternate/i18n），以上是原理示意。集成配置见 `astro.config.mjs`。

### 8.4 hreflang 多语言链接

每页 `<head>` 注入：
```html
<link rel="alternate" hreflang="en" href="https://domain.com/bosses/gelum" />
<link rel="alternate" hreflang="ja" href="https://domain.com/ja/bosses/gelum" />
<link rel="alternate" hreflang="x-default" href="https://domain.com/bosses/gelum" />
```

由 `lib/url.ts` 的 `languageAlternates(contentType, slug)` 生成，遍历 `routing.locales`。

### 8.5 og:image 绝对路径（强制）

社交平台抓 OG 图要求**绝对路径**。所有 og:image / twitter:image 必须形如 `https://domain.com/images/hero.webp`。

由 `SITE_URL` 环境变量拼接，**禁止硬编码域名**。

---

## 第 9 章 多语言（i18n）

### 9.1 策略：as-needed 前缀

**英文（默认）无前缀**：`/bosses/gelum`
**其他语言带前缀**：`/ja/bosses/gelum`、`/ru/bosses/gelum`

**Astro 配置**：
```javascript
// astro.config.mjs
export default defineConfig({
  i18n: {
    locales: ['en', 'ja', 'ru'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,  // ⭐ 英文无前缀
    },
  },
});
```

> **验证状态**：已确认 Astro 5 原生支持 `prefixDefaultLocale: false`（即 as-needed 前缀策略，默认语言无前缀）。原「待验证清单」第 1 条 ✅ 通过。

### 9.2 路由实现

`src/pages/[locale]/[...slug].astro` 统一处理：
- 校验 `locale` ∈ `routing.locales`，否则 404。
- `slug.length === 0` → 首页。
- `slug.length === 1` → 列表页（`slug[0]` 是 contentType）。
- `slug.length > 1` → 详情页（`slug[0]` 是 contentType，`slug.slice(1).join('/')` 是文章 slug）。

**英文无前缀的处理**：
- Astro 的 `prefixDefaultLocale: false` 会自动让 `/bosses/gelum`（无 `/en`）也能匹配到 `[locale]` 路由（locale 被解析为 `en`）。
- 若某些版本不自动处理，fallback 方案：`src/pages/[...slug].astro`（顶层）+ `src/pages/[locale]/[...slug].astro`（带前缀）双路由，或用 middleware 重写。详见 deployment.md 的「i18n 路由陷阱」章节。

### 9.3 文章 fallback 机制

```typescript
// src/lib/content.ts
import { getEntry } from 'astro:content';

export async function getEntryWithFallback(
  contentType: string,
  slug: string,
  locale: Locale,
) {
  // 1. 尝试当前语言
  const entry = await getEntry('wiki', `${locale}/${contentType}/${slug}`);
  if (entry) return { entry, locale: locale, isFallback: false };
  
  // 2. fallback 英文
  const fallback = await getEntry('wiki', `en/${contentType}/${slug}`);
  if (fallback) return { entry: fallback, locale: 'en', isFallback: true };
  
  // 3. 都没有 → null（路由层返回 404）
  return null;
}
```

**列表页不 fallback**：
```typescript
export async function getEntriesByCategory(contentType: string, locale: Locale) {
  const all = await getCollection('wiki');
  return all.filter(e => 
    e.id.startsWith(`${locale}/${contentType}/`)
  );
  // 注意：这里只过滤当前语言，不 fallback 英文
}
```

### 9.4 UI 文案 fallback

```typescript
// src/i18n/ui.ts
import en from '~/locales/en.json';
import ja from '~/locales/ja.json';

const messages = { en, ja };

export function getUi(locale: Locale) {
  // deepMerge：以 en 为底，用 locale 覆盖（缺 key 自动回退英文）
  return deepMerge(en, messages[locale] ?? {});
}
```

### 9.5 新增语言的三步

1. `src/i18n/routing.ts` 的 `locales` 数组加新 locale。
2. `src/locales/` 下创建 `<locale>.json`（可先空 `{}`，deepMerge 自动回退英文）。
3. `src/content/<locale>/` 下创建目录（可先空，文章慢慢补）。

> **侧边栏分组标题本地化**：若要让侧边栏分组名本地化（如日文 `bosses` → `ボス`），在 `locales/<locale>.json` 的 `overview.<contentType>.groupTitles` 加映射。不加则显示英文。

---

## 第 10 章 广告系统

### 10.1 设计原则

**核心**：iframe 隔离——每个广告位一个独立 html 文件，避免多个 `window.atOptions` 串号。

### 10.2 广告位清单（按 CPM 从高到低）

| 广告类型 | 尺寸 | CPM 实测 | 收入占比 | 必配 |
|---|---|---|---|---|
| Banner Sticky | 320×50 | $3.25 | ~50% | ✅ 收入主力 |
| Sidebar Sticky | 160×300 | $1.85 | ~15% | ✅ 桌面端 |
| Sidebar Sticky | 160×600 | $1.50 | ~10% | ✅ 桌面端 |
| Banner | 728×90 | $1.31 | ~5% | ✅ |
| Banner | 300×250 | $0.84 | ~5% | ✅ |
| Native Banner | — | $0.65 | ~11% | ✅ 靠走量 |
| Banner | 468×60 | $0.75 | ~3% | 可选 |

**不挂**：Popunder（伤体验）、Social Bar（高 CTR 陷阱，收入仅 2%）、Smartlink（未实测）。

### 10.3 iframe 隔离方案

**每个广告位一个独立 html**（放 `public/ads/`）：
```html
<!-- public/ads/banner-320x50.html -->
<!DOCTYPE html>
<html>
<body style="margin:0">
  <script type="text/javascript">
    atOptions = {
      'key': 'YOUR_AD_KEY',  // 构建时通过环境变量替换，或保留占位
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };
  </script>
  <script src="//www.highperformanceformat.com/YOUR_AD_KEY/invoke.js"></script>
</body>
</html>
```

**Astro 广告组件**：
```astro
---
// src/components/ads/AdBanner.astro
interface Props { type: string; eager?: boolean; }
const { type, eager } = Astro.props;
const adKey = import.meta.env.PUBLIC_AD_BANNER_320X50;  // 环境变量驱动
if (!adKey) return null;  // key 为空不渲染
---
<iframe
  src={`/ads/${type}.html`}
  width={type.match(/(\d+)x(\d+)/)?.[1] ?? 300}
  height={type.match(/(\d+)x(\d+)/)?.[2] ?? 50}
  scrolling="no"
  loading={eager ? 'eager' : 'lazy'}
  style="border:none"
></iframe>
```

### 10.4 Sticky 320×50（收入主力）

```astro
---
// src/components/ads/StickyBanner.astro
const adKey = import.meta.env.PUBLIC_AD_MOBILE_320X50;
---
{adKey && (
  <div class="sticky top-20 z-20 py-2">
    <div class="relative mx-auto max-w-4xl pr-10">
      <AdBanner type="banner-320x50" eager />
      <button
        id="dismiss-sticky"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border p-1"
        aria-label="Close ad"
      >
        <Icon name="x" class="h-4 w-4" />
      </button>
    </div>
  </div>
)}
<script>
  // 3 行 JS：关闭按钮 + localStorage 记忆
  const btn = document.getElementById('dismiss-sticky');
  if (btn && localStorage.getItem('sticky-dismissed') === '1') btn.parentElement?.parentElement?.remove();
  btn?.addEventListener('click', () => {
    localStorage.setItem('sticky-dismissed', '1');
    btn.parentElement?.parentElement?.remove();
  });
</script>
```

### 10.5 环境变量驱动

广告 key 全部走环境变量，**key 为空时组件 return null 不渲染**。新手部署时广告位是空的，不报错；接入广告时填 env 即生效。

环境变量清单见 [附录 A](#附录-a-环境变量清单)。

### 10.6 广告部署流程（新手指南）

1. 注册 Adsterra Publisher 账号。
2. Add Website → 填域名 → 选 Games 分类 → 选广告格式。
3. 审核通过（1-3 分钟）后，创建各广告单元拿 key。
4. 在 Cloudflare Pages 项目 Settings → Environment variables 填入各 key。
5. 重新部署，广告自动出现。

详见 `docs/ads.md`。

---

## 第 11 章 换皮工作流

### 11.1 概述

**换皮**（skinning）= 把通用 AnvilWiki 模板变成特定游戏的站点。

AnvilWiki 采用「4 阶段 7 Part」换皮方法论，提示词遵循「目标+参照+约束+禁止+验证」六要素结构，把换皮过程拆成可复现的步骤。

### 11.2 4 阶段 7 Part 流程

```
阶段 1：基础换皮 ──→ Part 1 基础配置（主题色/favicon/hero/logo）
                    Part 2 元数据与 SEO（法律页/全局 meta/CTA/Footer）
                    Part 3 多语言与导航（语言列表/清空旧内容/导航配置）

阶段 2：首页内容 ──→ Part 4 首页模块（8 模块 JSON + Hero/FAQ/CTA）

阶段 3：内容与导航 ─→ Part 5 文章与导航（MDX 接入/分类配置/overview 文案）

阶段 4：翻译与验证 ─→ Part 6 多语言翻译（UI 文案 + 文章翻译）
                    Part 7 Sitemap URL 检查与自动修复
```

### 11.3 换皮改动对象与 AnvilWiki 路径对照

下表列出换皮时需要改动的对象及其在 AnvilWiki 中的位置（`docs/migration-from-nextjs.md` 提供 Next.js 结构的迁移映射，供从 Next.js 项目迁移过来的用户参考）：

| 改动对象 | AnvilWiki 路径（Astro） |
|---|---|
| 主题色 | `src/styles/globals.css` |
| 站点信息 | `src/config/site.ts` + `locales/en.json` |
| 导航配置 | `src/config/navigation.ts` |
| 语言列表 | `src/i18n/routing.ts` |
| UI 文案 | `src/i18n/ui.ts` + `src/locales/*.json` |
| 首页文案 | `src/locales/en.json` 的 `home` 命名空间 |
| 文章目录 | `src/content/<locale>/<type>/*.mdx` |
| 文章元数据 | YAML frontmatter `---\n...---` |
| sitemap | `src/pages/sitemap.xml.ts` |
| robots | `src/pages/robots.txt.ts` |
| 法律页 | `src/pages/[locale]/*.astro` |
| 首页路由 | `src/pages/[locale]/index.astro` + `components/home/` |
| 列表/详情路由 | `src/pages/[locale]/[...slug].astro` |
| YouTube video ID | `src/config/site.ts` 或 `locales/en.json` 的 `home.hero.videoId` |

### 11.4 提示词骨架（每个 Part 都遵循）

```
# Part N：<标题>

## 目标
<改完后站点变成什么样>

## 参照
- 数据来源：<REQUIREMENTS_DIR>/<文件> 的 <区块>
- 真相源优先级：site.ts > 00基础信息.md > 模板残留

## 修改范围
- <文件 1>：<改什么、怎么改>
- <文件 2>：<改什么、怎么改>

## ⚠️ 硬性约束
- <容易踩的坑 + 正确做法>

## 禁止修改
- <白名单外的文件/key>

## 验证方法
```bash
<grep/ls/file 命令，配中文注释>
```
```

### 11.5 关键换皮约束

| 约束 | 说明 |
|---|---|
| **主题色只改 4 行** | `--nav-theme` + `--nav-theme-light`（`:root` 2 行 + `.dark` 2 行），其他变量通过 `var()` 自动跟随。 |
| **分类 key 三处同步** | `navigation.ts` 的 key = `locales/en.json` 的 `nav.<key>` = `src/content/<locale>/<key>/` 目录名。 |
| **sitemap 禁止硬编码** | 必须扫描实际 MDX，禁止从 `NAVIGATION_CONFIG` 或手写列表生成 URL。 |
| **og:image 绝对路径** | 必须 `${SITE_URL}/images/hero.webp`，相对路径社交平台抓不到。 |
| **hero.webp 不能是空文件** | 模板自带的可能是 0 字节占位，必须下载真实图覆盖。 |
| **删 MDX 不删目录** | `src/content/` 目录必须保留（空目录也行），删了会导致 Content Collection 构建失败。 |
| **article 从 H2 开始** | 不写 H1，ArticlePage 自动用 title 渲染 H1，避免双 H1。 |
| **card-list label 去 emoji 化** | `card-list` 的 `highlights.label` 必须是英文短词，不是 emoji（违反「禁止 emoji」规则）。 |
| **域名不硬编码** | 所有 URL 走 `SITE_URL` 环境变量，禁止在代码里写死 `xxx.wiki`。 |

### 11.6 完整换皮提示词

各 Part 的完整提示词原文放在 `docs/skinning.md`（开发阶段补全）。骨架统一遵循六要素结构，路径为 Astro 结构。

### 11.7 seoscout 内容适配

seoscout 输出的 MDX 格式是 `export const metadata = {...}`（JS export 格式）。AnvilWiki 用 YAML frontmatter。

**适配方案**：
1. **脚本转换**（推荐）：`scripts/convert-from-seoscout.ts` 一行命令把 seoscout 输出转为 AnvilWiki 格式。
   ```bash
   pnpm convert-seoscout <input-dir> <output-dir>
   ```
   正则匹配 `export const metadata = { ... }` → 转 YAML frontmatter。
2. **seoscout 适配**：若 seoscout 可配置输出格式，加一个「AnvilWiki / YAML frontmatter」选项。
3. **手动**：复制粘贴后改头部（少量文章时）。

详见 `docs/migration-from-nextjs.md`。

---

## 第 12 章 部署方案

### 12.1 部署目标

- **零配置**：连 GitHub 仓库 → 自动识别 Astro → 自动构建 → 自动部署。
- **免费**：Cloudflare Pages 免费版（无限带宽、无限请求、500 次/月构建）。
- **新手友好**：UI 操作，无需 CLI（可选 Wrangler 进阶）。

### 12.2 部署架构

```
开发者 push 到 GitHub
         │
         ▼
Cloudflare Pages（连接 GitHub 仓库）
  ├── 自动检测框架（Astro）
  ├── 自动执行构建命令：pnpm install && pnpm build
  ├── 输出 dist/ 目录
  ├── 部署到全球 CDN（300+ 边缘节点）
  └── 分配 *.pages.dev 子域名
         │
         ▼
用户绑定自定义域名（可选）
  ├── 在域名商配 CNAME → <project>.pages.dev
  ├── Cloudflare 自动签发 SSL（Let's Encrypt）
  └── DNS 生效后 HTTPS 可用
```

### 12.3 Cloudflare Pages 配置

**框架预设**：Astro（自动识别）。
**构建命令**：`pnpm build`
**输出目录**：`dist`
**环境变量**：见 [附录 A](#附录-a-环境变量清单)。
**Node 版本**：`NODE_VERSION = 20`（Cloudflare Pages 默认支持）。

**`wrangler.toml`（可选，用于本地预览）**：
```toml
name = "anvilwiki"
compatibility_date = "2026-08-11"
pages_build_output_dir = "dist"
```

### 12.4 新手部署流程（5 步）

```
1. Fork AnvilWiki 仓库到自己的 GitHub
2. 改配置层（site.ts / navigation.ts / globals.css）+ 替换内容层（src/content/ / locales/）
3. cloudflare.com → Pages → Create a project → Connect to Git → 选仓库
4. 确认构建配置（自动识别 Astro）→ Save and Deploy
5. 等 2-3 分钟构建完成 → 访问 <project>.pages.dev 看到 site
```

绑定自定义域名：
```
6. Pages 项目 → Custom domains → Set up a custom domain → 输入域名
7. 按提示在域名商加 CNAME 记录 → 等 DNS 生效（几分钟~几小时）
8. SSL 自动签发，HTTPS 可用
```

### 12.5 备选部署方案

| 方案 | 适用场景 | 说明 |
|---|---|---|
| **Cloudflare Workers** | 进阶用户、需要 SSR/API | 2026 官方推荐新项目方案，文档补充指南。 |
| **Netlify** | 备选 | AnvilWiki 是纯静态，可零配置部署到任何静态托管。 |
| **Vercel** | 备选 | 同上。 |
| **GitHub Pages** | 备选（需 `base` 配置） | 免费，但有 100GB/月带宽限制。 |
| **自建 VPS** | 完全控制 | `pnpm build` → `scp -r dist/ user@vps:/var/www/` → nginx + certbot。 |

### 12.6 环境变量管理

所有环境变量在 Cloudflare Pages 项目 Settings → Environment variables 配置。支持 Production / Preview 两套。

**关键**：`SITE_URL` 必须在 production 配为最终域名（如 `https://anvilquestwiki.wiki`），影响 sitemap / og:image / robots 的绝对路径生成。

---

## 第 13 章 测试与质量保障

### 13.1 测试策略

| 层级 | 工具 | 覆盖范围 | CI 集成 |
|---|---|---|---|
| **类型检查** | `astro check` + TypeScript strict | Content Collection schema、组件 props、工具函数 | ✅ 每个 PR |
| **Lint** | ESLint + Prettier + `eslint-plugin-astro` | 代码风格、常见错误 | ✅ 每个 PR |
| **构建检查** | `pnpm build` | 构建是否成功（含 Content schema 校验） | ✅ 每个 PR |
| **单元测试** | Vitest | `lib/` 工具函数（URL 构造、JSON-LD 生成、deepMerge、fallback 逻辑） | ✅ 每个 PR |
| **端到端** | Playwright（可选） | 关键用户路径（首页/列表/详情/语言切换/404） | ⚠️ 可选，nightly |
| **链接检查** | `scripts/check-sitemap.ts` | sitemap 所有 URL 返回 200 | ✅ 部署后 |
| **SEO 检查** | Lighthouse CI | Performance/SEO/Accessibility/A11y 分数 | ✅ 部署后 |
| **结构化数据** | Google Rich Results Test（手动） | JSON-LD 有效性 | 上线前手动 |

### 13.2 CI 工作流（`.github/workflows/ci.yml`）

```yaml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck       # astro check
      - run: pnpm test             # vitest
      - run: pnpm build            # 含 Content schema 校验
```

### 13.3 关键测试用例

#### 13.3.1 Content Collection schema 校验
```typescript
// tests/content.test.ts
describe('Content Collections', () => {
  it('应该拒绝缺 title 的文章', () => {
    // 构建时 Zod 会报错，build 失败
  });
  it('应该拒绝 description > 160 字符', () => { /* ... */ });
  it('应该接受合法 frontmatter', () => { /* ... */ });
});
```

#### 13.3.2 多语言 fallback
```typescript
// tests/i18n.test.ts
describe('i18n fallback', () => {
  it('单篇文章缺失时 fallback 英文不 404', async () => {
    const result = await getEntryWithFallback('bosses', 'gelum', 'ja');
    expect(result).not.toBeNull();
    expect(result.isFallback).toBe(true);  // 日文无，回退英文
  });
  it('列表页不 fallback，缺失语言显示空', async () => {
    const list = await getEntriesByCategory('bosses', 'ja');
    expect(list).toEqual([]);  // 日文无 bosses 内容，返回空
  });
});
```

#### 13.3.3 sitemap 完整性
```typescript
// tests/sitemap.test.ts
describe('sitemap', () => {
  it('只包含实际存在的 MDX', () => {
    // 对比 sitemap URL 数 vs Content Collection entry 数
  });
  it('包含所有语言的 alternate', () => { /* ... */ });
  it('x-default 指向英文版', () => { /* ... */ });
});
```

### 13.4 性能基准

| 指标 | 目标 | 测量工具 |
|---|---|---|
| Lighthouse Performance | ≥ 95 | PageSpeed Insights / Lighthouse CI |
| LCP（Largest Contentful Paint） | < 2.5s | Lighthouse |
| CLS（Cumulative Layout Shift） | < 0.1 | Lighthouse |
| FID/INP（Interaction） | < 100ms | Lighthouse |
| 首屏 JS 体积（gzipped） | < 30KB | webpack-bundle-analyzer / Astro bundle stats |
| 首屏 HTML 体积（gzipped） | < 50KB | curl + gzip |
| 构建时间（100 篇文章） | < 60s | CI 日志 |

**性能目标**：v1.0 交付时附带性能基准实测报告，验证上述目标全部达成。

---

## 第 14 章 开发路线图

### 14.1 里程碑

| 里程碑 | 交付物 | 验收标准 | 预计工时 |
|---|---|---|---|
| **MVP-0**：骨架 | Astro 项目初始化 + Content Collection 配置 + 单篇示例 MDX + 首页/列表页/详情页三页跑通 + Cloudflare Pages 部署成功 | 访问 `*.pages.dev` 能看到三页，Lighthouse Performance ≥ 95 | 1-2 天 |
| **MVP-1**：多语言 | as-needed 前缀（`prefixDefaultLocale: false`）+ 文章 fallback + 语言切换器 + UI 文案 deepMerge | 加 `ja` 语言，访问 `/ja/bosses/gelum`（无 ja 版）回退英文 | 1 天 |
| **MVP-2**：首页 8 模块 | JSON 驱动 + 4 种 displayType（code-cards/step-by-step/tier-grid/card-list）+ Hero/FAQ/CTA/Footer/Video/RecentUpdates/Trending/AboutGame | 换 en.json 数据，首页无组件改动即生效 | 1-2 天 |
| **MVP-3**：SEO | sitemap 动态 + JSON-LD 全套（Organization/WebSite/Article/Breadcrumb/ItemList/FAQPage）+ hreflang + robots | Google Rich Results Test 全通过 | 1 天 |
| **MVP-4**：主题换肤 | CSS 变量双变量（`--nav-theme` + `--nav-theme-light`）+ 暗色模式 + 主题切换器 | 改 globals.css 4 行整站变色 | 0.5 天 |
| **MVP-5**：广告系统 | Adsterra iframe 隔离（6 种广告位）+ Sticky 320×50 + 环境变量驱动 + 关闭按钮 | 移动端 + 桌面端广告正常显示不串号 | 1 天 |
| **MVP-6**：换皮文档 | 重写 4 阶段 7 Part 提示词（适配 Astro 路径）+ 新手 README + docs/ 全套 | 新手照 README 30 分钟内部署上线 | 1-2 天 |
| **v1.0**：基准实测与发布 | AnvilWiki demo 站 + 性能基准实测报告（Lighthouse/体积/构建时间）+ GitHub Release | 性能目标全部达成，demo 站可访问 | 1 天 |

**总计**：约 **7-10 天**可交付 v1.0。

### 14.2 v1.0 后的迭代方向

| 版本 | 功能 | 优先级 |
|---|---|---|
| v1.1 | seoscout 格式自动转换脚本 + 文档 | 高 |
| v1.2 | 搜索功能（Pagefind 离线搜索，零运行时） | 中 |
| v1.3 | 更多 displayType（video-grid/timeline/comparison-table） | 中 |
| v1.4 | 评论系统（Giscus/Utterances，可选） | 低 |
| v1.5 | 图片优化（Astro Image，自动 WebP/AVIF + 响应式） | 中 |
| v2.0 | 可视化换皮 CLI（`pnpm skin <game-name>` 引导式换皮） | 高 |

### 14.3 「待验证清单」回填计划

以下 9 项关键技术假设，在 MVP 阶段逐条验证：

| # | 待验证项 | 验证里程碑 | 状态 |
|---|---|---|---|
| 1 | i18n as-needed 路由策略 | MVP-1 | ✅ 已确认（`prefixDefaultLocale: false`） |
| 2 | 文章语言 fallback | MVP-1 | ⏳ 待实现验证 |
| 3 | seoscout MDX 格式适配 | v1.1 | ⏳ 待实现验证 |
| 4 | shadcn/ui 在 Astro 下的体验 | — | ❌ 决策不用（采用纯 Astro 原生组件，见 ADR-002） |
| 5 | 多语言 sitemap/hreflang 自动生成 | MVP-3 | ⏳ 待实现验证 |
| 6 | 侧边栏动态导航 | MVP-2 | ⏳ 待实现验证 |
| 7 | 主题色方案落地 | MVP-4 | ⏳ 待实现验证 |
| 8 | 性能基准实测 | v1.0 | ⏳ 待实测 |
| 9 | 迁移成本核算 | v1.0 | ⏳ 待总结 |

---

## 第 15 章 开源运营

### 15.1 仓库策略

- **仓库地址**：`github.com/<待定>/anvilwiki`
- **协议**：MIT（最宽松，允许商用）
- **主分支**：`main`（受保护，PR 合并）
- **发版**：Semantic Versioning（v1.0.0 / v1.1.0 / v1.1.1）
- **Release notes**：中英双语

### 15.2 文档策略

| 文档 | 受众 | 位置 |
|---|---|---|
| README.md（中英双语） | 所有用户，新手入门 | 仓库根目录 |
| docs/PRD.md | 贡献者、想深入了解设计的人 | 本文档 |
| docs/deployment.md | 新手，部署指南 | docs/ |
| docs/skinning.md | 换皮用户，4 阶段 7 Part | docs/ |
| docs/content-format.md | 内容创作者，MDX 格式 | docs/ |
| docs/seo.md | 进阶用户，SEO 调优 | docs/ |
| docs/ads.md | 变现用户，广告接入 | docs/ |
| docs/migration-from-nextjs.md | 传统 Next.js 模板用户，迁移指南 | docs/ |

### 15.3 Demo 站策略

- **官方 demo**：`anvilwiki.pages.dev`，用虚构游戏 "Anvil Quest" 做一个完整 demo 站。
- **源码**：`examples/anvil-quest/` 子目录（或独立分支）。
- **目的**：让用户直观看到 AnvilWiki 长什么样、性能如何。
- **dogfooding**：AnvilWiki 的文档站（`docs.anvilwiki.dev`）也用 AnvilWiki 自身构建，验证模板能力。

### 15.4 社区运营

| 渠道 | 用途 |
|---|---|
| GitHub Issues | bug 报告、功能建议 |
| GitHub Discussions | 问答、换皮案例分享、showcase |
| CONTRIBUTING.md | 贡献指南（开发环境、PR 规范、代码风格） |
| CHANGELOG.md | 版本变更记录 |
| （可选）Discord | 实时交流（社区长大后开） |

### 15.5 推广策略

1. **开发者社区**：在游戏 wiki / SEO 站相关的开发者社群分享，定位为「Cloudflare 原生方案」。
2. **技术社区**：Astro 官方 Discord / Reddit r/Astro / V2EX / 掘金 / Twitter，分享「Astro + Cloudflare 做游戏 wiki」教程。
3. **GitHub Topic**：打标签 `astro` / `cloudflare-pages` / `wiki-template` / `game-wiki` / `seo` / `open-source`。
4. **SEO 自证**：AnvilWiki demo 站本身做到 Google 首页（搜 "anvil quest wiki"），证明模板的 SEO 能力。

---

## 附录 A 环境变量清单

### A.1 站点配置

| 变量名 | 用途 | 示例 | 必填 |
|---|---|---|---|
| `SITE_URL` | 站点绝对 URL（sitemap/og:image/robots 拼接用） | `https://anvilquestwiki.wiki` | ✅ |

### A.2 广告 key（Adsterra）

| 变量名 | 广告类型 |
|---|---|
| `PUBLIC_AD_MOBILE_320X50` | Sticky 小横幅（收入主力） |
| `PUBLIC_AD_SIDEBAR_160X300` | 侧边栏半高 |
| `PUBLIC_AD_SIDEBAR_160X600` | 侧边栏竖幅 |
| `PUBLIC_AD_BANNER_728X90` | 大横幅 |
| `PUBLIC_AD_BANNER_300X250` | 中等矩形 |
| `PUBLIC_AD_BANNER_468X60` | 经典横幅 |
| `PUBLIC_AD_NATIVE_BANNER` | Native Banner |
| `PUBLIC_GOOGLE_ADSENSE_ID` | AdSense 自动广告（可选） |

> 所有广告变量为空时，对应广告组件 `return null` 不渲染。新手部署时不填也能正常上线。

### A.3 其他（可选）

| 变量名 | 用途 |
|---|---|
| `PUBLIC_GA_ID` | Google Analytics ID（如 `G-XXXXXXXX`） |
| `PUBLIC_GSC_VERIFICATION` | Google Search Console 验证 token |

### A.4 环境变量示例文件

仓库提供 `.env.example`：
```bash
# 站点配置
SITE_URL=https://your-domain.wiki

# 广告（可选，留空则不显示）
PUBLIC_AD_MOBILE_320X50=
PUBLIC_AD_SIDEBAR_160X300=
PUBLIC_AD_SIDEBAR_160X600=
PUBLIC_AD_BANNER_728X90=
PUBLIC_AD_BANNER_300X250=
PUBLIC_AD_BANNER_468X60=
PUBLIC_AD_NATIVE_BANNER=
PUBLIC_GOOGLE_ADSENSE_ID=

# 分析（可选）
PUBLIC_GA_ID=
```

---

## 附录 B 上线前检查清单

### B.1 基础配置

```
□ site.ts 已填正确游戏名/域名/社交链接
□ navigation.ts 的 key 与 content/ 子目录一一对应
□ routing.ts 的 locales 与 src/locales/*.json 文件同步
□ globals.css 主题色已改（4 行）
□ favicon 全套已替换
□ public/images/hero.webp 是真实图片（非 0 字节占位）
□ manifest.json 已填游戏名
```

### B.2 内容

```
□ src/content/ 下有至少 1 篇 MDX（或保持 homepage-only 模式）
□ 所有 MDX frontmatter 通过 Zod schema 校验
□ 文章正文从 H2 开始（不写 H1）
□ card-list 的 highlights.label 已去 emoji
```

### B.3 SEO

```
□ SITE_URL 环境变量已配为最终域名
□ sitemap.xml 可访问，URL 数 = 实际页面数
□ robots.txt 可访问，含 sitemap 链接
□ 首页有 Organization + WebSite JSON-LD
□ 列表页有 ItemList JSON-LD
□ 文章页有 Article + BreadcrumbList JSON-LD
□ 所有页面 og:image 是绝对路径
□ hreflang alternate 覆盖所有语言，x-default 指向英文
□ Google Rich Results Test 全通过
```

### B.4 性能

```
□ Lighthouse Performance ≥ 95
□ LCP < 2.5s
□ CLS < 0.1
□ 首屏 JS（gzipped）< 30KB
```

### B.5 部署

```
□ Cloudflare Pages 项目已创建，连 GitHub 仓库
□ 构建命令 pnpm build，输出目录 dist
□ NODE_VERSION = 20 已配
□ 环境变量已填（至少 SITE_URL）
□ 自定义域名已绑定，SSL 已生效
□ 部署成功，访问域名看到正确内容
```

### B.6 验证

```
□ sitemap 所有 URL 返回 200（跑 scripts/check-sitemap.ts）
□ 移动端 + 桌面端分别访问正常
□ 语言切换器工作正常
□ 暗色/亮色切换正常
□ 无旧 demo 游戏（Anvil Quest）残留（grep "Anvil Quest" 应为 0，除非故意保留 demo）
□ Google Search Console 已添加资源，提交 sitemap
```

### B.7 广告（上线 2-3 天后）

```
□ Adsterra 账号已注册，网站已审核通过
□ 各广告 key 已配到 Cloudflare 环境变量
□ 移动端 + 桌面端广告正常显示不破版
□ 320×50 Sticky 正常，有关闭按钮
□ 桌面端侧边栏广告 fixed 正常
□ 无自动弹窗 / 跳转（有则关 Popunder/Social Bar）
□ Adsterra 后台 impression 数在涨
```

---

## 附录 C 术语表

| 术语 | 含义 |
|---|---|
| **wiki 站** | 围绕某游戏/主题的攻略内容站，靠 SEO 获取流量 |
| **换皮** | 把通用模板变成特定游戏站点的过程 |
| **MDX** | Markdown + JSX，支持在 Markdown 中使用组件 |
| **Content Collections** | Astro 的内容管理机制，类型安全 + schema 校验 |
| **Content Layer API** | Astro 5 引入的内容层 API，支持 glob/file/API loader |
| **as-needed 前缀** | 多语言 URL 策略：默认语言无前缀，其他语言带前缀 |
| **fallback** | 某语言内容缺失时自动回退到默认语言（英文） |
| **displayType** | 首页模块的渲染类型（code-cards/step-by-step/tier-grid/card-list） |
| **JSON-LD** | 结构化数据格式，告诉搜索引擎页面内容类型 |
| **hreflang** | 多语言页面 alternate 链接，告诉搜索引擎各语言版本位置 |
| **iframe 隔离** | 每个广告用独立 iframe，避免 atOptions 串号 |
| **Sticky 广告** | 粘在屏幕固定位置的广告，曝光时长更长，CPM 更高 |
| **三层架构** | 框架层 / 配置层 / 内容层 分离，换皮只改后两层 |
| **homepage-only 模式** | 只上线首页，无文章内容，后续慢慢补 |
| **dogfooding** | 自己用自己的产品（AnvilWiki 文档站用 AnvilWiki 构建） |

---

## 更新记录

| 日期 | 版本 | 说明 |
|---|---|---|
| 2026-08-11 | v0.1 | PRD 初稿；技术事实已通过 Astro 官方文档核实 |

---

> **下一步**：等待 user review 本 PRD。Review 通过后，按 [第 14 章 开发路线图](#第-14-章-开发路线图) 启动 MVP-0 开发。
