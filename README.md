# AnvilWiki ⚒️

> 带 AI 内容工作流的游戏 wiki 模板——广告收入 100% 归你。
> 开源、Cloudflare Pages 原生优化、零成本免费部署上线。
> fork 后 5 条命令 + 一次点选部署上线;唯一必要开销是一个域名——不会编程也走得完(双手册带路)。
>
> The game wiki template with an AI-native content workflow — 100% of your ad revenue.
> Open source, natively optimized for Cloudflare Pages, free to deploy.
> Five commands and one dashboard click from fork to live; the only required spend is a domain — no coding needed.

**[📖 中文文档](#-中文文档) · [English Documentation](#-english-documentation)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![Release](https://img.shields.io/github/v/release/PNGTRID/AnvilWiki?label=Release&color=brightgreen)](https://github.com/PNGTRID/AnvilWiki/releases)
[![CI](https://github.com/PNGTRID/AnvilWiki/actions/workflows/ci.yml/badge.svg)](https://github.com/PNGTRID/AnvilWiki/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Demo-anvilwiki.pages.dev-brightgreen)](https://anvilwiki.pages.dev/)
[![Docs](https://img.shields.io/badge/Docs-/landing/docs-8b5cf6)](https://anvilwiki.pages.dev/landing/docs)
[![Works with](https://img.shields.io/badge/Works_with-Claude_Code_%7C_Codex_%7C_Cursor_%7C_ZCode-blueviolet)](.agent/skills/)

[![Demo site homepage](public/images/showcase/demo-home.webp)](https://anvilwiki.pages.dev/)

<p align="center">
  <a href="https://anvilwiki.pages.dev/bosses/emberfang/"><img src="public/images/showcase/demo-article.webp" width="32%" alt="Boss stat card"></a>
  <a href="https://anvilwiki.pages.dev/codes/all-codes/"><img src="public/images/showcase/demo-codes.webp" width="32%" alt="Codes page — tap to copy"></a>
  <a href="https://anvilwiki.pages.dev/guides/weapon-tier-list/"><img src="public/images/showcase/demo-tier-list.webp" width="32%" alt="Weapon tier list"></a>
</p>

> Boss 数据卡 · 兑换码一键复制 · 武器强度榜——wiki 级呈现的其中三页,点图直达对应页面。Boss stat cards, tap-to-copy codes, tier lists — three of the wiki-grade page types; click through to the live pages.

> Lighthouse 4×100 — 实测于 [anvilwiki.pages.dev](https://anvilwiki.pages.dev/)（2026-09-03）
> 
> [![Performance 100](https://img.shields.io/badge/Performance-100-058627?style=flat-square&logo=lighthouse&logoColor=white)](https://anvilwiki.pages.dev/)
> [![Accessibility 100](https://img.shields.io/badge/Accessibility-100-058627?style=flat-square&logo=lighthouse&logoColor=white)](https://anvilwiki.pages.dev/)
> [![Best Practices 100](https://img.shields.io/badge/Best_Practices-100-058627?style=flat-square&logo=lighthouse&logoColor=white)](https://anvilwiki.pages.dev/)
> [![SEO 100](https://img.shields.io/badge/SEO-100-058627?style=flat-square&logo=lighthouse&logoColor=white)](https://anvilwiki.pages.dev/)

---

## 🚀 快速链接

| 你想… | 去这里 |
|---|---|
| **零基础从零做一个赚钱的游戏站** | 📚 [学习手册](https://anvilwiki.pages.dev/zh/landing/docs/learn)——每步写明「做什么/怎么做/你会看到什么」,含可复制的 AI 提示词 |
| 看「从零到赚钱」的全部工作量 | 🗺️ [文档中心首页](https://anvilwiki.pages.dev/zh/landing/docs)——10 件事全景清单,逐项点入 |
| 深度定制 / 给模板写代码 | 🔧 [开发手册](https://anvilwiki.pages.dev/zh/landing/docs/dev) |
| 看看做出来长什么样 | 🎮 [在线 Demo](https://anvilwiki.pages.dev/)——虚构游戏「Anvil Quest」的完整 wiki |
| 对比 Fandom / Wiki.js / 其他方案 | ⚖️ [完整对比页](https://anvilwiki.pages.dev/zh/landing/comparison)——三种物种、自托管引擎数据表、什么时候不该选 AnvilWiki |

## 📖 中文文档

### 5 分钟快速开始

**跑完这一节你会得到**:一个跑在 Cloudflare 免费版上、属于你自己的 wiki 站(先以 demo 内容上线,换成你的游戏、清掉 demo,随时可以做)。

**开始前需要**:[Node.js 22+](https://nodejs.org) 和 pnpm(没装 pnpm?终端跑 `npm install -g pnpm`;或跟着[学习手册「装好 6 样工具」一课](https://anvilwiki.pages.dev/zh/landing/docs/install-tools)把 6 样工具一次装齐)。

```bash
# 1. Fork 本仓库(仓库右上角 Fork 按钮),然后克隆你的 fork(换成你的 GitHub 用户名)
git clone https://github.com/<你的用户名>/AnvilWiki.git
cd AnvilWiki

# 2. 安装依赖并本地预览
pnpm install
pnpm dev            # 打开 http://localhost:4321,能看到 demo 站 = 环境通了

# 3. 一条问答式命令,把 demo 站换成你的游戏(游戏名/主题色/域名/语言…)
pnpm apply-template

# 4. 把改动推回你的 fork
git add .
git commit -m "Apply my game"
git push           # 第 5 步 Cloudflare 连的是 GitHub 远端仓库,不推上去它连到的还是 demo

# 5. 部署:cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → 选你的 fork
#    构建命令 pnpm build、输出目录 dist 会自动识别;环境变量加 NODE_VERSION=22
```

> 💡 **SITE_URL 不用去 dashboard 配**:第 3 步已经把它写进 `wrangler.toml` 的 `[vars]`——只要这个文件存在,它就是 Cloudflare Pages 环境变量的**唯一真相源**,dashboard 里配的同名变量会被忽略。以后换域名,改 `[vars]` 里的 `SITE_URL`(必须含 `https://`)即可;也可以删掉该文件改用 dashboard 配置。完整说明 + 踩坑诊断见 [docs/deployment.md](docs/deployment.md)。

**不想碰终端?有一条零命令路径**:fork 后打开你仓库的 **Actions** 页签 → 左侧选 **Initialize AnvilWiki** → **Run workflow**(填你的域名)→ 合并它开好的 PR → 直接做上面的第 5 步。游戏名、主题色等之后随时可以让 AI 助手帮你改。

**完全新手?别从这里开始**——先去[学习手册](https://anvilwiki.pages.dev/zh/landing/docs/learn):「选品找词」一个阶段帮你把游戏选对,「装好 6 样工具」把终端、Node、Git、AI 助手怎么装、每步会看到什么全部写清,然后「把站跑起来」才动手建站。手册源码在 [`docs/handbook/`](docs/handbook/),fork 后依然保留(但站内文档中心页面会自动移除,属正常)。

### 这是什么？

AnvilWiki 是一个**游戏 SEO 内容站模板**——用来快速搭建围绕某款游戏(Roblox、Steam 新游等)的攻略内容站,通过 SEO 获取流量,通过广告变现。**广告收入 100% 归你**:无平台抽成、无收入分成(对比 Fandom 等托管 wiki 的平台分成模式)。

技术栈是 **Astro + Cloudflare Pages**:纯静态输出、零适配器、免费无限带宽、全球 CDN、零 JS 优先(首屏极快)。

**适合谁**:想靠游戏内容做副业、会用浏览器但**不会编程**的人(学习手册就是按这个标准写的),以及想被 AI 工作流加速的内容创作者。

### 核心特性

- 📚 **零基础双手册**:学习手册(6 阶段 29 课+3 附录)+ 开发手册(9 课),中英双语,从选游戏到赚到钱,每步 SOP + 可复制 AI 提示词([站内阅读](https://anvilwiki.pages.dev/zh/landing/docs))
- 🤖 **AI 对话即产页**:内容技能随仓库分发(`.agent/skills/`),对 ZCode / Claude Code / Codex 说「根据这些笔记写篇攻略」,产出自动通过构建质检;批量产页走 **PR 门控管道**——AI 写、八道质量门禁验、你审完才合并([docs/content-pipeline.md](docs/content-pipeline.md))
- 🧭 **一套工具管 N 个站**:`anvilwiki-ops`(npx 免安装 + MCP)让 AI 替你拉 GSC/Cloudflare 数据、给优化清单,并追踪 ChatGPT/Perplexity 等 **AI 引用来路**([docs/multi-site.md](docs/multi-site.md))
- 🧰 **产能三件套**:`pnpm template-audit` 检查「这个站还能不能干净复制成下一个」、`pnpm bulk-new-posts` 从关键词清单批量铺内页草稿、`pnpm gen-covers` 自动生成 1200×675 封面(中日文标题自动配字体)
- 💰 **变现三件套**:AdSense 广告位 ×3 + 联盟链接组件 + 文末建议位,全部默认关闭、env/config 驱动,收入 100% 归你([docs/ads.md](docs/ads.md))
- 🔍 **SEO 工程化**:sitemap(含 lastmod)/ JSON-LD 全套 / hreflang / Quick Answer 摘要块 / llms.txt(AI 搜索),全部自动生成
- ⚡ **Lighthouse 4×100 开箱即得**:Astro 零 JS 优先,开了广告也不掉分
- 🆓 **零成本**:Cloudflare Pages 免费无限带宽 + 全球 CDN + SSL,永远没有服务器账单
- 🌍 **多语言开箱即用**:英文无前缀(SEO 最优),缺失内容自动回退英文,直链永不 404
- 🎮 **wiki 级呈现**:Boss 数据卡、兑换码一键复制、TOC 滚动高亮、画廊灯箱、Giscus 评论(默认关)

### 用 AI 直接生成内容(无需脚本)

fork 后用 ZCode / Claude Code / Codex / Cursor 打开仓库,直接对话即可产页。Agent 会自动加载仓库里的内容规范,生成后自动跑 `pnpm check-content && pnpm build` 自检。内置 6 个技能:

| 技能 | 用途 |
|---|---|
| `anvil-find-keywords` | 挖词选品:9 渠道自动挖候选 → SERP 快验+意图满足度 → 判决打分,落盘决策管理表(含复查日) |
| `anvil-new-article` | 任意素材(口述/视频字幕/原始数据)→ 合规 MDX 文章,支持 YouTube 视频转攻略 |
| `anvil-batch-articles` | 关键词清单 → 批量生成一批内页(意图归类 → `bulk-new-posts` 脚手架 → 统一提示词填充) |
| `anvil-update-codes` | 新兑换码/过期码 → 更新 codes 页并同步多语言 |
| `anvil-refresh` | 新鲜度巡检 → 输出「该更新什么」优先级清单 |
| `anvil-adsense-audit` | AdSense 申请前逐项体检(22 项政策清单,模板已解决的项自动给证据) |

完整的提示词库(选品分析、产页、批量产页、翻译、SEO 体检、关键词选题等模板)在[学习手册](https://anvilwiki.pages.dev/zh/landing/docs/learn)里,整段复制就能用。

### 文档在哪里?

| 入口 | 内容 |
|---|---|
| 📚 [站内文档中心](https://anvilwiki.pages.dev/zh/landing/docs) | **首选**:双手册 + 「从零到赚钱 10 件事」全景清单,中英双语 |
| 🗂️ [docs/README.md](docs/README.md) | 仓库内全部参考文档索引(选品/挖词/部署/SEO/广告/内容管道/多站运营…),按角色与时机分类,附四条阅读路径 |
| 📋 [requirements/](requirements/) | 建站前素材准备模板:事实来源表 + 对标参考表 |
| 🏗️ [docs/PRD.md](docs/PRD.md) | 架构唯一真相源:想知道「为什么这么设计」看这里 |

### 为什么不用 Fandom / 自建 Next.js?

| | AnvilWiki | Fandom 类平台 | 自建 Next.js |
| --- | --- | --- | --- |
| 广告收入 | **100% 归你**(自带 AdSense 位) | 平台抽成 | 归你,但要自己接 |
| 每月成本 | **¥0**(Cloudflare Pages 免费无限带宽) | 免费(代价是失去控制权) | Vercel 免费额度有限 |
| Lighthouse | **4×100 开箱即得** | 平台决定 | 自己调优数周 |
| AI 产页 | **技能随仓库分发,对话即产页** | 无 | 自己搭 |
| 上手门槛 | **零基础引导式双手册** | 低但受制于人 | 高 |

更完整的选型对比——含 Wiki.js、BookStack、MediaWiki、DokuWiki、Docmost 五个自托管引擎的数据表,以及「什么时候不该选 AnvilWiki」:见[完整对比页](https://anvilwiki.pages.dev/zh/landing/comparison)。

### 常见问题

- **要花多少钱?** 托管 ¥0;唯一必要开销是域名(一年几十块,AdSense 审核需要)。
- **不会编程能做吗?** 能。学习手册按「完全零基础」标准写,每步都有「你会看到什么」;所有代码活交给 AI 助手。
- **多久有收入?** 黄金窗口是游戏爆发后 2-8 周,头 1-2 周收入为零是正常的——手册「第一周读数」「每周 30 分钟」两课讲怎么经营预期。
- **模板更新了,我的站会被覆盖吗?** 不会。三层分离设计,合并上游时你的游戏配置和文章永远保留(见 [docs/staying-up-to-date.md](docs/staying-up-to-date.md))。

### 用 AnvilWiki 建了站?欢迎提交 Showcase

真实案例是这个模板最有力的证明(按提交顺序排列):

| 站点 | 游戏 | 简介 |
| --- | --- | --- |
| [Aniimo Wiki](https://aniimo.wiki/) | Aniimo(Roblox) | 攻略、强度榜与最新兑换码 |
| [No Man's Sky Wiki](https://nomanssky.wiki/) | 无人深空(Steam) | 机制资料与版本更新攻略 |
| [Steal an Egg Wiki](https://steal-anegg.wiki/) | Steal an Egg(Roblox) | 宠物、蛋、兑换码与玩法攻略 |
| [Jujutsu Shenanigans Player Guide](https://jjs-player-guide.pages.dev/) | Jujutsu Shenanigans(Roblox) | 中英日三语玩家 wiki：角色路线、Black Flash、地图、兑换码与版本更新 |
| [Mortal Shell II Wiki](https://mortalshell2.space/) | Mortal Shell II | Shell、武器、Boss、地点、物品与 Open Beta 攻略 |
| [Sephiria Builds](https://sephiriabuilds.xyz/) | Sephiria | 动作肉鸽 Sephiria 的 build 数据库——带版本戳的武器强度榜与证据分级的 build 攻略 |

提 PR 在 `src/config/landing.ts` 的 `COMMUNITY_SITES` 追加一条即可——官网([/landing](https://anvilwiki.pages.dev/landing) 与 [/zh/landing](https://anvilwiki.pages.dev/zh/landing))的「Built with AnvilWiki」区块会自动展示。

### 交流群 / 技术栈 / 许可

微信扫码添加主理人好友,拉你进群交流讨论(部署问题、功能建议、游戏内容站经验都欢迎;[项目官网](https://anvilwiki.pages.dev/zh/landing)右下角也有同款悬浮扫码按钮):

<p align="center">
  <img src="public/images/wechat-qr.jpg" width="200" alt="微信二维码——扫码添加好友进群交流" />
</p>

技术栈:Astro 5(静态输出)+ Tailwind CSS 3 + MDX 4 + astro-icon/lucide + Content Layer API(Zod)+ Pagefind 搜索 + pnpm 11 / Node 22。

许可:**MIT**,见 [LICENSE](LICENSE)。

致谢:选品判决框架([docs/sourcing.md](docs/sourcing.md) 第四节)参考了 [yan-labs/yan-skills](https://github.com/yan-labs/yan-skills)(MIT)的 game-opportunity 技能;AdSense 申请前审计技能(`/anvil-adsense-audit`)的审计框架受 [yantoumu/adsense-site-auditor-skill](https://github.com/yantoumu/adsense-site-auditor-skill) 启发(清单为模板特化重写,未复制其文本);视频转攻略工作流(`anvil-new-article` Step 0)的管线设计参考 [kennyzir/7deer_skills](https://github.com/kennyzir/7deer_skills/tree/main/youtube-content-gen)(MIT)的 youtube-content-gen 技能。感谢三个项目把方法论开源出来。

---

## 📖 English Documentation

| I want to… | Go here |
|---|---|
| **Build a money-making game site from zero** | 📚 [Learning Manual](https://anvilwiki.pages.dev/landing/docs/learn) — every step a SOP with copy-paste AI prompts |
| See the whole journey first | 🗺️ [Docs hub](https://anvilwiki.pages.dev/landing/docs) — a 10-job whole-picture checklist |
| Customize deeply / contribute code | 🔧 [Development Manual](https://anvilwiki.pages.dev/landing/docs/dev) |
| See what it looks like | 🎮 [Live demo](https://anvilwiki.pages.dev/) — a complete wiki for the fictional game "Anvil Quest" |
| Compare Fandom / Wiki.js / alternatives | ⚖️ [Full comparison](https://anvilwiki.pages.dev/landing/comparison) |

### Quick Start (5 min)

**What you'll have when this section is done**: your own wiki live on Cloudflare's free tier (it ships with demo content first — rebranding and demo removal come whenever you're ready).

**Prerequisites**: [Node.js 22+](https://nodejs.org) and pnpm (no pnpm? run `npm install -g pnpm` — or let [the "Install the 6 Tools" lesson](https://anvilwiki.pages.dev/landing/docs/install-tools) walk you through all six tools).

```bash
# 1. Fork this repo (Fork button, top right), then clone YOUR fork (replace the username)
git clone https://github.com/<your-username>/AnvilWiki.git
cd AnvilWiki

# 2. Install & preview locally
pnpm install
pnpm dev            # open http://localhost:4321 — seeing the demo site means your env works

# 3. One guided Q&A command swaps the demo for your game (name/theme/domain/locales…)
pnpm apply-template

# 4. Push the changes back to your fork
git add .
git commit -m "Apply my game"
git push           # step 5 connects Cloudflare to the REMOTE repo — skip this and it deploys the demo

# 5. Deploy: cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → pick your fork
#    Build `pnpm build` and output `dist` are auto-detected; add env NODE_VERSION=22
```

> 💡 **No need to set SITE_URL in the dashboard**: step 3 already wrote it into `[vars]` in `wrangler.toml` — while that file exists it is the **sole source of truth** for Cloudflare Pages env, and same-named dashboard variables are ignored. To change domains later, edit `SITE_URL` in `[vars]` (must include `https://`), or delete the file and use the dashboard instead. Full explanation + troubleshooting: [docs/deployment.md](docs/deployment.md).

**Prefer zero terminal?** There's a no-command path: open your fork's **Actions** tab → **Initialize AnvilWiki** → **Run workflow** (enter your domain) → merge the PR it opens → jump straight to step 5 above. Game name, theme color and more can be changed later with your AI assistant.

**Complete beginner?** Don't start here — start with the [Learning Manual](https://anvilwiki.pages.dev/landing/docs/learn): the Pick & Validate stage picks your game, "Install the 6 Tools" walks you through every install with "what you'll see" on each step, and "Run Your Site" is where the site gets built. The handbook source lives in [`docs/handbook/`](docs/handbook/) and stays in your fork (the in-site docs center pages are auto-removed for forks — that's expected).

### What is this?

AnvilWiki is an **open-source game wiki site template**: build a content site around a game (Roblox, Steam new releases…), pull traffic via SEO, monetize with ads — **100% of the ad revenue is yours**. Built on Astro + Cloudflare Pages: pure static, zero adapters, free unlimited bandwidth, Lighthouse 4×100 out of the box.

### Key Features

- 📚 **Two beginner manuals**: Learning (6 stages, 29 lessons + 3 appendices) + Development (9 lessons), bilingual, zero to revenue, every step a SOP with copy-paste AI prompts ([read online](https://anvilwiki.pages.dev/landing/docs))
- 🤖 **Talk to generate pages**: agent skills ship inside the repo (`.agent/skills/`) — say "write a boss guide from these notes" and get a build-check-passing page; batches go through a **PR-gated pipeline** — AI writes, 8 quality gates verify, you review and merge ([docs/content-pipeline.md](docs/content-pipeline.md))
- 🧭 **Run N sites from one toolkit**: `anvilwiki-ops` (npx + MCP) lets your AI pull GSC/Cloudflare data, rank SEO actions, and track **AI referrals** from ChatGPT/Perplexity ([docs/multi-site.md](docs/multi-site.md))
- 🧰 **Production trio**: `pnpm template-audit` scores how cleanly this site can be copied into the next game's, `pnpm bulk-new-posts` scaffolds a batch of inner pages from a keyword list, `pnpm gen-covers` auto-generates 1200×675 covers (CJK titles auto-fonted)
- 💰 **Monetization trio**: 3 AdSense slots + affiliate link component + end-of-article suggestion cards — all off by default, env/config-gated, 100% revenue yours ([docs/ads.md](docs/ads.md))
- 🔍 **SEO engineering**: sitemap (lastmod) / JSON-LD suite / hreflang / Quick Answer blocks / llms.txt — all automatic
- ⚡ **Lighthouse 4×100 out of the box**: zero-JS-first Astro, stays green with ads on
- 🆓 **Free forever**: Cloudflare Pages, unlimited bandwidth, global CDN, SSL
- 🌍 **i18n built in**: English at root (SEO-optimal), English fallback, URLs never 404
- 🎮 **Wiki-grade presentation**: boss stat cards, tap-to-copy codes, TOC scroll-spy, gallery lightbox, Giscus comments (off by default)

### Generate content by talking to your AI (no scripts needed)

After forking, open the repo in ZCode / Claude Code / Codex / Cursor and just talk. Agents auto-load the content spec shipped in the repo and self-check with `pnpm check-content && pnpm build` after generating. Six skills are built in:

| Skill | What it does |
|---|---|
| `anvil-find-keywords` | Keyword & game sourcing: mine candidates across 9 channels → SERP + intent checks → scoring framework, outputs a decision pipeline table with review dates |
| `anvil-new-article` | Any source material (notes / YouTube transcripts / raw data) → spec-compliant MDX article, incl. a video-to-guide workflow |
| `anvil-batch-articles` | A keyword list → a batch of inner pages (intent classification → `bulk-new-posts` scaffolding → one unified prompt fills them) |
| `anvil-update-codes` | New / expired codes → update the codes page across locales |
| `anvil-refresh` | Freshness audit → prioritized "what to update" list |
| `anvil-adsense-audit` | AdSense pre-application audit (22-item policy checklist, template-solved items come with evidence) |

The full prompt library (game selection, page generation, batch production, translation, SEO audits, keyword research) lives in the [Learning Manual](https://anvilwiki.pages.dev/landing/docs/learn); copy-paste ready.

### Where are the docs?

| Entry | Contents |
|---|---|
| 📚 [In-site docs center](https://anvilwiki.pages.dev/landing/docs) | **Start here**: both manuals + the 10-job whole-picture checklist, bilingual |
| 🗂️ [docs/README.md](docs/README.md) | Index of every reference doc in the repo (game selection / keywords / deployment / SEO / ads / content pipeline / multi-site…), organized by role and timing |
| 📋 [requirements/](requirements/) | Pre-build prep templates: source-of-truth table + benchmark table |
| 🏗️ [docs/PRD.md](docs/PRD.md) | The single source of truth for architecture decisions |

### Why not Fandom / a hand-rolled Next.js site?

| | AnvilWiki | Fandom-style platforms | DIY Next.js |
| --- | --- | --- | --- |
| Ad revenue | **100% yours** (AdSense slots built in) | Platform takes a cut | Yours, but you wire it up |
| Monthly cost | **$0** (Cloudflare Pages free unlimited bandwidth) | Free (at the cost of control) | Vercel free tier is limited |
| Lighthouse | **4×100 out of the box** | Platform decides | Weeks of tuning |
| AI page generation | **Skills ship with the repo — talk to generate** | None | Build it yourself |
| Entry barrier | **Guided zero-to-hero manuals** | Low but constrained | High |

For the full decision guide — a data table of self-hosted wiki engines (Wiki.js, BookStack, MediaWiki, DokuWiki, Docmost) plus an honest "when NOT to pick AnvilWiki" section — see the [complete comparison](https://anvilwiki.pages.dev/landing/comparison).

### FAQ

- **What does it cost?** Hosting $0; the only required spend is a domain (a few dollars a year — AdSense approval needs one).
- **Can I do this without coding?** Yes. The Learning Manual is written for complete beginners with "what you'll see" on every step; all coding goes to your AI assistant.
- **How fast will revenue come?** The golden window is 2–8 weeks after a game breaks out; zero income in the first 1–2 weeks is normal — the "First-Week Numbers" and "Thirty Minutes Weekly" lessons cover managing expectations.
- **Will upstream updates overwrite my site?** No. The three-layer separation keeps your game config and articles intact when merging upstream (see [docs/staying-up-to-date.md](docs/staying-up-to-date.md)).

### Community Showcase

Real sites built with AnvilWiki (in submission order):

| Site | Game | About |
| --- | --- | --- |
| [Aniimo Wiki](https://aniimo.wiki/) | Aniimo (Roblox) | Guides, tier lists, and fresh codes |
| [No Man's Sky Wiki](https://nomanssky.wiki/) | No Man's Sky (Steam) | Mechanics references and update guides |
| [Steal an Egg Wiki](https://steal-anegg.wiki/) | Steal an Egg (Roblox) | Pets, eggs, codes, and strategies |
| [Jujutsu Shenanigans Player Guide](https://jjs-player-guide.pages.dev/) | Jujutsu Shenanigans (Roblox) | Trilingual player wiki: character routes, Black Flash, maps, codes, and patch notes |
| [Mortal Shell II Wiki](https://mortalshell2.space/) | Mortal Shell II | Guides for Shells, weapons, bosses, locations, items, and the Open Beta |
| [Sephiria Builds](https://sephiriabuilds.xyz/) | Sephiria | Build database for the action roguelite Sephiria: patch-stamped weapon tier lists and evidence-graded build guides |

Built a site? Open a PR appending an entry to `COMMUNITY_SITES` in `src/config/landing.ts` — it will show up in the "Built with AnvilWiki" section on the [landing page](https://anvilwiki.pages.dev/landing).

### Community & License

MIT License — see [LICENSE](LICENSE).

Credits: the opportunity-scoring framework in [docs/sourcing.md](docs/sourcing.md) (section 4) draws on the game-opportunity skill from [yan-labs/yan-skills](https://github.com/yan-labs/yan-skills) (MIT); the AdSense pre-application audit skill (`/anvil-adsense-audit`) is inspired by the audit framework of [yantoumu/adsense-site-auditor-skill](https://github.com/yantoumu/adsense-site-auditor-skill) (our checklist is a template-specific rewrite, not a copy); the video-to-guide workflow (`anvil-new-article` Step 0) draws on the pipeline of [kennyzir/7deer_skills](https://github.com/kennyzir/7deer_skills/tree/main/youtube-content-gen) (MIT, youtube-content-gen). Thanks to all three projects for open-sourcing their methodology.

Questions, ideas, or want to chat about game content sites? Scan the WeChat QR code to join the discussion group (the [project landing page](https://anvilwiki.pages.dev/landing) has the same floating QR button in the bottom-right corner):

<p align="center">
  <img src="public/images/wechat-qr.jpg" width="200" alt="WeChat QR code — scan to join the discussion group" />
</p>

Tech stack: Astro 5 (static output) + Tailwind CSS 3 + MDX 4 + astro-icon/lucide + Content Layer API (Zod) + Pagefind search + pnpm 11 / Node 22.

---

## Contributing & Changelog

- 想给模板贡献代码?先读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [docs/development.md](docs/development.md)。To contribute, start with [CONTRIBUTING.md](CONTRIBUTING.md).
- 每个版本改了什么:[CHANGELOG.md](CHANGELOG.md) · [GitHub Releases](https://github.com/PNGTRID/AnvilWiki/releases)。Every release is documented in [CHANGELOG.md](CHANGELOG.md).

## Design Notes

- **三层分离(代码/配置/内容)是核心架构决策**——fork 之后还能持续合并上游更新的根基。**Three-layer separation (code / config / content) is the core architectural decision** — it's what keeps forks mergeable upstream. See [docs/PRD.md](docs/PRD.md).
- 可选功能(广告/评论/统计)默认关闭、env 门控——新 fork 零 JS、零 cookie,保住 Lighthouse 4×100 契约。**Optional features are env-gated and off by default** — a fresh fork ships zero-JS and zero-cookie.
- demo 游戏「Anvil Quest」是刻意虚构的,fork 后整体替换;项目官网与文档中心页面会自动从 fork 中移除(手册源码保留在 `docs/handbook/`)。**The demo game is fictional by design**; the project landing + docs pages are auto-removed for forks (handbook sources stay in `docs/handbook/`).
