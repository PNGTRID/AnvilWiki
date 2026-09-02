---
title: "Weekly Freshness and Growth: The 30-Minute Rhythm"
description: "Monday: freshness check, codes update, topic picks from data. Monthly: upstream sync, revenue review. Quarterly: SEO check. A fixed rhythm is the whole secret."
manual: learn
order: 21
stage: "Monetize & Operate"
icon: lucide:refresh-cw
tldr: "Every Monday, 30 minutes, three things: run pnpm refresh-audit and let the site report its own stale pages (feed the report to the AI to turn it into todos), update the codes (one prompt or slash command), and read GSC data against four pass lines — CTR ≥2%, ≥1.5 pages per visit, 10+ new pages per week. Monthly, sync upstream updates (let the AI handle conflicts). Once site one works, site two costs almost nothing extra."
updated: 2026-08-26
---

## Where you are, and what this lesson solves

The ads are on and the store is officially in business. But game guides fear going stale more than anything: expired codes left unattended, a reworked boss while your guide still teaches the old strategy — a player who finds waste paper once never comes back, and Google hands your rankings to someone else.

This lesson gives you a fixed rhythm: 30 minutes every Monday, 10 minutes every month, 5 minutes every quarter. **A fixed rhythm is the only secret to a site that never goes stale.**

## What you'll have when this lesson is done

- A do-exactly-this weekly action list (copy it into your calendar)
- Fixed monthly and quarterly actions

## Every Monday, 30 minutes

### Action 1: Run the freshness check and turn the report into todos (15 minutes)

**What to do**: let the site tell you which pages have gone stale.
**How to do it**: in the terminal, type:

```bash
pnpm refresh-audit
```

**You'll see**: a list. Two severity levels — **P0, most urgent: a codes page not updated for more than 7 days (past 30 days the problem escalates); P1, next urgent: boss guides and tier lists not updated for more than 90 days** (only those two categories produce P1, because stale versions of them mislead players; other pages never do). Then paste the list to your AI assistant and have it organized into todos:

```text
Here is my pnpm refresh-audit report:
<paste the report>
Turn the P0/P1 items into an actionable checklist:
1. Pages that need new data from me → list page by page exactly what you need (the latest codes list / mechanic changes in the new version)
2. Pages I confirm are still accurate and only need a refresh → update lastModified to today
3. List separately the pages whose gameVersion is behind
Do not modify any content facts on your own. Output as a checkbox list.
```

> Note: the repo's "weekly auto-check that opens an issue" feature **runs only on the official AnvilWiki repository by default — your site does not get the automatic reminder** — which is why you run this yourself every week. You can have GitHub open issues to remind you, too: delete the `if: github.repository ==` line condition in `.github/workflows/content-pipeline.yml` (let your AI assistant delete it — it's a one-sentence job).

### Action 2: Update the codes (10 minutes)

Collect new codes and confirm expired old ones from the official Twitter / Discord, then:

On a skill-capable AI assistant, just say (slash command):

```text
/anvil-update-codes new codes: <code list>; confirmed expired: <code list>
```

Plain-prompt version:

```text
Update the codes article under src/content/wiki/en/codes/: prepend new codes to the front of the frontmatter active array;
change expired codes' status to expired (keep them, do not delete); set lastModified to today; sync the code count and year-month in title/summary;
if other-language versions exist, sync their data too (do not translate the code field; translate copy like reward).
When done, run pnpm check-content && pnpm build; only all-green counts as complete.
```

**Confirm it worked**: the codes page shows the new codes, and expired ones moved into the "Expired" table (kept, not deleted — people still search "do old codes still work", and keeping them catches that long-tail traffic).

### Action 3: Read the data, pick next week's topics (5 minutes)

`git push` (Cloudflare reshelves automatically) → open GSC's "Performance" page and see which terms brought clicks these past days → pick 1 to 2 rising terms and write matching new pages next week with the the page-production lesson routine.

Don't eyeball the data — judge it against four pass lines (sources: GSC "Performance"; pages-per-visit from Cloudflare Web Analytics or GA4):

| Metric | Pass line / target | If it fails |
|---|---|---|
| CTR (click-through rate) | ≥ 2% | Check the TDH trio — title, description, H1 — and the title's pull: does it carry "game name + keyword", does it make you want to click |
| Daily clicks | 1000/day is the goal | New sites climb from single digits; watch the trend — only act (more pages / different terms) after a flat week |
| Pages per visit | ≥ 1.5 | Below 1.5 = not enough internal links: add 1 to 2 links to related articles per page |
| New pages per week | 10+ | **Only add, don't rewrite old pages** — new pages are the incremental signal you hand Google |

**Review discipline: trust only the numbers on the dashboard.**

- **Every conclusion needs a source**: "traffic grew this week" must point at an actual number in GSC or your analytics panel; a conclusion you can't point to a number for carries no weight next week.
- **Actions aren't results**: "published 10 pages", "re-themed the site" are things you did, not results the site got — results are only CTR, clicks, and indexing actually moving on the dashboard.
- **When data overturns an old conclusion, fix it on the spot**: if last week's note said "this term has no volume" and this week's data proves otherwise, correct the note where it stands — don't leave a stale present-tense sentence to mislead next week's you.

### Optional gear: Clarity, a free heatmap (install once, 5 minutes a week)

Numbers tell you **how many people came**; Clarity tells you **what they did on the page** — free click heatmaps plus session recordings. Two things to watch weekly: where users **get stuck**, and **whether the ad slots actually get clicked**.

1. Open [clarity.microsoft.com](https://clarity.microsoft.com) → sign in with a Microsoft account (free) → **Add project** with your domain
2. Choose **Manual install** and grab the `<script>` tracking snippet
3. Open `src/components/layout/BaseLayout.astro` and paste it just before the closing `</head>` tag → push and redeploy
4. Back in the dashboard, wait a few minutes until the status reads Receiving data

Full steps (including which domains to allow if you've set a CSP) are in the repo doc [`docs/deployment.md`](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/deployment.md), section "Use Microsoft Clarity to see what users do on your site". The script loads async and doesn't dent your Lighthouse score.

## Once a month (10 minutes each)

```bash
# 1. Multi-language sites only: see how much translation is missing
pnpm check-i18n

# 2. Bring in the template author's updates (first time: run all three lines)
git remote add upstream https://github.com/PNGTRID/AnvilWiki.git
git fetch upstream
git merge upstream/main
```

What the second group means: register the official repo (called upstream) as the one to watch, pull its latest version, and merge it into your site. **If the terminal shows the word CONFLICT, don't panic**: give the conflicting file names to your AI assistant, say "keep my config and content, follow the official repo for code", and let it resolve them one by one — this step is AI work by nature. The developer manual's "sync" chapter covers it in detail.

Then spend 10 more minutes on the AdSense report: which page types have the highest RPM (usually tier lists and codes) → write more of those next month.

## Every quarter: SEO health check (send this block to your AI assistant)

```text
Run an SEO health check on this site — read-only, change nothing:
1. SITE_URL (wrangler.toml [vars] or .env) contains https:// and is the real domain
2. Every article: title ≤80, description 40–165, summary a direct answer (list the violations)
3. og:image/twitter:image use absolute paths
4. Is noindex misused anywhere
5. Run pnpm check-sitemap; after build, run pnpm check-links and report non-200 / dead links
6. Is multilingual hreflang coverage complete
Output a problem table: file / problem / suggested fix; only change things after I confirm.
```

## The long-term mindset

- Once the first site runs, the second site's marginal cost is tiny — picking, building, producing pages, deploying, operating: you have walked this entire manual once already.
- Keep forgetting the weekly check? Create a repeating Monday reminder in your phone's calendar, titled "30-minute freshness".

## If you get stuck

- **"I can't read the refresh-audit report"**: you don't need to — copy the whole thing and paste it to the AI; the prompt turns it into a todo list.
- **"Monthly merge conflicts"**: hand the conflicted files to the AI with the mantra "keep my config and content, follow the official repo for code".
- **"I keep forgetting to run it"**: a weekly repeating calendar reminder beats willpower.

## ✅ Acceptance criteria (all must hold)

- `pnpm refresh-audit` ran once this week and P0 is zero (the codes page was updated within 7 days)
- ☐ Three weeks running, same time, same three actions
- ☐ You can read GSC's "Performance" page: which terms brought the clicks

## Where to go from here

Scaling starts with the templatize lesson: **[turn your first site into a template](/landing/docs/templatize-your-site)** and copy the next game's site in 30 minutes. To customize this site first, go deep with the [developer manual](/landing/docs/architecture) (add categories, add languages, reskin, turn on comments and analytics); once you have results, submit a PR adding your site to the AnvilWiki official showcase wall (edit the showcase data in `src/config/landing.ts`) — your real case is the best advertisement this template can get.
