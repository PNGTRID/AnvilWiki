---
title: "Keep Up With Official Updates and Give the Good Stuff Back"
description: "Merge upstream safely (conflicts always keep your game config and articles), the SemVer promises, and the path to contributing back and the showcase."
manual: dev
order: 5
icon: lucide:git-merge
tldr: "Three commands bring official updates: set upstream, fetch, merge. Conflicts land almost only in the config and content layers, where the answer never changes — keep yours. The compatibility promises (fields only added, never renamed; new features off by default) make merging safe. Not syncing? A static site frozen on a version keeps running — but take security fixes at least. A good site earns a showcase PR."
updated: 2026-08-17
---

## Where you are now and what this lesson solves

The template author keeps releasing new versions: bug fixes, new features. Should your site follow? How do you follow without wiping out your game name, colors, and articles? And in the other direction — you built something good; how do you get it back into the official template? **A lookup manual; open it at upgrade time.**

## Bring official updates into your site (10 minutes each time)

```bash
# 1. Run this the first time only: set the official repo as the "upstream" to watch
git remote add upstream https://github.com/PNGTRID/AnvilWiki.git

# 2. Every later upgrade is just these commands
git fetch upstream
git merge upstream/main

# 3. Verify after merging
pnpm check-config && pnpm typecheck && pnpm test
pnpm build && pnpm check-links
```

**When you hit a conflict (CONFLICT appears in the terminal), memorize this answer**:

- Config-layer and content-layer conflicts → **always keep yours** (your game name, colors, copy, articles)
- Code-layer conflicts → prefer the official side (that's the fixed version); you only need to think if you have edited the code layer — never touched it, no conflicts

Why it's this painless: official new features land almost entirely in the code layer (the one you touch least), and the conflict hotspots are exactly the areas where you should keep your own values anyway.

**After merging, remember**: run the verification above once; `pnpm check-i18n` will list the newly added interface strings from upstream that you haven't translated yet.

## The official version-number promise (it decides whether you upgrade)

Version numbers are three-part `MAJOR.MINOR.PATCH` (e.g. 1.13.0):

| What changed | What it means | Your action |
|---|---|---|
| Patch bump (1.13.0 → 1.13.1) | Bug fix | Merge directly, worry-free |
| Minor bump (1.12 → 1.13) | New feature, **off by default or backward compatible** | Behavior is unchanged after merging; turn on the features you want |
| Major bump (1.x → 2.0) | Breaking change | Read the migration notes in the official CHANGELOG before acting |

Three long-term promises: article registration-card fields are **added only, never renamed** (your old articles always build); every optional feature is off by default (an upgrade never sneaks ads in); a locale JSON missing entries falls back to English automatically (officials adding new strings will never fail your build).

**Can you just not follow at all?** Yes. This is a static site, not a subscription service — frozen on some version, it runs forever. But we recommend merging at least patch-level updates (security and bug fixes); picking them individually with `git cherry-pick` works too.

## Contribute your improvements back

1. **Open an issue to discuss first**: describe your scenario and idea in the repo's Issues (for big changes, check the official PRD for a relevant decision first, to avoid wasted work).
2. Branch and write code, following the architecture chapter's floor rules (text goes into JSON, colors go through variables, zero JS framework).
3. Self-verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all green.
4. Open a PR with verification output pasted into the description; wait for CI green and the author's review.
5. If you added pure functions (under `src/lib/`), include tests; if you added components, include docs.

**Your site itself is a contribution too**: send a PR adding it to the official showcase wall (edit the showcase data in `src/config/landing.ts`) — a real successful site is this template's most persuasive advertisement.

(The full process for cutting versions of the template itself is maintainer-view material, recorded in the repo's [docs/development.md](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/development.md); not repeated here.)

## If you get stuck

- **"Can't read the merge conflicts"**: paste the conflict hunks into an AI assistant and tell it "keep mine for config and content, follow the official side for code"; let it resolve them one by one, then run the three checks.
- **"The build broke after merging"**: run `pnpm build` and look at the failing file — most likely upstream restructured a spot you had also changed locally; apply the "keep mine for config" principle and retry.

## ✅ Acceptance criteria (all must hold)

- After merging official updates, the three checks are all green
- ☐ Every config/content conflict kept your own values (diff each one)
- ☐ New strings listed by check-i18n are either translated or explicitly accepted as English fallback

## Next lesson

Upstream syncing keeps you current as the template grows. The final chapter puts an AI on ops duty — [the anvilwiki-ops CLI and MCP](/landing/docs/ai-ops).
