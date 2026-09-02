---
title: "Clone Your Site: The 30-Minute Standard Flow"
description: "Clear template-audit to zero, save a rebrand checklist, then four steps per clone: duplicate, apply-template, content, build. wrangler.toml is the trap."
manual: learn
order: 26
stage: "Monetize & Operate"
icon: lucide:copy-check
tldr: "Scale path: one site eats one game's queries. Before copying run pnpm template-audit (❌ must fix, ⚠️ judgment) and save the rebrand checklist to docs/rebrand-checklist.md. Four steps per clone: duplicate repo → apply-template → first content → build + GSC. ⚠️ wrangler.toml overrides Cloudflare dashboard env — skip it and site two keeps site one's domain and comments."
updated: 2026-09-02
---

## A true scene first

The weekly rhythm runs; site one is "a shop that keeps itself fresh". Scaling is the natural next move: **one site eats one game's queries; ten sites eat ten**. But copy the repo raw and what happens? Game one's domain, site name, codes articles, cover art all come along — site two starts life in site one's old clothes, and you can't say what should change. This lesson turns "clone a site" into a 30-minute standard flow, not an archaeology dig.

The three-layer separation is the foundation:

| Layer | What it is | For a new game |
|---|---|---|
| **Code** `src/pages`, `src/components`, `src/lib` | Load-bearing walls and plumbing | **not one line changes** |
| **Config** `src/config`, `src/locales`, theme color, `public/` | Wall paint and signage | once per game (apply-template does it) |
| **Content** `src/content/wiki/`, cover art | Furniture and stock | fully replaced |

### Step 1: the template health check (2 minutes)

```bash
pnpm template-audit
```

**You'll see**: four check groups — code purity / config completeness / content replaceability / rebrand leftovers — ending in a score like "template health: 8/11".
**Check**: ❌ count is zero. ⚠️ items are reminders, not errors — ask of each: "should site two inherit this?"

### Step 2: fix, then save the rebrand checklist

❌ must fix: game strings inside code (move to config or content layer), category mismatches (align navigation.ts, the locale JSON, the content folders per the error). Then have AI write the checklist:

```text
Generate a "rebrand checklist" document from this repo (read-only, output as markdown):
1. Config layer, file by file, every field holding game info: site.ts / navigation.ts / globals.css theme / routing.ts / src/locales/*.json / manifest.json — each with "what to change for a new site"
2. Content layer, directories to fully replace: src/content/wiki/, src/assets/covers/, public/images/
3. wrangler.toml [vars] must-change items (SITE_URL, PUBLIC_GISCUS_*), with the reminder: while this file exists, Cloudflare dashboard env settings are ignored
4. "This site's private assets": custom changes I made for this game (if findable)
Save as docs/rebrand-checklist.md.
```

The checklist's value: cloning site five in six months requires remembering nothing — follow the list.

### Step 3: the four-step clone

1. **Duplicate the repo** (5 min): on GitHub duplicate or "use this template"; connect the new repo to a new Cloudflare Pages project
2. **Swap the config layer** (10 min): run `pnpm apply-template` in the new repo — name, domain, color, locales, categories, old content cleared
3. **Swap the content layer** (10 min): first pages via the production pipeline; batch later via next lesson
4. **Verify and launch** (5 min): `pnpm build` green → deploy; submit the new site to GSC per the indexing lesson

> ⚠️ The biggest trap: **while wrangler.toml exists it overrides the Cloudflare dashboard's environment variables**. In the new repo either edit its `[vars]` or delete the file and use the dashboard — skip this and site two keeps site one's domain and comments (comments showing site one's discussions? That's the sign).

## Three classic mistakes (made for you in advance)

- **Copying without the audit**: old-game leftovers shipped wholesale; cleaning later is slower than starting clean.
- **Build fails after apply-template**: nine times in ten a category mismatch — `pnpm check-config` pinpoints it.
- **Site two wearing site one's GISCUS config**: the comment sections cross over — swap the four `PUBLIC_GISCUS_*` values per the checklist.

## Three words to know (just these)

- **template-audit**: the template health exam — ❌ must fix, ⚠️ judgment call; the gate before any clone.
- **Rebrand checklist**: the "what to change for a new site" document — your cloning pipeline's manual.
- **Three-layer separation**: code, config, content in their lanes — clone ten sites and it's still only these three layers.

## ✅ Acceptance (all must hold)

- ☐ `pnpm template-audit` shows no ❌
- ☐ The rebrand checklist exists (`docs/rebrand-checklist.md`)
- ☐ Site two completed all four steps, `pnpm build` green, zero code-layer edits

## Next lesson

Site two is open — what fills it? Next lesson: from one keyword list to dozens of traffic entrances. [Go to Lesson 27 · Batch Production](/landing/docs/batch-pages)
