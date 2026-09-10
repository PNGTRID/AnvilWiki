# 开发指导(给 AnvilWiki 本身写代码)

> 面向模板贡献者和维护者。fork 用户改配置/写内容请看 [apply-template.md](apply-template.md) 和 [content-format.md](content-format.md)。
> 硬约束(Agent 自动加载)在仓库根 [AGENTS.md](../AGENTS.md),本文解释**为什么**以及**怎么扩展**。

## 0. 第一条规则:三层分离

```
Code 层    src/pages, src/components, src/lib, src/i18n    — fork 用户永远不改
Config 层  src/config, src/locales, src/styles, wrangler.toml, astro.config.ts — fork 用户改一次
Content 层 src/content, src/locales/<loc>.json 的 home 数据 — fork 用户全替换
```

**每次写代码前自问:这个改动会不会强迫 fork 用户在 merge 上游时冲突?**
新功能尽量落在 Code 层且默认关闭(env 门控/optional 字段),这样 fork 用户 merge 上游永远安全——这是 staying-up-to-date.md 里 SemVer 兼容承诺的工程基础。

## 1. 验证清单(每次改动后,提交前)

```bash
pnpm typecheck       # 0 errors(astro check)
pnpm lint            # 0 errors 0 warnings(全绿)
pnpm test            # vitest 全过(纯函数放 lib/url、lib/seo,可测)
pnpm build           # Zod schema 校验 + 全站构建
pnpm check-content   # 内容 lint(改了 MDX 时)
pnpm check-links     # 内链审计(build 之后,必须跑)
pnpm check-i18n      # 加了 locale JSON key 后,看覆盖率报告
```

改了 `.astro` 路由文件 → 必跑 build(getStaticPaths 的错误只在构建时暴露)。
改了 workflow YAML → `python3 -c "import yaml; yaml.safe_load(open('<file>'))"`(v1.6 曾因 YAML 缩进断裂翻车)。

## 2. 常见扩展模式

### 2.1 加一个 frontmatter 字段

1. `src/content.config.ts` 加 Zod 字段(**必须 optional 或带 default**——旧文章永远要能构建,这是版本策略承诺)
2. 消费端:
   - 页面渲染 → `ArticlePage.astro`
   - 单独组件 → 新建 `src/components/article/XxxCard.astro`,在 ArticlePage 里 `return null` 门控
   - 结构化数据 → `src/lib/seo.ts` 加 builder(纯函数 + 测试)
3. UI 文案 → `src/locales/en.json` + `ja.json` 同步加 key(**禁止组件里硬编码文字**;Zod 默认值里的英文 fallback 除外)
4. 文档:`docs/content-format.md` 字段表加一行
5. 若 AI 要能产这类内容:`.agent/skills/anvil-new-article` 的 Step 2 硬规则同步更新

### 2.2 加一个 MDX 组件

- 放 `src/components/mdx/`,零 JS 优先(原生 `<details>`/`<dialog>`),颜色只走 `var(--brand)` token
- 语义色 warn/danger 用 amber/red Tailwind(先例:过期横幅、Callout)
- demo 文章里至少用一个(否则没人知道它存在)
- `docs/content-format.md` 组件清单 + AGENTS.md 组件词汇表同步

### 2.3 加一个页面类型(如 /tags、/recent)

- 英文无前缀:`src/pages/<name>.astro`;其他语言:`src/pages/[locale]/<name>.astro`
- **必须**双语两份(路由结构见 AGENTS.md Astro gotcha #6)
- hreflang:`languageAlternates((loc) => pathFor(loc), locales)`
- **不回退英文的列表页**(tags):hreflang 和语言切换器只列该内容真实存在的语言(先例:TagListPage 的 `availableLocales` 三层透传)
- URL 帮助函数一律放 `src/lib/url.ts`(纯函数可测,别在组件里拼)

### 2.4 加一个脚本(scripts/)

- 只用 node 内置依赖 + tsx,不引第三方(先例:全部 9 个脚本)
- 只读审计类(check-*)→ exit 1 可 gate CI;改写类(apply-template)→ 交互确认 + `--dry-run`
- package.json scripts 注册 + AGENTS.md 命令区同步 + 本文第 1 节验证清单按需更新

### 2.5 加一个 CI 步骤 / workflow

- 只读审计 → 可直接进 ci.yml;**会写仓库的** → 单独 workflow + `permissions` 最小化 + 产出走 PR 或 issue,**永不直推 main**(先例:setup.yml 开 PR、content-pipeline.yml 开 issue)

## 3. 关键架构决策(为什么是这样)

| 决策 | 为什么 | 推翻条件 |
|---|---|---|
| 纯 Astro 零 JS runtime | Lighthouse 4×100 开箱契约是模板的核心卖点 | 无(ADR-002) |
| 一切可选功能 env 门控默认关闭 | fork 用户开箱 = 零 JS 零 cookie,保 4×100 | 无 |
| 文章详情回退英文、列表页不回退 | 详情追求可达(URL 永不 404),列表追求准确(不展示不存在的内容) | 无 |
| slugifyTag 等纯函数放 lib/url | `~/i18n/content` 引 `astro:content`,vitest 无法导入——纯函数必须隔离 | 无 |
| tags 页语言切换器限 availableLocales | 切换器链到 404 = 流失 + SEO 负信号 | 无 |
| 脚本 = AI 的验证后端,不追求交互体验 | v1.8 起 fork 用户对话产页,AI 跑脚本质检 | 无 |
| content-pipeline 只开 issue 不改内容 | LLM/自动化改内容的供应链与质量风险不可控,人工门控必须保留 | 出现可靠的确定性数据源时(如官方 codes API) |

## 4. 发版流程(SemVer)

```
1. 全部改动已合入 main,第 1 节验证清单全绿
2. 版本五处中的三处:
   - package.json "version"
   - src/config/landing.ts PROJECT_VERSION + 中英横幅文案(announcement.text)
   - docs/roadmap.md 顶部「当前版本」行(曾连续 4 版漏更,PR #15 教训)
3. CHANGELOG.md(版本五处中另两处):Unreleased 段落改日期标题 + 底部 compare 链接加一行 + [Unreleased] 指针上移到新版本(v2.4.1 起曾连续 6 版漏更,见 CHANGELOG [2.6.2])
4. docs/PRD.md 更新记录表补一行 + §14.2 路线图该版本标 ✅(更新记录表曾停更 v2.14.0–v2.17.0 连续 7 版才被文档漂移审计发现——此步无门禁,漏更不报警)
5. AGENTS.md Status 段更新版本与要点
6. commit:feat(vX.Y): ... 一个 + git commit --allow-empty -m "chore(release): vX.Y.0" 一个
7. git push origin main(CI 绿 + Cloudflare Pages 自动部署)
8. gh release create vX.Y.0 --latest --notes "<CHANGELOG 同款中英摘要>"
```

Minor = 新功能(默认关闭/向后兼容);Patch = 修复;Major = breaking(需在 CHANGELOG 写迁移说明)。config 层兼容承诺见 [staying-up-to-date.md](staying-up-to-date.md)。

## 5. 测试策略

- **只测纯函数**:`lib/url`、`lib/seo`、`lib/content-utils`(parseEntryId/isPossiblyOutdated 已从 i18n/content 下沉,tests/ 现状以 `pnpm test` 输出为准;依赖 astro:content 的加载器不进 vitest,新纯逻辑请下沉到 lib)
- 不测 .astro 组件(构建 + check-* 已覆盖)
- 新增纯函数 → 同步加测试;修 bug → 先加复现测试再修

## 6. 已知踩坑速查(完整版见 AGENTS.md「Astro 5 Content Layer Gotchas」)

| 坑 | 规则 |
|---|---|
| getStaticPaths 看不到文件顶层 const | 数据全部 inline 进函数体 |
| `Astro.params.slug` 读 rest 参数 | 不是 `Astro.props.slug` |
| `getEntry` 不要带 `.mdx` 后缀,`getCollection` 的 id 带 | 用 `parseEntryId` |
| workflow YAML `run: |` 块内 shell 续行缩进 | 续行必须 ≥ 块缩进,多行字符串宁可写一行 |
| tailwind 无 `nav-foreground` token | 用 `.card` 或 `primary-foreground` |
