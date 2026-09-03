# GSC 引导加强 + 文档中心站内搜索 设计

日期:2026-09-03 · 状态:已批准(用户拍板「两层都做」) · 发版:v2.14.0

## 背景与问题

有用户问「模板有没有 GSC API 接入指引」,AI 助手回答含糊。排查确认:**内容存在**(开发手册第 7 课 ai-ops 第二步就是完整 GSC 5 分钟接入教程,含群组中转的坑),但三层引导全部失灵:

1. **目录零信号**:课名「让 AI 替你运营:anvilwiki-ops 与 MCP」完全看不出含 GSC 接入;侧边栏短标题(冒号前段)更是只剩「让 AI 替你运营」。
2. **手册不在搜索索引里**:Pagefind 的规则是——站点里任何页面一旦标了 `data-pagefind-body`(目前仅 ArticlePage.astro:356),**未标记页面全部排除出索引**。落地页与两本手册(41 课×双语)对站内搜索完全隐形。
3. **最需要指路的时刻没有指路**:`anvil-ops doctor` 在 gsc-config 缺配置时只说「CF-only 降级运行」,不给「怎么配」的链接;README/docs 索引/deployment.md 也都没有从「GSC」角度的直达路标。

另注意术语混淆源:GSC **站点验证**(HTML 文件,deployment.md/上线课)≠ GSC **API 数据接入**(ops 工具包)——引导文案要显式区分。

## 设计

### 第 ① 部分:GSC 引导快赢包(docs + 一处 ops 小代码)

1. **shortTitle 覆盖字段**(唯一新代码点):
   - `lib/handbook.ts` `shortTitle(title, override?)` — override 非空则优先;`HandbookEntry.data` 增 `shortTitle?: string`。
   - `content.config.ts` handbook schema 增 `shortTitle: z.string().max(40).optional()`。
   - `HandbookNav.astro` 两处调用改传 `shortTitle(c.data.title, c.data.shortTitle)`。
   - +2 单测(override 优先/空 override 回退派生)。
2. **第 7 课改名×双语**(slug `ai-ops` 不动,互链零影响):
   - zh title「让 AI 替你运营:GSC 数据接入、metrics 与 MCP」/ en "Run Ops with AI: GSC setup, metrics & MCP";
   - frontmatter `shortTitle`:zh「AI 运营与 GSC 接入」/ en "AI ops & GSC setup" → 侧边栏/hub 直接露出 GSC;
   - description 改写露出「GSC API 接入」(zh 40–165 字、en 40–165 chars 均守住);
   - 课内 H2「第二步:接上两个数据源(GSC 5 分钟,CF 2 分钟)」→「第二步:GSC API 接入(5 分钟)+ CF Web Analytics(2 分钟)」(页内 TOC 露出 GSC API);`updated` 同步 2026-09-03。
3. **引用同步**(一致性铁律):`en/contribute-back.md` 下一课链接文本、`landing.ts` en+zh 开发手册描述补 GSC 字样。
4. **三处指路互链**:`docs/README.md` 找文档决策树增「要接 GSC API」行;`docs/deployment.md` 数据复盘节链到接入教程(`./handbook/zh/ai-ops.md` 相对链);`tools/anvil-ops/README.md`「GSC setup」节反链手册(GitHub blob 绝对链——该 README 会发到 npm,相对链会断)。
5. **doctor 指路**:`doctor.ts` gsc-config 缺配置的 `detail` 追加教程 URL(https://anvilwiki.pages.dev/landing/docs/ai-ops/)。注意 `fix` 字段只在 `!ok` 时渲染,而「未配置」是 env 门控的 `ok:true`(契约),所以走 detail;测试补 URL 断言。

### 第 ② 部分:文档中心接入全站搜索

1. **索引**:`HandbookChapter.astro` 的 `<article>` 加 `data-pagefind-body`,面包屑 nav 与页脚 footer 加 `data-pagefind-ignore`,H1 加 `data-pagefind-meta`(对齐 ArticlePage 做法)。效果:41 课×双语进入 Pagefind 索引,且因 Pagefind 按 `<html lang>` 自动分语言索引,zh 页搜出 zh 结果;wiki 文章里搜「GSC」也能命中手册课。营销落地页、hub 列表页不标记=不进索引(噪音隔离)。
2. **UI**:`SearchButton.astro` 增可选 `labels` props(trigger/placeholder/noResults/close),缺省仍走 `getUi(locale)`——zh 不是 wiki locale(`locales=['en','ja']`),zh 手册页文案必须由 landing.ts 提供;`landing.ts` 接口+双语数据增 `search` 段。`LandingLayout.astro` 增 `search?: boolean` prop,true 时在 header 右侧组(ThemeToggle 前)渲染 SearchButton;四个 docs 路由文件(en+zh 的 index/learn/dev/[slug])传 `search`。营销 landing 不开。SearchButton 自带的已知坑修复(drawer-in-form、滚动锁、结果尾斜杠、window global)随组件复用直接继承。
3. **防回退契约测试**:`tests/handbook.test.ts` 增静态断言——HandbookChapter.astro 源码含 `data-pagefind-body`(对齐 workflows.test.ts 契约钉法)。

## 不做(YAGNI)

- 不给 wiki 搜索加语言过滤 UI(Pagefind 按 html lang 自动分语言索引,现状已够)。
- 不给营销落地页挂搜索。
- 不动 GSC 站点验证文档(deployment.md 已覆盖,只在复盘节加互链)。
- 不建独立 `docs/gsc.md`(内容唯一真相源留在手册课,他处指路——防双源漂移)。

## 测试与门禁

- 根仓:lint / typecheck / test(handbook 套件 +2+1)/ check-config / check-content / check-i18n --strict-ui / build / check-links。
- ops:`pnpm test`(125+,doctor 断言更新)/ typecheck / build。
- 一致性扫描:旧课名全仓 grep(仅 4 文件命中:两课源文件+en/contribute-back+landing.ts,全在改动面内);双语 parity 测试钉 slug/manual/order 不变。

## 发版

两个功能 commit(① 引导包、② 搜索)+ 1 个 release commit(package.json / landing.ts PROJECT_VERSION / CHANGELOG [2.14.0](收编 [Unreleased] 两条)+ 横幅 en/zh + AGENTS.md Status 行)→ push → `gh release create v2.14.0 --target main` → CI 绿 → playwright 线上验证(横幅/课名/搜索按钮/data-pagefind-body)。
