---
title: How to Get a New Site Indexed by Google — the 2026 Static-Site Playbook
description: Why new sites wait weeks for Google, and what actually shortens it — GSC verification, sitemaps, internal linking, IndexNow for other engines, honest patience.
order: 5
updated: 2026-11-01
tldr: "Google finds a new site through: verified ownership in Search Console with the sitemap submitted, request-indexing on the key pages, a flat internal-link structure so every page is reachable in a few clicks, and a few real external mentions. IndexNow pings Bing/Yandex and other supporting engines instantly but does not affect Google. Then it takes days to weeks — quality gating, not something you can bribe. Do the discovery work right and re-check Search Console weekly."
---

## Why does a brand-new site sit unindexed for weeks?

Because Google treats unknown sites like unknown senders. A domain with no history, no inbound links and no crawl pattern gets a slow, cautious crawl budget: the crawler arrives occasionally, samples a page or two, and waits to see whether the site is real, stable and useful. Nothing about this is a bug you can fix — it is the admission process. What you control is how easy you make discovery, and whether your site signals "serious" or "abandoned".

One honest caveat first: **IndexNow does not speed up Google.** It is the ping protocol used by Bing, Yandex and other engines — worth having because those engines matter too, but Google has publicly not adopted it. For Google the channels are Search Console and links; anything promising faster Google indexing through a ping API is selling the wrong protocol.

## Step 1 — prove ownership and submit the sitemap (day one)

Register the site in Google Search Console on the day it deploys — before you write more content. Verify the domain, then submit the sitemap URL. A static-site template should generate `sitemap.xml` at build time with the correct canonical URLs and hreflang pairs; if you are on AnvilWiki, this file exists automatically and the [get-on-Google lesson](/landing/docs/get-on-google/) walks the exact clicks in Search Console.

Then use URL Inspection on your homepage and your most important pages and hit "Request indexing". This does not guarantee anything, but it moves your most valuable pages to the front of the discovery queue instead of waiting for the crawler to stumble on them.

## Step 2 — make every page reachable from the homepage

Crawlers follow links; a page nothing links to is a page Google may never see. The structural fix is boring and effective:

- Every important page reachable within a few clicks of the homepage.
- Category/list pages linking to every article; every article linking back to its category and to 2–3 related pages.
- No orphan pages — a content checker that counts internal links catches these before deploy (the template's build gates do).

This is also why thin sites with 500 stub pages index worse than focused sites with 20 real ones: the internal-link graph of a focused site points the crawler at substance.

## Step 3 — the other engines, instantly

Submit your site to Bing Webmaster Tools (it can import your Search Console setup) and enable IndexNow so Bing, Yandex and the other supporting engines get pinged on every deploy. On a static template this is a build-step, not a chore: AnvilWiki generates the key file and auto-submits URLs after each successful deploy, so every new page announces itself the day it ships. It costs nothing and covers the non-Google slice of search — including the AI assistants that lean on those indexes.

## Step 4 — a handful of real mentions

One or two genuine external references — a post in a community you actually participate in, a link from a friend's relevant site, a directory that fits your niche — do more for discovery than any tool. What to avoid: buying links or blasting your URL into low-quality link farms. New-site spam signals are the one thing that makes the cautious admission process actively hostile.

## Step 5 — the part nobody can shortcut

Even with everything above done on day one, indexing typically takes days to weeks, and Google's own help documentation makes no promises about timing. The site's job during this window is to look alive and substantive: real content, consistent structure, no half-finished stubs. Then check Search Console weekly: coverage goes from "Discovered – currently not indexed" to "Indexed" as the crawler builds trust, and the report tells you which pages are in.

## The checklist, condensed

- Day one: Search Console verified, sitemap submitted, key pages request-indexed ([full walkthrough](/landing/docs/get-on-google/)).
- Day one: Bing Webmaster Tools + IndexNow enabled ([deployment lesson](/landing/docs/put-site-online/) covers the wiring).
- Week one: fix every orphan page; keep publishing real content.
- Ongoing: weekly Search Console review; external mentions earned, not bought.

Indexing is the doorway; what earns rankings after it opens is content quality — which is the subject of [the monetization roadmap](/landing/tutorials/game-wiki-monetization/) once traffic starts to arrive.
