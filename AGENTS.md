# AGENTS.md

Workspace instructions for ZCode agents working on AnvilWiki.

## Repository Purpose

AnvilWiki is an **open-source (MIT) game wiki site template** built with **Astro 5 + Cloudflare Pages**. It is the Cloudflare-native, performance-optimized alternative to the Next.js-based `vvultimatum_sbs` template from the "诗意游戏站小白课" course (whose `@cloudflare/next-on-pages` adapter is deprecated).

Goal: let beginners deploy a game wiki site to Cloudflare Pages for free (unlimited bandwidth) in ~30 minutes, with strong SEO, i18n, and ad-monetization built in.

**Status (as of 2026-08-11)**: Planning stage. Only `README.md` + `docs/PRD.md` exist. No code yet. Code MVP starts after PRD review.

## Read These First

- **`docs/PRD.md`** — the single source of truth for architecture, data models, module design, and roadmap. **Read before any code change.** 15 chapters + 3 appendices.
- `README.md` — project pitch + quick start (Chinese + English).

## Intended Tech Stack (verified, as of 2026-08-11)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro 5 (`output: 'static'`) | Pure static, **no adapter** (unlike Next.js) |
| Content | Content Layer API + `glob()` loader, Zod schema | Defined in root `content.config.ts`. Base dir is `./src/content/wiki` (subdirectory required to avoid Astro's legacy auto-collection of `src/content/<locale>/` folders). |
| MDX | `@astrojs/mdx` ^4.3.x | **mdx 3.x fails with Astro 5.18** (`./jsx/renderer.js` not in exports). mdx 4.x pairs with astro 5.x; mdx 7.x needs astro 7.x. |
| Styles | Tailwind CSS 3 + `@astrojs/tailwind` | Theme via CSS variables mapped in `tailwind.config.mjs` (shadcn-style tokens). |
| Icons | `astro-icon` + `@iconify-json/lucide` | Use `lucide:` prefix on every icon name. `reddit` does NOT exist in lucide (use `globe`). |
| UI | **Pure Astro native components (`.astro`)** | Do NOT introduce React/Vue/Svelte runtime. Use `<details>`/`<dialog>` + minimal vanilla JS for interactivity. |
| i18n | Astro built-in (`prefixDefaultLocale: false`) | English has no `/en` prefix, others prefixed. Spread `[...locales]` into config — Astro's `Locales` type rejects readonly tuples. |
| Sitemap | `@astrojs/sitemap` | Auto-generates hreflang alternates from the i18n config. |
| Deploy | Cloudflare Pages | `pnpm build` → `dist/` |
| Pkg manager | pnpm 11 | **`allowBuilds:` in `pnpm-workspace.yaml`** (NOT `onlyBuiltDependencies` — that's pnpm 10, dead in v11). esbuild + sharp need build approval or `astro build` fails during its pre-build dep check. |
| Node | 20 LTS | |

## Architecture: Three-Layer Separation (critical)

This is the core design principle inherited from the course template. **Respect it in every edit:**

```
框架层 (src/pages, src/components, src/lib)      — fork-once, never edit per-game
配置层 (src/config, src/i18n/routing.ts, globals.css, public/) — edit once per game
内容层 (src/content, src/locales)                — fully replace per game
```

- Changing content must not touch framework code.
- Changing config must not rewrite framework.
- Framework layer should have **zero** game-specific strings.

## Hard Rules (from PRD — these are non-negotiable)

1. **All UI text comes from JSON** (`src/locales/<locale>.json`), never hardcoded in components.
2. **Theme color = 4 lines only**: `--nav-theme` + `--nav-theme-light` in `:root` (2 lines) + `.dark` (2 lines) in `src/styles/globals.css`. All other color vars reference via `var(--nav-theme)`. **No hardcoded hex/rgba/Tailwind color classes** in components.
3. **sitemap must scan actual MDX files** — never generate URLs from hardcoded arrays (e.g. `NAVIGATION_CONFIG`). Reason: list pages may show items without MDX, producing 404 sitemap entries.
4. **Category `key` must be identical in 3 places**: `src/config/navigation.ts` (`NAVIGATION_CONFIG[].key`) == `src/locales/en.json` (`nav.<key>`) == `src/content/<locale>/<key>/` directory name.
5. **`locales` array must be synced in 3 places**: `src/i18n/routing.ts` == actual files in `src/locales/*.json` == directories in `src/content/<locale>/`.
6. **Article frontmatter starts at H2** — never write H1 in MDX body; `ArticlePage` renders `title` as H1.
7. **og:image / twitter:image must be absolute URLs** — use `${SITE_URL}/...`, never relative.
8. **Ad keys via env vars** — ad components `return null` when key empty. Never hardcode ad keys.
9. **`SITE_URL` env var for domain** — never hardcode `*.wiki` domain in code.
10. **No emoji in UI** — use lucide icons (`astro-icon` or inline SVG).

## i18n Behavior (subtle, easy to get wrong)

- **Single article**: if a locale version is missing, **fall back to English** (do NOT 404). Metadata also falls back.
- **List page**: does **NOT** fall back — if locale has no articles, show empty state (`shared.noArticles`).
- This asymmetry is intentional: list = accuracy (don't show what doesn't exist); detail = reachability (direct URL never 404).

## Ads: iframe Isolation (do not refactor)

Each ad slot is a standalone HTML file in `public/ads/*.html` (each has its own `window.atOptions`), embedded via `<iframe>`. This prevents multi-ad `atOptions` collision. **Do not** replace with a global ad loader. See PRD §10.

## Reference: Course Materials (external, read-only)

Source design inspirations live outside this repo, at:
`/Users/yuanruiqin/wiki/06_学习与资源资产/系统学习记录/学习/课程与培训/诗意游戏站小白课/`

Key files there: `课程教材/第五课_网站模板设计与快速上站.md` (original Next.js spec), `执行手册/通用-建站SOP.md` (full SOP incl. ads), `参考资料/Astro+Cloudflare部署方案_理论待验证.md` (9-item verification checklist — PRD §14.3 tracks status).

## Commands (intended, once code exists)

```bash
pnpm install
pnpm dev              # dev server, http://localhost:4321
pnpm build            # includes Content schema validation — fails on bad frontmatter
pnpm typecheck        # astro check (planned)
pnpm lint             # ESLint + Prettier + eslint-plugin-astro (planned)
pnpm test             # Vitest (planned)
pnpm check-sitemap    # scripts/check-sitemap.ts — verify all sitemap URLs return 200 (planned)
```

## Decisions to Confirm with User Before Deviating

- Adding any JS framework runtime (React/Vue/Svelte islands) — PRD ADR-002 says no.
- Switching Cloudflare Pages → Workers — PRD ADR-003 says Pages default.
- Changing license from MIT.
- Changing the demo game from the fictional "Anvil Quest".

## Astro 5 Content Layer Gotchas (verified by debugging)

These behaviors are NOT obvious from the docs and cost significant debugging time. They are all real, verified against astro@5.18.2:

1. **`entry.id` includes `.mdx`, but `getEntry()` does NOT want it.** `getCollection()` returns ids like `en/bosses/gelum.mdx`; `getEntry('wiki', 'en/bosses/gelum.mdx')` returns `null`; `getEntry('wiki', 'en/bosses/gelum')` returns the entry. `src/i18n/content.ts` strips the extension in `parseEntryId` and queries without it in `getEntryWithFallback`.

2. **`entry.render()` does NOT exist in Content Layer API.** Use the standalone `render` function: `import { render } from 'astro:content'; const { Content } = await render(entry);`. The old method-based API is gone.

3. **`getStaticPaths()` is compiled to its own module — top-level `const` in the `.astro` file are NOT visible inside it.** Inline all data (arrays, lookup tables) inside the function body. This is why `[locale]/[legal].astro` inlines `legalPages` inside `getStaticPaths` even though an identical const exists outside.

4. **`Astro.params.slug` (not `Astro.props.slug`) is how you read rest params.** `getStaticPaths` returns `{ params: { slug } }`, which surfaces as `Astro.params.slug`. `Astro.props` is for data passed via the `props` field of `getStaticPaths` return.

5. **`src/content/<locale>/` triggers legacy auto-collection.** If MDX files sit directly under `src/content/<locale>/`, Astro 5 auto-generates a collection named after the locale and prints a deprecation warning. The fix: put content under a named collection dir like `src/content/wiki/<locale>/`, with `glob({ base: './src/content/wiki' })`.

6. **`prefixDefaultLocale: false` means `/` is the English homepage.** Do NOT redirect `/` to `/en/`. The English homepage lives at `src/pages/index.astro`; non-default locales live at `src/pages/[locale]/index.astro`. Similarly, English content routes are at `src/pages/[...slug].astro` (no locale segment), other locales at `src/pages/[locale]/[...slug].astro`.

