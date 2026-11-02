---
title: How to Set Up Website Ads - AdSense and Adsterra From Application to Payout
description: "Set up display ads on a content site: the AdSense application that passes review, placements that do not wreck the page, and how payouts actually arrive."
order: 9
updated: 2026-11-02
tldr: "Display ads are the baseline monetization for content sites: apply to AdSense with original content and a reachable contact page, place ads where they do not fight the content, and layer a second network like Adsterra only after the first is stable. The template ships ad slots as built-in, env-gated components — ad keys go in config, ads render when set and vanish when not. Payouts arrive monthly once you clear the threshold and verify identity and payment address."
---

## When is a site ready for display ads?

When three things are true: the site has **original content** (not republished or AI-spun filler), every page has a clear purpose a reviewer can understand in seconds, and the site has the trust pages ad networks check — about, contact, privacy policy with a disclosure section. Applying before those exist wastes the first impression: review rejections stick to the domain's history.

Display ads are a **traffic-scale** monetization — they pay per thousand views, so they reward sites that already have readers. If traffic is still small, affiliate links inside tutorials usually earn first ([the monetization ladder](/landing/tutorials/game-wiki-monetization/) breaks down which layer pays when); ads compound later on the same pages.

## How does the AdSense application work?

The flow is: create the AdSense account, add your site, paste the verification snippet, and submit for review. Reviewers (and then the automated layer) check for original content, working navigation, a privacy policy that discloses ad cookies, and a reachable contact channel — the template ships all of these as built-in pages and components, with the ad code still dormant until you add keys.

What gets applications rejected, in practice:

- Thin or duplicated content — the fastest rejection there is.
- A privacy policy that never mentions advertising cookies (the template's legal pages include the disclosure; it activates with the ad keys).
- Navigation that dead-ends, or pages that 404 under the reviewer's click-through.

An item-by-item pre-application audit catches these before Google does — the template ships a checklist skill that grades all 22 review criteria and refuses to suggest applying while a blocker is open. Run the audit, clear the blockers, then apply. The [tutorial-hub setup](/landing/tutorials/start-a-tutorial-site/) is the fastest site shape to bring past the audit — one category, FAQ structure pre-wired.

## Where should ads go on the page?

Where attention naturally pauses, not where it fights the content: **one leaderboard above the article body**, **one in-content unit after the first sections**, and on article-heavy sites a **sidebar or mobile anchor** unit. The template ships these as ready-made, env-gated slots — you paste an ad-network key into config and the slots render; keys empty means the slots never existed, which keeps the pre-ads page experience (and Lighthouse scores) untouched.

Two placement rules that protect both revenue and rankings: never push the article's main content below the fold with oversized units at the top, and never run ad formats that open popups or redirect the reader — networks ban accounts for that, and search engines demote pages that host it. The [full comparison of ad networks and formats](/landing/comparison/) covers which units pay and which poison.

## What does Adsterra add, and when?

AdSense is the premium network but strict; **Adsterra accepts newer sites** and pays on different formats (banners, native units, popunders). The practical pattern is AdSense first, Adsterra as a second network on pages or formats AdSense does not fill — the template treats them as parallel env-gated systems so both can run side by side without code changes.

## How do payouts actually arrive?

Both networks pay monthly, after you clear a threshold (AdSense: $100; Adsterra: $5). Three things must be set up before the first dollar moves: **identity verification** (a government ID for AdSense's PIN/address check), **payment method** (wire transfer details for AdSense — the payee name must match your bank record exactly), and **tax info** (for AdSense, a W-8BEN tax form — for many countries a treaty reduces US withholding to as low as 10–15% on ad earnings). None of these can be faked or rushed; the accounts that get stuck are the ones that set up ads before setting up payout details.
