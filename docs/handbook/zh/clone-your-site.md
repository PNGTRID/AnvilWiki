---
title: "复制第二个站:30 分钟标准流程"
description: "先跑 pnpm template-audit 把健康度清到无 ❌,沉淀换皮清单;之后每复制一个站四步:复制仓库→apply-template 换配置→换内容层→build 验证上线。代码层一行不改,wrangler.toml 是最大的坑。"
manual: learn
order: 26
stage: "变现与长期经营"
icon: lucide:copy-check
tldr: "放大路径:一个站吃一个游戏的热词,十个站吃十个。复制前先 pnpm template-audit(❌=代码层混入游戏字符串/分类不一致,必须修;⚠️=demo 残留,视情况),让 AI 生成换皮清单存 docs/rebrand-checklist.md。标准四步:复制仓库(5 分钟)→pnpm apply-template 换配置(10 分钟)→产首批内容(10 分钟)→build 验证+提交 GSC(5 分钟)。⚠️ wrangler.toml 存在时接管 Cloudflare 后台 env——新站不改它的 [vars],会一直用旧站的域名和评论区。"
updated: 2026-09-02
---

## 先看一个真实场景

每周节奏稳定转起来,第一个站已经是「会自己保鲜的店」。放大路径很自然:**一个站吃一个游戏的热词,十个站吃十个**。但直接把仓库复制一份会发生什么?第一个游戏的域名、站点名、兑换码文章、封面图全被带过去——第二个站从第一天起穿着旧衣服,而且你说不清哪些该换。这一课把「复制一个站」变成 30 分钟标准流程,不是一次考古。

三层分离是整件事的地基:

| 层 | 是什么 | 换新游戏时 |
|---|---|---|
| **代码层** `src/pages`、`src/components`、`src/lib` | 承重墙和水电 | **一行不改** |
| **配置层** `src/config`、`src/locales`、主题色、`public/` | 墙面颜色和门牌 | 每游戏改一次(apply-template 代劳) |
| **内容层** `src/content/wiki/`、封面图 | 家具和货物 | 完全替换 |

### 第 1 步:跑模板健康检查(2 分钟)

```bash
pnpm template-audit
```

**你会看到**:四组检查——代码层纯净度/配置层完整度/内容层可替换性/换皮残留——最后一行总分如「模板健康度:8/11」。
**确认做对了**:❌ 数量为 0。⚠️ 是提醒不是错误,逐条问自己「复制下一个站时要不要带上它」。

### 第 2 步:修复与沉淀换皮清单

❌ 必须修:代码层混入游戏字符串(搬到配置层或内容层)、分类三处不一致(照报错对齐 navigation.ts、语言 JSON、内容目录)。修完让 AI 生成换皮清单:

```text
基于当前仓库生成「换皮清单」文档(只读不改,输出为 markdown):
1. 配置层逐文件列出含游戏信息的字段:site.ts / navigation.ts / globals.css 主题色 / routing.ts / src/locales/*.json / manifest.json,每项写清「复制新站时改成什么」
2. 内容层列出需完全替换的目录:src/content/wiki/、src/assets/covers/、public/images/
3. wrangler.toml [vars] 列出必改项(SITE_URL、PUBLIC_GISCUS_*),并提醒:该文件存在时 Cloudflare 后台的 env 配置会被忽略
4. 单独列出「本站私有资产」:我为这个游戏加过的自定义改动(如果找得到)
保存为 docs/rebrand-checklist.md。
```

这份清单的价值:半年后复制第五个站时,不用回忆任何细节,照单执行。

### 第 3 步:复制第二个站的四步流程

1. **复制仓库**(5 分钟):GitHub 上把你的仓库复制一份(duplicate 或 use this template),新仓库连一个新的 Cloudflare Pages 项目
2. **换配置层**(10 分钟):新仓库里跑 `pnpm apply-template`,换站名、域名、主题色、语言、分类,清空旧内容
3. **换内容层**(10 分钟):按产页流水线产出第一批文章;想批量铺,直接进下一课
4. **验证上线**(5 分钟):`pnpm build` 绿了就部署,新站提交流程回收录那一课

> ⚠️ 最大的坑:**wrangler.toml 存在时,它接管 Cloudflare 后台的环境变量**。复制新站后要么改它的 `[vars]`,要么删掉它改用后台配置——忘了这一步,新站会一直用旧站的域名和评论区(评论区显示第一个站的讨论,八成就是它)。

## 三个经典错误(提前替你踩)

- **不做体检直接复制**:旧游戏的残留全带过去,回头清理比从头还慢。
- **apply-template 后 build 挂了**:九成是分类三处不一致,`pnpm check-config` 精确定位。
- **第二个站用了第一个站的 GISCUS 配置**:评论区串门——照换皮清单把 `PUBLIC_GISCUS_*` 四项换成新仓库的。

## 本课新词(就 3 个)

- **template-audit**:模板健康度体检,❌ 必修、⚠️ 视情况——复制前的必过关卡。
- **换皮清单**:「复制新站必改什么」的文档,你的复制流水线说明书。
- **三层分离**:代码/配置/内容各归其位——复制十个站也只有这三层的事。

## ✅ 验收(全部成立才算完成)

- ☐ `pnpm template-audit` 无 ❌
- ☐ 换皮清单已生成并保存(`docs/rebrand-checklist.md`)
- ☐ 第二个站走完四步,`pnpm build` 全绿,代码层一行没改

## 下一课

新站开张,拿什么填?下一课:从一份关键词清单出发,批量铺出几十个流量入口。[去第 27 课 · 批量铺页](/zh/landing/docs/batch-pages)
