# 从 Next.js 模板迁移指南

> 如果你已经在用老师诗意听涛的 `vvultimatum_sbs`（Next.js）模板，想迁移到 AnvilWiki（Astro），本指南帮你平移。

---

## 为什么要迁移

| 维度 | Next.js 模板 | AnvilWiki |
|---|---|---|
| Cloudflare 部署 | ❌ `@cloudflare/next-on-pages` 已废弃 | ✅ 原生静态，零适配 |
| 免费带宽 | ⚠️ Netlify 100GB/月 | ✅ Cloudflare 无限 |
| 性能 | 中（Next.js 体积大） | ✅ 高（零 JS by default） |
| 配置复杂度 | 高（middleware/Turbopack 坑） | 低（纯静态） |

> **建议**：不要为了迁移而迁移。如果你现在的站跑得好（流量 < 100GB/月），不用动。等真爆量或做**新站**时再用 AnvilWiki。

---

## 迁移路径对照表

| Next.js 模板 | AnvilWiki | 迁移动作 |
|---|---|---|
| `src/app/globals.css` | `src/styles/globals.css` | 直接复制主题色 4 行 |
| `src/app/[locale]/page.tsx` | `src/pages/[locale]/index.astro` + `HomePage.astro` | 数据保留，渲染层重写 |
| `src/app/[locale]/[...slug]/page.tsx` | `src/pages/[...slug].astro` + `[locale]/[...slug].astro` | 逻辑平移到 Astro |
| `src/app/sitemap.ts` | `@astrojs/sitemap`（自动） | 删手写代码，用集成 |
| `src/app/robots.ts` | `src/pages/robots.txt.ts` | 简单平移 |
| `src/i18n/routing.ts` | `src/i18n/routing.ts` | **几乎一致**，删 `localePrefix` 字段 |
| `src/i18n/request.ts` | `src/i18n/ui.ts` | deepMerge 逻辑平移 |
| `src/config/navigation.ts` | `src/config/navigation.ts` | **完全一致** |
| `src/locales/en.json` | `src/locales/en.json` | **完全一致**（home 命名空间结构相同） |
| `content/<locale>/<type>/*.mdx` | `src/content/wiki/<locale>/<type>/*.mdx` | 移到 wiki/ 下 |
| `export const metadata = {...}` | YAML frontmatter `---\n...\n---` | **必须转换** |
| `src/middleware.ts` | 不需要 | Astro 的 i18n 路由内置 |
| `netlify.toml` | 不需要 | Cloudflare Pages 零配置 |

---

## 关键差异

### 1. 文章元数据格式

**Next.js**（JS export，无校验）：
```mdx
export const metadata = {
  title: "Gelum Boss Guide",
  description: "...",
  category: "bosses",
  date: "2026-08-11",
}

## 正文
```

**AnvilWiki**（YAML frontmatter + Zod 校验）：
```mdx
---
title: "Gelum Boss Guide"
description: "..."
category: "bosses"
date: 2026-08-11
---

## 正文
```

**优势**：构建时校验字段，缺字段立即报错，不会上线后才发现 SEO meta 失效。

### 2. 多语言路由

**Next.js**：middleware 拦截，`localePrefix: 'as-needed'`
**AnvilWiki**：`astro.config.ts` 的 `i18n.routing.prefixDefaultLocale: false`

效果一致（英文无前缀，其他带前缀），但 Astro 不需要 middleware 文件。

### 3. 内容加载

**Next.js**：`src/lib/content.ts` 用 webpack 动态 `import()` 加载 MDX，Turbopack 下有坑
**AnvilWiki**：Content Collections API，构建时类型安全，无运行时坑

### 4. 部署

**Next.js**：需要 `next-on-pages`（废弃）或 OpenNext（复杂）
**AnvilWiki**：`pnpm build` → `dist/` → Cloudflare 直连，零配置

---

## 迁移步骤

### Step 1 — Fork AnvilWiki

```bash
git clone https://github.com/<你>/anvilwiki.git
cd anvilwiki
pnpm install
pnpm dev  # 确认 demo 能跑
```

### Step 2 — 复制配置层

按 [换皮工作流 Part 1-3](./skinning.md#阶段-1基础换皮) 把你现有的游戏配置搬过来：
- 主题色（`globals.css` 4 行直接复制）
- `site.ts`（对应你 Next.js 的站点信息）
- `navigation.ts`（结构一致，icon 加 `lucide:` 前缀）
- `routing.ts`（locales 数组复制，删 `localePrefix`）
- `en.json`（home 命名空间结构相同，直接复制大部分）

### Step 3 — 转换文章格式

把 `export const metadata` 转成 YAML frontmatter：

```bash
# 批量转换（手动或脚本）
# 对每个 .mdx 文件：
# 1. 删除 `export const metadata = { ... }` 这段
# 2. 在文件开头加 ---\n... YAML ...\n---
```

然后把文件从 `content/<locale>/` 复制到 `src/content/wiki/<locale>/`。

### Step 4 — 验证

```bash
pnpm build  # 构建通过 = Content schema 校验通过
pnpm dev    # 逐页访问确认正常
```

### Step 5 — 部署

按 [部署指南](./deployment.md) 部署到 Cloudflare Pages。

---

## 不要迁移的场景

| 场景 | 建议 |
|---|---|
| 现有站流量 < 100GB/月、跑得好 | ❌ 不要迁移，重做成本 > 收益 |
| 现有站用了大量 React 交互组件 | ⚠️ 评估交互能否用纯 Astro 重写 |
| 做新站 | ✅ 直接用 AnvilWiki |
| 现有站爆量（>100GB/月） | ✅ 值得迁移，省带宽费 |

---

## 下一步

- [换皮工作流](./skinning.md)
- [部署指南](./deployment.md)
- [PRD](./PRD.md)（完整设计文档）
- 回到 [README](../README.md)
