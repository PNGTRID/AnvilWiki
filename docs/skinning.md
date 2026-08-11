# 换皮工作流

> 把 AnvilWiki 从 demo 站（虚构游戏 "Anvil Quest"）换成你的目标游戏站点。
>
> **换皮 = 改配置层（~5 个文件）+ 替换内容层（content/ 和 locales/）。框架层一行不动。**

---

## 前提

- 已 fork AnvilWiki 仓库
- 本地能 `pnpm dev` 跑起来
- 准备好目标游戏的资料（游戏名、平台、官方链接、主题色 hex、至少 1-3 篇文章内容）

---

## 换皮前的准备

在开始改代码之前，先准备好这些**游戏数据**（建议用一个 `requirements/` 文件夹存放）：

```
requirements/
├── 00基础信息.md       # 游戏名、平台、官方链接、主题色、社群链接
├── 00首页模块.md       # 首页 8 个模块的文案和数据
├── 关键词.json         # 关键词分类（决定导航分类）
├── articles/           # AI 生成的 MDX 文章
│   └── en/
│       ├── bosses/
│       └── guides/
├── favicon_io/         # favicon 全套
└── hero.webp           # Hero 图
```

> 这些数据怎么采集？参考课程第三课（首页数据采集 P1）和第四课（关键词挖掘 + seoscout 批量生成文章）。

---

## 三层架构回顾

换皮时请牢记**哪些能改、哪些不能碰**：

```
框架层（绝对不动）—— src/pages/, src/components/, src/lib/
配置层（改这里）   —— src/config/, src/i18n/routing.ts, src/styles/globals.css, public/
内容层（全替换）   —— src/content/wiki/, src/locales/
```

---

## 4 阶段 7 Part 流程

```
阶段 1：基础换皮 → Part 1 基础配置
                    Part 2 元数据与 SEO
                    Part 3 多语言与导航

阶段 2：首页内容 → Part 4 首页模块

阶段 3：内容接入 → Part 5 文章与导航

阶段 4：翻译验证 → Part 6 多语言翻译
                    Part 7 Sitemap URL 检查
```

**每个 Part 之间串行**——前一个完成并验证通过后，才进入下一个。

---

## 提示词骨架（每个 Part 都遵循）

每个 Part 的提示词套用这个固定结构：

```
# Part N：标题

## 目标
改完后站点变成什么样

## 参照
- 数据来源：requirements/<文件> 的 <区块>

## 修改范围
- 文件 1：改什么、怎么改
- 文件 2：改什么、怎么改

## ⚠️ 硬性约束
- 容易踩的坑 + 正确做法

## 禁止修改
- 白名单外的文件/key

## 验证方法
grep/ls/file 命令，配中文注释
```

下面逐 Part 给出完整提示词。把 `{{游戏名}}` / `{{PROJECT_PATH}}` 等占位符替换成你的实际值后，发给 AI 执行。

---

## 阶段 1：基础换皮

### Part 1：基础配置

**目标**：改完这 4 样，站点视觉上就不像 demo 了——主题色、favicon、hero 图、logo。

````text
# Part 1：基础配置

参考：requirements/00基础信息.md 的主题色（hex 值）
只更新 src/styles/globals.css 里的 4 行：
- `:root` 下的 `--nav-theme`（亮色主色）
- `:root` 下的 `--nav-theme-light`（亮色浅色变体）
- `.dark` 下的 `--nav-theme`（暗色主色）
- `.dark` 下的 `--nav-theme-light`（暗色浅色变体）

把 hex 转成 HSL 格式（如 #f97316 → 22 90% 52%），用 https://www.w3schools.com/colors/colors_hsl.asp 转换。
其他 CSS 变量（--background / --foreground / --border 等）不要改。
更新文件：src/styles/globals.css

参考：requirements/favicon_io/ 下的图标
把这些文件复制到 public/ 目录，覆盖现有占位文件：
- favicon.ico
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png
- android-chrome-192x192.png
- android-chrome-512x512.png

参考：requirements/00基础信息.md 的游戏名
更新 public/manifest.json 的 name 和 short_name 字段为 {{游戏名}} Wiki / 缩写

参考：requirements/hero.webp（或从官网下载 Hero 图）
替换 public/images/hero.svg 为真实的 hero 图。
⚠️ 如果拿到的是 PNG/JPG，用 PIL 转 WebP：
   python3 -c "from PIL import Image; Image.open('hero.png').save('public/images/hero.webp','webp')"
⚠️ 模板自带的 hero.svg 可能是占位文件，必须用真实图覆盖。
⚠️ 同时把 BaseLayout.astro 里的 og:image 默认值从 /images/hero.svg 改成 /images/hero.webp（如果用了 webp）。

## 禁止修改
- src/components/ 下的任何组件
- src/lib/ 下的任何工具函数
- src/pages/ 下的路由

## 验证方法
```bash
# 验证主题色已更新（应显示你的 hex 对应的 HSL 值）
grep "nav-theme" src/styles/globals.css

# 验证无硬编码颜色残留（应该没有 hex 色值在组件里）
grep -rn "#[0-9a-fA-F]\{6\}" src/components/ | grep -v node_modules

# 验证 favicon 文件存在且非空
ls -la public/favicon* public/apple-touch-icon* public/android-chrome-*

# 验证 hero 图是真实图片（不是占位）
file public/images/hero.*
```
````

---

### Part 2：元数据与 SEO

**目标**：所有站点级元数据（站点信息、社交链接、法律页）换成新游戏。

````text
# Part 2：元数据与 SEO

参考：requirements/00基础信息.md 的游戏名称、域名、平台、社群信息
更新 src/config/site.ts 的所有字段：
- name: "{{游戏名}} Wiki"
- shortName: 缩写
- description: 站点描述（含游戏名 + 核心关键词）
- domain: 你的域名
- tagline: 副标题
- legalNotice: 法律声明
- social.official: 游戏官网 URL
- social.discord / youtube / twitter / reddit: 社群链接（没有的留 undefined）
- game.name / platform / developer / genre / releaseDate

参考：requirements/00基础信息.md
更新 src/locales/en.json 的以下 key：
- site.name / site.shortName / site.description / site.tagline / site.legalNotice
- footer.copyrightText（年份 + 游戏名）
- home.meta.title（含游戏名 + 核心关键词，50-60 字符）
- home.meta.description（含游戏名，150-160 字符）
- home.hero.title（{{游戏名}} Wiki）
- home.hero.description（含游戏名 + 核心卖点）
- home.hero.primaryCta / secondaryCta / tertiaryCta
- home.hero.stats（4 条游戏特色数据）
- home.finalCta.title / description / primary / secondary

⚠️ 域名不要硬编码在组件里——所有绝对 URL 走 SITE_URL 环境变量。
⚠️ 本 Part 只改 site.ts + en.json 的上述 key，不要改 nav / overview / home.explore / home.faq（那些在 Part 4）。

## 禁止修改
- src/components/ 下的组件
- src/pages/ 下的路由
- src/locales/en.json 的 nav / overview / home.explore / home.faq / home.start / home.aboutGame / home.popular / home.updates

## 验证方法
```bash
# 验证无 demo 游戏名残留
grep -ri "Anvil Quest\|AnvilQuest\|anvil" src/config/ src/locales/ public/manifest.json
# 应该为 0 条（除非游戏名本身含 anvil）

# 验证 site.ts 格式合法
node -e "import('./src/config/site.ts').then(m => console.log('✅', m.site.name))"

# 验证 en.json 合法
python3 -c "import json; json.load(open('src/locales/en.json')); print('✅ JSON valid')"

# 验证法律页内容已更新（手动检查）
# 访问 /about /privacy-policy 看是否显示新游戏名
```
````

---

### Part 3：多语言与导航

**目标**：配置目标语言列表、清空 demo 内容、设置导航分类。

````text
# Part 3：多语言与导航

## A. 语言配置

参考：requirements/00基础信息.md 或 languages.json（语言列表真相源）
更新 src/i18n/routing.ts 的 locales 数组。
⚠️ 默认必须是 'en'（英文无 URL 前缀，SEO 最优）。
其他语言按热度加：如 ['en', 'ja', 'ru', 'es']。

⚠️ 三处必须同步（少一处报错）：
1. src/i18n/routing.ts 的 locales 数组
2. src/locales/ 下实际存在的 JSON 文件
3. src/i18n/ui.ts 的 messages 对象（import + 注册）

先清空旧的非英文 locale，再按最终语言集合重建空文件：
```bash
# 删除 ja.json（demo 残留）
rm -f src/locales/ja.json
# 为每个新语言创建空 JSON（deepMerge 会自动 fallback 英文）
# 例如加 ru：
echo '{}' > src/locales/ru.json
```

同步更新 src/i18n/ui.ts：
- 删除不再需要的 import（如 ja）
- 加上新语言的 import（如 import ru from '~/locales/ru.json'）
- 更新 messages 对象
- 更新 LOCALE_LABELS（如 ru: 'Русский'）

## B. 清空 demo 内容

```bash
# 删除所有 demo MDX 文章（保留目录结构）
find src/content/wiki -name '*.mdx' -delete

# 删除 demo 的日文 boss（如果不再用日文）
rm -rf src/content/wiki/ja
```

⚠️ src/content/wiki/ 目录本身必须保留（Content Collection 需要它存在）。
⚠️ 如果你换了导航分类（比如不要 bosses 要 codes/tiers），把对应的子目录也清掉。

## C. 导航分类配置

参考：requirements/关键词.json 的 categories 数组（不是 00基础信息.md 的建议分类！）
更新 src/config/navigation.ts 的 NAVIGATION_CONFIG：
- key = 分类 slug（= requirements/articles/<lang>/ 下的子目录名）
- path = '/' + key
- icon = 'lucide:图标名'（从 lucide 图标库选，如 lucide:swords / lucide:gift / lucide:book-open）

⚠️ 分类 key 必须在三处完全一致：
1. src/config/navigation.ts 的 NAVIGATION_CONFIG[].key
2. src/locales/en.json 的 nav.<key>（显示文本）
3. src/locales/en.json 的 overview.<key>.overviewTitle / overviewDescription
4. src/content/wiki/<locale>/<key>/ 目录名

清空 en.json 的 nav 和 overview 对象（留空 {}），后续 Part 4/5 再填。

## 禁止修改
- src/pages/ 下的路由
- src/components/ 下的组件
- src/lib/ 下的工具函数

## 验证方法
```bash
# 验证 content 下无 demo 残留
find src/content/wiki -name '*.mdx' | wc -l
# 应为 0

# 验证 content 目录还在
ls -d src/content/wiki
# 应该存在

# 验证语言配置三处同步
grep "locales" src/i18n/routing.ts
ls src/locales/*.json
grep "import.*locales" src/i18n/ui.ts

# 验证导航分类
grep "NAVIGATION_CONFIG" src/config/navigation.ts

# 启动 dev server 看首页不报错
pnpm dev
# 访问 http://localhost:4321 应该能打开（即使内容是空的）
```
````

---

## 阶段 2：首页内容

### Part 4：首页模块

**目标**：把首页 8 个模块的文案和数据全部换成新游戏。

````text
# Part 4：首页模块

参考：requirements/00首页模块.md（首页 8 模块完整数据）
更新 src/locales/en.json 的 home 命名空间下以下 section：

1. home.start（新手教程卡片，4 张）
   - eyebrow / title
   - cards[]: 每张含 number / title / description
   - 卡片 1 固定为"新手入门"类
   - 卡片 2-4 从升级/刷资源/角色选择/兑换码/进阶机制/Boss 中选 3 个

2. home.popular（热门文章区）
   - eyebrow / title / quickLinks[]

3. home.aboutGame（游戏介绍区）
   - title: "What is {{游戏名}}?"
   - paragraphs[]: 2 段游戏介绍
   - stats[]: Developer/Platform/Genre/Visits 等
   - cta: "Explore All Guides"

4. home.explore.modules（8 个内容模块，核心）
   每个模块：
   - order: 1-8
   - name: "{{游戏名}} + 功能词"（SEO，必须含游戏名）
   - description: 模块说明
   - href: "/分类slug"
   - displayType: code-cards / step-by-step / tier-grid / card-list（四选一）
   - highlights[]: 每项含 label + detail（+ 可选 badge）

5. home.faq（FAQ 手风琴，5 条左右）
   - title / description
   - items[]: question + answer
   - ⚠️ FAQ 问答中必须包含游戏名

6. home.updates（最近更新区标题）
   - title / browse

⚠️ 硬性要求：
- 模块级标题（home.explore.modules[].name）必须含游戏名（SEO）
- 子项文案（highlights）不需要强制含游戏名
- 4 种 displayType 都要用到，不要全用 card-list
- card-list 的 highlights.label 必须是英文短词，禁止 emoji
- step-by-step 的 label 是数字（1-6），tier-grid 的 label 是 S/A/B/C
- code-cards 的 highlights 含 badge（Active / Expires soon）
- 禁止 emoji，所有图标走 lucide
- 禁止"信息可能不准确"之类的描述

## 禁止修改
- src/components/home/ 下的渲染组件（只改 JSON 数据）
- src/config/site.ts（Part 2 已改）
- src/config/navigation.ts（Part 3 已改）

## 验证方法
```bash
# 验证无 demo 游戏名残留
grep -i "Anvil Quest" src/locales/en.json
# 应为 0

# 验证模块级标题含游戏名
python3 -c "
import json
d = json.load(open('src/locales/en.json'))
for m in d['home']['explore']['modules']:
    game = '{{游戏名}}'
    if game.lower() not in m['name'].lower():
        print('❌ 模块标题缺游戏名:', m['name'])
    else:
        print('✅', m['name'])
"

# 验证 JSON 合法
python3 -c "import json; json.load(open('src/locales/en.json')); print('✅ valid')"

# 验证 4 种 displayType 都用到了
python3 -c "
import json
d = json.load(open('src/locales/en.json'))
types = set(m['displayType'] for m in d['home']['explore']['modules'])
print('使用的 displayType:', types)
assert len(types) <= 4, '最多 4 种 displayType'
"

# 启动 dev server，访问首页看 8 模块渲染
pnpm dev
```
````

---

## 阶段 3：内容接入

### Part 5：文章与导航

**目标**：把 AI 生成的 MDX 文章接入项目、配置分类文案。

````text
# Part 5：文章与导航

## A. 拉取文章到项目

把 requirements/articles/<lang>/ 下的 MDX 复制到 src/content/wiki/<lang>/：

```bash
# 英文文章
cp -r requirements/articles/en/* src/content/wiki/en/
# 其他语言（如果有）
cp -r requirements/articles/ja/* src/content/wiki/ja/ 2>/dev/null || true
```

⚠️ 文章目录的子目录名必须与 navigation.ts 的 key 一致：
  src/content/wiki/en/bosses/gelum.mdx → key=bosses → /bosses/gelum

⚠️ MDX frontmatter 格式（AnvilWiki 用 YAML frontmatter，不是 export const metadata）：
```mdx
---
title: "文章标题 - 游戏名"
description: "155 字符以内的描述，含关键词"
category: "bosses"
date: 2026-08-11
lastModified: 2026-08-11
image: "/images/cover.jpg"
tags: ["boss", "ice"]
---

## 正文从 H2 开始
不写 H1，ArticlePage 自动用 title 渲染 H1。
```

如果你的文章是 seoscout 生成的（export const metadata 格式），用转换脚本：
```bash
pnpm tsx scripts/convert-from-seoscout.ts requirements/articles/ src/content/wiki/
```

⚠️ homepage-only 模式：允许没有文章——站点可以先只上线首页，后续补文章。

## B. 配置分类文案

更新 src/locales/en.json：
- nav 对象：每个分类 key 对应显示文本（如 "bosses": "Bosses"）
  - nav 值必须是单个英文单词（首字母大写），禁止多词描述
  - 例外：tierList 允许 "Tier List"
- overview 对象：每个分类需要 overviewTitle + overviewDescription
  - overviewTitle: "All Bosses" / "All Guides" / "All Codes" 等
  - overviewDescription: 该分类的描述（含游戏名 + 关键词）

## 禁止修改
- src/components/（渲染组件不动）
- src/lib/（工具函数不动）
- src/pages/（路由不动）

## 验证方法
```bash
# 验证文章已复制
find src/content/wiki -name '*.mdx' | wc -l
# 应该 > 0（除非 homepage-only）

# 验证文章分类与 navigation 一致
for d in src/content/wiki/en/*/; do
  key=$(basename "$d")
  grep -q "key: '$key'" src/config/navigation.ts && echo "✅ $key" || echo "❌ $key 不在 navigation"
done

# 验证 nav 和 overview 配置完整
python3 -c "
import json
d = json.load(open('src/locales/en.json'))
nav = d.get('nav', {})
overview = d.get('overview', {})
for key in nav:
    if key in ['home','toggleTheme','menu','close']: continue
    if key not in overview:
        print('❌ 分类缺 overview:', key)
    else:
        print('✅', key)
"

# 启动 dev，逐个访问列表页和文章页
pnpm dev
# 访问 /bosses（列表页）、/bosses/gelum（文章页）确认正常
```
````

---

## 阶段 4：翻译与验证

### Part 6：多语言翻译

**目标**：把英文版翻译成所有目标语言。

````text
# Part 6：多语言翻译

前提：Part 1-5 已完成，英文版构建通过、SEO 检查通过。

翻译 src/locales/ 下除 en.json 外的所有 JSON 文件。

⚠️ 语言列表真相源是 src/i18n/routing.ts 的 locales 数组。
⚠️ 翻译前先清空旧文件，杜绝 demo 残留：
```bash
find src/locales -maxdepth 1 -type f -name '*.json' ! -name 'en.json' -exec sh -c '
  for f; do echo "{}" > "$f"; done
' _ {}
```

翻译范围：
- nav（导航文本）
- overview（分类标题和描述）
- home.*（首页所有 section 的文案）
- footer（页脚文本）
- shared（通用文案）
- site（站点信息）

⚠️ 不要翻译的：
- 法律页正文（硬编码英文，不翻译）
- 文章正文（走 MDX 文件，单独翻译复制到 src/content/wiki/<locale>/）

翻译文章 MDX：
```bash
# 把英文文章复制到对应语言目录，翻译正文
mkdir -p src/content/wiki/ja/bosses
cp src/content/wiki/en/bosses/gelum.mdx src/content/wiki/ja/bosses/gelum.mdx
# 然后翻译 ja 版的 frontmatter + 正文
```

⚠️ deepMerge 机制保证：非英文 JSON 缺 key 会自动回退英文，不会崩溃。
   所以可以只翻译部分 key，剩下的自动显示英文。

## 验证方法
```bash
# 验证所有语言文件合法
for f in src/locales/*.json; do
  python3 -c "import json; json.load(open('$f'))" && echo "✅ $f" || echo "❌ $f"
done

# 验证无 demo 残留
grep -ri "Anvil Quest" src/locales/ || echo "✅ 无残留"

# 验证第二语言页面可访问
pnpm build && echo "---" && ls dist/ja/ 2>/dev/null

# 访问 /ja/ 看日文首页
pnpm dev
```
````

---

### Part 7：Sitemap URL 检查

**目标**：部署后验证所有 URL 返回 200，修复所有 500/404。

````text
# Part 7：Sitemap URL 检查与自动修复

前提：Part 1-6 完成，已部署到 Cloudflare Pages（或本地 dev server 运行中）。

## Step 1：确认 BASE_URL

```bash
# 如果已部署，用真实域名
BASE_URL="https://{{你的域名}}"

# 如果本地开发，用 dev server
BASE_URL="http://localhost:4321"
```

⚠️ 不能拿未部署的域名去检查——DNS 没生效所有 URL 会误报失败。

## Step 2：检查所有 sitemap URL

```bash
curl -s "$BASE_URL/sitemap-index.xml" | grep -o '<loc>[^<]*</loc>' | head -1
# 拿到 sitemap-0.xml 的 URL

curl -s "$BASE_URL/sitemap-0.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' > /tmp/urls.txt
wc -l /tmp/urls.txt
# 看看总共有多少 URL

# 逐个检查状态码
while read url; do
  status=$(curl -o /dev/null -s -w "%{http_code}" "$url")
  if [ "$status" != "200" ]; then
    echo "❌ $status $url"
  fi
done < /tmp/urls.txt
echo "检查完成"
```

## Step 3：修复 500 错误

如果有 500，通常是 MDX 文件语法问题：
- 首行残留垃圾 token（如 jsx / mdx）
- import 路径错误
- JSX 标签未闭合
- frontmatter YAML 格式错误

逐个打开报错的 URL 对应的 MDX 文件，修复后重新部署。

## Step 4：重新验证

修复后重新部署，再跑一次 Step 2。直到所有 URL 返回 200。

⚠️ 不能接受"大部分 URL 正常"——每一个 500/404 都会影响 SEO。
````

---

## 路径速查表

| 改什么 | 改哪个文件 |
|---|---|
| 游戏名/域名/社交链接 | `src/config/site.ts` |
| 导航分类（bosses/guides/codes...） | `src/config/navigation.ts` |
| 支持的语言列表 | `src/i18n/routing.ts` + `src/i18n/ui.ts` |
| 主题色 | `src/styles/globals.css`（4 行） |
| 首页所有文案 | `src/locales/en.json` 的 `home` 命名空间 |
| 导航栏文字 | `src/locales/en.json` 的 `nav` 对象 |
| 列表页标题 | `src/locales/en.json` 的 `overview` 对象 |
| 页脚 | `src/locales/en.json` 的 `footer` 对象 |
| 文章内容 | `src/content/wiki/<locale>/<category>/*.mdx` |
| favicon | `public/favicon*` + `public/apple-touch-icon*` + `public/android-chrome-*` |
| Hero 图 | `public/images/hero.webp` |
| PWA | `public/manifest.json` |
| 广告 key | Cloudflare 环境变量 `PUBLIC_AD_*` |

---

## 换皮检查清单（上线前必查）

```
□ site.ts 所有字段已换成新游戏
□ globals.css 主题色已改（4 行）
□ navigation.ts 分类与 content/ 子目录一致
□ routing.ts 语言与 locales/*.json 同步
□ en.json 无 demo 游戏名残留（grep "Anvil Quest" 为 0）
□ favicon 全套已替换
□ hero 图是真实图片（非占位）
□ 所有 MDX frontmatter 通过 Zod schema（构建时不报错）
□ sitemap URL 全部返回 200
□ Google Rich Results Test 结构化数据有效
□ Lighthouse Performance ≥ 95
□ SITE_URL 环境变量已配为最终域名
```

---

## 下一步

- [部署指南](./deployment.md)：部署到 Cloudflare Pages
- [内容格式](./content-format.md)：MDX 文章怎么写
- [SEO 说明](./seo.md)：SEO 工程化细节
- 回到 [README](../README.md)
