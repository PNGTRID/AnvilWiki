# SEO 工程化

> AnvilWiki 的 SEO 设计原则：**你只管填内容，SEO 全交给代码自动生成**。
>
> 写文章填好 frontmatter，改首页填好 en.json，剩下的 title / 结构化数据 / sitemap / 多语言链接全部自动产出。

---

## 自动生成的 SEO 要素

| 要素 | 哪里生成 | 数据来源 |
|---|---|---|
| `<title>` | `BaseLayout.astro` | 各页面的 title prop |
| `<meta description>` | `BaseLayout.astro` | 各页面的 description prop |
| `og:title` / `og:description` / `og:image` | `BaseLayout.astro` | 同上 + image prop |
| `twitter:card` | `BaseLayout.astro` | 自动 summary_large_image（文章页）或 summary |
| Organization JSON-LD | `BaseLayout.astro`（全站） | `src/config/site.ts` |
| WebSite JSON-LD | 首页 `index.astro` | `site.ts` |
| Article JSON-LD | `ArticlePage.astro` | 文章 frontmatter |
| BreadcrumbList JSON-LD | `ArticlePage.astro` | 文章 + 分类 |
| ItemList JSON-LD | `ListPage.astro` | 分类下所有文章 |
| FAQPage JSON-LD | 首页（可选） | `en.json` 的 `home.faq.items` |
| hreflang alternates | `BaseLayout.astro` | 遍历 `routing.locales` |
| sitemap.xml | `@astrojs/sitemap` | 自动扫描所有页面 |
| robots.txt | `src/pages/robots.txt.ts` | 含 sitemap 链接 |
| canonical URL | `BaseLayout.astro` | `SITE_URL` + 当前路径 |

---

## 各页面的 SEO 产出

### 首页

```html
<title>Anvil Quest Wiki - Complete Boss Guides, Codes & Tier Lists</title>
<meta name="description" content="..." />

<!-- JSON-LD -->
<script type="application/ld+json">
  { "@type": "Organization", "name": "...", "url": "...", "logo": "..." }
</script>
<script type="application/ld+json">
  { "@type": "WebSite", "name": "...", "url": "...", "potentialAction": {...} }
</script>
<script type="application/ld+json">
  { "@type": "FAQPage", "mainEntity": [...] }
</script>
```

**title 来自**：`en.json` 的 `home.meta.title`（独立配置，不复用文章格式）。

### 列表页（如 /bosses）

```html
<title>All Bosses — Anvil Quest Wiki</title>

<script type="application/ld+json">
  {
    "@type": "ItemList",
    "name": "All Bosses",
    "itemListElement": [
      { "position": 1, "name": "Gelum Boss Guide", "url": "..." },
      ...
    ]
  }
</script>
```

**title 来自**：`en.json` 的 `overview.bosses.overviewTitle`。

### 文章页（如 /bosses/gelum）

```html
<title>Gelum Boss Guide - Complete Strategy — Anvil Quest Wiki</title>
<meta property="og:type" content="article" />
<meta property="og:image" content="https://domain/images/gelum.jpg" />
<meta name="twitter:card" content="summary_large_image" />

<script type="application/ld+json">
  {
    "@type": "Article",
    "headline": "...",
    "datePublished": "...",
    "dateModified": "...",
    "author": { "@type": "Organization" },
    "publisher": { "@type": "Organization" }
  }
</script>
<script type="application/ld+json">
  {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "position": 1, "name": "Home" },
      { "position": 2, "name": "All Bosses" },
      { "position": 3, "name": "Gelum Boss Guide" }
    ]
  }
</script>
```

**数据来自**：文章的 frontmatter（title / description / image / date / lastModified）。

---

## hreflang 多语言链接

每个页面 `<head>` 自动注入所有语言版本的 alternate：

```html
<link rel="alternate" hreflang="en" href="https://domain/bosses/gelum" />
<link rel="alternate" hreflang="ja" href="https://domain/ja/bosses/gelum" />
<link rel="alternate" hreflang="x-default" href="https://domain/bosses/gelum" />
```

`x-default` 指向英文版（默认语言）。

---

## sitemap 生成规则

**核心原则**：sitemap 只包含**实际存在的 MDX 文件**对应的 URL，**禁止**从硬编码数组生成。

```
构建时：
1. @astrojs/sitemap 扫描所有已生成的静态页面
2. 为每个页面生成 <url> 条目
3. 自动加 hreflang alternate（基于 astro.config.ts 的 i18n 配置）
4. 输出 dist/sitemap-0.xml + dist/sitemap-index.xml
```

**为什么不能硬编码**：列表页可能展示 28 个 boss 卡片，但只有 3 个有 MDX 攻略。如果 sitemap 从卡片数组生成，会产生 25 个指向 404 的 URL，严重损害 SEO。

---

## og:image 绝对路径（强制）

社交平台抓 OG 图要求**绝对路径**：

```html
<!-- ✅ 正确 -->
<meta property="og:image" content="https://domain.com/images/hero.webp" />

<!-- ❌ 错误（相对路径，社交平台抓不到） -->
<meta property="og:image" content="/images/hero.webp" />
```

由 `SITE_URL` 环境变量拼接，**禁止硬编码域名**。

---

## SEO 检查清单（上线前）

```
□ title 50-60 字符，含游戏名 + 核心关键词
□ description 150-160 字符，含关键词 + CTA
□ 每页有且仅有一个 H1
□ H1-H4 层级正确，不跳级
□ og:image 是绝对路径，图片真实存在
□ sitemap.xml 可访问，URL 数 = 实际页面数
□ robots.txt 可访问，含 sitemap 链接
□ Google Rich Results Test 验证 JSON-LD 全通过
□ hreflang 覆盖所有语言，x-default 指向英文
□ 移动端适配正常
□ Lighthouse SEO 分数 ≥ 95
```

### 用 Google Rich Results Test 验证

1. 访问 https://search.google.com/test/rich-results
2. 输入你的页面 URL
3. 确认所有 JSON-LD 类型（Organization / Article / Breadcrumb / FAQ）都通过

---

## 提交 Google Search Console

1. 打开 https://search.google.com/search-console
2. 添加资源 → 选"网域"方式 → DNS 验证
3. 在 Cloudflare 加 TXT 记录 → 验证所有权
4. 提交 `sitemap-index.xml`（注意是 sitemap-index.xml，不是 sitemap.xml）
5. 等 24-48 小时看收录

> GSC 常见 bug：第一次提交失败可能有缓存，在 URL 末尾加斜杠 `/` 重新提交。

---

## 下一步

- [内容格式](./content-format.md)
- [换皮工作流](./skinning.md)
- 回到 [README](../README.md)
