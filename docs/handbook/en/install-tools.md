---
title: "Install the 6 Tools: Set Up Once, Never Again"
description: "Terminal, GitHub account (with 2FA), Node, pnpm, Git, AI assistant — each with what you'll see and a check. Installed once, used every lesson, 30 minutes total."
manual: learn
order: 9
stage: "Stand It Up"
icon: lucide:wrench
tldr: "This lesson is pure setup: terminal (the window where you command the computer), GitHub account (the vault holding your site — enable two-factor auth immediately and store recovery codes), Node 22+ (the engine base), pnpm (the installer), Git (the transporter), AI assistant (your writing partner). Check off each tool as it lands; pass all six before moving on — you will never install them again."
updated: 2026-09-02
---

## A true scene first

Before cooking, lay out the pans — this lesson lays out the pans. The six tools every later lesson uses get installed once, here; **skip any one and the first command of the next lesson jams**. The good news: once is forever.

## What you'll have when this lesson is done

- Six tools in place, each verified working
- A GitHub account with two-factor auth on and recovery codes stored — **it is the vault for everything you own in this business** (site, content, future ad revenue all hang on it)

### Tool 1: the terminal (where you type commands at the computer)

- **Mac**: press `Command + Space`, type "Terminal", hit return.
- **Windows**: Start menu, type "PowerShell", hit return.

**You'll see**: a blinking cursor with your computer name and a `~` or `>`. Whenever this manual says "type in the terminal", it means here, then Enter.

### Tool 2: GitHub account + two-factor auth (your vault)

Open [github.com](https://github.com), hit Sign up in the top right, register free with your email. Pick a serious username — it appears in your site's address.

Then, **immediately do two things (30 seconds)**: Settings → Password and authentication → enable **Two-factor authentication**; store the **recovery codes** in a password manager or on paper. Why the hurry: if your GitHub account is stolen, your site, your articles, and your future ad income all change hands; with 2FA on, a stolen password alone gets the thief nothing. Recovery codes are the only door back if you lose your phone — lock them somewhere only you know.

**You'll see**: you can log in, your avatar shows top right, and 2FA reads enabled.

### Tool 3: Node (the engine base)

Node is the base software that runs this template — version **22.13 or newer** required.

- Open [nodejs.org](https://nodejs.org), download the LTS build on the left, install, next-next-finish.
- Then open a **fresh terminal** (old ones must be closed and reopened), type `node -v`.

**You'll see**: something like `v22.14.0` — starting with 22 or higher.

### Tool 4: pnpm (the installer — one command for all site parts)

In the terminal:

```bash
npm install -g pnpm
```

**You'll see**: a few lines of progress, no red error at the end. Type `pnpm -v` — a version number means done.

### Tool 5: Git (the transporter)

- **Mac**: try `git -v` first — many Macs ship with it; if not, `brew install git` (no brew? install it from [brew.sh](https://brew.sh) first).
- **Windows**: download and install from [git-scm.com](https://git-scm.com), next-next-finish.

**You'll see**: `git -v` prints a version number.

### Tool 6: an AI coding assistant (your writing partner)

Install **one** of ZCode / [Claude Code](https://claude.com/claude-code) / [Codex](https://openai.com/codex) / [Cursor](https://cursor.com) (all have free tiers). Unused this lesson — it becomes the star at page production.

**You'll see**: the app opens and you know how to start a new conversation.

## Three classic mistakes (made for you in advance)

- **`pnpm` / `node` says command not found**: almost always "installed but never reopened the terminal" — old terminals don't know new tools. Close and reopen.
- **Node's site won't open, downloads crawl**: switch networks, or download the installer over phone hotspot and move it across. Without Node everything stalls — worth ten extra minutes.
- **brew install git errors on Mac**: first check whether `git -v` already works (many Macs ship Git — then skip brew); if you truly need brew, copy the command on [brew.sh](https://brew.sh)'s front page **character for character**.

## Three words to know (just these)

- **Terminal**: the window where you command the computer by typing — every later lesson operates here.
- **Repository (repo)**: a GitHub place holding one complete set of site files — your shop's storeroom.
- **LTS**: Long-Term Support — the most stable, longest-maintained build. Always pick it.

## ✅ Acceptance (all must hold)

- ☐ Terminal opens; you know where to type
- ☐ `node -v` shows 22+, `pnpm -v` and `git -v` both print versions
- ☐ GitHub login works, **2FA is on, recovery codes are stored**
- ☐ AI assistant installed; you can start a conversation

## Next lesson

Tools ready. Next lesson copies the whole store into your name and gets a website running in your browser within 30 minutes. [Go to Lesson 10 · Run Your Site](/landing/docs/run-your-site)
