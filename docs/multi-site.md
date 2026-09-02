# 多站运营:一套工具管 N 个 wiki(v2.0)

> 第二个站开始,「每个仓库各跑一遍命令」就成了负担。v2.0 的多站能力全部收敛在 `anvilwiki-ops` 1.0(CLI + MCP)里——**模板仓库本身保持「一仓一站」的纯净形态**,多站是工具层的事,不是模板层的事(见 PRD ADR-005)。

## 心智模型

```
~/.config/anvil-ops/sites.toml     ← 站点注册表(别名 → 本地仓库路径,永不存凭据)
        │
        ├── anvil-wiki   → /Users/you/sites/anvil-wiki     (凭据:该仓库 .env)
        ├── forge-wiki   → /Users/you/sites/forge-wiki     (凭据:该仓库 .env)
        └── ...

anvil-ops --site forge-wiki metrics    # 指定单站
anvil-ops --all audit                  # 全站巡检(逐站报告 + 汇总)
anvil-ops sites add/list/remove        # 管理注册表
```

三条设计决定(同类工具 Vercel/Netlify/Wrangler 的共识做法):

1. **默认行为不变**:在某个站点仓库目录里运行,自动发现该站的 `wrangler.toml`/`.env`——零注册、零心智负担。注册表只是「跨站批操作」的索引层。
2. **凭据永不进注册表**:GSC/CF 凭据始终在各站点仓库的 `.env` 里,注册表只存别名、路径、可选的 siteUrl 覆盖。
3. **`submit` 不支持 `--all`**:批量提交内容是危险操作,提交永远显式指定单站。

## 日常用法

```bash
# 注册站点(一次性)
anvil-ops sites add anvil-wiki /Users/you/sites/anvil-wiki
anvil-ops sites add forge-wiki /Users/you/sites/forge-wiki --url https://forge-wiki.example

# 周一例行:全站巡检(新鲜度 + i18n + 内容 + 内链,一站失败不中断)
anvil-ops --all audit

# 看某个站的流量
anvil-ops --site forge-wiki metrics --days 28

# MCP 场景:工具调用传 site 参数(默认取注册表 defaultSite)
```

MCP 侧:5 个工具(doctor/metrics/audit/insights/submit_pr)都接受可选 `site` 参数——这是 1.0.0 的唯一 breaking 变化(工具 schema 变更),老调用不传 `site` 时行为与 0.x 完全一致。

## AI 引用追踪(哪些 AI 在引用你的站)

2026 年的流量结构里,AI 助手(ChatGPT/Perplexity/Gemini/Claude)已是真实的流量与引用来源。`anvilwiki-ops` 1.0 用三条通道逼近「被引用」这件事:

| 通道 | 数据源 | 状态 |
|---|---|---|
| **AI referrals**(主通道) | Cloudflare Web Analytics 按 referrer host 分组(chatgpt.com / perplexity.ai / gemini.google.com / claude.ai / copilot.microsoft.com),`metrics` 输出末尾自动追加 | 稳定 |
| **AI Overviews 探测** | GSC API `searchAppearance=AI_OVERVIEWS` 过滤器,`insights` 里列出被 AIO 展示的页面 | 实验性(Google 未承诺该行为) |
| **gen-AI 报告导入** | GSC UI「Search Generative AI performance reports」导出 CSV → `anvil-ops metrics --import-aio <csv> [--save]` | 手工节奏(建议每月) |

> 为什么不全自动?GSC 的 gen-AI 报告**没有 API 通道**(2026-08 核实,官方仅 UI + CSV 导出,且只有 impressions 无 query 维度)。referral host 是站方唯一稳定的自动化信号;注意 AI 浏览器(ChatGPT Atlas/Perplexity Comet)会剥掉 referrer,计数系统性偏低——看趋势,不看绝对值。

## 新站的正确打开方式

第二个站依然是「复制仓库 + `pnpm template-audit` 健康检查 + `pnpm apply-template` 重 branding」(学习手册课 26「复制第二个站」),然后 `anvil-ops sites add` 把它纳入统一运营。多站没有魔法:**每个站仍是独立的 git 仓库 + 独立的 Cloudflare Pages 项目**,统一的只是观测层。
