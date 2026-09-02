---
title: "Appendix C · Glossary & Command Cheat Sheet"
description: "Every word card in one place — 30+ terms by theme — plus twenty pnpm commands grouped by scenario: writing, QA, config, ops, assets."
manual: learn
order: 32
stage: "Appendices"
icon: lucide:book-marked
tldr: "Two parts: ① the glossary — every lesson's word cards regrouped by theme (SEO & search / site & content / monetization & ops); ② the command sheet — pnpm commands by scenario: writing (new-post / bulk-new-posts), QA (check-content / check-links / build), config (check-config / apply-template / new-locale), ops (refresh-audit / submit-indexnow), assets (gen-covers / gen-assets). One line each — when detail fades, start here."
updated: 2026-09-02
---

## Glossary (grouped by theme)

**SEO & search**

| Term | One line |
|---|---|
| SEO | The craft of getting Google to rank your pages |
| SERP | Google's results page; the top ten are the golden shelf |
| Search intent | What the player actually wants behind the query |
| Intent satisfaction | How well page one answers the question — decides whether you have a seat |
| Long-tail query | "Game + specific problem" mid/low-volume queries; the new site's home field |
| One page, one query | Each page targets one query — the anti-cannibalization rule |
| Quick Answer card | The direct-answer card atop every page; your AI-citation face |
| Impression / CTR | Shown once / the share of shows that became clicks |
| E-E-A-T | Experience, expertise, authority, trust — via real authors, sources, freshness |
| AI Overviews | The AI summary atop Google results; Q&A queries are its home turf |

**Site & content**

| Term | One line |
|---|---|
| frontmatter | The registration card atop each article; AI writes it |
| draft | The unverified flag; production builds never publish it |
| Flip live | Verified, flag removed, visible to every player |
| slug | The page's URL short name, lowercase with hyphens |
| Standard deck | Pages every game wiki needs (codes / guides / bosses / list) |
| Window query | A validated query with competition still open |
| Candidate pool | Games awaiting validation — selection's raw material |
| Golden window | The first 2-8 weeks after a game takes off; most of its lifetime searches |
| P0 / P1 | Staleness urgency: codes over 7 days / bosses and lists over 90 |
| Three-layer separation | Code untouched, config once per game, content daily |

**Monetization & ops**

| Term | One line |
|---|---|
| Traffic / Monetization | Visits / turning visits into money |
| RPM | Revenue per thousand page views |
| AdSense | Google's ad middleman; monthly settlement, revenue 100% yours |
| W-8BEN | The tax declaration claiming the treaty rate, 30%→10% |
| SWIFT code | Your bank's international wire address |
| Payout | Balance over $100 dispatched monthly on the 21st |
| Freshness | The keep-it-alive motion; a fixed rhythm is the only secret |
| AI referrals | Visits from AI assistants — read trends, not absolutes |

## Commands (by scenario)

**Writing**

```bash
pnpm new-post           # interactive single-page scaffold
pnpm bulk-new-posts     # batch drafts from a keyword CSV (--dry-run to preview)
```

**QA (after every change)**

```bash
pnpm check-content      # content lint (H1 / alt / links / trailing slash)
pnpm check-i18n         # translation coverage (--strict-ui as a gate)
pnpm check-config       # category/language three-place consistency
pnpm build              # schema validation + full site build (incl. Pagefind)
pnpm check-links        # internal link audit (run after build)
pnpm check-sitemap      # every sitemap address reachable
```

**Config & site**

```bash
pnpm apply-template     # the rebrand Q&A command (--dry-run to preview)
pnpm new-locale         # add a language
pnpm template-audit     # template health (mandatory before cloning)
```

**Ops & assets**

```bash
pnpm refresh-audit      # freshness audit; the site reports its own stale pages
pnpm submit-indexnow    # push all URLs to IndexNow (after deploy)
pnpm gen-covers         # generate og:image covers (1200×675)
pnpm gen-assets         # regenerate the icon set + homepage image from the theme color
```

## Next

- [Appendix A · The Red-Line Master List](/landing/docs/appendix-red-lines)
- [Appendix B · The Troubleshooting Tree](/landing/docs/troubleshooting-tree)
- Full flags and details: the `docs/` repo documents and AGENTS.md.
