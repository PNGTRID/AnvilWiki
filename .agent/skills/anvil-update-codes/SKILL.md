---
name: anvil-update-codes
description: 更新游戏的兑换码页面——用户给一批新码(或来源链接/截图内容),自动更新 codes 文章的 CodeBlock 列表、过期分区、日期与 gameVersion。触发词:更新 codes / 新兑换码 / codes 过期了 / update codes。
---

# AnvilWiki 兑换码更新

codes 页是游戏 wiki 流量最高、时效性最强的页面。更新它的唯一原则:**只信用户给的数据,绝不编造或"推测"兑换码**——一个失效码直接损害站点信任。

## 工作流

### Step 1 — 定位目标文章

```bash
ls src/content/wiki/en/codes/   # 或用户指定的 locale
```

读现有文章,理解现有结构(Active 列表 / How to Redeem / Expired 列表)。

### Step 2 — 应用新数据(v1.8 起 codes 走 frontmatter,不再手写 CodeBlock)

文章 frontmatter 有结构化 `codes:` 数组,页面自动渲染 Active(CodeBlock 一键复制)/ Expired(表格)分区 + FAQPage JSON-LD:

```yaml
codes:
  - code: FORGE-2026
    reward: '+500 Gold'
    status: active
    expiryDate: 'Aug 31'
    source: 'Official Discord announcement'
```

(`status` 取值 `active | expired`;YAML 块内不要写行内注释——`pnpm sync-codes` 的解析器会响亮拒绝。)

- 新码:在 `codes:` 数组 active 项最前面追加(带 reward/expiryDate)
- 用户说"XX 过期了":把该项 `status` 改为 `expired`(保留,不删除——过期码是 "is X still working" 长尾 SEO 内容)
- 更新 frontmatter:`lastModified: <今天>`;游戏有版本号就更新 `gameVersion`
- 若文章标题含年月(如 "All Working Codes (August 2026)"),跨月时同步更新 title
- `summary` 里的码数量/日期同步修正
- 正文里的 CodeBlock 列表(旧格式)迁移到 frontmatter 后删除,正文保留 how-to-redeem 等散文内容

> **批量场景**(一次新增/过期多个码):`pnpm sync-codes` 读 `codes-sync.csv` 确定性合并进 frontmatter(`--dry-run` 预览,新码前置/过期保留,全语言同名页同步)。本技能仍是单页精修与翻译判断(reward 等文案按语言译)的正道。

### Step 3 — 多语言同步

若 `src/content/wiki/<locale>/codes/` 存在同名文章,同步数据(codes frontmatter 的 `code` 字段不翻译,`reward` 等文案字段翻译)。

### Step 4 — 自检(必须执行)

```bash
pnpm check-content && pnpm build
```

> **可选**(anvilwiki-ops ≥0.1,模板 v1.15+):自检通过后 `npx anvilwiki-ops submit --title "codes: 更新兑换码 YYYY-MM-DD"` 一条命令完成「校验→建分支→提交→推送→开 PR」,PR 描述自带校验结果;校验不过就地终止,不会提交任何东西。

### Step 5 — 汇报

新增 N 码 / 过期 M 码 / 文章路径,提醒用户:codes 类页面建议每周检查一次——注意 codes 分类**不在** STALE_CATEGORIES 里,不会显示页面横幅;保鲜提醒来自每周一的 content-pipeline 审计 issue(codes 超 7 天未验证 = P0)。
