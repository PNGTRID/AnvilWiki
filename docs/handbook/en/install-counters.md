---
title: "Install the Two Counters: Who Came, What They Did"
description: "Launch-day counters: Cloudflare Web Analytics (a token) and the Clarity heatmap (a script) — ten minutes to learn who came, from where, and where they get stuck."
manual: learn
order: 20
stage: "Launch & Get Indexed"
icon: lucide:gauge
tldr: "Two counters on launch day: ① Cloudflare Web Analytics (must) — token into PUBLIC_CF_BEACON_TOKEN, redeploy; no cookies, no slowdown. ② Clarity (optional) — paste the script before </head> in BaseLayout; heatmaps and recordings show where players get stuck. With GSC, the reading trio is complete."
updated: 2026-09-02
---

## A true scene first

The site is live — but is it alive? Without counters it's a shop with no receipt printer: how many came, how many pages they read, where they walked out — all a black box. Ten minutes here installs two free tools; next lesson's first-week readings depend on them.

Both switches follow the same pattern as ad slots: **empty variable, nothing renders** — install nothing and the page stays weightless, Lighthouse untouched.

### Counter one: Cloudflare Web Analytics (must, 2 minutes)

Answers: **how many came, from which countries, reading which pages**. No cookies, no consent banner, no slowdown — it answers the basics alone.

1. Cloudflare Dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**, enter your domain
2. It hands you a JS snippet containing `token="alphanumeric-string"` — put that token into **`PUBLIC_CF_BEACON_TOKEN`** (Cloudflare project Settings → Variables; locally, `wrangler.toml` `[vars]`)
3. Save and redeploy; the panel starts filling within minutes

**You'll see**: Views / countries / top paths in the Web Analytics panel.

### Counter two: the Clarity heatmap (optional, 5 minutes)

Numbers say "how many came"; **Clarity says "what they did on the page"** — free click heatmaps plus session recordings. Two questions make it worth it weekly: where players **get stuck**, and whether the **ad slots get clicked**.

1. Open [clarity.microsoft.com](https://clarity.microsoft.com) → sign in with a Microsoft account (free) → **Add project** with your domain
2. Choose **Manual install**; copy the `<script>` snippet
3. Open `src/components/layout/BaseLayout.astro`, paste it just before the closing `</head>` → push to redeploy
4. The dashboard flips to "Receiving data" within minutes; the script loads async — no Lighthouse cost

Your reading trio is complete: **GSC** (installed last lesson — search performance) + **Cloudflare** (traffic) + **Clarity** (on-page behavior).

## Three classic mistakes (made for you in advance)

- **Filled the token but never redeployed**: variables only take effect on deploy — no redeploy, no counter.
- **Installing five analytics tools at once**: more tools, less attention. Two counters plus GSC is the set; GA4 waits until your questions upgrade (Lesson 24).
- **Pasting the Clarity script twice or into the body**: once, before `</head>` — doubled data is unreadable data.

## Three words to know (just these)

- **Beacon**: the tiny signal a visitor's browser silently sends to the stats service — how counters work.
- **Heatmap**: clicks drawn as a temperature map; the red zones are where players click most.
- **Env switch**: every optional feature in this template uses the same mechanism — empty variable means not rendered; that's why installing costs no score.

## ✅ Acceptance (all must hold)

- ☐ The Cloudflare Web Analytics panel shows data (VIEWS not empty)
- ☐ Clarity reads "Receiving data" (or you consciously chose to skip it)
- ☐ You can say what each of the trio covers: GSC = search, CF = traffic, Clarity = behavior

## Next lesson

Gear ready — how to read it? Next lesson: first-week readings, one number per panel, four pass lines. [Go to Lesson 21 · First-Week Numbers](/landing/docs/first-week-numbers)
