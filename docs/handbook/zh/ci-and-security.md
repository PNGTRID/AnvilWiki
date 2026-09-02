---
title: "CI 门禁与安全底线"
description: "三条自动流水线分别替你把什么关(八道门禁的 CI、每周保鲜提醒、初始化清理),以及模板内置的安全底线——结构化数据转义、赞助链接标记、同意前不追踪、零 JS 框架。"
manual: dev
order: 5
icon: lucide:shield-check
tldr: "CI 流水线每次 push 替你跑八道门禁,红一条都不许合;保鲜审计默认只在官方仓库跑(fork 要删一行 if 才开启,且它只提醒绝不改内容);Initialize 按钮只做收尾清理不换肤。安全底线已内置:数据转义防注入、赞助链接自动标记、同意前不加载追踪、零 JS 框架——定制时别拆掉这些。"
updated: 2026-08-17
---

## 你现在在哪,这章解决什么

仓库的 Actions 页有几条自动流水线,红红绿绿的——这章讲清它们各自在守护什么,以及模板已经内置、你定制时不该破坏的安全底线。**查询手册,按需翻。**

## 三条自动流水线(.github/workflows/)

| 流水线 | 什么时候跑 | 替你把什么关 |
|---|---|---|
| **CI** | 每次 push / PR | 八道门禁:lint → typecheck → test → check-config → build → check-content → check-links → check-i18n,红一条都不许合 |
| **Content freshness audit** | 每周一(定时) | 跑保鲜审计,过期页面自动开 issue 提醒。**默认只在 AnvilWiki 官方仓库生效**(fork 不装条件开关,免得给你开一堆提醒);想在自己的站开启:让 AI 删掉文件里 `if: github.repository ==` 那行。它**只提醒、绝不改内容**——自动化碰内容的风险不可控 |
| **Initialize AnvilWiki** | 手动点 | fork 后的收尾清理:重置 wrangler.toml 变量、删项目页、可选清演示内容。**不换游戏名/主题色/语言**——那些只能本地跑 `pnpm apply-template` |

## 安全底线(已内置,定制时别拆)

- **结构化数据转义**:页面里给 Google 看的数据卡片统一做了字符转义,文章里就算被人塞了恶意代码也逃不出去。你新增数据组件时必须沿用现成的 `JsonLd.astro`,别自己手拼。
- **赞助链接**:联盟推广链接组件自动带 `sponsored nofollow` 标记(向 Google 声明这是付费链接);外链统一 `noopener`。
- **同意前不追踪**:用户没点 cookie 同意之前,GA 和 AdSense 根本不加载——是真的不加载,不是摆个横幅。
- **密钥不进库**:一切敏感值走变量;`.env` 已在忽略清单里。

## 性能底线(动代码层时守住)

- 零 JS 框架:不引入 React/Vue 之类的运行时;交互用浏览器原生能力(可折叠块、弹窗)+ 极少量原生脚本。
- 图片走模板的图片管线(自动压缩成 WebP、自动适配手机)。
- 改完想验跑分:`pnpm build && npx wrangler pages dev dist`,再用浏览器 Lighthouse 面板打分。

## 卡住了怎么办

- **「CI 红了」**:点进红色那条看日志最后一行,八道门禁哪道挂了日志开头会写;本地跑同一条命令复现。

## ✅ 验收(全部成立才算完成)

- ☐ 自己 fork 的 Actions 页 CI 是绿的
- ☐ 知道保鲜提醒为什么默认收不到、怎么开
- ☐ 新增组件时记得沿用 JsonLd.astro,不自己手拼数据

## 下一步

模板作者会持续发新版——[开发 6 · 同步与回流](/zh/landing/docs/sync-and-contribute):怎么安全地合并上游更新,以及怎么把你的好改进贡献回官方。
