---
title: "Appendix A · The Red-Line Master List"
description: "Every red line from the manual on one page — content, AdSense, backlinks, copyright, engineering — a 60-second scan before anything ships."
manual: learn
order: 30
stage: "Appendices"
icon: lucide:octagon-alert
tldr: "Five red-line categories, scanned before anything ships: content (invented codes/numbers, unverified video claims flipped live, bulk filler); AdSense (clicking your own ads, applying on pages.dev, PIN unverified for four months); backlinks (link farms, hundreds at once); copyright (scraped images, copied copy); engineering (bare drafts, hand-edited build output, popunder ads beside AdSense). No gray zones — every row is a proven way to crash."
updated: 2026-09-02
---

## How to use

Sixty seconds before publishing anything or running any growth move. No gray zones here — every row is a repeatedly proven way to crash, not a style opinion.

## Content

| Red line | Why it kills | The right move |
|---|---|---|
| Letting AI invent codes, numbers, drop rates | Players know instantly; trust never grows back | `[TBD]` the gap, ask a human |
| Flipping video-spoken codes/numbers without verifying | Creators misquote and go stale | `draft: true`, verify by hand, then flip (Lesson 14) |
| Bulk filler pages for count | Anti-spam updates target exactly this; drags the whole site | Generate in batches, ship in batches, verify each (16/17) |
| Reposting someone's video script | Copyright + duplicate content | Facts as reference, fully rewritten; embedding the video is compliant |

## AdSense

| Red line | Why it kills | The right move |
|---|---|---|
| Clicking your own ads, recruiting clicks | Invalid activity — the most common ban | Use preview tools to check |
| Applying on a pages.dev domain | Almost never passes; rejections follow the account | Own domain first (Lesson 18) |
| PIN unverified for four months | Ad serving pauses; income stops | Real address, verify on arrival (Lesson 23) |
| Popunder ads on a site running AdSense | Violates Google's ad placement policies | Choose one; Adsterra non-popunder formats (docs/ads.md) |

## Backlinks

| Red line | Why it kills | The right move |
|---|---|---|
| Buying link-farm / blasted links | Useless at best, manual penalty at worst | Content first; quality trades when the time comes (Lesson 29) |
| Hundreds of links in one go | The spike reads as purchased | Small, steady growth |

## Copyright & privacy

| Red line | Why it kills | The right move |
|---|---|---|
| Scraped images as media | Copyright complaints pull pages | Three legal channels: own captures / official kits / CC (Lesson 15) |
| AI-generated "game screenshots" | Not real footage — misleads players | Capture and record yourself |
| Undisclosed paid recommendations | Disclosure rules plus Google trust | Affiliate always via the `AffiliateLink` component (auto-marked) |

## Engineering

| Red line | Why it kills | The right move |
|---|---|---|
| Bare-shipping unverified drafts | Sick pages ship; holes never close | Verify before flipping (Lesson 16) |
| Hand-editing build output, skipping git | Output is temporary; edits vanish | Change source; one commit per page |
| AI changing code for copy needs | Code is load-bearing | Copy lives in config/JSON (12/16) |
| Forgetting wrangler.toml when cloning | New site inherits the old domain and comments | Follow the rebrand checklist (Lesson 26) |

## Next

- [Appendix B · The Troubleshooting Tree](/landing/docs/troubleshooting-tree)
- [Appendix C · Glossary & Command Cheat Sheet](/landing/docs/glossary-and-commands)
