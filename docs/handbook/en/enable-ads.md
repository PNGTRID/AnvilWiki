---
title: "Turn On Ads, Start Earning"
description: "After 15 to 20 articles, apply for Google AdSense, pass review, fill 4 Cloudflare switches with ad IDs — ads appear without slowing the site; revenue is 100% yours."
manual: learn
order: 16
stage: "Monetize & Operate"
icon: lucide:dollar-sign
tldr: "Earning takes three steps: self-check first (own domain, 15 to 20 articles, privacy pages built in), pass AdSense review, fill the 4 IDs into the Cloudflare variables — ads go live. On approval day, do the three payout tasks: W-8BEN tax form, PIN mailer, wire transfer. Zero revenue in the first 1 to 2 weeks is normal. Rejected? Add content and reapply."
updated: 2026-08-26
---

## Where you are, and what this lesson solves

The site is live and Google is indexing it. But visitors arrive and you have nothing to sell — this lesson turns the **ad slots** on. Visitors see ads, and Google pays you a share.

## First, timing: don't switch ads on at launch

The switches in this lesson can be flipped anytime, but **when** you flip them matters:

- Let the site run **1 to 2 days** after launch first — so Google's first crawl and the first visitors see a clean, fast page.
- **The peers rule**: while none of the sites on Google's page one run ads, hold off too. Before your rankings settle, don't trade user experience for ad money — one webmaster watched the #1 spot slide continuously after adding a banner, and only recovered after removing it.

Ads are how you monetize, not how you grow — don't reverse the order. The full pre-flight checklist, the complete AdSense payout walkthrough, the Adsterra onboarding tutorial, and how to level up ad platforms as traffic grows (starter / intermediate / mature tiers plus gaming-vertical networks like NitroPay, all with official site links) live in the repo doc [docs/ads.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/ads.md).

## What you'll have when this lesson is done

- Ad slots live and revenue accumulating
- The switch locations for comments and traffic analytics (optional — flip them on whenever you want)

## A few words to know

- **AdSense**: Google's ad middleman. It places ads into your pages; when ads get seen or clicked, Google pays you monthly.
- **RPM**: how much you earn per thousand page views. Tier list and codes pages usually have the highest RPM.
- **Lighthouse 4×100**: Google's health check for websites — four scores of 100 for speed / accessibility / best practices / SEO. This template ships with a perfect score out of the box — the ad slots lazy-load, so turning them on doesn't drop the score.

## Step 1: Apply for AdSense (self-check first, don't rush to submit)

**Pre-application checklist** (missing any one makes rejection likely):

- ☐ A domain you own (bought in the go-live lesson; the free pages.dev domain basically fails review)
- ☐ 15 to 20 real content pages (not an empty shell)
- ☐ Privacy policy and terms of service pages (**the template already ships them built in** at `/privacy-policy` and `/terms-of-service` — nothing for you to do)
- ☐ No dead links on the site (`pnpm check-links` passes)

**Lazy route: let the AI run an item-by-item audit.** In an AI assistant that supports skills, type `/anvil-adsense-audit` — it checks your site against Google's official policies item by item (content originality, whether the privacy page mentions ad cookies, expired codes, empty categories… items the template already solves come with evidence pre-filled) and outputs a Pass/Fail/Unknown table. Two rules: **a verbal "should be fine" doesn't count** — every item needs evidence or a written note of what's missing; and **don't submit while a Blocker is open** — fix it first, because rejection records follow your account.

**How to do it**: open [adsense.google.com](https://adsense.google.com) → add your site → wait for review (a few days to two weeks).
**If you get rejected**: read the reason it gives — nine times out of ten it's "insufficient content". Go back with the the page-production lesson routine, write 5 to 10 more pages, reapply in two weeks. It doesn't count against you later.

## Step 2: Fill the ad IDs into the site

**What to do**: after review passes, AdSense gives you 1 publisher ID and several ad-slot IDs. The site reserves 4 switches on its switch panel — fill them in and they light up.
**How to do it**:

1. AdSense dashboard → **Ads** → by ad unit, grab your publisher ID (looks like `ca-pub-followed-by-digits`) and each ad slot's ID.
2. Cloudflare → your project → **Settings** → **Variables and Secrets**, add 4 variables:

| Variable name (copy exactly, case-sensitive) | What you enter |
|---|---|
| `PUBLIC_ADSENSE_CLIENT` | Your publisher ID (starts with ca-pub-) |
| `PUBLIC_ADSENSE_SLOT_STICKY` | The bottom banner slot ID |
| `PUBLIC_ADSENSE_SLOT_SIDEBAR` | The sidebar slot ID |
| `PUBLIC_ADSENSE_SLOT_INCONTENT` | The in-article slot ID |

3. Save and redeploy.

**You'll see**: ads appear at the bottom / in the sidebar / mid-article (fresh ad slots can take hours to days to fill with real ads — blank at first is normal).
**Confirm it worked**: all four variables are in Cloudflare (leave any one empty and that spot simply doesn't render — that's by design; want just one slot? Fill just one). The revenue is all yours — no platform cut.

## Step 3: Right after approval, do the three payout tasks

The ads are live and revenue is accumulating — but **between a dashboard balance and money in your bank account sit several verifications, each with a waiting period**. The most painful scenario: you hit $100 only to discover the PIN was never verified, the payment is held, and you wait an extra month for nothing. Do these three things on approval day:

1. **Submit the tax form (W-8BEN, 10 minutes)**: dashboard → Payments → Payments info → Tax info. Individual, country China, tick "Claim tax treaty benefits" (Royalties article) — the treaty rate is 10%; skip it and the default withholding is 30%.
2. **Watch for the PIN mailer**: when your balance reaches $10, Google mails a 6-digit PIN to your account address — regular post, 2 to 4 weeks; enter it under "Payments → Verification check" when it arrives. If unverified 4 months after generation, ad serving is paused — so check your address now, not at $10.
3. **Add a wire-transfer payment method (10 minutes)**: Payments → Add payment method → Wire transfer. Payee name in **pinyin**, plus the SWIFT code (ask your bank's support line); an ordinary domestic debit card works. Turn on automatic payments while you're there.

Payout rhythm: $100 minimum, automatic monthly payout on the 21st, arriving in 1 to 3 business days; convert the USD to local currency in your mobile banking app. Step-by-step details (including the manual-verification route when the PIN never arrives) are in the repo doc [docs/ads.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/ads.md).

## Optional: comments and analytics (the same switch-panel game)

**Comments** (Giscus, hosted on your GitHub repo's discussions): the variables are `PUBLIC_GISCUS_REPO` and 3 more; when you want them, the developer manual's feature-toggles chapter has the full steps.

**Traffic analytics**: three tools — pick first, then install.

### Choosing among the three analytics tools

| Tool | Uses cookies? | Best at showing | Recommendation |
|---|---|---|---|
| Cloudflare Web Analytics | No | Traffic volume, source countries, top pages | **Install always**: one token, zero burden |
| Google Analytics 4 | Yes (consent-banner gated) | User behavior: engagement, returning visitors, funnels | Add when you seriously analyze users |
| Microsoft Clarity | No | Click heatmaps, session recordings | the weekly-ops lesson has a 10-minute tutorial; pairs with the weekly review |

The three don't conflict. For the beginner phase, the recommended combo is **Cloudflare Web Analytics + Clarity**; add GA4 once your questions graduate from "how many came" to "how do they move through the site".

### Install Cloudflare Web Analytics (2 minutes, always)

1. Cloudflare Dashboard → left sidebar **Analytics & Logs** → **Web Analytics** → **Add a site**, enter your domain
2. It hands you a JS snippet containing `token="a-string-of-letters-and-digits"` — put that token into the environment variable **`PUBLIC_CF_BEACON_TOKEN`** (same place as the 4 ad variables in this lesson's Step 2)
3. Save and redeploy; the panel starts filling in within minutes

**You'll see**: Views / source countries / top paths in the Web Analytics panel.
**Why always**: no cookies, no consent banner, no page slowdown (Lighthouse unchanged) — it alone answers "how many, from where, viewing which pages".

### Install Google Analytics 4 (10 minutes, optional)

1. Open [analytics.google.com](https://analytics.google.com) → sign in with a Google account → **Start measuring**, create an account and a property (names are up to you; pick your timezone)
2. In the property → **Data streams** → **Add stream** → choose **Web** → enter `https://your-domain` → create
3. Note the **Measurement ID** (looks like `G-AB12CD34EF`) → put it into the environment variable **`PUBLIC_GA_ID`** (same place as above)
4. Save and redeploy → open your site and **click Accept on the consent banner once**
5. Back in GA4 → **Reports** → **Realtime** — you should see 1 active user (you)

**⚠️ The two most common "no data" causes**:
- **GA is consent-gated in this template**: until a visitor clicks Accept, the GA script never loads — that's the design keeping Lighthouse intact and privacy compliant, not a bug. Verify by accepting once yourself and checking Realtime.
- **Reporting lag**: Realtime is instant; standard reports can lag 24 to 48 hours — don't call it broken too early.

## Realistic revenue expectations

- The golden window is the **2 to 8 weeks** after a game explodes. Inside the window, Google hands you rankings step by step — **zero revenue in the first 1 to 2 weeks is normal**, not failure.
- The revenue formula ≈ page count × rankings × revenue per thousand views. In the first 30 days, push page count; after that, push rankings (freshness + internal links).

## If you get stuck

- **"An ad slot stays blank"**: new site, new slot — filling can take hours to days; also confirm all 4 variable names are spelled exactly right (case-sensitive).
- **"AdSense rejected me"**: it's almost always content volume — add 5 to 10 real guides and reapply.
- **"The PIN mailer never arrives"**: you get 4 mailing attempts (1 automatic + 3 manual re-sends); if all fail, use the official form for manual verification (upload an ID + proof of address) — details in docs/ads.md, section 2.

## ✅ Acceptance criteria (all must hold)

- Ads genuinely display on the live site (if you've passed AdSense review)
- ☐ All four variables are filled (or you deliberately enabled only some slots)
- ☐ Your expectations are set: zero revenue the first two weeks is normal

## Next step

The ads are on, but game guides fear one thing above all — going stale. Stale content loses rankings and visitors. The last chapter: a 30-minute weekly freshness rhythm that keeps the site earning. [Go to the weekly-ops lesson · Weekly Freshness and Growth](/landing/docs/weekly-ops)
