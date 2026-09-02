---
title: "Slow Variables: Trust & Backlinks"
description: "The compounding quarter of rankings: freshness, bylines, internal links; anti-spam red lines; backlink timing and the 2026 expired list. The manual closes here."
manual: learn
order: 29
stage: "Monetize & Operate"
icon: lucide:handshake
tldr: "Three slow variables: freshness (weekly refresh-audit IS SEO), author bylines (Person JSON-LD), real internal links. Anti-spam red lines: no filler, no invented data, no undisclosed endorsements. Backlinks ≈13%: not the main battle early — start when core queries hit the top two pages; never buy junk links. 2026: FAQ rich results gone; llms.txt ignored by Google."
updated: 2026-09-02
---

## A true scene first

Pages filled, yet rankings crawl — because rankings judge the **whole site's trust**, not just one page. Everything in this lesson shares a trait: it can't be rushed, and it compounds. These are the business's slow variables — the last part no one can do for you.

## Three trust slow variables

- **Freshness**: sites with dead codes and stale guides get demoted wholesale. The weekly `refresh-audit` + `lastModified` discipline exists for exactly this — **the weekly 30 minutes is itself SEO**, not extra chores.
- **Author bylines**: register real authors in `src/config/authors.ts` and each article's Person JSON-LD activates — far more credible than an anonymous "site staff" (E-E-A-T, applied to game wikis: real authors, sourced data, unexpired content).
- **A real internal-link network**: tag pages, related articles, and hub pages interlinking — Google sees a structured reference library, not orphaned pages.

The other side: **Google rolled an anti-spam update in August 2026** — three red lines: bulk filler pages, invented data (fake codes/numbers), undisclosed paid endorsements (affiliate links must go through the `AffiliateLink` component, which adds the compliance markup). All three have built-in defenses; don't route around them.

## Backlinks: when, and how much

Backlinks (other sites linking to you) are roughly 13% of Google's ranking factors — important, and the easiest place for beginners to misallocate effort:

- **Early on, it's not the main battle**: everyone's linkless; the contest is content quality and experience. Sites with single-digit backlinks have outranked sites with thousands — content and experience settle it.
- **Two-phase strategy**: don't grind links before rankings exist; **when core queries reach the top two pages and growth flattens, come back** — then every link is kindling on an existing fire.
- **When you do**: trade links with peer sites a notch stronger (by DR); find register-to-post sites, confirm by hand that posting works, then have AI script the submissions; steady small rhythm — never hundreds at once (a spike reads as purchased).
- **Red line**: quality over quantity — **never buy junk links** (link farms / bulk blasts): at best useless, at worst a manual penalty.

The nine-channel priority list, step-by-step instructions, and outreach email templates live in the repo doc [docs/seo.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/seo.md), "backlink strategy" — for when that phase arrives; not now.

## 2026's new rules: the expired-tricks list

- **FAQ rich results are dead**: since May 2026 Google removed the FAQ rich snippet. Keep FAQPage structured data (machines still parse it), but stop investing in the styling.
- **llms.txt is ignored by Google**: officially unread, zero ranking effect. But ChatGPT/Perplexity-class tools use it to index sites — the template's auto-generated `/llms.txt` stays, positioned as "a business card for AI assistants".
- **AI Overviews citation preferences**: direct-answer blocks, structured data, fresh content — exactly what the template and the last lesson's checklist cover. Just do it.
- **Images search = the cover**: Google picks og:image first — two minutes choosing a good cover is now traffic work.

## Three classic mistakes (made for you in advance)

- **Link-blasting in the newbie phase**: misallocated effort — 13% can't rescue 85% content problems.
- **Buying links to save time**: farm links are negative assets; one manual penalty zeroes the site.
- **Restructuring pages for FAQ rich results**: that style is gone; don't work for an expired promise.

## Three words to know (just these)

- **Slow variables**: signals that start slow and compound — freshness, bylines, links. Time's friends.
- **DR**: a third-party site-authority score, used to size up link-trade partners.
- **E-E-A-T**: Google's experience/expertise/authority/trust shorthand — for a wiki: real authors, sourced data, unexpired pages.

## ✅ Acceptance (all must hold)

- ☐ You audited your site against all three anti-spam red lines
- ☐ Your backlink trigger condition is written down (which query reaching page two starts it)
- ☐ The learning manual's full loop is in your hands — selection to ranking

## Learning manual — graduated

The loop closes: selection → build → content → indexing → monetization → freshness → cloning → batch → **rankings and AI citations**. SEO is slow craft: checklists done, the rest belongs to the weekly rhythm and 4-12 weeks of patience. Deep tech details: the repo doc [docs/seo.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/seo.md). To automate the weekly data review, head to the Development Manual's [AI ops lesson](/landing/docs/ai-ops) — and when trouble strikes, the appendices hold the red-line master list, the troubleshooting tree, and the glossary.
