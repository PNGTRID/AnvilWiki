---
title: "多站管理:一套工具管 N 个站"
description: "从第二个站开始:多站注册表 sites.toml 登记名字和路径(凭据永不入表),一条命令巡检全部——audit/metrics/insights 都支持 --all 和 --site;AI 引用追踪看趋势。submit 刻意拒绝 --all。"
manual: dev
order: 9
icon: lucide:layers
tldr: "复制出第二个站后,把它登记进注册表:npx anvilwiki-ops sites add <名字> <路径>,之后一条命令巡检全部:npx anvilwiki-ops --all audit(单站失败不中断)、--site <名字> metrics 查指定站。凭据永不进注册表——各站 .env 留在各自仓库。AI referrals 追踪:metrics 末尾多一节来自 chatgpt/perplexity/gemini/claude 的访问,看趋势别看绝对值(referrer 常被剥掉)。submit 刻意只支持单站:批量发布太危险。"
updated: 2026-09-02
---

## 先看一个真实场景

复制课之后你有了三个站。每周一的 30 分钟保鲜回路,难道要 ×3?这一课把「N 个站」折回「一条命令」:登记一次,巡检全部。

## 登记与巡检

```bash
# 登记(每个站一次)
npx anvilwiki-ops sites add anvil-wiki /path/to/anvil-wiki
npx anvilwiki-ops sites add forge-wiki /path/to/forge-wiki --url https://forge.example

# 巡检
npx anvilwiki-ops --all audit            # 全站体检,一份报告(单站失败不中断)
npx anvilwiki-ops --all metrics          # 全站数据
npx anvilwiki-ops --site forge-wiki metrics   # 只看某一个
npx anvilwiki-ops sites list             # 看登记了哪些
npx anvilwiki-ops sites remove <名字>     # 移除
```

注册表在 `~/.config/anvil-ops/sites.toml`,只存**名字和路径**——**凭据永不入表**:各站的 `.env`(GSC 钥匙、CF token)留在各自仓库里,互不串门。

## AI 引用追踪(AI referrals)

`metrics` 报告末尾有一节 **AI referrals**:来自 chatgpt.com、perplexity.ai、gemini.google.com、claude.ai 等的访问(走你的 Cloudflare 令牌统计)。GSC 的生成式 AI 报告没有 API,所以 `insights` 还会探测 AI Overviews 收录页(实验性),`metrics --import-aio <csv>` 可导入 GSC 界面导出的 CSV。

读法纪律:**看趋势,别看绝对值**——AI 浏览器经常剥掉 referrer,数字偏低是工具限制,不是你不行。这是「我的站有没有被 AI 引用」的第一手信号,配合学习手册直答与表格那套打法食用。

## 安全线:submit 刻意拒绝 --all

读命令(doctor/metrics/audit/insights)可以 `--all` 一键全站,**写命令 submit 刻意只支持单站**——批量发布太危险,不该被一键化。每个站的上线决策,都应该在它自己的 diff 面前做出。

## 三个经典错误(提前替你踩)

- **凭据写进 sites.toml**:注册表是明文文件,钥匙进去等于贴在门上——凭据只在各站 `.env`。
- **对 submit 想 --all**:设计上就不允许。批量上线的冲动,回到首版排期那课的节奏里解决。
- **拿 AI referrals 绝对值当 KPI**:referrer 剥除让它天然偏低,趋势向上就是好消息。

## 本课新词(就 3 个)

- **注册表(sites.toml)**:多站的名字与路径清单,`sites add/remove/list` 管理它。
- **--all / --site**:巡检范围开关——全部或指定站,读命令专用。
- **AI referrals**:来自 AI 助手的访问来源统计,「被 AI 引用」的可观测信号。

## ✅ 验收(全部成立才算完成)

- ☐ 第二个站已 `sites add`,`sites list` 能看到
- ☐ `--all audit` 出过一份全站报告
- ☐ 你知道凭据在哪(各站 `.env`)、注册表里有什么(只有名字和路径)

## 开发手册到此完结

地图(架构)→ 栏目语言 → 功能开关 → **改完自证** → 同步上游 → 贡献回流 → AI 运营 → 内容管道 → **多站管理**——你对这套模板已是维护者级掌控。回到[学习手册「每周 30 分钟」一课](/zh/landing/docs/weekly-ops)的节奏:现在,那 30 分钟里的大半,AI 和管道都能替你跑。遇到问题先翻学习手册末尾的三份附录(红线总表/排查树/术语速查)。
