---
title: "Batch-Create Inner Pages: Dozens of Traffic Entrances"
description: "Homepages win little search — dozens of inner pages, each aimed at one query, are the workhorse. Three steps: list queries, one prompt, bulk scaffolding."
manual: learn
order: 19
stage: "Monetize & Operate"
icon: lucide:files
tldr: "The bulk of search traffic lives in inner pages, not the homepage: dozens of pages, each targeting one query. Three steps: ① build the list from real GSC queries and rival wikis; ② write ONE unified page-generation prompt — fixed skeleton, never improvised per page; ③ pnpm bulk-new-posts scaffolds the drafts, AI fills them, check-content + build gates the batch. Iron rule: batch ≠ spam; mark thin material 'to be added', never invent data."
updated: 2026-08-26
---

## Where you are, and what this lesson solves

the page-production lesson taught you to write 10 pages a day — but that flow is "one page at a time", and its capacity ceiling arrives fast. Meanwhile the bulk of search traffic is never the homepage: the homepage targets exactly one query (your site's name), while dozens or hundreds of **inner pages** each target one query — together they are the workhorse.

A site that only polishes its homepage has opened the shop door but stocked no shelves. This lesson turns "write one page" into "produce one batch": start from a keyword list, lay down inner pages aimed at different queries.

## What you'll have when this lesson is done

- An inner-page list mined from real search queries (`new-posts.csv`)
- Dozens of draft pages aimed at different queries — scaffolded in bulk, generated in bulk, accepted in bulk
- A repeatable page-production pipeline: list → scaffold → unified prompt → acceptance

## A few words to know

- **Inner page**: every content page besides the homepage (a guide, a codes table, a tier list). Each inner page = one traffic entrance, targeting its own query.
- **Unified prompt template**: ONE fixed "page-generation prompt" — skeleton, rules, and acceptance all locked down; only the source material changes per page. The biggest enemy of batching is improvising structure per page: quality wobbles and phrasing repeats.
- **Doorway pages**: mass-produced hollow pages made only to rank. Google penalizes them explicitly — batching is a capacity tool, not a spam license; the last section covers how to stay clear.

## Step 1: Build the inner-page list (where words come from)

Don't guess. Four sources, ordered by trustworthiness:

1. **GSC "Performance"** (opened in the indexing lesson): queries with impressions but no clicks — a ready-made opportunity list.
2. **Rival wikis' page structures**: search wikis of similar games (fandom sites) and see which pages they have — players' needs, already validated by someone else.
3. **Google autocomplete & related searches**: type the game name, read the dropdown and the page-bottom suggestions.
4. **The game's official changelogs**: new bosses, events, patches = new queries; ship first.

One query per line, tagged with intent (codes / bosses / guides / tier list — the intent table from the page-production lesson). List unclear ones separately and ask — don't guess.

## Step 2: Write ONE unified page-generation prompt

First turn the list into a scaffold file `new-posts.csv` (repo root, columns: `locale,category,slug,title,description`; description can be filled later):

```bash
pnpm bulk-new-posts --dry-run   # preview the plan: what gets created, what is skipped as existing
pnpm bulk-new-posts             # write for real. Everything is draft:true — never enters the build
```

Then feed **the same prompt** to the AI for the whole batch (skill-aware assistants: say "write articles in batch from this keyword list" to trigger the anvil-batch-articles skill; below is the generic version):

```text
Here is my inner-page list (one per line: keyword, intent):
<paste list>
Generate one article page per keyword, one shared skeleton, no boilerplate reuse:
1. First H2 = the keyword rephrased as a question, followed immediately by a 40-60 word direct answer; no H1 in the body
2. Data goes into Markdown tables; steps into ordered lists
3. Frontmatter: description 40-165 chars; summary a 40-60 word direct answer; tags reuse the site's existing vocabulary
4. At least 1 internal link per page, pointing ONLY at pages that exist (if unsure it exists, skip the link)
5. Keywords without enough source material: keep draft:true and mark "to be added" in the body — never invent codes / boss stats / drop rates
6. Within one batch: opening phrasing, section names, and table headers must not repeat across pages; build each page from its own keyword's question
When done run pnpm check-content && pnpm build; all green or it isn't done. List failures, fix, rerun.
```

## Step 3: Batch acceptance, flip drafts one by one

- After `pnpm check-content && pnpm build` is green, list the pages still marked draft.
- For pages whose material is solid, flip `draft: true` off (in small batches), remove the "to be added" marks, rebuild, ship.
- Spot-check 3 pages: does each independently answer a real question? Is phrasing repeated anywhere? Are all internal links reachable?

**Flipping has a rhythm too**: generating 40 to 60 drafts in one go is fine, but **don't release them all at once** — flip only 10 to 15 core pages for v1 (codes / tier list / guides, the high-value terms), then 10+ per week after that. Field-tested: too many pages in the first version dilutes quality and drags the whole site's rankings (same conclusion as the end of the page-production lesson).

## The biggest trap: batch is not spam

This section is the heart of the chapter — worth rereading:

- **Every page must stand alone.** Test: delete every other article — is this one still a guide that solves a player's problem? If not, don't make it.
- **Never invent data.** Codes, boss HP, drop rates — without a user-provided source they cannot be written; mark "to be added" and wait for material. One fake code destroys the whole site's trust; Google and players don't give second chances.
- **No boilerplate reuse within a batch.** Same template with nouns swapped is the classic doorway-pages signature Google penalizes.
- **Internal links only to real pages.** Batch-generated links love pointing at paths that don't exist; `pnpm check-links` after build is the hard gate.

## If you get stuck

- **"bulk-new-posts says category invalid"**: your list uses a category that isn't in navigation.ts. Add it first (3-place rule — the dev manual has a chapter for it), then rerun.
- **"Where do I see the created pages?"**: run `pnpm dev` and open the printed URLs; draft pages are dev-only.
- **"build broke"**: run `pnpm check-content` and read the lint list; batch failures are usually one class of error (e.g. descriptions too short) — fix one class at a time.

## ✅ Acceptance (all must hold)

- ☐ `new-posts.csv` passes `--dry-run`, and you can say how many create / how many skip
- ☐ every generated page passes `pnpm check-content && pnpm build`
- ☐ 3-page spot check: independently useful, no repeated phrasing, all links reachable

## When you're done

With your inner pages batched out, one piece of the Learning Manual remains: indexing is only the entry ticket — rankings and AI citations are where the traffic is. Continue to [the pick-your-game lesson1 · SEO beyond indexing](/landing/docs/seo-traffic) and make every inner page fully earn the query it targets. After that, three roads: back to the weekly-ops lesson to run the weekly rhythm; into the [Development Manual](/landing/docs/architecture) for deep customization; or PR your site onto AnvilWiki's showcase wall (edit the showcase data in `src/config/landing.ts`) — your real site is the best ad for this template.
