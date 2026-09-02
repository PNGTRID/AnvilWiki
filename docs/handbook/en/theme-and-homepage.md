---
title: "Change the Theme Color and Edit the Homepage"
description: "Swap all 8 theme-color variable lines together (a partial swap leaves the old hue); edit homepage copy only in the JSON home section; plus the new-field flow."
manual: dev
order: 3
icon: lucide:palette
tldr: "Changing the theme color means editing only the top 8 lines of globals.css (4 variables × light and dark) — the text-safe color is computed from hue and saturation, so changing only 4 lines leaves the old hue behind. Editing homepage copy means touching only the home.* section of the locale JSON, never components; the \"similar length\" requirement in the prompt protects the layout. New fields are added, never renamed."
updated: 2026-08-17
---

## Where you are now and what this lesson solves

You want to recolor the site, rework the homepage pitch, or hang a new data field on articles — this lesson is the fixed recipe for all three. **A lookup manual: jump to the section you need.**

## Request 1: Change the theme color (5 minutes)

Edit only the top **8 lines** of `src/styles/globals.css` (4 variables × light/dark):

```css
:root { --brand: hsl(...); --brand-light: hsl(...); --brand-h: ...; --brand-s: ...%; }
.dark { --brand: hsl(...); --brand-light: hsl(...); --brand-h: ...; --brand-s: ...%; }
```

Why all 8 lines go together: the text-safe color `--brand-text` is computed automatically from `--brand-h` (hue) and `--brand-s` (saturation) — replace only the first two variables and text colors keep the old hue; the whole site looks "dirty". Can't convert a hex code to HSL? Have AI do it, or run the recolor step of `pnpm apply-template` (it handles all 8 lines automatically). After changing, check contrast once in light mode and once in dark mode.

## Request 2: Edit homepage copy

Every block of homepage text (hero headline, quick links, featured, FAQ, changelog) lives in the `home.*` section of the locale JSON — **editing copy touches zero component code**. Have AI draft it (copy the whole block):

```text
Rewrite the homepage copy. Game: <game name>; selling point: <one-liner>; target players: <description>.
Only edit the site/homepage copy fields in src/locales/ (site.ts and home.*); do not touch component code.
Give me 3 versions of each string to choose from, each close to the current field length (to avoid breaking layout).
After I pick, apply the replacements and run pnpm build to verify — only all-green counts as done.
```

The "close to current length" rule is deliberate: the homepage layout is designed around the current text lengths — copy that suddenly doubles will blow the layout apart.

## Request 3 (advanced): add a new field to the article registration card

Want to hang new data on articles (a new stat card, say)? The flow: add a Zod field in `src/content.config.ts` → consume it in a component → verify with `pnpm build`. Iron rule: **fields are only added, never renamed** — renaming retires every old article on the site. Once the field exists, write its rules into the Requirements section of your page-production prompt, and AI will carry it from then on.

## If you get stuck

- **"Some spots kept the old color after recoloring"**: odds are you changed 4 lines instead of 8, or missed the `.dark` set.
- **"Changed the copy, homepage unchanged"**: confirm you edited the `home.*` section and saved; run `pnpm dev` and refresh to check.
- **"The layout breaks the moment copy changes"**: the new copy is too long — have AI rewrite it at the original length.

## ✅ Acceptance criteria (check the tasks you did)

- ☐ Changed the theme: checked both light and dark modes, no old hue left in text colors
- ☐ Edited copy: `pnpm build` all green, homepage layout not blown apart

## Next steps

Where the ads, comments, and analytics toggles live and how to switch them on — [Dev 4 · the feature-toggle table](/landing/docs/integrations).
