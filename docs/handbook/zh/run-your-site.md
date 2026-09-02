---
title: "把站跑起来:三步看到属于你的网站"
description: "fork 把模板复制到你名下、clone 搬回电脑装齐零件、pnpm dev 在浏览器打开示例站——三步每步带「你会看到什么」,终点是 localhost:4321 上一个跑着的完整攻略站。"
manual: learn
order: 10
stage: "把站立起来"
icon: lucide:rocket
tldr: "三步:①fork——在 GitHub 上点 Fork,把模板整店复制到你名下(原店照常营业,你这份随便改);②clone+pnpm install——把仓库搬回电脑,一条命令装齐网站零件;③pnpm dev——浏览器打开 localhost:4321,看到虚构游戏 Anvil Quest 的示例站。这一课先不换皮,先让样品站完整跑起来,确认环境没问题。"
updated: 2026-09-02
---

## 先看一个真实场景

AnvilWiki 模板是一家**已经装修好的蛋糕店**:货架、收银台、灯光全部齐备,还摆着一整套样品蛋糕(虚构游戏「Anvil Quest」的攻略站)。开自己的店分两步:先把整店复制一份变成你的,再把样品换成你的蛋糕。这一课做第一步——**复制,并且让它转起来**;换招牌是下一课的事。

## 本课做完你会拿到

- 你名下的一份完整网站代码(GitHub 上一份 + 电脑里一份)
- 浏览器里一个跑着的网站:`http://localhost:4321` 能看到示例攻略站

### 第 1 步:把模板复制到你名下(fork)

**做什么**:把 AnvilWiki 整店复制一份到你名下。原店照常营业,你复制的这份随便改。
**怎么做**:登录 GitHub,打开 [github.com/PNGTRID/AnvilWiki](https://github.com/PNGTRID/AnvilWiki),点右上角 **Fork**,再点 **Create fork**。
**你会看到**:跳转到 `你的用户名/AnvilWiki` 仓库页面。
**确认做对了**:页面左上角的仓库名是你的用户名,不是 PNGTRID。

### 第 2 步:把仓库搬回电脑(clone + 装零件)

**做什么**:把你名下这份代码整套下载到电脑,并装齐网站运行需要的零件。
**怎么做**:在你的仓库页面点绿色 **Code** 按钮,复制地址;打开终端,依次输入(`<你的用户名>` 换成你的 GitHub 用户名):

```bash
git clone https://github.com/<你的用户名>/AnvilWiki.git
cd AnvilWiki
pnpm install
```

**你会看到**:`pnpm install` 跑十几秒到几分钟,滚动一堆包名,最后停住且没有红色 error。
**确认做对了**:终端输入 `ls` 回车,能看到 `package.json` 等一排文件。

### 第 3 步:让店转起来,看一眼样品

**做什么**:把网站在本地跑起来,亲眼看看模板的样子。
**怎么做**:终端输入:

```bash
pnpm dev
```

**你会看到**:几行绿色启动信息,里面有 `localhost:4321`。
**确认做对了**:浏览器打开 [localhost:4321](http://localhost:4321),看到一个虚构游戏「Anvil Quest」的攻略站——这就是你下一课要换掉的样子。看完回到终端按 `Control + C` 停掉它(下一课再启动)。

## 三个经典错误(提前替你踩)

- **localhost:4321 打不开**:九成是 `pnpm dev` 已经停了(窗口关了或按过 Control+C)——回终端重新跑;另外地址别打成 `https://`,本地没有证书。
- **重开终端后命令全报 not a git repository**:重开终端后电脑回到了你的用户主目录,不在网站文件夹里——先输 `cd AnvilWiki` 再继续。
- **`pnpm install` 报一堆红色**:看**最后一行**写了什么,90% 的答案在最后一行;看不懂就把红色整段复制丢给 AI,问「这个报错怎么修」。

## 本课新词(就 3 个)

- **fork**:在 GitHub 上把别人的仓库复制一份到你名下。原仓库不受影响。
- **clone**:把你名下的仓库整套下载到电脑。fork 在云端,clone 在本地。
- **dev server**:本地开发服务器——`pnpm dev` 启动后,浏览器才能访问 localhost:4321;它开着,网站就活着。

## ✅ 验收(全部成立才算完成)

- ☐ `你的用户名/AnvilWiki` 存在,是你名下的仓库
- ☐ `ls` 能看到 `package.json`
- ☐ localhost:4321 打开过示例站,看完已用 `Control + C` 停掉

## 下一课

样品转起来了,但招牌还是别人的。下一课一条问答命令,把游戏名、主题色、栏目、语言全部换成你的。[去第 11 课 · 换成你的游戏](/zh/landing/docs/rebrand-your-site)
