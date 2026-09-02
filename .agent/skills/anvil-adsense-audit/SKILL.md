---
name: anvil-adsense-audit
description: AdSense 申请前全站体检——按 Google 官方政策(计划政策/发布商政策/内容质量/抓取可达/隐私合规)逐项审计站点是否达到申请标准,模板已解决的项直接给证据,fork 用户侧的项逐项判定,输出 Pass/Fail/Unknown/N/A 完整表格 + Blocker/High/Medium 分级裁决。触发词:adsense 审计 / 能不能申请 adsense / 被拒了帮我看下 / 申请前自查 / adsense audit / 过审。
---

# AnvilWiki AdSense 申请前体检

回答一个问题:**这个站现在交申请,是过、是拒、还是白交?** 不凭感觉,逐项体检后给裁决。

## 核心规则

1. **Google 官方文档是唯一真相源**:[AdSense 计划政策](https://support.google.com/adsense/answer/48182)、[Google 发布商政策](https://support.google.com/admob/answer/6128543)、[网站质量指南](https://developers.google.com/search/docs)。体检前先刷新一遍官方文档(政策会变);与本文冲突时,**官方文档赢**。
2. **体检不保证过审**——它排除的是「明知道会被拒还去交」的浪费;Google 的人工审核永远有主观成分。
3. **每项必须四选一**:`Pass`(有证据)/ `Fail`(有证据)/ `Unknown`(写明缺什么才能判)/ `N/A`(写明为什么不适用)。不许抽样,不许「整体看起来没问题」。
4. **具体化**:说「正文是抓取摘要且无增量评论」,不说「内容薄」;说「隐私政策没提第三方广告 cookie」,不说「隐私政策不完整」。

## 模板已解决的项(直接核对,别重复劳动)

这些是模板层承诺,体检时**核对存在性**即可标 Pass,把它们当免费的:

| 项 | 证据在哪 |
|---|---|
| `public/ads.txt` 就绪授权行存在(注释态——未过审保持注释才是正确状态,占位 pub-ID 反而是无效数据行) | 过审后按文件内注释操作:填入你的发布商 ID、删行首 `#` 即生效 |
| 隐私政策 / 服务条款 / 版权 / 联系 / 关于 5 个法律页**正文内置**（非空壳路由），隐私页已含 Google AdSense 广告 cookie 披露段 | `src/components/layout/LegalContent.astro`；线上 `/privacy-policy/` 应有 "Advertising partners (e.g. Google AdSense)" 段 |
| 广告组件 env 门控，默认零广告零弹窗 | `PUBLIC_ADSENSE_*` 不填就不渲染——申请期天然干净 |
| 空分类列表页 noindex 且不进 sitemap | build 后查 `dist/sitemap*.xml` |
| sitemap 自动生成 + `pnpm check-links` 死链门禁 | CI 八门禁 |
| Lighthouse 4×100(速度/体验基线) | 模板开箱契约 |
| 内链尾斜杠 + 语言前缀规范 | `pnpm check-content` 规则 5/6 |

**⚠️ 模板已知缺口(体检时主动提)**:模板不带 `public/robots.txt`——Cloudflare Pages 默认对 Googlebot 放行,这本身不是问题;但**如果用户自己加过 robots.txt,必须确认没挡 `Mediapartners-Google` 和 `AdsBot-Google`**,挡了 = 广告抓取失败,典型 Fail 项。

## 用户侧清单(体检重点,逐项判定)

### A. 资格与所有权

- **AD-01 自有域名**:是自定义域名,还是 `*.pages.dev`?(后者基本过不了审,见手册课 22「开广告:时机与接入」)
- **AD-02 所有权信号**:站点能验证所有权(GSC / DNS / meta),站点上能看出「谁在运营」(关于页/联系页有真实内容,不是模板占位)。

### B. 内容质量(最高频拒因)

- **AD-03 篇数**:数 `src/content/wiki/<主语言>/` 下非 draft 的 `.mdx` 文件,**≥15 篇**(15-20 篇起申,手册课 22 与 docs/ads.md 口径)。
- **AD-04 原创性**:抽读 3-5 篇,判断是「自己的话写的攻略」还是「抓取摘要/换词复写/纯视频嵌入无文字」。给出抽读的文件路径和判断依据。
- **AD-05 内容深度**:抽读页是否覆盖搜索意图(有数据表/步骤/结论),还是 300 字空壳凑数。codes 页有码表即算合格;guides/bosses 页看正文是否答题。
- **AD-06 时效性**:`codes` 页 `lastModified` 是否在 7 天内(过期码挂「有效」= 内容价值直接判负,跑 `pnpm refresh-audit` 看 P0)。
- **AD-07 语言一致性**:主语言正文是否机翻痕迹明显(不通顺/术语混乱)。模板支持多语言,但**申请语言的那个版本必须达到「人类愿意读」的水平**。
- **AD-08 分类结构**:每个分类下都有真实文章(空分类列表页 noindex 了,但导航里挂着 6 个空分类 = 站点未完成信号)。

### C. 技术与抓取

- **AD-09 死链**:`pnpm check-links` 全绿(先 build)。
- **AD-10 构建健康**:`pnpm build` 全绿(schema 合法 = 无烂 frontmatter)。
- **AD-11 sitemap 可达**:build 后 `dist/sitemap.xml` 存在,抽 3 个 URL 实测 200。
- **AD-12 无登录墙**:文章 URL 无痕浏览器直接可读(无付费墙/登录墙/POST-only)。
- **AD-13 robots.txt**(若存在):不挡 `Mediapartners-Google` / `AdsBot-Google` / `Googlebot`。

### D. 体验与信任

- **AD-14 导航可用**:顶部导航 + 分类页能走到每篇文章,不靠 sitemap 猜 URL。
- **AD-15 无欺骗性交互**:无误导下载按钮、强制重定向、恶意弹窗(模板默认无,核对用户没自己加)。
- **AD-16 内链健康**:抽读文章 ≥3 条站内链(`check-content` 规则 6 会警告)。

### E. 隐私与合规

- **AD-17 隐私政策披露完好**:模板已内置 AdSense 广告 cookie 披露(见「模板已解决」表),**默认 Pass**;仅当 fork 用户自行改写过 `LegalContent.astro`(代码层)或隐私页渲染结果缺 "Advertising partners" 段时才复查——核对线上 `/privacy-policy/` 即可。
- **AD-18 儿童向内容**:游戏是否面向儿童(COPPA 敏感)。是则标 Unknown 并提示用户在 AdSense 后台做标签配置,别替用户判。
- **AD-19 版权**:站内图片/视频来源合规(封面是模板生成的没问题;用户自己扒的游戏截图注意合理使用,标 Unknown 提醒即可)。

### F. 申请时机(不是政策,是成功率)

- **AD-20 排名状态**:核心词还没进前两页时,交申请不亏(审核与排名无关),但**通过后别立刻全量开广告**——同类站都没挂广告时先缓挂(见 `docs/ads.md` 时机章)。
- **AD-21 被拒史**:若本次是「被拒后复审」,必须先拿到 Google 给的拒因原文,逐条映射到上面的项;没有拒因就盲改 = Unknown。
- **AD-22 广告/联盟密度**:申请期站内**不应已有**其他联盟链接堆积(`AffiliateSuggestion` 配置若非空,提醒申请期先清空)。

## 工作流

1. **定场景**:申请前体检 / 被拒后复审 / 已过审的合规巡检。被拒后复审必须先要拒因原文。
2. **收证据**(全部用仓库命令,不许口头判断):
   - `ls src/content/wiki/<locale>/**/*.mdx` 数篇数(排除 `draft: true`)
   - `pnpm refresh-audit` 看时效性 P0
   - `pnpm build && pnpm check-links` 看技术项
   - 抽读 3-5 篇正文 + 隐私政策页正文(`src/content/wiki/<locale>/` 下的 legal 内容或用户填的页面)
   - 浏览器/curl 实测 sitemap 3 个 URL
3. **逐项判定**:22 项 AD-\* 全部四态之一。模板项标 Pass 时引用上表证据位置。
4. **出报告**:
   - 裁决:**Ready** / **Not ready** / **Ready after fixes**(有 Blocker 修完才 Ready)
   - 发现按 Blocker → High → Medium 排序;每条 = 项编号 + 问题 + 证据 + **精确修法**(精确到文件和命令)
   - 文末附完整 22 项表格(状态 + 证据 + 下一步)
5. **完整性门**:收尾时数一遍——报告里的项数 < 22 就是没做完,补齐再给裁决。**Blocker 未清零时,不许建议用户去交申请。**

## 严重度参考

| 级别 | 含义 | 例 |
|---|---|---|
| Blocker | 大概率直接被拒或违反硬政策 | 篇数 <15、正文纯抓取、无隐私政策、robots.txt 挡广告爬虫 |
| High | 显著拉低过审率 | codes 页长期过期、机翻痕迹重、关于/联系页空壳 |
| Medium | 建议申请前顺手修 | 内链不足、单分类下篇数失衡 |

## 致谢

本技能的审计框架(逐项四态判定 + Blocker 分级 + 完整性门)受 [yantoumu/adsense-site-auditor-skill](https://github.com/yantoumu/adsense-site-auditor-skill) 启发(未复制其文本);全部政策依据来自 Google 公开文档,清单本身为 AnvilWiki 模板特化重写——模板已解决项预填证据,审计火力集中在 fork 用户侧。
