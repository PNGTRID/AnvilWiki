---
title: "Run Your Site: See It Working in Three Steps"
description: "Fork the template into your account, clone it to your computer, and pnpm dev opens the sample site at localhost:4321 — three steps, each with what you'll see."
manual: learn
order: 10
stage: "Stand It Up"
icon: lucide:rocket
tldr: "Three steps: ① fork — hit Fork on GitHub to copy the whole store into your name (the original keeps trading; yours is free to change); ② clone + pnpm install — move the repo onto your computer and install every part; ③ pnpm dev — open localhost:4321 and see the sample wiki for the fictional game Anvil Quest. This lesson runs the sample as-is; rebranding is the next lesson's job."
updated: 2026-09-02
---

## A true scene first

The AnvilWiki template is a **fully decorated bakery**: shelves, register, and lighting all in place, plus a complete set of sample cakes — a guide site for the fictional game "Anvil Quest". Opening your own shop takes two moves: copy the entire store into your name, then swap the samples for your cakes. This lesson does the first move — **copy, and get it running**; the rebrand is next lesson.

## What you'll have when this lesson is done

- A complete copy of the site code under your name (one on GitHub, one on your computer)
- A running website in your browser: `http://localhost:4321` shows the sample guide site

### Step 1: copy the template into your name (fork)

**What**: duplicate the whole AnvilWiki store under your account. The original keeps trading; your copy is yours to change.
**How**: log in to GitHub, open [github.com/PNGTRID/AnvilWiki](https://github.com/PNGTRID/AnvilWiki), hit **Fork** in the top right, then **Create fork**.
**You'll see**: you land on `your-username/AnvilWiki`.
**Check**: the repo name at the top left shows your username, not PNGTRID.

### Step 2: move the repo onto your computer (clone + install)

**What**: download your copy in full and install every part the site needs to run.
**How**: on your repo page hit the green **Code** button and copy the address; in the terminal run (`<your-username>` replaced):

```bash
git clone https://github.com/<your-username>/AnvilWiki.git
cd AnvilWiki
pnpm install
```

**You'll see**: `pnpm install` runs from seconds to a few minutes, scrolls a wall of package names, stops with no red error.
**Check**: type `ls` — you see `package.json` and friends.

### Step 3: get it running, look at the sample

**What**: start the site locally and see what the template looks like.
**How**: in the terminal:

```bash
pnpm dev
```

**You'll see**: a few green startup lines containing `localhost:4321`.
**Check**: open [localhost:4321](http://localhost:4321) — a guide site for the fictional game "Anvil Quest", the exact thing you'll rebrand next lesson. When done, return to the terminal and press `Control + C` to stop it (you'll start it again next lesson).

## Three classic mistakes (made for you in advance)

- **localhost:4321 won't open**: nine times in ten, `pnpm dev` has stopped (window closed or Control+C pressed) — run it again. Also: don't type `https://` — local has no certificate.
- **Every command says not a git repository after reopening the terminal**: the fresh terminal starts in your home directory, not the site folder — `cd AnvilWiki` first.
- **`pnpm install` prints a wall of red**: read the **last line** — 90% of the answer lives there; still opaque, paste the whole red block to AI and ask "how do I fix this error".

## Three words to know (just these)

- **fork**: copy someone's repo into your own GitHub account. The original is untouched.
- **clone**: download your repo wholesale onto your computer. Fork is in the cloud; clone is on disk.
- **dev server**: the local server started by `pnpm dev` — while it runs, localhost:4321 is alive; stop it and the site sleeps.

## ✅ Acceptance (all must hold)

- ☐ `your-username/AnvilWiki` exists under your account
- ☐ `ls` shows `package.json`
- ☐ localhost:4321 showed the sample site, and you stopped it with `Control + C`

## Next lesson

The sample runs — under someone else's name. Next lesson: one Q&A command swaps in your game name, theme color, categories, and languages. [Go to Lesson 11 · Make It Yours](/landing/docs/rebrand-your-site)
