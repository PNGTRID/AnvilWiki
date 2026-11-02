---
title: Keyword Research for Content Sites - Find Words You Can Actually Win
description: "A keyword-research workflow for content sites: mine candidates from nine channels, validate against live search results, and score into a dated decision table."
order: 8
updated: 2026-11-02
tldr: "Keyword research for a content site is a decision process, not a tool dump: mine candidates from multiple channels, validate each against the live search results (is the intent actually satisfied?), score what has evidence, and write every verdict into a dated decision table with review dates. Head terms with high volume usually lose to mid-tail words with weak search results — the score is a tiebreaker, the search results page is the judge."
---

## Why does most keyword research produce nothing?

Because it stops at the spreadsheet. The common workflow — dump seed words into a tool, sort by volume, chase the big ones — skips the two steps that decide outcomes: **does the live search results page actually answer what searchers mean**, and **can your page realistically beat what is there**. Volume without those two checks is a lottery ticket with extra steps.

The fix is treating research as a decision pipeline: mine broadly, validate harshly, score only what survives, and record the verdict with a review date so nothing rots in a tab.

## Where do keyword candidates actually come from?

Nine channels, in two tiers — the ones you can check yourself and the ones that need an account or an app:

- **Search signals**: Google Trends rising queries and related searches at the bottom of results pages; autocomplete walks; "people also ask" chains.
- **Community anomalies**: niche subreddits and forums where the same question keeps resurfacing with thin answers — a repeated question is an unclaimed page.
- **Competitor gaps**: sites covering your topic where a sub-section is obviously thin or abandoned; tool-marketplace reviews where users complain about what a product cannot do.
- **Adjacent winners**: whatever content won in a neighboring niche translates — "best X for Y" formats and beginner-guide structures port across topics with new research.

If you run this mining as a repeatable workflow — channels in order, candidates logged with source and date — the whole loop can be automated. The AnvilWiki template ships an [agent skill that runs this exact pipeline](/landing/docs/) and writes candidates into a decision table for you.

## How do you validate a candidate in two minutes?

Open the search results page for the keyword and answer three questions:

1. **Intent match**: is the top ten answering what a searcher actually wants, or just sharing the words? A search for "how to start a recipe site" that returns domain-name marketplaces and app builders has failed the searcher — an intent mismatch is an open seat.
2. **Weak positions**: forums, PDFs, auto-translated pages, or sites with obviously dated content in the top ten are seats your page can take.
3. **Search sprouting**: do related searches and autocomplete sprout longer forms of the keyword ("… for beginners", "… without coding")? Sprouting means demand is growing, not decaying.

## How do you score and decide?

Score only candidates that passed validation, and score honestly — every unmeasured factor is marked as untested, never counted as zero. The framework: keyword volume tier, difficulty estimate, weak-position bonus, trend direction, and intent match — with a written verdict into a **decision table** that records the candidate, the evidence, the verdict, and a review date three, seven, fourteen, and twenty-eight days out. Words with no search-data evidence yet stay in the review lane — "untested" and "zero" are different sentences.

The [site-type decision](/landing/tutorials/) itself is the output of this process: each direction on this site won its seat through the same validation, which is why the [recipe-site tutorial](/landing/tutorials/start-a-recipe-site/) and the [coupon-site tutorial](/landing/tutorials/build-a-coupon-site/) exist — both survived the table.

## What does this look like on a real site?

The mining workflow above runs against this very site's tutorial line: every tutorial in the [hub](/landing/tutorials/) entered through a scored decision row, and the rows carry review dates so stale verdicts get re-validated instead of quietly rotting. Start your own table with three to five candidates — one round, fully validated, beats fifty rows of unvalidated spreadsheet.
