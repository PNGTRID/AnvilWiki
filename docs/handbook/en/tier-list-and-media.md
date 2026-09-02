---
title: "Tier Lists & Media: Tables for Verdicts, Images for Proof"
description: "Tier lists put your judgment into a table with version stamps; media comes via three legal channels — own captures, official kits, CC stock. Two prompts."
manual: learn
order: 15
stage: "Content Engine"
icon: lucide:trophy
tldr: "Tier list prompt: feed your rankings and reasons; table-first, one conclusive line per row, Callout warnings on version-sensitive picks, gameVersion in frontmatter, untested rows marked [TBD]. Media: text-only pages can't compete, and material has exactly three legal channels — your own screenshots and recordings, official press kits, CC-licensed stock. AI cannot generate 'game screenshots'; scraped images are a copyright risk. No material? Skip and move on."
updated: 2026-09-02
---

## A true scene first

A player searching "best characters" doesn't want three thousand words — they want a table: **who's strong, why, and who should I level**. A tier list is your game understanding shipped as a table; AI handles the format, but the judgment must come from you. The other half of the lesson: text-only pages can't compete in game wikis — images and video are the proof that you actually played.

### Step 1: the tier list prompt (paste whole)

```text
Write a tier list page from my judgments.
[Material] <characters/gear list + my ranking reasons>
Requirements: table-first, one conclusive line per row; Callout warn on version-sensitive picks;
gameVersion in frontmatter; untested entries become [TBD] or the whole page wears draft: true — never invent.
Run pnpm check-content && pnpm build; all green or not done.
```

Don't delete the `gameVersion` line: tier lists expire by nature — with a version stamped you know which page to re-check when the meta shifts.

### Step 2: images and video — three legal channels

| Channel | What | How |
|---|---|---|
| **Your own screenshots / recordings** ✅ first choice | Boss close-ups, gear panels, maps; footage you recorded | Drag screenshots into the chat; upload video to YouTube and paste the link |
| **Official assets** ✅ | Press kits, official screenshots and promo art | Use under the official terms; credit the source |
| **CC-licensed stock** ✅ | Generically licensed images | Decorative/banners only, not game footage |

**AI cannot generate "game screenshots" for you**, and scraping images off the web is a copyright risk — both roads are closed, the only open one is making it yourself. No material yet? Skip this step, ship text-only, add media later. Density targets live in `docs/content-format.md`, the "media density" table.

```text
Add media to <article path>.
[Material]
Screenshots: <dragged into the chat, or file paths>
Video: <YouTube link> (delete this line if none)
[Requirements]
Place per the docs/content-format.md media density table: body images use ![alt](/images/articles/...)
with an alt that says what's in the picture; mechanic/route shots go in the frontmatter gallery,
each with caption + alt; register video in frontmatter videos and inline it in the right section.
Never describe anything the image doesn't show.
Run pnpm check-content && pnpm build; all green or not done.
```

## Three classic mistakes (made for you in advance)

- **Ranking characters you never played**: test them, mark `[TBD]`, or draft the page — a "complete-looking" tier list harms more than an empty slot.
- **Scraped images**: one copyright complaint takes the page down and dents the site. Outside the three channels, no image.
- **Empty or lazy alt text**: alt is the image's text stand-in (screen readers and Google both read it) — say what's in the picture, never "image 1".

## Three words to know (just these)

- **Tier list**: your game judgment productized as a ranked table.
- **gameVersion**: stamps which patch the page was written against — when the meta shifts, you know what to re-read.
- **alt text**: the written description of an image, for screen readers and search — half of your image SEO.

## ✅ Acceptance (all must hold)

- ☐ The tier list passes QA with a one-line verdict per row and a gameVersion stamp
- ☐ At least one page carries legally sourced images or video
- ☐ Every image's alt says what's actually in the picture

## Next lesson

Three page types in hand — the last step: verify each page as it's finished, turning QA from "AI's job" into your pipeline. [Go to Lesson 16 · The QA Pipeline](/landing/docs/quality-gate)
