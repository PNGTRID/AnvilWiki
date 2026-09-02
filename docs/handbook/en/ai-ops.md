---
title: "Put an AI on Ops Duty: anvilwiki-ops and MCP"
description: "One npx line arms your AI assistant with the ops loop: doctor, metrics, insights, PR-gated publishing — the merge button stays yours."
manual: dev
order: 7
icon: lucide:bot
tldr: "anvilwiki-ops (npm package, runs via npx) hands the weekly ops loop to AI: doctor checks what's missing in one pass; once a GSC service account (authorized through a Google Group) and a CF token sit in .env, metrics pulls 28 days of real data and insights ranks evidence-backed actions; with MCP registered you just talk — five tools (doctor/metrics/audit/insights/submit_pr), and every write goes verify → branch → PR with the merge button staying yours."
updated: 2026-09-02
---

## Where you are, and what this lesson solves

The [Learning Manual's thirty-minutes-weekly lesson](/landing/docs/weekly-ops) works, but most of those minutes are "run commands, read numbers, copy lists" — exactly what AI is best at. This lesson hands the loop over: you say "how's the site doing?", and AI pulls data, proposes actions, edits content, opens a PR; you keep the final merge click.

Two words first: **CLI** (a terminal program — this package's command is `anvil-ops`, run via `npx`, no install) and **MCP** (the open protocol letting AI assistants call external tools directly — registered, the AI calls the abilities itself).

## Step 1: the health check (2 minutes)

From the repo root:

```bash
npx anvilwiki-ops doctor
```

**You'll see**: one item per line — `site-config` (SITE_URL read from wrangler.toml), `gh` (GitHub CLI present), `gsc-config` / `cf-config` (credentials configured). Missing items aren't failures — just "metrics will run in degraded mode".
**Check**: it ends `All checks passed.`, or you know exactly what's missing and accept it.

## Step 2: connect two data sources (GSC 5 minutes, CF 2 minutes)

GSC provides search queries and rankings; Cloudflare Web Analytics (already instrumented by the template) provides visits.

**A 30-second concept**: GSC data is private; the API only accepts authorized identities. The robot's identity is a **service account** — **not an email**: no inbox, no password, just a Google-generated "robot ID" (shaped like `xxx@project.iam.gserviceaccount.com`); its key is a JSON file.

**GSC (one-time)**:

1. **Create the robot**: Google Cloud console (same Google account as GSC) → new project → enable `Google Search Console API` → IAM & Admin → Service Accounts → create → Keys tab → Add key → JSON → the browser downloads the .json key file — keep it
2. **Create the forwarding Group (mandatory, don't skip)**: GSC's "add user" only accepts real accounts — a raw robot ID reads as "invalid email". Fix: create a Google Group at groups.google.com → allow external members → add members by **pasting the robot ID** (the `client_email` string in the key JSON) — never "invite", robots don't click links
3. **Authorize**: Search Console → Settings → Users and permissions → add user → enter the **group email** (not the robot ID!) → permission "Restricted". New groups may take minutes to hours to activate; "unspecified error" means wait and retry
4. **Configure the key path**: repo-root `.env` (gitignored) gets `GSC_SERVICE_ACCOUNT_JSON=path-to-key-file`

**CF (one-time)**: Cloudflare console → My Profile → API Tokens → create, permission **Account → Analytics → Read**; `.env` adds `CF_API_TOKEN=token` and `CF_ACCOUNT_ID=account-id`.

**You'll see**: doctor rerun turns `gsc-config` and `gsc-access` green.

## Step 3: read data, take the action list (1 minute a day)

```bash
npx anvilwiki-ops metrics --days 28 --format md   # data report
npx anvilwiki-ops insights                        # action list
```

**You'll see**: metrics prints clicks, impressions, CTR, rankings (by page, by query) and visits; insights ranks suggestions by severity, each with evidence and a matching skill ("codes page unverified for 45 days → run anvil-update-codes").
**Check**: insights yields at least one "symptom—evidence—action" you understand; none means nothing crossed thresholds — also normal.

## Step 4: hand the tools to your AI (MCP, 5 minutes)

Register in your MCP client's config:

```json
{
  "mcpServers": {
    "anvil-ops": { "command": "npx", "args": ["-y", "anvilwiki-ops", "mcp"] }
  }
}
```

Then just say (copy-paste ready):

> Use anvil-ops doctor to health-check my wiki site, pull the last 28 days of metrics, and do the top three items from insights: title/description edits via the content skill, expired codes via anvil-update-codes. Finish with submit_pr and paste the verification results into the PR description.

**You'll see**: AI calls doctor → metrics → insights, edits files, and hands you a PR link from submit_pr.
**Check**: AI's tool list shows the five tools (doctor / metrics / audit / insights / submit_pr).

## The safety line: why it can't touch your live site

Writes have exactly one path: **validate (check-content + check-i18n + full build) → new branch → commit → push → open PR**. Failed validation terminates everything; there is no direct push-to-main capability — the merge button stays yours. Think "intern files the drafted contract in the signing tray; whether it signs is your call".

## Stuck?

- `gsc-access` FAIL: the resource isn't shared with the service account (step 2.3), or the group hasn't activated.
- `Cloudflare API returned 401/403`: wrong token permission — re-select "Account → Analytics → Read".
- `gh CLI not found`: install the GitHub CLI (submit needs it): https://cli.github.com/
- `No site config found`: your repo deleted wrangler.toml (the launch lesson's recommendation) — add `SITE_URL=https://your-domain` to `.env`. **Never** rebuild wrangler.toml for this: its return kills every dashboard-configured variable.
- `No uncommitted changes to submit`: the worktree is clean — have AI produce something first.
- Package not found with `npx anvilwiki-ops`: needs 0.1.0+ (shipped with template v1.15; v2.0 carries 1.0.0 with multi-site + AI referrals).

## ✅ Acceptance (all must hold)

- ☐ doctor ends `All checks passed.` (or you consciously accept the gaps)
- ☐ `metrics --format md` prints real numbers (not zeros or errors)
- ☐ insights suggestions match what you can see in the GSC dashboard
- ☐ (MCP registered) AI can list and call the anvil-ops tools

## Next lesson

One site's loop is automated — what about volume? Next lesson: a keyword CSV becomes a draft PR, entirely in the cloud. [The Content Pipeline](/landing/docs/content-pipeline)
