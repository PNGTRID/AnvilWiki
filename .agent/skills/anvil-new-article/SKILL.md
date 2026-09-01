---
name: anvil-new-article
description: 从用户提供的素材(口述要点/YouTube 视频/别的攻略/原始数据)直接生成一篇符合 AnvilWiki schema 的 MDX 文章页,自动填 frontmatter(title/description/category/tags/summary/boss 等),写完后自动跑校验。视频素材走 Step 0 抓字幕再成文。触发词:写文章 / 生成攻略页 / 视频转攻略 / new article / 帮我把这些内容做成页面。
---

# AnvilWiki 新文章生成

把用户给的任何素材变成一篇构建必过的 MDX 页面。**先读规范再动手:**

1. 读 `docs/content-format.md`(frontmatter 字段表 + 正文规则)
2. 读 `src/content.config.ts`(Zod schema——这是构建时硬校验,不过就 build 失败)
3. 读 `src/config/navigation.ts` 的 `CONTENT_TYPES`(category 必须是这里的 key)
4. 参考一篇同类文章(如 `src/content/wiki/en/bosses/emberfang.mdx`)对齐结构

## 工作流

### Step 0 — 视频转文字素材(素材是 YouTube 视频时)

字幕是**素材不是成文**——口语流水账必须重构成问题式 H2 + 直答结构,不许整段照搬。

**拿字幕(三选一,按依赖从少到多):**

1. 用户直接粘贴字幕/文字稿(零依赖,优先要)
2. `yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "en.*" -o "transcript" "<视频URL>"`(产出 `transcript.*.vtt`,时间戳行自己剥;`yt-dlp -j "<URL>"` 顺带拿标题/频道名,正文引用出处用)
3. `pip install youtube-transcript-api` 走 Python API(手动字幕优先、自动生成兜底;YouTube 风控对数据中心 IP 越来越狠,失败就回 1)

**从视频/字幕提取什么 → 落到哪里:**

| 从视频/字幕提取 | 落到 AnvilWiki 契约 |
|---|---|
| 核心话题 + 搜索意图 | 走 Step 1 的 category 判型表 |
| kebab-case slug | 文件名 `src/content/wiki/<locale>/<category>/<slug>.mdx` |
| 标题(≤80 字符,含游戏名+关键词) | frontmatter `title` |
| meta 描述(40-165 字符) | frontmatter `description` |
| 一句话直答 | frontmatter `summary`(40-60 词——Quick Answer 卡 + AI 搜索摘要候选) |
| 5-8 组问答对 | frontmatter `faq:`(`{question, answer}` 数组——自动渲染可见 `<details>` 区块 + 并入 FAQPage JSON-LD) |
| 内容大纲 | 问题式 H2 + 每节首段 40-60 词直答(Step 3 规则) |
| 标签 | 复用现有 tag 词汇表(Step 2 的 grep) |

**两条红线(不满足不许转正):**

- **事实红线**:视频作者口播的数值/掉率/兑换码一律视为**未验证素材**,成品必须 `draft: true`,人工进游戏核实后才能转正;查不到就删,宁缺毋假(编造一个假码毁掉全站信任)。
- **版权红线**:转写**自己的**视频最干净;拿**别人的**视频字幕成文属于演绎内容,有 DMCA 与重复内容风险——他人视频只做事实参考,正文必须完全重写;嵌入原视频(frontmatter `videos: ["<11位ID>"]` + `<Video id="..." />`,见 Step 3)是标准且合规的做法。

**缩略图**:`https://img.youtube.com/vi/<ID>/maxresdefault.jpg`(404 则 `hqdefault.jpg`)只作 `pnpm gen-covers` 出品牌封面的视觉参考,抓来的图不要直接发布。

### Step 1 — 判断页面类型(按搜索意图)

| 用户素材特征 | category 建议 | 页面形态 |
|---|---|---|
| 兑换码列表 / 奖励码 | `codes` | frontmatter `codes:` 数组(status/expiryDate/source),页面自动渲染 Active/Expired 分区 + FAQPage JSON-LD |
| Boss 打法 / 属性 | `bosses` | frontmatter 加 `boss:` 结构化数据卡 + 按阶段 H2 |
| 教程 / 路线 / how to | `guides` | 问题式 H2 + 每节首段 40-60 词直答 |
| 排名 / 对比 | `guides`(或 tier-list 分类若存在) | 表格为主 |

### Step 2 — 写 frontmatter(硬规则)

- `description`: **40-165 字符**,build 会失败短于 40
- `title`: ≤80 字符,含游戏名+关键词(如 "Emberfang Boss Guide - Complete Strategy")
- `date` / `lastModified`: ISO 日期(YYYY-MM-DD)
- `summary`: 40-60 词直答句(会成为 Quick Answer 卡 + AI 搜索摘要候选)
- `tags`: 3-5 个,复用已有 tag(跑 `grep -r "tags:" src/content/wiki/en/` 看现有词,保证标签页聚合)
- 时效性内容加 `gameVersion`(如 "v2.5")
- 素材未验证的版本,加 `draft: true`(dev 可见,build 排除)

### Step 3 — 写正文(硬规则)

- **不写 H1**——H1 由 title 渲染;第一个标题必须是 H2
- H2 用问题式("How do I dodge the fire volley?")
- 每个 H2 后第一段直接回答(40-60 词),再展开
- 数据用 Markdown 表格(移动端可横滑、AI 可解析)
- 兑换码用 `<CodeBlock code="..." label="..." />`(import 自 `~/components/article/CodeBlock.astro`)
- 提示/警告用 `<Callout type="warn|tip">`,多阶段细节用 `<Accordion title="...">`(import 自 `~/components/mdx/`)
- 图片放 `src/assets/covers/`,frontmatter `image` 写相对路径
- 站内页面链接必须**带尾斜杠**(`/bosses/emberfang/`,不是 `/bosses/emberfang` 也不是 `https://...`)——全站 trailingSlash 为 always
- 非默认语言(如 ja)正文里的站内链接必须带语言前缀(`/ja/bosses/x/`)——裸 `/bosses/x/` 会静默跳到英文页
- 视频**两条规则**:
  1. **frontmatter `videos: [id]` 必须登记**(这是 VideoObject JSON-LD 的来源)
  2. 位置:想放在某个小节下面,就在该小节末尾 `import Video from '~/components/mdx/Video.astro'` + `<Video id="..." title="..."/>`(与 Callout 同款心智);只想文末展示则只写 frontmatter(内联过的 id 不会在文末重复渲染)
- 图片**四条规则**(媒体密度是排名因素,纯文字页没有竞争力):
  1. **封面必配**:每篇 frontmatter `image`(codes 页尤其重要——分享卡片辨识度),放 `src/assets/covers/`,**1200×675**(v2.0 起的 og:image 标准,Google Discover 大图预览要求 ≥1200px 宽;用 `pnpm gen-covers` 可从标题自动生成品牌色封面)
  2. **正文内联图**:`![alt 描述](/images/articles/xxx.png)`,图放 `public/images/articles/`,建议 16:9(globals.css 已预留 16:9 盒子,零 CLS)
  3. **gallery 机制图**:boss/路线/流程类文章加 frontmatter `gallery`(2-4 张,每张配 `caption` + `alt`)
  4. **密度参考**:boss 攻略 ≥1 视频 + 2-4 张 gallery;教程每个大节可配 1 张内联图;tier list 重点条目配 1 张卡片图。示范参考:`en/bosses/stormcaller.mdx`(gallery 机制图)、`en/guides/weapon-tier-list.mdx`(内联卡片图)、`en/guides/beginner-guide.mdx`(gallery 路线图)

### Step 4 — 自检(必须执行)

```bash
pnpm check-content     # H1/alt/跳级/尾斜杠 lint(页面内链必须以 / 结尾)
pnpm build             # Zod schema + 全站构建,任何 frontmatter 错误在这里暴露
```

两个都过才算完成。build 失败就修 frontmatter 再跑。

> **可选**(anvilwiki-ops ≥0.1,模板 v1.15+):`npx anvilwiki-ops submit --title "<文章标题>"` 一条命令完成「校验(check-content + check-i18n + build)→建分支→提交→推送→开 PR」,PR 描述自带校验结果;校验不过就地终止,不会提交任何东西。

### Step 5 — 汇报

告诉用户:文件路径、预览方式(`pnpm dev` + URL)、建议补充项(封面图/翻译版)。

---

> **致谢**:视频源工作流(Step 0)的管线形状(字幕 → 结构化提取 → 页面草稿)与提取字段设计参考 [kennyzir/7deer_skills](https://github.com/kennyzir/7deer_skills/tree/main/youtube-content-gen)(MIT)的 youtube-content-gen 技能;已按 AnvilWiki 的内容层契约重写(MDX + frontmatter,非代码生成),draft 门禁与 check-content/build 产线为本模板自有。
