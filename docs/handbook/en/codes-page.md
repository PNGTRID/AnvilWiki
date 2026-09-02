---
title: "The Codes Page: Biggest Traffic, Biggest Risk"
description: "The highest-traffic page is also the most fragile: codes come only from lists you saw yourself. Full prompt, video red lines, and the draft-to-live flow."
manual: learn
order: 14
stage: "Content Engine"
icon: lucide:gift
tldr: "The codes page earns the most return visits — and carries the manual's thickest red line: codes come only from lists you saw yourself (official Twitter/Discord/dev streams), never invented or 'guessed'. One fake code — a player redeems nothing — and your site is done. Video-sourced material gets double red lines: spoken numbers and codes count as unverified (publish as draft, verify, then flip), and other people's scripts must be fully rewritten."
updated: 2026-09-02
---

## A true scene first

A player searching "game codes" wants exactly one thing: a working code to copy. That intent makes the codes page the highest-traffic query on the site, and players assume it updates daily and come back — Lesson 1 said return traffic is the most valuable kind. The other side of the coin: **hand a player a dead code and he never returns — and tells his friends**. Traffic king and accident magnet are the same page.

## The manual's thickest red line

**Codes come only from lists you saw with your own eyes**: the official Twitter, the official Discord, a developer stream. AI has no eyes — the codes it "knows" are stale or invented. The prompt below hard-codes it: "only from the list below; never invent or guess". Feed your list into the placeholders; AI does layout and bookkeeping, not creation.

```text
Create a codes page for <game name> (category: codes, slug: all-codes).
Codes may only come from the list below; never invent or "guess" one:
<code | reward | expiry | source>
Write all data into the frontmatter codes array (code/reward/status/expiryDate/source);
the body covers how-to-redeem steps + FAQ (H2s as questions), title includes month and year.
Run pnpm check-content && pnpm build; all green or not done.
```

**You'll see**: a codes page with one-click copy buttons, Active and Expired auto-grouped.
**Check**: every code has a source and an expiry; click a copy button yourself.

## Double red lines for video-sourced material

Many codes come from someone else's video. Video is fine as material — two lines, crossing either is an accident:

1. **Numbers and codes spoken in a video count as unverified** — the finished page wears `draft: true` until you verify by hand (redeem the code, check the number). Creators misquote and go stale constantly; they are not responsible for your site.
2. **Other people's scripts and captions are factual reference only — your prose must be fully rewritten.** Copying their text invites copyright and duplicate-content trouble; embedding the original video in your page is the compliant move, copying its words is not.

## The standard draft-to-live move

A `draft: true` page is visible only to you; production builds never publish it. The flow: **publish as a draft placeholder → verify item by item when you have time (redeem each code, recheck each number) → flip the draft flag off**. Pages you have verified are the ones players can visit every day.

## Three classic mistakes (made for you in advance)

- **Asking AI to "come up with a few codes"**: hand-crafting a fake. There is exactly one acceptable count: zero.
- **Reposting a video's script as your article**: unsafe and undifferentiated. Keep the facts, rewrite the sentences.
- **Dead codes never marked**: flip `status` to expired and date the update. Players bounce after one dead code — expiry management is return-visit management.

## Three words to know (just these)

- **Source**: each code's birth certificate — where you saw it, written down. Cited codes are credible codes.
- **Flip live**: the moment verification finishes, the draft flag comes off, the page meets every player.
- **Expiry management**: archiving dead codes promptly, active ones on top — returning players only read the newest section.

## ✅ Acceptance (all must hold)

- ☐ The codes page passes QA; every code has source and expiry
- ☐ A copy button actually works
- ☐ Every video-sourced item is either verified and live, or still flagged draft

## Next lesson

"Got codes?" answered. The next player question is "who's strong?" Next lesson: tier lists turn your judgment into tables — then give your pages their own images and video. [Go to Lesson 15 · Tier Lists & Media](/landing/docs/tier-list-and-media)
