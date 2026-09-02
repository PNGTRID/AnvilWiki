---
title: "Copy the Template, Get Your Site Running"
description: "Fork the AnvilWiki template to your GitHub, clone it locally, and run one Q&A command that swaps the demo for your game — 30 minutes to your site in the browser."
manual: learn
order: 10
stage: "Stand It Up"
icon: lucide:rocket
tldr: "Four steps: fork (copy the fully decorated bakery into your name) → clone (move it onto your computer) → pnpm install (install every part) → pnpm apply-template (one question-and-answer command that swaps the game name, theme color, categories, and languages for yours). Every step tells you what you'll see, and the finale is acceptance at localhost:4321 in the browser."
updated: 2026-08-17
---

## Where you are, and what this lesson solves

Last lesson the tools were all installed, and your game is already picked — but right now you still have nothing. By the end of this lesson, your computer holds a full set of website files, and the browser opens a running site that carries your game's name.

Think of it as opening a bakery: the AnvilWiki template is a **bakery already fully decorated** (shelves, counter, and lights all in place, with a set of sample cakes on display). Your job is to copy the whole bakery and make it yours, then swap the samples for your own cakes.

## What you'll have when this lesson is done

- A working website on your computer — open `http://localhost:4321` in a browser to see it
- It shows your game's name, your theme color, and your categories

### Step 1: Copy the template repo into your GitHub (fork)

**What to do**: copy the entire AnvilWiki bakery under your name. The original store keeps running as usual; the copy you made is yours to change freely.
**How to do it**: log into GitHub, open [github.com/PNGTRID/AnvilWiki](https://github.com/PNGTRID/AnvilWiki), click the **Fork** button at the top right, then click **Create fork**.
**You'll see**: you land on the `your-username/AnvilWiki` repo page.
**Confirm it worked**: the repo name at the top left shows your username, not PNGTRID.

### Step 2: Move the repo onto your computer (clone)

**What to do**: download your GitHub copy, the whole thing, to your local machine.
**How to do it**: on your repo page, click the green **Code** button and copy the address; open the terminal and enter in order (replace `<your-username>` with your GitHub username):

```bash
git clone https://github.com/<your-username>/AnvilWiki.git
cd AnvilWiki
pnpm install
```

**You'll see**: `pnpm install` runs for ten seconds to a few minutes, scrolls a pile of package names, and stops with no red error.
**Confirm it worked**: type `ls`, press Enter, and you can see `package.json` among a row of files.

### Step 3: Run it locally and take a look

**What to do**: first see what this "sample bakery" looks like.
**How to do it**: in the terminal, type:

```bash
pnpm dev
```

**You'll see**: a few green startup lines containing `localhost:4321`.
**Confirm it worked**: open [localhost:4321](http://localhost:4321) in a browser — a guide site for a fictional game, "Anvil Quest". That's the look you're about to replace. When you've seen enough, go back to the terminal and press `Control + C` to stop it.

### Step 4: Swap in your game (one question-and-answer command)

**What to do**: replace the demo site's game name, colors, categories, and languages — all of them — with yours.
**How to do it**: type `pnpm apply-template` in the terminal. It asks you one question at a time; answer using the table below (press Enter after each answer; when unsure, just press Enter to take the default):

| What it asks | What you enter | Why |
|---|---|---|
| Full game name | Your game's full English name, e.g. `Blade Ball` | Used in the site title and search results |
| Short name | Just press Enter (auto-abbreviates) | The short name shown on phones |
| Domain | Your domain; if you don't have one, enter `your-username.pages.dev` (e.g. `xiaoming.pages.dev` — this address doesn't exist yet; it's auto-created after deploy) | Tells the site "which is my official address"; change it back once you buy a domain |
| Hero tagline | A one-sentence hook, e.g. `Your home for everything Blade Ball` | The line under the homepage headline |
| Site description | A 40 to 165 character site intro that includes the game name | The description Google shows in search results |
| Legal notice | Just press Enter (default) | Disclaimer: unofficial, not affiliated with the game maker |
| Official game URL | The game's official site or store page | Used in site metadata |
| Theme color | A six-digit hex starting with `#`, e.g. `#7c3aed` | The site's brand color; the command builds the light and dark sets automatically |
| Platform / Developer / Genre | Fill in as true; if unsure, press Enter | Display use |
| Release date | The game's release date, format like `2026-01-15`; if unknown, press Enter to leave it empty | Display use |
| Locales | How many languages you'll run. English only? Press Enter (`en`). English + Chinese? Enter `en,zh`. **The first is the default language, and en must be included** | English players have the largest search volume — build English-first |
| Categories | Your site's categories, lowercase and comma-separated, e.g. `codes,guides,bosses`. Common: codes / guides / bosses / items / tier-list / characters | The top navigation is generated from this |
| Clear demo content? | Press Enter (default no) | Keep the demo articles as reference for now; clear them before launch |
| Homepage preset | Press Enter (picks 1) | 1 = codes-style homepage (most people), 2 = guides-style, 3 = keep the demo |
| Remove landing page? | Press Enter (default yes) | /landing is the AnvilWiki project's own intro page; your game site doesn't need it, auto-removed |

**You'll see**: the command rewrites files one by one, each line prefixed with a green ✅, and it reports done at the end.
**Confirm it worked**: type `pnpm check-config` in the terminal, press Enter, and it prints "✅ Config is consistent".

Small tip: to preview what it will change before letting it act, run `pnpm apply-template --dry-run` first (prints the plan only, changes nothing). Also, GitHub has a button called **Initialize AnvilWiki** (in the repo's Actions tab), but it **only does final cleanup** — it does not swap in your game name, your theme color, or your languages. The full replacement only happens with this local command.

### Step 5: Swap in your icons (2 minutes, strongly recommended)

**What to do**: replace the anvil icons in the browser tab and phone home screens with your game's icon. The previous step rewrites all text, but icons are image files — no command can draw them for you. Skip this and your site ships wearing the template demo's icon.
**How to do it**: open [favicon.io/favicon-converter](https://favicon.io/favicon-converter/) → upload one image of your game (square works best) → generate and download → unzip, then **drag every icon file into the project's `public/` folder, overwriting the same-named files** (favicon.ico, favicon-16x16.png, favicon-32x32.png, favicon.svg, apple-touch-icon.png, android-chrome-192x192.png, android-chrome-512x512.png). While you're at it, also replace hero.webp / hero.svg in `public/images/` (the homepage hero image) with your own. Or skip the manual work: the template ships a `pnpm gen-assets` command that generates the full icon set plus the homepage hero image from your theme color in one run (custom artwork still welcome).
**You'll see**: after refreshing localhost:4321, the tab icon is your image.
**Confirm it worked**: no anvil icons left in `public/`; "Add to Home Screen" on a phone shows your icon too.

### Step 6: Verify your site with your own eyes

**What to do**: confirm the store sign really changed.
**How to do it**: type `pnpm dev` in the terminal, open [localhost:4321](http://localhost:4321) in the browser.
**You'll see**: the homepage shows your game's name and theme color, and the navigation bar shows the categories you chose.
**Confirm it worked** — check item by item:

- ☐ The homepage title is your game (no longer Anvil Quest)
- ☐ The brand color is the one you picked (no longer orange)
- ☐ The tab icon is your game (no longer the anvil — see Step 5)
- ☐ Navigation shows only the categories you chose
- ☐ It also holds up at phone width (press F12 in the browser, then click the device icon to switch to a phone view)

When you've seen enough, `Control + C` to stop it.

## If you get stuck

- **`pnpm install` or build prints a wall of red**: read the **last line** first — 90% of the answer lives there; if you really can't parse it, copy the whole red block, hand it to your AI assistant, and ask "how do I fix this error".
- **localhost:4321 won't open**: make sure `pnpm dev` is still running in the terminal (window not closed, no Control + C pressed); and don't type the address as https.
- **You answered apply-template wrong mid-way**: press `Control + C` to cancel and run it again — it overwrites with the new answers.
- **"After reopening the terminal every command says not a git repository"**: a fresh terminal starts in your home folder — type `cd AnvilWiki` first to go back to the site folder, then continue.

## ✅ Acceptance criteria (all must hold)

- Commands: `pnpm check-config` shows ✅, and `pnpm build` finishes with no red error on the last line
- Pages: on localhost:4321, the game name, theme color, categories, and **tab icon** are all yours
- ☐ You remember what you entered for Domain (a pages.dev placeholder for now is fine; come back and change it after you buy a domain)

## Next step

The store is decorated, but the shelves still hold sample goods. The next lesson is the best part of the whole book: have AI write 10 build-check-passing guides in one day. [Go to Let AI Write 10 Guides for You](/landing/docs/first-10-pages)
