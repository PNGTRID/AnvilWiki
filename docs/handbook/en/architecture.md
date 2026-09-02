---
title: "Read the Map First: What to Change, What to Leave Alone"
description: "Three layers — code (rarely touched), config (once per game), content (daily). The decision tree locates any change in 30 seconds, plus six Astro 5 gotchas."
manual: dev
order: 1
icon: lucide:layers
tldr: "Your site is a three-story building: the first floor is content, new articles daily; the second floor is config, changing the sign and wall color once; the third floor is code, the load-bearing structure barely touched after forking. Locate each change on the decision tree before acting — the wrong floor gets your edits wiped or the site broken at the next upstream sync. Then run the three checks."
updated: 2026-08-17
---

## Where you are now and what this lesson solves

Your site is already earning money, and now you want to touch the template itself — add a feature, reshape something, or just find out whether "this thing" can be changed at all. Before you touch anything, spend 10 minutes understanding which layer any change belongs to. Change it in the wrong place and at best you waste the work; at worst you break the site, or lose every edit the next time you upgrade the template.

## What you'll have when this lesson is done

- A decision tree that pins any request to a file within 30 seconds
- A complete picture of how an article travels from draft to web page

## The three-story building: who lives on which floor, and who should touch whom

| Layer | Directories it hosts | Do you touch it | When you upgrade the template |
|---|---|---|---|
| **Content** (first floor) | `src/content/wiki/`, the home data in each locale JSON | Daily (writing articles) | Almost no conflicts |
| **Config** (second floor) | `src/config/`, `src/locales/`, `src/styles/globals.css` | Once per game switch | Few conflicts — **always keep yours** |
| **Code** (third floor) | `src/pages/`, `src/components/`, `src/lib/`, `src/i18n/` | Basically never | The template author ships you new features |

Three house rules:

1. Changing content never touches the framework; changing config never rewrites the framework.
2. The code layer must **never contain** strings specific to your game — all interface text lives in the locale JSONs.
3. Before touching the code layer, ask yourself: can this honestly not be solved with configuration? (Most of the time it can.)

## The change decision tree (pin it next to you)

```
What do you want to change?
├─ UI text / homepage modules → src/locales/<locale>.json (UI text at the root, homepage modules under home.*)
├─ Game name / domain / author info → src/config/site.ts
├─ Navigation categories → three places must match (see below)
├─ Theme color → top 8 lines of src/styles/globals.css (4 variables × light/dark)
├─ Language list → three places must match (see below)
├─ Article content → .mdx under src/content/wiki/<locale>/<category>/
├─ New components / new pages → Code layer; weigh the upgrade cost before touching
└─ Ads / comments / analytics toggles → Cloudflare dashboard variables or wrangler.toml (pick one; see the integrations chapter)
```

Two "three-place consistency" iron rules (both checked automatically by `pnpm check-config`):

1. **Categories**: the category keys registered in config = `nav.<key>` in the locale JSON = the `src/content/wiki/en/<key>/` directory — identical in all three places; one missing and the build fails.
2. **Languages**: the language list = the locale JSON files = the content directories — three places again, all identical.

## How an article becomes a web page

Short answer: from draft to live, an article passes through four stations.

```
1. You (or AI) write the .mdx article; it opens with a registration card (frontmatter)
2. The inspector (Zod schema) checks the card; bad format → the build fails outright and tells you what's wrong
3. The site generates a fixed URL for every article
4. Everything gets printed as plain HTML files, and the search index is generated automatically
```

Multilingual has one **deliberately asymmetric** rule: when a player opens the URL of an article you only wrote in English, the site shows the English version (that URL never fails to open); but a category list page only shows articles that really exist in that language (no fake empty pages). The former optimizes for "always opens"; the latter for "never lies".

## Six Astro 5 gotchas (only needed when you edit the code layer)

All six were hit in real debugging. Content-layer and config-layer work never needs them:

1. An article's internal id carries the `.mdx` suffix, but queries must strip it (the repo already wraps this — don't concatenate strings yourself).
2. The old Astro `entry.render()` style is gone; use the standalone `render()` function.
3. `getStaticPaths` compiles into its own module and can't see variables at the top of the page file — the data must live inside the function body.
4. Read parameters from the URL with `Astro.params.slug`, not `Astro.props.slug`.
5. Articles must sit under `src/content/wiki/<locale>/`; dropping them directly into `src/content/<locale>/` triggers the legacy mechanism and errors out.
6. English is the default language and lives at the root (`/`) — don't add a `/` → `/en/` redirect.

## Engineering rules quick reference (follow when editing the code layer)

- All interface text lives in the locale JSONs; components never hard-code strings
- Theme color means exactly 4 variables (`--brand` / `--brand-light` / `--brand-h` / `--brand-s`; the text-safe color `--brand-text` is computed automatically from the latter two — never edit it by hand); components may only reference `var(--brand)`, hard-coded color values are forbidden
- Share-card images and canonical URLs always use full `https://` addresses
- The domain is read only from the `SITE_URL` variable and must include `https://`
- An empty ads/comments variable = the matching component renders nothing (keeps the out-of-the-box perfect score)
- No emoji in the UI; icons come uniformly from lucide

## The three checks after every change

```bash
pnpm check-config              # three-place consistency
pnpm typecheck                 # type check, 0 errors
pnpm build && pnpm check-links # build + full-site dead-link check
```

If you touched pure functions under `src/lib/`, add tests (`pnpm test`); if you changed article content, also run `pnpm check-content`.

## If you get stuck

- **"The build fails on a category/language mismatch"**: run `pnpm check-config`; it points out which of the three places doesn't line up.
- **"The style I changed doesn't take effect"**: first confirm you edited the variable layer (the 4 variables) instead of hard-coding color values in a component; then confirm you changed both light and dark sets (8 lines total).

## ✅ Acceptance criteria (all must hold)

- ☐ Take three real requests (say, "change the homepage headline", "add an article", "switch the brand color") and locate each on the decision tree within 30 seconds
- ☐ You can say what each of the two three-place consistency rules covers
- ☐ The three checks pass locally, all green

## Next steps

The map is yours. Head to [Dev 2 · add categories and languages](/landing/docs/categories-and-locales): step-by-step instructions and a companion AI prompt for every request; reskinning and storefront edits live in the Learning Manual's [Theme & Homepage lesson](/landing/docs/theme-and-homepage).
