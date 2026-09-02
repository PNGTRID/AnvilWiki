---
title: "Take Your Site Live: Onto the Free Shelf"
description: "Push the site to GitHub, connect Cloudflare's free shelf for a global URL, handle the beginner trap (which settings win), and buy-and-bind a domain. All free."
manual: learn
order: 12
stage: "Launch & Get Indexed"
icon: lucide:cloud
tldr: "Shelving takes three steps: git push sends files to GitHub; Cloudflare Pages connects to the repo in a few clicks and hands you a free URL in two or three minutes; then delete wrangler.toml (settings have two registries — while the file exists, web settings are ignored; beginners delete the file, then use only the web UI). Finally, a full domain-buying side quest — required before AdSense money."
updated: 2026-08-17
---

## Where you are, and what this lesson solves

Your 10 pages sit on your computer — but players can't reach them. It's like a book fresh from the print shop that hasn't been placed on any store shelf.

This lesson puts the book on the shelf: first onto GitHub, then onto Cloudflare's free shelf (no money down, effectively unlimited bandwidth), and you come away with a URL the whole world can open.

## What you'll have when this lesson is done

- A URL anyone in the world can open (a free domain first; swap in your own later)
- The site's "settings registry" straightened out, so turning on ads later won't trip you up

## A few words to know

- **Deploy**: putting your site files onto a server everyone can reach. What we use here is Cloudflare Pages — free.
- **Domain**: the site's street address, like `yourgame-wiki.com`. Use the free address first; switch to a real one before you earn.

### Step 1: Push the files to GitHub

**What to do**: for Cloudflare to reach the site files on your computer, they must first live on GitHub.
**How to do it**: in the terminal (inside the AnvilWiki folder), enter in order:

```bash
git add .
git commit -m "My game wiki, first version"
git push
```

**You'll see**: the first push pops up a GitHub login window; log into your account, then the terminal shows upload progress.
**Confirm it worked**: refresh your GitHub repo page and you can see folders like `docs` and `src`.

### Step 2: Connect the Cloudflare shelf

**What to do**: tell Cloudflare "my repo is here; every time I update, reshelve automatically".
**How to do it**:

1. Register / log in at [dash.cloudflare.com](https://dash.cloudflare.com) (free).
2. On the left, pick **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Authorize GitHub, select your AnvilWiki repo, click **Begin setup**.
4. Copy the build settings as-is:

| What it asks | What you enter |
|---|---|
| Project name | Anything, e.g. your game's name (it becomes part of the URL) |
| Production branch | `main` |
| Framework preset | Astro (usually auto-detected) |
| Build command | `pnpm build` |
| Build output directory | `dist` |

5. In the **Environment variables** area, add one variable: name `NODE_VERSION`, value `22`.
6. Click **Save and Deploy**.

**You'll see**: the build progress runs 2 to 3 minutes and ends with a `https://project-name.pages.dev` URL.
**Confirm it worked**: open that URL and see your game site — from this moment on, the whole world can reach it.

### Step 3: Handle the big beginner trap (which settings win)

**What to do**: delete a file called `wrangler.toml`. The reason in one sentence: the site's settings have two registries — this file in the repo, and the settings pages in the Cloudflare web UI. **While the file exists, the web settings are all ignored.** Beginners simply delete the file and use only the web UI from then on — clean, no traps.
**How to do it**: in the terminal, type:

```bash
git rm wrangler.toml
git commit -m "remove wrangler.toml"
git push
```

**You'll see**: `wrangler.toml` disappears from the GitHub repo's file list, and Cloudflare redeploys automatically once.
**Confirm it worked**: Cloudflare → your project → **Settings** → **Variables and Secrets** shows `NODE_VERSION = 22` (added in Step 2; it only truly takes effect now that the file is gone). From now on, every variable for ads or analytics gets added on this page.

> Advanced note: keeping the file and recording settings in the repo works too, but then `NODE_VERSION = "22"` and every other variable must live in the file's `[vars]` section, and the web settings are still ignored — details in the developer manual's feature-toggles chapter. Beginners, don't touch it; just delete the file.

### Step 4: Buy your own domain (skippable for now, needed before earning)

**What to do**: swap `project-name.pages.dev` for your own street address. **AdSense review basically requires a domain you own**, so you must buy one before earning (a few dozen dollars a year).
**How to do it**: search for a `.com` / `.wiki` domain at [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (sells at cost, no markup) or a registrar like [Porkbun](https://porkbun.com) and buy it; then Cloudflare Pages → your project → **Custom domains** → Set up, and follow the prompts to point the domain over (with DNS on Cloudflare, it's next-next-next the whole way).
**You'll see**: within minutes (a few hours at most), your domain opens your site.
**Confirm it worked**: once your domain opens the site, change both the Domain in the the run-your-site lesson config and Cloudflare's `SITE_URL` variable to this domain (must start with `https://`, no exceptions), and redeploy.

## If you get stuck

- **"The Cloudflare build failed"**: open that deployment and read the last log line. Nine times out of ten it's one of two things: an environment variable misconfigured (back to Step 2, check NODE_VERSION), or `SITE_URL` missing the `https://`.
- **"I changed settings in the Cloudflare web UI but nothing happened"**: recall Step 3 — did you delete `wrangler.toml`? While it exists, the web settings are ignored.
- **"The domain opens but the styling is broken / images are gone"**: nine times out of ten `SITE_URL` still isn't the new domain. Change it to `https://your-domain` and redeploy.
- **"I closed the login window the first git push showed"**: push again — it pops up again.

## ✅ Acceptance criteria (all must hold)

- Your URL opens on phone data (no WiFi needed), pages rendering normally
- `wrangler.toml` is deleted, and every setting from now on goes into the Cloudflare web UI
- ☐ If you have a domain: `SITE_URL` has been changed to `https://your-domain`

## Next step

The site is live, but Google doesn't know you exist — the next lesson gets it to start indexing you, which is where traffic begins. [Go to the indexing lesson · Get Google to Know You](/landing/docs/get-on-google)
