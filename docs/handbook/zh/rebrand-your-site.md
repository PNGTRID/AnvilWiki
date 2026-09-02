---
title: "换成你的游戏:一条命令,一轮问答"
description: "pnpm apply-template 一条问答式命令:游戏名、域名、主题色、多语言、栏目逐题替换,自动清理 demo 残留。附完整 15 题对照表、换图标两分钟支线和亲眼验收清单。"
manual: learn
order: 11
stage: "把站立起来"
icon: lucide:paintbrush
tldr: "终端跑 pnpm apply-template,它一题一题问、你照表回答(不知道就回车用默认):游戏全名/短名/域名/标语/简介/主题色/语言/栏目等 15 题。跑完 pnpm check-config 显示 ✅、pnpm build 无红色,localhost:4321 上游戏名、主题色、栏目全是你的。最后换图标:pnpm gen-assets 一键生成,或 favicon.io 上传自制。想先预览改动,加 --dry-run。"
updated: 2026-09-02
---

## 先看一个真实场景

店复制好了,但招牌写着别人家的名字。这一课一条命令完成换牌:`pnpm apply-template` 会像银行柜台一样一题一题问你,你逐题回答,它替你改好所有配置文件——**你不需要手动打开任何一个配置文件**。

## 本课做完你会拿到

- 一整个属于你的站:游戏名、主题色、栏目、语言、图标全是你的
- `pnpm check-config` 显示 ✅ 的配置一致性确认

### 第 1 步:跑换皮命令,照表回答

终端输入 `pnpm apply-template`,它一题一题问,每题答完按回车;**不知道怎么填就回车用默认值**:

| 它问什么 | 你填什么 | 为什么 |
|---|---|---|
| Full game name | 游戏完整英文名,如 `Blade Ball` | 用在网站标题和搜索结果里 |
| Short name | 直接回车(自动缩写) | 手机上显示的短名字 |
| Domain | 有域名填域名;没有就填 `你的用户名.pages.dev`(地址现在还不存在,部署后自动生成) | 告诉网站「正式门牌是哪个」;以后买域名改回来即可 |
| Hero tagline | 一句话卖点,如 `Your home for everything Blade Ball` | 首页大标题下面那行字 |
| Site description | 40-165 字符的网站简介,带上游戏名 | Google 搜索结果里显示的说明 |
| Legal notice | 直接回车(默认) | 免责声明:非官方、与厂商无关 |
| Official game URL | 游戏官网或商店页 | 网站元数据用 |
| Theme color | `#` 开头六位色号,如 `#7c3aed` | 整站主色,自动配好亮暗两套 |
| Platform / Developer / Genre | 按实际填,不知道就回车 | 展示用 |
| Release date | 发行日期如 `2026-01-15`;不知道回车留空 | 展示用 |
| Locales | 要几种语言。只做英文回车(`en`);中英填 `en,zh`。**第一个是默认语言,且必须有 en** | 英文搜索量最大,建议英文为主 |
| Categories | 站点栏目,小写逗号分隔,如 `codes,guides,bosses`。常用:codes / guides / bosses / items / tier-list / characters | 顶栏导航按这个生成 |
| Clear demo content? | 回车(默认否) | 先留示例文章当参考,上线前再清 |
| Homepage preset | 回车(选 1) | 1=兑换码型首页(多数人),2=攻略型,3=保留示例 |
| Remove landing page? | 回车(默认是) | /landing 是模板项目自己的介绍页,你的游戏站用不到,自动删 |

**你会看到**:命令逐个改写文件,每行前面一个绿色 ✅,最后提示完成。
**确认做对了**:终端输入 `pnpm check-config`,显示「✅ Config is consistent」。

> 两个小提示:想先预览会改什么,先跑 `pnpm apply-template --dry-run`(只打印计划不真改);GitHub Actions 页那个 **Initialize AnvilWiki** 按钮**只做收尾清理**,不会帮你换游戏名、颜色、语言——完整换皮只有本地这条命令。

### 第 2 步:换上你的图标(2 分钟,强烈建议)

上一步能改所有文字,但**图标是图片,机器没法替你画**——不换,你的站就顶着模板的铁砧图标上线。两条路任选:

- **省事**:终端跑 `pnpm gen-assets`,它按你的主题色一键生成全套图标和首页大图。
- **要自定义**:打开 [favicon.io/favicon-converter](https://favicon.io/favicon-converter/) → 上传一张你游戏的正方形图 → 生成下载 → 解压后把图标文件**全部拖进 `public/` 覆盖同名文件**;顺手把 `public/images/` 里的 hero.webp(首页大图)也换成你的。

**你会看到**:刷新 localhost:4321,标签页图标变成你的图。

### 第 3 步:亲眼验收

`pnpm dev` 启动,浏览器打开 [localhost:4321](http://localhost:4321),逐项检查:

- ☐ 首页标题是你的游戏(不再是 Anvil Quest)
- ☐ 主色是你选的颜色(不再是橙色)
- ☐ 标签页图标是你的(不再是铁砧)
- ☐ 导航只有你选的栏目
- ☐ 手机宽度下正常(F12 → 点设备图标切手机视图)

再跑一次 `pnpm build`,最后一行没有红色 error,这一课才算完。

## 三个经典错误(提前替你踩)

- **中途填错了**:按 `Control + C` 取消,重新跑一遍——它会用新答案覆盖,不会坏档。
- **check-config 亮红**:九成是栏目在配置、语言文件、内容目录三处不一致——红字会精确指出哪一处,照着改即可,不用猜。
- **跳过图标直接上线**:文字全换了、图标还是铁砧,玩家一眼看出「套壳站」。两分钟的事,别省。

## 本课新词(就 3 个)

- **换皮(rebrand)**:把模板的示例身份换成你的游戏——这一课的全部内容。
- **占位域名**:还没买的域名先填的临时门牌(`用户名.pages.dev`),部署后自动生效,以后可换。
- **验收**:对照清单亲眼确认,而不是「大概没问题」。

> **进阶**:非交互模式(`--answers answers.json`,适合批量开站或让 AI 代跑)、重跑安全规则、字段含义逐条详解,见仓库参考文档 [docs/apply-template.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/apply-template.md)。

## ✅ 验收(全部成立才算完成)

- ☐ `pnpm check-config` 显示 ✅,`pnpm build` 无红色 error
- ☐ localhost:4321 上,游戏名、主题色、栏目、图标全是你的
- ☐ 域名一栏填了什么你自己记得(没域名就用 pages.dev 占位,买好回来改)

## 下一课

店是你的了,但门面还想再顺一眼?下一课讲换色的规矩(8 行变量为什么一起换)和首页文案的正确改法——不想深究也可以直接跳去内容生产。[去第 12 课 · 主题与门面](/zh/landing/docs/theme-and-homepage)
