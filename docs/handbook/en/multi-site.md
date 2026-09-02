---
title: "Multi-Site Management: One Toolkit, N Sites"
description: "From site two: register in sites.toml (credentials never enter), inspect with one command via --all and --site; submit refuses --all. AI referrals read as trends."
manual: dev
order: 9
icon: lucide:layers
tldr: "After cloning site two, register it: npx anvilwiki-ops sites add <name> <path>; inspect everything with one command: --all audit (one failure doesn't halt), --site <name> metrics. Credentials never enter the registry — each site's .env stays in its repo. AI referrals: read trends, not absolutes (referrers get stripped). submit deliberately refuses --all: bulk publishing is too dangerous to one-click."
updated: 2026-09-02
---

## A true scene first

Three sites after the cloning lesson. Does Monday's 30-minute freshness loop run three times? This lesson folds "N sites" back into "one command": register once, inspect everything.

## Register and inspect

```bash
# Register (once per site)
npx anvilwiki-ops sites add anvil-wiki /path/to/anvil-wiki
npx anvilwiki-ops sites add forge-wiki /path/to/forge-wiki --url https://forge.example

# Inspect
npx anvilwiki-ops --all audit            # site-wide health, one report (one failure doesn't halt)
npx anvilwiki-ops --all metrics          # all sites' data
npx anvilwiki-ops --site forge-wiki metrics   # just one
npx anvilwiki-ops sites list             # what's registered
npx anvilwiki-ops sites remove <name>     # remove
```

The registry lives at `~/.config/anvil-ops/sites.toml` and stores **names and paths only** — **credentials never enter it**: each site's `.env` (GSC key, CF token) stays in its own repo; nothing cross-pollinates.

## AI referral tracking

`metrics` ends with an **AI referrals** section: visits arriving from chatgpt.com, perplexity.ai, gemini.google.com, claude.ai and peers (counted via your Cloudflare token). GSC's generative-AI report has no API, so `insights` also probes AI Overviews inclusion (experimental), and `metrics --import-aio <csv>` imports the CSV GSC's UI exports.

Reading discipline: **trends, not absolutes** — AI browsers often strip referrers, so low numbers are a tooling limit, not your failure. It's the first observable signal of "is my site being AI-cited", pairing with the direct-answer and tables playbook from the learning manual.

## The safety line: submit deliberately refuses --all

Read commands (doctor/metrics/audit/insights) take `--all` happily; the write command **submit deliberately supports single sites only** — bulk publishing is too dangerous to one-click. Every site's launch decision deserves to be made in front of its own diff.

## Three classic mistakes (made for you in advance)

- **Credentials pasted into sites.toml**: the registry is a plaintext file — keys in there are keys taped to the door. Credentials live only in per-site `.env`.
- **Wishing submit had --all**: it's designed not to. The bulk-launch urge belongs to the launch-batch discipline, not a flag.
- **Treating AI referral absolutes as KPIs**: referrer stripping keeps them naturally low; an upward trend is the good news.

## Three words to know (just these)

- **Registry (sites.toml)**: the name-and-path list of your sites, managed via `sites add/remove/list`.
- **--all / --site**: inspection scope switches — everything or one; read commands only.
- **AI referrals**: visit-source stats from AI assistants — the observable signal of "being AI-cited".

## ✅ Acceptance (all must hold)

- ☐ Site two is `sites add`-ed and visible in `sites list`
- ☐ `--all audit` has produced one site-wide report
- ☐ You know where credentials live (per-site `.env`) and what the registry holds (names and paths only)

## The Development Manual closes here

The map (architecture) → categories and languages → feature switches → **verify your changes** → sync upstream → contribute back → AI ops → the content pipeline → **multi-site management** — you now hold maintainer-grade command of this template. Return to the [Learning Manual's weekly loop](/landing/docs/weekly-ops): most of those 30 minutes now run themselves. When trouble strikes, the learning manual's appendices hold the red-line master list, the troubleshooting tree, and the glossary.
