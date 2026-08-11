# 广告接入指南

> 用 Adsterra 给游戏 wiki 站接广告变现。新手上线 2-3 天后排名稳定即可接入。

---

## 为什么选 Adsterra

| 平台 | 审核速度 | 适合场景 |
|---|---|---|
| **Adsterra** | 1-3 分钟 | ✅ 新站即变现，吃满 2-3 个月流量周期 |
| Google AdSense | 1-3 个月（新域名） | 长期补充，挂着慢慢审 |

游戏站流量周期约 2 个月，AdSense 审核比流量周期还长——所以主力靠 Adsterra，AdSense 上站时顺手申请挂着排队。

---

## 接入流程

### Step 1 — 注册 Adsterra

1. 打开 https://publishers.adsterra.com/ → 注册 → 邮箱验证
2. 登录后进入 https://beta.publishers.adsterra.com/websites
3. **Add Website** → 输入你的域名 → 选分类 **Games** → 选广告格式 → ADD

> **每个站单独申请一套 key**——后台能按站看展示/点击/收入，数据不混。

### Step 2 — 等审核（1-3 分钟）

审核通过后，进 **Ad Units** 创建各广告单元，拿到 key。

### Step 3 — 配置环境变量

在 Cloudflare Pages → Settings → Environment variables 加：

| 变量 | 广告位 | CPM 实测 | 收入占比 |
|---|---|---|---|
| `PUBLIC_AD_MOBILE_320X50` | Sticky 小横幅（**收入主力**） | $3.25 | ~50% |
| `PUBLIC_AD_SIDEBAR_160X300` | 侧边栏半高 | $1.85 | ~15% |
| `PUBLIC_AD_SIDEBAR_160X600` | 侧边栏竖幅 | $1.50 | ~10% |
| `PUBLIC_AD_BANNER_728X90` | 大横幅 | $1.31 | ~5% |
| `PUBLIC_AD_BANNER_300X250` | 中等矩形 | $0.84 | ~5% |
| `PUBLIC_AD_NATIVE_BANNER` | Native banner | $0.65 | ~11% |
| `PUBLIC_AD_BANNER_468X60` | 经典横幅（可选） | $0.75 | ~3% |

> 留空的变量 → 对应广告组件 `return null` 不渲染。可以先只配 320×50 主力，其他后续补。

### Step 4 — 更新广告 HTML 的 key

AnvilWiki 自带了 6 个广告 HTML 模板在 `public/ads/*.html`，但里面的 key 是占位符 `YOUR_AD_KEY`。需要替换：

```bash
# 批量替换（把 YOUR_AD_KEY 换成你的实际 key）
# 注意：不同广告位的 key 不同！
# 手动编辑每个文件，把 YOUR_AD_KEY 换成对应广告单元的 key
```

或者用构建时注入（进阶，需要改 AdBanner 组件读环境变量并替换）。

### Step 5 — 重新部署

在 Cloudflare Pages 触发重新部署（push 一个 commit，或 dashboard 点 Retry）。

---

## 广告位设计（已在 AnvilWiki 内置）

### Sticky 320×50（收入主力，~50%）

粘在屏幕顶部，曝光时长从 3-8 秒 → 30-60 秒。**一个广告位占全站收入约一半**。

内置关闭按钮（localStorage 记忆），用户关了就不打扰。

### 桌面端侧边栏 160×600 + 160×300

`position: fixed` 固定在内容区域两侧。仅在桌面端显示（`hidden lg:block`）。

### 页内横幅 728×90 / 300×250

文章页正文中间和底部。不 sticky。

### Native Banner

不需要 iframe 隔离（key 直接写在脚本 URL 里）。

---

## iframe 隔离原理（不要改这个设计）

每个广告位是 `public/ads/` 下的一个独立 HTML 文件，有自己的 `window.atOptions`：

```html
<!-- public/ads/banner-320x50.html -->
<script>
  atOptions = { 'key': 'xxx', 'format': 'iframe', ... };
</script>
<script src="//...highperformanceformat.com/xxx/invoke.js"></script>
```

页面用 iframe 嵌入：
```html
<iframe src="/ads/banner-320x50.html" width="320" height="50"></iframe>
```

**为什么**：每个 iframe 有独立 window → `atOptions` 互不共享 → 多广告不串号。

> ⚠️ **不要**改成全局 `window.atOptions` 或队列加载——会导致多广告串号。这个设计是课程实战验证过的。

---

## 不挂的广告

| 类型 | 原因 |
|---|---|
| **Popunder** | 伤用户体验，影响 SEO |
| **Social Bar** | CTR 高但收入仅 2%，高 CTR 陷阱 |
| **Smartlink** | 未实测 |

---

## 上线后自检

电脑端 + 移动端分别打开站点：

```
□ ① 每个广告位正常显示，不破版
□ ② 没有"自动跳转广告页/自动弹窗"（有就立刻关 Popunder/Social Bar）
□ ③ 看不到广告先关 VPN，用手机 4G/5G 真实网络测
□ ④ 去 Adsterra 后台看 impression 数有没有在涨（比肉眼靠谱）
```

---

## 收款（提现）

| 方式 | 门槛 | 手续费 | 适合 |
|---|---|---|---|
| **USDT + 欧易 OKX** | 几十刀 | ~1% | 金额不大，省手续费 |
| 银行电汇 | $1000 起 | ~$50/笔 | 金额大，直接进卡 |

**推荐**：先用 USDT + 欧易。
1. 欧易 → 链上充币 → USDT-TRC20 → 充币地址
2. Adsterra 后台 → Payments / Payout → 绑定 USDT 收款地址
3. 平台每半个月自动打款

---

## CPM 偏低怎么排查

去 Adsterra 后台用 **Group by** 三步定位：

1. **按广告位**：看哪些 CPM 高/低 → 多给高 CPM 的 Sticky 320×50 版面
2. **按国家**：如果展示主要来自东南亚/南亚 → CPM 低是正常（流量结构问题）→ 做选题和 SEO 争取欧美英语流量
3. **按设备**：如果只有一种设备展示多 → 可能是响应式 class 限死在某端

---

## 下一步

- [部署指南](./deployment.md)
- [换皮工作流](./skinning.md)
- 回到 [README](../README.md)
