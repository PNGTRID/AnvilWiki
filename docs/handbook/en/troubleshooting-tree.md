---
title: "Appendix B · The Troubleshooting Tree"
description: "Six frequent symptoms with answers: not indexed, 404, red build, blank ad slots, no analytics, flat rankings — one path each, pointing at the lesson and command."
manual: learn
order: 31
stage: "Appendices"
icon: lucide:list-tree
tldr: "Find your symptom, follow the steps in order: not indexed → sitemap submitted and indexing requested (19), then content volume; 404 → trailing slash, category three-place match, draft flag; red build → last error line, check-config for categories; blank ad slots → variable spelling and redeploy, new slots take days; no analytics → consent banner clicked? redeployed? wait 48 hours; rankings flat → query competition first, then the one-page checklist, then freshness."
updated: 2026-09-02
---

## How to use

Match the symptom, do the steps in order — move to the next only when the previous didn't fix it. Each row points back to its lesson.

## Not indexed (or very slow)

1. Confirm in GSC: sitemap submitted, key pages had "Request indexing" clicked → Lesson 19
2. `pnpm check-sitemap` — every address in the built sitemap returns 200
3. Fewer than 10 pages? Fill the first release before expecting speed — empty sites index slowly
4. Is SITE_URL the real domain? A wrong domain means you submitted a site that doesn't exist (Lesson 18)

## Page 404

1. Does the address end with `/`? The whole site enforces trailing slashes (missing = 404)
2. Do the category folder, navigation.ts, and the locale JSON agree? `pnpm check-config`
3. Is the page `draft: true`? Drafts render only in local dev
4. Did you build after touching route files? Route errors only surface at build (Lesson 16)

## Red build

1. Read the **last line** of the error — 90% of the answer lives there
2. Error names frontmatter → card format issue; fix the named field
3. Error mentions categories → `pnpm check-config`
4. Incomprehensible? Paste the whole thing to AI: "how do I fix this error" (Lesson 16)

## Blank ad slots

1. Are all four variable names spelled exactly right (case-sensitive)? → Lesson 22
2. Did you redeploy after filling them?
3. New site, new slots: filling takes hours to days — wait first
4. Still blank after approval: check the site status in the AdSense dashboard reads ready

## No analytics data

1. GA4: did the visitor — including you — click the consent banner? No click, no load. By design (Lesson 24)
2. Redeployed after filling the token/ID? → Lesson 20
3. GA4 standard reports lag 24-48 hours — the realtime report is the instant channel
4. Clarity stuck pending: script pasted exactly once, just before `</head>` (Lesson 20)

## Rankings flat

1. Competition check first: pro sites or forum threads on page one? Pro sites → retreat to long-tail (Lesson 28)
2. Has the one-page checklist run? title / direct-answer summary / tables / cover (Lesson 28)
3. Content stale? `pnpm refresh-audit`, zero the P0s (Lesson 25)
4. 4-12 weeks of movement is normal — read only the long trend (Lesson 29)

## Next

- [Appendix C · Glossary & Command Cheat Sheet](/landing/docs/glossary-and-commands)
- Still stuck? Feed AI the symptom, a screenshot, and what you already tried.
