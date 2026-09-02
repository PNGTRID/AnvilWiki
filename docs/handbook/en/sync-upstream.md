---
title: "Sync Upstream: Bringing Official Updates In"
description: "Three commands to merge official updates, the conflict mantra, and the semver promises that decide whether you upgrade."
manual: dev
order: 5
icon: lucide:git-merge
tldr: "Set the official repo as upstream once; every upgrade is fetch → merge → verify (check-config + typecheck + test, then build + check-links). Conflict mantra: config and content layers always keep yours; code layer prefers theirs. Semver promises: patch = bugfix, merge freely; minor = new features default-off or backward compatible; major = read the CHANGELOG migration notes. A static site frozen on a version runs forever, but at least take patch-level security fixes."
updated: 2026-09-02
---

## Where you are, and what this lesson solves

The template author keeps shipping: bug fixes, features. Should your site follow, and how — without washing away your game name, colors, and articles? **A lookup lesson: read it on upgrade day.** (The upgrade decision itself: see the semver promises below.)

## Three commands to merge official updates (10 minutes each time)

```bash
# First time only: set the official repo as "upstream"
git remote add upstream https://github.com/PNGTRID/AnvilWiki.git

# Every upgrade after that
git fetch upstream
git merge upstream/main

# Verify after merging
pnpm check-config && pnpm typecheck && pnpm test
pnpm build && pnpm check-links
```

**On conflict (CONFLICT in the terminal), the mantra**:

- Config and content layer conflicts → **always keep yours** (game name, colors, copy, articles)
- Code layer conflicts → **prefer theirs** (that's the fixed version); if you never touched the code layer, there is no conflict

Why so painless: official features almost always land in the code layer — the one you touch least — while conflict zones are exactly where you were meant to keep your own.

**After merging**: run the verification; `pnpm check-i18n` lists officially added UI strings you haven't translated yet.

## The semver promises (deciding whether to upgrade)

Version format `major.minor.patch`:

| What changed | Meaning | Your move |
|---|---|---|
| Patch (2.10.0 → 2.10.1) | Bug fixes | Merge freely |
| Minor (2.10 → 2.11) | New features, **default-off or backward compatible** | Behavior unchanged; opt into what you want |
| Major (2.x → 3.0) | Breaking changes | Read the official CHANGELOG migration notes first |

Three long-term promises: article frontmatter fields are **added, never renamed** (your old articles always build); optional features default off (an upgrade never silently enables ads); missing locale JSON entries fall back to English (official strings never break your build).

**Can I just not upgrade?** Yes — a static site isn't a subscription; frozen is forever runnable. But at least take patch-level updates (security and bug fixes), cherry-picking with `git cherry-pick` if you like.

## Stuck?

- **"I can't read the merge conflict"**: paste the conflict block to AI with the mantra — "keep my config and content, take their code" — then run the verification.
- **"Build broke after the merge"**: `pnpm build`, read the failing file — usually the official structure changed where you also changed things; apply the mantra and retry.

## ✅ Acceptance (all must hold)

- After merging an official update, every verification command is green
- ☐ Every config/content conflict kept your value (diffs reviewed one by one)
- ☐ check-i18n's new strings are either translated or consciously left to English fallback

## Next lesson

The template grows — don't let your good work rot locally either. Next lesson: contributing back, and the showcase wall. [Contribute Back](/landing/docs/contribute-back)
