# Spec: 社群精华每日管道（Community Digest Pipeline）

- 日期：2026-09-08
- 状态：已实现（页面+历史数据 v1 随本 spec 同批落地；每日增量由 ZCode 定时任务驱动）
- 关联：v2.17.0 内容管道（auto-content.yml，生成器管道，无 AI）；本管道**是 AI 管道**（ZCode 定时会话内完成归纳），两者只共享「PR-only、不自动进 main」契约。

## 1. 目的

把主理人微信交流群「Anvil_Wiki交流群」（2026-08-16 建群）的真实讨论持续整理成官网常青页，做社群内容资产与 SEO 引流（哥飞模式）。首次已回填建群至 2026-09-08 全量（2298 条消息 → 94 条精华 + 23 天速览）。

- 页面：`/landing/community/`（en）+ `/zh/landing/community/`（zh）
- 数据：`src/components/landing/community-digest.json`（**唯一需要每日更新的文件**）
- 标签文案：`src/config/landing.ts` 的 `communityHighlights` 节（en/zh，仅人工改）
- 展示组件：`src/components/landing/CommunityHighlights.astro`

## 2. 数据获取（会话内）

ZCode 会话自动连接本机 `wechat` MCP（`~/.zcode/cli/config.json` → stdio `/Users/yuanruiqin/wechat-mcp/.venv/bin/python -m wechat_mcp.server`，11 个工具）。群聊工具：

- `get_chat_history {chat, limit, start_date?, end_date?}`：群名模糊匹配「Anvil_Wiki交流群」。⚠️ 结果**最新在前**；`start_date` 是下限、`end_date` 是上限。增量抓取：`start_date` 填 JSON 里 `daily[0].date`（最老一天）即可覆盖全部未入库消息，记得与已有日期去重。
- `get_group_stats {group, days}`：可选，用于页面外的活跃度观察。
- 若 MCP 不可用（服务挂了/微信未登录），**本轮响亮失败并跳过**，禁止凭空编造内容。

## 3. 分类体系（六分法）

| id | 中文 | 收录标准 |
| --- | --- | --- |
| `gold` | 精华干货 | 可复用的方法论、SOP、工具推荐、关键数据情报（金额/阈值/路线） |
| `pitfalls` | 避坑警示 | 平台/工具的血泪教训：限流、封号、偷偷改设置、假 APP |
| `qa` | 问答精选 | 群友真实提问 + 群里给出的实质解答（多人回答要融合） |
| `feedback` | 反馈与建议 | 对 AnvilWiki 模板/手册/技能/文档/官网的具体意见、bug、功能请求（新条目 status 恒 "open"；主理人处理完成后由维护会话把 status 翻为 "resolved" 并在 detail 尾部补一句修复说明，页面渲染绿色「已处理」徽章） |
| `news` | 动态公告 | 版本发布、showcase 收录、群规变更、重要群事件 |
| `daily` | 每日速览 | 有消息的每一天一条：一句话主线 + 2~5 个话题词 |

纯闲聊（寒暄、表情、订阅额度闲谈）不收。宁缺毋滥。

## 3.5 每日结构化报告（12 维，2026-09-08 增补）

除六分类外，每天额外产出一份 **12 维结构化日报**（用户模板）：

1. `quotes` 精华观点（摘原文+署名）2. `qa` 答疑记录（已解决配对）3. `takeaways` 干货要点（可执行列表）4. `unresolved` 未解决问题（待主理人跟进）5. `faqCandidates` 高频重复问题（≥2 次合并）6. `feedbackItems` 产品反馈（带 sentiment: pos/neg/neutral）7. `resources` 资源分享（标题+一句话+谁分享）8. `activeMembers` 活跃成员（KOL 潜力）9. `newcomers` 新人动态（入群+首问）10. `sentiment` 情绪与口碑信号（带原文佐证）11. `topics2create` 可二次创作选题 12. `stats` 数据概览（消息条数/发言人数/高峰时段/热度——**由脚本从原始数据精确计算，AI 不得自行统计**）。

**双通道产出（隐私分级是本节的铁律）**：
- **公开子集**（维度 1/2/3/5/7/11 + stats）→ 写入 `community-digest.json` 的 `reports` 数组**头部**（页面「每日报告」区支持按日期切换，渲染最新 `REPORTS_VISIBLE`=14 天——组件 `CommunityHighlights.astro` 窗口常量；更早历史保留在 JSON 供日后归档页）。公开层**永不包含** `unresolved`/`activeMembers`/`newcomers`/`sentiment`/`feedbackItems`——未解决问题、成员 KOL 排名、新人名单、情绪研判、带情绪倾向的反馈都属主理人私有运营情报。
- **属主全量**（12 维全部）→ 追加写入 `reports/community-digest/daily-reports.md`（gitignored，本地文件），并在 **PR 正文**里完整贴出当天的 4/6/8/9/10 维（未解决/反馈/活跃成员/新人/情绪），方便主理人在合并 PR 时直接跟进。

当天运行时（如 23:00 后群仍在聊），日报按当日已抓取内容生成，次日运行时**重写**该日报告为终稿（替换 `reports` 数组中同日期条目）。

## 4. JSON schema（v2，与组件严格对齐）

```jsonc
{
  "schemaVersion": 2,
  "updated": "YYYY-MM-DD",        // 本轮整理日期
  "since": "2026-08-16",          // 恒定：建群首日消息日
  "categories": [                  // 固定顺序 gold→pitfalls→qa→feedback→news
    { "id": "gold", "items": [
      { "date": "MM-DD", "title": "≤25字", "detail": "60~150字，保留关键数字",
        "tags": ["…"], "attrib": "群昵称或省略" }
    ]}
    // pitfalls: { date,title,detail,tags? }  qa: { date,q,a,attrib? }
    // feedback: { date,title,detail,status:"open"|"resolved" }  news: { date,title,detail }
  ],
  "daily": [ { "date": "YYYY-MM-DD", "summary": "一句话", "topics": ["…"] } ],
  "reports": [                    // §3.5 公开子集（v2 增补），严格倒序
    { "date": "YYYY-MM-DD", "stats": { "messages": 0, "speakers": 0, "peakHour": "17-18",
      "heat": "高" }, "quotes": [], "takeaways": [], "qa": [], "resources": [],
      "faq": [{ "pattern": "…", "count": 2 }], "topics": [{ "title": "…", "source": "…" }] }
  ]
}
```

不变式（PR 前自查）：
1. 全部 items 与 daily 按日期**倒序**（新在前）；`daily` 覆盖从 `since` 起每个有消息的日子，无空洞。
2. `qa` 用 `q`/`a` 字段；其余分类用 `title`/`detail`；`feedback.status` ∈ `"open"|"resolved"`——**定时任务新增条目恒 `"open"`，且合并时不得改动既有条目的 status**；`"resolved"` 仅由主理人的维护会话翻转。
3. 每类条数写进 PR 描述，与 JSON 一致。

## 5. 每日更新算法（定时任务执行此节）

1. 读 `community-digest.json`。增量游标取 `updated` 字段（最近一次整理日）；`daily` 数组是倒序，末尾元素即建群以来最老一天（用于完整性核对，不是抓取起点）。
2. MCP 抓 `(updated, now]` 的消息（`get_chat_history`，`start_date=updated`，limit 足够大，如 2000）。
3. 按第 3 节分类体系整理出**新条目**；当天可能未结束——若运行时间早于当天结束，仍生成当天 `daily`（次日运行时**重写**同日期条目为终稿）。
4. 合并：新 items 按分类插入各数组头部并保持倒序；`daily` 同理；更新 `updated` 字段。
5. 自查第 4 节不变式 + 隐私扫描（正则 `wxid_\w+`、11 位手机号、`gh_` 公众号 id，命中即删改）。
6. **只改** `src/components/landing/community-digest.json` 这一个文件 → 新分支 `chore/community-digest`（已存在则复用+force 覆盖）→ commit → `gh pr create`（draft 不必）。
7. 绝不 push main、绝不发版、绝不改 spec/组件/landing.ts（除非主理人在任务里明确要求）。

## 6. 红线

1. **禁止编造**：金额/数字/平台名/工具名必须出现在抓取原文里；抓取失败宁可本轮空 PR 不开。
2. **隐私**：只显示群昵称；wxid/手机号/头像/真人姓名一律不写入；引用保持事实忠实但允许压缩措辞；涉及具体站点收益的表述不点名可定位的域名（除非群友自己公开投过 showcase）。
3. **原始记录不公开**：raw 抓取只落 `reports/`（已 gitignore）；仓库与网页只出现整理稿。
4. **删除权**：群成员可要求删除自己的发言条目（主理人转达即可）。
5. 单日整理量超过 ~40 条时优先保 gold/pitfalls/feedback 质量，qa/news 收敛。
6. **🚫 特定课程负面评价禁令（2026-09-08 主理人指示）**：不得再产出对特定付费课程/社群（尤其「听涛 888 小白课」）的负面评价条目（pitfalls/quotes/qa/topics 等任何维度）；中性资源引用（如找词飞书文档）也一并回避。历史数据已清理，增量整理时若当天群聊再次出现该话题，**跳过不收录**，只在属主 md 里一句话记「当日有课程相关讨论，按红线跳过」。

## 7. 契约测试

有：`tests/community-digest.test.ts`（2026-09-09 起，组件已含渲染逻辑后补）钉住全部**机械**不变式——五分类 id 顺序与条目形状、`daily`/`reports` 严格倒序且 `daily` 抵达 `since`、`reports` 精确公开键集（兼证 §3.5 私有维度零泄漏）、隐私正则扫描（`wxid_\w+`/`gh_` 公众号 id/11 位手机号）、每个条目日期都有 `daily` 行。内容级红线（禁编造、第 6 节课程评价禁令）**有意不做机械校验**——正则会误伤未来合法内容，仍走本 spec 清单 + 定时任务 PR 的人工合并。
