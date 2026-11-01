---
title: How to Start a Tutorial Site That Google and AI Assistants Cite
description: Build a tutorial/knowledge-base site the way AI search reads it — answer-first pages, FAQ structure, single-topic organization — and what the site type changes.
order: 4
updated: 2026-11-01
tldr: "A tutorial site wins when every page answers one question directly — a 40–60 word answer up top, question-shaped sections, an FAQ block, clean topic organization: the shape human skimmers and AI assistants both reward. Build it on a static template with structured answers, per-page FAQ markup and llms.txt, keep one narrow topic, and date every guide. The setup CLI scaffolds this as a tutorial-hub site."
---

## Why do tutorial sites need to be written as "answer pages"?

Two readers arrive at every tutorial now: the human skimming for the step that unblocks them, and the AI assistant assembling an answer from sources. Both reward the same structure, which is convenient:

- **A direct answer first.** Open the page with the solution in 40–60 words before any background. Skimmers decide in seconds whether the page has what they need; assistants quote the paragraph that stands alone.
- **Question-shaped sections.** Each heading states the question it answers ("How do you reset the config?", "Why does the import fail on Windows?"). Questions are how people search; a heading that matches the query is a heading that ranks.
- **An FAQ block per page.** The five-to-eight questions around the edge of the topic, marked up as structured FAQ data. This is the part assistants pull from most reliably.
- **Visible freshness.** A "last verified" date on anything that can age. Undated tutorials read as abandoned.

None of this is cosmetic. It is the difference between a page that gets cited and a page that gets scrolled past.

## What should one tutorial site be about?

One topic, narrow. "My complete guide to pixel art in Aseprite" beats "art tutorials" — because the narrow site can go deep on every sub-question, and depth per topic is what makes an assistant treat it as the authority. The test: if you cannot list 20 real questions people ask about your topic, it is too narrow; if the top 20 questions would need three different sites to answer well, it is too broad.

This single-topic shape also simplifies the site itself: one main content category, tag pages, and a FAQ page — no complex taxonomy. That is a real advantage when you are the only writer.

## How do you organize the pages?

Linear paths inside the topic, not a wiki of everything. A beginner arrives knowing nothing; the site's job is to hand them ordered steps — fundamentals first, then each specific question as its own page, cross-linked where one depends on another. The [docs center](/landing/docs/) on this site is itself a tutorial knowledge base of this shape (two manuals, ordered lessons, on-page tables of contents), so you can [see the pattern running live](/landing/tutorials/) on this very site's tutorial line.

## What does the building actually look like?

The same one-day workflow as any static content site — fork a template, answer setup questions, write pages with AI assistance, deploy free. The tutorial-site specifics to look for in a template:

- **Structured quick answers**: a frontmatter field for the 40–60 word answer, rendered as a highlighted card and usable by search engines.
- **Per-page FAQ markup**: visible questions and answers that also emit FAQ structured data — write them once, not twice.
- **An llms.txt file**: the plain-text site map that AI crawlers read first; generated automatically from your content on a template that supports it.
- **Question-first content linting**: a checker that catches missing answers, broken heading order, and pages with too few internal links before they ship.

AnvilWiki does all four, and its setup CLI can scaffold the site as a **tutorial hub** — one guides category, FAQ systems and AI-citation structure pre-wired. The [first-article workflow](/landing/docs/first-article/) then drives daily writing: material in, verified page out.

## What keeps a tutorial site ahead of "just asking the AI"?

Being the source the AI cites, which comes from things a raw chatbot cannot fake: you actually performed the steps and screenshot them; you note version differences ("this changed in v3"); you keep the pages updated when the tool changes and say when you did. A chatbot's answer is undated and unverifiable by construction. Your page's moat is that it is **dated, sourced, and corrected in public**.

## Week one checklist

- Write down the 20 real questions your topic gets asked; each becomes a page.
- Build the site with the tutorial-hub shape: [AI site in a day](/landing/tutorials/ai-one-day-content-site/) is the setup walkthrough.
- Write 3–5 pages answer-first, every claim verified, every page dated.
- Submit the site to search engines early — indexing takes longer than building ([the indexing playbook](/landing/tutorials/get-indexed-by-google/)).

The whole strategy in one sentence: **answer one narrow topic's questions better and more honestly than anything else on the internet, in the exact shape search and AI systems read.**
