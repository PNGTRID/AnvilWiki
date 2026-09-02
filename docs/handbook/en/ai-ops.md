---
title: "Put an AI on Ops Duty: anvilwiki-ops and MCP"
description: "Hand your AI assistant the whole ops loop: health checks, real GSC and Cloudflare data, prioritized actions, and PR-gated publishing — never a push to main."
manual: dev
order: 7
icon: lucide:bot
tldr: "anvilwiki-ops is the template's companion ops toolkit (an npm package, no install needed with npx). doctor gives a guided health check; after you put a GSC service account and CF token in .env, metrics pulls real traffic and insights returns evidence-backed actions; with MCP registered, Claude/ZCode can pull data, edit content, and open PRs for you — every write goes through a PR with a human in the loop."
updated: 2026-08-22
---

## Where you are now and what this lesson solves

The [the learning manual's Stay Fresh lesson](/landing/docs/weekly-ops) weekly 30-minute rhythm works — but most of those minutes are "run a command, read numbers, copy a list", which is exactly what AI is best at. This lesson hands the whole ops loop to your AI assistant: you say "how's the site doing?", and it pulls data, proposes actions, edits content, and opens a PR. You keep only the final merge click.

Two terms, defined once:

- **CLI (command-line tool)**: a program you run in a terminal. This package's command is `anvil-ops`, run via `npx` — no installation.
- **MCP**: an open protocol that lets AI assistants (Claude, ZCode, …) call external tools directly. Once registered, the AI calls the health-check and data tools itself instead of you relaying commands.

## Step 1: Health check (2 minutes)

**What you do**: confirm the state of your repo and credentials, and get a report of "what's not wired up and how to fix it".

**How**: from the repo root, run:

```bash
npx anvilwiki-ops doctor
```

**What you'll see**: a one-line-per-item list — `site-config` (reads SITE_URL from wrangler.toml), `gh` (is the GitHub CLI installed), `gsc-config` / `cf-config` (are data credentials set). Unset items don't count as failures; the tool notes that metrics will run in degraded mode.

**Confirm you did it right**: the report ends with `All checks passed.`, or you know exactly which item is unset and accept not using it for now.

## Step 2: Wire up the two data sources (GSC 5 min, CF 2 min)

**What you do**: let the tool read your real traffic. Google Search Console (GSC) provides queries and rankings; Cloudflare Web Analytics (already beaconed by the template) provides visits.

**One concept first (30 seconds)**: GSC data is private — its API only accepts authorized identities. Robots are authorized via a "service account", which is **not an email address**: it cannot receive mail, has no password, and cannot log in. It is just a Google-generated robot ID that happens to look like `xxx@project.iam.gserviceaccount.com` (a naming convention). Its credential is a JSON key file. What follows is: build a robot, then grant it read access to your data.

**How** — GSC (once):

1. **Build the robot**: Google Cloud Console (console.cloud.google.com, signed in with the same Google account as GSC) → new project → search for `Google Search Console API` → enable; then menu → IAM & Admin → Service Accounts → create (any name, e.g. `anvil-ops`) → open its **Keys** tab → Add key → JSON → Create. **Your browser downloads a .json file** — that is the robot's key. Keep it.
2. **Create a relay group** (required — do not skip): GSC's "Add user" only accepts real accounts and rejects robot IDs as "invalid email". The fix is a Google Group as middleman: groups.google.com → Create group (any name; note the group email `xxx@googlegroups.com`) → in Group settings, allow external members → Members → Add member → paste the robot ID **directly** (search the key JSON for `client_email`) → Add (do not "invite" — robots cannot click links).
3. **Grant access**: Search Console → your property → Settings → Users and permissions → Add user → enter the **group email** (not the robot ID!) as a **Restricted** user. Note: freshly created groups can take minutes to hours before Google accepts them; on "unspecified error", wait and retry.
4. **Wire the key**: create a `.env` file at the repo root (already gitignored, never committed) with one line:
   `GSC_SERVICE_ACCOUNT_JSON=path/to/the/key/file`

CF (once): Cloudflare dashboard → My Profile → API Tokens → Create Token with permission **Account → Analytics → Read**; add two more lines to `.env`: `CF_API_TOKEN=token` and `CF_ACCOUNT_ID=account-id`.

**What you'll see**: run doctor again — `gsc-config` and `gsc-access` both turn green.

**Confirm you did it right**: `All checks passed.`; if `gsc-access` says "not in accessible list", it's almost always the group from step 3 not having propagated yet, or the property shared with the wrong address.

## Step 3: Read data, get an action list (1 minute a day)

**What you do**: turn both data sources into one readable report, then let the rule engine translate numbers into "what to do next".

**How**:

```bash
npx anvilwiki-ops metrics --days 28 --format md   # data report
npx anvilwiki-ops insights                        # action list
```

**What you'll see**: metrics prints clicks, impressions, CTR, position (by page and by query) plus visits; insights prints severity-sorted suggestions, each with evidence and the skill that handles it (e.g. "codes page unverified for 45 days → use the anvil-update-codes skill").

**Confirm you did it right**: insights gives at least one suggestion whose finding–evidence–action you can follow; zero suggestions means nothing crossed a threshold in this window, which is also a valid result.

## Step 4: Hand the tools to your AI (MCP, 5 minutes)

**What you do**: register the toolkit in your AI assistant's config, then direct it in plain language.

**How**: add this to your Claude / ZCode (or any MCP client) config:

```json
{
  "mcpServers": {
    "anvil-ops": { "command": "npx", "args": ["-y", "anvilwiki-ops", "mcp"] }
  }
}
```

Then tell your AI (copy-paste ready):

> Use anvil-ops doctor to health-check my wiki site, pull the last 28 days of metrics, then act on the top three items from insights: title/description rewrites via the content skill, expired codes via anvil-update-codes. Finish with submit_pr and paste the validation results into the PR description.

**What you'll see**: the AI calls `doctor` → `metrics` → `insights`, edits files, then calls `submit_pr` and hands you a PR link.

**Confirm you did it right**: the tool list shows anvil-ops' five tools (doctor / metrics / audit / insights / submit_pr).

## v2.0: run N sites from one toolkit

From your second wiki on, register each site once and the toolkit iterates them for you:

```bash
npx anvilwiki-ops sites add anvil-wiki /path/to/anvil-wiki
npx anvilwiki-ops sites add forge-wiki /path/to/forge-wiki --url https://forge.example
npx anvilwiki-ops --all audit          # every site, one report (a broken site doesn't stop the rest)
npx anvilwiki-ops --site forge-wiki metrics
```

Credentials never go in the registry — each site's `.env` stays in its own repo; the registry only stores names and paths. `--all` works on the read commands (doctor / metrics / audit / insights); `submit` stays single-site on purpose: bulk-publishing is too dangerous to batch.

The `metrics` report now also ends with an **AI referrals** section — visits coming from chatgpt.com, perplexity.ai, gemini.google.com, claude.ai and friends (via your Cloudflare token). GSC has no API for its generative-AI report, so `insights` also probes AI Overviews pages (experimental) and `metrics --import-aio <csv>` ingests the GSC UI's CSV export. Treat the numbers as a trend, not a census — AI browsers often strip referrers.

## v2.0: batch drafts straight to a PR (content pipeline)

For "scaffold 20 pages from a keyword list", you don't even need a terminal: **Actions → Auto content PR → Run workflow**, paste the CSV, and the pipeline runs the deterministic generator (`bulk-new-posts`), then all eight quality gates, and only opens a **draft PR** if everything is green. Fill the drafts with real game facts in a local AI session, then merge. One prerequisite checkbox (Settings → Actions → "Allow GitHub Actions to create and approve pull requests") and the full contract are in [docs/content-pipeline.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/content-pipeline.md). No AI key ever enters CI — the workflow only runs deterministic scripts.

## The safety line: why it can't touch your live site

The tool's write path is exactly one: **validate (check-content + check-i18n + full build) → new branch → commit → push → open a PR**. Failed validation stops everything — nothing is committed. It has no ability to push main; the merge button stays yours. Think of it as an intern who puts a drafted contract in the to-sign tray — whether to sign is entirely up to you.

## If you get stuck

- `gsc-access` FAIL: the property wasn't shared with the service account email (Step 2, sub-step 3).
- `Cloudflare API returned 401/403`: wrong token permissions — recreate with Account → Analytics → Read.
- `gh CLI not found`: install the GitHub CLI (needed by submit): https://cli.github.com/
- `No site config found` / site-config FAIL: your repo deleted `wrangler.toml` (the learning manual's recommended setup — settings live in the Cloudflare dashboard). Fix: add `SITE_URL=https://your-domain` to the `.env` at the repo root (plus `PUBLIC_CF_BEACON_TOKEN` if you want CF data). Do **not** recreate wrangler.toml for this — the moment that file returns, every variable you configured in the dashboard stops working.
- `No uncommitted changes to submit`: the worktree is clean — the AI hasn't written anything yet; have it produce content first.
- `npx anvilwiki-ops` can't find the package: you need 0.1.0 or later (ships with template v1.15; v2.0 ships 1.0.0 with multi-site + AI referrals).
- Pipeline opens no PR: Settings → Actions → General → enable "Allow GitHub Actions to create and approve pull requests".

## ✅ Acceptance criteria (all must hold)

- ☐ doctor ends with `All checks passed.` (or you know which item is unset and why that's acceptable)
- ☐ `metrics --format md` prints real numbers (not zeros or an error)
- ☐ `insights` suggestions match problems you can eyeball in the GSC console
- ☐ (if you wired MCP) the AI can list and call the anvil-ops tools

## The dev manual ends here

Map (architecture) → categories and languages → theme and homepage → feature toggles → CI and security → sync and contribute → AI-automated ops — your command of this template is now maintainer-level. Head back to the [the learning manual's Stay Fresh lesson](/landing/docs/weekly-ops) weekly rhythm — except now, AI can do most of those 30 minutes for you.
