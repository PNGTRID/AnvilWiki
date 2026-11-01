---
title: Build a Content Site with AI in One Day — a Realistic Workflow
description: What building a content site with AI in one day actually looks like — install, fork-and-configure, AI page generation with quality gates, free deployment.
order: 3
updated: 2026-11-01
tldr: Yes, one day is enough to go from zero to a deployed content site — if you bring a workflow instead of prompting from scratch. Install the tools, fork a static-site template, initialize it by answering questions with your AI agent, generate the first batch of pages from real notes, run the template's build-time checks, and deploy to free hosting. What one day buys you is the site; the traffic comes from the weeks of honest content after it.
---

## Can you really build a site in one day?

The site itself, yes — and it is worth being precise about what that means. In one focused day you can have a real, deployed, search-engine-visible website with your first batch of content pages on it. What one day does not buy is the traffic: pages need indexing, topics need validation, content needs the freshness loop that keeps it honest. The AI builders promising "a business in a prompt" are selling the first part only. This tutorial is the realistic version: one day of setup, a repeatable content workflow after.

The reason one day is now possible at all is that the setup work collapsed. Five years ago a content site meant choosing a CMS, configuring hosting, building templates. Today the sensible path is: fork a working template, let an AI coding agent configure it by asking you questions, and spend your saved hours on the thing that actually differentiates you — the content.

## Hour 0–1: install the four tools

You need four things on your machine: Node.js (the JavaScript runtime), Git (version control), the pnpm package manager, and an AI coding agent in your editor. That is the whole list — no database, no server, no paid services. The handbook's [install-tools lesson](/landing/docs/install-tools/) walks each install with what you should see on screen at every step, and it assumes zero prior experience.

## Hour 1–2: fork and initialize the template

Fork the AnvilWiki repository on GitHub, clone it, run `pnpm install` and `pnpm dev` — a complete demo site is running on your machine. Then initialize it as yours by running the setup CLI with your AI agent: it asks a short list of questions (site name, game or topic, domain, which content categories you want, which languages) and rewrites the configuration for you. There is no hand-editing step required; the questions exist so you never touch config files. If you would rather avoid the terminal entirely, the repository also ships a GitHub-Actions-based setup that runs the same flow with no local tools at all.

The point worth dwelling on: **a template with a question-driven setup is what makes the AI workflow safe**. Your agent is not improvising a site from nothing — it is filling in a structure that already builds, already passes its own quality gates, and already deploys.

## Hour 2–5: generate the first batch of pages — from real material

Now the actual content, which is where most AI-built sites quietly fail. Prompting "write me 20 articles about my topic" produces 20 pages of plausible filler that search engines and readers both recognize. The workflow that works is narrower:

- Start from **material you actually have**: notes, a game you play, a product you use, a video you watched.
- One page per real question your audience asks, starting with [the first-article workflow](/landing/docs/first-article/) — frontmatter, a direct 40–60 word answer up top, question-shaped sections.
- Let the AI draft; you verify every factual claim. Unverified facts stay in draft status until you check them — the template's content system has a draft flag exactly for this.
- Aim for a first batch of 5–10 pages, not 50. Depth beats volume on day one.

The demo site is itself an example of the output: a complete wiki for a fictional game, every page built through this loop — [have a look](/demo/) at what "one day of AI-assisted building" produces in practice.

## Hour 5–6: run the quality gates

A good template checks your content the way a compiler checks code: frontmatter validated against a schema, headings linted, internal links audited, translations cross-checked. Before you deploy, run the build. If it passes, your pages are structurally sound — no broken links, no missing metadata, no silent placeholder text. If it fails, the errors point at the file and the field. This is the step that separates "AI wrote something" from "the site is ready for the public", and it is built into the template rather than bolted on.

## Hour 6–7: deploy for free

Static sites deploy free on Cloudflare Pages with unlimited bandwidth: connect the repository, set one domain variable, and every push to main rebuilds and redeploys automatically. No servers, no bills while traffic is small, no capacity planning ever. The [deployment lesson](/landing/docs/put-site-online/) covers the exact clicks, including the one configuration warning that trips most beginners.

## Day one is the floor, not the ceiling

After the site is live, the work shifts to the loop that actually compounds: publishing on a schedule, [getting indexed](/landing/tutorials/get-indexed-by-google/), reading what visitors search for, and refreshing what ages. The honest summary: **AI collapses the building to a day; it cannot collapse the earning, and nothing honest can.** What you can do is make sure every hour after day one goes into content instead of infrastructure — which is exactly what this workflow is for.

If your one-day site is a codes site, a coupon hub or a tutorial knowledge base, the setup CLI asks for the site type and scaffolds that shape directly — the same fork, three different starting points.
