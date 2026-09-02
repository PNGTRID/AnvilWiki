---
title: "SEO beyond indexing: rankings and AI citations"
description: "Indexed is just the entry ticket — rankings and AI citations are where traffic lives. A keyword map, a per-page checklist, and the 2026 rule changes worth knowing."
manual: learn
order: 20
stage: "Monetize & Operate"
icon: lucide:trending-up
tldr: "Indexed ≠ found: chapter 6 got you into Google, this lesson moves you up the results page. Three moves: ① pick keywords — one page, one query, from real GSC data, never guesswork; ② make it count — keyword in title, question H2, Quick Answer summary, tables, quality cover (Google Images reads it first); ③ build trust — freshness, bylines, internal links. 2026 rules: FAQ rich results are gone, llms.txt does nothing for Google, AI Overviews loves direct answers."
updated: 2026-08-26
---

## Where you are, what this lesson solves

the indexing lesson handed your sitemap to Google and pages started getting indexed; chapter 10 gave you dozens of inner pages, each targeting a query. But indexing is only the entry ticket — when a player searches "how to beat XX", Google shows ten results per page, and page two might as well not exist.

This lesson is about climbing from "indexed" to "clicked", and then to the 2026 battleground: being cited by AI Overviews and AI assistants like ChatGPT. The good news: the template already handles the technical side (structured data, sitemap lastmod, hreflang, Quick Answer cards). What's left for you is two habits — picking keywords and making each one count — plus not stepping on the new rules.

## What you'll walk away with

- A one-page-one-keyword map: which page targets which query, and whether it's worth it
- A per-page SEO checklist (with an AI prompt that audits the whole site in one pass)
- A correct model of the 2026 Google rule changes: which old tricks died, which signals got more valuable

## A few words to know first

- **Ranking signals**: what Google uses to decide who ranks above whom. The three you can influence here: how well the page matches the query, how trustworthy it is (authorship / freshness), and how healthy the site is (no dead links, no filler pages).
- **Search intent**: what the player actually wants when typing the query. "XX codes" wants a code table, "XX tier list" wants a ranking — if intent doesn't match the page type, even great writing won't rank (that's why chapter 4 drilled intent classification).
- **AI Overviews**: the AI summary box at the top of Google results that cites a few sources. Question-shaped queries (game wikis' home turf) trigger it most — a citation there is free top-of-page visibility.
- **E-E-A-T**: Google's umbrella term for experience, expertise, authoritativeness, trust. For a game wiki that means: real author bylines, sourced data, content that isn't stale.

## Step 1: Pick keywords — one page, one keyword

"One page, one keyword" is the most important sentence in this lesson: every page fights for exactly one query; several pages crowding the same query just fight each other.

Where keywords come from was covered in chapter 10 (GSC performance / competitor wikis / autocomplete / official patch notes). Here's how to judge whether a keyword is worth doing:

1. **Intent maps to a page type**: "XX codes" → codes page, "XX best weapons" → tier list, "XX chapter 2 guide" → guide page. If it can't map, the page won't rank no matter how well it's written.
2. **Volume without going head-on**: bare game names are fortified by big sites — a new site can't take them. Ice-cold keywords have no searches. The sweet spot is long-tail "game name + specific question" — decent volume, often only scattered forum threads to beat.
3. **You can build the better answer**: when page one is all text walls, your table + video + stat card is a repeatable path to outrank them.

When in doubt, feed the list to your AI assistant for triage:

```text
Here is my game wiki's candidate keyword list (one per line):
<paste list>
For each keyword output four columns: keyword | search intent (codes / boss guide / beginner tutorial / tier list / other) | competition guess (search it: dedicated sites on page one = high, forum threads = low) | suggested page type.
Then rank by "clear intent + low-to-mid competition + I can build a clearly better page", list the top 10 keywords to do first, and state which page type each should use.
```

## Step 2: Make the keyword count — the per-page checklist

Once the keyword is picked, every slot on the page should serve it. The template automates the big half (Quick Answer card, JSON-LD, structured data); when writing content, own these:

| Slot | Rule | Why |
|---|---|---|
| `title` | Keyword in the front half, ≤ 80 chars | The single heaviest on-page signal |
| `description` | Contains the keyword once, naturally, 40-165 chars | Drives the click-through rate of your result snippet |
| First H2 | Question-shaped rewrite of the keyword | Matching the query wording helps both rankings and AI citations |
| `summary` | 40-60 word direct answer, always filled | The Quick Answer card is the #1 AI Overviews citation candidate |
| Data | Drop rates / stats / builds in Markdown tables | Tables parse better than prose — for machines and humans alike |
| Internal links | Point at real pages on your site | Hands Google the page-relationship signal beyond the sitemap |
| Cover image | Sharp, game-recognizable, no plain text images | **Since 2026 Google Images reads the article cover (og:image) first** — cover quality now decides your image-search entry |
| `lastModified` | Update only on substantive changes | Faking timestamps reads as untrustworthy; real updates earn a boost |

Don't eyeball this yourself — have the AI audit the whole site against the checklist:

```text
Scan every published article under src/content/wiki/ (skip draft:true) against this checklist:
1. title ≤ 80 chars with the main keyword in the front half; description 40-165 chars
2. Is the first H2 question-shaped? Is summary a 40-60 word direct answer?
3. Does the body carry at least one data set in a Markdown table? Do internal links all point at pages that really exist (verify with pnpm check-links)?
4. Is the cover image missing or an obvious placeholder?
Output a four-column table: article | issue | exact location | suggested fix. Only list articles with issues. After fixes I'll run pnpm check-content && pnpm build to verify.
```

## Step 3: Build trust — three slow site-level variables

Rankings look past single pages to the whole site. Three slow variables — no shortcuts, but they compound:

- **Freshness**: a wiki with expired codes and stale guides gets demoted site-wide. the weekly-ops lesson's weekly `refresh-audit` + `lastModified` loop is exactly this — the 30-minute weekly rhythm is SEO, not extra chores.
- **Author bylines**: register real authors in `src/config/authors.ts` and articles emit Person JSON-LD (more credible than an anonymous "staff").
- **A real internal-link network**: tag hubs, related articles, and category pages interlink, showing Google a structured reference library rather than isolated pages.

In the other direction, **Google just finished an anti-spam update rollout in August 2026** — three red lines to stay off: bulk filler pages (chapter 10's doorway-pages section), fabricated data (fake codes / made-up stats), and undisclosed sponsored recommendations (affiliates must go through the `AffiliateLink` component, which adds the compliant disclosure automatically). The template ships guardrails for all three — don't route around them.

## Backlinks: when to build them, and how many

Backlinks (other sites linking to yours) account for roughly 13% of Google's ranking factors — meaningful, but the place beginners most often misallocate effort:

- **In the new-site phase (weak-competition fresh terms) they are not the bottleneck**: everyone is a new site with no backlinks; what's being compared is page quality, product experience, and dwell time. In the field, sites with single-digit backlinks have outranked sites with thousands — content and experience first, total score decides.
- **The strategy is two phases**: before rankings arrive, don't grind for backlinks; once your core terms reach page one or two and growth flattens, come back and build — that's when each link is help arriving in the snow.
- **When you do build**: swap links with same-niche sites whose DR (domain rating) is a bit above yours; find no-login, post-and-link sites, verify one by hand that a link actually sticks, then have your AI script the batch; keep a steady small drip — hundreds dumped at once look bought.
- **The red line**: quality beats quantity, and **never buy junk backlinks** (link farms / bulk spam) — at best useless, at worst a manual penalty.

The full chapter is "Link-building strategy" in the repo doc [`docs/seo.md`](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/seo.md) — including a priority-ranked list of nine channels (Reddit / Steam / Discord / link exchanges / resource pages / broken-link swaps and more), step-by-step instructions for each, outreach email templates, and a free-tool toolbox.

## The 2026 rule changes: dead-tricks list

- **FAQ rich results are dead**: since May 2026 Google fully removed the FAQ rich-snippet style — the old promise that "Q&A markup becomes a collapsible strip in results" is void. Keep the FAQPage structured data (machines still parse the semantics) but stop investing extra effort in it.
- **llms.txt does nothing for Google**: Google officially confirmed it ignores llms.txt with zero ranking impact. But AI assistants like ChatGPT and Perplexity do use it as a site index — the template's `/llms.txt` still generates automatically; treat it as a business card for AI assistants, not a Google hack.
- **AI Overviews citation preferences**: direct-answer blocks (summary), structured data (tables / stat cards), fresh content — exactly what the template ships plus this lesson's checklist. Just follow it.
- **Image-search entry = your cover image**: Google now prefers og:image when picking images, i.e. every article's cover. The cover went from decoration to a traffic entrance — worth two extra minutes to pick a good one.

The full timeline (9 entries, with official links) lives in the repo doc [`docs/seo.md`](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/seo.md) under "Google 官方规范更新记录 (2026)" — dig in there if you want the sources.

## If you get stuck

- **"Indexed but not ranking"**: check the competition first — search the keyword; is page one dedicated sites or forum threads? Dedicated sites mean you should pick a longer-tail variant (add "how", "where", "best") and fight that instead.
- **"GSC shows impressions but few clicks"**: you're probably ranking mid-page and the title/description isn't compelling. Rewrite the description (step 2) and request re-indexing.
- **"Rankings are bouncing"**: Google tweaks its algorithms monthly; 4-12 week swings are normal. Watch the trend, don't rebuild the site over one week's dip.
- **"AI Overviews never cites me"**: check that your summary is actually answering (not describing the article's structure) and that data lives in tables; citations have a randomness component — max out what you control.

## ✅ Acceptance (all must hold)

- ☐ A one-page-one-keyword table exists: every key page names the query it targets
- ☐ The step-2 audit prompt ran site-wide and its issue list is cleared
- ☐ You can name the three pages most likely to land in AI Overviews, and why

## After this lesson

The Learning Manual now closes its full loop: pick a game → build the site → produce pages → get indexed → monetize → stay fresh → templatize → batch → **rank and get cited**. SEO is slow work: finish the checklist, then trust chapter 8's weekly rhythm and 4-12 weeks of patience. For technical depth, see the repo doc [`docs/seo.md`](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/seo.md) (configuration reference + the 2026 official-update log); to automate the weekly data review, see the [Development Manual's AI ops chapter](/landing/docs/ai-ops).
