---
title: "加栏目与加语言"
description: "两个最常见定制需求的分步操作:加导航栏目(三处一致,配 AI 提示词)、加一种语言(脚手架生成骨架 + 界面翻译与文章翻译提示词)。查询手册,按需翻。"
manual: dev
order: 2
icon: lucide:folder-tree
tldr: "加栏目=配置、语言 JSON、内容目录三处同时一致(跑 pnpm check-config 把关),一段提示词让 AI 全部代劳;加语言=先跑 pnpm new-locale 生成骨架,再让 AI 对照英文 JSON 逐条翻译界面、逐篇翻译文章(兑换码本体永远不译)。语言切换器只显示真的有内容的语言。"
updated: 2026-08-17
---

## 你现在在哪,这章解决什么

店开起来之后你迟早会想:加个「武器」栏目、上个日语版。这章把这两件事各写成一个固定套路,照着做就不会错。**查询手册:需要哪件翻哪节。**

## 需求一:加一个导航栏目(如「武器」)

栏目的规矩你在架构章见过:**三处一致,缺一不可**。以加 `weapons` 为例:

```bash
# 1. 内容目录(先建目录,再放第一篇文章)
mkdir -p src/content/wiki/en/weapons

# 2. 配置:src/config/navigation.ts 里按现有条目的样子加
#    { key: 'weapons', icon: 'lucide:sword' }

# 3. 语言:src/locales/en.json 里加 nav.weapons(导航文字)
#    和 overview.weapons(列表页标题和简介)
```

然后 `pnpm check-config`(查三处一致)+ `pnpm build`(查格式)。其他语言的 JSON 也要加同样的 key(不加不会坏——界面会自动显示英文兜底——但 `pnpm check-i18n` 会列出来提醒你)。

让 AI 代劳(整段复制,改 `weapons` 为你的栏目名):

```text
给站点新增分类 weapons(武器)。三处一致地改:
1. src/config/navigation.ts 加 { key: 'weapons', icon: 'lucide:sword' }(按现有条目风格)
2. src/locales/en.json 加 nav.weapons 和 overview.weapons(按现有分类的文案风格)
3. src/content/wiki/en/weapons/ 建一篇骨架文章(frontmatter 合规,draft: true)
已有语言的其他 JSON 同步加 key。写完运行 pnpm check-config && pnpm build,全绿才算完成。
```

## 需求二:加一种语言(以日语为例)

语言的三处一致:语言列表配置 = 语言 JSON 文件 = 内容目录。

```bash
# 第 1 步:跑脚手架(会问你要语言代码,如 ja),生成 JSON 骨架和内容目录
pnpm new-locale
```

第 2 步,让 AI 把界面文字翻译掉(整段复制):

```text
我已用 pnpm new-locale 新增 <语言代码>。请翻译该语言文件:
对照 src/locales/en.json 逐 key 翻译 src/locales/<语言代码>.json,
不新增不删除 key;分类 key 与 navigation.ts 保持一致。
运行 pnpm check-config && pnpm check-i18n 验证,全绿才算完成。
```

第 3 步,翻译文章(一篇一篇来):

```text
把 src/content/wiki/en/<category>/<slug>.mdx 翻译为 <目标语言>,
写入 src/content/wiki/<目标语言>/ 同路径。规则:只译 title/description/summary/正文;
slug、日期、内链路径、codes 的 code 字段不动;tags 无对应词则保留英文;
先列术语表保证全文一致。完成后运行
pnpm check-content && pnpm build && pnpm check-i18n,全绿才算完成。
```

注意:兑换码本体(code 字段)永远不翻译,它是全球通用的字母数字。

**语言切换器只显示真的有内容的语言**——日语一篇都没写时,切换器不会出现日语,这防的是「点了进空白页」。

## 卡住了怎么办

- **「check-config 报栏目不一致」**:它输出的提示会写明哪三处对不上,对着补齐即可。
- **「新语言的文章翻译完 build 挂了」**:九成是登记卡里某字段格式在翻译时被改坏(日期多了个句号之类),看 build 报错的具体文件行。

## ✅ 验收(按你做的需求勾选)

- ☐ 加栏目:`pnpm check-config && pnpm build` 全绿,新栏目出现在导航且列表非空
- ☐ 加语言:`pnpm check-i18n` 无缺项,语言切换器出现新语言

## 下一步

栏目和语言之外的其他定制——换主题色、改首页文案、给文章加新字段——在[学习手册「主题与门面」一课](/zh/landing/docs/theme-and-homepage)。
