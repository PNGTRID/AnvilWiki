# Contributing to AnvilWiki

Thanks for your interest in improving AnvilWiki! This guide covers the basics.

## Prerequisites

- Node.js 20+ (check `.nvmrc`)
- pnpm 11+ (`npm install -g pnpm` or use [corepack](https://nodejs.org/api/corepack.html))
- Git

## Setup

```bash
git clone https://github.com/PNGTRID/AnvilWiki.git
cd AnvilWiki
pnpm install
pnpm dev          # → http://localhost:4321
```

## Development workflow

1. **Create a branch** off `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. **Make your changes.** See [AGENTS.md](./AGENTS.md) for architecture rules and gotchas — especially the three-layer separation (don't touch framework code for per-game changes) and the Astro 5 Content Layer quirks.
3. **Verify before committing:**
   ```bash
   pnpm lint        # ESLint
   pnpm typecheck   # astro check (0 errors required)
   pnpm build       # must succeed
   ```
4. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add comparison-table displayType"
   ```
   Suggested prefixes: `feat:` (new feature), `fix:` (bug fix), `docs:` (documentation), `refactor:` (no behavior change), `chore:` (tooling).
5. **Push and open a PR** against `main`. Fill in the PR template.

## Architecture overview

Read the [PRD](./docs/PRD.md) for the full design. The short version:

```
框架层 (src/pages, src/components, src/lib)      — framework code, shared across all sites
配置层 (src/config, src/i18n/routing.ts, globals.css) — per-game configuration
内容层 (src/content/wiki, src/locales)            — per-game content
```

**When fixing a bug or adding a feature, ask: does this belong in the framework layer (benefits all sites) or the config/content layer (specific to one site)?** Framework changes need to work for every game, not just the demo.

## Code style

- **TypeScript strict mode** — no `any` without justification.
- **Pure Astro components** — do not introduce React/Vue/Svelte runtime unless absolutely necessary (see PRD ADR-002).
- **CSS variables for theming** — never hardcode hex colors in components; use `var(--nav-theme)`.
- **JSON-driven UI text** — all user-facing strings come from `src/locales/*.json`, not hardcoded in components.
- **Prettier + ESLint** — run `pnpm format` to auto-format.

## Reporting bugs

Use the [bug report template](https://github.com/PNGTRID/AnvilWiki/issues/new?template=bug-report.md). Include:

- Steps to reproduce
- Expected vs actual behavior
- AnvilWiki version / commit
- Node version

## Suggesting features

Use the [feature request template](https://github.com/PNGTRID/AnvilWiki/issues/new?template=feature-request.md). Explain the use case — what are you trying to do that AnvilWiki doesn't support today?

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
