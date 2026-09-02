---
title: "Verify Your Changes: The Checklist and the Gates"
description: "The post-change, pre-commit checklist: seven local commands, the eight CI gates, the three pipelines, and the safety and performance baselines."
manual: dev
order: 4
icon: lucide:shield-check
tldr: "Three layers of self-verification: ① seven local commands (typecheck/lint/test/build/check-content/check-links/check-i18n — route changes need build, YAML gets parsed); ② CI runs all eight gates per push, one red blocks the merge — read the last log line; ③ never dismantle the defenses: JsonLd escaping, sponsored marks, consent-gated tracking, zero JS frameworks. The freshness audit runs on the official repo only by default."
updated: 2026-09-02
---

## Where you are, and what this lesson solves

Changing code is easy; proving you didn't break anything is the craft. This lesson is the fixed post-change, pre-commit motion. **A lookup lesson: read the section matching what you changed.** With the previous lesson's switches, the customization safety net is complete.

## The local verification checklist (after every change, before every commit)

```bash
pnpm typecheck       # 0 errors (astro check)
pnpm lint            # 0 errors, 0 warnings
pnpm test            # vitest all green (pure functions live in lib/, testable)
pnpm build           # Zod schema validation + full site build
pnpm check-content   # content lint (when MDX changed)
pnpm check-links     # internal link audit (after build, always run)
pnpm check-i18n      # after adding locale JSON keys, check coverage
```

Two special cases: **changed an `.astro` route file → build is mandatory** (getStaticPaths errors only surface at build); **changed a workflow YAML → verify it parses** (`python3 -c "import yaml; yaml.safe_load(open('<file>'))"` — this template once broke on YAML indentation).

## The eight CI gates (every push, on your behalf)

CI runs the full gate set on every push: lint → typecheck → test → check-config → build → check-content → check-links → check-i18n — **one red blocks the merge**. The cheapest local reproduction is running the checklist above.

**Locating a red CI**: open the failed job, read the last log line — the failing gate is named at the top of the log; reproduce locally with the same command, fix, push, CI reruns itself.

## Three automatic pipelines (.github/workflows/)

| Pipeline | When | What it guards |
|---|---|---|
| **CI** | every push / PR | The eight gates; one red blocks everything |
| **Content freshness audit** | weekly (cron) | Freshness audit, auto-opens issues for stale pages. **Official repo only by default** (forks stay silent by default, sparing you the noise); to enable: have AI delete the `if: github.repository ==` line. It **only reminds, never edits content** |
| **Initialize AnvilWiki** | manual | Post-fork cleanup: resets wrangler.toml vars, removes the project page, optional demo clear. **Does not swap game name / color / languages** — those need local `pnpm apply-template` |

## Safety baselines (built in — don't dismantle)

- **Structured-data escaping**: data cards for Google go through `JsonLd.astro` for character escaping — new data components reuse it, **never hand-roll**.
- **Sponsored links**: the affiliate component auto-adds `sponsored nofollow`; outbound links get `noopener`.
- **No tracking before consent**: until the cookie consent click, GA and AdSense genuinely never load.
- **Secrets stay out of the repo**: everything sensitive is a variable; `.env` is gitignored.

## Performance baselines (hold these when touching code)

- **Zero JS frameworks**: no React/Vue runtimes; interactions use native browser capability plus minimal vanilla script.
- Images go through the pipeline (auto WebP, mobile variants).
- Score check: `pnpm build && npx wrangler pages dev dist`, then Lighthouse in the browser — four 100s is the out-of-box contract; don't be the one who breaks it.

## Stuck?

- **"Green locally, red on CI"**: compare Node/pnpm versions (CI runs 22 LTS) and confirm the same commands ran.
- **"A test broke and I didn't touch tests"**: a pure function's behavior changed; the test is the contract — fix the implementation, not the test.

## ✅ Acceptance (all must hold)

- ☐ CI is green on your fork's Actions page
- ☐ You've run the seven local commands and know what each guards
- ☐ New components reuse JsonLd.astro — no hand-rolled data

## Next lesson

Self-verified changes merge safely. The template keeps shipping — next lesson: bringing official updates in safely. [Sync Upstream](/landing/docs/sync-upstream)
