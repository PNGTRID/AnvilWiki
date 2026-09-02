---
title: "Make It Yours: One Command, One Q&A"
description: "pnpm apply-template asks one question at a time and rewrites every config. Full 15-question answer table, a 2-minute favicon swap, and the acceptance checklist."
manual: learn
order: 11
stage: "Stand It Up"
icon: lucide:paintbrush
tldr: "Run pnpm apply-template; it asks one question at a time — answer from the table (unsure? Enter takes the default): full/short name, domain, tagline, description, theme color, locales, categories, 15 in all. Then pnpm check-config shows ✅ and pnpm build runs red-free, with your game name, color, and categories live at localhost:4321. Finally swap the icon: pnpm gen-assets generates a full set, or upload your own at favicon.io. Preview changes first with --dry-run."
updated: 2026-09-02
---

## A true scene first

The store is copied — still wearing someone else's sign. This lesson swaps the sign with one command: `pnpm apply-template` interviews you like a bank clerk, one question at a time, and rewrites every config file for you — **you never open a config file by hand**.

## What you'll have when this lesson is done

- A site entirely yours: game name, theme color, categories, languages, icon
- A config-consistency green light: `pnpm check-config` reads ✅

### Step 1: run the rebrand command, answer from the table

Type `pnpm apply-template`; it asks question by question, Enter after each; **unsure? Enter takes the default**:

| It asks | You answer | Why |
|---|---|---|
| Full game name | The game's full English name, e.g. `Blade Ball` | Used in the site title and search results |
| Short name | Enter (auto-shortened) | The compact name on phones |
| Domain | Your domain, or `your-username.pages.dev` if none (the address doesn't exist yet — deploying creates it) | Tells the site its official address; change it after buying a domain |
| Hero tagline | One-line pitch, e.g. `Your home for everything Blade Ball` | The line under the homepage headline |
| Site description | A 40-165 character description including the game name | The blurb shown in Google results |
| Legal notice | Enter (default) | Disclaimer: unofficial, unaffiliated |
| Official game URL | The game's site or store page | Used in site metadata |
| Theme color | A `#` hex code, e.g. `#7c3aed` | The site-wide accent; light and dark sets generated |
| Platform / Developer / Genre | Fill in facts; unknown → Enter | Display only |
| Release date | e.g. `2026-01-15`; unknown → Enter | Display only |
| Locales | How many languages. English only → Enter (`en`); English+Chinese → `en,zh`. **First entry is the default; en is required** | English has the largest search volume — lead with it |
| Categories | Your site sections, lowercase comma-separated, e.g. `codes,guides,bosses`. Common: codes / guides / bosses / items / tier-list / characters | The top navigation is built from this |
| Clear demo content? | Enter (default no) | Keep sample articles as reference; clear before launch |
| Homepage preset | Enter (pick 1) | 1 = codes-style homepage (most people), 2 = guides-style, 3 = keep the sample |
| Remove landing page? | Enter (default yes) | /landing is the template project's own pitch page — your game site doesn't need it |

**You'll see**: the command rewrites files one by one, a green ✅ per line, a completion note at the end.
**Check**: run `pnpm check-config` — it prints "✅ Config is consistent".

> Two tips: to preview first, run `pnpm apply-template --dry-run` (prints the plan, changes nothing). And the **Initialize AnvilWiki** button on the repo's Actions tab **only does final cleanup** — it will not swap your game name, color, or languages; the full rebrand lives only in this local command.

### Step 2: swap the icon (2 minutes, strongly recommended)

The command rewrites all the text, but **the icon is an image no machine can draw for you** — skip it and your site launches wearing the template's anvil. Two roads:

- **Easy**: run `pnpm gen-assets` — it generates the full icon set and homepage image from your theme color.
- **Custom**: open [favicon.io/favicon-converter](https://favicon.io/favicon-converter/) → upload a square image of your game → generate and download → drag **all** the icon files into `public/` overwriting the same names; while there, replace `public/images/` hero.webp (the homepage image) with yours.

**You'll see**: refresh localhost:4321 — the tab icon is yours.

### Step 3: verify with your own eyes

Start `pnpm dev`, open [localhost:4321](http://localhost:4321), and check:

- ☐ Homepage title is your game (no more Anvil Quest)
- ☐ Accent color is yours (no more orange)
- ☐ Tab icon is yours (no more anvil)
- ☐ Navigation shows only your categories
- ☐ Normal at phone width (F12 → device icon)

Then run `pnpm build` once — no red error on the last line, and this lesson is done.

## Three classic mistakes (made for you in advance)

- **Wrong answer mid-run**: press `Control + C`, run again — it overwrites with the new answers; nothing corrupts.
- **check-config glows red**: nine times in ten a category is inconsistent across the three places (config, locale files, content folders) — the red lines point at the exact spot; fix what they name, don't guess.
- **Skipping the icon**: every word rebranded but the anvil still in the tab screams "template shell". Two minutes; don't skip.

## Three words to know (just these)

- **Rebrand**: swapping the template's sample identity for your game — this whole lesson.
- **Placeholder domain**: the temporary address (`username.pages.dev`) you enter before buying a domain; it works after deploy, changeable later.
- **Verify**: checking against a list with your own eyes, not "looks fine".

> **Going deeper**: non-interactive mode (`--answers answers.json` — for batch sites or AI-driven runs), re-run safety rules, and a field-by-field reference live in the repo doc [docs/apply-template.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/apply-template.md).

## ✅ Acceptance (all must hold)

- ☐ `pnpm check-config` shows ✅ and `pnpm build` runs red-free
- ☐ At localhost:4321 the game name, color, categories, and icon are all yours
- ☐ You remember what you put in the domain field (pages.dev placeholder is fine; change it after buying)

## Next lesson

The store is yours — one last look at the storefront? Next lesson covers the recolor rule (why all 8 lines move together) and the right way to edit homepage copy — or skip straight to content production. [Go to Lesson 12 · Theme & Homepage](/landing/docs/theme-and-homepage)
