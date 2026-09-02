---
title: "Turn Your First Site into a Template"
description: "One command (pnpm template-audit) checks template health; fix violations, distill a rebrand checklist — then every new game is copy, apply-template, swap, build."
manual: learn
order: 18
stage: "Monetize & Operate"
icon: lucide:copy-check
tldr: "Before copying the repo, run pnpm template-audit: it checks whether game-specific strings leaked into the code layer (❌ must fix) and how much config/content is still tied to the old game (⚠️ handle before copying). Then distill a rebrand checklist. Every new site after that: copy repo → pnpm apply-template → swap the content layer → pnpm build — 30 minutes, zero code edits."
updated: 2026-08-20
---

## Where you are, and what this lesson solves

With the weekly rhythm from the weekly-ops lesson running steadily, your first site is a shop that keeps itself fresh. The scaling path is natural: one site harvests one game's hot keywords, ten sites harvest ten.

But if you copy the repo today for a second game, the first game's domain, site name, codes articles, and boss covers all come along — the new site wears the old site's clothes from day one, and you can't easily say what should change and what must not.

This lesson fixes exactly that: **turn "polishing my first site" into "polishing a template."** Afterwards, copying a new site is a 30-minute standard procedure, not an archaeology dig.

## What you'll have when this lesson is done

- A template health report (`pnpm template-audit`) that says exactly what is still tied to the old game
- A rebrand checklist: which files must change, which directories must be replaced
- The standard four-step flow for site #2, with zero code-layer edits

## A few words to know

- **Three-layer separation**: AnvilWiki's skeleton principle — copying ten sites only ever touches these three layers:

  | Layer | What it is (analogy) | When swapping to a new game |
  |---|---|---|
  | **Code layer** `src/pages`, `src/components`, `src/lib` | Load-bearing walls and plumbing | **Not one line changes** |
  | **Config layer** `src/config`, `src/locales`, theme color, `public/` | Wall paint and house number | Change once per game (`apply-template` does it) |
  | **Content layer** `src/content/wiki/`, cover art | Furniture and goods | Fully replaced |
- **Template health**: a measurable answer to "can this still be copied cleanly into the next site?" `pnpm template-audit` scores it ✅/⚠️/❌ and prints a line like "template health: 8/11".
- **Rebranding** ("换皮"): swap the template's shell (config + content layers) to another game; the code layer stays untouched.

## Step 1: Run the template health check (2 minutes)

**What to do**: let the site report how far it is from a clean template.
**How to do it**: in the terminal:

```bash
pnpm template-audit
```

**You'll see**: four groups of checks — ① code-layer purity (framework code must carry zero game-specific strings); ② config-layer completeness (domain, game name, the 3-place category rule); ③ content-layer replaceability (article count per category, leftover drafts); ④ rebrand leftovers (demo artwork, demo article content, demo values in wrangler.toml). The last line is the score, e.g. "template health: 8/11".
**Confirm it worked**: zero ❌. ⚠️ are nudges, not errors — on your first site they mean "handle before copying, or consciously skip".

## Step 2: Fix (❌ to zero, ⚠️ case by case)

| Report item | How to fix |
|---|---|
| ❌ game string in the code layer | Breaks layering. Move the string into the config layer (`site.ts` / `locales`) or content layer (MDX); code should read it from config |
| ❌ category 3-place mismatch | Follow the report: align `navigation.ts`, `en.json`, and the `src/content/wiki/en/<category>/` directory name |
| ⚠️ demo domain / game name left | `pnpm apply-template` walks you through it; if already rebranded, patch the missed fields by hand |
| ⚠️ demo artwork left | Replace with your own art or delete (apply-template also clears it) |
| ⚠️ draft:true leftovers | Decide per article: publish (remove draft) or delete |
| ⚠️ a category with 0 articles | Write 1 article, or remove the category from navigation |

## Step 3: Distill the rebrand checklist (10 minutes)

Once the health score is acceptable, write down "everything a new copy must change" as a checklist in the repo. Have the AI draft it:

```text
Based on the current repo, generate a "rebrand checklist" document (read-only, output as markdown):
1. Config layer, file by file: list fields carrying game info — site.ts / navigation.ts / globals.css theme / routing.ts / src/locales/*.json / manifest.json — each with "what to change it to when copying"
2. Content layer: list directories that must be fully replaced — src/content/wiki/, src/assets/covers/, public/images/
3. wrangler.toml [vars]: list must-change keys (SITE_URL, PUBLIC_GISCUS_*), and remind: while this file exists, Cloudflare dashboard env vars are IGNORED
4. Separately list "private assets": custom changes I made for this game (if any are found)
Save as docs/rebrand-checklist.md.
```

Why it matters: when you copy site #5 half a year from now, you execute the checklist instead of recalling details.

## Copying site #2: the 30-minute standard flow

1. **Copy the repo** (5 min): duplicate your repo on GitHub (or "use this template"), connect the new repo to a new Cloudflare Pages project.
2. **Swap the config layer** (10 min): run `pnpm apply-template` in the new repo — it walks you through site name, domain, theme color, locales, categories, and clears old content.
3. **Swap the content layer** (10 min): produce the first batch of articles with the the page-production lesson routine; to fill pages in bulk, go straight to the pick-your-game lesson0.
4. **Verify and launch** (5 min): `pnpm build` green → deploy → add the new site to Google Search Console (back to the indexing lesson).

> ⚠️ The wrangler.toml trap (from the go-live lesson, most easily hit when copying): while this file exists it **overrides** the Cloudflare dashboard's environment variables. After copying, either edit its `[vars]` or delete the file and use the dashboard — skip this and the new site silently uses the old site's domain and comments.

## If you get stuck

- **"template-audit shows a pile of ⚠️"**: warnings aren't errors. For each, ask "do I want this carried into the next site?" Fix if yes, leave if no.
- **"build fails after apply-template"**: nine times out of ten it's the category 3-place rule — run `pnpm check-config` to pinpoint it.
- **"Site #2's comments show site #1's discussions"**: the Giscus config wasn't swapped — check the four `PUBLIC_GISCUS_*` values in `wrangler.toml`.

## ✅ Acceptance (all must hold)

- ☐ `pnpm template-audit` has zero ❌, and you can read the score
- ☐ the rebrand checklist is generated and saved (`docs/rebrand-checklist.md`)
- ☐ site #2 went through the four-step flow: `pnpm build` green, zero code-layer edits

## What's next

The template is ready; the next lesson answers "what fills a new site": [the pick-your-game lesson0 · batch-create inner pages](/landing/docs/batch-pages) — turn one keyword list into dozens of traffic entrances.
