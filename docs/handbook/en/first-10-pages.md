---
title: "Let AI Write 10 Guides for You"
description: "Feed game notes to your AI; four prompts produce guide, codes, tier list, and media pages that pass the build check. Includes the intent table and 7 never-do rules."
manual: learn
order: 13
stage: "Content Engine"
icon: lucide:bot
tldr: "You play the game for an hour and take notes, then feed the notes to your AI and say 'write a guide from these points' — it auto-loads the site's format rules and writes pages that pass the pnpm build check. Three disciplines: give full source material, verify each page on its own, mark missing data 'to be added' rather than invented. Day one output: 10 pages — launch the first version at 10 to 15 core pages, then add the rest in weekly batches."
updated: 2026-08-26
---

## Where you are, and what this lesson solves

Your site shell runs, but the shelves still hold someone else's sample goods. Google only gives rankings to pages that **answer a player's question** — an empty site gets no traffic.

Good news: in this lesson you don't write a single word yourself. You **play the game for an hour, take notes, paste a prompt**; the AI produces standards-compliant pages, and every page passes the build check automatically.

## What you'll have when this lesson is done

- 8 to 10 real content pages (guides, codes, tier list)
- A reusable routine: materials → prompt → acceptance

## A few words to know

- **frontmatter**: the "info card" at the very top of every article, between the two `---` lines, recording the title, description, date, and category. The AI writes it for you — no handwriting needed.
- **The build check (Zod schema)**: the site ships with an inspector of its own. If the info card's format is wrong, `pnpm build` refuses to pass and tells you exactly what's wrong. It's not nitpicking — it blocks junk pages for you.
- **Search intent**: what a player wants to do when searching a term. Four kinds:
  - Searching `codes / redeem` (wants redeem codes) → make a **codes page**, one-click copy, don't write three thousand words
  - Searching `how to` (wants to learn the game) → make a **guide page**, explain step by step
  - Searching `best / tier / ranking` (wants to know who's strong) → make a **tier list page**, the table gives the verdict
  - Searching `wiki / map` (wants reference material) → make a **reference roundup page**
- **draft**: a switch on the info card. Unverified content gets `draft: true` — only you can see it, readers can't; flip it off after verification.

## Step 1: Open your website folder with the AI assistant

**What to do**: have the AI assistant "enter" your website folder, so the files it writes land in the right places.
**How to do it**: open the sixth tool you installed in the tools lesson — the AI assistant — and point it at the `AnvilWiki` folder its own way — **Cursor / ZCode**: click the "Open Folder" button in the UI and pick the folder; **Claude Code / Codex** (terminal-based): type `cd AnvilWiki` in the terminal to enter the folder, then launch the tool (e.g. `claude`). Start a new chat once it's open.
**You'll see**: the AI assistant's window shows the folder path, ending in `AnvilWiki`.
**Confirm it worked**: ask it "which folder are you in right now?" — its answer ends in AnvilWiki.

Once opened, it automatically knows three things (no teaching needed): the site's format rules (AGENTS.md), four ready-made skills, and the info-card format (the schema).

## Step 2: Play the game for an hour first, and take notes

How good the AI's writing turns out **is 80% decided by your materials**. Notes don't need to be tidy — spoken fragments all work:

- What mechanics does this boss have? How many times did I die, and what killed me each time?
- What build/positioning got me through?
- Where did I see the code? What is the code, what does it reward, when does it expire?

**No materials?** Play for an hour yourself, noting on your phone as you go; 20 fragments in an hour is enough for three articles.

To make materials systematic, the repo's [`requirements/`](https://github.com/PNGTRID/AnvilWiki/tree/main/requirements) ships two fill-in templates: a **fact-sources table** (for every page: which key facts came from where, source links, last-updated dates — the credibility receipt behind E-E-A-T, and the AI's data rations so nothing gets invented) and a **benchmark table** (tear down 1 to 3 well-trafficked peer sites: homepage structure, article structure, ad-slot layout — the "copy the best homework" reference for your AI). Both are fill-in-the-blank, and each carries a ready-to-paste research prompt.

## Step 3: Use prompts to produce three kinds of pages

Copy the four prompts below **as whole blocks**, replace the `<>` parts with your materials, and send them to the AI. The last line of each is the build-check clause — the AI runs the build itself after writing, and only all-green counts as delivered.

### Prompt A: a guide page (notes → article)

```text
Turn the points below into a guide page (on skill-capable tools, /anvil-new-article works directly).
**Input:**
Game/Boss: <name>
Points: <spoken notes, mechanic observations, numbers — write as much as you captured>
**Requirements:**
Follow the AGENTS.md content rules; read docs/content-format.md and src/content.config.ts first.
Frontmatter: title ≤80 characters including the game name; description 40–165 characters; summary a 40–60 word direct answer;
category uses an existing key from navigation.ts; reuse existing tags; unverified content gets draft: true.
Body: no H1; question-shaped H2s with the first paragraph answering directly; numbers go into tables; use the Callout/Accordion/StatBar components.
Never fabricate numbers — write [to be added] for missing data and give me a separate list.
When done, run pnpm check-content && pnpm build; only all-green counts as complete. Fix failures and rerun.
```

### Prompt B: the codes page (easiest traffic, easiest disaster)

Codes may come **only from a list you have seen with your own eyes** (official Twitter, official Discord, developer streams). **If the AI invents one fake code and players redeem nothing, nobody ever trusts your site again** — the thickest red line in this book.

```text
Create a codes page for <game name> (category: codes, slug: all-codes).
Codes may come only from the list below — not a single one may be invented or "inferred":
<code | reward | expiry date | source>
Write all data into the frontmatter codes array (code/reward/status/expiryDate/source);
the body covers how-to-redeem steps + FAQ (question-shaped H2s); the title includes year and month.
When done, run pnpm check-content && pnpm build; only all-green counts as complete.
```

### Prompt C: a tier list page (your ratings → table)

```text
Write a tier list page from my ratings.
**Input:** <character/gear list + my ranking reasons>
Requirements: table-first, one conclusive reason per row; flag contested placements with a Callout warn noting version sensitivity;
add gameVersion to frontmatter; mark untested entries [to be added] or make the whole page draft: true — no fabricating.
When done, run pnpm check-content && pnpm build; only all-green counts as complete.
```

### Prompt D: images and video (pages people can see, not just read)

Text-only pages don't compete in the game-wiki world. The template's media features (cover / gallery / inline images / video) are all built in — what's missing is you feeding the AI the material. **Screenshots and videos must be ones you captured yourself** — the AI cannot generate "gameplay screenshots" for you. Skip this step if you have no material yet, and don't lift images from the web (copyright).

- **Screenshots** (boss close-ups / gear panels / maps): drag them into the chat. Inline body images go to `public/images/articles/`; mechanics/route diagrams go to the bottom gallery. 16:9 landscape works best.
- **Video** (your own clears, uploaded to YouTube): the AI registers and embeds it — it only loads on click, so it never slows the page down.
- How many images each page type should carry: see the media-density table in `docs/content-format.md`.

```text
Add media to the article at <article path>.
**Input**
Screenshots: <drag into the chat, or list file paths>
Video: <YouTube link> (delete this line if none)
Requirements:
Place per the media-density guidance in docs/content-format.md: inline body images use
![alt](/images/articles/...) with alt text describing what's actually in the image;
mechanics/route diagrams go to frontmatter gallery, each with caption + alt;
register the video in frontmatter videos and inline it under the matching section.
Never describe anything the image doesn't show.
When done, run pnpm check-content && pnpm build; only all-green counts as complete.
```

## Step 4: Accept each page the moment it's written

**Don't stockpile 10 and check them together — errors copy themselves in batches.** Each page passes three checks:

1. **The build check the AI reports itself**: `pnpm check-content && pnpm build` all green (the prompt already forces it to run; you just confirm it really ran and the last line has no red).
2. **Eyes on the page**: open this page with `pnpm dev` — is the title right, do tables swipe sideways on phones, does a code copy with one tap.
3. **Answer the AI's questions**: when the AI lists a "to be added" list, supply the data and let it fill the page in; when it asks either-or questions, answer clearly.

If the AI listed a "to be added" list and you don't have the data yet: keep that page `draft: true` and move on to the next one.

## How many pages is enough: 10 to 15 for v1, released in batches

Field-tested conclusion: **too many pages in the first version dilutes quality and drags the whole site's rankings down.** Set the rhythm like this:

- **Launch v1 with 10 to 15 core pages** — codes, tier list, and guides first (exactly the volume this lesson produces);
- Add more **in weekly batches of 10+** — flip `draft: true` pages to published one verified page at a time; never dump everything at once;
- When you later scale to dozens of pages via the pick-your-game lesson0's pipeline, the same rhythm still rules: batch **generation** is fine, batch **release** is not.

## 7 things you must never do

1. **Let the AI invent codes, stats, or drop rates.** Better to leave a gap marked [to be added].
2. **Generate 10 pages at once without verifying each one.** Every page passes the build check on its own.
3. **Publish unverified content without marking it draft.**
4. **Invent new categories or new tags.** Categories and tags only reuse the existing set (the one the the run-your-site lesson CLI built).
5. **Ask the AI to change site code to fulfill a copy need.** Copy belongs in config; the code is a load-bearing wall.
6. **Say "write a good guide" and call it a prompt.** Materials are the first-class citizen of a prompt.
7. **Hand-edit the build output, or skip git saves.** Every change goes through source files; after writing, have the AI commit for you (one save point per article, easy rollback).

## If you get stuck

- **"The AI says build failed"**: have it paste the last error line and fix it per the error — the prompt already says "fix failures and rerun"; most of the time it repairs itself.
- **"The AI doesn't know which category to use"**: tell it the Categories you entered in the run-your-site lesson, e.g. `codes, guides, bosses`.
- **"I can't see the page"**: make sure `pnpm dev` is running; also make sure that article isn't `draft: true` (drafts are visible in dev mode only — a real build never publishes them).
- **"I want to add Chinese-language articles"**: not yet — get the English site working first; once the site is live and earning, the developer manual's [Add Categories and Languages](/landing/docs/categories-and-locales) chapter has the full set of translation prompts.

## ✅ Acceptance criteria (all must hold)

- The site holds 8 to 10 build-check-passing articles (the codes page must be among them — it's the traffic entrance)
- `pnpm build` ends with no red error on the last line
- ☐ You have eyeballed every page's rendered result
- ☐ Every "to be added" list is either filled in, or that article still carries draft

## Next step

All the content lives on your computer — but players and Google still can't see you. Next lesson: move the site onto Cloudflare's free shelf. [Go to the go-live lesson · Take Your Site Live](/landing/docs/put-site-online)
