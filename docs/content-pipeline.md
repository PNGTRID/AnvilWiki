# 内容管道:AI 写 → 人审 → merge 上线(v2.0)

> 这份文档解释 AnvilWiki 的 PR 门控内容管道:**内容怎么从「一份关键词清单」变成「草稿 PR」,以及为什么每一步长这样**。它回答的是 v2.0 的架构第一性问题——「谁产生 commit」。

## 为什么需要管道

个人内容站失败的头号原因不是建不了站,而是**内容产出断流**。v2.0 之前,「AI 写 → 人审 → 上线」这条路的所有环节都在本地会话里,靠自觉;v2.0 把它固化成一条**任何人都能复用的可信管道**:

```
关键词清单(CSV)
      │  workflow_dispatch(collaborator 触发,天然鉴权)
      ▼
auto-content workflow
      │  ① 确定性生成器:pnpm bulk-new-posts(draft:true 脚手架,绝不编造内容)
      │  ② 八道质量门禁:lint/typecheck/test/check-config/build/check-content/check-links/check-i18n
      ▼(全绿才继续;红了 = 不开 PR,什么都不发生)
GitHub draft PR(固定分支 chore/auto-content,幂等)
      │  人工审查:填入真实游戏数据(.agent/skills/anvil-batch-articles 提示词)
      ▼
merge → Cloudflare Pages 自动部署
```

## 安全契约(为什么敢让机器开 PR)

| 契约 | 实现位置 |
|---|---|
| **LLM 永不进 CI** — workflow 里没有任何 AI API key,`secrets.*` 零引用 | `auto-content.yml`(tests/workflows.test.ts 有测试盯着) |
| **门禁前置** — PR 创建前同一 workflow 里跑完全部八道门禁,红了就没有 PR | `generate-and-pr` job 步骤顺序 |
| **只开 draft PR** — 永不直推 main,merge 永远是人审决定 | `create-pull-request` 的 `draft: true` |
| **幂等** — 固定分支名,重复运行更新同一个 PR 而不是堆积;生成器无 diff 时静默跳过 | `branch: chore/auto-content` |
| **触发面最小** — 只 `workflow_dispatch`(GitHub 规定仅 collaborator 可触发),不监听 push/issue 评论 | `on:` 只有一项 |
| **门禁单一来源** — CI 与管道共用同一个 composite action,定义不可能漂移 | `.github/actions/gates/action.yml` |

> 为什么要「门禁前置」?2026 年起,用默认 `GITHUB_TOKEN` 创建的 PR 不会自动触发 CI(处于待批准状态)。所以验证干脆放在开 PR **之前**——绿灯是 PR 存在的前提,这反而比「先开 PR 再等 CI」更严格。

## 怎么用(一次跑通)

### 前置:打开仓库的两个设置

1. **Settings → Actions → General → Workflow permissions**:勾选 **"Allow GitHub Actions to create and approve pull requests"**(否则管道没权限开 PR)。
2. **Settings → Branches**(或 Rulesets):给 `main` 配「Require a pull request before merging」+ required status check `CI`(免费版公开仓库可用)。这是「无绿 CI 不可合并」的兜底。

### 日常:从关键词清单到草稿 PR

1. 准备关键词清单(CSV 表头 + 行,字段与 `pnpm bulk-new-posts` 一致:`locale,category,slug,title,description`):
   ```csv
   locale,category,slug,title,description
   en,codes,summer-codes,Summer Codes (September 2026),All working Anvil Quest codes for September 2026, verified daily.
   ```
2. Actions → **Auto content PR** → Run workflow:任务选 `import-csv`,短清单直接粘进 `csv_text`(长清单直接 commit 一份仓库根的 `new-posts.csv`,输入框留空,生成器会读它)。
3. 等跑完:绿了 → 出现 draft PR;红了 → 看 run 日志,没有 PR 产生。
4. 本地把 draft 填成真文章(用 `.agent/skills/anvil-batch-articles` 的统一提示词,**绝不编造游戏数据**),逐篇把 `draft: true` 翻转,再 merge。

### 与本地工作流的关系

本地会话(AI 写内容)+ `anvil-ops submit`(本地验证→分支→PR)和这条远程管道**并存互补**:管道适合「先把骨架批量铺出来」,本地适合「填肉」。两条路最终都收敛到同一个 PR 门控契约。

### codes 同步(`sync-codes` 任务,v2.16 起)

Run workflow 时任务选 `sync-codes`,把兑换码清单粘进 `csv_text`(`locale,slug,code,status,reward,expiryDate,source`;长清单直接 commit 一份仓库根的 `codes-sync.csv`,输入框留空):生成器把码确定性合并进已有 codes 页的 frontmatter(显式语言行优先,无行语言自动跟随该 slug 首行),八道门禁绿了才开 draft PR(固定分支 `chore/sync-codes`,与 import-csv 的 PR 分支互不干扰)。合并前复查非 en 语言的 reward/source 措辞与 title/summary 里的码数、日期;所有行都已应用过的重跑会响亮失败(require-output 契约),不会开出空 PR。

## 与「每周新鲜度审计」的分工

| | content-pipeline.yml(v1.8) | auto-content.yml(v2.0) |
|---|---|---|
| 触发 | 每周一 cron + 手动 | 仅手动(workflow_dispatch) |
| 做什么 | 只读审计 → 开 issue 提醒「什么过期了」 | 确定性生成 → 八道门禁 → draft PR |
| 改内容 | 从不改 | 只创建 `draft: true` 脚手架,真实内容仍由人/AI 本地会话填 |

## codes 批量同步(本地,`pnpm sync-codes`)

codes 页是更新频率最高的页面,`pnpm sync-codes` 把「新增/过期兑换码」变成一条确定性脚本:读一份 `codes-sync.csv`(`locale,slug,code,status,reward,expiryDate,source`),合并进已有 codes 页的 frontmatter `codes:` 数组——新码前置、过期翻转但保留(长尾 SEO)、空可选单元格保留现值;同名页面在所有语言同步(显式语言行优先,可按语言给翻译行;无行的语言自动跟随该 slug 首行,reward/source 文案照搬,非 en 语言需复查措辞)。合并语义与 `.agent/skills/anvil-update-codes` 一致,它是那套流程的机械半边;解析失败(未知字段/行内注释/嵌套结构)一律响亮中止,绝不盲写。先 `--dry-run` 预览。目标页必须已存在——同步不建页。

## v2.1 候选

- ✅ `codes-sync` 生成器(脚本本体 `pnpm sync-codes` v2.16.0;管道接入已交付:`sync-codes` 任务——task 输入/codes-sync.csv 粘贴或仓库根文件/require-output 契约/`chore/sync-codes` 固定分支)
- issue 评论 `/generate` 触发(需 collaborator 校验,见 GitHub Actions 安全实践)
- GitHub App token(让管道 PR 上的 CI 自动跑,而非待批准)
