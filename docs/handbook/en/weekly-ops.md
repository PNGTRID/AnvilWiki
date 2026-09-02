---
title: "Thirty Minutes Weekly: The Freshness Loop"
description: "Monday, 30 minutes: refresh-audit turns stale pages into todos, codes get updated, GSC picks next topics. Monthly upstream sync; quarterly SEO checkup."
manual: learn
order: 25
stage: "Monetize & Operate"
icon: lucide:refresh-cw
tldr: "Monday, 30 minutes, three moves: pnpm refresh-audit (P0 = codes over 7 days, P1 = boss/tier over 90) fed to AI as todos; codes updated (/anvil-update-codes — expired marked, never deleted); push and pick next topics from GSC. Monthly: check-i18n, upstream sync, RPM review. Quarterly: the SEO checkup. The fixed rhythm is the only secret."
updated: 2026-09-02
---

## A true scene first

Ads are on, the shop is open for business — and game guides rot: codes expire unmanaged, boss guides teach last patch's strategy. A player burns once on a dead page and never returns, and Google hands the ranking to someone fresher. This lesson is a fixed rhythm: **Monday, 30 minutes; monthly, 10; quarterly, 5. The fixed rhythm is the only secret to a site that never goes stale.**

## Every Monday, 30 minutes

### Move one: the freshness check, report to todos (15 minutes)

```bash
pnpm refresh-audit
```

**You'll see**: a list with two levels — **P0, most urgent: the codes page untouched for over 7 days; P1: boss guides and tier lists untouched for over 90 days** (only these two mislead players when stale). Paste it to AI:

```text
Below is my pnpm refresh-audit report:
<paste the report>
Turn the P0/P1 items into an actionable checklist:
1. Pages needing new data from me → list exactly what each needs (latest codes / patch changes)
2. Pages I confirm are still accurate → update lastModified to today
3. Pages with outdated gameVersion, listed separately
Do not alter any content facts yourself. Output as a checkbox list.
```

> Note: the repo's "weekly automatic check + issue" workflow **only runs on the official AnvilWiki repo by default — your site gets no automatic reminders**, so run this yourself weekly. Want GitHub to open issues for you: delete the `if: github.repository ==` line in `.github/workflows/content-pipeline.yml` (have AI do it — a one-liner).

### Move two: update the codes (10 minutes)

Collect new codes and confirmed-expired ones from official Twitter/Discord, then — skills-capable assistants:

```text
/anvil-update-codes new:<code list>; expired:<code list>
```

Plain prompt version:

```text
Update the codes articles under src/content/wiki/en/codes/: append new codes to the front of the frontmatter active array;
flip expired codes to status expired (keep, never delete); set lastModified to today; sync counts and dates in title/summary;
if other locales exist, sync the data (code strings stay, reward text gets translated).
Run pnpm check-content && pnpm build; all green or not done.
```

**Check**: new codes appear; expired ones move to the "expired" table (**kept** — people still search "do old codes work"; that's long-tail traffic).

### Move three: push, and pick next week's topics (5 minutes)

Push (Cloudflare redeploys automatically), glance at GSC: which queries are climbing — feed next week's pipeline. The full reading method lives in [First-Week Numbers](/landing/docs/first-week-numbers); five minutes here is enough.

## Monthly (10 minutes each)

```bash
# 1. Multi-language sites only: see what translations are missing
pnpm check-i18n

# 2. Bring in the template author's updates (first time, run all three)
git remote add upstream https://github.com/PNGTRID/AnvilWiki.git
git fetch upstream
git merge upstream/main
```

**CONFLICT appears? Don't panic**: give the conflicted file to AI with the mantra — "keep my config and content, take their code" — details in the Development Manual's sync lesson. Then 10 minutes on the AdSense report: which page types run the highest RPM (usually tier lists and codes) → write more of that next month.

## Quarterly: the SEO checkup (paste this to AI)

```text
Run an SEO checkup on this site, read-only:
1. SITE_URL (wrangler.toml [vars] or .env) has https:// and is the real domain
2. Every article: title ≤80, description 40–165, summary is a direct answer (list violations)
3. og:image/twitter:image are absolute paths
4. noindex used correctly
5. Run pnpm check-sitemap; after build run pnpm check-links, report non-200/dead links
6. hreflang coverage complete for all locales
Output a problems table: file / issue / suggested fix; change nothing until I confirm.
```

## The long view

- Once site one runs, **site two costs almost nothing extra** — selection, build, content, launch, ops: you've walked the whole manual (next lesson covers copying).
- Forgot the weekly check? A recurring Monday calendar reminder titled "30-minute freshness" beats willpower.

## Three classic mistakes (made for you in advance)

- **The report confuses you so it sits**: you don't need to understand it — feed it to AI and it becomes todos.
- **Deleting expired codes**: mark expired, don't delete — old codes carry long-tail searches.
- **Relying on willpower for the weekly slot**: calendar reminders outperform willpower every week of the year.

## Three words to know (just these)

- **Freshness**: the whole keep-it-alive motion — a game wiki's restocking.
- **P0/P1**: staleness urgency — P0 codes over 7 days, P1 bosses/tier lists over 90.
- **Upstream**: the template's official repo, synced monthly for new features.

## ✅ Acceptance (all must hold)

- ☐ refresh-audit ran this week; P0 at zero (codes page updated within 7 days)
- ☐ Three consecutive weeks, same slot, same three moves
- ☐ A recurring Monday reminder exists on your calendar

## Next lesson

A shop that keeps itself fresh — worth copying? Next lesson: your second game site, in 30 minutes. [Go to Lesson 26 · Clone Your Site](/landing/docs/clone-your-site)
