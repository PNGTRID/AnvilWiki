# 路线图:走过什么方向,接下来去哪(Roadmap)

> 本页回答两个问题:**这套模板过去按什么方向演化**(帮你判断它的成熟度和侧重),以及**接下来会往哪走**(帮你决定现在入场合不合适)。逐版本的完整变更见 [CHANGELOG](../CHANGELOG.md);正在做什么见 [PRD](./PRD.md) 第 14 章。

> **当前版本:v2.35.2**(2026-09-22 发布)。发版历史与最新版本见 [Releases](https://github.com/PNGTRID/AnvilWiki/releases)。

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
| SEO 进阶 | v1.19 | 对齐 2026 搜索新格局 | 学习手册「SEO 进阶」课(排名 + AI 引用;现拆为课 28 + 课 29)、`docs/seo.md` 收录 2026 Google 官方更新记录、封面图升级为图片搜索入口、本路线图 |
| **内容经营操作系统(当前)** | **v2.0** | **机器接管「产出与运营」环节** | PR 门控内容管道(auto-content.yml:确定性生成 → 八道门禁前置 → draft PR)、anvilwiki-ops 1.0 多站管理 + AI 引用追踪、`pnpm gen-covers` 封面产能(1200×675 + max-image-preview)、AffiliateSuggestion 建议位 |

一个可以观察到的规律:**每个阶段都在为下一个阶段铺路**——比如三层分离(v1.0)让模板化(v1.18)成为可能,check 工具链(v1.7)让 AI 技能(v1.13)有了验收标准,作者体系(v1.7)在 AI Overviews 时代(2026)变成了引用偏好里的信任信号。

## 接下来的方向

### 近期(v2.0+,候选池)

按「用户目标函数」排序——玩家做站要的是 选品 → 产能 → 流量 → 变现,v2.0 补强了「产能」(管道/封面)与「运营」(多站/AI 引用)两侧,接下来补两头:

- **邮件订阅**(v2.0 遗留):RSS 已就绪,差订阅表单的模板级支持——涉及第三方服务选型(Buttondown 等)与 double opt-in 合规,做就做干净。
- **preferred sources 适配**:Google 2026-08-20 刚发布「偏好来源」自定义按钮,等实现方式稳定后评估模板层支持。
- **选品决策支持**:「哪个游戏值得建站」目前靠学习手册课 7「打分拍板」的人工四关卡,可沉淀为数据脚本(搜索趋势/竞争度抓取)。
- **管道生成器扩展(继续)**:codes 同步已接入 auto-content.yml(v2.17.0);Trello 导入等更多确定性任务走同一套门禁契约。
- **可视化编辑层**(社区 issue #21):优先评估现成 git-based CMS 的模板级可选接入(Sveltia/Decap/Keystatic 本地模式——编辑对象就是仓库 Markdown,与纯静态架构天然兼容;注意 OAuth 配置门槛与 content.config.ts 的 schema 双源漂移风险);**不自研本地常驻后台**(CLI+setup.yml 已是两通道同步坑,第三通道是持续税,且偏离 AI 原生定位)——需求热度 n≥3 再启动。✅ 评估已完成(2026-09-08):Sveltia 因不支持 MDX 排除、Decap 平庸不推荐;推荐形态=**Keystatic 独立 admin 站**(不碰主站零 adapter 架构),先决解锁项=Zod schema→CMS 配置生成器(双源变单源)。详见 docs/superpowers/specs/2026-09-08-git-based-cms-evaluation.md。
- **依赖漏洞分层清理**(外部扫描 issue #37 + 官方 audit 实测 27 条:1 critical/13 high/10 moderate/3 low,2026-09-14 基线)✅ **已收官(2026-09-14:v2.22.0 A 层 + v2.23.0 B/C 层,`pnpm audit` 27→0)**:
  - **A 层(pnpm overrides)** ✅ v2.22.0:sharp/fast-uri/js-yaml/fflate/svgo 范围限定双条,audit 27→15;
  - **B 层(Astro 5→6→7 两跳)** ✅ v2.23.0:astro 系 10 条全清(critical AVIF RCE 修于 7.2.8;静态站实际可利用性低——无运行时图片端点,构建只处理仓库自有图片,但不背 critical 评级);fork 常规 merge 零迁移,视觉零漂移钉死三处(compressHTML/cssMinify/postbuild 区间语法降级);
  - **C 层(独立小项)** ✅ v2.23.0:vitest ^4.1.11(mocker path traversal ×2)、esbuild 随 Vite 8 达标、extract-zip ×2 随 astro 7 依赖树重排整体消失;overrides 回收六条留一条(fflate,@iconify/tools 仍钉旧线)。
- **Astro 6/7 升级** ✅ 已完成(v2.23.0,2026-09-14):5→6→7 两跳、每跳独立提交+八门禁全绿;回归重点 check-content/check-links/apply-template E2E/产物规则级对比全绿;零 fork 迁移。
- **核心文件复杂度治理**([誓言](https://github.com/lyglzhl) 外部代码审查报告 2026-09-15,P2):少数核心文件体积与职责持续膨胀——landing.ts 58KB / apply-template.ts 41KB / apply-rewrites.ts 30KB / CommunityHighlights.astro 29KB / SearchButton.astro 23KB / ArticlePage.astro 23KB / BaseLayout.astro 14KB——单个功能点看都合理,但一个小需求可能同时波及 SEO/广告/i18n/导航/构建。方案:拆 ArticlePage(结构化数据/文章辅助区/商业化插槽/导航组件化)、拆 BaseLayout(Head/SEO 与 Tracking/Consent 与 Theme Init 分离)、拆 apply-template(问答采集/计划生成/文件变更执行分层,CLI 只留 orchestration)。改动面大、回归风险高,按项目惯例拆成独立小批做,每批全门禁+E2E 伴随。
- **类型逃生口收敛 + 复杂度预算**(同一报告 P2/P3):src/ 下 17 处 `as unknown as Record<string, any>`(集中在 `shared` UI 对象,`lib/shared-ui.ts` 已有类型化 helper 未全面换用)继续贯通 UI JSON 类型;同时建立「复杂度预算」习惯——新能力先判断属于核心模板/可选插件/运维工具/文档 SOP,不全进主运行时;生产构建以「零 warning」为常态目标(fallback 构建日志两类警告已随 v2.27.0 清零,astro-icon 空目录 + getEntry 降噪)。
- **ja 落地面验证**(关键词依据:SimilarWeb Keyword Generator,2026-08,Japan:「ゲーム wiki」2,390/月 +「ゲーム攻略」2,050/月):ja wiki UI 已内建(`pnpm new-locale` 脚手架 + i18n 契约门禁),缺的是落地验证——日文市场对静态攻略站的接受度与广告变现(ja eCPM、广告位表现)。**触发条件**:出现日文 showcase 站或 ja 社群信号(日文用户的真实反馈/需求);**约束**:landing.ts 复杂度预算已告警(见上方复杂度治理条),ja 落地会再增 landing 文案面,不提前启动,排在拆分批之后。
- **「wiki page templates」模板展示页**(承接长尾:SimilarWeb Keyword Generator,2026-08,global:「wiki template」约 1,000/月,score 19;「wiki template character」约 1,490/月):单页展示模板能产出的各页型(boss/codes/tier list/画廊等),每型挂 demo 真实链接,页内导流 GitHub fork。**排序约束**:排在 landing.ts 拆分批之后做——新页面类型会先加重 landing.ts,拆分前不加新面。 ✅ **已交付(v2.32.0,2026-09-17)**:排序约束已满足(拆分批 v2.31.1 先行);/landing/templates + /zh/landing/templates 双语上线,文案独立新文件 src/config/landing-templates.ts(landing-en/zh.ts 零触碰),六页型卡(Boss 攻略/兑换码/Tier List/新手攻略/装备物品/文档中心)全挂 demo 真实链接(先 ls src/content/wiki/en/ 逐条核实),LandingLayout 导航+页脚三处加 Templates 入口,data-pagefind-body 进全站搜索,fork 三通道同步(apply-template LANDING_PATHS+setup.yml rm+e2e 纯净性断言),en+zh 375px 横向零溢出程序断言绿。
- **showcase 收录标准补「站点 README 回链 anvil.wiki」**(依据:SimilarWeb 反向链接实测,anvil.wiki 全站仅 28 个引荐域且均为自动收录型目录——外链是当前最短板):showcase 站是真实内容站,收录时要求对方站点 README 回链,是最自然的获外通道。**触发**:下一次 showcase 投稿受理时随收录流程落地,存量站不追溯。 09-18 首例触发:Warhounds/Sandustry 两投稿站仓库均私有,「README 回链」无法公开验证(站点本身核验为真实 AnvilWiki 构建,已在 PR 留言建议开源),标准自下次受理起执行。
- **Cloudflare Pages → Workers 迁移评估**(背景:2026-09 Cloudflare 官方将 Pages 列为历史产品线、静态与 git 部署能力并入 Workers,社区热议迁移;本项目 2026-09-19 完成评估,**定案暂不迁**):一票否决=Workers 的 `wrangler.toml` `[vars]` 只进 runtime 不进**构建期**,正中 apply-template「env 单源在构建期读取」设计与 GA/广告/评论全套 env 门控契约(PRD ADR-003 维持 Pages 默认);次因=Workers 自定义域要求域名 NS 托管在 Cloudflare(外部 NS 不支持)。**重开触发**:Cloudflare 公布 Pages 实际停服时间表,或 Workers 支持构建期 vars——届时按 ADR 流程重评;在此之前 fork 用户零动作,现役 Pages 部署不受影响。

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
