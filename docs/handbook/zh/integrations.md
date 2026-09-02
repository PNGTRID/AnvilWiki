---
title: "功能开关总表:广告、评论、统计"
description: "所有可选功能共用一套开关机制(变量空着=不渲染,保住开箱满分),全部变量的总表和填写位置,以及 wrangler.toml 的进阶玩法(保留它=设置全以它为准)。"
manual: dev
order: 3
icon: lucide:plug
tldr: "每个可选功能(广告/评论/统计/赞助卡)都是同一个套路:组件读自己的环境变量,空着就整个不渲染——所以什么都不填网站干干净净,想开哪个填哪个,互不影响。变量填在 Cloudflare 网页(推荐)或仓库的 wrangler.toml(进阶:它在,网页设置就全部无效,连 NODE_VERSION 都要写进它的 [vars])。"
updated: 2026-08-26
---

## 你现在在哪,这章解决什么

想开广告、接评论、装统计——这章是开关总表和机制说明。**查询手册,按需翻。**

## 开关机制:一个模式走天下

每个可选功能都是同一个套路:

```astro
---
const client = import.meta.env.PUBLIC_ADSENSE_CLIENT;
if (!client) return null;   // 变量空着 = 这个组件整个消失
---
```

这给你两个保证:

1. **什么都不填**:网站干干净净,跑分(Lighthouse)四项满分。
2. **想开哪个填哪个**:互不影响,开一个跑一次 build 确认分数没掉。

所以**不要**给这些变量填默认值或抄别人的演示值——空着才是正确状态。本地的 `.env` 文件也能填这些变量(不进 git,密钥永不入库)。

## 全部变量总表

填的位置:二选一——**Cloudflare 网页**(Settings → Variables,学习手册教的路线,推荐)或**仓库的 `wrangler.toml` 文件**(进阶,见下节)。

| 变量名 | 干什么的 | 空着会怎样 |
|---|---|---|
| `SITE_URL` | 网站的正式网址(**唯一必填**,必须 `https://` 开头) | 全站分享卡片和 sitemap 网址错误 |
| `PUBLIC_ADSENSE_CLIENT` | AdSense 总开关(发布商 ID) | 不加载任何广告 |
| `PUBLIC_ADSENSE_SLOT_STICKY` / `_SIDEBAR` / `_INCONTENT` | 三个广告位 | 对应位置不显示 |
| `PUBLIC_GISCUS_REPO` / `_REPO_ID` / `_CATEGORY` / `_CATEGORY_ID` | Giscus 评论(靠 GitHub Discussions) | 评论区不显示 |
| `PUBLIC_GA_ID` | Google Analytics 4 | 不加载 GA |
| `PUBLIC_CF_BEACON_TOKEN` | Cloudflare 自带统计(无 cookie) | 不加载 |
| `PUBLIC_GSC_VERIFICATION` | Google 站长后台验证码 | 不输出验证标签 |
| `PUBLIC_SPONSOR_URL` / `_IMAGE_URL` | 赞助卡片 | 赞助卡不显示 |

统计三件套(GA4 / Cloudflare Web Analytics / Clarity)的选型对比与逐步接入教程,见[学习手册「接广告」一课](/zh/landing/docs/enable-ads)「可选:评论和统计」一节;GSC(站长后台)的完整接入教程在[让 Google 认识你](/zh/landing/docs/get-on-google)。

## 进阶:保留 wrangler.toml(设置记进仓库)

学习手册让你删了 `wrangler.toml`,从此设置只认 Cloudflare 网页。如果你**反过来**想保留它(好处:设置随代码走版本记录),规矩只有一条:**它在,网页设置就全部无效**——包括部署时的 Node 版本。所以保留它就要把所有变量写进它的 `[vars]` 段,至少包括:

```toml
[vars]
NODE_VERSION = "22"
SITE_URL = "https://你的域名"
```

诊断小技巧(设置疑似没生效时):在 `astro.config.ts` 第一行临时加 `console.log('ENV:', Object.keys(process.env).filter(k => k.startsWith('PUBLIC_')))` ,push 后看 Cloudflare 构建日志里到底有哪些变量;查完删掉这行。

## 卡住了怎么办

- **「填了变量没效果」**:先想填的位置对不对(网页 or wrangler.toml,后者优先);再核对变量名字符完全一致(区分大小写);最后确认保存后重新部署过。

## ✅ 验收(全部成立才算完成)

- ☐ 每开一个新功能,`pnpm build` 全绿且线上该出现的组件出现/该消失的消失
- ☐ 能说出自己站走的是哪条设置路线(网页 or wrangler.toml),并且只走一条

## 下一步

仓库里那几条自动检查(CI)在守护什么、安全底线有哪些——[开发 5 · CI 门禁与安全](/zh/landing/docs/ci-and-security)。
