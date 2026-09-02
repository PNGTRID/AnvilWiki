---
title: "Turn On Ads: Timing and Setup"
description: "Rank first, ads second. Self-check, audit, apply to AdSense, fill four Cloudflare variables — empty vars render nothing, and revenue is 100% yours."
manual: learn
order: 22
stage: "Monetize & Operate"
icon: lucide:dollar-sign
tldr: "Timing first: no switch before rankings settle. Self-check (own domain, 15-20 pages, built-in legal pages), then /anvil-adsense-audit item by item — no submitting with open Blockers. After approval fill PUBLIC_ADSENSE_CLIENT plus three slot IDs and redeploy; same day, start the payout tasks. Weeks 1-2 at zero revenue is normal."
updated: 2026-09-02
---

## A true scene first

The panels have numbers, and with them the temptation: flip the ad slots on and visitors start paying. One sentence first: **ads are a monetization lever, not a growth lever**. Site owners who enabled ads before rankings settled watched their top keyword slide from #1 down — and recover only after removing them. Trading rankings for a few dollars a day is the most expensive small saving there is.

## Timing: three conditions before the switch

- **The peer rule**: if no competitor on page one runs ads, neither do you.
- **A core query has touched the top two pages**: the ranking floor exists, so ad dilution can't hurt you.
- **Weekly publishing continued past the first release**: ads amplify existing traffic; they don't replace it.

The full timing checklist, the ads-platform landscape (Adsterra, Mediavine, NitroPay and gaming verticals as traffic grows) live in the repo doc [docs/ads.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/ads.md).

## Step 1: apply to AdSense (self-check first)

**Pre-application checklist** (any gap invites rejection):

- ☐ Own domain (pages.dev free domains almost never pass)
- ☐ 15-20 pages of real content (not shells)
- ☐ Privacy policy and terms pages (**built into the template** already)
- ☐ No dead links (`pnpm check-links` green)

**Lazy path — an item-by-item audit by AI**: in a skills-capable assistant type `/anvil-adsense-audit`; it checks against Google's policies (content originality, ad-cookie disclosure on the privacy page, expired codes, empty categories — template-solved items come with evidence) and outputs a Pass/Fail/Unknown table. Two disciplines: **"should be fine" is not a verdict** — every item needs evidence or a stated gap; **never submit with open Blockers** — rejections follow the account.

**How**: open [adsense.google.com](https://adsense.google.com) → add your site → wait for review (days to two weeks).
**Rejected**: nine times in ten it's "low value content" — write 5-10 more real pages with the production pipeline and reapply in two weeks; nothing else is affected.

## Step 2: fill the ad IDs into the site

After approval AdSense issues one publisher ID and slot IDs. The site reserves four switches — fill them and the slots light up:

1. AdSense → **Ads** → by ad unit: copy your publisher ID (`ca-pub-…`) and the slot IDs
2. Cloudflare → your project → **Settings** → **Variables and Secrets** — add four variables:

| Variable (exact, case-sensitive) | Value |
|---|---|
| `PUBLIC_ADSENSE_CLIENT` | Your publisher ID (ca-pub-…) |
| `PUBLIC_ADSENSE_SLOT_STICKY` | Bottom banner slot ID |
| `PUBLIC_ADSENSE_SLOT_SIDEBAR` | Sidebar slot ID |
| `PUBLIC_ADSENSE_SLOT_INCONTENT` | In-article slot ID |

3. Save and redeploy.

**You'll see**: ad slots appear bottom/sidebar/in-article (a new site's slots may take hours to days to fill — blank at first is normal).
**Check**: want only some placements? Fill only those — an empty variable means that slot doesn't render, by design. Lazy-loaded slots keep Lighthouse at full marks.

## Step 3: the same day, start the three payout tasks

Ads live, balance accumulating — but between "balance in the dashboard" and "money in your bank" sit several verifications with waiting periods. **Start the three payout tasks the day you're approved** (W-8BEN tax form / PIN postcard / wire transfer) — full flow next lesson.

## Honest revenue expectations

- The golden window is the game's first **2 to 8 weeks**. Zero revenue in weeks one and two is normal — not failure.
- Revenue ≈ pages × rankings × RPM. The first 30 days are about page count; after that, rankings (freshness + internal links).

## Three classic mistakes (made for you in advance)

- **Ads before settled rankings**: wagering your top keyword's position for a few dollars a day — terrible odds.
- **A typo in a variable name**: the slot stays blank forever and you blame a rejection — variable names are case-sensitive; copy from the table.
- **Ads on, payout tasks forgotten**: an unverified PIN after four months pauses ad serving — the money survives, the income doesn't. Next lesson, now.

## Three words to know (just these)

- **AdSense**: Google's ad middleman — views and clicks settle monthly to you, revenue 100% yours.
- **RPM**: revenue per thousand page views; tier lists and codes pages usually run highest.
- **Publisher ID**: your `ca-pub-` identity from AdSense — the master switch for all site ads.

## ✅ Acceptance (all must hold)

- ☐ Four variables filled (or some slots consciously off), ads visibly serving
- ☐ The three payout tasks are in motion (next lesson)
- ☐ Expectation set: zero revenue in the first two weeks is normal

## Next lesson

The slots are live — how does the money actually reach your bank? Next lesson: the three payout tasks — W-8BEN, PIN, wire — started the day you're approved. [Go to Lesson 23 · The Three Payout Tasks](/landing/docs/get-paid)
