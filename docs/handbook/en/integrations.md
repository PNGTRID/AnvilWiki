---
title: "The Feature-Toggle Table: Ads, Comments, Analytics"
description: "All optional features share one toggle mechanism — empty variable = nothing rendered. The full variable table, where they go, and the advanced wrangler.toml route."
manual: dev
order: 4
icon: lucide:plug
tldr: "Every optional feature (ads, comments, analytics, sponsor card) follows the same recipe: the component reads its env variable and renders nothing when it's empty — fill nothing in and the site stays clean, fill in whichever you want and they never affect each other. Fill variables in the Cloudflare dashboard (recommended) or the repo's wrangler.toml (advanced: while it exists the dashboard settings are all ignored, NODE_VERSION goes in its [vars])."
updated: 2026-08-26
---

## Where you are now and what this lesson solves

You want to switch on ads, wire in comments, install analytics — this lesson is the toggle table and the mechanics. **A lookup manual; open it as needed.**

## The toggle mechanism: one pattern everywhere

Every optional feature follows the same recipe:

```astro
---
const client = import.meta.env.PUBLIC_ADSENSE_CLIENT;
if (!client) return null;   // empty variable = this component disappears entirely
---
```

That gives you two guarantees:

1. **Fill in nothing**: the site stays clean and scores a perfect four-part Lighthouse run.
2. **Fill in whatever you want**: features don't affect each other; after enabling one, run a build and confirm the score held.

So do **not** give these variables default values or copy someone else's demo values — empty is the correct state. A local `.env` file can hold these variables too (it never enters git; secrets never land in the repo).

## The full variable table

Where to fill them in: pick one — the **Cloudflare dashboard** (Settings → Variables; the route the learning manual teaches, recommended) or **the repo's `wrangler.toml` file** (advanced, next section).

| Variable | What it does | When empty |
|---|---|---|
| `SITE_URL` | The site's official URL (**the only required one**, must start with `https://`) | Site-wide share cards and sitemap URLs come out wrong |
| `PUBLIC_ADSENSE_CLIENT` | AdSense master switch (publisher ID) | No ads load at all |
| `PUBLIC_ADSENSE_SLOT_STICKY` / `_SIDEBAR` / `_INCONTENT` | The three ad slots | The matching slot doesn't show |
| `PUBLIC_GISCUS_REPO` / `_REPO_ID` / `_CATEGORY` / `_CATEGORY_ID` | Giscus comments (backed by GitHub Discussions) | The comment section doesn't show |
| `PUBLIC_GA_ID` | Google Analytics 4 | GA not loaded |
| `PUBLIC_CF_BEACON_TOKEN` | Cloudflare's built-in analytics (no cookies) | Not loaded |
| `PUBLIC_GSC_VERIFICATION` | Google Search Console verification code | No verification tag emitted |
| `PUBLIC_SPONSOR_URL` / `_IMAGE_URL` | Sponsor card | Sponsor card doesn't show |

For the choosing table and step-by-step setup of the three analytics tools (GA4 / Cloudflare Web Analytics / Clarity), see [the Turn On Ads lesson of the Learning Manual](/landing/docs/enable-ads), section "Optional: comments and analytics"; the full GSC walkthrough lives in [Get on Google](/landing/docs/get-on-google).

## Advanced: keep wrangler.toml (settings recorded in the repo)

The learning manual had you delete `wrangler.toml`, so settings come only from the Cloudflare dashboard. If you'd rather do the opposite and **keep it** (the benefit: settings version-track with your code), there is exactly one rule: **while it exists, the dashboard settings are all ignored** — including the Node version used at deploy time. So if you keep it, write every variable into its `[vars]` section, at minimum:

```toml
[vars]
NODE_VERSION = "22"
SITE_URL = "https://your-domain.com"
```

A diagnostic trick (for when a setting seems to have no effect): temporarily add `console.log('ENV:', Object.keys(process.env).filter(k => k.startsWith('PUBLIC_')))` as the first line of `astro.config.ts`, push, and read the Cloudflare build log to see which variables actually arrived; delete the line when done.

## If you get stuck

- **"Filled in a variable, nothing happened"**: first check you filled the right place (dashboard or wrangler.toml — the latter wins); then verify the variable name matches character for character (case-sensitive); finally confirm you redeployed after saving.

## ✅ Acceptance criteria (all must hold)

- ☐ For every feature you enable, `pnpm build` is all green, and on the live site the component that should appear appears (or disappears) as expected
- ☐ You can say which settings route your site uses (dashboard or wrangler.toml), and you use only one

## Next steps

What the automated checks in the repo (CI) guard, and which security baselines exist — [Dev 5 · CI gates and security](/landing/docs/ci-and-security).
