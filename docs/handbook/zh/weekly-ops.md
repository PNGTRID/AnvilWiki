---
title: "每周 30 分钟:保鲜回路"
description: "每周一 30 分钟:跑 pnpm refresh-audit 让网站自报过期页、更新兑换码、看 GSC 挑下周选题;每月同步上游+看 RPM;每季度 SEO 体检。固定节奏是网站永不过期的唯一秘诀。"
manual: learn
order: 25
stage: "变现与长期经营"
icon: lucide:refresh-cw
tldr: "每周一 30 分钟三件事:①pnpm refresh-audit 让网站自报过期页(P0=兑换码页超 7 天,P1=Boss/排行榜超 90 天),报告喂 AI 变待办;②更新兑换码(/anvil-update-codes 或提示词,过期码标记不删除);③git push 后看 GSC 挑下周选题。每月:check-i18n+同步上游(冲突口诀「配置和内容保留我的,代码听官方的」)+看 RPM;每季度:SEO 体检提示词。固定节奏是永不过期的唯一秘诀。"
updated: 2026-09-02
---

## 先看一个真实场景

广告开了,店正式营业。但游戏攻略最怕过期:兑换码过期没人管、Boss 改版攻略还教旧打法——玩家来一次发现是废纸,就不来第二次,Google 也会把排名让给别人。这一课给你一套固定节奏:**每周一 30 分钟,每月 10 分钟,每季度 5 分钟。固定节奏是网站永不过期的唯一秘诀。**

## 每周一,30 分钟

### 动作一:跑保鲜检查,把报告变成待办(15 分钟)

```bash
pnpm refresh-audit
```

**你会看到**:一张清单,两种级别——**P0 最紧急:兑换码页超过 7 天没更新;P1 次紧急:Boss 攻略和排行榜超过 90 天没更新**(只有这两类过时会误导玩家)。把清单粘贴给 AI 整理成待办:

```text
下面是我的 pnpm refresh-audit 报告:
<粘贴报告>
把 P0/P1 转成可执行清单:
1. 需要我提供新数据的页面 → 逐页列出具体要什么(最新码列表/新版本机制改动)
2. 我确认内容仍准确、只需刷新的页面 → 把 lastModified 更新为今天
3. gameVersion 落后的页面单独列出
不许自行修改任何内容事实。以复选框清单输出。
```

> 注意:仓库里「每周自动检查并开 issue」的功能**默认只在 AnvilWiki 官方仓库生效,你的站收不到自动提醒**——所以要自己每周跑。想让 GitHub 自动开 issue:删掉 `.github/workflows/content-pipeline.yml` 里 `if: github.repository ==` 那行条件(让 AI 帮你删,一句话的事)。

### 动作二:更新兑换码(10 分钟)

去官方推特/Discord 收集新码、确认过期的旧码,然后——支持技能的 AI 助手直接说:

```text
/anvil-update-codes 新码:<code列表>;已确认过期:<code列表>
```

普通提示词版:

```text
更新 src/content/wiki/en/codes/ 下的 codes 文章:新码追加到 frontmatter active 最前;
过期码 status 改 expired(保留不删除);lastModified 改今天;title/summary 中码数量与年月同步;
若存在其他语言版,同步数据(code 字段不译,reward 等文案译)。
写完运行 pnpm check-content && pnpm build,全绿才算完成。
```

**确认做对了**:新码出现,过期码搬进「已过期」表格(**不删**——还有人搜「旧码还能用吗」,留着接长尾流量)。

### 动作三:git push,定下周选题(5 分钟)

push 后(Cloudflare 自动重新上架)瞄一眼 GSC:哪些词在涨,下周用产页流水线补对应页面。读数的完整打法在[第一周读数](/zh/landing/docs/first-week-numbers)那课,这里只需 5 分钟挑词。

## 每月一次(各 10 分钟)

```bash
# 1. 有多语言站才跑:看翻译缺了多少
pnpm check-i18n

# 2. 把模板作者的更新搬进来(第一次用,三行都要跑)
git remote add upstream https://github.com/PNGTRID/AnvilWiki.git
git fetch upstream
git merge upstream/main
```

**出现 CONFLICT 别慌**:把冲突文件名告诉 AI,口诀「配置和内容保留我的,代码听官方的」,让它逐个解决——细节在开发手册同步课。再花 10 分钟看 AdSense 报表:哪类页面 RPM 最高(通常是排行榜和兑换码)→ 下月多写哪类。

## 每季度:SEO 体检(把这段发给 AI 助手)

```text
对本站做 SEO 体检,只读不改:
1. SITE_URL(wrangler.toml [vars] 或 .env)含 https:// 且为正式域名
2. 全部文章 title≤80、description 40–165、summary 为直答(列违规清单)
3. og:image/twitter:image 为绝对路径
4. noindex 是否误用
5. 运行 pnpm check-sitemap;build 后运行 pnpm check-links,报告非 200/死链
6. 多语言 hreflang 覆盖是否完整
输出问题表:文件/问题/建议修法,经我确认后再改。
```

## 长期心态

- 第一个站跑通后,**第二个站边际成本极低**——选品、建站、产页、部署、运营,这本手册你已经完整走了一遍(下一课讲复制)。
- 忘了每周跑检查?手机日历建每周一循环提醒,标题写「30 分钟保鲜」。

## 三个经典错误(提前替你踩)

- **refresh-audit 报告看不懂就放着**:不用懂,整段喂 AI,它变待办清单。
- **删除过期码**:该标记 expired,不删除——旧码有长尾搜索。
- **靠意志力记周更**:日历提醒比意志力可靠得多。

## 本课新词(就 3 个)

- **保鲜**:让内容不过期的整套动作,游戏站的「补货」。
- **P0/P1**:过期紧急度——P0 兑换码超 7 天,P1 Boss/排行榜超 90 天。
- **上游(upstream)**:模板官方仓库,每月同步一次拿新功能。

## ✅ 验收(全部成立才算完成)

- ☐ 本周跑过 refresh-audit,P0 清零(兑换码页 7 天内更新过)
- ☐ 连续三周,同一时间做了这三件事
- ☐ 日历里有每周一的循环提醒

## 下一课

一个会自己保鲜的店,值不值得复制?下一课:30 分钟复制出第二个游戏站。[去第 26 课 · 复制第二个站](/zh/landing/docs/clone-your-site)
