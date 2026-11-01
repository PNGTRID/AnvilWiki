# 站点类型 Preset 机制 + 旗舰教程站 设计稿

日期：2026-11-01
状态：已实现（M1+M2 随 v2.39.0 同批发版；后置项见 §9 里程碑表）
讨论来源：2026-11-01 方向讨论会话（路线 C 旗舰教程站 + CLI 站点类型选择）

---

## 1. 背景与决策链

2026-11-01 用户提出「游戏 wiki 攻略站方向太小」，经四轮讨论拍板：

1. **身份**：路线 C——AnvilWiki 模板继续开源养社群；anvil.wiki 升级为「教大家做各种站」的旗舰教程站（流量 + 落地 + 活案例）。
2. **泛化姿势**：不换模板品牌，而是让 `apply-template` CLI 询问「你要建什么站」，按类型给不同脚手架（内容类型子集 + demo 内容 + UI 文案语义）。
3. **首批类型**（调研结论，按复用率排序）：游戏 wiki 站（默认现状）、SaaS/软件优惠码站（codes schema 复用约九成）、教程知识库站（零开发）。
4. **变现**：教程/优惠场景内嵌真实工具联盟为第一层；排行榜页作为站内 money page 层而非独立站型；目录站（付费收录）后置；实体商品联盟不做。
5. **模板全面泛化**：后置 3-6 个月，等旗舰站数据说话。

市场依据（2026-10 调研）：SaaS 联盟佣金普遍 10-30% 且按订阅周期持续返佣；deal/coupon 内容专吃价格敏感买家、季节爆发（黑五）；2026-03 Google 核心更新把模板化 best-X-for-Y 页面打掉 20-30%，幸存者均有真实实测——「不编造」红线恰好是护身符。

## 2. 目标与非目标

**目标**

- fork 用户在 CLI 里选站点类型，得到对应类型的内容骨架、demo、文案语义。
- 默认（游戏 wiki）行为与今天**字节一致**：fork 常规 merge 零迁移红线不破。
- anvil.wiki 官网新增教程内容线，承接「教大家做各种站」的搜索流量并转化到模板 + 微信群。
- anvil.wiki 现有收录问题得到诊断（第 0 步，工程外轨道）。

**非目标（本期不做）**

- 不新增 React/Vue runtime（ADR-002 不变）。
- 不改现有 4 个内容类型的 Zod schema（codes/boss/faq 字段原样复用）。
- 不做排行榜独立站型、不做目录站付费收录机制、不改模板品牌与定位叙事。
- 不引入 CMS（2026-09-08 评估结论不变）。

## 3. 核心概念：Site Preset（站点类型预设）

```ts
// scripts/lib/apply-rewrites.ts 新增（单源，vitest 直测）
interface SitePreset {
  id: 'game-wiki' | 'coupon-hub' | 'tutorial-hub';
  /** CLI 展示名（i18n 词典键） */
  /** 该类型保留的内容分类（NAVIGATION_CONFIG key 子集，按菜单序） */
  categories: string[];
  /** 该类型的 demo 文章注册表（locale → 文件路径清单，相对 src/content/wiki/） */
  demoArticles: Record<string, string[]>;
  /** 该类型的 demo 封面/图片清单（同 DEMO_COVERS 模式） */
  demoAssets: string[];
  /** 该类型的 UI 文案包：apply-template 按 preset 把不同值写进 en.json/ja.json */
  uiCopy: PresetUiCopy;
}
export const SITE_PRESETS: Record<PresetId, SitePreset>;
```

**Preset 驱动四件事**：

1. **分类子集**：CLI 的「选择栏目」题（qCategories）只允许在本 preset 的 `categories` 交集内选择；navigation 生成、check-config 三处一致、空分类规则全部照旧。
2. **demo 内容取舍**：初始化时只保留所选 preset 的 demo 文章/资产，其余 preset 的 demo 一律清除（清除动作走既有 clear-demo-content 通道 + stderr 逐文件警告，与 v2.25.1 语义一致）。
3. **UI 文案语义换皮**：locale JSON 仍是单源（en.json/ja.json），`rewriteLocaleJson` 按 preset 写入不同的 nav 标签、首页文案、分类 overview 文案。**零新机制**——只是同一函数多一套输入。
4. **首页预设联动**：现有 homePreset（qPreset 题）在新类型下的候选项按 preset 调整（如 coupon-hub 首页主推「热门优惠」卡组）。

**URL 与目录名**：内容目录与 URL 路径仍用现有分类 key（`/codes/`、`/guides/`、`/items/`）。优惠码站继续用 `/codes/`（"codes" 对 promo codes 同样自然），语义差异全部由 UI 文案层承担。check-content 规则 7（category=目录）零改动。

## 4. 三个类型的详细规格

### 4.1 game-wiki（默认，现状基准）

- 分类：bosses / guides / items / codes 全量。
- demo：现有 Anvil Quest demo 全部保留，行为与今天逐字节一致。
- 该 preset 存在的意义：显式化「默认值」，保证不选或选 1 时全链路与旧版无差异。

### 4.2 coupon-hub（SaaS/软件优惠码站）⭐ 首个新类型

**定位**：按商家收录有效优惠码/折扣，稳定返佣 + 黑五/新品季爆发。

| 维度 | 规格 |
|---|---|
| 分类 | codes（导航标签「Deals/优惠码」）+ guides（「省钱攻略」）+ items（「工具库」，商家/工具实体卡，挂 AffiliateLink） |
| 页面 | **零新路由**——home、3 个分类列表页、文章详情、tags、recent、faq、legal 全部复用现有路由 |
| codes 页形态 | 每篇文章 = 一个商家的码页（如「PixelPad 优惠码（2026）」），CodesTable Active/Expired 分区、CodeBlock 一键复制、FAQPage JSON-LD 原样复用 |
| schema | 零改动：`codes[]` 的 code/reward/status/expiryDate/source 逐字段复用（source=商家活动页，强制溯源=不编造红线）；`gameVersion` 不写即可 |
| 同步管道 | `pnpm sync-codes` CSV 批量更新零改动复用（每日维护码状态 = 优惠码站的核心运维） |
| JSON-LD | v1 不新增（FAQPage 已有）；v2 候选 Offer/SoftwareApplication，本期不做 |
| 变现位 | items 工具卡 + 文末 AffiliateSuggestion（`src/config/affiliates.ts` 已有，config 门控非 env）+ 广告位照常 env 门控 |

**虚构 demo 品牌**（防商标，与 Anvil Quest 同原则）：

- 「PixelPad」——虚构在线设计工具；「CloudNote」——虚构笔记 SaaS。
- demo 集最小可用（en+ja 同步，守双语 lastModified 同步铁律）：codes 页 ×2（每品牌一篇）、guides 省钱攻略 ×2、items 工具卡 ×2，共 6 篇。
- 所有码值均为 `DEMO-XXXX` 形态占位，frontmatter `source` 指向虚构官网。

### 4.3 tutorial-hub（教程知识库站）

**定位**：单一主题的 how-to/教程站，AI 引用优化（Quick Answer + FAQ + llms.txt）吃结构化答案流量。

| 维度 | 规格 |
|---|---|
| 分类 | guides（导航标签「Tutorials/教程」）单主分类 + tags/recent/faq 系统页 |
| 页面 | 零新路由，全部复用 |
| demo 集最小可用（en+ja） | 「怎么用 AI 从零建站」主题教程 ×4（覆盖选品/建站/内容/变现四步，与手册方法论同源但不复制手册正文） |
| schema | 零改动；faq frontmatter 字段是教程站的主力武器（每篇 5-8 组问答） |

**概念区分（防混淆）**：tutorial-hub preset 是**给 fork 用户建教程站用的**；anvil.wiki 官网的教程线是**官网自己的内容**（landing 层），两者不是一回事，但互为飞轮（见 §7）。

## 5. CLI 改动清单

1. **新题 `qSiteType`**：位置追加在 `qRemoveLanding` 之后、`qProceed` 之前（**末尾追加不平移**，现有 18 题答案位置序零变化）。
   - 交互 TTY：中文/英文双语（apply-template-i18n 词典 +3 键：题目、选项说明、确认提示）。
   - `--answers` 兼容：18 项旧文件 = 静默按 game-wiki 处理 + stderr 一行提示（不响亮失败，保护存量自动化）；19 项 = 新契约；第 19 项值非法 = 响亮报错。
   - 选项：`1. game-wiki（游戏 wiki 站，默认）` `2. coupon-hub（优惠码/折扣站）` `3. tutorial-hub（教程知识库站）`。
2. **qCategories 联动**：候选按 preset 收窄（coupon-hub 只列 codes/guides/items；tutorial-hub 锁定 guides）。
   - **实现偏差说明**：因 qCategories（答案 index 13）先于 qSiteType（index 17）提问，且 18/19 答案位置序不可平移，「候选收窄」落地为**答案齐全后的响亮后置校验**（所选分类 ⊄ preset.categories 即在任何写入前 exit 1），交互用户须重跑一轮问答；`--answers` 路径同样后置校验。
3. **demo 清理通道**：`clear-demo-content`/`classifyWikiArticles` 按 `SITE_PRESETS` 注册表判定归属 preset，非所选 preset 的 demo 文章与资产清除，未注册表命中的用户文件照旧保留 + ⚠️。
4. **E2E（tests/e2e-apply-template.mjs）**：新增 19 答案 coupon-hub 全流程跑通（build 绿 + codes 页存在 + bosses 无残留 + demo 清理断言）；旧 18 答案文件回归跑一遍（行为与今天一致）。
5. **契约测试**：`SITE_PRESETS` 注册表 ↔ 磁盘 demo 文件双向相等（DEMO_COVERS 先例）；18/19 答案兼容行为钉死；preset × i18n 文案包覆盖键集钉死。

## 6. anvil.wiki 旗舰教程站（官网层）

1. **路由**：`/landing/tutorials/`（教程 hub）+ `/landing/tutorials/[slug]/`（en）与 `/zh/landing/tutorials/…`（zh）。
   - 🚨 **fork 红线三通道同步**：`apply-template` 的 LANDING_PATHS 加路由与内容目录、`setup.yml` rm 行同步、E2E 纯净性断言同步——漏任一即漂移（10-21 审计教训）。
2. **内容源**：新集合 `src/content/tutorials/<locale>/<slug>.md`，模式复制 handbook（双语 ASCII slug 配对 + parity 测试复用；Zod schema：title/description/order/updated/tldr）。**不进 handbook collection**——handbook 有意 survives fork（模板文档对 fork 有用），教程是官网营销内容，必须随 landing 一起被清理。
3. **选题**：首批 5-10 篇，标题围着读者想做的事转（示例：「怎么从零做一个游戏兑换码站」「用 AI 一天搭好一个内容站」「游戏 wiki 怎么变现」），**具体选题以 anvil-find-keywords 挖词验证结果为准**（动工前跑一轮，产出 gitignored `seo-reports/` 决策表）。
4. **内容双层**（2026-11-01 讨论定案）：流量层标题锚「用户想做的事」，模板作为答案自然出场；「怎么用模板」仍由 docs center 手册承担，教程正文链接过去，不重复造文档。
5. **转化链路**：每篇教程尾部固定三件套——模板 CTA（对应 preset 的 fork 指引）→ 微信群入口（二维码铁律：不可移除、默认展开）→ 同题材下一篇推荐。
6. **变现第一层**：教程内嵌真实在用工具的联盟链接（`affiliates.ts` 首批挂 2-3 个），沿用 `shared.sponsoredLabel` 披露；展示广告照常 env 门控。

## 7. 飞轮（两个想法的咬合点）

```
官网教程线（每个题材一条线）──引流──▶ fork 用户选对应 preset 建站
        ▲                                    │
        └── showcase/活案例数据 ◀── 新站跑出结果反哺教程素材
```

每新增一个 preset，教程站多一条题材线；教程站的流量数据又成为该 preset 最硬的卖点。目录站/排行榜等后续类型按同模式复制。

## 8. 第 0 步（工程外，立即执行）：anvil.wiki 收录诊断

- 拉取 GSC 覆盖报告（anvil-ops 已接 GSC 通道，凭据 `~/.config/gcloud/gsc-adc-backup.json`），产出：164 URL 各自的未收录原因分布、修复清单、3-6 个月收录爬坡的基线记录。
- 这一步与 M1/M2 并行，不阻塞工程。

## 9. 里程碑

| 里程碑 | 内容 | 性质 | 交付状态 |
|---|---|---|---|
| M0 | GSC 收录诊断 + 修复清单 | 运营，立即，不阻塞 | 工程外轨道，独立推进 |
| M1 | CLI `qSiteType` + preset 机制 + coupon-hub（demo 6 篇 + 文案包 + E2E + 契约测试） | 工程批次，可独立发版 | ✅ 已交付（v2.39.0） |
| M2 | tutorial-hub preset + 官网教程线（路由/集合/三通道/首批 5-10 篇） | 工程+内容批次 | ✅ 已交付（v2.39.0，与 M1 同批） |
| M3 | affiliates 变现层 + 按挖词数据扩产教程 + 首个「活案例」数据回填 | 内容+变现批次 | 未动工 |
| 后置 | 排行榜 money page 规范、目录站付费收录、模板定位叙事升级、更多 preset | 有数据再动 | 未动工 |

> ⚠️ 交付口径备注：M1/M2 原计划拆独立批次各自发版（§11.4），实际随 v2.39.0 同批交付——preset 机制与教程线在同一变更集内完整走完全部门禁后合并记账（CHANGELOG [2.39.0] 两条 Added 分列）。

## 10. 测试与门禁影响面

- E2E：19 答案新契约 + 18 答案兼容回归（两条都跑）。
- `apply-template.test.ts`：SITE_PRESETS 注册表契约（注册表↔磁盘双向、preset 交集校验）。
- `codes-consistency.test.ts`：coupon demo 的 codes 页同样受「frontmatter↔正文对齐」门禁约束（设计时就按此写 demo，避免踩 v2.35.2 同族坑）。
- `check-i18n --strict-ui`：preset 文案包写回后键集不变（只换值，不加键），门禁零变化。
- `agents-consistency`：AGENTS 命令表/套件计数随批次同步。
- 双语铁律：所有新 demo/教程 en+ja（或 en+zh）同步 lastModified/updated。

## 11. 风险与红线

1. **零 breaking**：game-wiki 默认路径产物与今天逐字节一致（E2E 回归钉死）——这是整个设计的第红线。
2. **不编造**：demo 优惠码一律 `DEMO-` 占位 + 虚构品牌；教程不放未亲测的联盟工具。
3. **虚构品牌防商标**：PixelPad/CloudNote 上线前 grep 确认无同名真实产品冲突。
4. **复杂度预算**（AGENTS 第 13 条）：M1/M2 拆独立批次各自走全门禁发版，不混批；新 preset 不新增组件层，只做数据与文案的差异。
5. **demo 内容乘法成本**：每新增 preset 的 demo 集控制在 ≤6 篇，防止内容维护失控；后续 preset 按同一上限执行。

---

## 自审记录（spec self-review）

- 占位符：无 TBD；选题清单显式依赖挖词产出（§6.3），非占位。
- 一致性：§4.2 声明「零新路由」与 §5 demo 注册表改动不冲突（内容层 vs 路由层）；§6 教程集合与 handbook 的 survives-fork 差异已显式区分。
- 范围：M1 可独立成实现计划；M2 依赖 M1 的 preset 机制但可并行写内容——适合拆两份计划。
- 歧义：qSiteType 默认值、18/19 答案兼容行为、demo 清理语义均已写死为可测断言。

---

## 追加设计：recipe-hub 第四类型的分类键方案（2026-11-01 定案）

recipe-hub 需要 `/recipes/` URL，但 NAVIGATION_CONFIG 只有游戏四键——「preset 的分类 ⊆ 全局键」约束反转为「preset 可引入新键」。定案：

**分类目录（category catalog）**——navigation.ts 新增：

```ts
/** Preset-only categories: legal content types no game-wiki menu shows. */
export const PRESET_ONLY_CATEGORIES: NavigationItem[] = [
  { key: 'recipes', path: '/recipes', icon: 'lucide:cake', isContentType: true },
];
```

**职责切分**（防 demo 污染与路由蔓延）：

| 面 | 规则 |
|---|---|
| CONTENT_TYPES（路由/sitemap/菜单遍历） | **保持 = NAVIGATION_CONFIG 四键不变**——demo 与 game-wiki fork 永不生成 /recipes/ 列表页 |
| Schema 合法分类（z.enum） | 扩为 `LEGAL_CONTENT_TYPES = [...CONTENT_TYPES, ...PRESET_ONLY_CATEGORIES keys]`——recipe demo 文章 frontmatter 合法 |
| check-config 三处一致 | 校验面改为 LEGAL 集合：demo en/ja.json 需补 nav.recipes + overview.recipes 标签，demo en/recipes/、ja/recipes/ 目录随 demo 文章存在 |
| game-wiki fork | CLI 照旧：未选 preset 的 demo 文章按注册表清除，rewriteLocaleJson ownable 过滤删 nav.recipes——**游戏 fork 产物无 recipes 痕迹** |
| recipe-hub fork | CLI 写其 navigation.ts = [recipes, guides, items]（registry categories 全量来自 catalog∪NAVIGATION），qCategories 菜单按 preset 列全 |
| demo 站孤儿文章问题 | recipe demo 文章在 game demo 无列表页可达——`noindex: true` 写进 recipe demo frontmatter（fork 替换内容时自行摘除，docs/apply-template.md 注明） |

**其余增量**（§4 系列格式）：schema 可选 `recipe` frontmatter 对象（cuisine/servings/prepTime/cookTime/ingredients[]/tools[]，全 string 数组与标量，boss 同款有则渲染）→ RecipeCard 组件 + ArticlePage 分支 + Recipe JSON-LD（Google 食谱富结果资格，name/image 必备 + prepTime/cookTime/recipeYield/recipeIngredient/recipeInstructions 推荐项）→ registry 第四 preset（categories: ['recipes','guides','items']，demo 虚构食谱 en+ja ≥6 篇——公有领域经典配方原创撰写，无商标问题）→ demo 文案包 + E2E 第四流程 + 教程线「怎么做食谱站」选题留 M3。
