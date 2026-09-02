---
title: "CI Gates and Security Baselines"
description: "The three automated pipelines and what each guards (CI's eight gates, weekly freshness reminders, initialize cleanup), plus the built-in security baselines."
manual: dev
order: 4
icon: lucide:shield-check
tldr: "The CI pipeline runs eight gates on every push; one red and the merge is blocked. The freshness audit defaults to the official repo only (a fork enables it by deleting one if line, and it only reminds, never edits content). Initialize only cleans up, never reskins. Security baselines are built in — escaped data, marked sponsored links, consent-gated tracking, zero JS — don't dismantle them."
updated: 2026-08-17
---

## Where you are now and what this lesson solves

The repo's Actions page holds a few automated pipelines, some red, some green — this lesson spells out what each of them guards, plus the security baselines the template already ships that you shouldn't break while customizing. **A lookup manual; open it as needed.**

## The three automated pipelines (.github/workflows/)

| Pipeline | When it runs | What it guards for you |
|---|---|---|
| **CI** | Every push / PR | Eight gates: lint → typecheck → test → check-config → build → check-content → check-links → check-i18n — one red gate and the merge is blocked |
| **Content freshness audit** | Every Monday (scheduled) | Runs the freshness audit; stale pages automatically open reminder issues. **On by default only in the official AnvilWiki repo** (a fork stays quiet, sparing you a pile of reminders); to enable it on your own site, have AI delete the `if: github.repository ==` line in the file. It **only reminds, never edits content** — the risk of automation touching content is uncontrollable |
| **Initialize AnvilWiki** | Manual trigger | Post-fork cleanup: resets wrangler.toml variables, removes the project landing page, optionally clears demo content. **It does not swap the game name / theme color / languages** — those still require a local `pnpm apply-template` run |

## Security baseline (built in; don't dismantle it while customizing)

- **Structured-data escaping**: the data cards served to Google are uniformly character-escaped; even malicious code smuggled into an article can't break out. Any new data component must reuse the existing `JsonLd.astro` — never hand-concatenate the serialization yourself.
- **Sponsored links**: the affiliate link component automatically carries the `sponsored nofollow` marking (telling Google these are paid links); external links uniformly use `noopener`.
- **No tracking before consent**: until the user accepts cookies, GA and AdSense simply don't load — really don't load, not a decorative banner.
- **No secrets in the repo**: every sensitive value goes through variables; `.env` is already on the ignore list.

## Performance baseline (hold it when you edit the code layer)

- Zero JS framework: no React/Vue-style runtimes; interactivity uses native browser abilities (collapsible blocks, dialogs) plus a tiny amount of vanilla script.
- Images go through the template's image pipeline (auto-compressed to WebP, auto-fitted for phones).
- To verify scores after a change: `pnpm build && npx wrangler pages dev dist`, then run the browser's Lighthouse panel.

## If you get stuck

- **"CI is red"**: click into the red run — the log's beginning names which of the eight gates failed; run the same command locally to reproduce.

## ✅ Acceptance criteria (all must hold)

- ☐ CI is green on your own fork's Actions page
- ☐ You know why freshness reminders don't arrive by default, and how to switch them on
- ☐ When adding components, you remember to reuse JsonLd.astro instead of hand-building the data

## Next steps

The template author keeps shipping new versions — [Dev 6 · sync and contribute](/landing/docs/sync-and-contribute): how to merge upstream updates safely, and how to contribute your good improvements back to the official project.
