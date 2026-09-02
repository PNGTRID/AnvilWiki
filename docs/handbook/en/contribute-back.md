---
title: "Contribute Back: Returning the Good Parts"
description: "Five steps to contribute to AnvilWiki (issue first, branch, self-verify, PR, tests and docs), plus PR-ing your own site onto the official showcase wall."
manual: dev
order: 6
icon: lucide:git-pull-request-arrow
tldr: "Five steps: ① issue first (big changes: check the official PRD for prior decisions); ② branch under the architecture rules; ③ self-verify lint + typecheck + test + build; ④ PR with output pasted; ⑤ functions get tests, components get docs. Your site can contribute too: PR the showcase data in landing.ts. The maintainer release process lives in docs/development.md."
updated: 2026-09-02
---

## Where you are, and what this lesson solves

Using the template you fixed bugs and built good things — letting them rot in your own repo is a waste. This lesson is the full path back to the official template, plus another kind of contribution: **showing the site itself**.

## The five contribution steps

1. **Open an issue first**: describe your scenario and idea in the repo Issues — for big changes check the official PRD for prior decisions so you don't build into a void; typos, dead links, and small bugs can go straight to PR.
2. **Branch development**: keep the architecture rules — copy in JSON, colors via CSS variables, zero JS frameworks, no game-specific strings in the code layer.
3. **Self-verify**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all green (last lesson's checklist).
4. **Open the PR**: paste the verification output into the description; wait for CI green and review — a red CI gets debugged per the verification lesson's method.
5. **Deliver the extras**: pure functions (in `src/lib/`) get tests; components get docs — untested functions and undocumented components both review slowly.

## Your site itself is a contribution

PR your site onto the official showcase wall by editing the showcase data in `src/config/landing.ts` (site name, link, one-liner). **A real, working site is the most persuasive ad this template can have** — and the wall doubles as selection and design inspiration for future builders.

## Stuck?

- **"CI blocked my PR"**: open the red job, read the last log line, reproduce locally with the same command, fix, push — CI reruns automatically.
- **"I don't know if my approach fits the official direction"**: that's what step 1's issue is for — five minutes of asking saves five days of building.

## ✅ Acceptance (all must hold)

- ☐ Your PR description pastes the full self-verification output
- ☐ New pure functions have tests; new components have docs
- ☐ (Optional) your site's showcase PR is submitted

## Next lesson

Template matters settled — back to the site itself: hand the weekly ops loop to AI. [Put an AI on Ops Duty](/landing/docs/ai-ops)
