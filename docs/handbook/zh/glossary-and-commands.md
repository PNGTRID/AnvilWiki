---
title: "附录 C · 术语表与命令速查"
description: "全手册词卡的统一住处:30+ 个术语按拼音/字母排列;20 条 pnpm 命令按场景分组(写作/质检/配置/运营/资产),各带一句话说明。"
manual: learn
order: 32
stage: "附录"
icon: lucide:book-marked
tldr: "两部分:①术语表——各课词卡按主题归拢(SEO 类/站务类/变现类/工程类);②命令速查——pnpm 命令按场景分组:写作(new-post/bulk-new-posts)、质检(check-content/check-links/build)、配置(check-config/apply-template/new-locale)、运营(refresh-audit/submit-indexnow)、资产(gen-covers/gen-assets)。每条一句话说明,忘了细节先来这里。"
updated: 2026-09-02
---

## 术语表(按主题归拢)

**SEO 与搜索**

| 术语 | 一句话 |
|---|---|
| SEO | 让 Google 把你的页面排前面的整套方法 |
| SERP | Google 搜索结果页,前 10 条是黄金铺位 |
| 搜索意图 | 玩家搜这个词背后想解决的事 |
| 意图满足度 | 第一页把题答好的比例,决定你有没有空位 |
| 长尾词 | 「游戏名+具体问题」形的中低热度词,新店主战场 |
| 一页一词 | 每个页面主攻一个搜索词,防自相残杀 |
| Quick Answer 卡 | 页面顶部直答卡,AI 引用的门面 |
| 展示 / CTR | 被摆出来一次 / 摆出来后被点的比例 |
| E-E-A-T | 经验/专业/权威/可信,靠真作者+有来源+不过期落地 |
| AI Overviews | Google 结果顶部的 AI 总结框,问答型查询的主场 |

**站务与内容**

| 术语 | 一句话 |
|---|---|
| frontmatter | 文章开头的登记卡,AI 自动写 |
| draft | 未核实的草稿开关,正式构建不发布 |
| 转正 | 核实后删掉 draft,页面对全部玩家可见 |
| slug | 页面网址的英文短名,小写连字符 |
| 固定盘 | 每个游戏都该有的标准页(码/指南/Boss/榜) |
| 窗口词 | 选品时验证过、竞争还空着的词 |
| 候选池 | 待验证游戏清单,选品的原材料 |
| 黄金窗口 | 新游爆发后 2-8 周,搜索量占一生大头 |
| P0 / P1 | 过期紧急度:码超 7 天 / Boss 榜超 90 天 |
| 三层分离 | 代码层别动、配置层每游戏一次、内容层天天换 |

**变现与运营**

| 术语 | 一句话 |
|---|---|
| 流量 / 变现 | 访问量 / 把访问量变成钱 |
| RPM | 每千次浏览的收入 |
| AdSense | Google 广告中介,按月结算,收入全归你 |
| W-8BEN | 税务声明表,勾协定优惠 30%→10% |
| SWIFT 码 | 银行国际电汇门牌号 |
| 出账 | 余额满 $100 后每月 21 日自动打款 |
| 保鲜 | 让内容不过期的动作;固定节奏是唯一秘诀 |
| AI referrals | 来自 AI 助手的访问,看趋势不看绝对值 |

## 命令速查(按场景)

**写内容**

```bash
pnpm new-post           # 交互式单篇脚手架
pnpm bulk-new-posts     # 从关键词 CSV 批量建草稿(--dry-run 预览)
```

**质检(改完必跑)**

```bash
pnpm check-content      # 内容 lint(H1/alt/内链/尾斜杠)
pnpm check-i18n         # 翻译覆盖率(--strict-ui 当门禁)
pnpm check-config       # 分类/语言三处一致性
pnpm build              # schema 校验+全站构建(含 Pagefind)
pnpm check-links        # 内链审计(build 之后跑)
pnpm check-sitemap      # sitemap 全地址可达性
```

**配置与站点**

```bash
pnpm apply-template     # 换皮问答命令(--dry-run 预览)
pnpm new-locale         # 加一种语言
pnpm template-audit     # 模板健康度(复制站前必跑)
```

**运营与资产**

```bash
pnpm refresh-audit      # 保鲜审计,自报过期页
pnpm submit-indexnow    # 全站 URL 推给 IndexNow(部署后跑)
pnpm gen-covers         # 生成 og:image 封面(1200×675)
pnpm gen-assets         # 按主题色重生成全套图标+首页图
```

## 下一站

- [附录 A · 作死红线总检查表](/zh/landing/docs/appendix-red-lines)
- [附录 B · 疑难排查决策树](/zh/landing/docs/troubleshooting-tree)
- 命令的完整参数与细节,`docs/` 仓库文档和 AGENTS.md 各有详解。
