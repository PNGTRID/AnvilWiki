# AnvilWiki 文档中心

> 全部文档按**角色**和**使用时机**组织。从下面找到你的路径,按顺序读即可。

**先看这个:[站内文档中心](https://anvilwiki.pages.dev/zh/landing/docs)** —— 两本**相互独立**的引导式手册:[学习手册](https://anvilwiki.pages.dev/zh/landing/docs/learn)(零基础向,从选游戏到赚到钱、再到模板化复制、批量铺内页和 SEO 进阶,每步 SOP + 可复制提示词;6 阶段 29 课+3 附录)+ [开发手册](https://anvilwiki.pages.dev/zh/landing/docs/dev)(定制/集成/同步/AI 运营,按需查询),中英双语;本页的仓库文档是配套的查阅式参考。手册 markdown 源码在 [`handbook/`](handbook/) 目录(fork 后保留)。

## 快速索引

| 文档 | 一句话 | 读者 |
|---|---|---|
| [handbook/](handbook/) | 📚 站内手册源码:学习手册(6 阶段 29 课+3 附录)+ 开发手册(9 课),中英双语 | 🎯 新手从[学习手册](https://anvilwiki.pages.dev/zh/landing/docs/learn)开始 |
| [game-selection.md](game-selection.md) | 做哪个游戏?上线第一天写什么? | 🎯 想建站赚钱的人(从这里开始) |
| [sourcing.md](sourcing.md) | 去哪挖词:9 个渠道 + 第 7 条判断(意图满足度)+ 选词决策管理表 | 🎯 候选池不够大、想系统挖词的人 |
| [requirements/](../requirements/) | 建站前内容准备两张表:事实来源表 + 对标参考表(模板) | 🎯 选好游戏、准备让 AI 产页的人 |
| [README](../README.md) | 项目是什么 + 5 分钟跑起来 | 所有人 |
| [apply-template.md](apply-template.md) | 把 demo 站换成你的游戏(配置层手册) | fork 用户 |
| [deployment.md](deployment.md) | 部署到 Cloudflare Pages(含 wrangler.toml 大坑 + 数据复盘 + Clarity) | fork 用户 |
| [ads.md](ads.md) | 广告时机 + AdSense 收款 + Adsterra 接入与收款 + 平台全景三档 + 游戏垂直网络 | 开始赚钱的站长 |
| [content-format.md](content-format.md) | 怎么写文章(frontmatter 字段表 + 组件用法) | 内容作者 |
| [seo.md](seo.md) | SEO 工程化 + 外链实操(九渠道逐步教程) + 2026 Google 官方更新记录 | 内容作者 / 好奇的人 |
| [comments.md](comments.md) | 接入 Giscus 评论 | 需要评论的站长 |
| [content-pipeline.md](content-pipeline.md) | PR 门控内容管道:关键词清单 → 草稿 PR(AI 写 → 人审 → merge,v2.0) | 想批量铺内容的站长 |
| [multi-site.md](multi-site.md) | 多站运营:anvilwiki-ops 1.0 一套工具管 N 个站 + AI 引用追踪(v2.0) | 从第二个站开始的站长 |
| [staying-up-to-date.md](staying-up-to-date.md) | fork 之后怎么同步上游更新 | fork 用户(长期) |
| [migration-from-nextjs.md](migration-from-nextjs.md) | 从 Next.js 模板迁移 | 迁移用户 |
| [development.md](development.md) | 给模板本身写代码:架构、模式、验证、发版 | 贡献者 / 模板开发者 |
| [PRD.md](PRD.md) | 完整产品设计文档(架构、数据模型、路线图) | 深入理解每个设计决策 |
| [roadmap.md](roadmap.md) | 演化主线 + 接下来的方向(含不做清单) | 想判断模板方向的人 |
| [superpowers/specs/](superpowers/specs/) | 重大特性设计决策记录(ADR 级:v2.0 内容 OS、anvil-ops CLI+MCP) | 想追溯设计决策的人 |
| [superpowers/plans/](superpowers/plans/) | anvil-ops P1-P3 实施计划(执行细节存档) | 想复刻同类工具的人 |
| [superpowers/ROADMAP-v1.5-v1.6.md](superpowers/ROADMAP-v1.5-v1.6.md) | v1.5-v1.6 的规划存档(专家团审计产出,已交付并入演化主线) | 想了解演进逻辑的人 |

## 阅读路径

### 🎯 路径 A:我想用这个模板建站赚钱(最常见)

```
0. 站内学习手册           ← 引导式主线:选品→建站→AI 产页→部署→变现运营
                            (https://anvilwiki.pages.dev/zh/landing/docs,含提示词)
1. game-selection.md      ← 先回答"做哪个游戏",这比建站重要
   └ sourcing.md          ← 候选池不够大时:9 个挖词渠道 + 选词决策管理表
   (懒人通道:对 AI 说「帮我挖词」——/anvil-find-keywords 自动跑挖候选→快验→打分)
2. README                 ← fork + 本地跑起来(5 分钟)
3. apply-template.md      ← 换成你的游戏(或跑 pnpm apply-template)
4. requirements/ 两张表    ← 产页前备素材:事实来源表 + 对标参考表
   + game-selection.md 首日 10 页 ← 用 AI 直接产页(README「用 AI 直接生成内容」章节)
5. deployment.md          ← 部署上线(⚠️ 必读 wrangler.toml 警告);上线 3-7 天做数据复盘
6. ads.md                 ← 排名稳定了再开广告;AdSense 收款/Adsterra 接入/平台怎么升级(含游戏垂直)
7. staying-up-to-date.md  ← 上线后回来看:如何跟上游、如何保持新鲜
```

### ✍️ 路径 B:我是内容作者(站已建好,我来写文章)

```
1. content-format.md      ← 唯一必读:frontmatter 字段表 + 正文规则 + 组件清单
2. seo.md 第 1-4 条       ← 问题式 H2、Quick Answer——为什么这么写
3. (日常) 对 AI 说"帮我写一篇 X"即可——.agent/skills/ 会自动生效
   兑换码更新 → /anvil-update-codes;不知道该更新什么 → /anvil-refresh
```

### 🤖 路径 C:我是 AI Agent(ZCode / Claude Code / Codex / Cursor)

```
1. AGENTS.md              ← 仓库根目录,自动加载:硬规则 + 对话式产页章节
2. .agent/skills/         ← 自动发现的 6 个技能(find-keywords / new-article / batch-articles / update-codes / refresh / adsense-audit)
3. docs/content-format.md ← 需要字段细节时查
```

### 🔧 路径 D:我要给模板本身贡献代码

```
1. development.md         ← 开发指导:三层架构、加功能的模式、验证清单、发版流程(必读)
2. PRD.md 第 3-13 章      ← 架构与每个模块的设计依据
3. AGENTS.md              ← 工程约束 + Astro 5 踩坑清单(6 条,全是实测)
4. development.md 的发版流程 ← 改完代码怎么验证、怎么发版
```

## 一页决策地图

```
我该读哪份文档?
│
├─ 还没建站,纠结做哪个游戏 ──────────→ game-selection.md
├─ 想系统挖词/候选池不够大 ──────────→ sourcing.md
├─ 选好了游戏,产页前要备素材 ────────→ requirements/(事实来源 + 对标参考)
├─ 刚 fork,要换成我的游戏 ───────────→ apply-template.md
├─ 要部署 / 部署后 env 不生效 ───────→ deployment.md(wrangler.toml 警告)
├─ 上线了,数据复盘/看热力图 ─────────→ deployment.md(数据复盘 + Clarity 两节)
├─ 什么时候开广告 / 钱怎么收 / 接哪家平台 → ads.md(含游戏垂直网络)
├─ 要写/更新文章 ────────────────────→ content-format.md 或直接对 AI 说
├─ 要接 GSC API 拉搜索数据 ──────────→ 开发手册《AI 运营与 GSC 接入》(handbook/zh/ai-ops.md)
├─ 想批量铺内容/开草稿 PR ───────────→ content-pipeline.md
├─ 有第二个站了,想统一运营 ─────────→ multi-site.md
├─ 上游更新了,要不要合并 ───────────→ staying-up-to-date.md
├─ 想改模板代码 / 提 PR ────────────→ development.md
└─ 想知道"为什么这么设计" ───────────→ PRD.md
```

## 维护约定

- 新增文档:**必须**同步加进上面的快速索引,并归入某条阅读路径
- 文档面向 fork 用户的部分用中文为主、关键术语保留英文;面向国际社区的锚点在 README 英文区
- 与代码强相关的规则(硬约束)优先写进 `AGENTS.md`(Agent 自动读),文档负责"为什么"和"怎么做"

## 致谢

- [yan-labs/yan-skills](https://github.com/yan-labs/yan-skills)(MIT)—— [sourcing.md](sourcing.md) 第四节「判决框架」参考其 game-opportunity 技能;[seo.md](seo.md) 外链验证一节引用其实测结论与提交入口库
- [yantoumu/adsense-site-auditor-skill](https://github.com/yantoumu/adsense-site-auditor-skill) —— `/anvil-adsense-audit` 技能的审计框架(逐项四态判定 + Blocker 分级 + 完整性门)受其启发,清单为模板特化重写
- [kennyzir/7deer_skills](https://github.com/kennyzir/7deer_skills)(MIT)—— `anvil-new-article` 的视频源工作流(字幕 → 结构化提取 → 页面草稿)参考其 youtube-content-gen 技能,已按本模板内容层契约(MDX + frontmatter)重写
