# Changelog

All notable changes to AnvilWiki are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.15.0] — 2026-09-05

**挖词选品技能：新增 `anvil-find-keywords`（第 6 个 anvil-\*），把 docs/sourcing.md 的 9 渠道挖词方法论变成智能体可自动执行的工作流。**

### Added

- **`anvil-find-keywords` 挖词选品技能(第 6 个 anvil-\*)**:把 docs/sourcing.md 的 9 渠道挖词 + 意图满足度 + 判决框架整理成智能体可自动执行的工作流(用户:「整理一套能让智能体自动挖词找词的提示词」)——Step 0 输入收集(市场/已有站/付费工具账号/本轮预算)→ Step 1 多渠道挖候选(渠道编号对齐 sourcing.md;agent 自助通道:SteamDB 反爬换 steamcharts/二手汇总、old.reddit 异常值、CrazyGames sitemap、Trends RSS、开发者追更、`alternative` 二创、预告埋伏、AI 类游戏;用户通道:TikTok 登录墙贴链接验证、付费工具给查询式回填)→ Step 2 逐候选两分钟快验(SERP 构成 + 意图满足度 + 搜索萌芽 + 可玩供给)→ Step 3 判决打分(需求轨 7 项/早期爆发轨/KD 分档,点名未测项)→ Step 4 落盘 `seo-reports/game-pipeline.md`(已 gitignore;决定/上线日期/链接三列对齐多站台账口径,【考虑】带 3/7/14/28 天复查日,不覆盖用户已填结论)→ Step 5 交接(game-selection 四层漏斗 → requirements 两张表 → anvil-new-article/batch-articles)。五条红线:禁编造数据/未测≠零/平台内流量≠独立需求/拍板在用户/不覆盖用户结论。技能枚举同步 5 处:README 中英技能表(5→6 个)、AGENTS.md 产页章节、PRD 架构树、docs/README 阅读路径 A(懒人通道)/C。

## [2.14.1] — 2026-09-03

**文档中心顶栏优化：搜索触发器升级为品牌组旁的加宽搜索胶囊。**

### Changed

- **文档中心搜索触发器升级**:SearchButton 增 `variant='icon'|'field'`(默认 icon,wiki SiteHeader/404 零改动);docs header 的搜索框改为加宽胶囊——占位文字(sm+,zh「搜索手册文档…」来自 landing.ts search 段)+ ⌘K 提示(md+),窄屏退化为图标,置于品牌组之后 flex 撑开(max-w-xs)——原小图标挤在右侧不显眼(用户反馈)。营销 landing 与 wiki 侧均不受影响。

## [2.14.0] — 2026-09-03

**文档中心接入全站搜索（手册 41 课×双语）+ GSC API 接入引导三层修复。**

### Added

- **手册×双语接入全站搜索**:HandbookChapter `<article>` 加 `data-pagefind-body`(面包屑/页脚 `data-pagefind-ignore`,H1 加 `data-pagefind-meta` 对齐 ArticlePage)——Pagefind 的规则是站点任一页面标记 body 后**未标记页面整体排除出索引**,此前只有文章页标记,落地页与两本手册对站内搜索完全隐形。Pagefind 按 `<html lang>` 自动分语言索引,zh 页搜出 zh 结果;wiki 里搜「GSC」也能命中手册课。SearchButton 增可选 `labels` 覆盖(zh 不是 wiki locale,`getUi('zh')` 会回退英文),locale 放宽为 string——wiki 侧 SiteHeader/404 调用零改动;landing.ts 接口+双语数据增 `search` 段,LandingLayout 增 `search` 开关,8 个 docs 路由(en+zh × hub/learn/dev/[slug])开启,营销 landing 保持无搜索。契约测试钉住 `data-pagefind-body`:丢了它全部手册静默退出索引而所有门禁仍绿。
- **shortTitle 可选 frontmatter 覆盖字段**:`lib/handbook.ts` `shortTitle(title, override?)` + handbook schema `shortTitle`(≤40 字符,optional)+ HandbookNav 两处消费,+2 单测——冒号派生法永远无法在侧边栏露出只在标题后半段的关键词。

### Fixed

- **GSC API 接入引导三层修复**(用户问「模板有没有 GSC API 接入指引」而 AI 回答含糊:内容一直在开发手册第 7 课,但三层引导失灵):① 第 7 课改名×双语「让 AI 替你运营:GSC 数据接入、metrics 与 MCP」/"Run Ops with AI: GSC setup, metrics & MCP",短标题「AI 运营与 GSC 接入」/"AI ops & GSC setup" 露出侧边栏,H2 改「GSC API 接入(5 分钟)+ CF Web Analytics(2 分钟)」露出页内 TOC,slug `ai-ops` 不动互链零影响,contribute-back 双语链接文本同步;② 三处指路——docs/README 找文档决策树新行、deployment.md 数据复盘节链教程(显式区分 GSC 站点验证≠API 接入)、tools/anvil-ops README GSC setup 节反链手册(GitHub 绝对链,npm README 相对链会断);③ `anvil-ops doctor` gsc-config 缺配置 detail 追加教程 URL(`fix` 字段仅 FAIL 渲染,env 门控 `ok:true` 契约不变,测试钉 URL 断言)。
- **手册列表页 stage 分组对「隔断后重现」健壮**:HandbookManualList 的表头判断从「记录最近出现过的 stage 标签」改为对照**紧邻上一课**——同一 stage 隔着一篇无 stage 课文再次出现时,原实现第二段会静默丢失表头(当前 32 课数据 stage 全连续,故线上从未触发,属潜伏缺陷)。纯函数 `manualListRows` 下沉 `src/lib/handbook.ts` 直测(沿用 lib/apply-rewrites 先例),+3 条单测(隔断重现/连续分组/无 stage 扁平)。
- 同批清掉 v2.13.0 断点 xl→lg 改动遗留的 7 处注释漂移(HandbookChapter×3、HandbookNav×3、TableOfContents JSDoc×1)——纯注释,零行为变更。

## [2.13.0] — 2026-09-02

**手册阅读体验优化：左侧目录短标题 + 三栏布局下探到 lg(1024px)。**

### Added

- **左侧手册树改用短标题**:`lib/handbook.ts` 新增 `shortTitle` 纯函数(取首个冒号前的重点段;附录取「 · 」后段;无冒号回退全标题),HandbookNav 桌面树与折叠态统一使用,4 条单测钉住。课程标题正文的完整标题不受影响(列表页/前课后课卡仍是全称)。
- **三栏阅读布局下探 lg(1024px)**:HandbookChapter 网格在 1024-1279px 区间改用窄侧栏三栏(此前该区间右侧「本页目录」退化为文首静态折叠块、随页面滚走);TableOfContents 的 desktopAt 同步 lg——右侧目录在 ≥1024 即为粘性卡且高亮跟随滚动(scrollView spy 原本就有,此前的报告源于断点差 12px)。
- 第 13 课标题微调:「第一篇攻略:…」(短标题「第一篇攻略」比「第一篇」达意)。

## [2.12.0] — 2026-09-02

**手册教学法重构收官：开发手册 7 章→9 课 + 附录三件（学习手册 29 课 + 3 附录 + 开发手册 9 课,两册双语全部重建完毕）。**

### Added

- **开发手册新增三课**:「改完怎么自证」(本地七命令+CI 八门禁+三流水线+安全/性能底线——原内容散在 development.md 与 ci-and-security,手册首次成课);「内容管道」(关键词 CSV→草稿 PR,自 ai-ops 拆出并扩写确定性生成器/门禁前置/三产线分工);「多站管理」(sites.toml 注册表+--all/--site+AI referrals+submit 拒绝 --all,自 ai-ops 拆出并扩写)。
- **学习手册附录三件**:附录 A 作死红线总检查表(内容/AdSense/外链/版权隐私/工程五类,每条附为什么与正确替代);附录 B 疑难排查决策树(六症状:没收录/404/构建红/广告空白/统计没数/排名不涨);附录 C 术语表与命令速查(30+ 术语按主题归拢+20 条命令按场景分组)。

### Changed

- **sync-and-contribute 一拆二**:「同步上游」(三行命令+冲突口诀+版本号承诺)与「贡献回流」(五步贡献+展示墙);ci-and-security 内容并入「改完怎么自证」后移除;ai-ops 重写为纯运营课(多站/管道拆出),dev 手册 order 重排连续 1-9。
- **计数收口**:README/docs README「重构分批上线」表述更新为最终形态(学习手册 6 阶段 29 课+3 附录、开发手册 9 课)。
- 手册 interlink 末课互指(29 课结尾→开发手册 ai-ops 与附录;multi-site 结尾→weekly-ops 与附录)。

## [2.11.0] — 2026-09-02

**手册教学法重构第四批：阶段 4+5「上线收录与变现经营」（学习手册 29 课完整收官）。**

### Added

- **课 20「装好两个计数器」**（新增）：Cloudflare Web Analytics（必装，`PUBLIC_CF_BEACON_TOKEN`）+ Clarity 热力图（选装，BaseLayout 贴脚本——按模板实情：Clarity 无 env 开关）；读数三件套（GSC/CF/Clarity）概念在此建立。
- **课 21「第一周读数」**（新增，自 weekly-ops 拆出）：三面板各认一个数+四条及格线表+「只认面板上的数」复盘纪律。
- **课 23「收款三件事」**（新增，自 enable-ads 拆出并吸收 docs/ads.md 收款节）：W-8BEN 协定税率 30%→10%、PIN 明信片（$10 触发/4 次机会/4 个月期限）、KYC 汉字 vs 电汇拼音细节、电汇+SWIFT、21 日出账与结汇。
- **课 24「接入 GA4」**（新增，自 enable-ads GA4 节独立）：延迟哲学（问题升级再上）+五步接入+同意横幅门控/报表延迟两坑。
- **课 26「复制第二个站」**（slug clone-your-site 承接 templatize-your-site）：template-audit 体检+换皮清单提示词+四步复制流程+wrangler.toml 接管 env 大坑。
- **课 28「选词与把一个词做满」/ 课 29「慢变量：信任与外链」**（旧 seo-traffic 一拆二）：一页一词选词地图+单页自检清单提示词｜信任三慢变量+反 spam 三红线+外链时机哲学（新站期别死磕）+2026 失效清单（FAQ 富结果移除/llms.txt 对 Google 无效）。

### Changed

- **enable-ads 重写**：时机三条件前置，统计节（选型表/CF/GA4 安装）拆往课 20/24，收款节拆往课 23，保留自查+/anvil-adsense-audit/4 变量/收入预期。
- **weekly-ops 重写**：读数细节拆往课 21，保留 refresh-audit+兑换码更新+月度同步+季度体检；「学完之后」改指 clone-your-site。
- 学习手册 order 对齐最终架构（18-29），**29 课全部就位**；seo-traffic/templatize-your-site slug 移除，landing.ts SEO 卡与各章链接改向（顺手修复 batch-1 批量替换在 en/batch-pages 留下的断词链接）。

### 剩余批次

开发手册 7 章→9 课（新增「改完怎么自证」、ai-ops 三拆、sync-and-contribute 一拆二）、附录三件、计数收口。

## [2.10.0] — 2026-09-02

**手册教学法重构第三批：阶段 3「内容生产」（5 课 × 中英）。**

### Added

- **旧「让 AI 帮你写 10 篇攻略」一拆五**：课 13 第一篇（AI 打开文件夹自动加载规范+玩一小时记 20 条笔记+攻略页提示词；意图分类表与 frontmatter/质检/draft 三词讲透）、课 14 兑换码页（全书最粗红线：码只来自亲眼所见；⊕视频素材双红线——口播数值与兑换码视为未验证须 draft 核实转正、他人文案必须完全重写、嵌入原视频为合规做法；draft 转正标准动作）、课 15 排行榜与配图（排行榜提示词+gameVersion 版本戳；⊕素材三合法通道：自截自录/官方 press kit/CC 图库）、课 16 验收流水线（三关：AI 质检/肉眼看页面/回应待补充清单；draft 处置规则；一篇一 commit 存档点）、课 17 首版排期（首版 10-15 篇核心页+每周 10+ 分批补，「到点就走」反完美主义）。
- **原「千万不要做的 7 件事」拆进各课「三个经典错误」**；`requirements/` 两张准备表降为课 13 进阶框；`docs/content-format.md` 媒体密度表引用保留在课 15。

### Changed

- **first-10-pages slug 移除**（first-article 承接），landing.ts 4 处链接与标签同步（「第 4 章/Ch.4」→「课 13/Lesson 13」），课 12 下一课链接改向。
- **学习手册阶段 4-5 旧章顺延至 order 18-24**，现连续 1-24；开发手册不动。

### 剩余批次

阶段 4/5 重构（部署/收录课瘦身+新增计数器课、GA4 独立成课、收款课自 ads.md 吸收、seo-traffic 拆排名与外链两课、五处折叠随课落地）、开发手册 7 章→9 课、附录三件。

## [2.9.0] — 2026-09-02

**手册教学法重构第二批：阶段 2「把站立起来」（4 课 × 中英）+ 开发手册重编号。**

### Added

- **课 10「把站跑起来」/ 课 11「换成你的游戏」**：旧「复制模板,跑起你的站」一拆二——fork/clone/`pnpm dev` 三步先跑通样品站独立成课;apply-template 15 题问答对照表、`--dry-run` 预览、Initialize AnvilWiki「只做收尾清理」警示、favicon/`pnpm gen-assets` 图标支线、亲眼验收清单独立成课;`docs/apply-template.md` 降为进阶参考链接。
- **课 09「装好 6 样工具」按新骨架重写**：⊕补 GitHub 两步验证与恢复码 30 秒（原全手册零覆盖；定位=账号是站点/内容/广告费的保险柜），验收清单加 2FA 项。
- **课 12「主题与门面」自开发手册调入学习手册**（order 12，选修定位：apply-template 已自动换色，本课教「8 行变量为什么一起换」的规矩与首页文案的 JSON 改法）。

### Changed

- **学习手册 order 重排**：阶段 3-5 旧章顺延 13-20，学习手册现为连续 1-20；开发手册移出 theme-and-homepage 后重编号为连续 1-6。
- **launch-your-site slug 移除**，站内引用全部改向 run-your-site / rebrand-your-site：landing.ts 8 处卡片与 devGuide 五步链接（标签「第 3 章/Ch.3」→「课 N/Lesson N」）、install-tools 下一课链接。
- **architecture / categories-and-locales 对主题课的「开发 3」引用**改为「学习手册『主题与门面』一课」；**ai-ops 结尾开发地图**去掉主题步。

### 剩余批次

阶段 3 内容生产、阶段 4 上线收录、阶段 5 变现经营（含 GA4 独立成课、外链课拆分、五处折叠随课落地）、开发手册 7 章→9 课定案、附录三件。

## [2.8.0] — 2026-09-02

**手册教学法重构第一批：学习手册「选品找词」线（阶段 0+1，8 课 × 中英）+ 阶段化架构落地。**

### Added

- **学习手册重构启动**：按教学法六原则（一课一事/例子先于概念/每课新词≤3 放文末/产出即验收/三个经典错误前置/关键词主线地图）拆分，定案 29 课 6 阶段 + 3 附录（spec: `docs/superpowers/specs/2026-09-02-handbook-teaching-redesign.md`）；本批上线阶段 0（01 这门生意怎么赚钱 / 02 全程地图与学法，含「怎么给 AI 布置任务」通用三招）+ 阶段 1 选品找词（03 挖候选 / 04 看懂 Trends / 05 读懂结果页 / 06 意图满足度 / 07 打分拍板 / 08 首日 10 页清单）共 8 课 × 中英，每课统一骨架（场景开场→本课产出→编号步骤→三个经典错误→词卡≤3→产出验收→下一课钩子）。
- **意图满足度独立成课（课 06）**：旧第 1 章「检查方法和实战案例见 docs/sourcing.md」的一句话甩链接，兑现为手册内完整 worked example（虚构示例第一页逐条判定 + 五步检查表）；sourcing.md 渠道精华吸收进课 03，原文降级为「进阶参考」链接。
- **手册 frontmatter 新增可选 `stage` 字段**（学习手册六阶段标签，en/zh 各自本地化）：manual 列表页按阶段分组渲染小标题，章节页徽标旁显示阶段名；无 stage 的章节（开发手册）渲染扁平。编号展示仍由 `order` 驱动。

### Changed

- **旧第 1 章 pick-your-game 拆除**：内容拆入课 03-08，slug 移除，站内引用（landing.ts 卡片链接）同步改为 find-candidates。
- **学习手册 order 重排为最终架构位**（新课 1-8、旧章顺延 9-18，order 在 manual 内唯一由 parity 测试钉住），开发手册本批不动。
- **全部 18 章标题去掉硬编码「第 N 章 / Chapter N / 开发 N / Dev N」**——编号自此由 frontmatter `order` 渲染（列表徽标 / 章节页 Lesson N / 第 N 课），彻底消除改版时的编号漂移；站内标签 Chapter→Lesson（en）、第…章→第…课（zh），计数标签 chapters→lessons/课。
- **章号互链全部改课名引用**（「去第 11 章 · SEO 进阶」→「去 SEO 进阶」、「学习手册第 7 章」→「学习手册『接广告』一课」等十余处 × 中英），「下一章/这一章」措辞统一改「课」。
- **README / docs/README 计数漂移源清除**：去掉「学习手册 11 章 / 开发手册 7 章 / 18 个可复制提示词」等硬编码计数，改结构化表述「6 阶段 29 课、分批上线」。

### 剩余批次（按阶段逐批发版）

阶段 2-5 逐批重建（含 theme-and-homepage 调入学习手册、AI 提示词课、GA4 独立成课、外链课拆分、五处折叠内容随课落地）、开发手册 7 章→9 课（含新增「改完怎么自证」、ai-ops 三拆）、附录三件（作死行为检查表/排查决策树/术语表+命令速查）。

## [2.7.1] — 2026-09-02

**apply-template 重跑安全加固 + 7 天文档漂移修复（全部 Fixed，无新特性）。**

### Fixed

- **apply-template 重跑删 locale 改内容判定（24h 审计 P2 残留边界）**:demo 文件名（en/ja）的 locale 只有在 `site.name` 仍是 demo 站名时才自动删除；上一轮已被 CLI 重写成用户游戏的 locale 文件（翻译成果）重跑时归入警告保留路径，不再被当 demo 残留静默销毁；损坏 JSON / 缺 `site.name` 一律保留（不可判定时不删）。判定下沉 `scripts/lib/apply-rewrites.ts` 纯函数 `isDemoLocaleContent` 直测（契约测试钉 demo en/ja 实文件标记 + 杂散提及不误判），E2E 重跑步骤新增「rebranded ja.json 存活且未被改写」断言；`docs/apply-template.md` 两类表述更新为三类。
- **apply-template site.ts 重写转义加固（24h 审计相邻存量）**:`gameName`/`shortName`/`domain`/`platform`/`developer`/`genre`/`releaseDate`/`officialUrl` 八个此前未转义的字段补单引号+反斜杠转义（此前游戏名含撇号如 "Assassin's …" 会写出语法错误的 site.ts，结尾反斜杠会吃掉闭引号）；`rewriteSiteTs` 纯函数下沉 lib（vitest 直测），site.ts/navigation/routing/ui 四处替换改函数回调，杜绝字符串模式替换把用户输入里的 `$&`/`$'`/`$$` 展开进产物；wrangler `[vars]` 的 domain 补 TOML 转义。
- **文档漂移修复（7 天文档漂移审计两项落地）**:`docs/ads.md` 「申请 AdSense 前的体检」的 demo 审计基线从 v2.5.1 时点同步到 v2.6.0 后状态——9 篇英文文章(仍 <15)、空 `items` 分类已补齐不再是缺口、codes 页改时效性表述(指向 `pnpm refresh-audit`)、机制层 ads.txt 表述从「占位」更正为「就绪行」;`anvil-adsense-audit` 技能「模板已解决的项」表 ads.txt 行对齐就绪注释行现状(过审按文件内注释删 `#` 填 ID 即生效,未过审保持注释才是正确状态)。

## [2.7.0] — 2026-09-02

**视频源工作流批（`anvil-new-article` Step 0，生态技能第三次吸收：7deer_skills）。**

### Added

- **`anvil-new-article` 视频源工作流(Step 0)**:素材是 YouTube 视频时,抓字幕(用户粘贴 / `yt-dlp` / `youtube-transcript-api` 三通道,按依赖从少到多)→ 结构化提取(核心话题→Step 1 判型 / kebab-case slug / title / description / summary 直答 / 5-8 组 `faq:` / 问题式 H2 大纲 / tags 复用词汇表)→ MDX 草稿。两条红线:视频作者口播数值/兑换码一律视为未验证素材,成品必须 `draft: true` 人工核实后转正;他人视频字幕只做事实参考、正文必须完全重写(演绎内容的 DMCA/重复内容风险),嵌入原视频为合规做法;缩略图 maxres→hq 仅作 `gen-covers` 视觉参考。致谢 [kennyzir/7deer_skills](https://github.com/kennyzir/7deer_skills/tree/main/youtube-content-gen)(MIT)youtube-content-gen——管线形状与提取字段设计的参考,已按本模板内容层契约重写(非代码生成);致谢五处同步:技能文内 + README 中英 Credits 段 + docs/README 致谢节 + landing.ts footer en/zh。

### Fixed

- **文档一致性**:PRD 架构树 `.agent/skills/` 技能列表补 v2.5.0 漏更的 `anvil-adsense-audit`(4→5,与 README/docs/README 计数对齐)。

## [2.6.3] — 2026-09-01

**apply-template 重跑安全四连修（2026-09-01 风险审计 P1-P4 落地）。**

### Fixed

- **文档一致性清扫**：`AGENTS.md` 测试套件描述 9→10（v2.6.2 新增 `tests/prompt.test.ts` 后漏更）、`docs/PRD.md` 架构树运维脚本数 12→14（v2.4.0 新增 `gen-assets` / `submit-indexnow` 后漏更）、`docs/apply-template.md` 补记 `--answers answers.json` 非交互模式（v2.4.1 引入，此前未进配置手册）。
- **文档一致性清扫（第二轮）**：三处「内置技能 4 个」计数漏更——v2.5.0 新增 `anvil-adsense-audit` 后，`README.md` 中英两个技能表与 `docs/README.md` 路径 C 仍写 4 个，现更正为 5 个并补该技能条目（`.agent/skills/` 实有 5 个目录）；`docs/development.md` 发版清单第 3 步补记「`[Unreleased]` 指针上移到新版本」——即 [2.6.2] 记录的连续 6 版漏更事故点，原清单只写了「compare 链接加一行」。
- **apply-template 重跑安全四连修（2026-09-01 风险审计落地）**：① **P1 locale 误删**——重跑时未选语言只自动删 demo 自带的（`DEMO_LOCALES = ['en','ja']`），用户自建 locale（上一轮 CLI 或 `pnpm new-locale` 加的）改为响亮警告保留，翻译工作不再被静默销毁（原逻辑无确认门直接 `unlinkSync`）；② **P2 资产整目录删除**——`clearDemoAssets` 废除对 `src/assets/gallery/`、`public/images/articles/` 的整目录 rm -rf（后者正是 content-format.md 让用户放**自己**内文图的目录），三个 demo 图清单（封面/画廊/内文）全部按名删除，`setup.yml` 同步改为 `rm -f` 清单，新静态契约测试钉住两通道清单零漂移；③ **P3 nav 残留**——locale 重写不再把未选 demo 分类的 `nav.<key>` 标签带进 fork（原 `{...prevNav}` 展开会泄漏 `items` 等残留键，且没有任何渲染或门禁能发现），改为只保留本次仍拥有的键，且上一轮用户已改的标签优先于英文占位符（重跑不再重置翻译）；④ **P4 wrangler 正则 CRLF 失配**——`[vars]` 重写兼容 CRLF 工作区（原 `\n` 锚点在 CRLF 文件上静默 `test()` 失败→跳过重写→demo Giscus 值残留），插入块跟随文件自身行尾。配套重构：纯重写函数抽到 `scripts/lib/apply-rewrites.ts` 供 vitest 直测（新增第 11 个测试套件 `tests/apply-template.test.ts`，共 114 tests），E2E 新增重跑断言（ja 删/ko 保留/二次运行幂等完成）。

## [2.6.2] — 2026-08-31

**CLI 输入层修复(用户报障 issue #12)+ demo ja codes 页保鲜(自动审计 issue #11)。**

### Fixed

- **交互式 CLI 丢行——「默认值按回车没反应,输入默认内容才能继续」(issue #12)**:根因是 `readline/promises` 的 `rl.question()` 每次调用挂一个**一次性** `'line'` 监听器,而 readline **不缓存**「没有提问挂起时」到达的行。人在真 TTY 上逐键输入永远不会触发(raw mode 逐键送达、提问总在下一次按键前挂好),但一切**缓冲型 stdin 通道必然触发**:管道、AI agent 终端、多行粘贴、CI——多行在一个数据块里到达,只有第一条被消费,其余被静默丢弃,表现为「按回车没反应」「手输默认值才能过」(空行 vs 内容行的差别只是雪上加霜)。本仓库自己的历史记忆「readline 管道驱动会丢行」(v2.4.1 E2E 为此绕道 `--answers`)正是同一个 bug,当时绕过而未根治。修复:新增 `scripts/lib/prompt.ts`——**`LinePrompt` 常驻 FIFO 行队列**,构造时挂唯一的 `'line'` 监听器,任何时序下零丢行;**EOF 视为裸回车**(返回空串→落到默认值),`printf '' | pnpm apply-template --dry-run` 可全程默认跑完,而 Proceed 门(默认 `false`)在 EOF 时仍安全中止。`apply-template` / `new-post` / `new-locale` 三个交互 CLI 全部迁移;apply-template 顺带收敛为单一 readline 实例(原「Proceed 确认框再开第二个 interface」的并列实例一并消掉)。*仓库自带教训闭环:交互式 CLI 管道驱动丢行,从「用 expect PTY 绕过」变成「修好管道驱动本身」。*
- **CHANGELOG 引用区 `[Unreleased]` 指针停在 v2.4.0**:v2.4.1 起连续 6 个版本漏更(与 v2.2.0 那次同源),本次随发版更新至 v2.6.2 并补 `[2.6.2]` 链接行。

### Added

- **`tests/prompt.test.ts` 7 条**:5 条 `LinePrompt` 行为钉死(单块多行不丢/先到后问不丢/空行交错/EOF 兜底/EOF 后余量)+ 2 条**静态契约**——三个 CLI 脚本禁止再直接调 `rl.question()`、必须走 `lib/prompt`(防止未来回退把 #12 悄悄带回来;LinePrompt 单测本身抓不住接线回退)。

### Changed

- **demo ja codes 页保鲜(issue #11 自动审计 P0)**:v2.6.0 把 en codes 页扩写并标 `lastModified: 2026-08-31` 时,ja 页停在 2026-08-23 没同步——次日自动审计单边红(「8d unverified」)。本次把 ja 页补到 en 的完整结构(兑换步骤+排障三例/奖励解读表+三条实读/代码来源三模式/花法优先级,内链全部 `/ja/` 前缀),`lastModified` → 2026-08-31,`pnpm refresh-audit` 回到 **0 items**。*教训:双语言 demo 的内容批必须两语言同步动 `lastModified`,否则保鲜审计必然单边红。*

### 验证

- 八门禁全绿(lint / typecheck / **test 104**(97 + LinePrompt 5 + 静态契约 2,suites 10)/ check-config / check-content / check-i18n `--strict-ui`(UI 134/134)/ build / check-links),另有 `pnpm refresh-audit` 0 items、`pnpm test:e2e` 真实模式绿。#12 修复经三通道验证:管道 17 行逐值落位、17 个空行(纯回车)全程默认跑完、expect PTY 交互回归。

## [2.6.1] — 2026-08-31

**Fork 路径加固批:回答「demo 能过,fork 用户能不能过」——用 CLI 真实模式完整模拟一次 fork(export→apply→build→产物体检),抓出并修掉五个开箱陷阱。全部由新增的 E2E 断言钉死防回归。**

### Fixed

- **联系页零联系方式**(信任页硬伤):CLI 只写 `social.official`,而联系页 Community 列表只渲染 discord/reddit/youtube——fork 用户第一天拿到的是**一个空列表**+正文写着 "reach out on Discord"(页面上没有 Discord 链接)。修复:`official` 渠道永远渲染;新增可选 `site.contactEmail`(site.ts 接口+demo 值+CLI 写出模板三处同步)渲染 mailto——不开任何社交渠道的用户填邮箱即可;硬编码 "reach out on Discord" 改为指向列表内渠道;"community-run wiki" 改 "fan-made wiki"。
- **CLI 模板残留虚假承诺**:site description 默认值 "Updated by the community."、codes 首页徽章 "Updated daily"、hero 描述 "tested daily"——fork 用户第一天的站就挂着兑现不了的日更/社区招牌(与 v2.6.0 demo 端修正同源,当时漏了 CLI 写出模板这层)。全部改诚实口径。
- **空 nav → fork 第一次 check-config 就红**:`rewriteLocaleJson` 原设计清空 nav/overview 让用户自己填,后果是 SiteHeader 渲染裸 key、**八门禁之一的 check-config 开箱七项全红**。改为按所选栏目自动填充 `nav.<key>` 标签 + `overview.<key>` 条目(英文默认值+固定键恢复,titleCase 与脚手架一致);用户要做的只剩翻译。
- **demo 语言文件残留**:选 `en,zh` 后 demo 的 `ja.json`(完整 Anvil Quest 翻译)原样留在 fork——身份泄漏,且 check-config 报「locale 文件存在但不在 routing.ts」。清理规范里「空语言 JSON 是无害孤儿」的说法**两处皆错**,已推翻:CLI 现在直接删除未选语言的 locale 文件。
- **wrangler.toml [vars] 重写锚点错位**:`/\[vars\]/` 匹配到第 7 行注释里的字样,替换块插进注释、真正的 demo Giscus 段原样留存(重复 [vars] 表+demo 身份泄漏+评论指向官方 Discussions);修复锚定行首。顺带修掉两个 JS 正则陷阱(`\Z` 在 JS 是字面量 Z 导致整段匹配静默失败;`m` 标志下 `$` 是行尾)——教训沉淀在代码注释里。demo 头部 FORKER 警示块重写后一并移除(内容已失真)。
- **DEMO_COVERS 清单漏 v2.6.0 新增 4 张封面**(按名删除清单未随内容批同步,fork 会残留 demo 封面);`setup.yml` rm 清单同步——两通道清单必须一致的铁律。

### Added

- **E2E 五条新断言 + check-config 步骤**:`nav/overview` 自动填充(en+zh 双语)、site description 无虚假承诺、wrangler 单 [vars] 段、零 demo Giscus 值、警示块已移除;`pnpm check-config` 在 fork 产物上必须绿——「fork 第一次 CI 就是绿的」从口号变成契约。

### 验证

- 完整 fork 模拟两轮(修复前后各一):修复前 check-config ❌ 7 项 + template-audit ❌ 9/11;修复后 **check-config ✅ 0 问题 + template-audit ✅ 11/11** + E2E 全断言绿。八门禁全绿(lint/typecheck/test 97/check-config/check-content/check-i18n/build/check-links)。

## [2.6.0] — 2026-08-31

**Demo 内容整备批:依据 seo.web.cafe AdSense 预检报告核查整改——9 篇 wiki 文章全部达到 800-1500 词深度(新增 4 篇含 items 分类),页脚补齐 Contact 信任页入口,ads.txt 内置就绪授权行,不实「社区每日更新」文案改诚实。⚠️ 面向 fork 用户的两处行为说明:页脚新增 Contact 链接(fork 受益)、footer UI 键 +1(en/ja 已同步)。**

### Added

- **4 篇全新成型内容页(800-1200 词,均带 gen-covers 封面 + 作者署名)**:`items/forging-materials-guide`(全材料出处/刷新时间/周常 farm 路线——**空 `items` 分类就此补齐**,v2.4.0 的 noindex 兜底不再是常态)、`items/emberforged-armor-set`(五件套造价/套装加成数值/与混搭装对比)、`bosses/frostbound-monarch`(Act 3 门槛 Boss:暴风雪叠层/罗盘火盆机动/Shatter 破甲机制,与 Stormcaller 构成元素镜像——火武器自此有实战归宿)、`guides/forging-guide`(锻造五阶/附魔重骰期望 11 次出满值/分解返还 60% 宝石的套利数学)。
- **5 篇既有文章扩写到 800-1284 词**(原 170-665 全部不达标):codes 页补兑换排障/奖励价值分析/码源规律/过期码保留策略;Emberfang 补战前清单/备选配装/FAQ 手风琴/刷本经济;Stormcaller 补逐分钟时间轴/双打路线;beginner guide 补设置优化/金币经济/FAQ;武器 tier list 补测试方法论/元素覆盖表/每把武器的升级路径。全部配结构化 H2/H3 + 表格 + FAQ 手风琴 + ≥3 站内互链(内容簇)。

### Fixed

- **页脚信任页缺口**(预检 ADS-UX-05):`SiteFooter` legalLinks 缺 `contact`——联系页自 v1.x 就存在且在 sitemap 里,页脚却无入口;补上并新增 `footer.contact` UI 键(en/ja)。
- **ads.txt 注释升级为就绪行**(预检 ADS-TXT-01/PUB-09):原注释只说「替换你的 ID」,现在直接内置 `# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` 标准行——过审后删一个 `#` 填 16 位 ID 即生效;注释同时写明「未过审保持注释态才是正确的」(占位 pub-ID 是无效数据行)。
- **「Updated daily by the community」不实文案**(预检 ADS-PUB-05 证据之一):en/ja 两处站点描述改为「逐篇标注最后验证日期」的诚实口径——demo 无社区,虚称社区更新恰是审核员一票否定的身份失真。

### Demo AdSense 预检整改对照(seo.web.cafe 报告 → 本批动作)

| 预检发现 | 核查结论 | 本批动作 |
| --- | --- | --- |
| ADS-CONTENT-01/02/03 薄内容(Blocker) | ✅ 属实:5 篇文章 170-665 词 | 9 篇全部 800-1284 词 + 4 篇新页,零薄页 |
| ADS-PUB-05/UX-02 身份漂移(Blocker/High) | ⚠️ demo 特有:landing/手册/页头模板入口 fork 时整体移除(apply-template 删除清单),fork 站无此问题 | 虚假 community 文案已修;demo 本体不建议申请 AdSense(展示站) |
| ADS-TXT-01/PUB-09 ads.txt 无 Google 行(Blocker/High) | ⚠️ 设计使然:过审前不可能有 pub-ID | 就绪行内置,过审后一行启用 |
| ADS-UX-05 缺 Contact 页脚链接(Medium) | ✅ 属实:页有链无 | 已修 |
| ADS-CONTENT-08 门页风险(Medium) | ✗ 不成立:列表页链接的全是实文页,内容批次后每个 URL 有正文;首页标题为栏目枚举非堆砌 | 内容深化间接缓解 |
| ADS-PRIV-04 无 CMP | ⚠️ 误测:CookieConsent 存在,`gaId \|\| adsenseClient` 配置即渲染并门控广告加载;demo 未配 env 故工具不可见 | 无需修改 |

**八门禁全绿**(lint / typecheck / test 97 / check-config / check-content / check-i18n --strict-ui 134/134 含新 contact 键 / build / check-links,sitemap 101→120 URL)。

## [2.5.1] — 2026-08-31

**AdSense 审计实证批:按 `/anvil-adsense-audit` 技能对 demo 站(anvilwiki.pages.dev)跑了一次 22 项全项体检——裁决 Not ready(demo),但全部缺口都在内容经营侧(篇数/时效/空分类/免费域名),模板机制层零 Fail;据此实证修正技能两处判定基准,并把清单落成 docs/ads.md 速查规范。**

### Fixed

- **技能判定基准两处按实证原地修正**(「结论被推翻就在原地改」):① AD-17「隐私政策是否提到广告 cookie」原写为"模板只保证有页面、内容是 fork 用户责任、Fail 重灾区"——实证 `LegalContent.astro` **正文内置**了 Google AdSense 广告 cookie 披露段(法律五页是代码层组件而非空壳路由,fork 用户不改代码就不会丢),线上 `/privacy-policy/` 渲染确认;改为模板已解决项,默认 Pass,仅当改写过 LegalContent.astro 才复查。② 「模板已解决」表同步补披露段证据位置;AD-08 空分类判定维持(v2.4.0 noindex 兜底在,但申请期导航挂空分类仍是未完成信号)。

### Added

- **docs/ads.md 新节「申请 AdSense 前的体检:22 项 AD-\* 清单」**:六组速查表(资格/内容/技术/体验/隐私/时机 + 各组高频 Fail 项),canonical 清单归 `/anvil-adsense-audit` 技能维护;附 **demo 站审计基线实例**(机制层全 Pass,Not ready 仅因 5 篇英文文章 <15、codes 页 8 天未更新、`items` 空分类、pages.dev 域名——四项正是 fork 用户申请前自己要补的内容经营功课),让 fork 用户有对照样例。

### Audit record(2026-08-31,demo 站)

- **证据**:`refresh-audit` P0×2(codes 页 en/ja 均 8 天未更新);en 已发文 5 篇(bosses 2/codes 1/guides 2)、ja 2 篇;navigation 含 `items` 分类但 `src/content/wiki/*/items/` 目录不存在(列表页 noindex+sitemap 缺席验证:dist sitemap 101 URL 中 items 出现 0 次);`wrangler.toml` AdSense 变量全部注释(申请期零广告)、`affiliates.ts` 默认空;playwright 线上抽查 `/privacy-policy/`(含 AdSense 披露)、`/bosses/emberfang/`、`/sitemap-index.xml` 均 200。
- **裁决**:**Not ready**(demo 作为申请主体);Blocker×2(AD-01 免费子域 / AD-03 篇数 5<15)、High×2(AD-06 codes 时效 / AD-08 空分类),其余 18 项 Pass/N-A——**模板机制层没有需要修的 Blocker**,缺口全部属于 fork 用户的内容经营功课(已由 game-selection.md 与学习手册第 4 章覆盖方法论)。

## [2.5.0] — 2026-08-31

**生态技能吸收批:向两个开源技能项目致谢并吸收其方法论——新增 AdSense 申请前体检技能(灵感致谢 yantoumu/adsense-site-auditor-skill,清单为模板特化重写),选品文档引入机会判决框架(参考 yan-labs/yan-skills 的 game-opportunity,MIT),外链章补验证纪律。零代码行为变更(仅 landing footer 渲染致谢行,该层 fork 时整体移除)。**

### Added

- **`/anvil-adsense-audit` 技能**(`.agent/skills/`,随模板分发给 fork 用户):按 Google 官方政策(计划政策/发布商政策)对站点做 AdSense 申请前逐项体检——22 项 AD-\* 清单四态判定(Pass/Fail/Unknown/N/A)+ Blocker/High/Medium 分级 + 完整性门(收尾数项,少一行即未完成)+ Blocker 未清零不许建议提交。AnvilWiki 特化:模板已解决项(ads.txt 占位/法律页路由/env 门控零广告/noindex 空分类)预填证据直接核对,审计火力集中在 fork 用户侧(内容原创度/隐私页广告 cookie 声明/过期码/空分类);主动提示模板已知缺口(自带无 robots.txt,用户自加时不得挡 `Mediapartners-Google`)。审计框架受 [yantoumu/adsense-site-auditor-skill](https://github.com/yantoumu/adsense-site-auditor-skill) 启发(该仓库无 LICENSE,未复制其文本,清单自 Google 公开文档重写),文末致谢。
- **选品判决框架**([docs/sourcing.md](docs/sourcing.md) 第四节,并从 [game-selection.md](game-selection.md) 第 3 层互链):搜索需求轨七项打分参考表(量/KD/SERP 弱位/趋势/意图/供给/交叉)+ KD 分档动作表(<20 直进 / 20-39 新站主战场 / 40-49 深查触发线 / ≥50 不做主攻)+ 早期爆发轨(新游无搜索量时看传播信号)+ 两条防自欺判据(**平台内流量 ≠ 独立需求;未测 ≠ 零**)+ 新词第 3/7/14/28 天复查节奏(决策管理表加「下次复查日」列,候选池不再堵死)。框架参考 [yan-labs/yan-skills](https://github.com/yan-labs/yan-skills) 的 game-opportunity 技能(MIT,有裁剪改写),节末致谢。
- **外链验证纪律**([docs/seo.md](docs/seo.md) 外链章新节「怎么验证外链真的生效」):已提交 ≠ 已公开 ≠ 已收录三态台账 + 公开页两暗坑(跳转计数链/`rel` 属性核对)+ 现实校准(743 条社区清单实测仅 5.5% 可直接提交、两成死站)+ 推荐 yan-skills `backlink` 机读提交入口库(MIT,持续实测回写)作为最新数据源。
- **手册证据落盘纪律**(中英同步,零 tldr 改动):第 7 章 enable-ads「懒人通道」小节接 `/anvil-adsense-audit`(口头「应该没问题」不算过,有 Blocker 别交申请——被拒记录跟着账户走);第 8 章 weekly-ops「复盘纪律:只认面板上的数」(结论要有出处/动作不是成果/旧结论被推翻当场改口)。
- **致谢三处**(中英同步):README 中英两区「致谢 / Credits」段;官网落地页 footer(en/zh)新增致谢行(`landing.ts` footer 接口加 `creditsLabel`+`credits` 字段,`LandingLayout.astro` 渲染——fork 时 landing 层整体移除,fork 站不受影响);docs/README.md 新增「致谢」节。

## [2.4.1] — 2026-08-31

**CLI 真实模式 E2E 加固批:合并首个外部代码贡献(PR #10),并全仓同类排查清掉 apply-template 的真实模式 bug 全家——它们全部只在非 dry-run 模式触发,而测试套件对该 CLI 零覆盖、demo 仓永远不跑它,故八个门禁全军漏过。**

### Added

- **`apply-template --answers answers.json` 非交互模式 + CI E2E job**:CLI 的 bug 全部只在真实(非 dry-run)模式触发,而测试套件对该 CLI 零覆盖、demo 仓永远不跑它——三个真实模式 bug 因此全部漏过八道门禁(PR #10 ENOENT、home 模板 schema 漂移、authors 虚报)。新增 `pnpm test:e2e`(scripts/e2e-apply-template.mjs):`git archive HEAD` 导出模板到临时目录 → 真实模式跑 CLI(--answers 驱动,与交互走同一 ask/askBool 路径)→ 断言输出形态(landing 删净/meta/CTA 字段类型)→ **对产物跑完整 build**(fork 用户的第一闪构建必须成功);CI 新增 `e2e-template` job 跑它,workflows.test.ts 钉契约防删。

### Fixed

- **`apply-template` 真实模式删 landing 目录 ENOENT 崩溃**(社区 PR #10, oyjq0000):`removeLandingPage()` 先 `rmSync` 删目录再 `readdirSync` 同路径数条目,非 dry-run 必抛 ENOENT 中断初始化(dry-run 不触发、测试套件零覆盖该 CLI,故自 v1.12 存活);改为先计数后删除,dry-run 行为与计数不变。
- **`apply-template` home 模板 schema 漂移——fork 首次 build 必崩**(全仓同类排查发现,同属「仅真实模式触发」的 CI 盲区):CLI 写出的 `home.meta` 仅 `{watermark}`(无 title/description),`HomePage` 将 undefined title 传入 BaseLayout 的 `title.includes()` 崩溃;`hero.ctaPrimary/ctaSecondary`、`closingCta.primary/secondary` 写成 `{label,href}` 对象而组件按字符串渲染。模板全量对齐 demo `en.json` 形态(meta 补 title/description、四处 CTA 改字符串、`start.cards` 补 `number`、popular 标签首字母大写、移除无消费者的 watermark);`HomePage.astro` meta 改逐字段兜底(`home.meta?.title ?? site.name`),单一坏字段不再炸构建。新增 E2E 验证:codes/guides 双预设真实模式(expect 驱动)跑通 + 产物 build 全绿。
- **`apply-template` authors.ts demo 清理虚报成功**:demo 作者正则不匹配时也打印 ✅,改为仅在确实移除时输出。

## [2.4.0] — 2026-08-29

**三站踩坑复盘加固批:依据《Aniimo / No Man's Sky / Steal An Egg 三站生产事故复盘》(48 类问题)对照模板全量审计,落地 16 项缺口修复。⚠️ 含一个行为变更(trailingSlash `never`→`always`),fork 站合并本批后需全站内链跟随翻转(check-content 新规则会拦)。**

### Changed

- **尾斜杠策略全站翻转为 `trailingSlash: 'always'`**(复盘 #8,三站共识终态):Cloudflare Pages 以 `/path/` 提供目录式构建,旧 `never` 下 canonical/sitemap/内链全部多一跳 308、自述权重信号打偏。同步翻转全部触点:`src/lib/url.ts` localizePath(全站 path 构造唯一龙头,root 特判反转);astro.config sitemap filter/serialize 统一 strip 归一化(lastmod/noindex/hreflang 查找键为无斜杠形态)+ alternates 输出带斜杠;Pagefind 搜索结果 processResult 从「剥斜杠」反转为「保斜杠」并删除子结果点击拦截器;SiteHeader 导航高亮 `startsWith(path + '/')` 归一化(斜杠态下拼出 `//` 会静默杀死子页高亮);`handbook.ts` handbookPath、llms.txt、BaseLayout privacyHref、LegalContent、SiteHeader `/landing` 链接、`landing.ts` 46 处硬编码内链(en+zh)全部补斜杠;demo 文章内链迁移 + 各篇补足 ≥3 条内链;`_redirects` 反向重定向明确禁用(模板期曾无限循环)。
- **空分类/空语言列表页 noindex + 移出 sitemap**(复盘 #13):ListPage 空态自动 `noindex`(LocaleLayout 既有通路);astro.config 新增 categoryCoverage(fs 扫描),(分类×语言)零文章的列表路径进 noindexPaths;列表页 hreflang alternates 从「无条件全语言」改为按真实 MDX 覆盖,页面级(sitemap 同源 `localesForCategory()`)与 sitemap 级一致——Google 会丢弃冲突的 hreflang 簇,两侧必须同真相。配套硬规范「新建分类必须先有文章再进 navigation.ts」写入 content-format.md 与 AGENTS.md。
- **文章级 FAQ frontmatter 字段**(复盘 #12):可选 `faq: [{question, answer}]`,渲染为可见 `<details>` 区块(原生零 JS)并与 codes FAQ 合并为**单个** FAQPage JSON-LD(一页一个;markup 必须可见,符合 Google 富结果政策);新增 `shared.faqTitle` i18n 键(en/ja)。
- **智能标题后缀**(复盘 #11):`pageTitle()` 三分支——title 已含游戏名(`site.game.name`)不加后缀、>50 字符用短后缀 `site.shortName`(关键词留在 SERP ~60 字符窗口内)、否则全名;BaseLayout 后缀守卫同步检查全部三个身份名,杜绝双重拼接。NMS 实测旧写法 76-86 字符 title 被后缀挤出展示窗。
- **相关文章三层兜底**(复盘 #15/#44):tags 交集 → 同分类补足 → 全站最新(仅在零匹配时,无关文章的「相关」比没有更糟);选择逻辑下沉 `lib/content-utils.ts` 纯函数(vitest 可测),Aniimo 曾 54/56 篇因 tags 单层匹配零关联。
- **Adsterra 教程改写为 iframe 隔离模式**(复盘 #33/34/36):docs/ads.md「脚本粘哪里」整节重写——每广告位独立 `public/ads/*.html`(防 `window.atOptions` 全局串号)+ iframe `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"`(缺 allow-same-origin 素材空白;**绝不加 allow-top-navigation**,防移动端创意劫持整页跳转);新增「怎么验证广告真的在展示」(只信手机 4G 实测 + 后台 Impressions;无头浏览器 403 是反自动化检测非故障)。
- **twitter:card 非文章页 `summary`→无条件 `summary_large_image`**(复盘 #10):全站 og:image 均 ≥1200 宽(hero 1200×630 / 封面 1200×675),全局大卡分享不再被压成小条。
- **footer 版权行与免责声明分开渲染**(复盘 #44 同款短路):`copyrightText ?? legalNotice` 改为两行各渲各的——apply-template 重写 copyrightText 后 fork 站不再丢失免责声明;footer 补 `/recent` 与 `/tags` 入口(复用 `shared.recentTitle`/`allTags` 现成键,零新增 i18n;两页此前为零内链孤儿页)。

### Added

- **`pnpm submit-indexnow`**(复盘 #16/Q15):读 `dist/sitemap-index.xml` 递归展开全部 URL,按 10,000/批 POST `api.indexnow.org`;密钥自动检测/生成(`public/<key>.txt`,hex 文件名=内容,IndexNow 协议密钥本就公开);首次运行生成密钥后提示「提交+部署再重跑」;`--dry-run` 零副作用。手册第 6 章双语新增「第 4 步:用 IndexNow 把全站网址推一遍」。
- **`pnpm gen-assets`**(复盘 #26):按 globals.css 实时品牌色生成 favicon 全套(favicon.svg + 16/32/180/192/512 PNG,satori+Resvg,CJK 首字母经 Noto 子集)+ hero.webp(1200×630 品牌渐变+站名,sharp 转 webp)+ manifest theme_color 同步——**写入现有文件名,零引用改动**;hash 缓存放 node_modules/.cache(不进 git 不进部署产物);favicon.ico 因 sharp 不支持 ICO 有意保留不引用(BaseLayout 改指 svg+png)。fork「demo 铁砧图标上线」事故从根上关闭。
- **check-content 新规则 5/6**:非默认语言正文内链必须带语言前缀(`error` 级——ja 正文裸 `/guides/x/` 静默跳英文页,Aniimo 177 处事故);正文站内链接 <3 条出 `warning`。
- **deployment.md 三块防事故内容**(复盘 #1/#45/#4):「一个站只允许一个部署源」🚨 警告(NMS 双仓库互相覆盖生产事故)、「先绑域名→改 SITE_URL→再部署」顺序铁律、Crawler Hints + IndexNow 上线日推送;content-format.md 新增关键词密度指引(游戏名 1-3%,模板默认标题堆到 5-6% 属堆砌)+ ≥3 内链规则。
- **.gitignore 密钥模式**(复盘安全守则):`*-secret.json`/`*.pem`/`*.key`/`seo-reports/`,建站期即生效而非出事再补。
- **手册第 6 章双语新增 GSC「网页索引」四状态灯速查**(已编入/已发现-未编入/已抓取-未编入/已排除)。

### Fixed

- **rss.xml.ts / check-links.ts / SearchButton 等处陈述 `trailingSlash:'never'` 的注释全部随翻转更新**(否则误导后续维护);skills(anvil-new-article / anvil-batch-articles)内链写作规则口径同步反转;AGENTS.md authoring 硬规则新增「Body link rules」条目、命令清单登记两个新脚本、分类约束补「先有文章再进导航」。
- **复盘认定不动的项**:StickyBanner 桌面端 sticky 设计保留(复盘 #37 针对的是 Adsterra 320×50 移动条桌面误显;本模板为 728×90 桌面 leaderboard + dismiss + CLS 预留 + 移动端明确排除,场景不同源)。

## [2.3.1] — 2026-08-27

**紧急修复批:根除 `tailwind.config.mjs` 在 ESM 文件内误用 CommonJS `require()` 的开箱即炸地雷。单文件级修复,fork 常规 merge 即得。**

### Fixed

- **`tailwind.config.mjs` 插件行改纯 ESM 写法**:第 76 行 `plugins: [require('@tailwindcss/typography')]`(CommonJS `require()` 出现在 `.mjs` 纯 ESM 文件里,自 v0.1.0 就存在)改为顶部 `import typography from '@tailwindcss/typography'` + `plugins: [typography]`。根因链(Windows fork 用户下载 ZIP 后 `pnpm dev` 报障实证):Tailwind 3.4 配置加载器先试原生 `require(config)`、同步抛错才回退 jiti(jiti 会给模块注入 `require`,缺陷因此被长期掩盖);但在部分 Node 构建(require(esm) 路径)上,被原生 require 的 ESM 模块内部抛出的 ReferenceError 以异步 unhandledRejection 上报而非同步 throw——catch 接不住,dev server 启动一切正常、浏览器首次请求页面触发 CSS 处理时炸出 `Unhandled rejection: require is not defined`(Astro 错误 overlay)。本机(Node 22.23)最小复现为同步抛出被 catch 救回,与用户环境的行为分岔即解释了「为什么我们一直没炸」。修复后两条加载路径(jiti / require-esm)均干净求值;经双路径最小复现脚本 + `pnpm build` + typecheck(0 错)+ lint + test(9 套件 89 用例)+ dev 冒烟(首页 HTTP 200、无 rejection 日志)全绿验证;全仓扫描确认无其他 `.mjs` 含 `require()`,文档无旧写法引用。

## [2.3.0] — 2026-08-26

**新手动线优化批:README 按零基础标准重构、落地页转化动线修复(Fork 直达 + 站内链接)、仓库文档漂移清理。含少量代码变更(landing 文案层 + HandbookHub),fork 常规 merge 即得。**

### Changed

- **README.md 全面重构(新手动线三硬伤修复)**:快速开始新增 pnpm 一行安装前置(此前新手第一条命令就 `command not found`)、补上缺失的「push 回你的 fork」步骤(此前第 3 步改完直接跳 Cloudflare,连到的仍是 demo 远端)、新增零终端路径旁路(fork → Actions → Initialize AnvilWiki → Run workflow——专为不会编程人群设计的通道此前从未在 README 出现);wrangler.toml 技术警告从第一屏下沉到部署步骤提示框(SITE_URL 已由 apply-template 写入 `[vars]`、dashboard 同名变量被忽略的因果首次讲清);特性区长句压缩为每条 ≤2 行 + 细节链接化(content-pipeline/multi-site/ads);文档导航 11 行表收敛为 4 入口(站内文档中心 / docs/README.md 全索引 / requirements/ / PRD),消除与 docs/README.md 的双头漂移;英文区新增快速链接表与中文区逐节对齐(此前英文文档导航比中文少 4 项,恰好漏掉 v2.1/v2.2 的变现/挖词文档);新增语言切换锚点、首屏 demo 截图(此前零截图)、中文区 License 行、尾部 Contributing & Changelog 入口(两文件一直存在但零链接)。
- **落地页转化批(中英同步)**:hero 与 FinalCta 主 CTA 改为直达 `github.com/PNGTRID/AnvilWiki/fork`(此前整页无 Fork 按钮、主 CTA 只是页内锚点,核心转化动作被降级);docsEntry SEO 卡与 DevGuide 五步链接全部从出站 GitHub 改为站内手册对应章(第 3/4/5/8 章,不再把访客半途送离官网);landing.ts 写死的 6 处手册章数移除(Hub 卡片本就动态计算,永不漂移)、「stars 仍是两位数」时效措辞中性化(星数破百即成不实陈述);公告条压缩到一行;hero 副标题双语压缩(hero 截图链接复用 tertiaryCta,故 tertiary 保持指向 Demo)。
- **手册小修**:`templatize-your-site` 与 `sync-and-contribute` 两章「下一步」补 markdown 链接(zh/en,此前为纯文本);HandbookHub 文档中心新增「完全零基础?从学习手册第 1 章开始」start-here 胶囊(landing.ts 接口 + en/zh 数据 + 组件三处联动,新增 `beginnerHint` 字段)。

### Fixed

- **仓库文档漂移清理(专家团三线审计产出)**:`Comments.astro` 头注释指向已不存在的 v1.4 spec 改指 `docs/comments.md`;PRD §15.2 文档策略表 7→20 项补齐(v2.1/v2.2 新文档全部入表);`docs/roadmap.md` 版本头 v2.0.1→当前版;`docs/ROADMAP-v1.5-v1.6.md` 归档至 `docs/superpowers/`(docs/README.md + PRD 两处引用同步);AGENTS.md Status 头「v2.0.0 released」开头漂移修正为标明当前最新版;`landing.astro` 头注释节序编号修复(两个 6)。
- **README 徽章与按钮修正**:删除指向上游仓库的 Deploy to Cloudflare 按钮(未 fork 的新手点它会部署官方 demo 且走 Workers 流程,与快速开始的 Pages Connect 路径无任何说明地并存);Docs 徽章从中文文档中心改链英文站(国际访客不再落地中文页);`#5-分钟快速开始` 锚点保留,deployment.md 反链不受重构影响。
- **CHANGELOG 引用区补漏**:`[Unreleased]` compare 行停在 v2.1.1(v2.2.0 发版时漏更),补 `[2.2.0]` 行并随本次更新至 v2.3.0。

## [2.2.0] — 2026-08-26

**变现 + 外链实操文档批:广告链路三教程(AdSense 收款 / Adsterra 接入 / 平台全景含游戏垂直四家)+ 外链九渠道操作层。零代码变更,fork 常规 merge 即得。**

### Added

- **`docs/ads.md` 新增「AdSense:让钱真正进你的银行卡」完整教程**:三道验证逐个拆开——W-8BEN 税务表(个人 + 国家选中国 + 勾「申请税收协定优惠」Royalties 条款 = 协定税率 10%,不交默认预扣 30%)、地址 PIN 明信片($10 触发、平信 2-4 周、4 次寄送机会、生成后 4 个月未验证暂停广告展示、4 次用尽走人工验证)、KYC 身份验证(姓名用汉字而银行收款人用拼音,两处不一致是正常的);电汇绑卡(收款人拼音 + SWIFT 码 + 普通储蓄卡即可 + 开自动付款);出账节奏($100 起付、每月 21 日打款、1-3 工作日到账、当月 20 日截点);到账后手机银行结汇。动机:最亏的翻车剧本是攒到 $100 才发现 PIN 没验证、付款挂起。
- **`docs/ads.md` 新增「Adsterra 接入:从注册到广告上线」教程**:注册加站 5 步(分钟级自动审核、零流量门槛、三种被拒原因:违法成人/误导/采集拼凑)+ 五种广告格式取舍表(Banner 首选 / Direct Link 零成本灵活 / In-Page Push 可选补充 / Social Bar 流量大了再试 / Popunder 禁用)+ **与 AdSense 共存红线**(Google 广告投放位置政策:挂 AdSense 的站不允许触发 popunder——哪怕弹出的页面里没有 Google 广告也算违规;共存只开 Banner / Direct Link / In-Page Push,别做成 AdSense 同款样式,全页广告总数 ≤4-5)+ 脚本粘贴位置(全站格式粘 `BaseLayout.astro` `<head>` 同 Clarity 一位一法、Banner 进 `ArticlePage.astro` 指定槽位、模板 3 个 AdSense 位零改动互不干扰)。
- **`docs/ads.md` 新增「广告平台全景:起步/进阶/成熟三档」**:七平台阶梯表用 2026-08 调研快照——起步主力 AdSense、备胎 Adsterra + PropellerAds/HilltopAds(约 $20-100 起付按方式);进阶 Journey by Mediavine(2026 年起门槛降到 1,000 sessions/月 + GA4 + 原创内容,发布商约七成分成)、Monumetric Propel(10,000 pageviews + 一次性 $99 安装费 + NET-60,小站先算账);成熟 Mediavine 主产品(改年广告收入 $5,000+ 门槛,取消 5 万 sessions)、Raptive(25,000 pageviews,原 10 万)+ 管理型平台申请制四步(先装 GA4 → 如实填 → 按邮件指引接入 → 切换=换主力不是叠加)+ 三条铁律(同一时期主力只挂一家/门槛起付数字会变申请前核对官方页/Ezoic 接管 DNS 与 Cloudflare Pages 架构冲突明确不推荐 + Media.net 偏美英加金融流量不匹配)。
- **Adsterra 收款节起付信息对齐官方 2026 口径**:USDT(TRC-20)$100、Paxum $5、PayPal $25、本地货币 $25、wire 默认 $1000 + 手续费、**前两笔付款所有方式放宽到 $20**;两条主路线(USDT/OKX 与 Payoneer)流程不变。
- **学习手册第 7 章双语新增「第三步:通过审核后,先把收款三件事办了」**(zh/en):W-8BEN/PIN/电汇三件事操作级概要 + 出账节奏,指向 ads.md 逐步细节;tldr「两步走」改「三步走」(zh 168 / en 354 字符,均低于 480 上限);「卡住了怎么办」补「PIN 明信片一直没到」(4 次寄送机会 + 官方人工验证通道);「先说时机」节的 ads.md 引用描述随新范围更新(时机/收款/Adsterra 接入/平台全景)。
- **全仓描述一致性同步**:docs/README.md 三处(文档索引表 / 路径 A 学习路线 / 问题路由图)+ README.md 文档导航一处,ads.md 描述统一为「广告时机 + AdSense 收款 + Adsterra 接入 + 平台全景三档」。
- **`docs/ads.md` 平台全景节补「游戏垂直网络」层**(全网调研批):全景表从 7 家扩到 11 家,全部平台名挂官网直链(AdSense/Adsterra/PropellerAds/HilltopAds/Journey=journeymv.com/Monumetric/Raptive/Mediavine + 新增 4 家)——新增 **NitroPay**(Overwolf 旗下,100k PV 门槛可人工批、发布商 80% 分成、NET-7 全行业最快档,官方定位原话 "niche gaming wikis")进阶·游戏垂直档,新增 **Venatus**(约 150 万 PV + 20% Tier-1,客户 Rovio/EA/OP.GG——游戏工具站同画像)、**Playwire**(约 100 万 PV + 英语流量,案例 Raider.IO)、**PubNation**(Mediavine 旗下游戏/体育/科技排他线,游戏站申请 Mediavine 会被主动转介至此)成熟·游戏垂直档;新增「游戏垂直网络:你这类站的隐藏加分项」小节(游戏受众 CPM 天生偏低的定价逻辑 + NitroPay RPM 下滑社区报告的"先并行测试再切换"实操 + Snigel/Freestar 同量级小注 + AdInPlay 偏页游门户不进表)+「游戏 wiki 站的分阶段路线」五档表(0-1k/1k-10k/10k-100k/100k-100 万/100 万+,含 RPM 锚点:突破靠 Tier-1 占比与竞价密度,不是多挂几家);「进阶/成熟档怎么接」扩为含全部垂直网络的申请制说明。
- **`docs/seo.md`「外链策略」章从策略层扩到操作层**(章标题同步扩为「什么时候做、做多少、去哪找、怎么接」):新增**九渠道优先级清单表**(Reddit 回答式/Steam 社区指南/Discord 资源频道/DR 换链/YouTube 小创作者/资源页收录/断链替代/HARO 询源/目录站兜底,各标链接属性+成功率,附 nofollow 价值注解:游戏社区链接多为 nofollow 但带来精准玩家流量)+ **逐渠道操作步骤**(Reddit 10% 全站规则与 1-2 周养号姿势/答案先于链接铁律、Steam 指南写作要点与「开发者自推受限但第三方攻略站不受限」辨析、Discord 版主收录路线、YouTube 小创作者换挂的价值锚点、资源页 Google 搜索操作符组合、断链替代工作流)+ **三份英文 outreach 邮件模板**(换链/资源页收录/断链替代,照抄改)+ **免费工具箱表**(Ahrefs Backlink Checker/Broken Link Checker/Hunter.io/搜索操作符)+ **「多久做一次、做多少」节奏节**(outreach 每周 1-2 小时发 10-20 封逐封改过的邮件、社区类一周带链 2-3 次守 10% 规则、每周新增 3-10 条健康曲线 vs 暴涨=作弊信号)。调研校准:HARO 2024-12 被 Cision 关停、2025-04 由 Featured 收购在 helpareporter.com 复活(免费),游戏垂类询源少如实标低优先级;Reddit 10% 自推规则为全站口径非单社区;手册第 11 章双语引用句随新范围同步。

## [2.1.1] — 2026-08-26

**手册同步批 + 初始化清理规范批:v2.1.0 的仓库文档层喂进站内学习手册(7 章双语),fork 初始化的删除清单首次文档化并修两处通道漂移。章数不变(learn 11/dev 7)、提示词 18 不变。**

### Added

- **学习手册第 7 章新增「统计三件套」完整接入教程**(zh/en):选型对比表(Cloudflare Web Analytics 无 cookie 必装 / GA4 同意横幅门控可选 / Clarity 热力图链第 8 章)+ CF Web Analytics 2 分钟步骤(Analytics & Logs → token → `PUBLIC_CF_BEACON_TOKEN`)+ GA4 10 分钟步骤(建媒体资源 → 数据流拿 `G-` 衡量 ID → `PUBLIC_GA_ID` → 点同意 → 实时报告验证),含「装完没数据」两大坑(GA 是 CookieConsent 点同意后才加载、报表 24-48h 延迟);开发手册「功能开关」章变量总表后补教程交叉引用。此前 GA/GSC 只有变量开关说明、无操作级教程(GSC 整章在第 6 章本就有,GA 是补齐)。
- **站内学习手册 7 章双语同步**(zh/en 各 7 文件,`updated` 2026-08-26):第 1 章发现层接 `docs/sourcing.md`(9 渠道操作指南+选词决策管理表)、第四关补「意图满足度」信号(第一页位置满 ≠ 没机会);第 4 章素材步接 `requirements/` 两张准备表(事实来源+对标参考)、新增「多少篇算够:首版 10-15 篇分批放」结论;第 6 章补上线 3-7 天首次数据复盘指引;第 8 章动作三升级为**四条及格线指标表**(CTR≥2%/每日点击 1000 目标/人均浏览≥1.5 页/每周新增 10+ 只加不改)+ 新增 Clarity 免费热力图小节(装一次每周看 5 分钟);第 10 章第 3 步补「翻正节奏」(生成可 40-60 篇、上线首版 10-15、每周 10+);第 11 章新增「外链:什么时候做、做多少」节(弱竞争期质量>外链、两阶段、DR 换链、别买垃圾外链);第 7 章「先说时机」随 v2.1.0 已就位。
- **`docs/apply-template.md` 新增「初始化清理规范」章节**:fork 后两条初始化通道(`pnpm apply-template` / Actions Initialize workflow)的完整删除清单表(demo 文章+配图按名删、项目官网含站内文档中心、wrangler demo 凭据、demo 作者)、保留不删清单(二进制资产/handbook markdown 源)、逃生口旗标(`--dry-run`/`--no-clear-content`/`--keep-landing`)与 `pnpm template-audit` 事后体检——此前该规范只存在于代码注释里,fork 用户读配置手册看不到。

### Fixed

- **`setup.yml` 中文官网删除路径收窄**:`rm -rf src/pages/zh` → 精确删 `src/pages/zh/landing.astro` + `src/pages/zh/landing`,与 `apply-template.ts` 的 `LANDING_PATHS` 逐项对齐。原整目录删除今天恰好等价(该目录只有 landing 文件),但属潜在漂移:模板未来在 `src/pages/zh/` 下加任何真实页面都会被 workflow 误删。
- **`apply-template.ts` 重置的 wrangler `[vars]` 与 setup.yml 对齐**:CLI 版 newVars 补 `PUBLIC_CF_BEACON_TOKEN = ""` 与 AdSense/GA/GSC 注释槽——两条初始化通道产出的 wrangler.toml 从此逐行一致(此前 CLI 走一遍会静默丢掉 beacon 行和可选槽注释)。

## [2.1.0] — 2026-08-26

**SEO 实战文档批:社区实战经验落库(挖词渠道/外链策略/内容准备模板/数据复盘/广告时机与收款)。零代码变更,模板架构与依赖不动——fork 常规 merge 即得。**

### Added

- **`docs/sourcing.md` 挖词与选词完整指南**:9 个挖词渠道按优先级(SteamDB 趋势图实操/社媒低粉异常值/聚合站 sitemap 扫描/趋势时下流行/开发者追更/经典爆款二创/预告游戏埋伏/Similarweb·SEMrush 循环打法/AI 类游戏新赛道)+ 第 7 条选词判断「意图满足度」(搜索意图未被 SERP 满足 = 强可做信号)+ 选词决策管理表(做/不做/考虑,【考虑】隔天复判);`game-selection.md` 四层漏斗互链接入。
- **`docs/seo.md` 新增「外链策略」章节**:外链 ≈13% 权重但弱竞争新词期页面质量/体验/停留时长优先(个位数外链胜几千外链实战案例)、两阶段策略排序(排名没起来先内容)、DR 换链 + 人肉确认后批量发实操、垃圾外链警告。
- **`requirements/` 内容准备模板**:`00事实来源.md`(AI 按页面矩阵联网调研生成事实来源表,来源含竞品分析 + YouTube 字幕,E-E-A-T 凭证)+ `00对标参考.md`(1-3 个对标站四维拆解:首页结构/内页结构/广告位布局),建站前素材工作区,与「AI 不编造游戏数据」规则闭环。
- **`docs/deployment.md` 新增两节**:「上线后的数据复盘(3-7 天)」指标表(CTR ≥2% 合格/每日点击 1000 目标/人均浏览 ≥1.5 页 = 内链线/每周新增 10+ 内页只加不改)+ Microsoft Clarity 免费热力图与录屏接入(10 分钟,含 CSP 放行域名提示)。
- **`docs/ads.md` 广告时机与收款**:上线后 1-2 天再开广告 + 同类站原则(banner 致主关键词下滑又恢复的实战案例 + 开前自查清单);Adsterra 收款两条路线——USDT(OKX,TRC-20 网络核对警告)与 Payoneer(欧元账户 wire transfer,客服调 $100 门槛英文话术、签协议提现),默认全关的广告位 env 设计与时机策略互证;站内学习手册第 7 章(zh/en)同步补「先说时机」小节并互链。

### Changed

- **首版页数建议**:`game-selection.md` 明确首版只上线 10-15 篇核心页(codes/tier list/guide 高价值词),批量生成 40-60 篇草稿可以但**部署分批**(每周 10+ 翻正一篇上一篇,配合 draft 门控与内容管道)——第一版页面太多质量被稀释,反拖整站排名。
- **`docs/README.md`**:快速索引 + 路径 A + 一页决策地图收编 sourcing.md / ads.md / requirements/。

## [2.0.1] — 2026-08-24

**v2.0.0 发布当日的全面审计修复(5 视角:代码层/CI+脚本/ops CLI/文档一致性/内容+依赖)。机械门禁当时全绿——本批修的全是门禁看不见的层。**

### Fixed

- **`category` 变硬门禁**:`src/content.config.ts` 从 `z.string()` 改为 `z.enum(CONTENT_TYPES)`——打错分类名此前会产出 HTTP 200 的软 404 页并被 sitemap/RSS/llms.txt 照常发布,现在构建直接失败。
- **第八道门禁真正能红**:`check-i18n` 新增 `--strict-ui` 模式(缺 UI key = 模板缺陷,exit 1;文章翻译深度仍为报告项——内容选择不是模板错误),共享门禁 action 改跑 strict-ui,「八道门禁」的承诺从 7+1 报告变成 8 道真门禁。
- **`setup.yml` fork 初始化 PR 开出前先验证构建**:此前是破坏性变更(rm landing/删 demo MDX)零验证——GITHUB_TOKEN PR 不触发 CI、workflow 自己也不跑 build,清单漂移要等 fork 首次 Cloudflare Pages 构建才炸;现在开 PR 前跑 `pnpm install && pnpm build`,且 wrangler.toml 重写步骤断言正则命中(subn 计数,静默 no-op 直接失败)。
- **`auto-content.yml` 两个静默缺陷**:粘贴的 `csv_text` 会被提交进 PR 合入 main → create-pull-request 加 `add-paths: src/content/**`(PR 只含内容变更);`bulk-new-posts` 零产出时 exit 0 导致「全绿但无 PR」→ 新增 `--require-output` 旗标,管道使用之。
- **tools/anvil-ops 测试进主 CI**:ci.yml 新增 `ops-toolkit` job(typecheck/test/build)——此前动 ops 代码的 PR 落 main 零测试信号,发布时才炸(7993ae6 事故的根因)。
- **release-ops 发布守卫**:tag `ops-vX.Y.Z` 与 `tools/anvil-ops/package.json` 版本一致性校验(不符即 fail);publish job 补 `timeout-minutes`;npm 全局升级钉在 major 11(`npm@11`,不再浮动 `^11`)。
- **sitemap hreflang 与页面 head 的矛盾**:去掉 sitemap `i18n` 全量选项(它给每个 URL 虚构所有语言的 alternate,与回退页「只有 en」的页面级声明冲突,Google 会丢弃冲突簇);改为 `serialize` 钩子按真实 MDX 存在性生成 alternates(文章按覆盖语言、列表页按全部语言路由)。
- **anvilwiki-ops MCP 站点解析吞错**:`resolveEffectiveRoot` 只把「无站点配置」的 OpsError 落到 defaultSite,TOML 解析错误直接抛出——此前 cwd 的 wrangler.toml 损坏会把 submit_pr 静默指到另一个站的仓库。
- **anvilwiki-ops GSC 错误处理死代码激活**:gaxios 对非 2xx 直接 throw,精心写的 403「共享 SA」修复指引从未被执行——现在统一包装 HTTP 错误(403/401/429 各带修复指引)。
- **anvilwiki-ops doctor 从子目录运行误报**:`.env` 改从发现的站点根(`site.root`)读取,与 metrics/insights 行为一致。
- **anvilwiki-ops MCP stdio 冻结**:audit/submit_pr 等重生成操作改经 worker 线程执行(spawnSync 曾把 Node 事件循环冻住几分钟,keepalive 超时的客户端会误杀进行中的调用);源码/注入测试运行自动回退进程内。
- **anvilwiki-ops 健壮性批**:GSC 失败不再连累 CF 半份报告(独立降级,全失败才报错)+ GSC 1000 行/CF 100 行截断显式提示;GSC 窗口差一修复(`--days 28` 真的是 28 天);`sites.toml` 写入原子化(临时文件+rename);`sites add` 站点名合法字符校验;AIO 归档同日导入不再静默覆盖;`git add -A` 后检测已暂存的 `.env` 并拒绝提交;`submit` 失败提示不再引用不存在的 push-only 命令;`sites`/`mcp` 子命令收到全局 `--site/--all` 时明确报错而非静默忽略。
- **脚本批**:`bulk-new-posts`/`new-post` 的 navigation/routing 解析失败改为响亮报错(删硬编码回退清单);slugify Unicode 化(CJK slug 可用,`新手攻略` 不再变空串);YAML 模板反斜杠转义(标题含 `\` 不再炸/腐化 frontmatter);`new-post` 描述超 165 也警告;`new-locale` 四处正则重写全部断言命中(不再「打印成功但文件没动」);`gen-covers` 字体下载加 120s 超时;`content-pipeline.yml` 的 `!failure()` 改 `success()`(取消状态不再落入建 issue 分支)。
- **代码层批**:英文回退页的「相关文章/上一篇下一篇」改从 servedLocale 取集合(此前静默消失);相关文章按日期排序(原为路径字母序);tag 路由统一走 `parseEntryId`(两处内联解析行为不一致);画廊灯箱空 `src=""` 的伪请求移除;handbook TechArticle 缺 `updated` 时省略日期(不再用构建时间伪造新鲜度);ListPage 无 overview 时的 meta description 走 i18n(`shared.defaultListDescription` 新键 en/ja);HomePage 硬编码英文兜底删除;`summary` schema 上限 200→400 字符(40-60 词的英文实际 250-350 字符,旧上限与字数规则自相矛盾);死导出清理(`getAllEntriesByCategory`/`allLocales`/`NAV_BY_KEY`/`localeFromPath`)。
- **workflows.test.ts 契约硬化**:SHA 钉断言覆盖全部 5 个 workflow(含 setup.yml)+ 一切非本地 `uses:` 必须 40 位 SHA(含 create-pull-request);门禁断言改为解析 YAML 后精确比对 8 条命令(顺序敏感、各自独立 step,注释里的字样不再能骗过测试);新增 setup.yml「build 先于 PR」与 ci.yml ops-toolkit job 断言。
- **文档一致性批**:`anvil-new-article` skill 仍教 800×450 旧封面标准(会持续毒化 AI 生成内容)→ 1200×675 + gen-covers;AGENTS.md 测试注释 6→9 套件、Commands 补 `gen-covers`、ops 测试计数更新(111→125);PRD 工作流计数 4→5(补 release-ops.yml);v2.0.0 发布日期三处统一为 2026-08-23;CHANGELOG 2.0.0 条目重复短语修正;EN 发布横幅补「eight quality gates」与中文对齐;孤儿平台验证 TXT 删除。
- **demo 内容批**:codes 页(en/ja)刷新(过期 1 码+新增 ANVIL-DAWN,lastModified 2026-08-23,补 `gameVersion: v2.5`,违反自家 7 天新鲜度规则 8 天的问题闭环);3 篇英文 summary 增重至 40-60 词(规则本意,AI Overviews 候选字段不再欠重);emberfang(en/ja)补 gallery 机制图 2 张(gen-demo-media 新增 SVG 绘制)、stormcaller(en)补视频嵌入——boss 指南媒体配对规则(videos+gallery)全部达标;ja tags 对齐 en(freebies/ash-warden);`ja/guides/` 目录补齐(routing.ts 约定)。

### anvilwiki-ops(随本批发布 1.0.1)

- 测试 111→125(新增 cli-flags 纯函数测试 9 例、resolveEffectiveRoot 错误判别 3 例、包完整性 smoke 3 例替换占位断言;smoke 从 `1+1` 变成 bin/files/version 真校验)。

## [2.0.0] — 2026-08-23

**内容经营操作系统:PR 门控内容管道 + 多站管理 + 封面产能 + 变现建议位。模板仓库零 breaking——fork 用户常规 merge 即可,无迁移步骤;唯一契约变化在 `anvilwiki-ops` 0.x→1.0.0(MCP 工具加可选 `site` 参数,不传行为与 0.x 一致)。**

### Added

- **PR 门控内容管道 `.github/workflows/auto-content.yml`**:workflow_dispatch(仅 collaborator,天然鉴权)→ 确定性生成器(`import-csv` 任务 → `pnpm bulk-new-posts` 脚手架)→ **八道质量门禁前置**(全绿才开 draft PR——2026 年起 GITHUB_TOKEN 创建的 PR 不自动跑 CI,验证前置比「先开 PR 再等 CI」更严格)→ create-pull-request@v8(固定分支 `chore/auto-content` 幂等、无 diff 静默跳过);**LLM 永不进 CI**(`secrets` 零引用,tests/workflows.test.ts 钉死契约);权限仅 `contents: write` + `pull-requests: write`;配套文档 `docs/content-pipeline.md`(fork 启用两步设置)。
- **八道门禁抽成共享 composite action `.github/actions/gates`**:ci.yml 与 auto-content.yml 同源复用同一份门禁定义,杜绝两处漂移;ci.yml 行为不变。
- **`anvilwiki-ops` 1.0.0(多站管理)**:站点注册表 `~/.config/anvil-ops/sites.toml`(`[[sites]]` name/path/siteUrl 覆盖,**凭据永不入注册表**——各站 `.env` 各自保管)+ `--site <name>` / `--all`(doctor/metrics/audit/insights 批处理,单站失败不中断)+ `sites list/add/remove` 子命令;无旗标时行为与 0.1.3 完全一致;`submit` 刻意拒绝 `--all`(批量发布不一键化)。
- **AI 引用追踪(anvilwiki-ops 1.0)**:① CF Web Analytics AI referrals(`metrics` 末尾自动追加——chatgpt.com / chat.openai.com / perplexity.ai / gemini.google.com / claude.ai / copilot.microsoft.com 的 referrer host 聚合,GSC gen-AI 报告无 API 故此为主通道);② GSC `searchAppearance=AI_OVERVIEWS` 探测(`insights` 列被 AI Overviews 展示的页面,标注 experimental);③ `metrics --import-aio <csv> [--save]` 导入 GSC UI 导出的 Search Generative AI 报告 CSV(容忍 BOM/引号/缺列,`--save` 归档 `ops/ai-visibility/<date>-aio.csv`)。
- **`pnpm gen-covers` og:image 封面生成**(`scripts/gen-covers.ts` + `src/lib/covers.ts`):satori + @resvg/resvg-js + subset-font;**封面尺寸标准 800×450 → 1200×675**(Google Discover 大图预览要求 ≥1200px 宽);品牌色运行时解析 globals.css `--brand`(单一真相);中/日文标题按字符运行时子集 Noto Sans CJK JP/SC(OTF 首次下载缓存 `node_modules/.cache/gen-covers/fonts/`,不进 git;`--fonts-dir` 离线逃生),拉丁字体内置 OFL Lato(`scripts/fonts/`);manifest hash 缓存(`--force` 重生成;`--out <dir>` 预览模式渲染全部且不动 frontmatter);默认模式只为无封面文章生成并自动写入 frontmatter `image`。
- **全站 `max-image-preview:large`**(`BaseLayout.astro` 非 noindex 分支):Google Discover 大图预览的硬前提,此前全站缺失。
- **`AffiliateSuggestion` 文末建议位**(`src/components/ads/AffiliateSuggestion.astro` + `src/config/affiliates.ts` + `src/lib/affiliates.ts`):config 层驱动(affiliate 是逐站内容数据非部署密钥),默认空数组 = 不渲染(保 Lighthouse 4×100 开箱契约与 fork 纯净);渲染至多 2 张 AffiliateLink 卡片,`categories` 可选按栏目限定;`shared.sponsoredLabel` i18n(en/ja),AffiliateLink 新增可选 `sponsoredLabel` prop 向后兼容。
- **新文档**:`docs/content-pipeline.md`(管道安全契约六条 + fork 启用步骤 + 与每周审计分工)、`docs/multi-site.md`(注册表心智模型 + AI 引用三通道 + 新站流程),均入 `docs/README.md` 快速索引与决策地图;开发手册第 7 章「AI 自动化运营」双语补「一套工具管 N 个站」「关键词清单直接变草稿 PR」两节(章数不变 learn 11 / dev 7,提示词 18 不变)。
- **决策记录与 ADR**:`docs/superpowers/specs/2026-08-22-v2.0-content-os-design.md`(六项定档);PRD 新增 ADR-004(内容管道=确定性+PR 门控,LLM 永不进 CI)、ADR-005(多站=工具层,模板一仓一站)。
- **测试**:root 测试套件 6→9(新增 workflows/covers/affiliates 三套件)——tests/workflows.test.ts(管道安全契约:dispatch-only/权限精确/门禁先于 PR/draft/零 secrets/审计只读)、tests/covers.test.ts(品牌色解析/CJK 判定/字号启发/manifest hash)、tests/affiliates.test.ts(建议位筛选);anvilwiki-ops 60→111。

### Changed

- **PRD §14.2 消歧撞号**:历史行「v2.0 | 套用模板 CLI」标注为「v1.x 期里程碑,原标 v2.0」,与正式 v2.0.0 区分;「更新记录」表补 v2.0.0 行并指向 CHANGELOG;§5/§13 能力与工作流计数同步(脚本 11→12、工作流 3→4)。
- **demo 封面 5 张重生成/升采样至 1200×675**(`scripts/gen-demo-media.mjs` 封面走 viewBox 缩放渲染,注释同步;其余 4 张 sharp lanczos 升采样);`docs/content-format.md` 封面字段表与质量指引同步新标准 + gen-covers 提及;AGENTS.md 媒体密度行同步。
- **`docs/roadmap.md`**:演化主线表加 v2.0 段;「中期(v2.0 方向)」标记交付(邮件订阅明确留 v2.1);近期候选池滚动(新增 Astro 5→7 升级、管道生成器扩展)。
- **`docs/staying-up-to-date.md`**:MAJOR 措辞从「=breaking change」修订为「=重大里程碑;含 breaking 必附迁移说明」;新增「升级到 v2.0」一节(常规 merge + `pnpm install` + 两个可选动作)。
- **README 中英**:AI 全链路/工具链/变现三条特性升级为 v2.0 表述;顺手修英文对比表遗留的「8-chapter manual」漂移(v1.18 漏改,中文侧已是 11 章)。
- **CHANGELOG compare 链接补齐**:[Unreleased] 指针更新为 v2.0.0...HEAD,补 1.15.0–1.19.0 六个缺失链接行。
- 全仓计数与版本同步:package.json / landing.ts `PROJECT_VERSION` / 中英发布横幅 / AGENTS.md Status 与 Commands(`gen-covers`)与 Ops Toolkit(1.0.0 能力清单)。

## [1.19.0] — 2026-08-22

**SEO 进阶:从被收录到排上去,再到被 AI 引用——对齐 2026 搜索新格局。**

### Added
- **学习手册第 11 章「SEO 进阶」**(`docs/handbook/{zh,en}/seo-traffic.md`,learn 10→11 章,提示词 16→18 个):一页一词选词地图(意图匹配/长尾甜点/可超越性三判据 + 关键词选题提示词)、单页做满自检清单(title/H2 问句/summary/表格/内链/封面图/lastModified 八槽位表格 + 全站 SEO 自检提示词)、站点信任三慢变量(新鲜度/作者署名/内链网络)、2026 新规则失效清单(FAQ 富结果移除、llms.txt 对 Google 无效但对 ChatGPT 有用、AI Overviews 引用偏好、封面图成图片搜索入口)、2026-08 反 spam 三红线;第 10 章结尾衔接同步(中英)。
- **`docs/seo.md` 新增「Google 官方规范更新记录(2026)」**:9 条时间线(Spam update / preferred sources 自定义按钮 / GSC 社交视频分析 / review snippet 违规规则 / canonicalization 澄清 / llms.txt 官方澄清 / FAQ 富结果移除 / og:image 成选图首选 / Discover core update),每条附「对本模板的影响」;文末 FAQPage 备注从「限制到政医站」修正为「已完全移除」。
- **`docs/roadmap.md` 公开路线图**:八段演化主线(v0.1 地基 → v1.19 SEO 进阶,每段方向+代表能力)、近期候选池(AI 引用追踪/封面图产能/preferred sources 适配/选品决策支持)、v2.0 方向(PR 门控 CI 内容管道/多站管理/变现深化)、不做清单;`docs/README.md` 快速索引与 seo.md 描述同步收录。

### Changed
- `docs/content-format.md` 媒体密度表新增封面图质量三原则(2026-03 起 Google 选图首选 og:image,封面从装饰升级为图片搜索流量入口)。
- 全仓计数同步:学习手册 10→11 章、可复制提示词 16→18——README 中英(4+2 处)、docs/README(2 处)、PRD §5/§11/§15、`landing.ts` 手册简介(中英 4 处)+ 发布横幅(中英)+ `PROJECT_VERSION`;发版横幅文案与版本号同步(吸取 v1.18.0 漏改横幅的教训)。

## [1.18.0] — 2026-08-20

**关卡7 模板化 + 关卡8 批量内页:跑通一个站之后的两条放大路径。**

### Added
- **`pnpm template-audit` 模板健康检查**(`scripts/template-audit.ts`):代码层纯净度(剥离注释后扫 demo 字符串,注释里的用法示例不算违约)/配置层换皮(域名/站点名+游戏名/分类三处一致)/内容层可替换性(每类文章数、draft 遗留)/换皮残留(demo 封面与机制图、**demo 文章**(按内容含 demo 游戏名检测,文件名相同的 fork 自有页面不误报)、wrangler.toml demo 值)四组检查,✅⚠️❌ 三级输出 + 健康度评分(如「3/11」);仅 ❌ 违反分层契约才非零退出,demo 仓库上 ⚠️ 遗留是预期。demo 资产清单与 `apply-template.ts` / `setup.yml` 保持同步(keep-in-sync 注释)。
- **`pnpm bulk-new-posts` 批量内页脚手架**(`scripts/bulk-new-posts.ts`):读 `new-posts.csv`/`.tsv` 关键词清单(列 `locale,category,slug,title,description`,支持 RFC-4180 引号转义、`#` 注释行、表头前注释、Excel BOM/TSV 自适应),全量校验(locale∈routing / category∈navigation / slug 自动规范化与冲突去重 / description 40-165)后**全部合法才写入**;生成的全部是 `draft: true` 草稿(不进 build),目标文件已存在则跳过绝不覆盖;`--dry-run` 预览计划;边界清晰报错——description 占位符在长标题下自动降级为固定文案(schema 40-165 恒通过)、未闭合引号、目录入参、`-n` 别名。
- **`.agent/skills/anvil-batch-articles` 批量内容技能**:关键词清单 → 意图归类(照抄 anvil-new-article 分类表)→ 生成 `new-posts.csv` → 每类意图用同一份统一提示词模板批量填充 → `check-content` + `build` 全批验收;内置 5 条铁律(批量≠灌水、禁编造数据、内链只指真实页面、同批禁模板句复用、draft 逐篇转正)。
- **学习手册第 9 章「把第一个站打磨成模板」+ 第 10 章「批量做内页」**(zh/en,`templatize-your-site.md` / `batch-pages.md`,learn 手册 8→10 章):第 9 章讲 template-audit 用法、换皮清单沉淀提示词、复制第二个站的 30 分钟四步;第 10 章讲内页流量逻辑、关键词四来源、统一内页生成提示词、批量三步法与灌水红线。新增 2 个可复制提示词(总 16 个)。

### Changed
- 全仓计数同步:学习手册 8→10 章、可复制提示词 13→16 个(v1.17.1 加媒体提示词后实际已 14 处但宣传数未同步,本次一并校正)、脚本 9→11、技能 3→4——README 中英、docs/README、PRD §5/§11/§15、`landing.ts` 手册简介、AGENTS.md Status/Commands/技能清单、手册内交叉引用(第 4 章技能数、第 8 章结尾接第 9 章)。
- `docs/apply-template.md` 末尾新增「模板化进阶:audit + 沉淀」一节;PRD §14 roadmap 补 v1.18 行。

## [1.17.1] — 2026-08-20

**专家团复审补丁:demo 图内事实校正 + fork 素材清理 + 指引闭环。**

### Fixed
- **demo 图与正文事实矛盾**(复审 A 批):竞技场图 4 个固定陨石标记→3 个靠边标记(正文"每 30s 标 3 个点,引到边缘");"permanent lava"→"fire puddles last 20s"(正文 20 秒);机制图 "~1.5s dodge window"→"2s to move after each mark"(正文标记后 2 秒落地)、"save your dash for the volley"(Emberfang 的设定串台)→"melee: stand at her side or back" 并补 Flame Whip "1.2s wind-up · 600 damage" 数据;Frostpike 卡 "Freeze on hit"(图自创触发条件)→"Freeze utility"(正文原话);stormcaller gallery 图注同步改"meteor marks near the edges"。
- **fork 选 "Clear demo content" 后留下 11 张孤儿 demo 图**(约 340KB):`apply-template` 新增 `clearDemoAssets`(按名删 5 张 demo 封面 + 整删 `src/assets/gallery`、`public/images/articles`,不误伤用户自换素材),`setup.yml` 清理步骤同步同一清单(fork 真模拟构建验证)。

### Docs
- PRD §14 roadmap 补 v1.17 行(v1.15/v1.16 惯例对齐)。
- 学习手册「前 10 篇文章」章中英新增**提示词 D:配图与视频**(截图/视频来源红线、放置路径、密度表指引),frontmatter description 三段→四段;`content.config.ts` gallery 注释补 demo 目录约定。

## [1.17.0] — 2026-08-20

**demo 媒体增强:每类文章完整示范模板的媒体能力,补齐 AI 内容工作流的媒体密度指引。**

背景:模板的媒体系统(封面/gallery/内联图/视频 + ImageObject/VideoObject JSON-LD)早已齐备,但 demo 文章几乎没用到(7 篇正文内联图 0 处、gallery 1 处且复用封面、视频 1 处、codes 页无封面、ja 侧 0 媒体)——fork 用户与 AI agent 照 demo 学,只能学出纯文字站。本版把"能力 vs 示范"倒挂拉平。

### Added
- **demo 素材生成脚本 `scripts/gen-demo-media.mjs`**:demo 游戏是虚构的,没有真截图——7 张扁平风示意图(封面/竞技场地图/机制图/职业卡/路线图/武器卡)以 SVG + sharp 光栅化,可复现可改;全部 800×450(16:9)。
- **媒体密度指引**(按页面类型给封面/内联图/gallery/视频建议密度表):`docs/content-format.md` 新增专节,`.agent/skills/anvil-new-article` 同步补图片四条规则,AI 生成文章默认带上媒体。

### Changed
- **codes 页补封面**(en/ja):og:image 不再回退全站 hero,分享卡片有辨识度;codes 恰是分享最频繁的页面类型。
- **stormcaller gallery 换独立机制图**(竞技场俯视图 + Flame Whip 安全区/陨石时间线),不再复用封面充当画廊。
- **weapon-tier-list 补正文内联卡片图 ×2**(S 档 Voidforge / A 档 Frostpike)——此前正文内联图 0 示范。
- **beginner-guide 补 gallery**(四职业卡 + 前两小时路线图,与正文六步严格对应)。
- **ja/emberfang 补视频**(frontmatter 登记 + 正文内联,与 en 版对齐)——i18n 媒体示范对齐。
- **globals.css 新增 `.prose img:not([class])` 规则**:markdown 正文图预留 16:9 盒子(零 CLS,信箱式不裁剪);`:not([class])` 只命中裸 markdown `<img>`,不影响视频缩略图等组件图。
- demo 演示视频加注释说明:占位 YouTube ID,fork 后两处(内联 `id` + frontmatter `videos`)替换。

## [1.16.1] — 2026-08-19

**专家团三轮审计修复批:fork 主路径致命 bug + SEO 合规 + 性能 + 文档全面同步。**

### Fixed
- **fork 一键初始化后构建必炸**:setup.yml 的 landing 删除清单与 apply-template 的 `LANDING_PATHS` 双源漂移,漏删 `src/pages/landing/`(docs 路由)与 `public/images/showcase`,合并初始化 PR 后 build 因 unresolved import 失败;已对齐两处清单(fork 真模拟验证构建通过)。同修:setup.yml 输入改 env 传递防注入、`--force-with-lease` 幂等重跑。
- **CJK 标签页生产 404**:`slugifyTag` 预编码非 ASCII 标签导致 Astro 写出字面量 `%E7…` 目录,站内链接(单编码)全部 404;改为返回原始标签,两种 URL 形态均可达。
- **`anvil-ops submit` 在多语言仓库永远失败**:门禁 `check-i18n --strict` 与 wiki 回退设计冲突(locale 缺文章是合法状态),改非 strict 与 CI 同口径;手册/技能文件同步去「严格」表述。
- **codes 页 FAQPage 结构化数据标记不可见内容**(Google 政策风险):同组 FAQ 现以原生 `<details>` 可见渲染(JSON-LD 与可见文案逐字一致,中英日三语)。
- **英文回退页错误自宣 `hreflang="ja"`**:alternates 改为仅含真实翻译语言;语言切换器 UI 行为不变。
- **sitemap noindex 过滤补 locale 前缀路径**:en 文章设 `noindex: true` 时其 `/<locale>/` 回退 URL 一并剔除(有真实翻译版本时由该版本自身 frontmatter 决定)。
- **公告栏版本漂移**:PROJECT_VERSION 落后于已发版本(v1.16.0 发布时漏同步)。

### Changed
- **anvilwiki-ops 0.1.3(npm)**:MCP serverInfo 版本号改运行时读 package.json(原硬编码 0.1.0 已漂移);npm 包补 LICENSE;doctor 网络异常空 `reason:` 兜底;submit 非 strict(见上)。
- **广告位预留高度**(Sticky 90px / InContent 250px / Sidebar 600px):开启 AdSense 后填充不再推挤页面(CLS),默认关闭契约不变。
- **landing 截图 PNG→WebP**(273K→104K)+ hero 改 `eager`+`fetchpriority="high"`;`_headers` 补 `/images/*`、`/pagefind/*` 缓存规则。
- **GitHub Actions 供应链加固**:3 个 action 全部钉 commit SHA;ci.yml 加 concurrency。
- **`OG_LOCALE_MAP` 放宽为 `Record<string,string>`**:`new-locale` / `apply-template` 重写 locales 后不再 typecheck 报错;zh landing 输出 `og:locale=zh_CN`。

### Docs
- README 英文区补齐中文区 4 个章节(AI 技能表/平台对比/FAQ/技术栈+社区)、"Development 6"→7;AGENTS.md 测试清单与 anvil-ops 60 测试数同步、发布状态更新;deployment.md 死锚点修复;PRD §5 目录树/§5.1/§6.1 schema/§13.2 CI/§15.3 全部同步至当前现实。

## [1.16.0] — 2026-08-18

**社区案例库:首批 3 个真实用户站点上线展示。**

### Added
- **社区案例库(Showcase)**:首批 3 个真实用户站点(aniimo.wiki / nomanssky.wiki / steal-anegg.wiki)三处展示——官网中英落地页新增「Built with AnvilWiki」区块(`CommunitySites.astro` + `landing.ts` 的 `COMMUNITY_SITES` 数据)+ README 中英双语案例表格 + PRD §15.6;数据与组件均随 landing 层分发,fork 时被 `apply-template` 自动清理。

### Fixed
- **GSC 接入步骤修正**(手册第 7 章 + ops README,中英):服务账号邮箱会被 GSC「添加用户」直接拒收(「无效电子邮件地址」),改为官方推荐的 Google 群组中转四步法,并补「服务账号=机器人编号,非邮箱」概念段。
- **学习手册第 3 章新增第 5 步「换上你的图标」**(中英):favicon 全套 + hero 图的手把手替换(favicon.io),原验收步顺延为第 6 步;`apply-template` CLI 结尾提示同步扩写——修复零基础主路径不教换图标、站点顶铁砧图标上线的缺口。
- **手册第 6 章两处措辞**(中英):IndexNow 表述修正(仅自有域名接入 Cloudflare 后有 Crawler Hints,纯 pages.dev 无);GSC 验证变量补「网页 Variables vs wrangler.toml [vars]」双模式指引。
- **anvilwiki-ops 0.1.2**(npm):删了 wrangler.toml 的学习路径用户从 `.env` 读 SITE_URL/PUBLIC_CF_BEACON_TOKEN 回退(原 doctor 必挂且误导);`sc-domain:` 域级资源不再强拼尾斜杠。
- **根 package.json 设 `private: true`**:模板与 fork 永不可能被误 `npm publish`(当日误发 anvilwiki@1.15.0 已在 72h 窗口内撤回,疫苗性加固)。

## [1.15.0] — 2026-08-18

**站长运营 CLI + MCP:anvilwiki-ops(npm 包)—— AI 拉数据、给洞察、内容走 PR 上线的自动化运营闭环。**

### Added
- **`tools/anvil-ops/` 独立 npm 包 `anvilwiki-ops`(0.1.1 已上架 npmjs.com,`npx` 免安装)**:CLI(`anvil-ops`,含包名别名)+ stdio MCP server(`anvil-ops mcp`,一行接入 Claude/ZCode 等 MCP 客户端);core / CLI / MCP 三层解耦,56 测试 + 真实 git bare 仓库集成测试;根 tsconfig/eslint exclude `tools/`,模板与工具互不干扰。
- **5 命令 = 5 MCP 工具**:`doctor`(wrangler/gh/GSC/CF 配置体检,逐项给修复指引)/ `metrics`(GSC 点击曝光 CTR 排名 + CF Web Analytics 访问,table/json/md 三格式,凭据未配自动降级)/ `audit`(refresh-audit / check-i18n / check-content / check-links 聚合报告)/ `insights`(规则引擎:低 CTR 改写、排名 5-15 加深、零曝光排查、流量结构、过期 codes,阈值常量集中)/ `submit`(check-content + check-i18n --strict + build 校验 → ops/submit-* 分支 → push → gh 开 PR,**永不 push main**)。
- **数据接入契约**:GSC 服务账号 JSON(`{` 开头内联,否则路径)+ CF API token 存 .env(gitignored,空 = 功能禁用);CF site tag 直接读 `wrangler.toml PUBLIC_CF_BEACON_TOKEN`,零额外配置;错误信息全部带「现象 + 修复指引」。
- **开发手册第 7 章「让 AI 替你运营:anvilwiki-ops 与 MCP」(中英)**:体检 → 接数据 → 看数据拿清单 → MCP 交给 AI → submit 上线五步(四段式),含「安全线:为什么它改不了你的线上站」与可复制的 AI 指挥提示词;ch6 完结段迁至 ch7,zh「开发 4」标题笔误修正为「开发 6」。
- **三个 `.agent/skills` 技能补可选引用**:anvil-refresh → `insights` 流量×新鲜度合并巡检;anvil-new-article / anvil-update-codes → `submit` 校验后一键开 PR。

### Changed
- 全仓手册计数与描述同步(开发手册 6→7 章):landing 中英 hub 副标题 + 手册卡、README 中英、docs/README、AGENTS 状态行 + 新增 Ops Toolkit 章节(含 pnpm workspace 劫持警示)、PRD roadmap v1.15 行。
- AGENTS.md 产页规则 4 增补 `anvil-ops submit` 可选收尾。

## [1.14.1] — 2026-08-17

**状态同步版:README 重构升级 + 官网/仓库文档全面刷新到最新状态(v1.14 手册分册、8+6 章、零基础优先)。**

### Changed
- **README.md 重构**:新增「快速链接」表(零基础→学习手册 8 章/全景→文档中心/定制→开发手册/在线 Demo,一眼分流);核心特性压缩为 8 条并把「零基础双手册」提为第一条;快速开始压缩为 4 步并引导新手去学习手册第 2 章;新增「常见问题」(要花多少钱/不会编程能做吗/多久有收入/会被上游覆盖吗);对比表加「AI 产页/上手门槛」两行;英文区同步镜像重写;尾部新增 Design Notes。badges 的 Project page 更新为 Docs 徽章。
- **Landing 首页文案刷新**:hub 副标题与两本手册卡片描述改为最新事实(相互独立、8 章/6 章、零基础标准、每步 SOP+提示词)。
- **仓库文档同步**:`docs/README.md` 手册条目改为 8+6 章 + 两个手册独立页链接;`AGENTS.md` 状态行从 v1.9.0(严重滞后)更新到 v1.14.0(含文档中心/手册结构/源码位置说明)。

## [1.14.0] — 2026-08-17

**手册分册成页 + 章节拆细:学习手册与开发手册各自独立页面,5+4 章拆为 8+6 章,手册页改编号列表展示。**

### Changed
- **两本手册独立成页**:`/landing/docs`(及中文版)改为选择页(全景清单 + 两张手册大卡);新增 `/landing/docs/learn` 与 `/landing/docs/dev` 手册专属页(中英四页)。左侧手册树的册名、章节页面包屑同步链接到手册页。
- **学习手册 5 → 8 章**(沿自然接缝拆):①选对游戏 ②出发前:装好 6 样工具(原第 2 章第一幕独立成章——最大流失点值得独立入口)③复制模板跑起你的站 ④让 AI 写 10 篇攻略 ⑤网站上线(含买域名)⑥让 Google 认识你(GSC/sitemap/收录独立成章)⑦接广告开始赚钱 ⑧每周保鲜与增长。
- **开发手册 4 → 6 章**:①改动地图 ②加栏目与加语言 ③换主题色与改首页(原「定制」一分为二)④功能开关总表 ⑤CI 门禁与安全底线(原「集成」一分为二)⑥同步与回流。
- **手册页列表化**:每本手册的页面用编号列表逐章展示(序号徽章 + 标题 + 一行简介 + 箭头),比卡片网格更直观;hub 手册卡显示章数。
- **互链全面重接**:roadmap 10 项、DocsEntry 卡片、章间「下一步」、跨章引用全部指向新 slug;旧 slug(customize/deploy-and-get-indexed/monetize-and-grow)零残留(en 14 章 2 并行 agent 同源重写,13 提示词块守恒,事实限定词逐条存活)。

## [1.13.1] — 2026-08-17

**建站全景清单 + 全书直达链接:回答「一个游戏站要完成哪些工作」,每个「去哪做」都能点进去。**

### Added
- **文档中心 hub 新增「建站全景清单」**:从零到赚钱的 10 件工作(选游戏 → 装工具 → 建站 → 10 页 → 上线 → Google 登记 → 买域名 → 接广告 → 周保鲜 → 定制),每项带耗时标注,点击直达对应章节——新访客 10 秒看到全部工作量的地图。
- **手册外链补齐(zh+en 同步)**:找新游四来源([itch.io newest](https://itch.io/games/newest) / [Steam 新品](https://store.steampowered.com/explore/new/) / [Roblox Discover](https://www.roblox.com/discover) / YouTube)、竞对站([Fandom](https://www.fandom.com) / [Game8](https://game8.co))、工具链([brew.sh](https://brew.sh) / [pnpm.io](https://pnpm.io) / [Claude Code](https://claude.com/claude-code) / [Codex](https://openai.com/codex) / [Cursor](https://cursor.com))、域名注册商([Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) / [Porkbun](https://porkbun.com))、维护文档(development.md)——全部从纯文本变为可点击直达。

## [1.13.0] — 2026-08-17

**双手册全量重写:按「完全零基础也能跟着走」标准,四专家(科普写作/第一性原理架构/新手测试员/模板守门)定档。旧版实测服务的是「半熟手」,新版服务真正的目标用户。**

### Changed
- **统一七段骨架(9 章)**:①你在哪·解决什么(第一性原理链:赚钱←广告←流量←排名←收录←上线←你的文件←选品,每章开头「已有 X 缺 Y 本章给 Y」)②本章产出清单 ③概念垫底(新术语=一句白话+固定类比,首现定义后文直用)④分步实操(**四段式:做什么/怎么做/你会看到/确认做对了**)⑤卡住了怎么办(症状→原因→修法)⑥验收 ⑦下一步。
- **补最大流失点**:学习手册第 2 章新增「第一幕:出发前装好 6 样东西」——终端怎么打开(Mac/Win)、注册 GitHub、装 Node 22、装 pnpm、装 Git、装 AI 助手,每样带确认点(小白实测:旧版最大劝退环节,装环境从一句话变成完整序幕)。另补:域名购买支线(Cloudflare Registrar/Porkbun)、AdSense 广告位编号从哪来、upstream 月度同步完整三行命令(旧版断链)、GSC 验证的逐步点击路径。
- **小白实测卡点清零式修复**:wrangler.toml 二选一给新手唯一答案(删文件)+进阶折叠;`<你>.pages.dev` 占位符讲清含义;pnpm install/dev/build 全部补「你会看到」;frontmatter/SERP/RPM/搜索意图/Lighthouse 全部首现定义;意图决策表从第 1 章后移第 3 章(读者见到页面再讲页型);删前置噪音(第 2 章 wrangler 预警段、报错 2 三处一致、第 4 章 hreflang 检查、console.log 诊断法→挪开发手册)。
- **固定类比库全书统一**:fork=整店复制蛋糕店(并声明边界:原店新品要 merge 才进来)、部署=书上货架、env=开关面板、build=印刷厂、终端=打字指挥电脑的窗口、三层=一栋三层楼。类比只用于「是什么/为什么」,操作句保持逐字精确。
- **中英 18 章全部重写同源**(2 并行 agent + 事实守恒校验):13 个提示词块数量守恒、验证条款与禁令原义保留、全部数字与限定词(仅上游生效/不含换肤/8 行主题变量/P1 仅 bosses+tier-list/NODE_VERSION 进 [vars]/2-8 周/15-20 篇/≥60 分/双源)逐条 grep 验收存活。

### Fixed
- en 两章 title 超 80 字符(schema 拒收)裁剪;frontmatter 全部双引号转义防 YAML 冒号问题。

## [1.12.1] — 2026-08-17

**CLI 清理完整性修复:landing 专属 showcase 截图此前不在删除清单,fork 仓库会残留 3 张无用图片。**

### Fixed
- `apply-template` 的 `LANDING_PATHS` 补上 `public/images/showcase/`(demo-article/home/mobile 三张截图,仅 landing Showcase 组件引用)——此前只删 `wechat-qr.jpg`,fork 的 `public/` 与 `dist/` 会残留这 3 张图。CLI 头部注释/汇总文案同步,组件计数注释修正(13)。
- **全量 fork 模拟验证零残留**:按最终清单删除全部 8 个路径 + 翻转 `landingLinkEnabled` 后 `pnpm build` 绿;dist 无 landing 路由、无 showcase/wechat 图,llms.txt / sitemap / robots 均零 landing 痕迹。幸存文件中的 landing 引用全部为 flag 门控(SiteHeader / llms.txt)或有意保留(`docs/handbook` 手册源 + `lib/handbook.ts` 纯函数,fork 可直接复用提示词 SOP)。dry-run 计数 23 文件,与清单逐项吻合。

## [1.12.0] — 2026-08-17

**手册章节页三栏布局:左侧手册目录树 + 右侧本页内容目录(scrollspy)。**

### Added
- **左侧手册目录树**(新组件 `HandbookNav.astro`):两本手册全部章节按序分组列出,当前章高亮(`aria-current="page"`),顶部回文档中心;xlarge 屏吸顶,以下折叠为 `<details>`。纯 HTML/CSS 零 JS。
- **右侧本页内容目录**:复用 wiki 的 `TableOfContents`(H2/H3 锚点 + IntersectionObserver scrollspy 跟随高亮);组件新增 `desktopAt` prop(`lg` 默认 wiki 不变 / `xl` 手册三栏用),以下屏折叠为 `<details>` 置于 TL;DR 卡之后。
- 章节页网格 `xl:grid-cols-[13rem_minmax(0,48rem)_13.5rem]`,中列正文 max-w-3xl;`landing.ts` 新增 `onThisPageLabel`/`manualsLabel` 中英文案。

## [1.11.2] — 2026-08-17

**Landing 导航栏手册入口:头部新增「学习手册 / 开发手册」链接,锚定文档中心对应手册区块。**

### Added
- LandingLayout 头部新增两个导航项(Learning Manual / Development Manual,图标 lucide:graduation-cap / wrench,移动端隐藏与 GitHub/Demo 同策略),链接按当前语言指向 `/landing/docs#learn|dev` 或 `/zh/landing/docs#learn|dev`;对全部 landing 族页面(官网/文档 hub/章节页)生效。
- HandbookHub 手册区块加 `id="learn"` / `id="dev"` + `scroll-mt-20`(锚点定位不被吸顶头部遮挡)。

## [1.11.1] — 2026-08-16

**手册文档专家审查修订版:9 项事实校正(P0×2 + P1×4 + P2×3),中英双语 + 3 份关联文档同步。**

### Fixed
- **[P0] fork 保鲜工作流误导**:monetize 章原称"仓库已配每周自动开 issue 的 freshness 工作流"——实际 `content-pipeline.yml` 带 `if: github.repository == 'PNGTRID/AnvilWiki'`,fork 永远收不到 issue。改为:fork 每周本地跑 `pnpm refresh-audit`(并说明删 `if` 可开启),周 SOP 重排为三步。
- **[P0] Initialize AnvilWiki workflow 范围夸大**:launch/integrations 章原称与 apply-template CLI"等价"——实际 workflow 只做收尾清理(wrangler vars/删 landing/清 demo),不含游戏名/主题色/语言。改为如实描述。
- **[P1] 主题色"4 行"错误(连带 3 处文档陈旧)**:v1.9 引入 `--brand-text` 派生后实际是 8 行(`--brand`/`--brand-light`/`--brand-h`/`--brand-s` × 亮/暗);手册 3 处 + **AGENTS.md 约束 #2 + docs/apply-template.md + docs/migration-from-nextjs.md ×3 处**全部改正——只改 4 行会留下旧色相文字色。
- **[P1] zh 章节内链语言断裂**:10 处站内链接写死 `/landing/docs/…`(英文路由),中文读者点击静默切英文;统一加 `/zh` 前缀。
- **[P1] refresh-audit P1 语义不准**:P1 仅覆盖 bosses/tier-list 两类文章超 90 天(其他分类不产生 P1),非"分类 90 天无新文"。
- **[P1] NODE_VERSION 与方案 B 矛盾**:保留 wrangler.toml 时 dashboard 的 NODE_VERSION 被忽略——补充方案 B 需把 `NODE_VERSION = "22"` 写进 `[vars]`。
- **[P2] SEO 体检提示词 SITE_URL 位置**(site.ts → wrangler.toml/.env)、**CLI 提示表补 Release date 行**、**CI 门禁枚举补全**(八道:lint/typecheck/test/check-config/build/check-content/check-links/check-i18n)。

## [1.11.0] — 2026-08-16

**站内文档中心版:`/landing/docs` + `/zh/landing/docs`——学习/开发双手册(9 章 × 中英),每步 SOP + 可复制 AI 提示词,四专家(游戏wiki站/SEO/自动化/模板架构)讨论定档。**

### Added
- **站内文档中心**(`HandbookHub` + `HandbookChapter` 组件,4 条路由):手册源码 `docs/handbook/{en,zh}/*.md` 单一真相源(GitHub 可浏览 + 站内渲染);**fork 用户保留手册**(学习手册的提示词 SOP 对站长有直接价值),apply-template CLI 只删 landing 路由——删除清单实测 19 文件,fork 模拟(删 landing 全套后)`pnpm build` 仍绿。
- **学习手册 5 章**:选品四层漏斗(含 P01 选品分析/P02 首日规划提示词)→ 半小时建站(CLI 逐项填法+三类新手报错)→ 首日 10 页 AI 产页(P03 攻略/P04 codes/P06 tier list + 逐篇验收三件套 + 7 条反模式)→ 部署与首次收录(wrangler.toml 二选一 + GSC/sitemap/请求收录 SOP)→ 变现与周运营(AdSense 前置清单 + P05 codes 更新/P08 巡检/P11 SEO 体检 + 每周 30 分钟节奏)。
- **开发手册 4 章**:三层架构与改动决策树(Astro 5 六坑)→ 定制 SOP(加分类/加语言/主题/首页,含 P07 翻译/P09 文案/P10 新语言提示词)→ 集成与工程(env 门控全表 + CI 三工作流 + 安全基线)→ 同步上游与贡献回流(merge 策略 + SemVer 承诺 + 发版流程)。
- `handbook` content collection(Zod schema:title/description/manual/order/icon/tldr/updated)+ `src/lib/handbook.ts` 纯函数(parseHandbookId/sortChapters/prevNext/handbookPath)+ `tests/handbook.test.ts`(**中英 1:1 parity 硬门禁**:slug 镜像、manual/order 孪生、字段齐全、order 唯一)。
- 文档页 SEO:任务式 H2 + TL;DR 卡 + BreadcrumbList/TechArticle JSON-LD + en/zh hreflang 成对真实 + sitemap lastmod(astro.config 扫描 `updated` 字段)+ llms.txt 新增 Handbook 段(`landingLinkEnabled` 门控,fork 站零污染)。
- LandingLayout 支持 `pageTitle`/`pageDescription`/`togglePath`/`extraJsonLd`;语言切换器在文档页内互切;自动跳转脚本收窄到 landing 根路径(不再把读者从章节页弹走)。DocsEntry 3 卡改站内链接,DevGuide「全部文档」入口改指 /landing/docs。

### Fixed
- en 手册 frontmatter 的 ASCII 冒号破坏 YAML 解析(plain scalar 含 `: `)——18 文件统一 JSON 双引号转义;tldr 上限 300→480 字符(en 译文天然更长)。
- DocsEntry 4 卡网格在 3 列下 3+1 孤行换行(v1.10.0 已修,此处确认保持)。

## [1.10.0] — 2026-08-16

**官网开发指南版：landing 新增「怎么用」5 步上手板块——此前只有 4 张文档卡，缺一条"从头到尾怎么走"的向导。**

### Added
- **Landing「怎么用」5 步开发指南板块**（`/landing` + `/zh/landing`，位于 DocsEntry 与 Community 之间）：fork 本地跑 → `pnpm apply-template` → 与 AI 对话产页 → 免费部署 → 保持新鲜。每步附可直接照抄的命令（含对话式产页示例 prompt）与对应文档链接，板块底部链接文档中心（`docs/README.md` 四条阅读路径：建站 / 写作 / AI Agent / 贡献者）。新组件 `DevGuide.astro` + `LandingContent.devGuide` 类型与中英文案。
- DocsEntry 卡片网格修正：`sm:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-4`（4 张卡在 3 列网格会 3+1 孤行换行），陈旧注释（"3 cards"）同步修正。

### Changed
- `apply-template` CLI 删除范围确认覆盖新板块：CLI 本就整目录删除 `src/components/landing/`（现为 10 组件）+ `src/config/landing.ts`（含 devGuide 文案）+ 两个 landing 页面；注释计数同步（8 → 10）。dry-run 实测「Removed 15 project landing page files」，fork 用户套用模板后仓库零 landing 残留。

## [1.9.0] — 2026-08-16

**专家团全面审计修复版：5 视角深挖（运行时/配置 CI/SEO i18n/安全 a11y/文档 DX），P0×5 + P1×10 + P2×30 全部清零。**

### Fixed (P0)
- **5 个日文 legal 页 soft-404**：`[locale]/[legal].astro` 误从 `Astro.props` 读路由参数（AGENTS.md gotcha #4 原样违例），全部页面渲染成 HTTP 200 的 "Not Found" 空壳并被 sitemap/hreflang/footer 收录——改读 `Astro.params`。`check-links` 新增 soft-404 断言防止复发（状态码检查看不见这类问题）。
- **JSON-LD 注入面关闭**：`JsonLd.astro` 的 `JSON.stringify` 不转义 `<`，frontmatter 含 `</script>` 即可逃逸 script 标签（社区 PR 工作流下的存储型 XSS 面）——序列化后统一 `\u003c` 转义。
- **`pnpm apply-template` 产物缺 `ogImageWidth/ogImageHeight`**：fork 用户 typecheck 必挂 + 线上 `content="undefined"`——重写模板补齐两个必填字段。
- **README 快速开始克隆 URL 指向上游仓库**（中英两处）：fork 用户按字面走完 push 必被拒——改为占位符 `<你的用户名>`。
- **环境变量三表矛盾**：实际消费 15 个 env，`wrangler.toml [vars]` 只有 9 个（AdSense×4/GA/GSC 连注释占位都没有）、`setup.yml` 重置块同样、deployment.md 只列 8 个——三处对齐；保留 wrangler.toml 的 fork 现在有处可填广告变量（此前按文档去 dashboard 配置会被静默忽略）。

### Fixed (fork 扩展性 / 跨平台)
- 语言切换器硬编码 `/^\/(ja)(\/|$)/` 剥前缀——新增语言后切换器全部产出 404/假链接，改为从 `locales` 动态构建（与 BaseLayout 同模式）。
- 文章页 hreflang 用全量 `locales`——ja-only 文章会产出指向 404 的 `hreflang="en"`/x-default；改用 `localesForEntry()`（原为死导出）∪ 当前 locale，x-default 由 BaseLayout 从 alternates 推导（不存在死链）。语言切换器同步受 `availableLocales` 约束。
- `check-links.ts` 在 Windows 上全站内链误报（`path.relative` 反斜杠未归一化）；`check-content.ts` 对 CRLF 检出不健壮（frontmatter 定界符精确匹配）——归一化 + 新增根级 `.gitattributes`（`* text=auto eol=lf`）根治。
- sitemap lastmod 对非 ASCII slug 因 percent-encoding 静默失配——`decodeURIComponent` 归一化。
- `check-i18n` 以 `locales[0]` 充当默认语言——改为 regex 读取真实的 `defaultLocale`。

### Fixed (SEO / 结构化数据)
- sitemap 不过滤 `noindex` 文章（rss/llms.txt 都过滤了）——`filter` 选项补上。
- `rss.xml.ts` 硬编码回退域名违反约束 #9——改用 `siteUrl`。
- 空列表页输出 `itemListElement: []` 的非法 ItemList——仅在有条目时注入。
- og:image:width/height 恒 1200×630 与真实封面（800×450）不符——文章页传真实尺寸，未知时省略（错误的尺寸比没有更糟）。
- 回退页 `<html lang="ja">` 包英文正文——`contentLocale`（servedLocale）修正 lang/og:locale；og:locale 格式改为 `en_US`/`ja_JP`（OG 规范）。
- 新增 `og:locale:alternate`、`article:published_time`/`modified_time`。
- `codes[].source` 定义于 schema 却从不渲染——Active label 与 Expired 表格补 Source 列（E-E-A-T 信号不再被静默丢弃）。
- 面包屑 Home 硬编码 `href="/"`（5 个组件）→ `homeUrl(locale)`；BreadcrumbList JSON-LD 的 `name: 'Home'` → 本地化 `nav.home`。
- 日期展示固定 `timeZone: 'UTC'`（schema 的 `z.coerce.date()` 把日期解析为 UTC 零点，负偏移时区本地构建会"早一天"）。
- gallery 图片 JSON-LD 用 `caption` 当 name——优先作者写的 `alt`。
- landing 自动跳转对爬虫渲染器关闸（bot UA guard），保留中文浏览器自动跳转的 UX。

### Fixed (a11y / 前端)
- **skip-to-content 链接**（WCAG 2.4.1 A 级此前失败）——`#main` + sr-only 焦点样式，文案走 locale JSON。
- **亮色模式品牌色文本对比度 3.1:1 → 4.8:1**：新增派生变量 `--brand-text`（从 `--brand-h/--brand-s` 计算，fork 只改 `--brand` 两个主变量仍然生效），`nav.DEFAULT`/TOC 激活态/搜索高亮全部切到文本安全色；StepByStep 步骤徽章白字改 `text-background`（暗色模式同步达标）。
- 硬编码英文 UI 文案全部 i18n 化（en/ja 双语 key）：CodeBlock "Tap to copy"、ExploreModules "View all"、QuickStart "Open"、LazyYouTube 播放标签（顺带去掉 `▶` emoji 字形，与 lucide 图标一致）、StickyBanner/ThemeToggle/TableOfContents aria-label、footer "Community/Legal"、回退页 "English fallback" 徽章、快速答案复制/有用反馈按钮的 aria/title、面包屑与上下篇导航 aria；补上被引用却不存在的 `nav.language` key。
- LazyYouTube 降级链接的 Enter 被 keydown `preventDefault` 吞掉（键盘用户在缩略图挂掉时无法打开 YouTube）——放行 fallback 链接自身。
- StickyBanner localStorage 未包 try/catch（存储被禁的访客抛未捕获异常，与其他脚本模式不一致）。
- theme-color meta 值 `hsl(var(--brand))` 永不解析——改为运行时从计算样式注入 + 主题切换时跟随（MutationObserver）。
- `/contact` 双 H1 → h2。
- CJK 阅读时长判定从 `locale === 'ja'` 放宽为 `['ja','zh','ko']`。

### Changed (CI / 工程化)
- CI 补跑自家门禁 `check-config` + `check-content`；加 `permissions: contents: read` 与 `timeout-minutes`；`setup.yml` 幂等化（`checkout -B` + `--force-with-lease` + 空 commit/已存在 PR 跳过）；`content-pipeline.yml` 去掉重复 audit 执行、失败不再吞掉建空 issue。
- **测试 34 → 51**：`parseEntryId`/`isPossiblyOutdated`/`STALE_*` 下沉到 `lib/content-utils.ts`（原在 `astro:content` 依赖模块内，vitest 无法加载）；补 `slugifyTag` CJK/纯符号分支、`absoluteUrl`、`languageAlternates`（含"never emits x-default"契约）测试。
- 移除零引用的 playwright devDependency。
- 隐私声明补 giscus / YouTube / Cloudflare Web Analytics 条目；cookie 同意横幅链接到隐私政策（ePrivacy 知情同意最佳实践）。
- vitest 路径别名改用 `fileURLToPath`（中文路径下 `.pathname` 会 percent-encode 导致 `~/lib/*` 解析失败——真实项目 dogfooding 发现）。

### Docs
- PRD Node 20 → 22（两处）；AGENTS.md 版本状态行、组件词汇表补 StatBar、命令表提 pagefind postbuild；deployment.md 期望页数改为不写死数字、curl 示例去尾斜杠、新增 CSP 配置 FAQ；CHANGELOG 补 1.8.1/1.8.2 compare 链接；apply-template.md navigation 示例补必填字段 `isContentType`、home 模块数 4→6；Giscus 口径统一"4 必填 + 1 可选"；anvil-update-codes 技能措辞对齐 frontmatter 时代；seo.md "v1.5–v1.8 资产"章节移到"下一步"之前；3 处注释从 legacy 路径 `src/content/<locale>/` 更正为 `src/content/wiki/<locale>/`。

## [1.8.2] — 2026-08-15

### Fixed
- **Lighthouse a11y 100 restored** (regression introduced by v1.5–v1.8 components, caught by a full re-test): small brand-orange text on tinted backgrounds (gameVersion badge, Quick Answer label, BossStatCard labels, codes table headers, article tag chips) now uses foreground color while keeping brand icons/borders; CodeBlock copy button's accessible name no longer mismatches its visible text.
- **`pnpm check-config` deployment domain gate**: errors when the effective SITE_URL host (env > wrangler.toml) ≠ `site.ts` domain — the wrangler.toml trap that caught the first real fork user is now machine-blocked.
- LandingLayout unused-catch lint warning cleared (lint fully clean).

### Fixed (v1.8.1)
- **Inline video placement** (from real-project dogfooding): new `<Video id title>` MDX component renders a YouTube player wherever the author places it in the body; the frontmatter `videos` array becomes the structured-data registry (VideoObject JSON-LD) + bottom fallback, with inline IDs auto-deduped from the fallback. Player core extracted to a shared `LazyYouTube` (event-delegation script — no more per-instance duplication; keyboard accessible; broken-thumbnail fallback to a plain link where i.ytimg.com is unreachable, e.g. mainland China).
- Article layout: bottom video section moved up to right after the body; Comments moved to the very end (body → videos → gallery → tags → related → prev/next → feedback → comments → sponsor).
- i18n: "On this page" (TOC) and "Quick Answer" hardcoded English now read from locale JSON (en/ja).

## [1.8.0] — 2026-08-15

**AnvilWiki v1.8 — AI 原生内容生产 + 新鲜度管道:第一性原理路线落地(技能分发、codes 数据结构、定时审计、选品工作流)。**

### Added
- **`.agent/skills/` ships with the template** (Agent Skills open standard — Claude Code / ZCode / Codex / Cursor auto-discover): `anvil-new-article` (any source material → build-passing MDX), `anvil-update-codes` (apply new/expired codes incl. multilingual sync), `anvil-refresh` (freshness audit report). Plus a "Conversational Content Authoring" section in AGENTS.md as the zero-install fallback — fork users generate pages by just talking to their AI tool, scripts become the verification backend (`check-content` + `build`).
- **Structured `codes` frontmatter**: `{code, reward, status, expiryDate, source}` array → auto-rendered CodesTable (Active section with one-click-copy CodeBlocks + freshness labels; Expired table kept for long-tail "is X still working" queries) + localized 4-question FAQPage JSON-LD. Demo codes articles (en/ja) migrated.
- **`pnpm refresh-audit`**: deterministic freshness engine (codes pages unverified >7d = P0, stale categories >90d = P1) — markdown report, no LLM, no mutations.
- **`content-pipeline.yml`**: weekly cron workflow that runs the audit and files a tracking issue. Never mutates content — fixing stays human/AI-gated.
- **`docs/game-selection.md`**: the fork-user funnel the template was missing — game selection (4-layer scoring incl. Trends demand validation + SERP gap check + two-source rule), then "first-day 10 pages" (codes → beginner guide → bosses → tier list) to compress the 2-8 week golden window.

## [1.7.0] — 2026-08-15

**AnvilWiki v1.7 — 内容表达力二期 + E-E-A-T:画廊、作者体系、联盟链接与内容 lint。**

### Added
- **Image gallery + lightbox**: `gallery` frontmatter (image/caption/alt) renders a thumbnail grid below the article body with a native `<dialog>` lightbox (prev/next/ESC/backdrop close). Each image emits ImageObject JSON-LD (Google Images eligibility). Thumbnails via Astro Image (WebP/srcset).
- **Author system**: `src/config/authors.ts` registry — registered authors link out from the article byline and upgrade Article JSON-LD author from Organization to **Person** (with `sameAs` knowledge-graph signal). Bare `author:` names keep working unchanged.
- **`<AffiliateLink>` MDX component**: affiliate/outbound CTA card with `rel="sponsored nofollow noopener"` baked in — an SEO-compliant second monetization channel (Steam links, game passes). Zero JS, no env gating (it's content, not infrastructure).
- **`pnpm check-content`**: content lint — no H1 in body, heading level skips, images without alt text, internal links with trailing slashes. Exits 1, CI-ready.

### Changed
- Demo: Stormcaller article now carries a gallery + named author; beginner guide demonstrates `<AffiliateLink>`; fixed a duplicate "What to Do Next" link.

## [1.6.0] — 2026-08-15

**AnvilWiki v1.6 — 创作者维护工具 + 部署自动化:翻译覆盖率、内链审计、一键初始化 workflow。**

### Added
- **`pnpm check-i18n`**: translation coverage report — missing articles & UI keys per locale vs English (`--strict` to gate CI). Wired into CI as a report step.
- **`pnpm check-links`**: internal-link audit over the built `dist/` — catches renamed-slug body links, homepage JSON links to unwritten articles, and locale links to pages that don't exist. Exits 1 on any broken link; wired into CI.
- **"Initialize AnvilWiki" workflow** (`.github/workflows/setup.yml`): fork → Actions → Run once with your domain — resets `wrangler.toml [vars]`, removes the project landing page, opens a review PR.
- **Cloudflare Web Analytics** env gating (`PUBLIC_CF_BEACON_TOKEN`): cookieless beacon, injected directly (no consent gate), empty = zero JS.
- **`docs/staying-up-to-date.md`**: how to merge upstream after forking (three-layer merge matrix), SemVer compatibility promises, post-sync checklist.
- **apply-template content scaffolding**: after clearing demo content, one schema-valid starter article is generated per chosen category.
- **README growth pack**: AnvilWiki vs Fandom vs DIY comparison table, suggested repo topics, and a "built a site? add it to the Showcase" PR invitation.

### Fixed
- Article tag links on English-fallback pages now point at the served locale's tag pages (was: requested locale → 404).
- Tag pages: hreflang alternates and the language switcher only offer locales where the tag actually exists (tag pages don't fall back).
- Demo content dead links: `/guides/fastest-leveling`, `/updates`, `/guides/video-walkthroughs` (caught by the new check-links on its first run).

## [1.5.0] — 2026-08-15

**AnvilWiki v1.5 — 内链 + 时效性 + 表达力:标签系统、版本号、最近更新页、MDX 组件与草稿流。**

### Added
- **Tag system landing pages**: `/tags` (per-locale cloud) + `/tags/<tag>` aggregation pages; article-page tags are now clickable links; tag pages carry ItemList + Breadcrumb JSON-LD and land in the sitemap with hreflang. No English fallback (list accuracy rule).
- **`gameVersion` frontmatter**: optional badge on the article header ("applies to v2.5") — freshness / E-E-A-T signal for fast-patching games. Demo articles tagged.
- **`/recent` page** (all locales): full recently-updated listing, feeding "patch notes"-style queries; pairs with sitemap lastmod.
- **`Callout` MDX component** (`~/components/mdx/Callout.astro`): info/tip/warn/danger callout boxes, zero JS.
- **`Accordion` MDX component** (`~/components/mdx/Accordion.astro`): native `<details>` collapsible panels, zero JS.
- **Draft mechanism**: `draft: true` frontmatter — visible in `pnpm dev`, fully excluded from production build (pages, lists, recent, related, hreflang, sitemap). `pnpm new-post` asks.
- **VideoObject JSON-LD**: one per `videos` frontmatter entry — Google Video search eligibility.
- **404 page recovery**: Pagefind search trigger + category entry points instead of a bare "back home".
- **Sponsor card (env-gated)**: `PUBLIC_SPONSOR_URL` / `PUBLIC_SPONSOR_IMAGE_URL` — empty = renders nothing (same contract as AdSense/Giscus). Plus `.github/FUNDING.yml`.
- **README fork warning**: wrangler.toml sole-source-of-truth warning surfaced next to the deploy button; `apply-template` also resets the new sponsor vars.

## [1.4.0] — 2026-08-15

**AnvilWiki v1.4 — 官网国际化版:中文官网 + 微信交流群 + demo 双向入口。**

### Added
- **Chinese landing page (`/zh/landing`)**: full bilingual landing — every section localized (hero, features, comparison table, showcase, docs, CTA), EN ↔ 中文 toggle, hreflang alternates (x-default → English). The landing speaks for the PROJECT, so it ships its own en/zh pair independent of the demo game's en/ja content locales.
- **Locale auto-detection**: visiting `/landing` with a Chinese browser language auto-redirects to `/zh/landing` (client-side, pre-render, zero runtime cost). Manual toggles are remembered in localStorage and always win.
- **WeChat community group**: QR-code card on both landing pages + README (Chinese & English sections) — "scan to add the maintainer and join the discussion group". Image optimized 952×1374 PNG → 480×693 JPG (44 KB).
- **Demo → landing entry**: hammer icon in the demo site header (desktop) + "AnvilWiki Template" link in the mobile menu, gated by `landingLinkEnabled` in `src/config/project.ts` — `apply-template` flips the flag when it removes the landing pages, so the entry never dead-links.
- **Maintainer attribution**: footer on both landing pages and README — 由 PNG 部落团队主理人 袁锐钦 开源 / "Open-sourced by 袁锐钦 (Yuan Ruiqin), lead of the PNGTRIBE team".

### Changed
- Landing announcement bar is now driven by a `PROJECT_VERSION` constant (kept in sync with package.json) — no more stale hand-written version strings.

## [1.3.0] — 2026-08-15

**AnvilWiki v1.3 — 审计清零版:未完成清单全部落地(codes 范式 + 阅读体验全家桶 + fork 工具链)。**

The final batch of the 2026-08 expert-audit backlog: a complete codes-content paradigm (the #1 traffic entry for game wikis), a full reading-experience suite, and fork-user tooling (locale scaffolding, homepage presets, schema validation).

### Added
- **Codes content paradigm**: `CodeBlock.astro` one-tap copy component + a complete demo codes article (en/ja) — 5 copyable codes, expiry table, "how to redeem" question-style H2s. Codes pages are the highest-traffic wiki entry; the template now ships a reference implementation.
- **Stale-content notice**: articles in time-sensitive categories (bosses / tier-list) older than 90 days automatically show a "possibly outdated" banner (pure `isPossiblyOutdated()` function).
- **Reading-experience suite on articles**: prev/next navigation within a category, reading-time estimate (CJK-adapted), top-edge reading progress bar, Quick Answer copy button, "was this helpful?" feedback, related lazy-loaded videos (`videos` frontmatter, YouTube IDs), print stylesheet (`@media print` strips chrome/ads), and drop-rate `StatBar` visualization component (used in the demo boss guide).
- **AMOLED black theme**: theme toggle now cycles light → dark → pure-black (`html.dark.black`, battery-saving surfaces for OLED phones), persisted + no-FOUC.
- **`pnpm new-locale`**: scaffolds a new language end-to-end (routing.ts + ui.ts + locale JSON clone + content dir) — the 4-place sync that was error-prone by hand.
- **Homepage presets in `apply-template`**: codes-focused / guides-focused / keep-demo skeletons generated from your game name and categories, instead of hand-editing a 270-line demo JSON.
- **`docs/home.schema.json`**: JSON Schema for the locale `home` namespace (displayType enum enforced); `$schema` refs wired into en/ja JSON for VS Code validation.
- **Landing page**: real demo screenshots (desktop home, boss article, mobile) replace skeleton placeholders; announcement bar; "Deploy to Cloudflare" button and `/landing` badge in README.
- **Mobile search entry**: prominent Search item at the top of the mobile menu (readers don't know Cmd+K).
- **i18n smoke tests**: 6 regression tests guarding against hardcoded-locale arrays in routes (the v1.1.0 bug class).

### Changed
- **README repositioned**: tagline and feature list now lead with "100% ad revenue yours"; feature list rebuilt to cover all shipped capabilities.
- **`apply-template` theme rewrite is line-based**: replaces only the 6 `--brand*` variable lines (tolerates custom vars/indentation in globals.css — the old whole-block regex silently broke on user edits).
- **`apply-template` resets `wrangler.toml [vars]`**: forks no longer risk shipping the demo site's Giscus config (SITE_URL set to their domain, Giscus values blanked).
- `new-post` scaffold now guides AI-Overview-friendly writing (question-shaped H2s, 40–60-word direct answers, summary field).
- `organizationJsonLd` emits `sameAs` (configurable in site.ts) for knowledge-graph entity association.
- docs/seo.md gains an "AI search era" chapter (what's built-in + 5 writing rules); content-format.md documents all frontmatter fields and the MDX components (`CodeBlock` / `StatBar`) + patch-notes paradigm.

### Fixed
- `migration-from-nextjs.md` now carries an honesty disclaimer (estimates not battle-tested).

## [1.2.0] — 2026-08-15

**AnvilWiki v1.2 — 专家团审计落地版:项目官网 + 阅读体验 + AI 搜索卡位 + 隐私合规。**

This release lands the findings of a 4-expert audit (SEO/growth · developer experience · reader UX · competitive analysis): a project landing page, wiki-grade reading infrastructure (scrollspy, boss data cards, mobile fixes), AI-search visibility (llms.txt, RSS), and consent-gated analytics.

### Added
- **Project landing page (`/landing`)**: 7-section marketing page introducing the AnvilWiki template itself (Hero with "100% ad revenue" positioning · Lighthouse proof bar · feature grid · comparison table vs Fandom/Starlight/DIY · showcase · docs entry · final CTA). Self-contained in `src/components/landing/` + `src/config/landing.ts`. `apply-template` CLI removes it automatically for fork users (`--keep-landing` to keep).
- **RSS feed (`/rss.xml`)**: default-locale articles, newest first, capped at 50, excludes `noindex`. `<link rel="alternate">` auto-discovery in `BaseLayout`. Uses the already-installed `@astrojs/rss`.
- **llms.txt (`/llms.txt`)**: Markdown site index for AI crawlers (ChatGPT/Perplexity/Claude), generated at build time from the content collection.
- **TOC scrollspy**: the in-view section's TOC link is highlighted while scrolling (pure IntersectionObserver, zero framework runtime).
- **Share button on articles**: native `navigator.share` sheet with clipboard fallback; labels via locale JSON (en/ja).
- **Back-to-top button**: appears after 600px of scroll on article pages.
- **Boss stat card**: optional structured `boss` frontmatter object (hp / weakness / resistant / location / recommendedLevel) rendered as a scannable data card above the article body (`BossStatCard.astro`). Demo boss guides filled in (en + ja).
- **`pnpm check-config`**: cross-validates nav-key / locale / displayType three-place consistency (AGENTS.md rules #4–#5) that `pnpm build` does not enforce.
- **Cookie consent (consent-gated tracking)**: GA / AdSense are no longer injected statically — they load only after the visitor accepts. Choice persists in localStorage; declining means trackers never load. Banner only renders when tracking env vars are set (zero-JS contract unchanged).
- Related-articles cards now show the description (line-clamp-2).

### Changed
- **Ads system rebuilt as Google AdSense-only**. Removed the iframe isolation ad setup (`public/ads/*.html`, `AdBanner.astro`, 7 `PUBLIC_AD_*` env vars) in favor of a streamlined AdSense integration. Ads now use 3 positions (Sticky / Sidebar / InContent), each an `<AdSenseSlot position="...">` component gated on `PUBLIC_ADSENSE_CLIENT` + one slot ID env var. The Sticky banner keeps its dismiss button + localStorage logic. Empty env = no ads rendered (Lighthouse 4×100 contract preserved). See PRD §10 for details.
- **Sticky banner is desktop-only by default** (`hidden md:block`): a 320×50 strip under the header permanently eats ~16% of a phone's first screen — a proven bounce driver. Remove the class to re-enable mobile.
- **sitemap `<lastmod>` injection**: article/list URLs now carry `lastModified ?? date` from frontmatter (the only sitemap field Google trusts for crawl scheduling).
- **Static asset caching**: `/_astro/*` served with `Cache-Control: public, max-age=31536000, immutable`.
- Mobile menu now includes the language switcher (was navigation-only — non-English readers couldn't switch on phones).

### Fixed
- **Third-locale forks fully 404**: five `getStaticPaths` implementations hardcoded `['ja']` while the CLI accepts any locale list — adding a 3rd language killed every route. All now derive from the `locales` array in `routing.ts`.
- **SearchAction pointed at a nonexistent `/search` route** (Pagefind is a client-side modal) — removed from `websiteJsonLd()`.
- **`noindex` frontmatter was never wired up** — now emits `<meta name="robots" content="noindex, nofollow">` via `BaseLayout`.
- **Cover-image docs contradicted the schema**: docs said "path under `/public`", but the Zod `image()` helper expects a path relative to the MDX (Astro Image pipeline). Docs unified.
- **Node version docs said 20** — pnpm 11 requires ≥22.13. CONTRIBUTING.md / deployment.md now say 22.
- **RSS links 404'd**: `@astrojs/rss` appends a trailing slash to relative links, but this site uses `trailingSlash: 'never'` — now passed absolute URLs.
- **GFM tables overflowed on mobile**: `.prose table` is now a scrollable block site-wide.

### Removed
- `public/ads/` directory (6 standalone ad HTML files) and `src/components/ads/AdBanner.astro` (iframe wrapper component).
- 7 `PUBLIC_AD_*` env vars (`PUBLIC_AD_MOBILE_320X50`, `PUBLIC_AD_SIDEBAR_160X300/600`, `PUBLIC_AD_BANNER_300X250/728X90/468X60`, `PUBLIC_AD_NATIVE_BANNER`).

## [1.1.0] — 2026-08-14

**AnvilWiki v1.1 — SEO & E-E-A-T 增强版。**

This release adds AI-Overview-oriented SEO features (TOC, Quick Answer, author byline, VideoGame JSON-LD) and broadens ad support (Google AdSense alongside the iframe ad isolation). Includes a round of naming normalization to keep config/locales schema generic (no demo-game-specific terms).

### Added
- **Article TOC**: Auto-generated table of contents from H2/H3 headings. Sticky on desktop, collapsible `<details>` on mobile (`TableOfContents.astro`).
- **Quick Answer summary block**: Optional `summary` frontmatter field rendered as a callout above the article body — optimized for AI Overviews and featured snippets.
- **Article author byline**: Optional `author` frontmatter field (falls back to `site.defaultAuthor`). E-E-A-T signal.
- **VideoGame JSON-LD**: Injected on the homepage for game entity recognition (`videoGameJsonLd()` in `seo.ts`).
- **Contact page**: New legal page at `/contact` with community links. E-E-A-T trust signal.
- **Google AdSense support**: `AdSenseSlot.astro` component + `PUBLIC_ADSENSE_CLIENT` env var. Coexists with the iframe ad isolation setup.

### Changed
- Homepage `displayType` enum renamed to generic names (`code-cards`→`badge-list`, etc.).
- CSS theme variable renamed: `--nav-theme` → `--brand`.
- Homepage JSON field names renamed (`eyebrow`→`badge`, `primaryCta`→`ctaPrimary`, etc.).
- Demo boss renamed: `gelum`→`emberfang`, `pyra`→`stormcaller`.
- `skinning.md` → `apply-template.md` (restructured as file-organized config reference).
- Ad HTML templates: ad network domain changed to placeholder.
- SEO docs: all knowledge claims cite public authoritative sources.

## [1.0.0] — 2026-08-13

**AnvilWiki v1.0 — 正式发布 / First stable release.**

This release covers everything since v0.2.0: the full PRD roadmap (v1.1–v2.0) is now ✅, the demo site ships Lighthouse 4×100, and optional features (search, ads, comments, image optimization, apply-template CLI) are all production-ready.

### Added
- **Comments system (Giscus, opt-in)**: `Comments.astro` component, env-gated (default off = zero JS, preserves Lighthouse 4×100). Official `<script async data-loading="lazy">` + dual MutationObserver dark-mode sync via postMessage. pathname mapping → different locales get independent threads. `data-lang` follows page locale. See `docs/comments.md`.
- Image `decoding="async"` + explicit `width`/`height` to prevent CLS (ListPage covers, VideoSection thumbnails)
- FAQ accessibility: `aria-expanded` sync on toggle + `data-faq-group` container
- WikiSidebar now visible on tablet (md breakpoint, was lg-only)
- Migration cost breakdown in `docs/migration-from-nextjs.md` (2-hour estimate per site)

### Changed
- PRD status updated: "设计中 · 待 review" → "已实现"
- PRD §14.2: v1.1 (frontmatter migration guide) marked as done
- PRD §14.2: v1.4 (Giscus comments) marked as done — `Comments.astro` env-gated, default off
- AGENTS.md: Hard Rule 9 now requires `SITE_URL` to include `https://` protocol (bare domain fails Astro build with `Invalid url`)
- AGENTS.md: added Hard Rule 11 (comments env-empty = null render contract)
- AGENTS.md: added Hard Rule 12 (`wrangler.toml` 接管 Cloudflare Pages env — dashboard env vars ignored when this file exists)
- Demo `home.hero.videoId` cleared (was placeholder)

### Fixed
- **Cloudflare Pages env injection**: `wrangler.toml` was missing the `[vars]` section, so the build process received ZERO env vars (including `SITE_URL` and all `PUBLIC_GISCUS_*`). Root cause: when `wrangler.toml` exists for a Pages project, it becomes the sole source of truth and the dashboard's "Environment variables" UI is ignored ([Cloudflare docs](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)). Fix: declare all build-time env vars in `[vars]`. This bug was previously masked because `process.env.SITE_URL || 'https://...'` fallback in `astro.config.ts` covered for the missing env.
- **`SITE_URL` protocol requirement**: now enforced — bare domain `anvilwiki.pages.dev` fails Astro build with `Invalid url`. `.env.example` was already correct (`https://...`), but the Cloudflare dashboard config had a bare domain. Documented in AGENTS.md Hard Rule 9 + `docs/deployment.md`.

## [0.2.0] — 2026-08-12

### Added
- `scripts/check-sitemap.ts` — verifies every sitemap URL returns 200
- `scripts/new-post.ts` — interactive MDX article scaffold
- `docs/content-format.md` — frontmatter format spec + migration guide from JS metadata format
- ESLint flat config (`eslint.config.js`) + Prettier config (`.prettierrc` + `.prettierignore`)
- `VideoSection` component — lazy-loaded YouTube embed (zero JS until click)
- `WikiSidebar` component — dynamic article navigation (auto-generated from MDX files)
- `TrendingNow` component — horizontal scroll-snap card row
- `InContentAd` component — page-internal ad slot
- Ad integration: `StickyBanner` in LocaleLayout, `SidebarAd` in WikiSidebar, `InContentAd` in ArticlePage
- Google Analytics + Search Console verification injection (env-var gated)
- CI workflow (`.github/workflows/ci.yml`) — lint + typecheck + build on every PR
- Issue templates (bug report + feature request) and PR template
- `CONTRIBUTING.md`
- `wrangler.toml` for local Cloudflare preview

## [0.1.0] — 2026-08-11

### Added
- Initial public release
- Astro 5 static site (`output: 'static'`, zero adapter, Cloudflare Pages native)
- Content Layer API + Zod schema for type-safe MDX articles
- i18n: as-needed prefix (English no prefix, others prefixed) with single-article English fallback
- Homepage: 8 JSON-driven modules with 4 displayTypes (badge-list / steps / ranked-grid / labeled-cards)
- SEO: Organization / WebSite / Article / BreadcrumbList / ItemList / FAQPage JSON-LD, hreflang, dynamic sitemap, robots.txt
- Theme: CSS variable theming (4 lines to re-theme) + dark mode with no-FOUC
- Ads: 广告 iframe isolation (6 slots), Sticky 320×50 with dismiss button, env-var gated
- Legal pages: about / privacy-policy / terms-of-service / copyright
- Demo content: fictional "Anvil Quest" game (5 MDX articles, en + ja)
- Docs: PRD (1600+ lines), deployment, apply-template (4-step guide), content-format, seo, ads, migration-from-nextjs
- Build: 27 pages, typecheck 0 errors

[Unreleased]: https://github.com/PNGTRID/AnvilWiki/compare/v2.15.0...HEAD
[2.15.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.14.1...v2.15.0
[2.14.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.14.0...v2.14.1
[2.14.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.13.0...v2.14.0
[2.13.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.12.0...v2.13.0
[2.12.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.11.0...v2.12.0
[2.11.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.10.0...v2.11.0
[2.10.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.9.0...v2.10.0
[2.9.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.8.0...v2.9.0
[2.8.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.7.1...v2.8.0
[2.7.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.6.3...v2.7.0
[2.6.3]: https://github.com/PNGTRID/AnvilWiki/compare/v2.6.2...v2.6.3
[2.6.2]: https://github.com/PNGTRID/AnvilWiki/compare/v2.6.1...v2.6.2
[2.6.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.5.1...v2.6.0
[2.5.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.5.0...v2.5.1
[2.5.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.4.1...v2.5.0
[2.4.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.3.1...v2.4.0
[2.3.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/PNGTRID/AnvilWiki/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/PNGTRID/AnvilWiki/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.19.0...v2.0.0
[1.19.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.18.0...v1.19.0
[1.18.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.17.1...v1.18.0
[1.17.1]: https://github.com/PNGTRID/AnvilWiki/compare/v1.17.0...v1.17.1
[1.17.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.16.1...v1.17.0
[1.16.1]: https://github.com/PNGTRID/AnvilWiki/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.15.0...v1.16.0
[1.15.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.14.1...v1.15.0
[1.14.1]: https://github.com/PNGTRID/AnvilWiki/compare/v1.14.0...v1.14.1
[1.14.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.13.1...v1.14.0
[1.13.1]: https://github.com/PNGTRID/AnvilWiki/compare/v1.13.0...v1.13.1
[1.13.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.12.1...v1.13.0
[1.12.1]: https://github.com/PNGTRID/AnvilWiki/compare/v1.12.0...v1.12.1
[1.12.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.11.2...v1.12.0
[1.11.2]: https://github.com/PNGTRID/AnvilWiki/compare/v1.11.1...v1.11.2
[1.11.1]: https://github.com/PNGTRID/AnvilWiki/compare/v1.11.0...v1.11.1
[1.11.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.8.2...v1.9.0
[1.8.2]: https://github.com/PNGTRID/AnvilWiki/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/PNGTRID/AnvilWiki/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/PNGTRID/AnvilWiki/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/PNGTRID/AnvilWiki/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/PNGTRID/AnvilWiki/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PNGTRID/AnvilWiki/releases/tag/v0.1.0
