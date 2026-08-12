# AnvilWiki ⚒️

> 一个开源的、为 Cloudflare Pages 原生优化的游戏 wiki 站点模板。
> 让新手零成本免费部署上线，性能好，适配 wiki 游戏站。
>
> An open-source game wiki site template, natively optimized for Cloudflare Pages.
> Free to deploy, beginner-friendly, fast, and built for game wikis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

---

## 📖 中文文档

### 这是什么？

AnvilWiki 是一个**游戏 wiki 站点模板**——用来快速搭建围绕某款游戏（Roblox、Steam 新游等）的攻略内容站，通过 SEO 获取流量，通过广告变现。

技术栈是 **Astro + Cloudflare Pages**：纯静态输出、零适配器、免费无限带宽、全球 CDN、零 JS 优先（首屏极快）。

### 核心特性

- ⚡ **极快**：Astro 零 JS 优先，Lighthouse Performance 通常 95+
- 🌐 **Cloudflare 原生**：纯静态输出，零适配器，免费无限带宽
- 🎨 **JSON 驱动首页**：模块化布局，换游戏只改 JSON 不改组件
- 🌍 **多语言开箱即用**：英文无前缀（SEO 最优），其他语言带前缀，缺失内容自动 fallback 英文
- 🔍 **SEO 工程化**：sitemap / JSON-LD / hreflang / robots 全部代码自动生成
- 🎯 **广告就绪**：内置 Adsterra iframe 隔离方案，填 key 即生效
- 🔄 **换皮工程化**：4 阶段 7 Part 提示词流程，改配置不改框架
- 🆓 **完全免费**：MIT 协议，Cloudflare Pages 免费部署
- 📝 **类型安全**：Content Collections + Zod schema，构建时发现字段错误

### 5 分钟快速开始

```bash
# 1. Fork 本仓库到你的 GitHub

# 2. 本地克隆 & 安装
git clone https://github.com/PNGTRID/AnvilWiki.git
cd anvilwiki
pnpm install

# 3. 启动开发服务器
pnpm dev
# 访问 http://localhost:4321

# 4. 改配置层（site.ts / navigation.ts / globals.css）+ 替换内容层（src/content/ / locales/）

# 5. 部署到 Cloudflare Pages
#    cloudflare.com → Pages → Create a project → Connect to Git → 选仓库
#    自动识别 Astro，构建命令 pnpm build，输出目录 dist
```

详细部署指南见 [`docs/deployment.md`](docs/deployment.md)。

### 文档导航

| 文档                                                           | 内容                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| [docs/PRD.md](docs/PRD.md)                                     | ⭐ **完整产品设计文档**（架构、数据模型、模块设计、路线图） |
| [docs/deployment.md](docs/deployment.md)                       | Cloudflare Pages 部署详细指南                               |
| [docs/skinning.md](docs/skinning.md)                           | 换皮工作流（4 阶段 7 Part 提示词）                          |
| [docs/content-format.md](docs/content-format.md)               | MDX 文章格式规范                                            |
| [docs/seo.md](docs/seo.md)                                     | SEO 工程化说明                                              |
| [docs/ads.md](docs/ads.md)                                     | Adsterra 广告接入指南                                       |
| [docs/migration-from-nextjs.md](docs/migration-from-nextjs.md) | 从 Next.js 模板迁移指南                                     |

### 技术栈

| 技术                                                                           | 用途                |
| ------------------------------------------------------------------------------ | ------------------- |
| [Astro 5](https://astro.build)                                                 | 静态优先框架        |
| [Content Collections](https://docs.astro.build/en/guides/content-collections/) | 类型安全的内容管理  |
| [Tailwind CSS 4](https://tailwindcss.com)                                      | 原子化样式          |
| [Cloudflare Pages](https://pages.cloudflare.com)                               | 免费部署 + 无限带宽 |
| [pnpm](https://pnpm.io)                                                        | 包管理              |

---

## 📖 English Documentation

### What is this?

AnvilWiki is an **open-source game wiki site template** designed for building content sites around specific games (Roblox, Steam new releases, etc.), driving traffic via SEO, and monetizing with ads.

Built on **Astro + Cloudflare Pages**: pure static output, zero adapters, free unlimited bandwidth, global CDN, and zero-JS by default for blazing-fast first paint.

### Key Features

- ⚡ **Blazing fast**: Astro zero-JS by default, Lighthouse Performance typically 95+
- 🌐 **Cloudflare native**: Pure static output, zero adapters, free unlimited bandwidth
- 🎨 **JSON-driven homepage**: 8 modules, swap games by editing JSON only
- 🌍 **i18n out of the box**: Default locale (English) has no prefix (SEO optimal), others prefixed, missing content falls back to English
- 🔍 **SEO engineering**: sitemap / JSON-LD / hreflang / robots all auto-generated
- 🎯 **Ads ready**: Built-in Adsterra iframe isolation, just plug in keys
- 🔄 **Skinning workflow**: 4-phase 7-part prompt process, change config not framework
- 🆓 **Completely free**: MIT license, free Cloudflare Pages deployment
- 📝 **Type-safe**: Content Collections + Zod schema, catch field errors at build time

### Quick Start (5 min)

```bash
# 1. Fork this repo to your GitHub

# 2. Clone & install locally
git clone https://github.com/PNGTRID/AnvilWiki.git
cd anvilwiki
pnpm install

# 3. Start dev server
pnpm dev
# Visit http://localhost:4321

# 4. Edit config layer (site.ts / navigation.ts / globals.css) + replace content layer (src/content/ / locales/)
#    Or run the interactive skinning CLI to automate Part 1-3:
pnpm skin

# 5. Deploy to Cloudflare Pages
#    cloudflare.com → Pages → Create a project → Connect to Git → select repo
#    Auto-detects Astro, build command pnpm build, output dir dist
```

See [`docs/deployment.md`](docs/deployment.md) for detailed guide.

### License

[MIT](LICENSE) — free for commercial use.

---

> **Status**: ✅ MVP complete — 27 pages build clean, typecheck passes (0 errors), Cloudflare-ready
>
> **Demo**: Not deployed yet — run locally with `pnpm dev` after clone.
> Deploy your own to Cloudflare Pages in 5 minutes (see [docs/deployment.md](docs/deployment.md)).
>
> 状态：✅ MVP 完成 — 27 页全部构建通过，typecheck 0 错误，可部署到 Cloudflare
