---
title: "让 AI 替你运营:anvilwiki-ops 与 MCP"
description: "一行 npx 给你的 AI 助手装上运营工具:体检配置、拉 GSC 与 Cloudflare 真实数据、自动产出按优先级排序的优化清单、把新内容校验后开 PR 上线——写操作只走 PR 一条路,合并权永远在你手里。"
manual: dev
order: 6
icon: lucide:bot
tldr: "anvilwiki-ops 是模板配套的运营工具包(npm 包,npx 免安装)。doctor 一次体检看清配置缺什么;GSC 服务账号和 CF token 写进 .env 后,metrics 拉真实流量,insights 给出带证据的行动清单;接入 MCP 后 Claude/ZCode 直接替你查数据、改内容、开 PR——所有写操作只走 PR,人工把关每一步。"
updated: 2026-08-22
---

## 你现在在哪,这章解决什么

[学习手册「每周保鲜与增长」一课](/zh/landing/docs/weekly-ops)的每周 30 分钟节奏很好,但那 30 分钟的大半是「跑命令、看数字、抄清单」——这恰好是 AI 最擅长的事。这一课把整个运营循环交给你的 AI 助手:你说「看看网站最近怎么样」,它拉数据、给建议、改内容、开 PR;你只负责最后的「合并」按钮。

先弄懂两个词,后面不再解释:

- **CLI(命令行工具)**:在终端敲命令用的程序。这个包的命令叫 `anvil-ops`,用 `npx` 运行,不需要安装。
- **MCP**:让 AI 助手(Claude、ZCode 等)直接调用外部工具的开放协议。接入后 AI 不需要你转述命令,自己就能调体检、拉数据这些能力。

## 第一步:体检(2 分钟)

**做什么**:确认你的仓库和凭据状态,拿到一份「哪里没接好、怎么修」的报告。

**怎么做**:在仓库根目录运行:

```bash
npx anvilwiki-ops doctor
```

**你会看到**:一行一项的清单——`site-config`(读到了 wrangler.toml 里的 SITE_URL)、`gh`(GitHub CLI 在不在)、`gsc-config` / `cf-config`(数据凭据配没配)。没配的不算失败,只提示「metrics 将以降级模式运行」。

**确认做对了**:结尾出现 `All checks passed.`,或者你明确知道哪项没配、并且接受暂时不用它。

## 第二步:接上两个数据源(GSC 5 分钟,CF 2 分钟)

**做什么**:让工具能读到你的真实流量。Google Search Console(以下简称 GSC)提供搜索词和排名,Cloudflare Web Analytics(模板已内置埋点)提供访问量。

**先搞懂一个概念(30 秒)**:GSC 的数据是隐私数据,API 只认"授权过的身份"。给机器人授权用的是「服务账号」——它**不是邮箱**:不能收信、没有密码、不能登录,只是 Google 自动生成的一串"机器人编号"(长得像 `xxx@项目名.iam.gserviceaccount.com`,纯命名习惯);它的钥匙是一个 JSON 密钥文件。接下来你要做的就是:造一个机器人,把数据查看权发给它。

**怎么做**——GSC(一次性):

1. **造机器人**:Google Cloud 控制台(console.cloud.google.com,用和 GSC 同一个 Google 账号)→ 新建项目 → 顶部搜 `Google Search Console API` → 启用;菜单 → IAM 和管理 → 服务账号 → 创建(名字随意,如 `anvil-ops`)→ 点进它的「密钥」标签 → 添加密钥 → JSON → 创建,**浏览器自动下载一个 .json 文件**——这就是机器人的钥匙,存好。
2. **建转发群组**(必须,别跳过):GSC 的"添加用户"只认真人账号,机器人编号直接填会被判为"无效电子邮件"。解法是拿 Google 群组当中转:groups.google.com → 创建群组(名字随意,记下群组邮箱 `xxx@googlegroups.com`)→ 群组设置开启「允许外部成员」→ 成员 → 添加成员 → **直接粘贴**机器人编号(钥匙 JSON 里搜 `client_email` 那串)→ 添加(不要用"邀请",机器人不会点链接)。
3. **授权**:Search Console → 你的资源 → 设置 → 用户和权限 → 添加用户 → 填**群组邮箱**(不是机器人编号!)→ 权限「受限」。注意:新建群组可能要几分钟到几小时才被 Google 认可,报「未指明的错误」就等等再重试。
4. **配钥匙路径**:仓库根目录建 `.env` 文件(已在 .gitignore 里,不会提交),写一行:
   `GSC_SERVICE_ACCOUNT_JSON=钥匙文件的路径`

CF(一次性):Cloudflare 控制台 → 我的资料 → API 令牌 → 创建令牌,权限选 **账户 → Analytics → 阅读**;`.env` 再加两行:`CF_API_TOKEN=令牌` 和 `CF_ACCOUNT_ID=账户ID`。

**你会看到**:再跑一次 doctor,`gsc-config` 和 `gsc-access` 两项变绿。

**确认做对了**:`All checks passed.`;`gsc-access` 报 FAIL 提示 "not in accessible list" 时,九成是第 3 步群组还没生效,或资源共享给了别的地址。

## 第三步:看数据、拿行动清单(每天 1 分钟)

**做什么**:把两个数据源的数据拉成一份能读懂的报告,再让规则引擎把数据翻译成「接下来做什么」。

**怎么做**:

```bash
npx anvilwiki-ops metrics --days 28 --format md   # 数据报告
npx anvilwiki-ops insights                        # 行动清单
```

**你会看到**:metrics 输出点击、曝光、CTR、排名(按页、按搜索词)和访问量;insights 输出按严重度排序的建议,每条带证据和对应的处理技能(如「兑换码页 45 天没验证 → 走 anvil-update-codes 技能」)。

**确认做对了**:insights 至少给出一条你能看懂「现象—证据—动作」的建议;一条都没有说明数据窗口内确实没到阈值,也是正常结果。

## 第四步:把工具交给你的 AI(MCP,5 分钟)

**做什么**:在你的 AI 助手配置里登记这个工具,之后直接用自然语言指挥它。

**怎么做**:在 Claude / ZCode 等 MCP 客户端的配置文件里加:

```json
{
  "mcpServers": {
    "anvil-ops": { "command": "npx", "args": ["-y", "anvilwiki-ops", "mcp"] }
  }
}
```

然后对你的 AI 说(可直接复制):

> 用 anvil-ops 的 doctor 体检我的 wiki 站,然后拉最近 28 天 metrics,按 insights 清单把优先级最高的三件事做了:改标题描述的走内容技能,兑换码过期的走 anvil-update-codes。改完用 submit_pr 开 PR,把验证结果贴在 PR 描述里。

**你会看到**:AI 依次调用 `doctor` → `metrics` → `insights`,改文件,最后调用 `submit_pr` 并给你一个 PR 链接。

**确认做对了**:AI 的工具列表里出现 anvil-ops 的五个工具(doctor / metrics / audit / insights / submit_pr)。

## v2.0:一套工具管 N 个站

从第二个 wiki 开始,每个站注册一次,之后一条命令巡检全部:

```bash
npx anvilwiki-ops sites add anvil-wiki /path/to/anvil-wiki
npx anvilwiki-ops sites add forge-wiki /path/to/forge-wiki --url https://forge.example
npx anvilwiki-ops --all audit          # 全站巡检,一份报告(单站失败不中断)
npx anvilwiki-ops --site forge-wiki metrics
```

凭据永远不进注册表——各站 `.env` 留在各自仓库里,注册表只存名字和路径。`--all` 只作用于读命令(doctor / metrics / audit / insights);`submit` 刻意只支持单站:批量发布太危险,不该一键化。

`metrics` 报告末尾现在多了一节 **AI referrals**——来自 chatgpt.com、perplexity.ai、gemini.google.com、claude.ai 等的访问(走你的 Cloudflare 令牌)。GSC 的生成式 AI 报告没有 API,所以 `insights` 还会探测 AI Overviews 收录页(实验性),`metrics --import-aio <csv>` 可导入 GSC 界面导出的 CSV。这些数字看**趋势**就好——AI 浏览器经常剥掉 referrer,绝对值偏低。

## v2.0:关键词清单直接变草稿 PR(内容管道)

「从一份关键词清单铺 20 个页面」连终端都不用开:**Actions → Auto content PR → Run workflow**,粘进 CSV,管道会跑确定性生成器(`bulk-new-posts`)→ 全部八道质量门禁 → **只有全绿才开 draft PR**。之后在本地 AI 会话里把草稿填上真实游戏数据,再 merge。前置只需勾一个设置(Settings → Actions → "Allow GitHub Actions to create and approve pull requests"),完整契约见 [docs/content-pipeline.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/content-pipeline.md)。CI 里没有任何 AI key——workflow 只跑确定性脚本。

## 安全线:为什么它改不了你的线上站

工具的写操作只有一条路:**校验(check-content + check-i18n + 完整构建)→ 开新分支 → 提交 → 推送 → 开 PR**。校验不过就地终止,什么都不会提交;它没有直接 push main 的能力,合并按钮永远在你手里。把它想成「实习生把写好的合同放进待签篮,签不签你说了算」。

## 卡住了怎么办

- `gsc-access` FAIL:资源没共享给服务账号邮箱(第二步的第 3 小步)。
- `Cloudflare API returned 401/403`:令牌权限不对,重选「账户 → Analytics → 阅读」。
- `gh CLI not found`:装 GitHub CLI(submit 需要):https://cli.github.com/
- `No site config found` / site-config FAIL:你的仓库删过 `wrangler.toml`(学习手册「上线」一课的推荐做法,设置在 Cloudflare 网页)——在仓库根目录的 `.env` 里加一行 `SITE_URL=https://你的域名` 即可(需要 CF 数据就再加 `PUBLIC_CF_BEACON_TOKEN`)。**别**为了这个重建 wrangler.toml:文件一回来,你在网页上配的全部变量都会失效。
- `No uncommitted changes to submit`:工作区是干净的,AI 还没写任何东西,先让它产出内容。
- `npx anvilwiki-ops` 找不到包:需要 0.1.0 及以上版本(随模板 v1.15 发布;v2.0 搭载 1.0.0,含多站 + AI 引用)。
- 管道没开出 PR:Settings → Actions → General → 勾选 "Allow GitHub Actions to create and approve pull requests"。

## ✅ 验收(全部成立才算完成)

- ☐ doctor 结尾 `All checks passed.`(或明确知道哪项没配、为什么接受)
- ☐ `metrics --format md` 输出的是真实数字(不是零或报错)
- ☐ `insights` 的建议能对上你在 GSC 后台肉眼看到的问题
- ☐ (接了 MCP 的话)AI 能列出并调用 anvil-ops 的工具

## 开发手册到此完结

地图(架构)→ 栏目语言 → 功能开关 → CI 安全 → 同步回流 → AI 自动化运营,你对这套模板已是维护者级掌控。回到[学习手册「每周保鲜与增长」一课](/zh/landing/docs/weekly-ops)的每周节奏——只是现在,那 30 分钟里的大半可以让 AI 代劳了。
