---
title: "Add Categories and Add Languages"
description: "Step-by-step recipes for adding a navigation category (three-place consistency) and adding a language (scaffold plus translation prompts). A lookup manual."
manual: dev
order: 2
icon: lucide:folder-tree
tldr: "Adding a category = config, locale JSON, and content directory agree in three places at once (pnpm check-config is the gatekeeper); one prompt lets AI do it all. Adding a language = run pnpm new-locale for the skeleton, then AI translates the UI against the English JSON and the articles one by one (codes are never translated). The switcher only lists languages that really have content."
updated: 2026-08-17
---

## Where you are now and what this lesson solves

Sooner or later after launch you'll want to add a "weapons" category, or ship a Japanese version. This lesson turns each of those two tasks into a fixed recipe — follow it and you can't go wrong. **A lookup manual: jump to the section you need.**

## Request 1: Add a navigation category (e.g. "weapons")

You met the category rule in the architecture chapter: **three-place consistency, no place optional**. Adding `weapons`:

```bash
# 1. Content directory (create the directory first, then add the first article)
mkdir -p src/content/wiki/en/weapons

# 2. Config: add to src/config/navigation.ts following the existing entries' style
#    { key: 'weapons', icon: 'lucide:sword' }

# 3. Locale: add nav.weapons (navigation label) to src/locales/en.json
#    and overview.weapons (list page title and description)
```

Then run `pnpm check-config` (three-place consistency) + `pnpm build` (format check). The other languages' JSONs need the same key too (missing it won't break anything — the UI falls back to English — but `pnpm check-i18n` will list it to remind you).

Delegate to AI (copy the whole block, replace `weapons` with your category name):

```text
Add a new category "weapons" to the site. Change all three places consistently:
1. Add { key: 'weapons', icon: 'lucide:sword' } to src/config/navigation.ts, following the style of existing entries
2. Add nav.weapons and overview.weapons to src/locales/en.json, matching the copy style of existing categories
3. Create a skeleton article under src/content/wiki/en/weapons/ (schema-valid frontmatter, draft: true)
Also add the key to every other existing language's JSON. When finished, run pnpm check-config && pnpm build — only all-green counts as done.
```

## Request 2: Add a language (Japanese as the example)

Language three-place consistency: the language list config = the locale JSON files = the content directories.

```bash
# Step 1: run the scaffold (it asks for the language code, e.g. ja) — it generates the JSON skeleton and the content directory
pnpm new-locale
```

Step 2 — have AI translate the interface text (copy the whole block):

```text
I just added <language-code> with pnpm new-locale. Translate that language file:
translate src/locales/<language-code>.json key by key against src/locales/en.json,
do not add or remove keys; keep category keys consistent with navigation.ts.
Run pnpm check-config && pnpm check-i18n to verify — only all-green counts as done.
```

Step 3 — translate the articles (one at a time):

```text
Translate src/content/wiki/en/<category>/<slug>.mdx into <target-language> and
write it to the same path under src/content/wiki/<target-language>/. Rules: translate only
title/description/summary and the body; leave slug, dates, internal link paths, and the
code field of codes entries untouched; keep tags in English when no equivalent exists;
draft a glossary first so terminology stays consistent throughout. When done, run
pnpm check-content && pnpm build && pnpm check-i18n — only all-green counts as done.
```

Note: the codes themselves (the `code` field) are never translated — they are alphanumeric strings shared worldwide.

**The language switcher only lists languages that really have content** — while Japanese has zero articles, Japanese won't appear in the switcher. This prevents tap-into-a-blank-page moments.

## If you get stuck

- **"check-config reports a category mismatch"**: its output names exactly which of the three places doesn't line up — fill in what's missing.
- **"The build broke after translating articles into the new language"**: nine times out of ten a registration-card field got mangled during translation (a stray period in a date, that kind of thing); look at the exact file and line in the build error.

## ✅ Acceptance criteria (check the tasks you did)

- ☐ Added a category: `pnpm check-config && pnpm build` all green, the new category shows in navigation with a non-empty list
- ☐ Added a language: `pnpm check-i18n` reports nothing missing, the new language appears in the switcher

## Next steps

Customizations beyond categories and languages — changing the theme color, editing homepage copy, adding new article fields — are in [Dev 3 · change the theme color and edit the homepage](/landing/docs/theme-and-homepage).
