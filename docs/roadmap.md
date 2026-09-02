# 路线图:走过什么方向,接下来去哪(Roadmap)

> 本页回答两个问题:**这套模板过去按什么方向演化**(帮你判断它的成熟度和侧重),以及**接下来会往哪走**(帮你决定现在入场合不合适)。逐版本的完整变更见 [CHANGELOG](../CHANGELOG.md);正在做什么见 [PRD](./PRD.md) 第 14 章。

> **当前版本:v2.13.0**(2026-09-02 发布)。发版历史与最新版本见 [Releases](https://github.com/PNGTRID/AnvilWiki/releases)。

## 演化主线:从「建站模板」到「内容经营操作系统」

AnvilWiki 的版本历史不是功能大杂烩,而是一条主线:**不断把「个人做游戏 wiki 赚钱」这件事里机器能干的部分,搬进模板**。每个阶段的方向:

| 阶段 | 版本 | 方向 | 代表能力 |
| --- | --- | --- | --- |
| 地基 | v0.1 – v1.0 | 架构定型:纯静态、三层分离、开箱即绿 | Astro 5 + Cloudflare Pages 零适配器、代码/配置/内容三层分离、i18n、主题变量、Lighthouse 4×100 |
| 官网与内容体验 | v1.1 – v1.3 | 站点门面与栏目形态 | 官网 landing(中英)、displayType 栏目形态(卡片/时间线/视频网格)、demo 站上线 |
| 互动与信任 | v1.4 – v1.7 | 留住访客、攒信任信号 | giscus 评论、标签聚合页、gameVersion 徽章、画廊+灯箱、作者体系(Person JSON-LD)、AffiliateLink、check 工具链起步 |
| SEO 与质量收口 | v1.8 – v1.10 | 把技术 SEO 和质量门禁焊死 | og:image 绝对路径、404/FAQ/hreflang、check-i18n / check-links / check-content、五视角审计 65 文件修复 |
| 知识体系 | v1.11 – v1.13 | 把「怎么用」变成产品的一部分 | 站内文档中心(双手册,中英)、AI 内容技能(`.agent/skills/`)、一键套模板 CLI `apply-template` |
| 运营闭环 | v1.14 – v1.16 | 流量数据回流到内容决策 | `anvilwiki-ops` CLI+MCP(GSC/CF 数据,提交走 PR)、社区展示墙、专家团复审修复 |
| 媒体与规模化 | v1.17 – v1.18 | 补齐媒体示范、把一个站变多个站 | demo 全类型媒体示范、`template-audit` 模板健康检查、`bulk-new-posts` 批量产页、学习手册第 9/10 章 |
| SEO 进阶 | v1.19 | 对齐 2026 搜索新格局 | 学习手册第 11 章「SEO 进阶」(排名 + AI 引用)、`docs/seo.md` 收录 2026 Google 官方更新记录、封面图升级为图片搜索入口、本路线图 |
| **内容经营操作系统(当前)** | **v2.0** | **机器接管「产出与运营」环节** | PR 门控内容管道(auto-content.yml:确定性生成 → 八道门禁前置 → draft PR)、anvilwiki-ops 1.0 多站管理 + AI 引用追踪、`pnpm gen-covers` 封面产能(1200×675 + max-image-preview)、AffiliateSuggestion 建议位 |

一个可以观察到的规律:**每个阶段都在为下一个阶段铺路**——比如三层分离(v1.0)让模板化(v1.18)成为可能,check 工具链(v1.7)让 AI 技能(v1.13)有了验收标准,作者体系(v1.7)在 AI Overviews 时代(2026)变成了引用偏好里的信任信号。

## 接下来的方向

### 近期(v2.0+,候选池)

按「用户目标函数」排序——玩家做站要的是 选品 → 产能 → 流量 → 变现,v2.0 补强了「产能」(管道/封面)与「运营」(多站/AI 引用)两侧,接下来补两头:

- **邮件订阅**(v2.0 遗留):RSS 已就绪,差订阅表单的模板级支持——涉及第三方服务选型(Buttondown 等)与 double opt-in 合规,做就做干净。
- **preferred sources 适配**:Google 2026-08-20 刚发布「偏好来源」自定义按钮,等实现方式稳定后评估模板层支持。
- **选品决策支持**:「哪个游戏值得建站」目前靠学习手册第 1 章的人工四关卡,可沉淀为数据脚本(搜索趋势/竞争度抓取)。
- **管道生成器扩展**:codes 同步、Trello 导入等确定性任务接入 auto-content.yml(同一套门禁契约)。
- **Astro 6/7 升级**:Astro 7 已 GA 但 v2.0 刻意锁 5.x(降回归风险);作为独立小版本做 5→6→7 两跳迁移,重点回归 check-content/check-links。

### 中期(v2.0 方向)——✅ 已随 v2.0.0 交付

从「建站模板」升级为「内容经营操作系统」,三件全部落地:

- **PR 门控 CI 内容管道** ✅:`auto-content.yml`——确定性生成器 → 八道质量门禁前置(全绿才开 PR)→ draft PR;LLM 永不进 CI(ADR-004)。
- **多站管理** ✅:`anvilwiki-ops` 1.0.0——站点注册表 + `--site`/`--all` + 统一巡检,并附赠 AI 引用追踪(CF AI referrals + GSC AIO 探测 + CSV 导入)(ADR-005)。
- **变现层深化** ◐:AffiliateSuggestion 文末建议位已交付;**邮件订阅留 v2.1**(涉及第三方选型与 opt-in 合规文案,不污染本版)。

### 不做清单(同样重要)

- 不做课程/培训——模板和文档本身就是产品(README/手册免费公开)。
- 不做社区运营——展示墙收录真实站点,但不经营论坛/群。
- 不引入 React/Vue 运行时——纯 Astro 静态是 Lighthouse 4×100 和零带宽成本的地基(PRD ADR-002)。
- 不做 SaaS 托管——Cloudflare Pages 免费额度 + 你自己的仓库,数据主权在你。

## 给 fork 用户的含义

- **方向稳定性**:主线一年未偏——「让个人低成本经营游戏 wiki」没有 pivot 过,你的 fork 不用担心模板方向突变。
- **升级节奏**:语义化版本 + 三层分离,merge 上游通常只动代码层(见 [staying-up-to-date.md](./staying-up-to-date.md))。
- **参与**:路线优先级欢迎开 issue 讨论;做出成绩的站点欢迎提 PR 上展示墙。
