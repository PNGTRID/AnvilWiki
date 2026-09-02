---
title: "Before You Set Off: Install the 6 Tools"
description: "Terminal, GitHub, Node, pnpm, Git, and an AI assistant — installed once, each with a what-you'll-see and a confirmation point. Every later chapter uses them."
manual: learn
order: 9
stage: "Stand It Up"
icon: lucide:wrench
tldr: "This lesson is pure software installation: the terminal (the window where you type commands), a GitHub account (the warehouse holding your site files), Node (the engine's foundation), pnpm (the mover), Git (the delivery truck), and an AI assistant (your content-writing partner). Take them one at a time, tick each off as it lands. Thirty minutes total, and you never install them again."
updated: 2026-08-17
---

## Where you are, and what this lesson solves

In the pick-your-game lesson you picked your game. Before building anything, get the tools ready — like setting the pots and bowls on the counter before you start cooking. What you install in this lesson is a **one-time install** that every later chapter uses; skip it, and the first command of the next lesson will stop you cold.

## What you'll have when this lesson is done

- All 6 tools in place, each verified to work
- An AI assistant you can name and will use every day from now on

### Tool 1: the terminal (the window where you type commands)

The terminal is the window where you give your computer orders by typing.

- **Mac**: press `Command + Space`, type "Terminal", press Enter to open it.
- **Windows**: open the Start menu, type "PowerShell", press Enter to open it.

**Confirm it worked**: the window shows a blinking cursor next to your computer's name and a `~` or `>` symbol. This is the terminal. Whenever the book says "in the terminal, type", this is where you type and press Enter.

### Tool 2: a GitHub account (the warehouse that holds your site's files)

GitHub is where your website files live — your storefront warehouse, so to speak.

Open [github.com](https://github.com), click Sign up at the top right, and register a free account with your email. Pick a sensible username — it appears in your website address.

**Confirm it worked**: you can log in, and your avatar shows at the top right.

### Tool 3: Node (the foundation the site engine sits on)

Node is the base software this website template runs on; you need version **22.13 or newer**.

- Open [nodejs.org](https://nodejs.org), download the LTS (long-term support) version on the left, double-click to install, keep clicking Next.
- After installing, **open a new terminal** (close the old one and reopen it), type `node -v`, press Enter.

**You'll see**: a line like `v22.14.0`.
**Confirm it worked**: the number starts with 22 or higher. If you see command not found, either the terminal wasn't reopened or the install didn't finish — do it again.

### Tool 4: pnpm (the mover — one command installs every site part)

In the terminal, type (pnpm's [official site](https://pnpm.io) has more background; here we just install it):

```bash
npm install -g pnpm
```

**You'll see**: a few lines of progress, with no red error at the end.
**Confirm it worked**: type `pnpm -v`, press Enter, and a version number appears.

### Tool 5: Git (the delivery truck that carries files into the warehouse)

- **Mac**: type `brew install git` in the terminal (no brew? Install it first with the command on [brew.sh](https://brew.sh)'s homepage). Or simpler: after installing Node, many Macs already ship Git — try `git -v` first; if a version number shows, skip this.
- **Windows**: download from [git-scm.com](https://git-scm.com), install, keep clicking Next.

**Confirm it worked**: type `git -v` in the terminal and a version number appears.

### Tool 6: an AI coding assistant (your content-writing partner — every later chapter uses it)

Install **any one** of ZCode / [Claude Code](https://claude.com/claude-code) / [Codex](https://openai.com/codex) / [Cursor](https://cursor.com) (all have free tiers). You won't need it this lesson; in the page-production lesson it becomes the star.

**Confirm it worked**: the app opens, and you know how to start a new chat.

## If you get stuck

- **"Typing pnpm says command not found"**: pnpm didn't install, or you didn't reopen the terminal after installing. Close the terminal, reopen it, try again.
- **"The Node website won't open / downloads slowly"**: switch networks and retry, or download the installer over a phone hotspot and transfer it to the computer.
- **"Typing brew install git on Mac errors out"**: first check whether `git -v` already works (many Macs ship Git); if you truly need brew, copy the command on the [brew.sh](https://brew.sh) homepage word for word.

## ✅ Acceptance criteria (all must hold)

- ☐ The terminal opens, and you know where to type
- ☐ `node -v` shows 22 or higher, and `pnpm -v` and `git -v` both show version numbers
- ☐ GitHub lets you log in
- ☐ The AI assistant is installed and can start a new chat

## Next step

The tools are all in place — the next lesson copies the template down and gets a site that belongs to your game running in your browser in 30 minutes. [Go to the run-your-site lesson · Copy the Template, Get Your Site Running](/landing/docs/launch-your-site)
