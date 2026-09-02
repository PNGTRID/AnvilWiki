---
title: "改完怎么自证:验证清单与门禁"
description: "每次改动后、提交前的自证清单:七条本地命令各守什么、CI 八道门禁怎么读、三条自动流水线各自把什么关,以及安全与性能底线——定制时别拆模板内置的防线。"
manual: dev
order: 4
icon: lucide:shield-check
tldr: "自证三件套:①本地七命令(typecheck/lint/test/build/check-content/check-links/check-i18n——改路由必跑 build,改 YAML 必验 yaml.safe_load);②CI 八道门禁每次 push 全跑,红一条不许合,点进日志看最后一行定位;③安全与性能底线别拆——JsonLd 转义、赞助链接标记、同意前不追踪、零 JS 框架、图片走管线。保鲜审计默认只在官方仓库生效(fork 删一行 if 可开),Initialize 按钮只做收尾清理不换肤。"
updated: 2026-09-02
---

## 你现在在哪,这章解决什么

改代码容易,自证「我没改坏」难——这一课是每次改动后、提交前的固定动作。**查询手册:改完什么翻什么节。**配合上一课的功能开关,这套模板的定制安全网就齐了。

## 本地验证清单(每次改动后,提交前)

```bash
pnpm typecheck       # 0 errors(astro check)
pnpm lint            # 0 errors 0 warnings(全绿)
pnpm test            # vitest 全过(纯函数放 lib/,可测)
pnpm build           # Zod schema 校验 + 全站构建
pnpm check-content   # 内容 lint(改了 MDX 时)
pnpm check-links     # 内链审计(build 之后,必须跑)
pnpm check-i18n      # 加了 locale JSON key 后,看覆盖率报告
```

两条特例:**改了 `.astro` 路由文件 → 必跑 build**(getStaticPaths 的错误只在构建时暴露);**改了 workflow YAML → 验一下能被解析**(`python3 -c "import yaml; yaml.safe_load(open('<file>'))"`——模板曾因 YAML 缩进断裂翻车)。

## CI 八道门禁(每次 push 替你把关)

仓库的 CI 每次 push 跑全量门禁:lint → typecheck → test → check-config → build → check-content → check-links → check-i18n,**红一条都不许合**。本地最省事的复现方式就是逐条跑上面的清单。

**CI 红了怎么定位**:点进红色 job 看日志最后一行——哪道门禁挂了,日志开头会写;本地跑同一条命令复现,修完推上去 CI 自己会再跑。

## 三条自动流水线(.github/workflows/)

| 流水线 | 什么时候跑 | 替你把什么关 |
|---|---|---|
| **CI** | 每次 push / PR | 八道门禁,红一条不许合 |
| **Content freshness audit** | 每周一(定时) | 保鲜审计,过期页面自动开 issue。**默认只在 AnvilWiki 官方仓库生效**(fork 收不到,免得给你开一堆提醒);想开:让 AI 删掉文件里 `if: github.repository ==` 那行。它**只提醒、绝不改内容** |
| **Initialize AnvilWiki** | 手动点 | fork 后收尾清理:重置 wrangler.toml 变量、删项目页、可选清 demo。**不换游戏名/主题色/语言**——那些只能本地 `pnpm apply-template` |

## 安全底线(已内置,定制时别拆)

- **结构化数据转义**:给 Google 看的数据卡片统一走 `JsonLd.astro` 做字符转义——新增数据组件时沿用现成组件,**别自己手拼**。
- **赞助链接**:联盟链接组件自动带 `sponsored nofollow`;外链统一 `noopener`。
- **同意前不追踪**:用户没点 cookie 同意,GA 和 AdSense 根本不加载——真的不加载,不是摆横幅。
- **密钥不进库**:敏感值全走变量,`.env` 已在忽略清单。

## 性能底线(动代码层时守住)

- **零 JS 框架**:不引入 React/Vue 运行时;交互用浏览器原生能力+极少量原生脚本。
- 图片走模板管线(自动压缩 WebP、适配手机)。
- 改完验跑分:`pnpm build && npx wrangler pages dev dist`,浏览器 Lighthouse 面板打分——四项 100 是这套模板的开箱契约,别在你手里破功。

## 卡住了怎么办

- **「本地绿了 CI 红」**:对比 Node/pnpm 版本(CI 用 22 LTS),或看 CI 跑的命令和你本地是否同一条。
- **「test 挂了我没动测试」**:纯函数改了行为,对应测试就是契约——更新实现,不是改测试。

## ✅ 验收(全部成立才算完成)

- ☐ 你的 fork 上 Actions 页 CI 是绿的
- ☐ 本地七命令你跑过一遍且知道各守什么
- ☐ 新增组件时记得沿用 JsonLd.astro,不手拼数据

## 下一步

自证过关,放心合入。模板作者持续发新版——下一课:把官方更新安全搬进你的站。[同步上游](/zh/landing/docs/sync-upstream)
