# AnvilWiki 产品需求文档（PRD）

> **版本**：v1.0
> **日期**：2026-08-12
> **状态**：已发布（demo 站 anvilwiki.pages.dev 上线，Lighthouse 全 100，CI 全绿）
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
- [第 11 章 套用模板指南](#第-11-章-套用模板指南)
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

游戏 wiki 站点（game wiki site）是一种以搜索引擎为主要流量来源的内容站：围绕某款游戏（尤其是 Roblox、Steam 新游）的攻略、兑换码、tier list 等关键词，批量生产结构化文章，通过 SEO 获取自然流量，再通过广告（如 Google AdSense）变现。

这类站点的技术特征非常明确：

- **纯内容站**——无登录、无数据库、无实时数据，本质是 MDX/Markdown 文章 + 静态页面。
- **SEO 是生命线**——title / description / JSON-LD / sitemap / hreflang / 内链结构必须工程化自动生成。
- **多语言**——英文为主（SEO 最优），按热度补日/俄/葡/西等语言，缺失内容要能 fallback 英文不报错。
- **批量套用**——同一套框架服务几十上百个不同游戏，换游戏只改配置和内容，不动框架代码。
- **免费部署 + 高带宽**——单个站流量周期 2-3 个月，流量峰值可能很高，需要免费且不限带宽的部署方案。

### 1.2 设计目标

AnvilWiki 围绕游戏 wiki 站点的技术特征，确立以下设计目标：

- **免费部署**：选择 Cloudflare Pages 作为默认部署平台，享受无限带宽 + 全球 CDN + 免费 SSL，单站流量再大也不产生费用。
- **高性能**：静态优先架构，零 JS by default，目标 Lighthouse Performance ≥ 95，Core Web Vitals 全绿。
- **SEO 工程化**：sitemap / JSON-LD / hreflang / robots / 内链结构全部由代码自动生成，填内容即生效。
- **多语言**：as-needed 前缀策略（英文无前缀），文章单篇 fallback 英文不 404，列表不 fallback。
- **批量套用**：同一套框架服务几十上百个不同游戏，换游戏只改配置和内容，不动框架代码。
- **新手友好**：连 GitHub 仓库自动部署，无需理解适配器/middleware，30 分钟内完成 fork → 套用模板 → 部署上线全流程。

> AnvilWiki 选择纯静态输出，部署到 Cloudflare Pages 无需适配器，直接托管 `dist/` 静态文件即可。

### 1.3 AnvilWiki 的定位

**AnvilWiki 是一个开源（MIT）的游戏 wiki 站点模板**，用 Astro + Cloudflare Pages 技术栈，让新手零成本免费部署上线。模板只负责消费标准 YAML frontmatter 的 MDX 文章，不绑定特定内容生成工具链。

> **命名由来**：Anvil（铁砧）——锻造装备的基础工具，寓意这是「锻造游戏 wiki 站的基础模板」。

---

## 第 2 章 目标与非目标

### 2.1 核心目标

| # | 目标 | 验收标准 |
|---|---|---|
| G1 | **Cloudflare 原生部署** | 纯静态输出，零适配器，部署到 Cloudflare Pages 无需任何额外配置。 |
| G2 | **免费无限带宽** | 利用 Cloudflare Pages 静态站无限带宽，单站流量再大也不产生费用。 |
| G3 | **高性能** | Lighthouse Performance ≥ 95，Core Web Vitals（LCP/FID/CLS）全绿。 |
| G4 | **新手友好** | 新手照 README 30 分钟内完成 fork → 套用模板 → 部署上线全流程。 |
| G5 | **SEO 工程化** | sitemap / JSON-LD / hreflang / robots / 内链全部由代码自动生成，填内容即生效。 |
| G6 | **多语言开箱即用** | as-needed 前缀策略（英文无前缀），文章单篇 fallback 英文不 404，列表不 fallback。 |
| G7 | **模板套用工程化** | 结构化套用流程（见 docs/apply-template.md），改配置不改框架代码。 |
| G8 | **广告就绪** | 内置 Google AdSense 广告系统，环境变量驱动，新手填 key 即生效。 |
| G9 | **开源** | MIT 协议，中英双语 README，完整文档，欢迎社区贡献。 |

### 2.2 非目标（明确不做）

| # | 非目标 | 原因 |
|---|---|---|
| N1 | **不做服务端动态能力** | 无登录、无数据库、无实时数据。需要这些的场景请用 Next.js / SvelteKit。 |
| N2 | **不做可视化后台/CMS** | 内容靠 MDX 文件 + Git，文件系统即数据库。需要 CMS 的用户自行接 Astro DB / Decap CMS。 |
| N3 | **不做自动化内容生成** | 内容生成是独立工具链，AnvilWiki 只负责消费标准 MDX 文章。提供 frontmatter 格式说明，不绑定特定生成工具。 |
| N4 | **不做 React/Vue/Svelte 全栈** | 交互组件用纯 Astro 原生 + 极少 vanilla JS。不为单一组件引入整个 framework runtime。 |
| N5 | **广告默认接 Google AdSense** | 广告系统基于 Google AdSense（`<ins class="adsbygoogle">`），3 个广告位（Sticky / Sidebar / InContent）各一个 slot，环境变量驱动。不内置其他广告网络的隔离方案。 |
| N6 | **不做内容运营教学** | AnvilWiki 是模板，不是教程。文档聚焦「怎么用模板」，不教选词/SEO 策略/外链建设。 |

### 2.3 目标用户画像

| 画像 | 特征 | AnvilWiki 如何服务 |
|---|---|---|
| **P1：有建站经验的开发者** | 有游戏 wiki 建站经验，会用 Cursor/Claude Code，想搭一套自己的站。 | 标准的 MDX + YAML frontmatter 格式，兼容任何内容生成工具链，fork 即用。 |
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
| 首页模块 | JSON 驱动（v0.2：6 区块 / 4 explore 模块） | 文案与组件解耦，换游戏只改 JSON，组件零改动。 |
| SEO 工程化 | 完整（sitemap/JSON-LD/hreflang/robots） | sitemap / JSON-LD（Organization/WebSite/Article/BreadcrumbList/ItemList/FAQPage）/ hreflang / robots 全部代码自动生成。 |
| 广告系统 | Google AdSense | 3 个广告位（Sticky / Sidebar / InContent）各一个 AdSense slot，环境变量驱动，新手填 key 即生效。 |
| 套用模板流程 | 配置参考手册 | 换游戏只改配置层 + 替换内容层，代码层不动。 |
| 游戏站适配 | 专为游戏站设计 | 内置游戏站特定的 SEO（ItemList/Breadcrumb）+ 兑换码/tier list 专用 displayType。 |

### 3.2 技术栈选型

| 层 | 选型 | 版本 | 理由 |
|---|---|---|---|
| **框架** | Astro | 5.x（最新稳定） | 静态优先，岛屿架构（只在交互处 hydrate），零 JS by default，Cloudflare 原生友好。 |
| **输出模式** | `output: 'static'` | — | 纯静态 HTML，无需 adapter，直接部署 Cloudflare Pages。 |
| **内容** | Content Layer API + `glob()` loader | 内置 | 类型安全，Zod schema 校验，构建时发现字段错误。配合 YAML frontmatter，替代 `export const metadata = {}` 方案。 |
| **MDX** | `@astrojs/mdx` | latest | 支持 MDX 组件 + YAML frontmatter，兼容标准 MDX 内容。 |
| **样式** | Tailwind CSS | 4.x | 原子化 CSS，零运行时，主题色与组件样式解耦。 |
| **主题色** | CSS 变量 `--brand` + `--brand-light` | — | 改主题色只需 4 行（`:root` 2 行 + `.dark` 2 行），其他变量通过 `var()` 自动跟随。 |
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

#### ADR-004：内容管道 = 确定性生成 + PR 门控，LLM 永不进 CI（v2.0）

v2.0 的架构第一性问题是「谁产生 commit」。决策：CI 里只跑**确定性生成器**（如 bulk-new-posts 脚手架），AI 写作留在本地会话（.agent/skills + anvil-ops submit）；远程管道（auto-content.yml）把八道质量门禁**前置**为开 draft PR 的前提——门禁红了就没有 PR。workflow_dispatch 仅 collaborator 可触发（天然鉴权），`secrets` 零引用、幂等（固定分支名）、永不直推 main。背景：2026 年起 GITHUB_TOKEN 创建的 PR 不自动跑 CI（待批准状态），门禁前置反而比「先开 PR 再等 CI」更严格。

**决策**：管道 = 确定性脚本 + 门禁前置 + draft PR + 人工 merge；tests/workflows.test.ts 把安全契约钉进 CI。

#### ADR-005：多站管理是工具层能力，模板保持一仓一站（v2.0）

多站（N 个游戏 wiki）的统一运营不改动模板仓库形态——每个站仍是独立的 git 仓库 + 独立的 Cloudflare Pages 项目（三层分离、merge 上游的能力都不受影响）。统一发生在 `anvilwiki-ops`（1.0.0）：`~/.config/anvil-ops/sites.toml` 注册表只存别名/路径/siteUrl 覆盖，**凭据永不入注册表**（各站 `.env` 各自保管）；默认行为（cwd 自动发现）与 0.x 完全一致，注册表只是跨站批操作（`--all`）的索引层。`submit` 刻意不支持 `--all`（批量发布不一键化）。

**决策**：模板 = 一仓一站不动；多站 = anvil-ops 注册表 + `--site`/`--all`；breaking 变化（MCP 工具加 `site` 参数）由 ops 包 1.0.0 承载。


---

## 第 4 章 整体架构

### 4.1 分层架构

AnvilWiki 采用**分层设计**的架构设计：

```
┌─────────────────────────────────────────────────┐
│  代码层（固定，跨项目复用，fork 后不动）              │
│  ├── Astro 路由结构（src/pages/）                  │
│  ├── Content Collections 内容引擎                  │
│  ├── i18n 系统（as-needed 前缀 + fallback）        │
│  ├── SEO 组件（sitemap、JSON-LD、hreflang、robots）│
│  ├── 首页模块渲染器（4 种 displayType）             │
│  ├── 广告组件（Google AdSense）                     │
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
- 内容和配置的修改不需要触及代码层。
- 换游戏 = 改配置层（~5 个文件） + 替换内容层（content/ 和 locales/）。
- 代码层 fork 后永不改动（除非升级 AnvilWiki 版本）。

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
  ├── @astrojs/sitemap 集成自动扫描所有页面生成 sitemap
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
| 文章页 `/bosses/emberfang` | **静态** | 构建时从 Content Collection 取该文章 + fallback 逻辑。 |
| 法律页 `/about` 等 | **静态** | 硬编码英文正文（不翻译），复用 [locale] layout。 |
| sitemap.xml | **静态 endpoint** | 构建时生成。 |
| robots.txt | **静态 endpoint** | 构建时生成。 |

**全部静态**——这是性能和 Cloudflare 兼容性的根本保证。没有任何按需渲染（on-demand rendering），因此**不需要任何 adapter**。

---

## 第 5 章 目录结构

> 本章树为 v1.16.0 实际结构（早期版本存档见 git history）。日常开发的活地图以 `AGENTS.md` 为准。

```
anvilwiki/
├── astro.config.ts               # ⭐ Astro 配置（output/i18n/sitemap/lastmod+noindex 扫描/site URL）
├── src/content.config.ts         # ⭐ Content Collections schema（Zod，wiki + handbook 双集合）
├── tailwind.config.mjs           # Tailwind 配置（扫描路径 + 主题色映射）
├── tsconfig.json                 # TypeScript 严格模式（tools/ 除外）
├── package.json                  # private: true —— 模板与 fork 永不误发 npm
├── pnpm-workspace.yaml           # allowBuilds（pnpm 11 写法）：esbuild + sharp
├── wrangler.toml                 # ⚠️ Cloudflare Pages env 唯一真相源（存在时 dashboard env 被忽略）
├── .env.example                  # 环境变量模板（广告 key 等）
├── .nvmrc                        # Node 22 LTS（pnpm 11 要求 ≥22.13）
├── README.md                     # ⭐ 项目门面（中英双语）
├── LICENSE / CONTRIBUTING.md / CHANGELOG.md
├── docs/
│   ├── PRD.md                    # ⭐ 本文档
│   ├── handbook/<locale>/<slug>.md  # ⭐ 站内文档中心源码（learn 29 课+3 附录 + dev 9 课，en/zh；fork 保留）
│   ├── deployment.md / apply-template.md / content-format.md
│   ├── game-selection.md / staying-up-to-date.md / development.md / seo.md
│   └── superpowers/              # specs + plans（架构决策存档）
├── public/
│   ├── images/                   # hero.webp + showcase/（截图，fork 时 CLI/工作流清理）
│   ├── favicon.ico / favicon-*.png / apple-touch-icon.png / android-chrome-*.png
│   ├── manifest.json / ads.txt / _headers       # _headers：安全头 + 缓存策略
│   └── robots.txt                # （构建时由 endpoint 生成，此文件可不存在）
├── src/
│   ├── content/
│   │   └── wiki/<locale>/<category>/*.mdx  # ⭐ 内容层（须在 wiki/ 子目录下，避免 legacy 自动集合）
│   ├── pages/                    # ⭐ 代码层：路由（英文无前缀，其他语言 /<locale>/ 前缀）
│   │   ├── index.astro           # 英文首页（inline 渲染，不 redirect —— redirect 会毁 SEO）
│   │   ├── [...slug].astro       # ⭐ 英文统一路由：slug.length=1→列表页，>1→详情页
│   │   ├── [locale]/
│   │   │   ├── index.astro       # 非默认语言首页
│   │   │   ├── [...slug].astro   # ⭐ 统一路由（含英文文章的 fallback 路径物化）
│   │   │   ├── [legal].astro     # 法律页统一路由（一个文件渲染 5 个 legal 页）
│   │   │   ├── faq.astro / recent.astro
│   │   │   └── tags/index.astro + tags/[tag].astro
│   │   ├── tags/index.astro + tags/[tag].astro
│   │   ├── recent.astro / faq.astro / 404.astro
│   │   ├── about / privacy-policy / terms-of-service / copyright / contact .astro
│   │   ├── robots.txt.ts / rss.xml.ts / llms.txt.ts   # 动态 endpoints
│   │   └── landing.astro + landing/comparison.astro + landing/docs/*   # 项目官网路由（fork 清理）
│   │   └── zh/landing.astro + zh/landing/comparison.astro + zh/landing/docs/*  # 中文官网路由（fork 清理）
│   ├── components/               # ⭐ 代码层：纯 Astro 组件（零框架运行时）
│   │   ├── layout/               # BaseLayout / LocaleLayout / LegalPage
│   │   ├── header/               # SiteHeader / SearchButton(Pagefind) / LanguageSwitcher / ThemeToggle
│   │   ├── footer/ sidebar/      # SiteFooter / WikiSidebar
│   │   ├── home/                 # 首页 6 区块 + explore 模块（displayType 分发）
│   │   ├── article/              # ArticlePage / ListPage / CodesTable / TagListPage / Comments 等
│   │   ├── mdx/                  # ⭐ MDX 组件词汇表：CodeBlock/StatBar/Callout/Accordion/Video/AffiliateLink
│   │   ├── seo/ ads/ video/      # JsonLd / AdSenseSlot×3 位 / LazyYouTube 门面
│   │   └── landing/              # 项目官网组件（fork 清理）
│   ├── config/                   # ⭐ 配置层（fork 改这里）
│   │   ├── site.ts navigation.ts authors.ts project.ts
│   │   └── landing.ts            # 项目官网文案 + COMMUNITY_SITES（fork 清理）
│   ├── i18n/                     # ⭐ 代码层 + 配置层
│   │   ├── routing.ts            # ⭐ 语言列表唯一源（locales/defaultLocale/OG_LOCALE_MAP）
│   │   ├── ui.ts                 # UI 文案加载器（deepMerge fallback）
│   │   └── content.ts            # ⭐ 文章加载封装（getEntryWithFallback：详情回退/列表不回退）
│   ├── locales/                  # ⭐ 内容层：UI 文案 JSON（en/ja，deepMerge en 缺 key 回退）
│   ├── styles/globals.css        # ⭐ --brand 4 变量（:root 4 行 + .dark 4 行）
│   ├── assets/                   # 封面图等（走 astro:assets <Image> 管线，WebP+srcset）
│   └── lib/                      # content.ts / content-utils.ts / navigation.ts / seo.ts / url.ts / handbook.ts
├── scripts/                      # 14 个运维脚本（check-* ×5 + refresh-audit + new-locale/new-post + apply-template + template-audit + bulk-new-posts + gen-covers + gen-assets + submit-indexnow）
├── tools/anvil-ops/              # ⭐ 独立 npm 包 anvilwiki-ops（CLI + MCP，自有 workspace）
├── .agent/skills/                # ⭐ AI 内容技能（anvil-find-keywords / anvil-new-article / anvil-batch-articles / anvil-update-codes / anvil-refresh / anvil-adsense-audit）
└── .github/
    ├── workflows/
    │   ├── ci.yml                # 8 道门禁（lint/typecheck/test/check-config/build/check-content/check-links/check-i18n，门禁定义在共享 composite action .github/actions/gates）+ ops-toolkit job（tools/anvil-ops 的 typecheck/test/build）
    │   ├── auto-content.yml      # ⭐ v2.0 内容管道：确定性生成 → 八道门禁 → draft PR（workflow_dispatch）
    │   ├── content-pipeline.yml  # 每周新鲜度巡检 → issue
    │   ├── release-ops.yml       # anvilwiki-ops npm 发布（OIDC Trusted Publishing，零令牌）
    │   └── setup.yml             # fork 一键初始化（workflow_dispatch）
    ├── ISSUE_TEMPLATE/ bug-report.md + feature-request.md
    └── PULL_REQUEST_TEMPLATE.md
```

### 5.1 目录设计要点

1. **内容在 `src/content/wiki/<locale>/`**：Astro 5 Content Layer API 用 `glob({ base: './src/content/wiki' })` 显式指定；直接放 `src/content/<locale>/` 会触发 legacy 自动集合（deprecation 警告），所以必须有 `wiki/` 这一层。
2. **`src/content.config.ts`**：Astro 5 约定位置（根目录无副本）。
3. **配置文件集中在 `src/config/`**：新手套用模板时只关注这一个目录 + `globals.css` + `locales/`。
4. **`scripts/` 提供脚手架与门禁**：降低写 MDX 门槛 + CI 可跑的检查脚本。
5. **`docs/` 完整文档**：每个关注点一个文件，README 只做导航；handbook markdown 是站内文档中心的单一源。

---

## 第 6 章 数据模型

### 6.1 MDX 文章 frontmatter schema

定义在 `src/content.config.ts`（完整字段表与写作规范见 `docs/content-format.md`）：

```typescript
// src/content.config.ts（节选，注释见源文件）
const wiki = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/wiki' }),
  schema: ({ image }) =>
    z.object({
      // 必填
      title: z.string().max(80),                 // SEO title，建议 50-60 字符
      description: z.string().min(40).max(165),  // meta description，155 字符最佳
      category: z.string(),                      // 内容类型 slug，如 'bosses'/'guides'（须在 navigation.ts 定义）
      date: z.coerce.date(),                     // 发布日期
      // 可选
      lastModified: z.coerce.date().optional(),  // 最后修改日期（影响 Article JSON-LD dateModified）
      image: image().optional(),                 // 封面图（相对 MDX 文件路径，走 astro:assets 管线），缺省用 hero.webp
      tags: z.array(z.string()).default([]),     // 标签（相关文章推荐 + 标签聚合页）
      noindex: z.boolean().default(false),       // 是否禁止索引（同时从 sitemap/rss/llms.txt 剔除）
      draft: z.boolean().default(false),         // dev 可见、生产构建排除
      gameVersion: z.string().max(20).optional(),// 版本徽章（快节奏游戏的保鲜/E-E-A-T 信号）
      summary: z.string().max(200).optional(),   // Quick Answer 卡（AI Overviews / 精选摘要候选）
      author: z.string().optional(),             // 作者名（回退 site.defaultAuthor）
      boss: z.object({ /* hp/weakness/resistant/location/recommendedLevel */ }).optional(), // Boss 数据卡
      videos: z.array(z.string()).optional(),    // YouTube ID 列表（点击才加载的懒嵌入 + VideoObject）
      gallery: z.array(z.object({ image: image(), caption: z.string().max(200).optional(), alt: z.string().max(200).optional() })).default([]), // 画廊 + 灯箱
      codes: z.array(z.object({ code: z.string().min(1), reward: z.string().optional(), status: z.enum(['active','expired']).default('active'), expiryDate: z.string().max(40).optional(), source: z.string().optional() })).optional(), // 兑换码表
    }),
});

export const collections = { wiki, handbook };
```

**Content Collections 的优势**：
- YAML frontmatter + Zod schema，**构建时校验**，字段缺失/类型错误立即 fail build。
- 类型安全的 entry（`{ id, data, body }`；Astro 5 Content Layer API 中渲染用独立 `render(entry)` 函数，`entry.render()` 方法已不存在——见 AGENTS.md 踩坑清单）。
- frontmatter 与正文分离，MDX 作者只关心内容，字段规范由 schema 强约束。

### 6.2 文章示例

```mdx
---
title: "Emberfang Boss Guide - Complete Strategy"
description: "Complete strategy guide for defeating Emberfang, including attack patterns, weaknesses, and recommended loadouts."
category: "bosses"
date: 2026-08-11
lastModified: 2026-08-12
image: "/images/emberfang-cover.jpg"
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
  // ...用户套用模板时改这里
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

**首页 JSON 结构**（v0.2 重构后，覆盖 hero / updates / start / popular / explore / closingCta 六大区块；FAQ 保留在 JSON 但由 `/faq` 独立页渲染）：

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
      "badge": "...",
      "title": "Anvil Quest Wiki",
      "description": "...",
      "ctaPrimary": "...",
      "ctaSecondary": "...",
      "videoId": ""
    },
    "updates": { "title": "...", "browse": "..." },
    "start": {
      "badge": "Start Here",
      "title": "Your Anvil Quest Journey",
      "cards": [
        { "number": "1", "title": "...", "description": "...", "icon": "lucide:book-open", "href": "/guides/beginner-guide" }
      ]
    },
    "popular": {
      "badge": "Trending Now",
      "title": "Most Read This Week",
      "quickLinks": [{ "label": "...", "href": "/bosses/emberfang" }]
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
          "displayType": "badge-list",
          "highlights": [{ "label": "WELCOME", "detail": "...", "badge": "Active" }]
        }
      ]
    },
    "faq": {
      "title": "Frequently Asked Questions",
      "description": "...",
      "items": [{ "question": "What is Anvil Quest?", "answer": "..." }]
    },
    "closingCta": { "title": "...", "description": "...", "primary": "...", "secondary": "..." }
  },
  "footer": {
    "playGame": "Play Anvil Quest",
    "officialDiscord": "Official Discord",
    "officialYoutube": "Official YouTube",
    "about": "About",
    "faq": "FAQ",
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

**v0.2 schema 变化**：
- `hero.stats`、`hero.ctaTertiary` 已删除（首屏做减法）。
- `start.cards[]` 新增 `icon`（lucide 图标名）和 `href`（链接）字段，支撑 QuickStart 大卡片。
- `gameInfo` 已删除（v0.2 重构时移除，游戏介绍放 `/about` 页）。
- `explore.modules` 建议固定 4 项（Codes / Bosses / Progression / Tier List）。
- `footer` 新增 `faq` 键。
- `faq` 数据保留在 `home.faq`，但由独立 `/faq` 页渲染（`FaqSection.astro`）。

**6 种 displayType**（首页 explore 模块的渲染类型）：
- `badge-list`：兑换码卡片（label + detail + badge）
- `steps`：步骤指引（label 是数字 1-6）
- `ranked-grid`：分级网格（label 是 S/A/B/C）
- `labeled-cards`：链接列表（label 是短文字，**去 emoji 化**）
- `timeline`：垂直时间轴（label 是版本号/日期，detail 是事件，可选 badge）—— 字段语义详见 `src/components/home/modules/Timeline.astro` JSDoc
- `video-grid`：视频缩略图网格（title + youtubeId + 可选 duration，首页不 embed，点击跳文章页）—— 字段语义详见 `src/components/home/modules/VideoGrid.astro` JSDoc

> **字段真相源**：每种 displayType 的字段语义以对应组件的 JSDoc 为准（单一真相源，避免文档与代码失同步）。`src/locales/en.json` 的 demo 数据是最强学习样本。

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
**交互**：移动端菜单用原生 `<details>`。FAQ 已移至独立 `/faq` 页（见 §7.4）。

**首页结构（从上到下，v0.2 重构后）**：
```
1. SiteHeader（导航栏）
2. Hero（满屏视觉锚点：超大标题 + 1 行描述 + 2 CTA）
   └─ 背景水印（游戏名，纯 CSS）；stats 卡片已移除（避免抢首屏焦点）
3. VideoSection（YouTube 嵌入；仅当 hero.videoId 非空时渲染）
4. QuickStart（4 个大图标卡片：新手指南 / 最新 Codes / Boss 攻略 / Tier List）
   └─ 紧跟 Hero，对标竞品"quick actions"模式
5. RecentUpdates + Trending（两栏：左 2/3 最近更新卡片网格 + 右 1/3 热门链接列表）
6. ExploreModules（4 个核心模块，2×2 网格，整卡可点击）
7. ClosingCta（底部 CTA）
8. SiteFooter（含 FAQ 链接）
```

**v0.2 重构说明**（相比 v0.1）：
- 首页从 8 区块压缩到 5 区块，页面长度从 ~7 屏压到 ~4 屏。
- **删除** GameInfo（stats 与 Hero 信息重复；文案移至 `/about` 页）。
- **删除** 首页 FAQ（移至独立 `/faq` 页，FAQPage JSON-LD 随之迁移）。
- **合并** TrendingNow 独立 section → RecentUpdates 右栏（节省 1 屏）。
- **砍减** Explore 模块 8→4（Codes / Bosses / Progression / Tier List；其余在导航已有入口）。
- **强化** Hero：H1 升至 `text-7xl font-black`，加渐变描边；占满 80vh 建立视觉锚点。
- **新增** QuickStart section：4 个图标卡片，对标成功游戏 wiki 的"快速入口"模式。

**关键决策**：
- 所有文案来自 JSON，组件不含游戏特定字符串。
- 模块级标题含主题名（SEO），子项不强制。
- `home.explore.modules` 数组建议 4 项（核心高频入口），超出可放列表页。

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

**路由**：`/[locale]/[contentType]/[slug]`（如 `/bosses/emberfang`）。
**数据源**：`lib/content.ts` 的 `getEntryWithFallback(contentType, slug, locale)`。
**渲染**：
- H1 = `entry.data.title`（MDX 正文不写 H1）。
- MDX body 通过 `entry.render()` 渲染。
- 面包屑：首页 → 分类 → 本篇。
- 元信息：发布日期、最后修改、阅读时间。
- 相关文章：按 `tags` 匹配，最多 3 篇。
**SEO**：Article + BreadcrumbList JSON-LD。

**关键约束**：
- **单篇文章 fallback 英文**——访问 `/ja/bosses/emberfang` 若无日文版，显示英文版（metadata 也是英文），**不 404**。
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
| `@astrojs/sitemap` 集成 | 自动生成 sitemap（含 i18n hreflang） | `/sitemap-index.xml` |
| `robots.txt.ts` | 动态 robots（含 sitemap 链接） | `/robots.txt` |

### 8.2 各页面 SEO 产出

#### 首页
- **title**：`home.meta.title`（独立配置，如 "Anvil Quest Wiki - Complete Guide"）。
- **JSON-LD**：
  - `Organization`（在 BaseLayout，全站都有）：name/url/logo/image。
  - `WebSite`（首页注入）：name + url + potentialAction（搜索 action，可选）。

> v0.2 变化：`FAQPage` JSON-LD 已从首页移至 `/faq` 独立页（与 FAQ 内容一起迁移）。

#### FAQ 页（`/faq`，v0.2 新增）
- **title**：`home.faq.title`。
- **JSON-LD**：`FAQPage`（从 `home.faq.items` 构造）。
  > ⚠️ **2026-05-07 起 Google 已废弃 FAQ 富媒体结果**（SERP 折叠不再产生）。但 `FAQPage` schema 仍建议保留——AI Overviews 与其他 AI 爬虫会解析它来理解问答结构。详见 [§8.6 Schema 状态](#86-结构化数据-schema-状态2026)。

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
// 原理示意（实际用 @astrojs/sitemap 集成，无需手写此文件）
import { getCollection } from 'astro:content';
import { SITE_URL } from 'astro:env';
import { locales, defaultLocale } from '~/i18n/routing';
import { CONTENT_TYPES } from '~/config/navigation';

export async function GET() {
  // 1. 扫描所有实际存在的 entry
  const entries = await getCollection('wiki');
  
  // 2. 为每个 entry × 每个语言生成 URL（含 hreflang alternate）
  const urls = entries.flatMap(entry => {
    // entry.id 格式：'en/bosses/emberfang' 或 'ja/bosses/emberfang'
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
<link rel="alternate" hreflang="en" href="https://domain.com/bosses/emberfang" />
<link rel="alternate" hreflang="ja" href="https://domain.com/ja/bosses/emberfang" />
<link rel="alternate" hreflang="x-default" href="https://domain.com/bosses/emberfang" />
```

由 `lib/url.ts` 的 `languageAlternates(contentType, slug)` 生成，遍历 `routing.locales`。

### 8.5 og:image 绝对路径（强制）

社交平台抓 OG 图要求**绝对路径**。所有 og:image / twitter:image 必须形如 `https://domain.com/images/hero.webp`。

由 `SITE_URL` 环境变量拼接，**禁止硬编码域名**。

### 8.6 结构化数据 Schema 状态（2026）

> Schema 类型有效性随 Google 政策变化。本节记录 2026 年各 Schema 的 SERP 富媒体结果状态，以及 AnvilWiki 的实施优先级。

| Schema 类型 | 2026 SERP 富媒体状态 | AnvilWiki 是否实施 | 说明 |
|---|---|---|---|
| `Article` | ✅ 有效 | ✅ 文章页 | 强化专业度信号；AI Overviews 会解析 |
| `BreadcrumbList` | ✅ 有效 | ✅ 文章页 | 传达站点层级结构给搜索引擎与 AI |
| `Organization` | ✅ 有效 | ✅ 全站（BaseLayout） | 品牌实体识别、知识面板 |
| `WebSite` + `SearchAction` | ✅ 有效 | ✅ 首页 | 站内搜索框功能 |
| `ItemList` | ✅ 有效 | ✅ 列表页 | 分类下文章的结构化列表 |
| `FAQPage` | ⚠️ 富媒体**已废弃**（2026-05-07） | ✅ `/faq` 保留 | SERP 折叠不再产生，但 AI 爬虫仍解析；保留对 AI Overviews 有价值 |
| `HowTo` | ⚠️ 基本失效 | ❌ 不实施 | 多数场景不再产生富媒体结果 |

**实施优先级**（按 ROI 排序）：
1. `Article` — 每篇攻略/词条页必备
2. `BreadcrumbList` — 站点层级（首页 → 分类 → 词条）
3. `Organization` + `WebSite` — 品牌实体与站内搜索
4. `ItemList` — 列表页结构化
5. `FAQPage` — 保留但 SEO 期望降级（不依赖它获取搜索外观）

**参考来源**：
- [Google Search 文档更新日志](https://developers.google.com/search/updates)
- [FAQ Rich Results 废弃说明（2026-05）](https://www.getpassionfruit.com/blog/what-changed-with-google-drops-faq-rich-results-and-what-to-do-now)

---

## 第 9 章 多语言（i18n）

### 9.1 策略：as-needed 前缀

**英文（默认）无前缀**：`/bosses/emberfang`
**其他语言带前缀**：`/ja/bosses/emberfang`、`/ru/bosses/emberfang`

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
- Astro 的 `prefixDefaultLocale: false` 会自动让 `/bosses/emberfang`（无 `/en`）也能匹配到 `[locale]` 路由（locale 被解析为 `en`）。
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

**核心**：Google AdSense 集成——3 个广告位各一个 AdSense slot，环境变量驱动，key 为空时组件 `return null` 不渲染（保 Lighthouse 4×100 开箱契约）。

- AdSense loader 脚本由 `BaseLayout.astro` 在 `<head>` 注入，仅当 `PUBLIC_ADSENSE_CLIENT` 有值时加载。
- 每个广告位是一个 `<AdSenseSlot position="...">` 组件，根据 position 读取对应的 slot ID 环境变量。
- 尺寸由 AdSense 自动决定（responsive），不需要为每个位置指定固定尺寸。

### 10.2 广告位清单

| 位置 | 组件 | 挂载点 | Slot 环境变量 |
|---|---|---|---|
| Sticky（粘顶横幅） | `StickyBanner.astro` | `LocaleLayout`（全局） | `PUBLIC_ADSENSE_SLOT_STICKY` |
| Sidebar（桌面端侧边栏） | `SidebarAd.astro` | `WikiSidebar`（桌面端） | `PUBLIC_ADSENSE_SLOT_SIDEBAR` |
| InContent（文章内） | `InContentAd.astro` | `ArticlePage`（相关文章前） | `PUBLIC_ADSENSE_SLOT_INCONTENT` |

> 在 AdSense 后台为每个位置创建一个广告单元，拿到 slot ID 填到对应环境变量。AdSense 会根据访客设备自动选择最合适的尺寸。

### 10.2.1 Affiliate 建议位（v2.0，广告位之外的第二变现形态）

`<AffiliateSuggestion>`（`ArticlePage` 文末，SponsorCard 之后）渲染至多 2 张 `AffiliateLink` 卡片。与 AdSense 的关键差异：**config 门控而非 env 门控**——affiliate 是逐站内容数据（Steam 链接/外设推荐），不是部署密钥；数据在 `src/config/affiliates.ts`（CONFIG 层），默认空数组 = 不渲染（保开箱契约与 fork 纯净）。`categories` 可选字段支持按栏目限定；Sponsored 徽标走 `shared.sponsoredLabel`（en/ja）。

### 10.3 AdSenseSlot 组件

底层组件 `AdSenseSlot.astro` 渲染一个 `<ins class="adsbygoogle">` 标签并 push 到 `adsbygoogle` 队列：

```astro
---
// src/components/ads/AdSenseSlot.astro
interface Props {
  position: 'sticky' | 'sidebar' | 'incontent';
  format?: 'auto' | 'fluid';
  responsive?: boolean;
}
const { position, format = 'auto', responsive = true } = Astro.props;
const client = import.meta.env.PUBLIC_ADSENSE_CLIENT;
const slot = import.meta.env[`PUBLIC_ADSENSE_SLOT_${position.toUpperCase()}`];
// client 或 slot 任一为空 → return null（不渲染）
---
{client && slot && (
  <>
    <ins class="adsbygoogle" style="display:block"
      data-ad-client={client} data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'} />
    <script is:inline>
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  </>
)}
```

3 个位置组件（`StickyBanner` / `SidebarAd` / `InContentAd`）都是对 `AdSenseSlot` 的薄封装，负责定位（sticky / fixed / inline）和门控逻辑。

### 10.4 Sticky 粘顶横幅 + 关闭逻辑

`StickyBanner.astro` 在粘顶位置渲染广告，带关闭按钮（localStorage 记忆）：

```astro
---
// src/components/ads/StickyBanner.astro
const client = import.meta.env.PUBLIC_ADSENSE_CLIENT;
const slot = import.meta.env.PUBLIC_ADSENSE_SLOT_STICKY;
const show = !!(client && slot);
---
{show && (
  <div id="sticky-banner" class="sticky top-14 z-30 ...">
    <div class="relative mx-auto max-w-4xl px-4">
      <AdSenseSlot position="sticky" />
      <button id="dismiss-sticky" aria-label="Close ad" ...>
        <Icon name="lucide:x" />
      </button>
    </div>
  </div>
)}
<script is:inline>
  // 关闭按钮 + localStorage 记忆
  (() => {
    const banner = document.getElementById('sticky-banner');
    const btn = document.getElementById('dismiss-sticky');
    if (!banner || !btn) return;
    if (localStorage.getItem('sticky-dismissed') === '1') { banner.remove(); return; }
    btn.addEventListener('click', () => {
      localStorage.setItem('sticky-dismissed', '1');
      banner.remove();
    });
  })();
</script>
```

### 10.5 环境变量驱动

广告配置全部走环境变量，**4 个变量全填才显示广告，任一为空对应位置不渲染**。新手部署时广告位是空的，不报错；接入广告时填 env 即生效。

| 变量 | 说明 |
|---|---|
| `PUBLIC_ADSENSE_CLIENT` | AdSense Publisher ID（`ca-pub-XXXXXXXXXXXXXXXX`），门控 loader 注入 |
| `PUBLIC_ADSENSE_SLOT_STICKY` | Sticky 位置的 slot ID |
| `PUBLIC_ADSENSE_SLOT_SIDEBAR` | Sidebar 位置的 slot ID |
| `PUBLIC_ADSENSE_SLOT_INCONTENT` | InContent 位置的 slot ID |

完整清单见 [附录 A](#附录-a-环境变量清单)。

### 10.6 广告部署流程

1. 在 [Google AdSense](https://adsense.google.com/) 注册并提交你的站点审核。
2. 审核通过后，拿到 Publisher ID（格式 `ca-pub-XXXXXXXXXXXXXXXX`）。
3. 在 AdSense 后台创建 3 个广告单元（建议选 Responsive），分别拿到 3 个 slot ID。
4. 在 Cloudflare Pages 项目 Settings → Environment variables（或 `wrangler.toml` 的 `[vars]`）填入 4 个变量：`PUBLIC_ADSENSE_CLIENT` + 3 个 slot ID。
5. 重新部署，广告自动出现。

> AdSense 审核通常需要数天到数周，期间站点正常运行（广告位为空）。详见 [AdSense 帮助中心](https://support.google.com/adsense/)。

---

## 第 11 章 套用模板指南

### 11.1 概述

**套用模板** = 把通用 AnvilWiki 模板变成特定游戏的站点。只改配置层和内容层，代码层不动。

完整的配置参考见 [`docs/apply-template.md`](./apply-template.md)——按文件组织，你要改什么就查对应章节。也可用 `pnpm apply-template` CLI 自动完成基础配置。第一个站跑通后、复制下一个站前，用 `pnpm template-audit` 检查模板健康度（见学习手册课 26「复制第二个站」）。

### 11.2 改动对象与 AnvilWiki 路径对照

下表列出套用模板时需要改动的对象及其在 AnvilWiki 中的位置（`docs/migration-from-nextjs.md` 提供 Next.js 结构的迁移映射，供从 Next.js 项目迁移过来的用户参考）：

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
| sitemap | `@astrojs/sitemap` 集成（自动生成，无需手写） |
| robots | `src/pages/robots.txt.ts` |
| 法律页 | `src/pages/[locale]/*.astro` |
| 首页路由 | `src/pages/[locale]/index.astro` + `components/home/` |
| 列表/详情路由 | `src/pages/[locale]/[...slug].astro` |
| YouTube video ID | `src/config/site.ts` 或 `locales/en.json` 的 `home.hero.videoId` |

### 11.3 关键约束

| 约束 | 说明 |
|---|---|
| **主题色只改 4 行** | `--brand` + `--brand-light`（`:root` 2 行 + `.dark` 2 行），其他变量通过 `var()` 自动跟随。 |
| **分类 key 三处同步** | `navigation.ts` 的 key = `locales/en.json` 的 `nav.<key>` = `src/content/<locale>/<key>/` 目录名。 |
| **sitemap 禁止硬编码** | 必须扫描实际 MDX，禁止从 `NAVIGATION_CONFIG` 或手写列表生成 URL。 |
| **og:image 绝对路径** | 必须 `${SITE_URL}/images/hero.webp`，相对路径社交平台抓不到。 |
| **hero.webp 不能是空文件** | 模板自带的可能是 0 字节占位，必须下载真实图覆盖。 |
| **删 MDX 不删目录** | `src/content/` 目录必须保留（空目录也行），删了会导致 Content Collection 构建失败。 |
| **article 从 H2 开始** | 不写 H1，ArticlePage 自动用 title 渲染 H1，避免双 H1。 |
| **labeled-cards label 去 emoji 化** | `labeled-cards` 的 `highlights.label` 必须是英文短词，不是 emoji（违反「禁止 emoji」规则）。 |
| **域名不硬编码** | 所有 URL 走 `SITE_URL` 环境变量，禁止在代码里写死 `xxx.wiki`。 |

### 11.4 从其他格式迁移文章

如果你的文章用的是 JS 元数据写法（`export const metadata = { ... }`，常见于 Next.js / MDX 项目），需要手动改成 AnvilWiki 使用的 YAML frontmatter 格式。

迁移方法见 [`docs/content-format.md`](./content-format.md#从其他格式迁移文章)——frontmatter 字段少、格式简单，手动或 AI 辅助转换即可。从 Next.js 项目迁移的完整对照表见 [`docs/migration-from-nextjs.md`](./migration-from-nextjs.md)。

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
**Node 版本**：`NODE_VERSION = 22`（pnpm 11 要求 ≥22.13）。

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

触发：push 到 main + PR 到 main；Node 版本读 `.nvmrc`（22）；8 道门禁：

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout        # 实际钉 commit SHA（供应链加固）
      - uses: pnpm/action-setup
      - uses: actions/setup-node
        with:
          node-version-file: .nvmrc   # 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: ./.github/actions/gates  # ⭐ v2.0：八道门禁抽成共享 composite action，
        with:                          # lint/typecheck/test(9 个测试套件)/check-config/build
          site-url: ...                # /check-content/check-links/check-i18n 一步到位；
```                                    # auto-content.yml 复用同一份定义，防止两处漂移

另有四条工作流：`auto-content.yml`（⭐ v2.0 内容管道：workflow_dispatch 触发确定性生成器 → 八道门禁全绿才开 draft PR，LLM 永不进 CI，详见 docs/content-pipeline.md 与 ADR-004）、`content-pipeline.yml`（每周新鲜度巡检 → issue，仅上游仓库运行）、`release-ops.yml`（anvilwiki-ops 的 npm 发布通道：OIDC Trusted Publishing 零令牌，tag 与 package.json 版本一致性有守卫）与 `setup.yml`（fork 一键初始化，workflow_dispatch；初始化 PR 开出前 workflow 自己会跑一次 build 验证）。

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
    const result = await getEntryWithFallback('bosses', 'emberfang', 'ja');
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

> ✅ **实测完成（2026-08-12）**：demo 站 `anvilwiki.pages.dev` Lighthouse 全 100。

| 指标 | 目标 | 实测 | 测量工具 |
|---|---|---|---|
| Lighthouse Performance | ≥ 95 | **100** ✅ | Lighthouse CI |
| Lighthouse Accessibility | ≥ 90 | **100** ✅ | Lighthouse CI |
| Lighthouse Best Practices | ≥ 90 | **100** ✅ | Lighthouse CI |
| Lighthouse SEO | ≥ 90 | **100** ✅ | Lighthouse CI |
| LCP（Largest Contentful Paint） | < 2.5s | 满分范围内 | Lighthouse |
| CLS（Cumulative Layout Shift） | < 0.1 | 0 | Lighthouse |
| INP（Interaction to Next Paint） | ≤ 200ms | 满分范围内 | Lighthouse |
| 首屏 JS 体积（gzipped） | < 30KB | ~3KB | Astro bundle stats |
| 构建时间（5 篇文章） | < 60s | ~1.5s | 本地 |

**性能目标**：✅ 全部达成并超额完成。

---

## 第 14 章 开发路线图

### 14.1 里程碑

| 里程碑 | 交付物 | 验收标准 | 预计工时 |
|---|---|---|---|
| **MVP-0**：骨架 | Astro 项目初始化 + Content Collection 配置 + 单篇示例 MDX + 首页/列表页/详情页三页跑通 + Cloudflare Pages 部署成功 | 访问 `*.pages.dev` 能看到三页，Lighthouse Performance ≥ 95 | 1-2 天 |
| **MVP-1**：多语言 | as-needed 前缀（`prefixDefaultLocale: false`）+ 文章 fallback + 语言切换器 + UI 文案 deepMerge | 加 `ja` 语言，访问 `/ja/bosses/emberfang`（无 ja 版）回退英文 | 1 天 |
| **MVP-2**：首页模块 | JSON 驱动 + 4 种 displayType（badge-list/steps/ranked-grid/labeled-cards）+ Hero/QuickStart/Explore/CTA/Footer/Video/RecentUpdates+Trending（v0.2 结构） | 换 en.json 数据，首页无组件改动即生效 | 1-2 天 |
| **MVP-3**：SEO | sitemap 动态 + JSON-LD 全套（Organization/WebSite/Article/Breadcrumb/ItemList/FAQPage）+ hreflang + robots | Google Rich Results Test 全通过 | 1 天 |
| **MVP-4**：主题换肤 | CSS 变量双变量（`--brand` + `--brand-light`）+ 暗色模式 + 主题切换器 | 改 globals.css 4 行整站变色 | 0.5 天 |
| **MVP-5**：广告系统 | Google AdSense（3 个广告位：Sticky / Sidebar / InContent）+ Sticky 关闭按钮 + 环境变量驱动 | 移动端 + 桌面端广告正常显示 | 1 天 |
| **MVP-6**：套用模板文档 | 配置参考手册（按文件组织）+ 新手 README + docs/ 全套 | 新手照 README 30 分钟内部署上线 | 1-2 天 |
| **v1.0**：基准实测与发布 | ✅ 已完成 — demo 站 `anvilwiki.pages.dev` 已上线，Lighthouse 全 100（Performance / Accessibility / Best Practices / SEO） | 性能目标全部达成，demo 站可访问 | 1 天 |

**总计**：约 **7-10 天**可交付 v1.0。

### 14.2 v1.0 后的迭代方向

| 版本 | 功能 | 优先级 | 状态 |
|---|---|---|---|
| ~~v1.1~~ | ~~frontmatter 格式迁移指南~~ | ~~高~~ | ✅ 已实现（`docs/content-format.md` 提供从 JS metadata 到 YAML frontmatter 的迁移说明） |
| v1.2 | 搜索功能（Pagefind 离线搜索，零运行时） | 中 | ✅ 已实现（`postbuild` 钩子 + `SearchButton.astro` `<dialog>` 模态，懒加载 pagefind-ui，Ctrl/Cmd+K 唤起，`data-pagefind-body` 精确索引文章正文） |
| v1.3 | 更多 displayType（video-grid/timeline/comparison-table） | 中 | ✅ 已实现 timeline + video-grid（缩略图跳转,首页不 embed YouTube,保 Lighthouse 4×100）;comparison-table 待验证（见下） |
| v1.4 | 评论系统（Giscus，默认关闭，env 驱动） | 低 | ✅ 已实现（`Comments.astro` env 门控 + 官方 `<script data-loading="lazy">` + 双 MutationObserver 暗色同步；详见 `docs/comments.md`） |
| v1.5 | 图片优化（Astro Image，自动 WebP/AVIF + 响应式 srcset） | 中 | ✅ 已实现（content schema `image()` loader + `ArticleCover.astro` + `image.responsiveStyles`，封面图自动 WebP/srcset，`content.config.ts` 迁至 `src/`） |
| ~~v2.0~~（v1.x 期里程碑，原标 v2.0，实际随 v1 线交付） | 套用模板 CLI（`pnpm apply-template` 引导式配置） | 高 | ✅ 已实现（`scripts/apply-template.ts` 步骤 1 自动化：hex→HSL 主题色、site/navigation/routing/ui/locales/manifest 重写，`--dry-run` / `--no-clear-content` flag。注：此行版本号是规划期占位，与下方 **v2.0.0** 正式版无关） |
| v1.5 | 内链 + 时效性 + 表达力（详见 `docs/superpowers/ROADMAP-v1.5-v1.6.md`） | 高 | ✅ 已实现（标签落地页 `/tags` + 可点击 tag / gameVersion 徽章 / `/recent` / Callout / Accordion / draft（dev 可见 build 排除）/ VideoObject JSON-LD / 404 增强（搜索+分类入口）/ SponsorCard env 门控 + FUNDING.yml / README wrangler 警告） |
| v1.6 | 创作者维护工具 + 部署自动化（check-i18n / setup workflow / 内容层 CLI / 死链对账等） | 中 | ✅ 已实现（`pnpm check-i18n` 翻译覆盖率 + `pnpm check-links` dist 内链审计（均入 CI）/ Initialize workflow 一键初始化 / CF Web Analytics 门控 / staying-up-to-date 文档 / apply-template 内容骨架 / README 对比表+showcase 征集） |
| v1.7 | 内容表达力二期 + E-E-A-T（画廊/作者体系/联盟链接/内容 lint） | 中 | ✅ 已实现（`gallery` frontmatter + 原生 dialog lightbox + ImageObject JSON-LD / `authors.ts` 注册表 + Person JSON-LD / `<AffiliateLink>` sponsored nofollow 组件 / `pnpm check-content` 内容 lint；og:image 自动生成与 PWA 留待 v1.8 按用户反馈排期） |
| v1.8 | AI 原生内容生产 + 新鲜度管道（第一性原理路线②③①④） | 高 | ✅ 已实现（`.agent/skills/` 3 技能 + AGENTS.md 对话式产页章节 / `codes` frontmatter + CodesTable 自动分区 + FAQPage JSON-LD / `pnpm refresh-audit` 确定性审计 + content-pipeline.yml 每周定时开 issue（绝不自动改内容）/ docs/game-selection.md 选品漏斗 + 首日 10 页） |
| v1.10 | 官网开发指南板块（landing「怎么用」5 步上手向导） | 低 | ✅ 已实现（`DevGuide.astro` 时间线：fork → apply-template CLI → AI 对话产页 → 免费部署 → 保持新鲜，每步附命令 + 文档链接，底部通向 docs/README.md 四条阅读路径；文案在 `landing.ts` `devGuide`，随 CLI 整目录删除，fork 零残留） |
| v1.11 | 站内文档中心（/landing/docs 双手册：SOP + AI 提示词） | 高 | ✅ 已实现（四专家定档；`handbook` collection 源于 `docs/handbook/{en,zh}/` 9 章（学习 5 + 开发 4），每步 SOP + P01-P11 提示词模板 + 验收三件套；中英 1:1 parity 测试硬门禁；BreadcrumbList/TechArticle JSON-LD + sitemap lastmod + llms.txt 门控段；CLI 删 landing 路由但**保留手册**（fork 站长可直接用提示词 SOP），fork 模拟构建绿） |
| v1.13 | 手册零基础化全量重写（第一性原理体系 + 白话规范） | 高 | ✅ 已实现（第二轮四专家定档:科普写作/第一性原理架构/新手测试员/模板守门；统一七段骨架+四段式步骤（做什么/怎么做/你会看到/确认做对了）+固定类比库+首现术语定义；补「装好 6 样工具」序幕（旧版最大流失点）与域名/广告位/upstream 等断链；13 提示词块守恒、事实限定词逐条 grep 验收存活；中英 18 章同源重写） |
| v1.14 | 手册分册成页 + 章节拆细（8+6 章、列表展示） | 中 | ✅ 已实现（学习/开发手册各自独立成页 /landing/docs/learn|dev（中英四页）+ 手册页编号列表；学习 5→8 章（装工具/上线/收录/接广告各自独立）、开发 4→6 章（定制/集成各一分为二）；hub 改选择页（全景清单+两张手册卡）；互链全部重接、旧 slug 零残留；en 14 章 2 agent 同源重写） |
| v1.15 | 站长运营 CLI + MCP（`anvilwiki-ops`：第一性原理路线②④产能闭环） | 高 | ✅ 已实现（`tools/anvil-ops/` 独立 npm 包双 bin：`anvil-ops` CLI + stdio MCP server；doctor/metrics/audit/insights/submit 五命令 = 五 MCP 工具；GSC 服务账号 + CF Web Analytics GraphQL 双数据源，env 门控空=禁用；insights 5 规则引擎（阈值常量集中）；submit=校验→分支→push→gh 开 PR，永不 push main；56 测试+真 git bare 集成测试；开发手册新增第 7 章「AI 自动化运营」中英；**anvilwiki-ops 0.1.1 已上架 npm，`npx anvilwiki-ops` 实名验证通过**；v1.15.0 已发版） |
| v1.16 | 社区案例库（Showcase：真实用户站点展示） | 低 | ✅ 已实现（首批 3 站点 aniimo.wiki / nomanssky.wiki / steal-anegg.wiki；数据源唯一 `landing.ts` 的 `COMMUNITY_SITES`，展示 3 处：/landing 与 /zh/landing 的 CommunitySites 区块 + README 中英表格；数据与组件均在 CLI `LANDING_PATHS` 内，fork 自动清理；详见 §15.6；v1.16.0 已发版） |
| v1.17 | demo 媒体示范 + 媒体密度指引（拉平「能力 vs 示范」倒挂） | 中 | ✅ 已实现（每类文章完整示范媒体能力：codes 双语封面、boss 机制画廊（`src/assets/gallery/`）、tier-list 正文内联卡片图（`public/images/articles/`）、i18n 视频对齐；`scripts/gen-demo-media.mjs` 生成 7 张示意图可复现；`.prose img:not([class])` 16:9 零 CLS 盒子；媒体密度表进 content-format.md / anvil-new-article skill / AGENTS.md / 学习手册 first-10-pages 章中英；fork 清理：apply-template `clearDemoAssets` + setup.yml 同步按名删 demo 素材（fork 模拟构建绿）；v1.17.0 已发版，v1.17.1 复审补丁（图内事实校正：3 标记/20s puddle/2s 窗口/wind-up 数值对齐正文）） |
| v1.18 | 模板化 + 批量内页（生财航海关卡 7/8：放大能力） | 高 | ✅ 已实现（`pnpm template-audit` 模板健康检查：代码层纯净度（注释剥离后扫 demo 字符串）/配置层换皮/内容层可替换性/换皮残留 4 组 ✅⚠️❌ 评分，❌ 才非零退出；`pnpm bulk-new-posts` 批量脚手架：CSV/TSV 关键词清单（RFC4180 引号解析）→ 全量校验（locale/category/slug 冲突/description 40-165）→ 全部合法才写入 `draft: true` 草稿，已存在文件跳过绝不覆盖，`--dry-run` 预览；`.agent/skills/anvil-batch-articles` 批量内容技能（意图归类→清单→统一提示词→全批验收，含灌水/编造/内链/句式重复 5 条铁律）；学习手册新增第 9 章「把第一个站打磨成模板」+ 第 10 章「批量做内页」中英（learn 8→10 章，提示词 13→16 个——13 为 v1.17.1 加媒体提示词后已漂移未同步的旧值）；README/docs/landing/AGENTS 计数同步；发版前专家审查补 8 项修复：占位 description 长标题超 165 会炸 build→自动降级、demo 文章内容级检测、site.name 换皮检查、`-n` 别名/未闭合引号/目录入参边界、第 9 章三层表格对齐规格、zh 错字；v1.18.0 已发版） |
| v1.19 | SEO 进阶 + 2026 搜索格局对齐 | 中 | ✅ 已实现（学习手册第 11 章 `seo-traffic`「SEO 进阶：从被收录到排上去，再到被 AI 引用」中英——一页一词选词地图、单页做满自检清单、站点信任三慢变量、2026 新规则失效清单（FAQ 富结果移除/llms.txt 对 Google 无效/AI Overviews 引用偏好/封面图成图片搜索入口），配 2 个可复制提示词（关键词选题分析 + 全站 SEO 自检），learn 10→11 章、提示词 16→18 个；`docs/seo.md` 新增「Google 官方规范更新记录（2026）」9 条时间线（含 2026-08-18~21 spam update 与 08-20 preferred sources）；`docs/content-format.md` 媒体密度表补封面图质量三原则（og:image 自 2026-03 起为 Google 选图首选）；新增 `docs/roadmap.md` 公开路线图（八段演化主线 + 近期候选 + v2.0 方向 + 不做清单）；README/docs/landing/AGENTS 计数同步；v1.19.0 已发版） |
| **v2.0.0** | **内容经营操作系统**（PR 门控内容管道 + 多站管理 + og:image 产能 + 变现建议位） | 高 | ✅ 已实现（① `auto-content.yml` 内容管道：workflow_dispatch + 确定性生成器（import-csv → bulk-new-posts）→ **八道门禁前置**（全绿才开 draft PR）→ create-pull-request v8 固定分支幂等，LLM 永不进 CI、secrets 零引用；八道门禁抽成共享 composite action `.github/actions/gates`（ci.yml 同源复用），ADR-004；tests/workflows.test.ts 钉安全契约。② `anvilwiki-ops` 0.1.3→**1.0.0**：多站注册表 `~/.config/anvil-ops/sites.toml`（凭据永不入表）+ `--site`/`--all` + `sites list/add/remove`；AI 引用追踪三通道（CF Web Analytics AI referrals 主通道 + GSC `AI_OVERVIEWS` 探测（实验）+ `metrics --import-aio` CSV 导入）；MCP 五工具加可选 `site` 参数（1.0 唯一 breaking），测试 60→111；ADR-005。③ `pnpm gen-covers` 封面生成：satori+resvg-js+subset-font，**1200×675**（Google Discover ≥1200px 宽门槛）+ 全站 `max-image-preview:large`（BaseLayout）；品牌色运行时读 globals.css 单一真相；CJK 标题按字符子集 Noto Sans CJK（缓存 node_modules/.cache，不进 git）+ 内置 OFL Lato；manifest hash 缓存；封面标准 800×450→1200×675 全文档同步、demo 封面重生成。④ `<AffiliateSuggestion>` 文末建议位：config 层 `src/config/affiliates.ts`（默认空=不渲染）复用 AffiliateLink 卡片、`shared.sponsoredLabel` i18n（en/ja）。文档：docs/content-pipeline.md + docs/multi-site.md 新增并进索引、手册 ai-ops 章双语文本（章数不变 learn 11/dev 7）、ADR-004/005、staying-up-to-date.md MAJOR 措辞修订（里程碑 major、模板侧零迁移）、README/CHANGELOG/AGENTS/landing 同步；模板仓库零 breaking，v2.0.0 发版） |


**v1.3 范围说明**：
- `timeline`：✅ 实现 —— 版本日志/活动时序，零副作用，商业价值正（老玩家点进 patch notes 文章页）。
- `video-grid`：✅ 实现（缩略图 + 跳转，不 embed）—— 保住 Lighthouse 100，流量留站内变现（embed 会让用户看视频时广告曝光归 YouTube）。
- `comparison-table`：⏸ 推迟 —— 广告变现模型下，对比表把信息完整呈现后用户无点击动力（信息已满足），ROI 为负。等真实用户反馈「我首页需要对比表」再做，做时需重新设计「如何驱动用户点进文章页」。

(设计推演过程见 git 历史中该时期的 commit 记录。)

### 14.3 「待验证清单」回填计划

以下 9 项关键技术假设，在 MVP 阶段逐条验证：

| # | 待验证项 | 验证里程碑 | 状态 |
|---|---|---|---|
| 1 | i18n as-needed 路由策略 | MVP-1 | ✅ 已确认（`prefixDefaultLocale: false`） |
| 2 | 文章语言 fallback | MVP-1 | ✅ 已验证（`/ja/bosses/stormcaller` 无日文版时回退英文，构建实测通过） |
| 3 | 从 JS metadata 格式迁移文章 | v0.1 | ✅ 已实现（`docs/content-format.md` 提供 `export const metadata` → YAML frontmatter 迁移指南） |
| 4 | shadcn/ui 在 Astro 下的体验 | — | ❌ 决策不用（采用纯 Astro 原生组件，见 ADR-002） |
| 5 | 多语言 sitemap/hreflang 自动生成 | MVP-3 | ✅ 已验证（`@astrojs/sitemap` 自动生成 26 URL + en/ja hreflang alternate） |
| 6 | 侧边栏动态导航 | MVP-2 | ✅ 已实现（`WikiSidebar` 组件 + `getDynamicNavigation()` 扫描 MDX 生成分组） |
| 7 | 主题色方案落地 | MVP-4 | ✅ 已验证（`--brand` / `--brand-light` 4 行改主题色 + 暗色模式 + 主题切换器） |
| 8 | 性能基准实测 | v1.0 | ✅ 已实测（`anvilwiki.pages.dev` Lighthouse 全 100：Performance / Accessibility / Best Practices / SEO） |
| 9 | 迁移成本核算 | v1.0 | ✅ 已总结（fork → `pnpm apply-template` → 部署，全流程 30 分钟内） |

---

## 第 15 章 开源运营

### 15.1 仓库策略

- **仓库地址**：`github.com/PNGTRID/AnvilWiki`
- **协议**：MIT（最宽松，允许商用）
- **主分支**：`main`（受保护，PR 合并）
- **发版**：Semantic Versioning（v1.0.0 / v1.1.0 / v1.1.1）
- **Release notes**：中英双语

### 15.2 文档策略

| 文档 | 受众 | 位置 |
|---|---|---|
| README.md（中英双语） | 所有用户，新手入门 | 仓库根目录 |
| docs/README.md | 文档中心索引（按角色与时机组织，附阅读路径） | docs/ |
| docs/handbook/（中英 41+41 篇） | 零基础站长（learn 29 课+3 附录）/ 定制者（dev 9 课）；站内 `/landing/docs` 渲染同一内容 | docs/handbook/ |
| docs/game-selection.md | 想建站赚钱的人：选品漏斗 + 首日 10 页 | docs/ |
| docs/sourcing.md | 挖词 9 渠道 + 意图满足度判断（v2.1.0） | docs/ |
| requirements/（2 张填空模板） | 产页前素材准备：事实来源表 + 对标参考表（v2.1.0） | 仓库根 requirements/ |
| docs/apply-template.md | 套用模板用户，配置参考（含初始化清理规范） | docs/ |
| docs/deployment.md | 新手，部署指南（含 wrangler.toml 大坑 + 数据复盘） | docs/ |
| docs/content-format.md | 内容创作者，MDX 格式 | docs/ |
| docs/content-pipeline.md | 想批量铺内容的站长：PR 门控管道（v2.0） | docs/ |
| docs/multi-site.md | 多站运营：anvilwiki-ops 1.0 + AI 引用追踪（v2.0） | docs/ |
| docs/seo.md | 进阶用户，SEO 调优 + 外链实操 | docs/ |
| docs/ads.md | 开始赚钱的站长：广告时机 + 收款 + 平台全景（v2.1.0 起） | docs/ |
| docs/comments.md | 需要 Giscus 评论的站长 | docs/ |
| docs/staying-up-to-date.md | fork 用户：怎么同步上游更新 | docs/ |
| docs/migration-from-nextjs.md | 传统 Next.js 模板用户，迁移指南 | docs/ |
| docs/development.md | 贡献者：架构、模式、验证、发版 | docs/ |
| docs/PRD.md | 贡献者、想深入了解设计的人 | 本文档 |
| docs/roadmap.md | 想判断模板方向的人：演化主线 + 不做清单 | docs/ |
| docs/superpowers/ | ADR 级设计决策存档（specs/）+ 实施计划（plans/）+ v1.5-v1.6 规划存档 | docs/superpowers/ |

### 15.3 Demo 站策略

- **官方 demo**：`anvilwiki.pages.dev`，用虚构游戏 "Anvil Quest" 做一个完整 demo 站。
- **源码**：demo 内容就在本仓库内（`src/content/wiki/`，英文在根、日文带前缀）——fork 后由 `pnpm apply-template` / setup 工作流整体替换。
- **目的**：让用户直观看到 AnvilWiki 长什么样、性能如何。
- **文档中心**：站内 `/landing/docs` 双手册（learn 29 课+3 附录 + dev 9 课，中英），markdown 源在 `docs/handbook/`，fork 保留。

### 15.4 社区运营

| 渠道 | 用途 |
|---|---|
| GitHub Issues | bug 报告、功能建议 |
| GitHub Discussions | 问答、模板套用案例分享、showcase |
| CONTRIBUTING.md | 贡献指南（开发环境、PR 规范、代码风格） |
| CHANGELOG.md | 版本变更记录 |
| （可选）Discord | 实时交流（社区长大后开） |

### 15.5 推广策略

1. **开发者社区**：在游戏 wiki / SEO 站相关的开发者社群分享，定位为「Cloudflare 原生方案」。
2. **技术社区**：Astro 官方 Discord / Reddit r/Astro / V2EX / 掘金 / Twitter，分享「Astro + Cloudflare 做游戏 wiki」教程。
3. **GitHub Topic**：打标签 `astro` / `cloudflare-pages` / `wiki-template` / `game-wiki` / `seo` / `open-source`。
4. **SEO 自证**：AnvilWiki demo 站本身做到 Google 首页（搜 "anvil quest wiki"），证明模板的 SEO 能力。

### 15.6 案例库（Community Showcase）

真实用户站点是最有力的模板证明。首批评审通过 3 个社区站点（2026-08-18）：

| 站点 | 游戏 |
|---|---|
| aniimo.wiki | Aniimo（Roblox） |
| nomanssky.wiki | 无人深空（Steam） |
| steal-anegg.wiki | Steal an Egg（Roblox） |

- **数据源唯一**：`src/config/landing.ts` 的 `COMMUNITY_SITES`（locale 无关数组 + 中英双语简介），用户提 PR 追加即可。
- **展示位 3 处**：官网 `/landing` 与 `/zh/landing` 的「Built with AnvilWiki」区块（`CommunitySites.astro`，位于特性网格 6 卡之后、对比表之前）+ README 中英双语 Showcase 表格。
- **fork 自动清理**：案例数据与组件均在 `src/config/landing.ts` / `src/components/landing/` 内，属 `apply-template` 的 `LANDING_PATHS` 删除清单，fork 用户得到纯净模板（零案例残留）。

---

## 附录 A 环境变量清单

### A.1 站点配置

| 变量名 | 用途 | 示例 | 必填 |
|---|---|---|---|
| `SITE_URL` | 站点绝对 URL（sitemap/og:image/robots 拼接用） | `https://anvilquestwiki.wiki` | ✅ |

### A.2 广告（Google AdSense）

| 变量名 | 用途 |
|---|---|
| `PUBLIC_ADSENSE_CLIENT` | AdSense Publisher ID（`ca-pub-XXXXXXXXXXXXXXXX`），门控 loader 注入 |
| `PUBLIC_ADSENSE_SLOT_STICKY` | Sticky 粘顶横幅 slot ID |
| `PUBLIC_ADSENSE_SLOT_SIDEBAR` | Sidebar 桌面端侧边栏 slot ID |
| `PUBLIC_ADSENSE_SLOT_INCONTENT` | InContent 文章内 slot ID |

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
PUBLIC_ADSENSE_CLIENT=
PUBLIC_ADSENSE_SLOT_STICKY=
PUBLIC_ADSENSE_SLOT_SIDEBAR=
PUBLIC_ADSENSE_SLOT_INCONTENT=

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
□ labeled-cards 的 highlights.label 已去 emoji
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
□ NODE_VERSION = 22 已配
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
□ Google AdSense 账号已注册，网站已审核通过
□ 4 个广告变量已配到 Cloudflare 环境变量（CLIENT + 3 个 slot ID）
□ 移动端 + 桌面端广告正常显示不破版
□ Sticky 粘顶横幅正常，有关闭按钮
□ 桌面端侧边栏广告 fixed 正常
□ 无自动弹窗 / 跳转（有则检查 AdSense 设置）
□ AdSense 后台 impression 数在涨
```

---

## 附录 C 术语表

| 术语 | 含义 |
|---|---|
| **wiki 站** | 围绕某游戏/主题的攻略内容站，靠 SEO 获取流量 |
| **套用模板** | 把通用模板变成特定游戏站点的过程 |
| **MDX** | Markdown + JSX，支持在 Markdown 中使用组件 |
| **Content Collections** | Astro 的内容管理机制，类型安全 + schema 校验 |
| **Content Layer API** | Astro 5 引入的内容层 API，支持 glob/file/API loader |
| **as-needed 前缀** | 多语言 URL 策略：默认语言无前缀，其他语言带前缀 |
| **fallback** | 某语言内容缺失时自动回退到默认语言（英文） |
| **displayType** | 首页模块的渲染类型（badge-list/steps/ranked-grid/labeled-cards） |
| **JSON-LD** | 结构化数据格式，告诉搜索引擎页面内容类型 |
| **hreflang** | 多语言页面 alternate 链接，告诉搜索引擎各语言版本位置 |
| **Sticky 广告** | 粘在屏幕固定位置的广告，曝光时长更长，CPM 更高 |
| **AdSense slot** | Google AdSense 广告单元 ID，一个 slot 对应一个广告位 |
| **分层架构** | 代码层 / 配置层 / 内容层 分离，套用模板只改后两层 |
| **homepage-only 模式** | 只上线首页，无文章内容，后续慢慢补 |
| **dogfooding** | 自己用自己的产品（AnvilWiki 文档站用 AnvilWiki 构建） |

---

## 更新记录

| 日期 | 版本 | 说明 |
|---|---|---|
| 2026-08-11 | v0.1 | PRD 初稿；技术事实已通过 Astro 官方文档核实 |
| 2026-08-12 | v0.2 | MVP 全部实现（MVP-0 至 MVP-5 + P0-P3）；更新待验证清单状态 |
| 2026-08-12 | v0.3 | SEO 章节更新：Schema 状态（§8.6）、FAQ rich results 废弃说明、INP 阈值修正为 ≤ 200ms |
| 2026-08-12 | v1.0 | demo 站 `anvilwiki.pages.dev` 上线；Lighthouse 全 100；v1.2 Pagefind 搜索 + v1.5 Astro Image + v2.0 套用模板 CLI 全部实现；完整日语翻译；SEO 修复（hreflang / og:image / prefetch / breadcrumb / security headers） |
| 2026-08-22 | v2.0.0 | 内容经营操作系统：PR 门控内容管道（auto-content.yml + 共享门禁 composite action）+ anvilwiki-ops 1.0.0 多站与 AI 引用追踪 + gen-covers 封面生成（og:image 标准 1200×675 + max-image-preview:large）+ AffiliateSuggestion 建议位；模板零 breaking（升级=常规 merge）。v1.1–v1.19 逐版本明细见 CHANGELOG.md 与 §14.2 迭代表 |
| 2026-08-24 | v2.0.1 | v2.0.0 发版当日五视角审计的同日加固版：category 改 schema enum 硬门禁（软 404 根除）、check-i18n `--strict-ui` 让第八道门禁真正能红、setup.yml 开 PR 前构建验证、auto-content 只提交内容变更 + 零产出响亮失败、ops 测试进主 CI、sitemap hreflang 按真实 MDX 覆盖生成、anvilwiki-ops 1.0.1（MCP 站点解析防吞错、GSC 错误带修复指引、worker 线程卸载、测试 111→125）、demo 内容规则补课；详见 CHANGELOG [2.0.1] |
| 2026-08-26 | v2.1.0 | SEO 实战文档批（零代码变更，fork 常规 merge 即得）：新增 `docs/sourcing.md` 挖词与选词指南（9 渠道 + 第 7 条判断「意图满足度」+ 选词决策管理表，补选品漏斗的「渠道」层）、`docs/ads.md` 广告时机与 Adsterra 收款两条路线（USDT/OKX 与 Payoneer wire transfer）、`requirements/` 建站前内容准备两模板（事实来源表 + 对标参考表，闭环「AI 不编造游戏数据」）；`docs/seo.md` 增外链策略章、`docs/deployment.md` 增上线数据复盘指标（CTR≥2%/日点击 1000/人均 1.5 页/每周 10+ 只加不改）+ Clarity 热力图接入、`docs/game-selection.md` 明确首版 10-15 篇核心页分批上线（批量生成 40-60 篇可以、部署分批）；学习手册第 7 章中英同步补「先说时机：别一上线就开广告」；详见 CHANGELOG [2.1.0] |
| 2026-08-26 | v2.1.1 | 手册同步与初始化规范批：学习手册 7 章双语接 v2.1.0 文档层（ch1 挖词 9 渠道+意图满足度、ch4 requirements 准备表+首版 10-15 篇分批、ch6 上线 3-7 天复盘指引、ch8 四条及格线指标表+Clarity 热力图小节、ch10 翻正节奏、ch11 外链策略节、ch7 统计三件套 GA4/CF Web Analytics/Clarity 完整接入教程含同意横幅门控说明）；`docs/apply-template.md` 新增「初始化清理规范」章节（两通道删除清单首次文档化）；setup.yml 中文官网删除路径收窄对齐 LANDING_PATHS、apply-template.ts wrangler `[vars]` 重置与 setup.yml 逐行对齐（两处通道漂移修复）；en/weekly-ops tldr 超 480 字符 schema 上限修复；详见 CHANGELOG [2.1.1] |
| 2026-08-26 | v2.2.0 | 变现+外链实操文档批（零代码变更）：`docs/ads.md` 新增 AdSense 收款完整教程（W-8BEN 10% 协定税率/PIN 明信片 4 次寄送 4 个月期限/电汇绑卡/每月 21 日出账节奏）、Adsterra 接入教程（五广告格式取舍表 + Google 政策「挂 AdSense 禁 popunder」共存红线 + 脚本粘贴位置 BaseLayout/ArticlePage）、广告平台全景三档表（2026-08 实时门槛：Journey 1k sessions/Mediavine $5k 年收入/Raptive 25k PV）+ 游戏垂直网络层（NitroPay/Venatus/Playwire/PubNation，全景表 11 平台全挂官网直链）+ 游戏 wiki 五档分阶段路线表；`docs/seo.md` 外链章扩到操作层（九渠道优先级清单 + 逐渠道步骤 + 三份 outreach 邮件模板 + 免费工具箱 + 做多少节奏节；HARO 2025 复活/Reddit 10% 全站规则调研校准）；学习手册第 7 章双语新增「收款三件事」节、tldr 两步走改三步走；详见 CHANGELOG [2.2.0] |
| 2026-08-26 | v2.3.0 | 新手动线优化批（专家团三线审计驱动）：README 按零基础标准重构（pnpm 前置/「push 回 fork」步骤/零终端 Actions→Initialize AnvilWiki 通道/wrangler 警告下沉部署步骤/文档导航收敛 4 入口/英文区对齐中文区/语言切换锚+截图+Contributing·Changelog 入口/删误导性 Deploy 按钮）；落地页转化（hero 与 FinalCta 主 CTA 直达 Fork URL、docsEntry SEO 卡+devGuide 五步链接改站内手册章、写死章数 6 处移除、公告压缩）；HandbookHub 新增 beginnerHint 零基础胶囊（接口+双语数据+组件）；两章「下一步」补链接；文档漂移清理（Comments 断链/PRD §15.2 文档表 7→20 项/roadmap 版本头/ROADMAP-v1.5-v1.6.md 归档 superpowers/）；详见 CHANGELOG [2.3.0] |
| 2026-08-27 | v2.3.1 | 紧急修复批：`tailwind.config.mjs` 根除 ESM 内 CommonJS `require()` 地雷——插件行改纯 ESM 导入（`import typography from '@tailwindcss/typography'`），根因是 Tailwind 配置加载器「先原生 require 后 jiti 回退」策略在部分 Node 构建（require(esm) 路径）把配置内 ReferenceError 以异步 unhandledRejection 上报、catch 接不住，fork 用户下载 ZIP 后 `pnpm dev` 首次访问即崩（截图报障实证）；修复经双加载路径最小复现 + build/typecheck/lint/test 全绿验证；详见 CHANGELOG [2.3.1] |
| 2026-08-29 | v2.4.0 | 三站踩坑复盘加固批：依据 Aniimo/No Man's Sky/Steal An Egg 三站生产事故复盘（48 类问题）对照模板全量审计，落地 16 项缺口——trailingSlash 全站翻转为 `always`（⚠️ fork 行为变更，内链需跟随、check-content 拦截）、空分类/空语言列表页 noindex+移出 sitemap+hreflang 按真实覆盖、文章级 `faq` frontmatter 字段（可见区块+单 FAQPage JSON-LD）、pageTitle 三分支智能后缀、相关文章三层兜底（selectRelatedEntries 纯函数）、`pnpm submit-indexnow` 与 `pnpm gen-assets` 两新脚本、check-content 规则 5/6（语言前缀 error/≥3 内链 warning）、文档批（唯一部署源警告/上线顺序铁律/Crawler Hints/Adsterra iframe sandbox 隔离/关键词密度 1-3%/手册第 6 章 IndexNow+GSC 四状态灯）、twitter 大卡/footer 孤儿页入口/免责声明分行/.gitignore 密钥模式；StickyBanner 复核后保留；详见 CHANGELOG [2.4.0] |
| 2026-08-31 | v2.4.1 | CLI 真实模式 E2E 加固批：合并首个外部代码贡献 PR #10（apply-template removeLandingPage 先 `rmSync` 后 `readdirSync` 同路径，真实模式 ENOENT 必崩，v1.12 起存活）；全仓同类排查再清两处——home 模板 schema 漂移（`home.meta` 仅 watermark 缺 title/description → HomePage 传 undefined 进 BaseLayout `title.includes` 崩、hero/closingCta CTA 写对象而组件渲字符串 → fork 用户 CLI 初始化后首次 build 必炸；模板全量对齐 demo en.json 形态 + HomePage meta 逐字段兜底 + authors 清理虚报 ✅ 修为确实移除才打印）；新增 `apply-template --answers` 非交互模式 + `pnpm test:e2e`（git archive → 临时目录真实模式跑 CLI → 断言输出形态 → 对产物完整 build）+ CI `e2e-template` job + workflows 契约钉防删；详见 CHANGELOG [2.4.1] |
| 2026-08-31 | v2.5.0 | 生态技能吸收批：向两个开源技能项目致谢并吸收方法论——① 新增 `/anvil-adsense-audit` 技能（AdSense 申请前 22 项逐项体检：四态判定 + Blocker 分级 + 完整性门；模板已解决项预填证据，审计聚焦 fork 用户侧；框架 inspired by yantoumu/adsense-site-auditor-skill，清单自 Google 公开文档重写）；② sourcing.md 第四节「判决框架」（双轨打分 + KD 分档动作表 + 早期爆发轨 + 「平台内流量≠独立需求 / 未测≠零」两判据 + 3/7/14/28 天复查；参考 yan-labs/yan-skills 的 game-opportunity，MIT）+ game-selection.md 第 3 层互链；③ seo.md 外链章「怎么验证外链真的生效」（三态台账 + rel 核对 + 743 条清单实测 5.5% 现实校准）；④ 手册双语证据落盘小节（enable-ads 接新技能、weekly-ops 复盘纪律）；⑤ 致谢三处（README 中英 + 落地页 footer en/zh + docs/README）；详见 CHANGELOG [2.5.0] |
| 2026-08-31 | v2.5.1 | AdSense 审计实证批：按 `/anvil-adsense-audit` 技能对 demo 站跑 22 项全项体检，裁决 Not ready（demo）——Blocker×2（pages.dev 免费域/篇数 5<15）+ High×2（codes 页 8 天 P0/`items` 空分类）全部在内容经营侧，模板机制层零 Fail（隐私政策 AdSense 披露/ads.txt 占位/零广告门禁/sitemap/死链门禁全过，线上 playwright 抽查 200）；据此实证修正技能 AD-17 判定基准（法律五页为 `LegalContent.astro` 代码层内置正文含广告 cookie 披露，非空壳路由，默认 Pass）；docs/ads.md 新节「申请 AdSense 前的体检」六组速查表 + demo 审计基线实例；详见 CHANGELOG [2.5.1] |
| 2026-08-31 | v2.6.0 | Demo 内容整备批：依据 seo.web.cafe AdSense 预检报告核查整改——9 篇 en 文章全部扩写到 800-1284 词（原 170-665 全不达标），新增 4 篇成型页（forging-materials-guide、emberforged-armor-set 补齐空 items 分类、frostbound-monarch 冰元素镜像 Boss、forging-guide 锻造系统数学），sitemap 101→120 URL；页脚补 Contact 信任页入口（footer.contact UI 键 en/ja）；ads.txt 内置就绪授权行（过审删 # 填 ID）；「Updated daily by the community」不实文案改诚实口径（en/ja ×2）；预检 3 项误判核查标注（身份漂移=fork 自动移除层、ads.txt=设计使然、CMP=env 门控误测）；详见 CHANGELOG [2.6.0] |
| 2026-08-31 | v2.6.1 | Fork 路径加固批：完整 fork 模拟（apply-template 真实模式→产物体检）抓出五个开箱陷阱全修——联系页零渠道（official 恒渲染+可选 contactEmail）、CLI 模板虚假承诺（community/daily 文案）、空 nav 致 fork 首次 check-config 七项红（改自动填充 nav/overview）、demo ja.json 残留身份泄漏（未选语言 locale 直接删，「无害孤儿」结论推翻）、wrangler [vars] 正则锚点错位（双段+JS 正则 \Z 字面量坑）；DEMO_COVERS 补 4 张+setup.yml 同步；E2E 加 check-config 步骤+五断言钉死（修复后 fork check-config 0 项红、template-audit 11/11）；详见 CHANGELOG [2.6.1] |
| 2026-08-31 | v2.6.2 | CLI 输入层修复（用户报障 issue #12）+ demo ja codes 保鲜（自动审计 issue #11）：`readline/promises` 的 `rl.question()` 每次提问挂一次性监听器、不缓存未提问期间到达的行——真 TTY 逐键输入永不触发，但一切缓冲型 stdin（管道/AI 终端/多行粘贴/CI）必丢行，表现为「按回车没反应」；新增 `scripts/lib/prompt.ts` 的 `LinePrompt` 常驻 FIFO 队列（任何时序零丢行，EOF 视为裸回车=默认值，Proceed 门 EOF 仍安全中止），三个交互 CLI 全部迁移并收敛单实例；`tests/prompt.test.ts` 7 条（5 行为+2 静态契约钉死禁止回退 `rl.question`）；ja codes 页补齐 en v2.6.0 扩写结构并同步 lastModified，refresh-audit 回到 0 items；CHANGELOG [Unreleased] 指针停在 v2.4.0 的连续 6 版漂移一并修正；详见 CHANGELOG [2.6.2] |
| 2026-09-01 | v2.6.3 | apply-template 重跑安全四连修（当日只读风险审计 P1-P4 同日落地，五类：运行错误/数据丢失/权限绕过/资源泄漏/跨端兼容）：① 重跑删 locale 分两类——demo 自带（`DEMO_LOCALES=['en','ja']`）自动删，用户自建（上一轮 CLI 或 `pnpm new-locale` 加的）响亮警告保留，翻译工作不再被静默销毁（原逻辑无确认门直接 `unlinkSync`；不加新 prompt 故 --answers 18 项位置序不变）；② `clearDemoAssets` 废除对 `src/assets/gallery/`、`public/images/articles/` 的整目录 rm -rf（后者正是 content-format.md 让用户放内文图的目录），三份 demo 图清单全按名删，setup.yml 同步 rm -f，新静态契约测试钉两通道清单零漂移；③ locale 重写 `ownable` 过滤未选分类 nav 残留键+覆盖序反转为上一轮用户已译标签优先（重跑不再重置翻译；overview 整体替换有意保留——留旧值会泄漏 demo 游戏文案）；④ wrangler `[vars]` 正则 CRLF 兼容+插入块跟随文件行尾；配套纯函数下沉 `scripts/lib/apply-rewrites.ts`（vitest 直测，第 11 测试套件 `tests/apply-template.test.ts`，114 tests）、E2E 加重跑断言（ja 删/ko 保留/二次运行幂等）；八门禁全绿+E2E codes/guides 双预设绿；详见 CHANGELOG [2.6.3] |
| 2026-09-02 | v2.7.1 | apply-template 重跑安全加固+文档漂移修复（全部 Fixed，无新特性）：① demo locale 删改内容判定——`isDemoLocaleContent` 纯函数下沉 lib，en/ja 仅在 `site.name` 仍是 demo 站名时自动删，上一轮已重写成用户游戏的文件（翻译成果）警告保留，损坏 JSON 一律保留，E2E 加 rebranded ja 存活断言，`docs/apply-template.md` 两类表述更新为三类；② `rewriteSiteTs` 八字段（gameName/shortName/domain/platform/developer/genre/releaseDate/officialUrl）补单引号+反斜杠转义，撇号游戏名不再写出语法错误的 site.ts，site.ts/navigation/routing/ui 四处替换改函数回调杜绝 `$&` 展开，wrangler `[vars]` domain 补 TOML 转义；③ 文档漂移审计两处——`docs/ads.md` demo 审计基线同步 v2.6.0 后状态（9 篇仍<15/items 已补齐不再是缺口/codes 页时效性表述/ads.txt 就绪行）+ `anvil-adsense-audit` 技能 ads.txt 行对齐就绪注释行；test 114→123；详见 CHANGELOG [2.7.1] |
| 2026-09-02 | v2.8.0 | 手册教学法重构第一批（阶段 0+1 找词线 8 课×中英）：六原则教学法拆分（一课一事/例子先于概念/新词≤3/产出即验收/错误前置/主线地图，spec 2026-09-02-handbook-teaching-redesign）；意图满足度兑现为课 06 完整案例+五步检查表；frontmatter 新增可选 stage 字段（列表阶段分组）；旧第 1 章拆除、学习手册 order 重排最终架构、全部标题去「第 N 章」硬编码编号（由 order 渲染）；章号互链改课名引用；Chapter→Lesson/第→课标签；README 计数漂移源清除；八门禁全绿（test 123）；详见 CHANGELOG [2.8.0] |
| 2026-09-02 | v2.9.0 | 手册重构第二批（阶段 2「把站立起来」4 课×中英）：旧第 3 章一拆二（课 10 跑站/课 11 换皮完整问答表）；课 09 重写补 2FA+恢复码；课 12 主题与门面自开发手册调入学习手册（选修）；学习手册连续 1-20、开发手册重编号 1-6；landing.ts 8 处引用与标签同步；门禁全绿（test 123）；详见 CHANGELOG [2.9.0] |
| 2026-09-02 | v2.10.0 | 手册重构第三批（阶段 3「内容生产」5 课×中英）：旧 AI 产页章一拆五（第一篇/兑换码页含视频双红线/排行榜配图含三合法素材通道/验收流水线/首版排期）；7 件不要做拆入各课经典错误；first-10-pages slug 移除、landing 4 处同步；学习手册连续 1-24；门禁全绿（test 123）；详见 CHANGELOG [2.10.0] |
| 2026-09-02 | v2.11.0 | 手册重构第四批（阶段 4+5，学习手册 29 课收官）：新增计数器课/第一周读数/收款三件事/GA4/复制站/选词做满/信任外链七课；enable-ads 与 weekly-ops 按拆分重写；templatize→clone-your-site、seo-traffic 一拆二；学习手册连续 1-29；门禁全绿（test 123）；详见 CHANGELOG [2.11.0] |
| 2026-09-02 | v2.12.0 | 手册重构收官：开发手册 7 章→9 课（新增改完怎么自证，ai-ops 三拆运营/管道/多站，sync-and-contribute 一拆二，ci-and-security 并入自证课）；学习手册附录三件（红线总表/排查树/术语命令速查）；README 计数收口；门禁全绿；详见 CHANGELOG [2.12.0] |
| 2026-09-02 | v2.13.0 | 手册阅读体验优化：左侧目录短标题（shortTitle 纯函数+4 单测）；三栏布局下探 lg(1024px)，右侧本页目录粘性+滚动跟随在窄窗口可用；第 13 课标题微调；详见 CHANGELOG [2.13.0] |
| 2026-09-02 | v2.7.0 | 视频源工作流批（生态技能第三次吸收）：`anvil-new-article` 新增 Step 0——素材为 YouTube 视频时抓字幕（用户粘贴 / `yt-dlp` / `youtube-transcript-api` 三通道，按依赖从少到多）→ 结构化提取（核心话题→分类判型 / kebab-case slug / title / description / summary 直答 / 5-8 组 `faq:` 问答对 / 问题式 H2 大纲 / tags 复用现有词汇表）→ MDX 草稿。两条红线：视频作者口播数值/兑换码一律视为未验证素材、成品必须 `draft: true` 人工核实后转正；他人视频字幕只做事实参考、正文必须完全重写（演绎内容的 DMCA/重复内容风险），嵌入原视频为合规做法，缩略图仅作 `gen-covers` 视觉参考。致谢 kennyzir/7deer_skills（MIT）youtube-content-gen——管线形状与提取字段设计参考，按本模板内容层契约重写（非代码生成），致谢五处同步（技能文内 + README 中英 Credits + docs/README + landing footer en/zh）；顺手修 PRD 架构树技能列表 v2.5.0 漏更的 anvil-adsense-audit（4→5）；详见 CHANGELOG [2.7.0] |
> **✅ v1.0 已交付**：demo 站 [anvilwiki.pages.dev](https://anvilwiki.pages.dev/) 已上线，Lighthouse 全 100。后续按 [§14.2 迭代方向](#142-v10-后的迭代方向) 推进 v1.3+ 功能。
