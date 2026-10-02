# AnvilWiki 全项目代码审查报告(最终报告)

- **报告日期**:2026-10-03
- **审查对象**:AnvilWiki 全项目源码(Astro 7 + Cloudflare Pages 开源游戏 wiki 模板)
- **报告性质**:仅收录经独立复核员亲自读码确认(`verdict="confirmed"`)的条目;每条的「问题/建议」转写自复核员的验证结论,行号与证据均以复核为准

---

## 一、总览

### 审查范围与方法

- **范围**:AnvilWiki 全项目源码,默认排除 node_modules、构建产物、测试文件、`*.d.ts` 与生成代码(范围定义见 `.zcode/workflow-drafts/full-code-review.dwf.ts`)。本次确认发现全部集中在 `src/` 站点代码层(`src/lib`、`src/config`、`src/i18n`、`src/pages`)。
- **方法**:源码分片并行,各分片评审员逐文件按 8 维度审查;每条发现由独立复核员(与发现者无共享上下文)亲自打开文件读码验证。本次送审发现 10 项,**全部复核确认,0 项驳回**;10 项互不重复,无需合并。

### 发现统计

| 严重度 | 条数 |
| --- | --- |
| 高 | **0** |
| 中 | **1** |
| 低 | **9** |
| 合计 | **10**(另有 0 项复核未通过) |

### 维度分布

| 维度 | 名称 | 确认条数 | 明细 |
| --- | --- | --- | --- |
| 1 | 正确性 | 1(低) | `src/i18n/ui.ts:90-92` |
| 2 | 可维护性 | 7(中 1 + 低 6) | `src/lib/shared-ui.ts:36-47`(中);`src/config/landing.ts:29`、`src/config/navigation.ts:27-35`、`src/i18n/content.ts:21,44-46`、`src/lib/covers.ts:100-104`、`src/pages/llms.txt.ts:54`、`src/pages/rss.xml.ts:52`(低) |
| 3 | 安全性 | 0 | — |
| 4 | 性能 | 1(低) | `src/i18n/ui.ts:55-59` |
| 5 | 代码架构与组件化 | 0 | — |
| 6 | UI 组件化与设计一致性 | 0 | — |
| 7 | 调试残留与类型安全 | 1(低) | `src/i18n/ui.ts:78-88` |
| 8 | UI 三态与边界体验 | 0 | — |

---

## 二、确认发现明细

> 排序:高 → 中 → 低;同级内按文件路径排序。

### [中] src/lib/shared-ui.ts:36-47(关联:CookieConsent.astro:81-82、AdsterraSlot.astro:101-102、MobileAnchorAd.astro:123-124)

- **问题**:consent 的两个字面量(`'aw-cookie-consent'` / `'aw:consent-accepted'`)硬编码在 4 个文件:CookieConsent.astro:81-82、AdsterraSlot.astro:101-102(位于第 90 行起的 `<script is:inline>`)、MobileAnchorAd.astro:123-124(位于第 112 行起的 `<script is:inline>`);shared-ui.ts:46-47 导出的 `CONSENT_STORAGE_KEY`/`CONSENT_ACCEPTED_EVENT` 在 src/ 内零 import 方,tests/ 对字面量零命中——无任何契约测试钉住 4 处一致。同步注释已经实际漂移过一次:shared-ui.ts:36-39 只点名 CookieConsent 和 AdsterraSlot 并说「keep the two in sync」,漏了 v2.28.0 新增的 MobileAnchorAd;CookieConsent.astro:19 却说「keep the three files in sync」,两处口径互不一致——证明人肉同步已现实失败过。**实际影响**:轮换 storage key 或事件名(如隐私合规要求)时需人肉同步 4 个文件,漏改任一处则该广告组件的同意门控 fail-closed 静默失效(读不到同意状态且事件永不命中,广告永不加载 = 收入静默归零;无 fail-open 合规风险),八门禁全绿抓不到。本项目对同构双通道同步(clear-demo 清单↔注册表、DEMO_VALUES↔DEMO_VAR_VALUES 等)均有契约测试先例,此处是漏网的同构风险。
- **建议**:必备项是**契约测试**(纯常量模块只能部分解决):剥离注释后扫描 3 个组件脚本中的两个字面量,与 shared-ui.ts 导出常量比对(参考仓内 clear-demo 清单↔注册表契约测试先例)。示意:

  ```ts
  // tests/consent-contract.test.ts(示意)
  const LITERAL = 'aw-cookie-consent';
  const files = [
    'src/components/layout/CookieConsent.astro',
    'src/components/ads/AdsterraSlot.astro',
    'src/components/ads/MobileAnchorAd.astro',
  ];
  // 每个文件剥离注释后,必须恰好包含与 shared-ui.ts 导出一致的两个字面量
  ```

  可叠加:把两个常量抽进零依赖纯常量模块(不 import getUi,避免把 locale JSON 拖进客户端 bundle),CookieConsent 的 processed `<script>`(Astro 打包模块,可 import)改用之;但 AdsterraSlot/MobileAnchorAd 的 `is:inline` 脚本按设计不打包无法 import,仍硬编码并由契约测试兜底。无论走哪条路,**先**把 shared-ui.ts:36-39 注释补全 MobileAnchorAd 并统一四处同步口径(顺带修 CookieConsent.astro:19 的「three files」旧口径)。

### [低] src/config/landing.ts:29

- **问题**:第 29 行残留一行悬空注释「Landing-page routes per locale (for language switching + hreflang).」,紧接其后的第 30-35 行详细块注释才是 `landingPath` 的真实说明;前者描述的复数 routes 机制不存在(第 36-37 行实际是单根 URL 函数,返回单个字符串 `'/landing/'` 或 `'/zh/landing/'`)。git 历史(`git log -L 29,38`)证实:2a93d29 引入该单行注释作为唯一注释,eb776e5(v2.25.0)在其下追加详细块注释并改写函数体时未删旧注释,旧注释自此成为叠放残留。叠放的两个 JSDoc 语义重叠且措辞不符,IDE 悬停与下一个维护者会读到互相矛盾的说明。零功能影响,纯文档噪音。
- **建议**:删除第 29 行残留单行注释,保留其下方的详细块注释(第 30-35 行,紧贴声明、内容准确)。一行删除,无行为影响。

### [低] src/config/navigation.ts:27-35(关联:scripts/apply-template.ts:290、docs/apply-template.md:108-112)

- **问题**:`NavigationItem.order` 字段全仓零消费者:声明于 src/config/navigation.ts:27-28(注释宣称「Sort order in nav menu, lower = earlier」),32-35 行四项各带 `order: 1..4`,但 `NAVIGATION_CONFIG` 的全部消费点(SiteHeader.astro:59/117 `.map`、ListPage.astro:31 与 ArticlePage.astro:60 `.find`、404.astro:58 `.map`、lib/navigation.ts:34 `for...of`、HomePage.astro:126/155 数组索引、navigation.ts:39 `CONTENT_TYPES` 只 map `.key`)一律依赖数组物理顺序,无任何 `sort((a,b)=>a.order-b.order)`。src/scripts/tests 中唯一 `.order` 消费是 handbook collection 的 `data.order`(lib/handbook.ts:83 真排序)与 home.explore.modules 的同名字段(tests/apply-template.test.ts:1269),均与本字段无关。复核另发现两处加重证据:① scripts/apply-template.ts:290 `rewriteNavigationTs` 按选择顺序生成 `order: ${i+1}`,是该死字段的**活跃生产者**;② docs/apply-template.md:111-112 面向 fork 用户宣称「isContentType 与 order 都是必填(order 控制导航排序)」——文档明确误导,且与接口 `order?: number` 可选声明自相矛盾。**实际影响**:无运行时影响;但 fork 维护者按文档改 order 调导航顺序不会生效(必须改数组位置),初始化 CLI 每轮仍生成该死字段。
- **建议**:二选一消除偏差,推荐**删除方案**(符合复杂度预算):
  - 删 src/config/navigation.ts:27-28 接口字段与 32-35 行 order 值;
  - 按全仓一致性同步 scripts/apply-template.ts:290 生成串(去掉 `, order: ${i + 1}`)与 docs/apply-template.md:108-112 示例及「order 都是必填/order 控制导航排序」表述;
  - E2E(scripts/e2e-apply-template.mjs)经查不断言该字段,删除无门禁影响。
  备选**实现方案**:在 `getDynamicNavigation`(lib/navigation.ts)与 SiteHeader 渲染前做 `[...NAVIGATION_CONFIG].sort((a,b)=>(a.order??0)-(b.order??0))` 并更新文档为实际行为。注意注释「Optional, defaults to array order」仅在实现方案下才成立,删除方案应随字段一并删除。

### [低] src/i18n/content.ts:21,44-46

- **问题**:同一模块 `~/lib/content-utils` 被拆成两条 import:第 21 行(`selectRelatedEntries, newestFirst`)与第 45 行(`parseEntryId`),后者夹在 `isPublished` 函数与文件中部注释之间,而非顶部 import 块。阅读时易误以为两处来自不同模块,import 夹在函数定义之间打断了文件的线性结构。无运行时影响(ESM hoisting),lint 也未覆盖此类重复(eslint.config.js:27-31 无 no-duplicate-imports/import/no-duplicates)。
- **建议**:合并为顶部一条:

  ```ts
  import { newestFirst, parseEntryId, selectRelatedEntries } from '~/lib/content-utils';
  ```

  删除第 44-45 行的中部注释与 import。⚠️ **第 46 行 `export { parseEntryId };` 必须保留**——它是 re-export,src/lib/navigation.ts:9 直接从 `~/i18n/content` 引用 `parseEntryId`,src/lib/content.ts:27 再转手,整块删掉会打红 typecheck;注释可并入该 export 上方。文件末尾 254-257 行的 `export { isPossiblyOutdated, ... } from '~/lib/content-utils'` 是纯 re-export 形式(不引入本地绑定),不属重复 import,无需处理。

### [低] src/i18n/ui.ts:55-59

- **问题**:`getUi` 对非默认 locale(ja)每次调用都重新执行 `deepMerge` 深合并 en+ja 两个 JSON(各 267 叶子键),无记忆化;en 调用直接返回源对象零成本(ui.ts:56)。问题真实存在但量级极小:复核员实测(node 基准,真实 en.json/ja.json)单次 deepMerge ≈ 12.9µs,全量构建 181 页中 ja 页约 29 页、每页约 10 次 getUi 调用(BaseLayout.astro:134/147 单组件即 2 次),累计约 **4ms/构建**——修正了原发现的「数秒级」高估(高估约三个数量级)。用户侧零影响,纯构建期微浪费,纯可选优化。
- **建议**:加模块级缓存:

  ```ts
  const uiCache = new Map<string, typeof en>();
  // getUi 非 en 分支先查缓存,未命中才 deepMerge 并写入
  ```

  注意 memo 后所有调用方共享同一对象引用——复核员已逐一核查 ~20 个调用点(组件内 `const ui = getUi(locale)` 只读渲染、HomePage 解构为 const、shared-ui.ts:32 返回 `.shared`),均无改写行为,安全;且现实现叶子值(含数组)本就按引用与源 JSON 共享,memo 不改变别名语义。可与该文件任何后续改动顺带落地,不值得独立发版。

### [低] src/i18n/ui.ts:78-88

- **问题**:导出的翻译函数 `t(locale, key)` 是**死代码**,全仓零消费:所有 23 处 `from '~/i18n/ui'` 的 import 只导入 getUi/HomeUi/SharedUi/getHomeFaq,无一导入 t;命名空间导入(`import * as`)、动态导入、`ui.t(` 调用形式以及 tools/ 目录均零命中。其返回类型 `unknown` 与项目契约 getUi→`typeof en` 的结构化类型路线相悖。仓内已有三处同名不同义的 t(ui.ts 导出、CodesTable/ArticleGallery 本地 helper、HandbookHub props),新维护者极易误以为 ui.ts 的 t 是推荐翻译入口,实则无人使用。
- **建议**:删除 `t()` 函数(78-88 行,含 docstring),零连锁影响——`isLocaleSafe`/`messages` 均被 getUi 使用、与 t 无关。若担心 fork 用户使用,备选方案是在 docstring 标注「未在模板内使用,优先 getUi 结构化访问」。注意 CodesTable.astro:35、ArticleGallery.astro:29、HandbookHub.astro:15 内的 t 是各自独立的本地 helper/props,与本次删除无关,**勿误删**。

### [低] src/i18n/ui.ts:90-92

- **问题**:私有 `isLocaleSafe` 用 `value in messages` 判断 locale(src/i18n/ui.ts:90-92),`in` 检查整条原型链——node 实证 `'toString' in messages` → true、`typeof messages.toString` → function、`Object.hasOwn(messages,'toString')` → false,即 'toString'/'constructor' 等也会命中;同时与 src/i18n/routing.ts:48-50 已导出的 `isLocale`(数组 includes 精确匹配)功能重复,构成两处 locale 判定真相源。**当前无功能损坏**:getUi('toString') 等会取出 Object.prototype 的函数值,但 deepMerge(ui.ts:31-32)的 typeof 检查将其挡下回落英文,行为与任意无效 locale 一致——问题在于正确性依赖下游巧合兜底而非判断本身,若日后 deepMerge 入口放宽或新增直接消费 `messages[locale]` 的调用点即暴露。
- **建议**:首选——ui.ts:15 的 import 改为 `import { defaultLocale, isLocale, type Locale } from './routing';`,`isLocaleSafe` 内部改 `return isLocale(value)`(或直接删掉 isLocaleSafe,getUi:57 改用 `isLocale(locale)`)。该文件已 import 同一模块且无循环依赖(routing.ts 无反向 import),shared-ui.ts:23 已有同款先例。最低限度改 `Object.hasOwn(messages, value)`(tsconfig 继承 astro strict 默认 ES2022 lib,可用)。

### [低] src/lib/covers.ts:100-104

- **问题**:`spliceImageIntoFrontmatter` 的字符串 replacement 存在 `$` 特殊替换模式展开:外层 `src.replace(fmRe, `---${eol}${newBlock}${eol}---``)(covers.ts:104)把原 frontmatter 全文(newBlock)拼进替换串字面量,若 title/description 等字段含字面 `$&`、`$`` ` ``、`$'`、`$1` 会按特殊模式展开——复核员 1:1 复刻 node 实测:`$'` 把整篇正文拼进 frontmatter、`$&` 重复整个匹配致 frontmatter 嵌套碎裂、`$1` 展开为 block 本身、`$$` 静默吞一个 `$` 而结构仍合法(build 不红);`$5`/`$2` 等超过捕获组数的序列实测字面保留安全,最常见的「价格 $5」标题不触发。**实际影响**:触发时 gen-covers 把破坏后的 frontmatter 原子写回作者 MDX 源文件(scripts/gen-covers.ts:315-325 wireFrontmatter)——`$&`/`$'`/`$1` 场景 frontmatter 碎裂,pnpm build 的 Zod schema 校验红,可发现可 git 恢复;唯一半静默的是 `$$` 场景仅吞一个 `$`(标题轻微变化,build 不红)。触发概率极低,故 low。内层两处(covers.ts:100/102)的 `$1` 是有意引用捕获组属合法用法,且 line 内容来自 `coverFilename(entryId)`(纯路径字符,无 `$`),无实际风险,改回调仅为与 v2.7.1 先例一致。tests/covers.test.ts:62-93 无 `$` 序列覆盖。
- **建议**:与 v2.7.1 先例(apply-rewrites.ts:473)对齐改**函数回调**(已实测有效):

  ```ts
  // 外层
  src.replace(fmRe, () => `---${eol}${newBlock}${eol}---`);
  // 内层(description 同理)
  block.replace(/^(category:[^\r\n]*)/m, (match) => `${match}${eol}${line}`);
  ```

  顺手在 tests/covers.test.ts 加一条 title 含 `$'`/`$$` 的拼接不变形契约测试防回退。

### [低] src/pages/llms.txt.ts:54

- **问题**:第 54 行硬编码英文分类枚举句 `Articles cover boss guides, tier lists, codes, items, and beginner tips.`——同文件文章列表(:60-66)动态生成,这句分类清单却写死;且与 site.description(src/config/site.ts:67-68,同样枚举 boss guides/tier lists/codes/…/beginner tips)双源重复,两处措辞**已现漂移**(llms.txt 用 'items',site.description 用 'item locations'),grep 全仓确认该枚举句仅此两处、无契约测试钉住。**实际影响**:fork 用户增删分类后(NAVIGATION_CONFIG 注释明确指引按游戏改,navigation.ts:4),这句 framework 层硬编码文案不被 apply-template 重写、无任何测试守卫,成为给 LLM 爬虫看的过时描述;同时 site.description 单独修改时第二份枚举静默漂移(已实际发生),违背全仓一致性约束。无功能错误,不产生 404/构建失败。
- **建议**:推荐最小改动——删除第 54 行的枚举子句,保留游戏元数据句 `Wiki for ${site.game.name} (${site.game.platform}, by ${site.game.developer}).`:site.description 已在其上方 `> ${site.description}`(llms.txt.ts:52)渲染并枚举同一批分类,信息零损失,消除第二份枚举。备选不推荐:从 NAVIGATION_CONFIG 派生(key 是 bosses/guides/items/codes,与现文案词汇 tier lists/beginner tips 并非一一对应,会改变文案语义);label 动态派生需构建期读 en.json 的 `nav.<key>`,引入额外 i18n 依赖,收益不成比例。

### [低] src/pages/rss.xml.ts:52

- **问题**:`customData` 硬编码 `<language>en</language>`,而同文件的条目过滤(:26)、链接拼装(:47)乃至文件头注释声明的 feed 语义(:2 「the default-locale (English) article feed」)都以 src/i18n/routing.ts:20 的 `defaultLocale` 单源为准,唯独语言标签写死字面量。grep 全仓仅命中此一处,无测试钉住。**实际影响**:当前 defaultLocale='en' 与字面量一致,零实际故障;且本模板架构默认语言本就钉死英文,被改概率不高。但一旦 defaultLocale 变化,条目过滤与链接会跟随切换,唯独语言标签静默漂移成错误信号,与文件内已建立的单源范式相悖。
- **建议**:改为:

  ```ts
  customData: `<language>${defaultLocale}</language>`,
  ```

  `defaultLocale` 已在 :17 导入,一行改动与文件内既有用法对齐;全仓无测试断言该标签,零测试影响;customData 原样插入 XML 但值来自编译期常量,安全。

---

## 三、总结

### ① 项目整体健康状况

**项目整体健康**:零高危、零安全性类确认发现,确认的 10 项(1 中 + 9 低)全部属于「多文件字面量同步缺契约测试、死代码/双真相源残留、framework 层硬编码文案」类可维护性债务,无功能损坏、无用户可见故障、无数据丢失路径(consent 门控 fail-closed 方向安全,covers 碎裂场景可 build 发现并 git 恢复),全部可低风险快速修复。

### ② 必修 Top 5(按建议处理顺序)

1. **src/lib/shared-ui.ts:36-47 — consent 四文件同步:先补契约测试,再统一注释口径**(唯一中危)。理由:漏改任一处字面量 = 同意门控 fail-closed 静默失效、广告收入静默归零,且八门禁全绿抓不到;注释口径已现实漂移过一次(v2.28.0 引入 MobileAnchorAd 未同步),证明人肉同步已失败过。仓内有 clear-demo 清单↔注册表契约测试同构先例可照抄,先立防线再谈重构。
2. **src/lib/covers.ts:100-104 — `$` 特殊替换模式改函数回调**。理由:这是唯一会**写坏用户源文件**的问题(gen-covers 把碎裂 frontmatter 原子写回作者 MDX),`$$` 场景还半静默(build 不红、标题悄悄变化);有 v2.7.1 先例(apply-rewrites.ts:473)逐字照抄即可,一行级改动 + 一条契约测试。
3. **src/config/navigation.ts:27-35 — `NavigationItem.order` 死字段三处收口(推荐删除方案)**。理由:docs/apply-template.md:112 正在**主动误导 fork 用户**(宣称 order 控制导航排序,实际全仓零消费者),且 scripts/apply-template.ts:290 每轮初始化都生成该死字段;按全仓一致性约束(AGENTS 第 14 条)必须 navigation.ts + apply-template.ts + docs 三处同改,否则死字段回潮。
4. **src/i18n/ui.ts:90-92 — `isLocaleSafe` 改用 routing 的 `isLocale`**。理由:locale 判定正确性目前靠 deepMerge 巧合兜底而非判断本身(原型链 `in` 会命中 'toString' 等),且与 routing.ts:48-50 构成双真相源;一行改动消除隐患并收敛单源,新增语言时少一处需同步。
5. **src/pages/llms.txt.ts:54 — 删硬编码分类枚举句**。理由:双源漂移已实际发生('items' vs 'item locations'),这是写给 LLM 爬虫看的公开信号;site.description 已在其上方枚举同一批分类,删句信息零损失,是最小改动的诚实化收口。

其余 5 项(rss.xml.ts 语言标签单源、ui.ts `t()` 死代码删除、getUi 记忆化、content.ts 重复 import 合并、landing.ts 悬空注释删除)均为一行级清理,可随任意后续改动顺带落地,不值得单独发版。

### ③ 8 个审查维度说明

1. **正确性**:1 项发现——`src/i18n/ui.ts:90-92`,`isLocaleSafe` 用原型链 `in` 判断 locale 且与 routing.isLocale 构成双真相源;当前靠 deepMerge 的 typeof 检查巧合兜底,无功能损坏,属隐患而非现行 bug。除此外未发现逻辑错误、边界遗漏、异步/泄漏类问题。
2. **可维护性**:发现最集中的维度(7 项,含唯一中危),两条主线:① **多文件字面量同步缺契约测试**(shared-ui.ts consent 四文件,注释口径已实际漂移过一次);② **死代码/双真相源/硬编码残留**(navigation.ts order 死字段且文档误导、covers.ts `$` 展开风险、llms.txt.ts 与 rss.xml.ts 各一处硬编码、landing.ts 悬空注释、content.ts 重复 import)。
3. **安全性**:未发现问题。本次审查未确认任何 XSS、注入、敏感信息硬编码、输入校验缺失或依赖已知漏洞类发现;唯一与安全相邻的 consent 字面量问题也经复核确认是 fail-closed 方向(失效时广告不加载),无 fail-open 合规风险。
4. **性能**:1 项发现——`src/i18n/ui.ts:55-59`,getUi 非 ja 分支每次重跑 deepMerge 无记忆化;经复核实测量级仅约 4ms/构建(修正原「数秒级」高估约三个数量级),纯构建期微浪费,可选优化。未发现重复渲染、包体积异常类问题。
5. **代码架构与组件化**:未发现问题。本次审查未确认分层混乱、循环依赖、超长组件未拆分、props 层层透传类发现。
6. **UI 组件化与设计一致性**:未发现问题。本次审查未确认内联样式、魔法值散落、重复 UI 模式未封装、emoji 充当图标类发现。
7. **调试残留与类型安全**:1 项发现——`src/i18n/ui.ts:78-88`,导出翻译函数 `t()` 为死代码且返回 `unknown`,游离于 getUi→`typeof en` 结构化类型路线之外,并与仓内另两处同名 helper 构成混淆源。未发现 console.log/debugger 残留、any 滥用类发现。
8. **UI 三态与边界体验**:未发现问题。本次审查未确认 loading/空状态/错误态缺失、白屏、无限 loading 类发现。

---

## 附录:独立复核未通过(供参考)

本次送审发现共 10 项,经独立复核员逐条读码验证,**全部 `verdict="confirmed"`,驳回 0 项**,无复核未通过条目,本附录为空。
