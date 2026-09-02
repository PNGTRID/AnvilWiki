---
title: "网站上线:搬上免费货架"
description: "把网站推上 GitHub、连上 Cloudflare 免费货架拿到全世界能访问的网址,处理新手大坑(设置认谁),以及买域名并绑定的完整支线。全程免费。"
manual: learn
order: 18
stage: "上线与收录"
icon: lucide:cloud
tldr: "三步上架:git push 把文件推上 GitHub;Cloudflare Pages 连接仓库点几下,两三分钟后拿到免费网址;然后删掉 wrangler.toml(网站的设置有两个登记处,文件在网页设置就无效——新手删文件,以后只用网页)。最后附买域名绑定的完整支线,AdSense 赚钱前必须买。"
updated: 2026-08-17
---

## 你现在在哪,这章解决什么

10 篇内容躺在你的电脑里——但玩家访问不到。就像你印好了一本书,还没放上任何书店的货架。

这一课把书上架:先放到 GitHub,再连上 Cloudflare 的免费货架(不花钱、流量几乎无限),你会拿到一个全世界都能打开的网址。

## 这章做完你会得到

- 一个全世界都能访问的网址(先免费域名,之后可换自己的)
- 网站的「设置登记处」理清楚了,以后开广告不再踩坑

## 先认识几个词

- **部署**:把网站文件放到大家都能访问的服务器上。这里用的是 Cloudflare Pages,免费。
- **域名**:网站的门牌号,如 `你的游戏-wiki.com`。先用免费门牌,赚钱前换正式的。

### 第 1 步:把文件推上 GitHub

**做什么**:你电脑里的网站文件,要让 Cloudflare 能拿到,得先放到 GitHub。
**怎么做**:终端(在 AnvilWiki 文件夹里)依次输入:

```bash
git add .
git commit -m "我的游戏 wiki 第一版"
git push
```

**你会看到**:第一次 push 会弹出 GitHub 登录窗口,登录你的账号,然后终端显示上传进度。
**确认做对了**:刷新你的 GitHub 仓库网页,能看到 `docs`、`src` 这些文件夹。

### 第 2 步:连接 Cloudflare 货架

**做什么**:告诉 Cloudflare「我的仓库在这,每次我更新,你自动重新上架」。
**怎么做**:

1. 注册/登录 [dash.cloudflare.com](https://dash.cloudflare.com)(免费)。
2. 左侧选 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
3. 授权 GitHub,选中你的 AnvilWiki 仓库,点 **Begin setup**。
4. 构建设置照抄:

| 它问什么 | 你填什么 |
|---|---|
| Project name | 随意,比如你的游戏名(它会成为网址的一部分) |
| Production branch | `main` |
| Framework preset | Astro(一般会自动识别) |
| Build command | `pnpm build` |
| Build output directory | `dist` |

5. 在 **Environment variables** 区添加一个变量:名字 `NODE_VERSION`,值 `22`。
6. 点 **Save and Deploy**。

**你会看到**:构建进度跑 2 到 3 分钟,最后出现一个 `https://项目名.pages.dev` 网址。
**确认做对了**:点开那个网址,看到你的游戏站——从现在起,全世界都能访问它。

### 第 3 步:处理一个新手大坑(设置认谁的问题)

**做什么**:删掉一个叫 `wrangler.toml` 的文件。原因一句话:网站的设置有两个登记处——仓库里的这个文件,和 Cloudflare 网页上的设置页。**文件还在,网页设置就全部无效**。新手直接删文件,以后只用网页,清爽不踩坑。
**怎么做**:终端输入:

```bash
git rm wrangler.toml
git commit -m "remove wrangler.toml"
git push
```

**你会看到**:GitHub 仓库文件列表里,`wrangler.toml` 消失了;Cloudflare 自动重新部署一次。
**确认做对了**:Cloudflare → 你的项目 → **Settings** → **Variables and Secrets**,能看到 `NODE_VERSION = 22`(第 2 步加的,文件删掉后它才真正生效)。以后开广告、统计,都在这个页面加变量。

> 进阶者备注:想保留这个文件、把设置记在仓库里也可以,但 `NODE_VERSION = "22"` 等所有变量就必须写进文件的 `[vars]` 段,网页设置照样无效——细节见开发手册「功能开关」章。新手别碰,删文件就好。

### 第 4 步:买自己的域名(可以先跳过,赚钱前需要)

**做什么**:把 `项目名.pages.dev` 换成自己的门牌。**AdSense 广告审核基本要求自有域名**,所以赚钱前必须买(一年几十块)。
**怎么做**:在 [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)(按成本价卖,不赚差价)或 [Porkbun](https://porkbun.com) 等注册商搜一个 `.com` / `.wiki` 域名买下;然后 Cloudflare Pages → 你的项目 → **Custom domains** → Set up,按提示把域名指过来(DNS 在 Cloudflare 管的话全程点下一步)。
**你会看到**:几分钟后(最长几小时),你的域名打开就是你的站。
**确认做对了**:用自己的域名能打开网站后,把跑站那一课配置里的 Domain 和 Cloudflare 的 `SITE_URL` 变量都改成这个域名(`https://` 开头,不能少),重新部署。

## 卡住了怎么办

- **「Cloudflare 构建失败」**:点进那次部署看日志最后一行。九成是这两类:环境变量没配好(回第 2 步查 NODE_VERSION),或 `SITE_URL` 没带 `https://`。
- **「我在 Cloudflare 网页改了设置却没生效」**:回忆第 3 步——`wrangler.toml` 删了吗?它在,网页设置就无效。
- **「域名打开了但样式乱了/图挂了」**:九成是 `SITE_URL` 还没改成新域名。改成 `https://你的域名` 再部署。
- **「第一次 git push 弹的登录窗口关掉了」**:再 push 一次,它会再弹。

## ✅ 验收(全部成立才算完成)

- 你的网址,手机流量(不用 WiFi 也行)能打开,页面正常
- `wrangler.toml` 已删除,以后所有设置都在 Cloudflare 网页加
- ☐ 有域名的:`SITE_URL` 已改成 `https://你的域名`

## 下一步

站上线了,但 Google 还不知道你存在——下一课让它开始收录你,这是流量的起点。[去收录那一课 · 让 Google 认识你](/zh/landing/docs/get-on-google)
