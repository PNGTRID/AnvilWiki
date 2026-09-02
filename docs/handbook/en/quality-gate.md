---
title: "The QA Pipeline: Finish One, Verify One"
description: "Three gates per page: AI QA green, eyeball the page, answer the TBD list; no data means draft. One commit per page. Never batch-verify — errors copy."
manual: learn
order: 16
stage: "Content Engine"
icon: lucide:shield-check
tldr: "Three gates, one page at a time — a page that hasn't passed doesn't earn a successor: ① AI's check-content && build all green (confirm it truly ran, no red on the last line); ② pnpm dev and eyeball the page — title, tables scrolling on mobile, copy buttons; ③ answer the TBD list — fill data or flag draft. One commit per page as a save point. Two iron rules: never publish unverified content, and never let AI touch code for copy needs (code is load-bearing)."
updated: 2026-09-02
---

## A true scene first

The classic beginner death: generate 10 pages in one go, review them together at the end — page 1 had a format error, pages 2-10 all inherited it, and rework just went up tenfold. **Finish one, verify one**; mistakes die on the spot and never reach the next page. This lesson fixes verification into a three-gate pipeline every page walks.

## The three gates (every page, every time)

1. **The QA gate AI reported**: `pnpm check-content && pnpm build` all green. The prompts force it to run; your job is confirming it **actually ran** with no red error on the last line. It failed? The prompt said "fix and rerun" — usually AI fixes itself; if it stalls, have it paste the last error line and you ask it to try another angle.
2. **Eyeball the page**: `pnpm dev`, open the article — title right? Tables scroll on mobile? Copy buttons copy? Images actually load?
3. **Answer AI's questions**: the TBD list gets data from you; either-or questions get a definite answer.

## The draft rule

AI listed TBDs and you have no data: **the page keeps `draft: true`, and you write the next one**. Drafts are invisible to players — production builds never publish them. "Placeholder first, verify later, flip when done" is respectable; shipping sick is not. Fix a weekly "flip hour" to verify and live the accumulated drafts one by one.

## One save point per page

Each page that passes gets a `git commit` from AI (one line saying what this page is). Why: when something breaks someday, you can return to "the last good article" instead of "some night last week when something unknown broke". Every change goes through source files; never hand-edit build output — output is temporary, regenerated on every build.

## Three classic mistakes (made for you in advance)

- **Verifying 10 pages together**: errors copy themselves; rework multiplies. One in, one verified — that's what makes it a pipeline.
- **Publishing unverified content without a draft flag**: one wrong code, one wrong number — the hole in trust never fully closes.
- **Letting AI change site code to satisfy copy needs**: copy lives in config — **code is a load-bearing wall**. Same spirit: never hand-edit build output, never skip the git save.

## Three words to know (just these)

- **check-content**: the content linter — no H1, heading order, image alt, link rules, internal-link count, one scan each.
- **build**: the master gate that turns source into a shippable site; a malformed card is the first thing it stops.
- **commit**: one git save with a one-line note — your time machine's anchor.

## ✅ Acceptance (all must hold)

- ☐ The latest page passed all three gates: green QA, eyeballed, TBD list answered
- ☐ Everything unverified wears a draft flag — nothing shipped bare
- ☐ One commit per page; you can say what the latest save point contains

## Next lesson

Per-page quality is stable — now set the rhythm: how many pages in the first release, and what schedule for the rest? Next lesson hands you the 10-15 page launch calendar. [Go to Lesson 17 · The Launch Batch](/landing/docs/launch-batch-plan)
