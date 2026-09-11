# 评论系统（Giscus）

AnvilWiki 内置可选的评论系统，基于 [Giscus](https://giscus.app) —— 评论通过 GitHub 登录后存到你的仓库的 **GitHub Discussions** 里。零服务器、零数据库，构建时静态，评论运行时按需加载。

**默认关闭。** 不配置时文章页不显示评论区，模板保持 Lighthouse 4×100。填好 4 个必填环境变量（`PUBLIC_GISCUS_REPO` / `REPO_ID` / `CATEGORY` / `CATEGORY_ID`，`MAPPING` 有默认值）后自动启用。

---

## 前置条件

1. 一个 **public** GitHub 仓库（可以是你的 wiki 源码仓库本身，也可以是专门建一个评论仓库）
2. 该仓库开启 Discussions：Settings → General → Features → 勾选 Discussions
3. 安装 [giscus app](https://github.com/apps/giscus) 到该仓库

## 配置步骤

1. 打开 https://giscus.app
2. 在「Configuration」区填你的仓库名（如 `yourname/your-wiki`）
3. 页面会自动生成一串配置，记下这 5 个值：
   - `data-repo` → `PUBLIC_GISCUS_REPO`
   - `data-repo-id` → `PUBLIC_GISCUS_REPO_ID`
   - `data-category` → `PUBLIC_GISCUS_CATEGORY`
   - `data-category-id` → `PUBLIC_GISCUS_CATEGORY_ID`
   - `mapping` → `PUBLIC_GISCUS_MAPPING`（默认 `pathname`，通常不用改）
4. 把这 5 个值填到 `.env`（参考 `.env.example`）—— 本地开发用
5. **生产部署**：把这 5 个值配到 Cloudflare。⚠️ 本仓库根目录有 `wrangler.toml`，它一旦存在就会**接管 env 配置，dashboard 的 Environment variables 会被忽略**。两个选择：
   - **删掉 `wrangler.toml`**（`git rm wrangler.toml && git commit`），然后在 Cloudflare dashboard 的 Settings → Environment variables 配 5 个变量
   - **或改 `wrangler.toml` 的 `[vars]`**，把 `PUBLIC_GISCUS_*` 5 个值改成你的
6. `pnpm dev`，访问任意文章页，评论区出现在正文下方

## 验证

访问 `http://localhost:4321/bosses/emberfang`（或你的任一文章页）。正文 + 标签下方应出现评论区。点「Sign in with GitHub」登录后可发表评论。

## 多语言行为

不同 locale 的同一篇文章是**独立的**评论区：

| URL | 评论区 |
|---|---|
| `/bosses/emberfang`（英文） | Discussion A |
| `/ja/bosses/emberfang`（日文） | Discussion B（与 A 互不影响） |

这是 `mapping=pathname` 的自然结果，符合「日文用户用日文讨论、英文用户用英文讨论」的预期。Giscus 的界面语言（按钮、提示）会自动跟随页面 locale（en/ja）。

## 暗色模式

评论区会**自动跟随**你站点的暗色模式切换，无需任何配置。主题切换器 toggle `.dark` class 时，评论区通过 postMessage 实时同步主题。

## 关闭评论

把 `.env` 里的 5 个 `PUBLIC_GISCUS_*` 字段留空（或删除）即可。`Comments` 组件会 `return null`，文章页不渲染评论区，零 JS 加载。

## 轻量留言 / 反馈 / 在线沟通备选

Giscus 是「评论」(需要 GitHub 登录),不是「留言板」或「客服窗口」。想让**不碰 GitHub 的普通访客**也能留一句话、提个反馈、或找到你,有这些轻量路子——都走「一段嵌入脚本」模式,选型时守住本模板的开箱契约:**env 门控、不配即不渲染、零 JS 时不拖累 Lighthouse 4×100**(参照 `Comments` 组件的做法:把脚本挂在 `BaseLayout.astro` 末尾或文章页,外层包一个「env 有值才渲染」的判断,别硬编码)。

| 组件 | 一句话定位 | 接入成本 | 注意 |
|---|---|---|---|
| [Waline](https://waline.js.org)([Twikoo](https://twikoo.js.org) 同类) | 匿名可留言的轻量评论/留言板,CJK 社区主流,支持邮件通知 | 需部署一个 serverless 后端(Vercel/云函数)+ 数据库,再贴一段脚本 | 有后端才有匿名留言——多一个要维护的服务;隐私合规自己把好关 |
| [Tally](https://tally.so) / Google Forms 嵌入 | 反馈表单(不是评论区):收集「这页有错/求补充」类一句话反馈 | Tally 免费档建表单后复制嵌入脚本;Google Forms 用 iframe 嵌入 | 表单数据存在第三方,别在表单里收敏感信息;Google Forms 样式定制弱 |
| [Crisp](https://crisp.chat)(同类: Tawk.to) | 在线客服挂件:访客右下角开窗实时聊 | 注册后复制一行 script,免费档够个人站 | 实时聊天意味着你要在线;挂件 JS 有常驻成本,移动端注意不挡内容 |
| [Remark42](https://remark42.com) | 自托管、隐私优先的轻量评论,无追踪 | 需要自己跑一个服务(Docker),成本高于上面所有选项 | 适合已有服务器的人;纯 Cloudflare Pages 用户不建议为此引入服务器 |

> **勿选提醒**:Cusdis 曾是本类需求的标准答案,但**已于 2026-07 归档弃维护**(仓库只读,无安全补丁)——旧教程还在推荐它,别接。

选型原则重申:本模板**不内置**任何此类组件(保持开箱零第三方 JS);接哪个都建议学 `Comments` 组件的 env 门控模式——不配置 = 零加载,Lighthouse 分数不还债。

## 常见问题

**评论不显示？** 逐项检查：
- 仓库是否 public？（private 仓库 Giscus 无法访问）
- Discussions 是否开启？（Settings → General → Features）
- giscus app 是否安装到该仓库？
- 4 个必填字段是否都填了？（任一为空 = 组件不渲染）
- `data-category-id` 是否对？（不是 category 名字，是那串 `DIC_...` 开头的 ID）
- **🚨 配了 env 但构建时读不到？** 检查仓库根目录有没有 `wrangler.toml`。有的话它接管 env，dashboard 配的会被忽略。要么删 `wrangler.toml`，要么改它的 `[vars]` 段。详见 [docs/deployment.md](./deployment.md)。

**登录后页面卡住？** 确认你没有用 ad-blocker 拦截 `giscus.app` 域名。某些隐私扩展（uBlock Origin、Privacy Badger）会误拦 Giscus 的 OAuth 回调。

**改了文章 URL，评论丢了？** pathname mapping 下，URL 变了会创建新的 Discussion。旧评论仍在你的仓库 Discussions 里，可手动找回。建议文章 URL 一旦发布不要改动。

---

## 进一步阅读

- [Giscus 官方文档](https://giscus.app)
- 手册「第三方集成速查」课有全部 env 门控组件的总表:[中文](./handbook/zh/integrations.md) / [English](./handbook/en/integrations.md)
- [设计决策](https://github.com/PNGTRID/AnvilWiki/commits/main/)(设计过程见 git 历史)（为什么选 Giscus 不选 Utterances、为什么用官方 script 不用静态 iframe）
