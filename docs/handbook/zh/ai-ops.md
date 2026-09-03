---
title: "让 AI 替你运营:GSC 数据接入、metrics 与 MCP"
description: "GSC API 五分钟接入(Google 群组中转授权)与 CF 令牌写进 .env 后,doctor 体检、metrics 拉 28 天真实数据、insights 出带证据的行动清单,MCP 接入后自然语言指挥 AI 运营——写操作只走 PR,合并权在你。"
manual: dev
order: 7
icon: lucide:bot
shortTitle: "AI 运营与 GSC 接入"
tldr: "anvilwiki-ops(npm 包,npx 免安装)把每周运营循环交给 AI:doctor 一次体检看配置缺什么;GSC 服务账号(经 Google 群组中转授权)和 CF token 写进 .env 后,metrics 拉 28 天真实数据,insights 按严重度出带证据的行动清单;MCP 接入后对 AI 说人话即可——五个工具 doctor/metrics/audit/insights/submit_pr,写操作只走校验→分支→PR 一条路,合并权在你。"
updated: 2026-09-03
---

## 你现在在哪,这章解决什么

[学习手册「每周 30 分钟」一课](/zh/landing/docs/weekly-ops)的节奏很好,但那 30 分钟的大半是「跑命令、看数字、抄清单」——恰好是 AI 最擅长的事。这一课把运营循环交给 AI:你说「看看网站最近怎么样」,它拉数据、给建议、改内容、开 PR;你只按最后的「合并」。

先弄懂两个词:**CLI**(终端命令程序,这个包的命令叫 `anvil-ops`,`npx` 免安装运行);**MCP**(让 AI 助手直接调用外部工具的开放协议,接上后 AI 自己调能力,不用你转述命令)。

## 第一步:体检(2 分钟)

仓库根目录运行:

```bash
npx anvilwiki-ops doctor
```

**你会看到**:一行一项——`site-config`(读到 wrangler.toml 的 SITE_URL)、`gh`(GitHub CLI 在不在)、`gsc-config`/`cf-config`(数据凭据配没配)。没配不算失败,只提示「metrics 将以降级模式运行」并附上接入教程链接。
**确认做对了**:结尾 `All checks passed.`,或你明确知道哪项没配并接受。

## 第二步:GSC API 接入(5 分钟)+ CF Web Analytics(2 分钟)

GSC 提供搜索词和排名,Cloudflare Web Analytics(模板已内置埋点)提供访问量。

**先懂一个概念(30 秒)**:GSC 数据是隐私数据,API 只认授权身份。给机器人授权用「服务账号」——它**不是邮箱**:不能收信、没有密码,只是 Google 生成的一串「机器人编号」(长得像 `xxx@项目名.iam.gserviceaccount.com`),钥匙是一个 JSON 密钥文件。

**GSC(一次性)**:

1. **造机器人**:Google Cloud 控制台(与 GSC 同账号)→ 新建项目 → 启用 `Google Search Console API` → IAM 和管理 → 服务账号 → 创建 → 「密钥」标签 → 添加密钥 → JSON → 浏览器自动下载的 .json 就是钥匙,存好
2. **建转发群组(必须,别跳过)**:GSC 加用户只认真人账号,机器人编号直接填会报「无效电子邮件」。解法:groups.google.com 建群组 → 开启「允许外部成员」→ 成员里**直接粘贴**机器人编号(JSON 里 `client_email` 那串)——不要用「邀请」,机器人不会点链接
3. **授权**:Search Console → 设置 → 用户和权限 → 添加用户 → 填**群组邮箱**(不是机器人编号!)→ 权限「受限」。新群组可能要几分钟到几小时才生效,报「未指明的错误」就等等重试
4. **配钥匙路径**:仓库根目录 `.env`(已在 .gitignore)写 `GSC_SERVICE_ACCOUNT_JSON=钥匙文件路径`

**CF(一次性)**:Cloudflare → 我的资料 → API 令牌 → 创建,权限选**账户 → Analytics → 阅读**;`.env` 加 `CF_API_TOKEN=令牌` 和 `CF_ACCOUNT_ID=账户ID`。

**你会看到**:再跑 doctor,`gsc-config`/`gsc-access` 变绿。

## 第三步:看数据、拿行动清单(每天 1 分钟)

```bash
npx anvilwiki-ops metrics --days 28 --format md   # 数据报告
npx anvilwiki-ops insights                        # 行动清单
```

**你会看到**:metrics 输出点击/曝光/CTR/排名(按页、按词)和访问量;insights 按严重度排建议,每条带证据和对应技能(如「兑换码页 45 天没验证 → 走 anvil-update-codes」)。
**确认做对了**:insights 至少一条你能看懂「现象—证据—动作」;一条没有说明数据窗口内没到阈值,也正常。

## 第四步:把工具交给 AI(MCP,5 分钟)

AI 助手的 MCP 配置里加:

```json
{
  "mcpServers": {
    "anvil-ops": { "command": "npx", "args": ["-y", "anvilwiki-ops", "mcp"] }
  }
}
```

然后直接说(可复制):

> 用 anvil-ops 的 doctor 体检我的 wiki 站,然后拉最近 28 天 metrics,按 insights 清单把优先级最高的三件事做了:改标题描述的走内容技能,兑换码过期的走 anvil-update-codes。改完用 submit_pr 开 PR,把验证结果贴在 PR 描述里。

**你会看到**:AI 依次调 doctor → metrics → insights,改文件,最后 submit_pr 给你 PR 链接。
**确认做对了**:AI 的工具列表出现五个工具(doctor / metrics / audit / insights / submit_pr)。

## 安全线:为什么它改不了你的线上站

写操作只有一条路:**校验(check-content + check-i18n + 完整构建)→ 开新分支 → 提交 → 推送 → 开 PR**。校验不过就地终止;它没有直接 push main 的能力,合并按钮永远在你手里——「实习生把合同放进待签篮,签不签你说了算」。

## 卡住了怎么办

- `gsc-access` FAIL:资源没共享给服务账号(第二步第 3 小步),或群组还没生效。
- `Cloudflare API returned 401/403`:令牌权限不对,重选「账户 → Analytics → 阅读」。
- `gh CLI not found`:装 GitHub CLI(submit 需要):https://cli.github.com/
- `No site config found`:仓库删过 wrangler.toml(上线课的推荐做法)——`.env` 加一行 `SITE_URL=https://你的域名` 即可。**别**为此重建 wrangler.toml:文件一回来,网页上配的变量全部失效。
- `No uncommitted changes to submit`:工作区干净,AI 还没写东西,先让它产出内容。

## ✅ 验收(全部成立才算完成)

- ☐ doctor 结尾 `All checks passed.`(或明确接受哪项没配)
- ☐ `metrics --format md` 输出真实数字(不是零或报错)
- ☐ insights 的建议能对上 GSC 里肉眼看到的问题
- ☐ (接了 MCP)AI 能列出并调用 anvil-ops 的工具

## 下一课

单人循环自动化了,批量呢?下一课:关键词清单直接变草稿 PR 的内容管道。[内容管道](/zh/landing/docs/content-pipeline)
