# MDX 文章格式

> 怎么写一篇 AnvilWiki 的 MDX 文章。文章是 wiki 的核心——文件路径即 URL。

---

## 文件位置与 URL 映射

文章放在 `src/content/wiki/<locale>/<category>/<slug>.mdx`：

```
src/content/wiki/en/bosses/gelum.mdx       → /bosses/gelum
src/content/wiki/en/guides/beginner.mdx    → /guides/beginner
src/content/wiki/ja/bosses/gelum.mdx       → /ja/bosses/gelum（日文版）
```

> `category` 必须与 `src/config/navigation.ts` 的 `key` 一致。

---

## Frontmatter（YAML 头部）

每篇文章用 YAML frontmatter 声明元数据。**构建时会用 Zod schema 校验**——字段缺失或类型错误会导致 build 失败。

```mdx
---
title: "Gelum Boss Guide - Complete Strategy"
description: "Complete strategy guide for defeating Gelum, including attack patterns and weaknesses."
category: "bosses"
date: 2026-08-11
lastModified: 2026-08-12
image: "/images/gelum-cover.jpg"
tags: ["boss", "ice", "early-game"]
noindex: false
---
```

### 字段说明

| 字段 | 类型 | 必填 | 校验规则 | 用途 |
|---|---|---|---|---|
| `title` | string | ✅ | ≤ 80 字符 | SEO title + H1（正文不写 H1） |
| `description` | string | ✅ | 40-165 字符 | meta description + 文章副标题 |
| `category` | string | ✅ | 必须在 `navigation.ts` 的 key 列表里 | 决定 URL 路径和列表页归属 |
| `date` | date | ✅ | ISO 格式（YYYY-MM-DD） | 发布日期 + Article JSON-LD datePublished |
| `lastModified` | date | 可选 | ISO 格式 | 最后修改日期（JSON-LD dateModified） |
| `image` | string | 可选 | 相对 `/public` 路径或绝对 URL | 封面图（og:image，缺省用 hero） |
| `tags` | string[] | 可选 | 默认 `[]` | 用于"相关文章"推荐 |
| `noindex` | boolean | 可选 | 默认 `false` | 设为 `true` 禁止搜索引擎索引此页 |

### 校验失败示例

```mdx
---
title: "Guide"           # ❌ 太短（虽然 ≥1 字符就过，但 SEO 不好）
description: "Short"     # ❌ 少于 40 字符，build 失败
category: "unknown"      # ❌ 不在 navigation.ts，路由 404
date: "上周二"            # ❌ 不是 ISO 格式，Zod 解析失败
---
```

---

## 正文规则

### 从 H2 开始，不写 H1

```mdx
---
title: "Gelum Boss Guide"
---

## Boss Overview        ← ✅ 第一个标题是 H2
...
```

**不要写 H1**——`ArticlePage` 组件自动用 frontmatter 的 `title` 渲染 H1。如果你也写 H1，会导致双 H1，影响 SEO。

### 支持的 Markdown 语法

- 标题（H2-H4，建议不跳级）
- 列表（有序/无序）
- 表格（GitHub Flavored Markdown）
- 代码块（```语法高亮）
- 引用（`>`）
- 链接（相对路径用 `/bosses/gelum`，绝对路径用完整 URL）
- 图片（`![alt](/images/xxx.jpg)`）

### MDX 扩展（可选）

MDX 支持 JSX 组件，但 AnvilWiki 默认不引入 React 组件。如果你需要复杂交互，参考 [PRD §ADR-002](./PRD.md#adr-002为什么用纯-astro-原生组件而不是-react-islands) 的说明。

---

## 从 seoscout 输出转换

如果你的文章是 seoscout 生成的（`export const metadata` 格式），需要转成 YAML frontmatter：

```bash
pnpm tsx scripts/convert-from-seoscout.ts <input-dir> <output-dir>
```

转换规则：
- `export const metadata = { title: "X" }` → `title: "X"`
- 删除 `export const metadata` 行
- 其余正文不变

> 脚本尚未实现（v1.1 计划）。当前手动转换：把 JS export 改成 YAML frontmatter 即可。

---

## 多语言文章

每种语言一个目录：

```
src/content/wiki/
├── en/bosses/gelum.mdx     → /bosses/gelum
└── ja/bosses/gelum.mdx     → /ja/bosses/gelum
```

### Fallback 行为

| 场景 | 行为 |
|---|---|
| 访问 `/ja/bosses/gelum` 且**有日文版** | 显示日文 |
| 访问 `/ja/bosses/gelum` 但**无日文版** | **自动回退英文**（不 404），页面显示 "English fallback" 标记 |
| 访问 `/ja/bosses/`（列表页）且**无日文文章** | 显示空状态（**不回退英文**） |

> 这种不对称是设计决策：详情页保证 URL 可达（不 404），列表页保证准确性（不展示没有的内容）。

---

## 文件命名规范

slug（文件名）= URL 最后一段：

```
src/content/wiki/en/bosses/gelum-boss-guide.mdx → /bosses/gelum-boss-guide
```

**规则**：
- 全小写
- 单词用连字符分隔（`gelum-boss-guide`，不是 `GelumBossGuide` 或 `gelum_boss_guide`）
- 不含特殊字符（`?:/`)
- 建议：与目标关键词一致（SEO）

---

## 新建文章脚手架

```bash
pnpm new-post
# 交互式输入：locale / category / slug / title
# 自动生成带 frontmatter 的 MDX 模板
```

> 脚本尚未实现（v1.1 计划）。当前手动复制现有文章改即可。

---

## 下一步

- [换皮工作流](./skinning.md)
- [SEO 说明](./seo.md)
- 回到 [README](../README.md)
