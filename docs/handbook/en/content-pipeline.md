---
title: "The Content Pipeline: Keyword CSV to Draft PR"
description: "Paste a keyword CSV into Actions; the pipeline builds drafts, runs all eight gates, and opens a draft PR only on all-green. No AI keys in CI; a human merges."
manual: dev
order: 8
icon: lucide:workflow
tldr: "'Twenty pages from a keyword list' without a terminal: Actions → Auto content PR → paste the CSV → the deterministic bulk-new-posts generator builds drafts → all eight gates → a draft PR only on all-green. Then fill real data in local AI sessions, verify page by page, merge yourself. Prerequisite: allow GitHub Actions to create PRs. No AI keys in CI."
updated: 2026-09-02
---

## Where you are, and what this lesson solves

The learning manual's pipeline is one-conversation-per-page; batch production generates locally. This is the third form: **a keyword list becomes a draft PR inside the repo** — generation in the cloud, gates in the cloud, you filling the flesh locally. Built for advancing from a phone, and for the moment a pile of validated queries is ready to ship at once.

## Design principle: no AI in CI

Every pipeline step is a **deterministic script**: CSV parsing, scaffolding (bulk-new-posts), the eight quality gates. No AI key ever enters CI — AI creativity happens in your local session; the cloud only certifies "skeleton legal, gates green". That sets the division of labor: **the pipeline lays skeletons; you (and local AI) fill the flesh**.

## One full run

1. **One-time setup**: repo Settings → Actions → General → enable **Allow GitHub Actions to create and approve pull requests** (unchecked, the pipeline can't open its PR at the last step)
2. **Prepare the CSV**: one query per line, format in the repo's [docs/content-pipeline.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/content-pipeline.md) (query/page type; query selection follows the ranking lesson's three tests)
3. **Run it**: repo **Actions** → **Auto content PR** → **Run workflow** → paste the CSV → run
4. **The pipeline**: bulk-new-posts generates every draft → all eight gates → **a draft PR only on all-green** (any red fails loudly; no PR opens)
5. **Fill the flesh**: pull the branch locally and fill real game data in AI sessions (material and draft disciplines fully apply) → verify page by page
6. **Human merge**: confirm and merge — **neither AI nor the pipeline touches main; the merge button is yours**

## Division of labor across the three production lines

| Line | Scenario | Character |
|---|---|---|
| Page pipeline (learning manual) | everyday, one at a time | highest quality, heaviest touch |
| Batch production (learning manual) | local batches of 10-20 | local generation, local verification |
| **Content pipeline (this lesson)** | cloud batch skeletons | gates first, human review last |

All three keep the same discipline: **generate in batches, ship in batches** — the first-release lesson's conclusion never expires.

## Three classic mistakes (made for you in advance)

- **Running the pipeline without the Actions PR permission**: wasted run — the final PR step fails. Do the one-time setup first.
- **Treating it as a money printer**: skeletons are automatic; the flesh needs local filling and human review. Merging empty skeletons is batch-producing junk.
- **Unvetted queries in the CSV**: query judgment (intent / competition / can-you-out-answer) lives in the ranking lesson — the pipeline doesn't pick words for you.

## Three words to know (just these)

- **Deterministic generator**: same input, same output, every time — why the pipeline is trustworthy (no randomness, no surprises).
- **Gates first**: quality checks run completely before any PR — one red and no PR exists at all.
- **Draft PR**: visible and reviewable, unmergeable — the "skeleton placed, flesh pending" intermediate state.

## ✅ Acceptance (all must hold)

- ☐ A run ended in a draft PR (or you know exactly which gate blocked it)
- ☐ Drafts were fleshed out locally with real data and verified
- ☐ The merge was clicked by you

## Next lesson

One site fully automated — the last question: sites two, three, and beyond? Next lesson: one toolkit, N sites. [Multi-Site Management](/landing/docs/multi-site)
