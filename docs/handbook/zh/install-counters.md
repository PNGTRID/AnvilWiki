---
title: "装好两个计数器:谁来了,他们在看哪"
description: "上线当天装 Cloudflare Web Analytics(必装,一段 token)和 Clarity 热力图(选装,贴一段脚本),十分钟拿到「多少人、从哪来、卡在哪」——所有开关空值不渲染,不掉 Lighthouse 分。"
manual: learn
order: 20
stage: "上线与收录"
icon: lucide:gauge
tldr: "两个计数器,上线当天装好。①Cloudflare Web Analytics(必装):dashboard 里 Add a site,把 token 填进 PUBLIC_CF_BEACON_TOKEN 重新部署——无 cookie、不拖慢页面,「多少人、从哪来、看哪页」全答了。②Clarity(选装):clarity.microsoft.com 建项目拿脚本,贴进 BaseLayout 的 </head> 前——免费热力图+录屏,告诉你玩家卡在哪。GSC(站长后台)上一课已装好,读数三件套齐了。"
updated: 2026-09-02
---

## 先看一个真实场景

站上线了,可它是「活」是「死」你不知道——没装计数器的站,就像不开收银机小票的店,一天进来多少人、他们翻了几页、在哪摔的门,全是黑箱。这一课 10 分钟装好两件免费装备,下一课的第一周读数全靠它们。

两个开关和广告位同一套玩法:**变量空着,组件就不渲染**——不装,页面零负担,Lighthouse 照样满分。

### 计数器一:Cloudflare Web Analytics(必装,2 分钟)

回答的问题:**多少人来了、从哪个国家来、看哪几页**。无 cookie、不需要同意横幅、不拖慢页面——基础问题它一个人全答了。

1. Cloudflare Dashboard → 左侧 **Analytics & Logs** → **Web Analytics** → **Add a site**,填你的域名
2. 它给你一段 JS 代码,里面 `token="一串字母数字"`——把这串 token 填进环境变量 **`PUBLIC_CF_BEACON_TOKEN`**(Cloudflare 项目 Settings → Variables;本地开发就填 `wrangler.toml` 的 `[vars]`)
3. 保存并重新部署,几分钟后面板开始出数

**你会看到**:Web Analytics 面板出现 Views / 访问国家 / 热门路径。

### 计数器二:Clarity 热力图(选装,5 分钟)

数字告诉你「有多少人来了」,**Clarity 告诉你「他们在页面上干了什么」**——免费点击热力图+操作录屏,每周看两件事就值:玩家**卡在哪**、**广告位有没有被点**。

1. 打开 [clarity.microsoft.com](https://clarity.microsoft.com) → 微软账号登录(免费)→ **Add project** 填你的域名
2. 安装方式选 **Manual install**,拿到一段 `<script>` 跟踪代码
3. 打开 `src/components/layout/BaseLayout.astro`,把代码粘到 `</head>` 结束标签之前 → push 重新部署
4. 回后台等几分钟,状态变 Receiving data 就通了;脚本异步加载,不影响 Lighthouse 分数

读数三件套到此齐了:**GSC**(上一课装好,管搜索表现)+ **Cloudflare**(管访问量)+ **Clarity**(管页面行为)。

## 三个经典错误(提前替你踩)

- **填了 token 没重新部署**:环境变量只在部署时生效——改完必须触发一次部署,本地看不到线上计数器。
- **一口气装五个分析工具**:工具越多,注意力越碎。两个计数器+一个 GSC 到位,等你的问题升级了再考虑 GA4(第 24 课)。
- **把 Clarity 脚本贴进正文或贴了两遍**:只贴一次,只贴在 `</head>` 之前——贴重了数据翻倍,没法看。

## 本课新词(就 3 个)

- **信标(beacon)**:访客浏览器向统计服务发出的一个小信号,页面加载时静默发出——计数器的工作原理。
- **热力图**:把全站点击画成温度图的报表,红的地方就是玩家点得最多的地方。
- **环境变量开关**:模板所有可选功能共用一套机制——变量空着就不渲染,这就是「不装也不掉分」的原因。

## ✅ 验收(全部成立才算完成)

- ☐ Cloudflare Web Analytics 面板出数(VIEWS 列不为空)
- ☐ Clarity 状态 Receiving data(或你明确选择暂不装)
- ☐ 你知道读数三件套各管什么:GSC 管搜索、CF 管访问、Clarity 管行为

## 下一课

装备齐了,怎么读?下一课给你第一周读数指南:三个面板各认一个数,四条及格线对着看。[去第 21 课 · 第一周读数](/zh/landing/docs/first-week-numbers)
