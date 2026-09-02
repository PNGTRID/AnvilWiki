---
title: "Rank One Keyword: From Indexed to Searched"
description: "One page, one query: judge which queries are worth it, then fill every slot on the page — title, question H2, direct-answer summary, tables, cover. Two AI prompts."
manual: learn
order: 28
stage: "Monetize & Operate"
icon: lucide:key-round
tldr: "After the template's tech side, two jobs: ① pick — one page one query; worth-it test: intent matches a page type, volume without hubris (sweet spot = long-tail), you can out-answer page one. ② fill — title leads with the query, first H2 as the question, summary a 40-60 word direct answer, data in tables, quality cover (2026: Images reads og:image first). Two AI prompts included."
updated: 2026-09-02
---

## A true scene first

The indexing lesson handed Google your sitemap; batch production spread dozens of pages — but indexing is only the entry ticket: Google shows ten results per search, and **page two is roughly nowhere**. The good news: the template finished the tech side (structured data, sitemap lastmod, hreflang, the Quick Answer card). Two jobs remain: **pick the query** and **fill the page**.

### Step 1: pick — one page targets one query

"One page, one query" is the sentence that matters: pages crowding the same query only cannibalize each other. Three tests for a candidate query:

1. **Intent matches a page type**: "game codes" → codes page; "best weapons" → tier list; "chapter two walkthrough" → guide. Mismatched queries don't rank no matter how well written.
2. **Volume without hubris**: the bare game name belongs to the big sites; too cold and nobody searches. The sweet spot is long-tail — "game + specific problem" — real volume, opponents often loose forum threads.
3. **You can out-answer page one**: if page one is all plain text and you bring tables, video, and data cards, the out-ranking path is copyable.

Undecided? Feed the list to AI:

```text
Below is my site's candidate keyword list (one per line):
<paste the list>
For each, output four columns: keyword | intent (codes / boss guide / beginner / tier list / other) | rough competition (search it: pro sites on page one = high) | suggested page type.
Then rank by "clear intent + mid-low competition + I can build a better page", give the top 10 with their page types.
```

### Step 2: fill the page — the one-page checklist

With the query chosen, every slot on the page serves it. The template does the heavy lifting (Quick Answer card, JSON-LD); you manage:

| Slot | Rule | Why |
|---|---|---|
| `title` | Query in the first half, ≤ 80 chars | The single heaviest ranking input |
| `description` | One natural mention, 40-165 chars | Decides the snippet's click rate |
| First H2 | The query, phrased as a question | Query-title match benefits rankings and AI citations |
| `summary` | 40-60 word direct answer, required | The Quick Answer card is the top AI Overviews citation candidate |
| Data | Drop rates / numbers in tables | Tables parse better — for machines and humans |
| Internal links | Point to real, related pages | Hands Google a "page relations" signal |
| Cover image | Clear, game visuals, no text-only image | **Since 2026 Google Images reads og:image first** — covers went from decoration to entrance |
| `lastModified` | Bump only on real updates | Faking timestamps reads as untrustworthy |

Then let AI audit the whole site:

```text
Scan every published article under src/content/wiki/ (skip draft:true) against this checklist:
1. title ≤ 80 with the query in the first half; description 40-165
2. First H2 phrased as a question; summary a 40-60 word direct answer
3. At least one table carrying data; internal links all resolve (verify with pnpm check-links)
4. Cover images present and not placeholders
Output four columns: article | issue | location | suggested fix. List problems only. I'll verify with pnpm check-content && pnpm build.
```

## Three classic mistakes (made for you in advance)

- **Multiple pages chasing one query**: three articles on one query, Google picks one — the rest written for nothing. One page, one query.
- **Hubris on the head term**: a new site dueling "the game name" against pro sites loses; step back to the long-tail.
- **Summaries that introduce instead of answer**: "This article covers…" surrenders the AI citation. Direct answer means the answer itself.

## Three words to know (just these)

- **Long-tail query**: "game + specific problem" mid/low-volume queries — the new site's home field.
- **One page, one query**: the anti-cannibalization discipline.
- **Quick Answer card**: the direct-answer card atop every page — your face to AI citations.

## ✅ Acceptance (all must hold)

- ☐ A one-page-one-query table exists: every key page names its query
- ☐ The audit prompt ran site-wide; the problem list is at zero
- ☐ You can name your three most AI-citation-likely pages and why

## Next lesson

Pages filled — the last piece is site-wide slow craft: trust and backlinks, the compounding quarter of rankings. [Go to Lesson 29 · Slow Variables: Trust & Backlinks](/landing/docs/trust-and-backlinks)
