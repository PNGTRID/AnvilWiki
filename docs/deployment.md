# 部署指南

> 把 AnvilWiki 部署到 Cloudflare Pages，全程免费、零配置、无限带宽。
>
> 预计耗时：首次 10 分钟，熟练后 3 分钟。

---

## 前提条件

- 一个 [GitHub](https://github.com) 账号（免费）
- 一个 [Cloudflare](https://cloudflare.com) 账号（免费）
- 本地已安装 Node.js 22+ 和 pnpm
- 已经 fork 了 AnvilWiki 仓库并改好了配置层（见 [apply-template.md](./apply-template.md)）

> 还没 fork？看 [快速开始](../README.md#5-分钟快速开始)。

---

> 🚨 **一个站只允许一个部署源——一个 git 仓库 + 一个部署入口。** 不要在两个目录（包括两个 AI 会话各开的目录）里同时开发同一个站再各自部署：它们会共用同一个 Cloudflare Pages 项目，**谁后部署谁覆盖线上**，另一边的修复和文章会静默消失（真实事故：上线当天部分文章 404、已修复的问题在线上复发）。其他任何副本一律只读参考、绝不部署；有产出先并回唯一仓库再继续。

## 方式一：Cloudflare Pages Git 自动部署（推荐新手）

这是最简单的方式——连一下 GitHub 仓库，之后每次 `git push` 自动构建部署。

### Step 1 — 推代码到 GitHub

```bash
# 在项目根目录
git init
git add .
git commit -m "Initial commit: AnvilWiki site"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<你的仓库>.git
git push -u origin main
```

> 如果你 fork 的仓库，remote 已经配好了，直接 `git push`。

### Step 2 — 在 Cloudflare 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单选 **Workers & Pages**
3. 点 **Create** → **Pages** → **Connect to Git**
4. 授权 Cloudflare 访问你的 GitHub（首次需要）
5. 选中你的 AnvilWiki 仓库
6. 点 **Begin setup**

### Step 3 — 配置构建

Cloudflare 会自动检测 Astro，但请确认以下设置：

| 字段                       | 值                                  |
| -------------------------- | ----------------------------------- |
| **Project name**           | 你的站点名（如 `anvil-quest-wiki`） |
| **Production branch**      | `main`                              |
| **Framework preset**       | `Astro`（自动识别）                 |
| **Build command**          | `pnpm build`                        |
| **Build output directory** | `dist`                              |
| **Root directory**         | `/`（留空）                         |

展开 **Environment variables (advanced)**，添加：

| 变量名                    | 值                            | 说明                                   |
| ------------------------- | ----------------------------- | -------------------------------------- |
| `NODE_VERSION`            | `22`                          | 确保 Node 版本（pnpm 11 需要 ≥22.13）  |
| `SITE_URL`                | `https://<project>.pages.dev` | **先用临时域名**，必须含 `https://` 前缀 |
| `PUBLIC_ADSENSE_CLIENT`    | （你的 AdSense Publisher ID） | 可选，留空则不显示广告                 |

> ⚠️ **`SITE_URL` 必须含 `https://` 前缀**（如 `https://your-domain.wiki`，不是裸域名 `your-domain.wiki`）。Astro 把它当 URL 解析，裸域名会让 build 报 `Invalid url`。它影响 sitemap、og:image、robots.txt 里所有绝对 URL 的生成。

#### wrangler.toml 接管警告

> 🚨 **重要：`wrangler.toml` 会接管 env 配置。** 本仓库根目录有 `wrangler.toml`，里面声明了 `[vars]` 段。**当 wrangler.toml 存在时，Cloudflare dashboard 的 Environment variables 会被完全忽略**（[官方文档](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)）。所以你有两个选择：
>
> - **选项 A（推荐新手）：删掉 `wrangler.toml`**，然后 dashboard 的 Environment variables 就能正常工作。fork 后 `git rm wrangler.toml && git commit`，再在 dashboard 配 env 即可。
> - **选项 B（保留 wrangler.toml）：改 `wrangler.toml` 的 `[vars]` 值**，把 `SITE_URL`、`PUBLIC_GISCUS_*`、`PUBLIC_GA_ID` 与要启用的 `PUBLIC_ADSTERRA_SLOT_*` 改成你自己的，dashboard 不用配（配了也被忽略）。
>
> 如果你在 dashboard 配了 env 但 build 时拿不到（症状：组件不渲染、`process.env` 读不到），99% 是踩了这个坑。诊断方法：在 `astro.config.ts` 顶部加一行 `console.log('ENV:', Object.keys(process.env).filter(k => k.startsWith('PUBLIC_')))`，push 后看 build 日志。

### Step 4 — 部署

点 **Save and Deploy**。Cloudflare 会：

1. 拉取你的代码
2. 运行 `pnpm install` + `pnpm build`
3. 把 `dist/` 部署到全球 CDN

构建日志里看到 `Complete!` 就成功了（页数随内容增长，不用纠结具体数字）。整个过程 2-3 分钟。

### Step 5 — 访问站点

部署完成后，你会拿到一个 `https://<project>.pages.dev` 的地址，打开就能看到你的站点了。

---

## 绑定自定义域名

免费赠送的 `*.pages.dev` 域名可以一直用，但为了 SEO 和品牌，建议绑自定义域名。

**顺序铁律：先绑域名 → 再改 SITE_URL（`wrangler.toml` 的 `[vars]`）→ 再部署。** 顺序反了的后果：谷歌先收录 `*.pages.dev` 临时域名，等正式域名生效要重新等收录，返工一天（即下文 Step 3 的警告，把顺序定对可以整段避开）。

### Step 1 — 买域名

推荐平台（按价格/易用度）：

| 平台                                                        | 后缀推荐         | 价格       |
| ----------------------------------------------------------- | ---------------- | ---------- |
| [Spaceship](https://spaceship.com)                          | `.wiki` / `.com` | ~十几元/年 |
| [Cloudflare Registrar](https://dash.cloudflare.com/domains) | `.com` / `.net`  | 成本价     |
| [Namecheap](https://namecheap.com)                          | `.xyz` / `.com`  | ~十几元/年 |

> 游戏 wiki 站首选 `.wiki` 后缀——便宜、相关性高、SEO 友好。

### Step 2 — 在 Cloudflare 配域名

1. 进入你的 Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入你的域名（如 `your-domain.wiki`）
3. Cloudflare 会给你一条 **CNAME 记录**：
   ```
   类型:  CNAME
   名称:  @（或 www）
   值:    <project>.pages.dev
   ```
4. 去你的域名注册商后台，把这条 CNAME 加上
5. 等 DNS 生效（几分钟到几小时）

### Step 3 — 更新 SITE_URL 并重新部署

DNS 生效后，改 `SITE_URL` 为你的真实域名。**根据你部署时的选择**：

- **如果删了 `wrangler.toml`**：去 Cloudflare Pages → **Settings** → **Environment variables**，把 `SITE_URL` 改成 `https://your-domain.wiki`。
- **如果保留了 `wrangler.toml`**：改 `wrangler.toml` 里 `[vars]` 的 `SITE_URL`，commit + push。

```
SITE_URL=https://your-domain.wiki
```

然后触发一次重新部署（push 一个空 commit，或在 dashboard 点 **Retry deployment**）。

> ⚠️ 这一步必做——否则 sitemap 里的 URL 还是 `*.pages.dev`，影响 SEO。

### Step 4 — HTTPS 自动生效

Cloudflare 会自动签发 Let's Encrypt SSL 证书。DNS 生效后等 5-15 分钟，`https://` 就能访问了。期间浏览器报证书错误（CN=`*.pages.dev`）是正常的，证书变 **Active** 后就好。

### Step 5 — 收编旧的 `*.pages.dev` 域名（绑完域名必做）

绑完自定义域后，Cloudflare 不会自动停掉 `*.pages.dev`——它仍然 200 直接出内容，和主域并行同内容。Google 会把主域判成「重复页」，**canonical 继续留在老的 pages.dev 上**：收录、排名、点击全都不迁移（GSC「网址检查」里能看到判定 "Duplicate, Google chose different canonical than user"，Google 选定的 canonical 是 pages.dev 地址）。

`public/_redirects` 解决不了这个问题——它对所有域名生效，会把主域也带进无限重定向。官方做法是用 **Bulk Redirects**（账户级配置，不碰站点代码）：

1. Cloudflare dashboard 左侧栏 → **Bulk Redirects** → 创建一个**批量重定向列表**
2. 添加条目：
   - **源 URL**：`https://<project>.pages.dev`
   - **目标 URL**：`https://your-domain.wiki`
   - **状态**：`301`
   - **四个参数全开**：Preserve query string / Subpath matching / Preserve path suffix / Include subdomains（路径和查询串原样带到主域）
3. 回到 Bulk Redirects 主页再创建一条 **Bulk Redirect Rule** 引用该列表 → **保存并部署**

验证（期望都返回 301 + 主域地址）：

```bash
curl -sI https://<project>.pages.dev/ | grep -i location
# location: https://your-domain.wiki/
curl -sI "https://<project>.pages.dev/bosses/x/?a=1" | grep -i location
# location: https://your-domain.wiki/bosses/x/?a=1
```

> Include subdomains 会把 preview 部署的随机子域也 301 到主域；CI 测试不走 Cloudflare preview 的话没有影响。
> 旧地址的收录收敛需要几天到两周（Google 顺着 301 重新归并），之后 GSC 网址检查里的 canonical 应显示主域。

---

## 方式二：Wrangler CLI 部署（进阶）

适合不想连 GitHub、或想在 CI/CD 里控制部署的场景。

### 前提

```bash
# 安装 Wrangler（Cloudflare 的 CLI）
pnpm add -g wrangler

# 登录
wrangler login
```

### 部署

```bash
# 先构建
pnpm build

# 部署到 Pages
wrangler pages deploy dist --project-name=<你的项目名>
```

首次会问你是否创建项目，选 yes。之后每次部署就一行命令。

---

## 方式三：导出静态文件到其他平台

AnvilWiki 是纯静态站点（`dist/`），可以部署到任何静态托管：

| 平台             | 配置                                      | 免费额度     |
| ---------------- | ----------------------------------------- | ------------ |
| **Netlify**      | Build: `pnpm build`，Publish: `dist`      | 100GB/月带宽 |
| **Vercel**       | 自动识别 Astro                            | 100GB/月带宽 |
| **GitHub Pages** | 需配 `base`                               | 100GB/月带宽 |
| **自建 VPS**     | `scp -r dist/ user@vps:/var/www/` + nginx | 看你的 VPS   |

> ⚠️ 只有 Cloudflare Pages 是**无限带宽**。其他平台超量后要么限速要么收费。这也是 AnvilWiki 默认推荐 Cloudflare 的原因。

---

## 环境变量清单

> ⚠️ **先读 [wrangler.toml 接管警告](#wranglertoml-接管警告)**：如果你保留了 `wrangler.toml`（方案 A/B），下表所有变量必须写进它的 `[vars]` 段——此时在 Pages → Settings → **Environment variables** 里配置是**无效的**（dashboard 会被完全忽略）。删掉 `wrangler.toml`（方案 C）才用 dashboard 配置。

Dashboard（方案 C）在 Pages → **Settings** → **Environment variables** 配置。支持 Production / Preview 两套。

| 变量                        | 必填 | 说明                                                   |
| --------------------------- | ---- | ------------------------------------------------------ |
| `SITE_URL`                  | ✅   | 站点绝对 URL（含 `https://`，无尾斜杠），影响 sitemap/og:image/robots |
| `INDEXNOW_KEY`              | 可选 | IndexNow 所有权 key；配置后构建输出 `/<key>.txt`，并可启用 GitHub Actions 自动推送 |
| `NODE_VERSION`              | ✅   | 固定 `22`（pnpm 11 要求 ≥22.13）                       |
| `PUBLIC_ADSENSE_CLIENT`      | 可选 | AdSense Publisher ID（`ca-pub-XXXXXXXXXXXXXXXX`）      |
| `PUBLIC_ADSENSE_SLOT_STICKY` | 可选 | Sticky 粘顶横幅 slot ID                                |
| `PUBLIC_ADSENSE_SLOT_SIDEBAR`| 可选 | Sidebar 桌面端侧边栏 slot ID                           |
| `PUBLIC_ADSENSE_SLOT_INCONTENT` | 可选 | InContent 文章内 slot ID                            |
| `PUBLIC_ADSTERRA_SLOT_INCONTENT_728X90` | 可选 | Adsterra 728×90 横幅（移动端隐藏）                     |
| `PUBLIC_ADSTERRA_SLOT_NATIVE_BANNER`    | 可选 | Adsterra 响应式 Native                                 |
| `PUBLIC_ADSTERRA_SLOT_STICKY_320X50`    | 可选 | Adsterra 文章页底部锚位（`MobileAnchorAd`）            |
| `PUBLIC_ADSTERRA_SLOT_SIDEBAR_160X300`  | 可选 | Adsterra 160×300 竖幅（手册课页粘性）                  |
| `PUBLIC_ADSTERRA_SLOT_SIDEBAR_160X600`  | 可选 | Adsterra 160×600 竖幅（≥1700px 视口页边固定）          |
| `PUBLIC_ADSTERRA_SLOT_SIDEBAR_300X250`  | 可选 | Adsterra 300×250（示例单元，模板未挂载）               |
| `PUBLIC_GA_ID`              | 可选 | Google Analytics ID（有 cookie，经同意横幅门控）       |
| `PUBLIC_CF_BEACON_TOKEN`    | 可选 | Cloudflare Web Analytics beacon token（无 cookie）     |
| `PUBLIC_GSC_VERIFICATION`   | 可选 | Google Search Console 验证 meta token                 |
| `PUBLIC_SPONSOR_URL`        | 可选 | 赞助/捐赠卡链接（空 = 不渲染）                         |
| `PUBLIC_SPONSOR_IMAGE_URL`  | 可选 | 赞助卡二维码/横幅图（空 = 只显示文字卡）               |
| `PUBLIC_GISCUS_REPO`        | 可选 | Giscus 仓库（`owner/repo`，4 个必填项之一）            |
| `PUBLIC_GISCUS_REPO_ID`     | 可选 | Giscus 仓库 ID（4 个必填项之一）                       |
| `PUBLIC_GISCUS_CATEGORY`    | 可选 | Giscus Discussion 分类名（4 个必填项之一）             |
| `PUBLIC_GISCUS_CATEGORY_ID` | 可选 | Giscus 分类 ID（4 个必填项之一）                       |
| `PUBLIC_GISCUS_MAPPING`     | 可选 | Giscus 页面映射方式，默认 `pathname`（唯一可选项）     |

完整说明见 [`.env.example`](../.env.example)。所有广告/评论变量**留空时对应组件不渲染**——新手可以先不配广告把站上线，后续再加。

---

## 部署后验证清单

部署成功后，逐项检查：

```bash
# 1. 站点可访问
curl -I https://<你的域名>/
# 期望: HTTP/2 200

# 2. sitemap 可访问
curl https://<你的域名>/sitemap-index.xml
# 期望: 返回 XML，含你的所有页面 URL

# 3. robots.txt 可访问
curl https://<你的域名>/robots.txt
# 期望: 含 Sitemap: https://<你的域名>/sitemap-index.xml

# 4. 多语言页面可访问
curl -I https://<你的域名>/ja/   # 日文首页
curl -I https://<你的域名>/bosses/  # 英文列表页

# 5. 文章页正常
curl -I https://<你的域名>/bosses/emberfang
# 期望: 200，不是 404

# 6. 法律页可访问
curl -I https://<你的域名>/about
curl -I https://<你的域名>/privacy-policy/
```

### SEO 验证

1. **Google Rich Results Test**：https://search.google.com/test/rich-results
   - 输入你的首页 URL，验证 Organization + WebSite + FAQPage 结构化数据有效
   - 输入一篇文章 URL，验证 Article + BreadcrumbList 有效

2. **Google Search Console**：
   - 添加你的域名（选"网域"方式 → DNS 验证）
   - 提交 `sitemap-index.xml`
   - 等 24-48 小时看收录情况

3. **主动推送收录**：
   - **Cloudflare Crawler Hints**：Cloudflare 控制台 → 你的域名 → Caching → Crawler Hints 打开（免费，一行配置，让 Cloudflare 主动告诉谷歌你的内容更新了）
   - **IndexNow 自动推送（可选）**：推荐配置一次 `INDEXNOW_KEY`，之后每次 `main` 的 push CI 成功后由独立 workflow 等生产 key 文件上线，再读取**生产 sitemap**批量通知 IndexNow。未配置时完全不运行；`pnpm submit-indexnow` 仍保留作手工补推。

#### IndexNow：推荐的一次性配置

模板原本已经提供 `pnpm submit-indexnow` 手工命令。现在推荐把 key 配成环境变量，让所有 fork 都能用同一套「构建所有权文件 → 部署完成 → 自动推生产 sitemap」流程，而不用把每个站的随机 key 文件提交进模板。

1. **生成一个站点自己的 key**（生成一次后长期复用，不要每次部署旋转）：

   ```bash
   openssl rand -hex 16
   ```

   IndexNow key 允许 8–128 位 `A-Z / a-z / 0-9 / -`。上面的命令只是生成一个符合规则的 32 位十六进制值。

2. **把同一个 `INDEXNOW_KEY` 交给 Cloudflare 生产构建**：
   - 保留 `wrangler.toml`：在 `[vars]` 中取消 `#INDEXNOW_KEY = ""` 的注释并填值。
   - 已删除 `wrangler.toml`：在 Cloudflare Pages → Settings → Variables and Secrets 中新增 `INDEXNOW_KEY`。

   `pnpm build` 的 postbuild 会据此生成 `dist/<key>.txt`，所以生产站会出现 `https://你的域名/<key>.txt`。空值时不生成任何文件。

   在 Cloudflare Pages 的 Git 构建里，同一步还会利用平台提供的 `CF_PAGES_COMMIT_SHA` 生成 `dist/.well-known/anvilwiki-deploy.txt`。这个小文件不进 sitemap，只用于让 GitHub Actions 判断**当前 commit 是否真的已经部署**；否则 key 文件早就存在时，自动任务可能在新部署完成前误读旧 sitemap。

3. **在 GitHub 仓库配置 Actions Variables**（Settings → Secrets and variables → Actions → Variables）：

   ```text
   SITE_URL=https://你的域名
   INDEXNOW_KEY=与 Cloudflare 完全相同的值
   ```

   这里故意用 Repository **Variables** 而不是把 key 写死进 workflow；每个 fork 都有自己的站点域名和 key。

4. 以后 `main` 的 push 通过 CI 后，`.github/workflows/indexnow.yml` 会自动：
   - 确认这是成功的 main push（PR CI 不推送）；
   - 等待生产站 `/.well-known/anvilwiki-deploy.txt` 变成当前 Git commit，再校验 `/<key>.txt`，不会误读上一次部署；
   - 从生产域名读取 sitemap，只提交已经真正上线的生产 URL；
   - 对 429 / 5xx 做短暂重试。
   
   IndexNow 是变更通知，不等于保证抓取或收录；Google Search Console / sitemap 仍是独立链路。

需要手工检查而不发送请求：

```bash
pnpm build
INDEXNOW_KEY=你的key pnpm submit-indexnow -- --dry-run
```

需要手工补推已经上线的生产站：

```bash
INDEXNOW_KEY=你的key pnpm submit-indexnow -- --site https://你的域名 --wait-for-key
```

旧站如果已经有合法的 `public/<key>.txt`，手工命令仍会兼容读取；迁移到环境变量后无需再新增第二个 key。

### 性能验证

1. **PageSpeed Insights**：https://pagespeed.web.dev
   - 输入你的域名，Lighthouse Performance 应该 ≥ 95
   - Core Web Vitals 全绿（LCP < 2.5s，CLS < 0.1）

---

## 上线后的数据复盘（3-7 天）

上线不是终点。**上线后观察 3-7 天，做第一次数据复盘**，对着下面的数值表逐项检查。数据来源：GSC「效果」报告（CTR、点击）；Cloudflare Web Analytics（变量 `PUBLIC_CF_BEACON_TOKEN`，无 cookie）或 GA4（浏览深度）。

| 指标 | 及格线 / 目标 | 去哪看 | 不及格怎么办 |
| --- | --- | --- | --- |
| CTR（点击率） | ≥ 2% 算合格 | GSC 效果报告 | 低于 2%：检查 TDH（title、description、H1 三个标签）和标题吸引力——标题含不含"游戏名 + 关键词"、有没有让人想点进去的钩子 |
| 每日点击 | 1000 次/天是目标 | GSC 效果报告 | 新站从个位数涨起是正常的；复盘看的不是绝对值，是趋势——持续在涨就对，连续一周不动才需要动作（补页面/换词） |
| 人均浏览页数 | ≥ 1.5 页 | CF Web Analytics / GA4 | < 1.5 页 = 内链不够：每篇文章至少 3 条站内链接（不足则补，指向相关文章，codes 页 ↔ 攻略页互指） |
| 每周新增内页 | 10+ 篇 | 自己数 | **只加不改旧页**——新增页面是给 Google 的增量信号，复盘期别顺手大改已收录的页面 |

> 用了 [anvilwiki-ops](./multi-site.md) 的话，一条命令拉数：`anvil-ops metrics`（聚合 GSC + Cloudflare Web Analytics）。GSC 数据走 API，需要一次性配服务账号（含 Google 群组中转授权的坑），五分钟步骤见开发手册[《AI 运营与 GSC 接入》](./handbook/zh/ai-ops.md)；注意区分——上面第 2 步的 GSC **站点验证**（HTML 文件）只是给 Google 证明站权，配不配 API 互不影响。

---

## 用 Microsoft Clarity 看用户在你站点上干什么（免费）

数字告诉你"有多少人来了"，**Clarity 告诉你"他们在页面上干了什么"**——免费的点击热力图 + 用户操作录屏。新手最有用的两个问题它都能答：用户**卡在哪**、**广告位有没有被点**。

### 接入（10 分钟）

1. 打开 [clarity.microsoft.com](https://clarity.microsoft.com) → 用微软账号登录（完全免费）
2. 点 **Add project**（添加网站）→ 填你的域名 → 项目名随意
3. 安装方式选 **Manual install（手动安装）**，拿到一段 `<script>` 跟踪代码（内含你的项目 ID）
4. 打开你仓库里的 `src/components/layout/BaseLayout.astro`，把跟踪代码粘贴到 `</head>` 结束标签之前（文件里搜 `</head>`，就在 `Optional analytics` 注释区块下方）→ commit + push 触发重新部署
5. 回 Clarity 后台等几分钟，项目状态变为 Receiving data（正在接收数据）就接好了

> 两个说明：① Clarity 脚本是异步加载的轻量脚本，对 Lighthouse 分数影响可忽略；模板默认不预装它（模板的开箱契约是零第三方脚本），装不装由你决定。② 如果你照[下方常见问题](#q-我想加-content-security-policycsp)配过 CSP，`script-src` 需放行 `www.clarity.ms`，`connect-src` 放行 `c.clarity.ms`。

### 新手怎么看（每天 5 分钟）

- **热力图（Heatmaps）**：给任意页面开一张热力图，红色 = 点击最密集。看两件事：① 用户是不是点在你的核心内容上（兑换码表格、复制按钮）；② **广告位有没有被点**——广告位常年冷清就是位置/样式有问题，该挪位置就挪。
- **录屏（Recordings）**：挑 5-10 段真实用户的操作录屏，看用户**卡在哪**——在哪一屏滚走了、是不是没找到想找的内容。反复出现的卡点，就是你下一个要优化的页面。

---

## 常见问题

### Q: 构建失败，报 `Cannot find module 'astro:content'`

A: Cloudflare Pages 的 Node 版本可能不对。确认环境变量 `NODE_VERSION=22` 已配。

### Q: 构建失败，报 `ERR_PNPM_IGNORED_BUILDS`

A: pnpm 版本太新，需要 `pnpm-workspace.yaml` 里的 `allowBuilds` 配置（仓库已自带）。确认文件存在：

```bash
cat pnpm-workspace.yaml
# 应该看到:
# allowBuilds:
#   esbuild: true
#   sharp: true
```

### Q: 部署成功但页面 404

A: 检查 Cloudflare 的 **Build output directory** 是不是 `dist`（不是 `public` 或 `.next`）。

### Q: 图片不显示 / og:image 抓不到

A: og:image 必须是**绝对路径**。确认：

1. `SITE_URL` 环境变量已配为最终域名
2. `public/images/hero.webp`（或你的封面图）确实存在且不是 0 字节占位文件
3. 用 `curl` 检查：`curl -I https://<你的域名>/images/hero.webp` 应返回 200

### Q: sitemap 里的 URL 还是 `*.pages.dev` 而不是自定义域名

A: `SITE_URL` 环境变量没更新或没重新部署。改完后必须触发一次新部署。

### Q: 日文页面显示英文 fallback

A: 这是设计行为，不是 bug。参见 [PRD §9.3](./PRD.md#93-文章-fallback-机制)：单篇文章缺失时自动回退英文，保证 URL 不 404；列表页不回退（该语言没内容就显示空状态）。

### Q: 我想加 Content-Security-Policy（CSP）

A: 模板默认不带 CSP（`public/_headers` 里已有 COOP/nosniff/XFO/Referrer-Policy 四条基础头）。如果自建 CSP，注意模板有**内联脚本**（防 FOUC 主题初始化、主题切换、搜索、AdSense/giscus 按需加载），`script-src` 需要 `'unsafe-inline'`（或逐脚本 hash）；开启广告还要放行 `pagead2.googlesyndication.com` 系域名，开启评论放行 `giscus.app`，开启 GA 放行 `googletagmanager.com`。一个可用起点（在 `public/_headers` 按路径追加，改完重新部署并逐项验证主题切换/搜索/评论/广告）：

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' pagead2.googlesyndication.com static.cloudflareinsights.com www.googletagmanager.com giscus.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: i.ytimg.com pagead2.googlesyndication.com; frame-src youtube-nocookie.com giscus.app; connect-src 'self' cloudflareinsights.com region1.google-analytics.com;
```

---

## 下一步

- [套用模板指南](./apply-template.md)：把 demo 站换成真实游戏
- [内容格式](./content-format.md)：怎么写 MDX 文章
- 回到 [README](../README.md)
