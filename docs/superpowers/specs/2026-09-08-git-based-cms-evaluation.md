# Git-based CMS 可选接入评估(issue #21 · 可视化编辑层)

日期:2026-09-08 · 状态:评估完成,**待用户拍板** · 触发:社区 [issue #21](https://github.com/PNGTRID/AnvilWiki/issues/21) + roadmap 专家团结论(f3ea61e:「优先评估现成 git-based CMS 的模板级可选接入」)· 调研人:每日自动维护任务(乙级提案,不实现)

## 背景与评估维度

issue #21 请求「初始化/内容管理可视化」。专家团已定向:**不自研本地常驻后台**(第三通道是持续税),优先评估现成 git-based CMS。评估围绕本模板的五个硬事实:

1. **内容是 .mdx**:组件词汇(CodeBlock/StatBar/Video/Callout/Accordion)是模板核心能力,CMS 必须能原样保存 MDX 正文。
2. **纯静态零 adapter**(ADR-002 邻接):任何要求主站加服务端路由的方案都违反架构底线。
3. **`content.config.ts`(Zod)是 frontmatter 唯一真相**:CMS 的字段定义是第二真相源,存在双源漂移风险(专家团已点名)。
4. **i18n 目录结构**:`src/content/wiki/<locale>/<category>/<slug>.mdx`,locale 全目录化(en 也有前缀目录)。
5. **封面是相对路径**(`../../../../assets/covers/…`)+ 1200×675 由 `pnpm gen-covers` 生成——CMS 媒体库习惯单一 uploads 目录,适配别扭但可配。

## 候选评估(2026-09 实时调研)

### Sveltia CMS —— ❌ 排除(MDX 不支持)

维护活跃(v0.171.0+,2026-08 仍在发版,作者活跃推广),Decap 的现代继任者定位,轻量快。**但维护者已确认 `.mdx` 不是受支持的扩展**(issue [#79](https://github.com/sveltia/sveltia-cms/issues/79),2026 年仍在 topic 中)——本模板全部内容集合都是 .mdx,等于编辑不了主内容。只能编辑 YAML/JSON 数据文件(如 locales JSON),而 UI 文案有 check-i18n 门禁管着,价值很低。

### Decap CMS —— ⚠️ 可用但平庸

Netlify 交棒后的社区项目,「independently maintained by open-source enthusiasts」(EU 团队,赞助驱动),维护节奏被社区诟病(连 Sveltia 官方都以「successor」自居)。技术上能编辑 .mdx:正文按原始 markdown 保存,MDX 组件语法作为黑盒文本可存活;frontmatter 表单可覆盖 codes 数组等结构化字段。但有三个门槛:① 需要自建 OAuth 网关(CF Workers 上有社区方案,配置门槛真实存在);② `config.yml` 字段定义与 Zod schema 双源;③ 对 MDX 组件词汇零理解——作者在 CMS 里排版组件正文是盲写。**结论:能跑,体验平庸,不建议作为推荐形态。**

### Keystatic —— ✅ 唯一 MDX 一等公民,但形态要选对

Thinkmill 出品,TS 配置、无数据库、**MDX document 字段一等公民**、有**官方 Astro 集成**(Astro 官方文档收录),GitHub 模式走 Keystatic GitHub App + 写权限,分支可选实现类 staging 流。**关键限制:GitHub 模式需要服务端 API route**(`/api/keystatic/astro`)——纯静态主站加 route 就得引 adapter,违反架构底线。社区实测([2026-05 PoC](https://www.quevin.ai/blog/2026-05-24-testing-keystatic-cms))给出的成熟形态是:**admin 部署为独立的 Pages 项目,指向同一个内容仓库**——主站保持纯静态,编辑界面在旁边。代价:多一个部署单元 + `keystatic.config.tsx` 与 Zod 双源 + 多语言目录结构支持有限(可能只能按 locale 配 collection)。

## 对比

| 维度 | Sveltia | Decap | Keystatic |
| --- | --- | --- | --- |
| 维护状态(2026-09) | ✅ 活跃 | ⚠️ 社区维持 | ✅ 活跃(Thinkmill) |
| **MDX 正文** | ❌ 不支持 | ⚠️ 黑盒文本可存 | ✅ 一等公民 |
| 主站零 adapter | ✅ 纯前端 | ✅ 纯前端 | ❌ 需服务端 route → 独立 admin 站绕开 |
| OAuth/GApp 门槛 | 中(CF Worker auth) | 中(自建网关) | 中(GitHub App 安装) |
| schema 双源 | 有(YAML config) | 有(YAML config) | 有(TSX config,**可 TS 化缓解**) |
| i18n 多目录 | 部分 | 部分(multiple_folders) | 有限(按 locale 配 collection) |
| frontmatter 表单能力 | 强 | 中 | 强(typescript 字段) |

## 结论与建议

1. **暂不接入主站**。AI 原生(对话产页 + 技能)是本模板的定位与差异化;git-based CMS 解决的「非技术成员 GUI 写作」在当前用户结构里是低频需求。为此在模板里常驻第二套内容入口(配置、文档、维护、校验)是负资产。
2. **n≥3 用户明确要 GUI 时,推荐形态:Keystatic 独立 admin 站**(不碰主站纯静态架构;一个指向内容仓库的独立 Pages 部署 + 模板附 `keystatic.config.tsx` 模板与文档)。Decap 作为保底备选,Sveltia 因 MDX 排除。
3. **解锁项(真做之前的先决甲级工程)**:「Zod schema → CMS 配置生成器」——从 `content.config.ts` 单一真相**生成** `keystatic.config.tsx`(或 Decap config.yml),把双源变单源。没有它,每次 schema 演进都要人肉同步 CMS 配置,漂移风险迟早兑现;有了它,CMS 接入的维护成本才可控。此项本身纯增量、可测(生成器快照测试),届时可按甲级流程直接实现。

## 调研来源

- [Sveltia CMS issue #79 — MDX not supported](https://github.com/sveltia/sveltia-cms/issues/79) · [npm @sveltia/cms](https://www.npmjs.com/package/@sveltia/cms) · [Jamstack 目录](https://jamstack.org/headless-cms/sveltia-cms/)
- [Decap CMS 官网](https://decapcms.org/) · [About(欧盟维护)](https://decapcms.org/about/) · [Sveltia 的继任者定位](https://sveltiacms.app/en/docs/successor-to-netlify-cms) · [2026 评测](https://www.luckymedia.dev/insights/decap-cms)
- [Keystatic GitHub mode 文档](https://keystatic.com/docs/github-mode) · [Astro 官方 Keystatic 指南](https://docs.astro.build/en/guides/cms/keystatic/) · [2026-05 独立部署 PoC](https://www.quevin.ai/blog/2026-05-24-testing-keystatic-cms) · [2026 评测](https://www.luckymedia.dev/insights/keystatic)
