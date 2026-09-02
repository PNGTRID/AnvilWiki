---
title: "Your First Page: One Hour of Play, One QA-Passing Guide"
description: "Open the site folder in your AI assistant, play an hour, take 20 notes, paste the guide prompt. Frontmatter, the QA gate, and draft — plus the intent table."
manual: learn
order: 13
stage: "Content Engine"
icon: lucide:bot
tldr: "Google ranks pages that answer players' questions — an empty site earns nothing. Three steps to page one: ① open the AnvilWiki folder in your AI assistant (it loads the format rules itself); ② play one hour, jot 20 fragment notes on your phone; ③ paste the guide-page prompt with your notes in the placeholders. AI writes the frontmatter, runs the QA gate, and lists missing data for you — fill it or flag draft; it never invents."
updated: 2026-09-02
---

## A true scene first

Your site runs, but the shelves still hold someone else's sample goods — and Google only ranks pages that answer player questions. An empty site earns no traffic. The good news: **you won't write a single sentence yourself**. You play, take notes, and paste prompts; AI produces pages that meet the spec, and every page passes a QA gate automatically.

Three new words first — the next five lessons run on them:

- **frontmatter (the registration card)**: the block between the two `---` at the top of every article — title, description, category. AI fills it; you never hand-write it.
- **the QA gate (Zod schema)**: a built-in inspector — a malformed card fails `pnpm build` and tells you exactly what's wrong. It blocks junk before players see it.
- **draft (the flag)**: unverified content gets `draft: true` — visible only to you; flip it off once verified.

**Which query wants which page** (the intent table — the next three lessons each take one row):

| Players search | They want | You build |
|---|---|---|
| `codes / redeem` | redeemable codes | the codes page (Lesson 14) |
| `how to` | to learn the game | **a guide page (this lesson)** |
| `best / tier` | to know who's strong | a tier list (Lesson 15) |

### Step 1: point your AI assistant at the site folder

Open tool #6 from Lesson 9: **Cursor / ZCode** — use "Open Folder" and pick `AnvilWiki`; **Claude Code / Codex** (terminal) — `cd AnvilWiki` first, then start the tool. Open a new conversation.

**You'll see**: the path ends in `AnvilWiki`. Ask it "what folder are you in?" to confirm.

It now knows three things unprompted: the site's format rules (AGENTS.md), the built-in skills, and the card schema.

### Step 2: play one hour, take notes

How well AI writes is **eight-tenths decided by your material**. Fragments typed on your phone are fine:

- What mechanics does this boss have? Where did I die, and why each time?
- What build/route got me through?
- Where did I see that code? What's the code, the reward, the expiry?

Twenty fragments per hour covers three pages. Want a system later? The repo's [`requirements/`](https://github.com/PNGTRID/AnvilWiki/tree/main/requirements) has two fill-in templates (**fact-source table** + **benchmark table**) each with a paste-ready research prompt — notes are enough for now.

### Step 3: the guide-page prompt (paste whole, `<>` replaced)

```text
Turn the points below into a guide page (tools with skills: use /anvil-new-article).
[Material]
Game/Boss: <name>
Points: <spoken notes, mechanic observations, numbers — as many as you have>
[Requirements]
Follow AGENTS.md content rules; first read docs/content-format.md and src/content.config.ts.
frontmatter: title ≤80 chars incl. game name; description 40–165 chars; summary 40–60 words, direct answer;
category from existing navigation.ts keys; reuse existing tags; add draft: true for anything unverified.
Body: no H1; H2s phrased as questions with the answer in the first paragraph; data in tables; use Callout/Accordion/StatBar.
Never invent numbers — missing data becomes [TBD] plus a list of questions for me.
Run pnpm check-content && pnpm build; both green or not done; on failure, fix and rerun.
```

**You'll see**: AI reads the rule files, writes the page, runs the QA gate, reports all-green.
**Check**: `pnpm dev`, open the article — title, tables, first-paragraph answer all there.

## Three classic mistakes (made for you in advance)

- **"Write me a good guide"**: material is the first citizen of any prompt — vague in, invented out.
- **Letting AI fill in numbers it cannot know**: missing data becomes `[TBD]` and a question list — empty beats invented.
- **Inventing new categories or tags**: use only the set created during the rebrand; new categories are Development Manual territory.

## Three words to know (just these)

Covered above: frontmatter, the QA gate, draft. Close the manual — can you say each in one sentence?

## ✅ Acceptance (all must hold)

- ☐ Your first guide page passes `pnpm check-content && pnpm build` (all green)
- ☐ You eyeballed the page: title right, tables render, answer up front
- ☐ The TBD list is either filled in, or the page wears a draft flag

## Next lesson

Guides mastered. Next lesson is the highest-traffic page on the site — and the easiest to wreck: the codes page, with the thickest red line in the manual. [Go to Lesson 14 · The Codes Page](/landing/docs/codes-page)
