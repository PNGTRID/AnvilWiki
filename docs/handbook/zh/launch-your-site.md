---
title: "复制模板,跑起你的站"
description: "把 AnvilWiki 模板 fork 到你的 GitHub、clone 到电脑、跑一条问答式命令把示例站换成你的游戏——30 分钟,浏览器里出现属于你的网站。"
manual: learn
order: 10
stage: "把站立起来"
icon: lucide:rocket
tldr: "四步:fork(把装修好的蛋糕店整店复制成你的)→ clone(搬回电脑)→ pnpm install(装齐零件)→ pnpm apply-template(一条问答命令把游戏名、主题色、栏目、语言全换成你的)。每步都有「你会看到什么」,最后浏览器打开 localhost:4321 验收。"
updated: 2026-08-17
---

## 你现在在哪,这章解决什么

上一课工具装齐了,游戏也选好了,现在你手上还什么都没有——这一课结束后,你的电脑里会有一整套网站文件,浏览器里能打开一个跑着的、印着你游戏名字的网站。

把这事想成开蛋糕店:AnvilWiki 模板是一家**已经装修好的蛋糕店**(货架、收银台、灯光全部齐备,还摆着一套样品蛋糕)。你要做的是把整店复制一份变成自己的,再把样品换成你的蛋糕。

## 这章做完你会得到

- 电脑里一个能跑的网站,浏览器打开 `http://localhost:4321` 就能看到
- 网站上是你游戏的名字、你选的主题色、你定的栏目

### 第 1 步:把模板仓库复制到你的 GitHub(fork)

**做什么**:把 AnvilWiki 整店复制一份到你名下。原店照常营业,你复制的这份随便改。
**怎么做**:登录 GitHub,打开 [github.com/PNGTRID/AnvilWiki](https://github.com/PNGTRID/AnvilWiki),点右上角 **Fork** 按钮,再点 **Create fork**。
**你会看到**:跳转到 `你的用户名/AnvilWiki` 仓库页面。
**确认做对了**:页面左上角的仓库名显示的是你的用户名,不是 PNGTRID。

### 第 2 步:把仓库搬到你的电脑(clone)

**做什么**:把你在 GitHub 的那份,整套下载到本地。
**怎么做**:在你的仓库页面点绿色 **Code** 按钮,复制地址;打开终端,依次输入(把 `<你的用户名>` 换成你的 GitHub 用户名):

```bash
git clone https://github.com/<你的用户名>/AnvilWiki.git
cd AnvilWiki
pnpm install
```

**你会看到**:`pnpm install` 跑十几秒到几分钟,滚动一堆包名,最后停住且没有红色 error。
**确认做对了**:终端输入 `ls` 回车,能看到 `package.json` 等一排文件。

### 第 3 步:本地跑起来看一眼

**做什么**:先看看这个「样品蛋糕店」长什么样。
**怎么做**:终端输入:

```bash
pnpm dev
```

**你会看到**:几行绿色的启动信息,里面有 `localhost:4321`。
**确认做对了**:浏览器打开 [localhost:4321](http://localhost:4321),看到一个虚构游戏「Anvil Quest」的攻略站——这就是你即将换掉的样子。看完回到终端按 `Control + C` 停掉它。

### 第 4 步:换成你的游戏(一条问答式命令)

**做什么**:把示例站的游戏名、颜色、栏目、语言全部换成你的。
**怎么做**:终端输入 `pnpm apply-template`,它会一个问题一个问题地问你,照下面的表回答(每题输入完按回车;不知道怎么填就直接回车用默认值):

| 它问什么 | 你填什么 | 为什么 |
|---|---|---|
| Full game name | 游戏的完整英文名,如 `Blade Ball` | 会用在网站标题和搜索结果里 |
| Short name | 直接回车(自动缩写) | 手机上显示的短名字 |
| Domain | 你的域名;没有域名就填 `你的用户名.pages.dev`(如 `xiaoming.pages.dev`,这个地址现在还不存在,部署后会自动生成) | 告诉网站「我的正式门牌是哪个」;以后买了域名改回来即可 |
| Hero tagline | 一句话卖点,如 `Your home for everything Blade Ball` | 首页大标题下面那行字 |
| Site description | 40 到 165 个字符的网站简介,带上游戏名 | Google 搜索结果里显示的说明文字 |
| Legal notice | 直接回车(默认) | 免责声明:非官方、和游戏厂商无关 |
| Official game URL | 游戏官网或商店页 | 网站元数据用 |
| Theme color | 一个 `#` 开头的六位色号,如 `#7c3aed` | 整站主色,命令会自动配好深浅两套 |
| Platform / Developer / Genre | 按实际填,不知道就回车 | 展示用 |
| Release date | 游戏发行日期,格式如 `2026-01-15`;不知道就回车留空 | 展示用 |
| Locales | 你要做几种语言。只做英文就回车(`en`);要中英就填 `en,zh`。**第一个是默认语言,且必须有 en** | 英文玩家搜索量最大,建议以英文为主 |
| Categories | 你网站的栏目,小写英文逗号分隔,如 `codes,guides,bosses`。常用:codes / guides / bosses / items / tier-list / characters | 顶栏导航按这个生成 |
| Clear demo content? | 回车(默认否) | 先留着示例文章当参考,上线前再清 |
| Homepage preset | 回车(选 1) | 1=兑换码型首页(多数人选),2=攻略型,3=保留示例 |
| Remove landing page? | 回车(默认是) | /landing 是 AnvilWiki 项目自己的介绍页,你的游戏站用不到,自动删掉 |

**你会看到**:命令逐个改写文件,每行前面一个绿色 ✅,最后提示完成。
**确认做对了**:终端输入 `pnpm check-config` 回车,显示「✅ Config is consistent」。

小提示:想先预览它会改什么再动手,可以先跑 `pnpm apply-template --dry-run`(只打印计划,不真改)。另外,GitHub 上还有个叫 **Initialize AnvilWiki** 的按钮(仓库 Actions 页),但它**只做收尾清理**,不会帮你换游戏名、换主题色、换语言——完整替换只能用本地的这条命令。

### 第 5 步:换上你的图标(2 分钟,强烈建议)

**做什么**:把浏览器标签页和手机主屏上的「铁砧图标」换成你游戏的图标。上一步的命令能改所有文字,但图标是图片文件,机器没法替你画——不换的话,你的站顶着模板示例的图标上线。
**怎么做**:打开 [favicon.io/favicon-converter](https://favicon.io/favicon-converter/) → 上传一张你游戏的图(正方形最好)→ 点生成并下载 → 解压后把里面的图标文件**全部拖进项目的 `public/` 文件夹覆盖同名文件**(favicon.ico、favicon-16x16.png、favicon-32x32.png、favicon.svg、apple-touch-icon.png、android-chrome-192x192.png、android-chrome-512x512.png)。顺手把 `public/images/` 里的 hero.webp / hero.svg(首页大图)也换成你的图。不追求自定义图案的话,模板自带的 `pnpm gen-assets` 命令会用你的主题色一键生成全套图标和首页大图,更省事。
**你会看到**:刷新 localhost:4321,标签页图标变成你的图。
**确认做对了**:`public/` 里不再有铁砧图;手机「添加到主屏幕」后图标也是你的。

### 第 6 步:亲眼验收你的站

**做什么**:确认店招牌真的换了。
**怎么做**:终端输入 `pnpm dev`,浏览器打开 [localhost:4321](http://localhost:4321)。
**你会看到**:首页是你游戏的名字和主题色,导航栏是你选的栏目。
**确认做对了**,逐项检查:

- ☐ 首页标题是你的游戏(不再是 Anvil Quest)
- ☐ 主色是你选的颜色(不再是橙色)
- ☐ 标签页图标是你的游戏(不再是铁砧,见第 5 步)
- ☐ 导航只有你选的栏目
- ☐ 手机宽度下也正常(浏览器按 F12,再点设备图标切换手机视图)

看完 `Control + C` 停掉。

## 卡住了怎么办

- **`pnpm install` 或 build 报一堆红色**:先看**最后一行**写了什么,90% 的答案在最后一行;实在看不懂,把红色部分整段复制,丢给 AI 助手问「这个报错怎么修」。
- **localhost:4321 打不开**:确认终端里 `pnpm dev` 还在跑着(窗口没关、没按 Control + C);地址别打成 https。
- **apply-template 中途填错了**:按 `Control + C` 取消,重新跑一遍,它会用新答案覆盖。
- **「重开终端后命令都报 not a git repository」**:关过终端再打开,电脑回到了你的用户主目录——先输 `cd AnvilWiki` 回到网站文件夹,再继续操作。

## ✅ 验收(全部成立才算完成)

- 命令:`pnpm check-config` 显示 ✅,`pnpm build` 跑完最后一行没有红色 error
- 页面:localhost:4321 上,游戏名、主题色、栏目、**标签页图标**都是你的
- ☐ 域名一栏填了什么,你自己记得(没有域名就先用了 pages.dev 占位,买好域名后回来改)

## 下一步

店装修好了,但货架还是示例商品。下一课是全手册最精彩的部分:让 AI 一天写出 10 篇能通过质检的攻略。[去让 AI 帮你写 10 篇攻略](/zh/landing/docs/first-10-pages)
