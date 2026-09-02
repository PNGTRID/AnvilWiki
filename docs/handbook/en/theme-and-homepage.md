---
title: "Theme & Homepage: The Recolor Rule and Homepage Copy"
description: "Recoloring means all 8 variable lines atop globals.css move together — 4 leaves the old hue. Homepage copy edits only the JSON home section. Optional lesson."
manual: learn
order: 12
stage: "Stand It Up"
icon: lucide:palette
tldr: "Last lesson's rebrand already painted the site with your color. This lesson covers the two things it doesn't: ① recoloring again means moving all 8 lines atop globals.css together (the text-safe color is computed from hue + saturation; swapping 4 leaves the whole site looking dirty); ② homepage copy edits only the home.* section of the locale JSON — never component code — with 'similar length' in the prompt protecting the layout. Optional: skipping it costs you nothing later."
updated: 2026-09-02
---

## A true scene first

Last lesson's rebrand already painted the whole site with the hex code you gave it. When do you need this lesson: a week in, the color feels off; you want to tweak one homepage line; or you're curious why a color change touches 8 lines. **This lesson is elective** — not interested? Go straight to the next lesson and start writing content; the site earns either way.

## Task 1: change the theme color again (5 minutes)

Edit only the top **8 lines** of `src/styles/globals.css` (4 variables × light and dark):

```css
:root { --brand: hsl(...); --brand-light: hsl(...); --brand-h: ...; --brand-s: ...%; }
.dark { --brand: hsl(...); --brand-light: hsl(...); --brand-h: ...; --brand-s: ...%; }
```

Why all 8 move together: the text-safe color `--brand-text` is **computed** from `--brand-h` (hue) and `--brand-s` (saturation) — swap only the first two variables and the text color keeps the old hue; the whole site looks "dirty". Can't convert a hex code to HSL? Hand it to AI, or rerun `pnpm apply-template`'s recolor step (all 8 lines, automatic). Afterwards eyeball the contrast in both light and dark modes.

## Task 2: edit homepage copy

Every block of homepage text (headline, quick entries, picks, FAQ, changelog) lives in the `home.*` section of the locale JSON — **editing copy never touches component code**. Have AI draft it (paste whole, `<>` replaced):

```text
Rewrite the homepage copy. Game: <game name>; pitch: <one line>; target player: <description>.
Touch only the site/homepage copy fields in src/locales/ (site.ts and home.*), never component code;
give 3 options per field, similar in length to the current text (to protect the layout).
After I pick, apply the changes and run pnpm build to verify — all green or not done.
```

"Similar in length" is deliberate: the homepage layout is designed around the current text lengths; copy that suddenly doubles bursts the layout.

> **Going deeper**: want to hang a new data field on articles (say, a new stat card)? The flow: add a Zod field in `src/content.config.ts` → consume it in a component → `pnpm build` to verify. Iron rule: **fields are added, never renamed** — renaming retires every existing article on the site. This path leads into the Development Manual's territory; return when a real customization need shows up.

## Three classic mistakes (made for you in advance)

- **Swapped 4 lines, not 8 — or missed the `.dark` set**: some pages off-color, dark mode leaking the old hue; nine times in ten this.
- **Copy edits burst the layout**: the new text is too long. Have AI rewrite at the original length; don't hand-edit.
- **Editing component code "to change the words"**: every homepage string comes from the locale JSON — none lives in a component. Changing words means changing JSON; editing `.astro` files only breaks things.

## Three words to know (just these)

- **CSS variable**: the shared "color socket" for the whole site — change `--brand` once, the whole site follows.
- **HSL**: a way to describe color by hue (H), saturation (S), lightness (L) — the template's automatic text color is computed from it.
- **Light/dark pairs**: every variable exists twice — `:root` (light) and `.dark` (dark); recolors always move in pairs.

## ✅ Acceptance (check what you did)

- ☐ Recolored: checked in light and dark, no old hue left in text
- ☐ Homepage copy: `pnpm build` all green, layout intact
- ☐ Or: you decided to skip this lesson and go write content (entirely fine)

## Stage two — graduated, and next lesson

Stage two is done: **a running site that is entirely yours**. Picking (stage one) and standing it up (stage two) were the preparation — next stop, the real engine of this business: having AI write 10 build-check-passing guide pages in a day. [Go to Lesson 13 · Your First Page](/landing/docs/first-article)
