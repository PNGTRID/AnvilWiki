---
title: Deploy on Cloudflare Pages for Free - From Fork to Live Site in 30 Minutes
description: Deploy a static site on Cloudflare Pages free — Git-connected builds, unlimited bandwidth — plus the two deployment paths ranked by how much terminal you want.
order: 10
updated: 2026-11-02
tldr: "Cloudflare Pages hosts static sites for free with unlimited bandwidth and automatic builds from a Git repository. Fork the site repo, connect the repo to Pages, and every push rebuilds and deploys automatically. Two paths: a GitHub Action that initializes everything from a browser with zero terminal, or a CLI flow for terminal users — both land on a free .pages.dev domain with your own domain attachable in one setting."
---

## Why Cloudflare Pages for a content site?

Three reasons that matter for a content business, not a hobby page:

- **Unlimited bandwidth on the free tier** — a content site lives or dies on whether a traffic spike costs money. On Pages, it does not: the free plan serves unlimited requests, with a global CDN in front.
- **Git-connected builds** — every push to main rebuilds and redeploys automatically; there is no server to patch and no deploy checklist to forget.
- **No runtime to secure** — a static site has no server-side code that can be exploited; the security surface is your domain and your keys.

The trade-off to understand: Pages serves **static files**, so anything that needs a database or user-generated content at runtime needs a different platform. For content sites — which are read-heavy, write-rarely — static is the correct default, not a compromise.

## What do you need before deploying?

Three things: a **GitHub account** with the site repository forked or created, **Node.js and pnpm** installed locally (only for the terminal path — the browser path needs none), and a Cloudflare account. The free plan of everything is enough; no credit card is asked for on any of the three.

## Which deployment path fits you?

**The browser path — zero terminal.** Fork the template repository, open its GitHub Actions tab, and run the initialization workflow: it asks the same questions the CLI asks (site name, theme color, categories, site type) and commits the personalized site back to your fork as a pull request. Merge it, connect the fork to Cloudflare Pages once, and from then on every content edit you push deploys itself.

**The terminal path — full control.** Clone the fork, run the setup CLI locally (it walks through the same questions interactively, with a dry-run mode to preview every file it would touch), push, and let Pages build. This path is faster to iterate on and is what the [development workflow](/landing/docs/) assumes for daily content work.

Both paths land in the same place: a `*.pages.dev` domain serving the site, with [the indexing playbook](/landing/tutorials/get-indexed-by-google/) as the next step so the new domain enters the crawl.

## What should you configure right after the first deploy?

- **The site identity**: the setup CLI rewrote the site config, but double-check the title and description render correctly on the deployed homepage.
- **Your own domain** (optional, one setting): attach it in the Pages project — Pages provisions the TLS certificate automatically, and the deployment docs cover the "bind domain first, then set the site URL" ordering rule that saves a rebuild.
- **The environment variables** for anything optional you turned on — analytics, ads, comments. The template keeps every optional integration off until its key exists in the deployment's environment settings; the deployment docs carry the full variable table.

## What breaks on the first deploy, usually?

Nothing in the site — the failure mode is configuration: a site URL set without its `https://` prefix, a build command pointing at the wrong output directory, or a Node version below what the site's toolchain declares. All three surface as loud build-log errors with the fix in the message. The [AI-in-a-day setup walkthrough](/landing/tutorials/ai-one-day-content-site/) shows the whole deploy flow embedded in a real build, start to finish.
