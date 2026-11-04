---
name: anvil-refresh
description: 内容新鲜度巡检——扫描全站 lastModified 超 90 天的时效性文章(bosses/tier-list)、codes 页日期、教程集合(updated 超 180 天)、sitemap 覆盖缺口,输出一份"该更新什么"的优先级清单。触发词:内容巡检 / 哪些文章过期了 / freshness check / 该更新什么。
---

# AnvilWiki 内容新鲜度巡检

静态 wiki 的排名衰减主因是内容过期。这个技能产出一份可执行的更新清单,不修改任何文件。

## 工作流

### Step 1 — 跑确定性审计脚本

仓库自带 `pnpm refresh-audit`(scripts/refresh-audit.ts,与每周一定时
content-pipeline workflow 同一引擎):codes 超 7/30 天 = P0,bosses/tier-list
超 90 天 = P1,tutorials 超 180 天 = P1(扫 en 侧,zh twin 共享 updated 由双语铁律门禁保证),自动跳过 draft,输出优先级表格。直接跑它,把输出作为报告基础:

```bash
pnpm refresh-audit
```

(仅当脚本不可用时才退回手动 `grep -rE "^(date|lastModified|category):" src/content/wiki/`)。

> **可选增强**(anvilwiki-ops ≥0.1,模板 v1.15+):`npx anvilwiki-ops insights` 会把本审计的过期 codes 页与 GSC/CF 真实流量数据合并,输出按预期收益排序、带证据的行动清单(.env 未配置凭据时自动降级为纯新鲜度规则)。

### Step 2 — 检查 codes 页

codes 文章的 frontmatter 日期 vs 今天:超 7 天就该提醒(玩家默认 codes 页是日更的);
超 30 天几乎必然有过期码,置最高优先级。

### Step 3 — 检查版本断层

游戏当前版本(site.ts 的 game 信息或用户告知)vs 文章 `gameVersion`——
主版本落后的 bosses/tier-list 文章即使没超 90 天也应列入(版本更新=机制大概率改动)。

### Step 4 — 输出清单(不改动文件)

按「流量价值 × 过期程度」排优先级,格式:

```markdown
## 更新优先级清单(YYYY-MM-DD)
| 优先级 | 文章 | 分类 | 距上次更新 | 问题 |
|---|---|---|---|---|
| P0 | codes/all-codes | codes | 34 天 | 30+ 天未验证,大概率含失效码 |
| P1 | bosses/emberfang | bosses | 102 天 | 超 90 天 + gameVersion 落后 v2.4 |
```

每项给一句"更新动作建议"(如"P0: 向用户索取最新码列表后跑 anvil-update-codes")。

### Step 5 — 提醒自动机制

告知用户:超期文章页面上已自动显示"possibly outdated"横幅(构建时判断),
更新 `lastModified` 后横幅自动消失、sitemap lastmod 同步刷新。
