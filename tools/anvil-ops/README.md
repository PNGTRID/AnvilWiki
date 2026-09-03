# anvilwiki-ops

Ops toolkit for [AnvilWiki](https://github.com/PNGTRID/AnvilWiki) fork sites. Run from your fork's repo root.

> Status: 1.0.1 on npm. Commands: `doctor`, `metrics`, `audit`, `insights`, `submit`, `sites` (multi-site registry), `mcp` (stdio MCP server). Works with or without wrangler.toml (falls back to `.env` SITE_URL / PUBLIC_CF_BEACON_TOKEN).

## Usage

```bash
npx anvilwiki-ops doctor
npx anvilwiki-ops metrics --days 28 --format md
npx anvilwiki-ops audit
npx anvilwiki-ops insights
npx anvilwiki-ops submit --title "add emberfang guide"   # validate -> branch -> push -> PR
npx anvilwiki-ops metrics --import-aio ~/Downloads/aio.csv   # GSC AI-report CSV -> table
```

## Multi-site management

Manage several AnvilWiki forks from one machine. Sites live in a registry at `~/.config/anvil-ops/sites.toml` (`$XDG_CONFIG_HOME` wins if set):

```toml
# Optional: used when --site is omitted and cwd has no site config (MCP default)
defaultSite = "main-wiki"

[[sites]]
name = "main-wiki"
path = "/absolute/path/to/repo"
siteUrl = "https://example.com"  # optional override
```

```bash
npx anvilwiki-ops sites add main-wiki /path/to/anvil-wiki-fork
npx anvilwiki-ops sites add side-wiki /path/to/side-fork --url https://side.example.com
npx anvilwiki-ops sites list          # name / path / siteUrl / missing table
npx anvilwiki-ops sites remove side-wiki
```

- `--site <name>` runs any command against a registered site instead of the cwd (`anvil-ops --site main-wiki doctor` and `anvil-ops doctor --site main-wiki` both work).
- `--all` runs `doctor` / `metrics` / `audit` / `insights` across every registered site: one `== site (path) ==` section per site, one failing site never aborts the run, summary `X/Y site(s) ok` at the end. `submit` refuses `--all` (multi-site branching/PRs are unsafe — submit per site with `--site`).
- Without `--site`/`--all`, behavior is unchanged: the site is auto-discovered from the current directory.
- **The registry never stores credentials** — each site reads its own `.env` from its `path`.

## AI referrals & AI Overviews

Where AI assistants send you traffic, and where Google's AI Overviews cite you:

- **`metrics`** appends an "AI referrals" section when Cloudflare credentials are configured: Cloudflare Web Analytics referrer-host data (`rumRefererHost`, same GraphQL channel as page metrics) aggregated client-side against a whitelist — `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai`, `copilot.microsoft.com` (subdomains included), with per-host requests/pageviews and totals. Missing CF credentials degrade gracefully (section skipped).
- **`insights`** probes Google Search Console for pages appearing in **AI Overviews** (`searchAppearance = AI_OVERVIEWS`, dimensions `page`, top 25) and lists them when non-empty. This probe is **experimental**: Google has not committed to this API behavior, so numbers are directional. Probe failures surface as a note, never a crash.
- **`metrics --import-aio <csv>`** imports the GSC UI "Search Generative AI performance report" CSV export (the gen-AI report is UI/CSV-only — the API does not expose it). Columns are located by header name (`Page`, `Impressions`; `Clicks` optional), tolerating BOM, CRLF, quoted cells and blank lines. Add `--save` to archive the file into `<site>/ops/ai-visibility/<YYYY-MM-DD>-aio.csv` for trend history.

## MCP (for Claude / ZCode / any MCP client)

Add to your MCP client config:

```json
{
  "mcpServers": {
    "anvil-ops": {
      "command": "npx",
      "args": ["-y", "anvilwiki-ops", "mcp"]
    }
  }
}
```

Tools: `doctor`, `metrics`, `audit`, `insights`, `submit_pr` (markdown output, agent-friendly). Run `doctor` first in any ops session; `submit_pr` requires uncommitted changes + gh and never pushes main.

**1.0.0 breaking change**: every tool now accepts an optional `site` parameter (a name from the multi-site registry) that resolves the command to that site's registered path. Omit it to keep the 0.x behavior (server start directory). When the start directory has no site config and the registry sets `defaultSite`, that site is used as the MCP default. No other behavior changed.

## Configuration (.env in repo root, gitignored)

| Variable | Required for | Notes |
|---|---|---|
| `GSC_SERVICE_ACCOUNT_JSON` | GSC metrics | `{`-prefixed inline JSON or a file path |
| `CF_API_TOKEN` | CF metrics | token with Account > Analytics > Read |
| `CF_ACCOUNT_ID` | CF metrics | Cloudflare account ID |

`SITE_URL` and `PUBLIC_CF_BEACON_TOKEN` are read from `wrangler.toml [vars]` — no extra setup if your fork already deploys.

Empty values disable the feature (no error). Run `anvil-ops doctor` for guided setup checks.

## GSC setup (5 minutes)

> The same walkthrough lives in the template's dev handbook, with more hand-holding and the "why" behind the Group relay: [Run Ops with AI (handbook lesson)](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/handbook/en/ai-ops.md).

1. Google Cloud Console → new project → enable **Search Console API**.
2. IAM → Service Accounts → create → Keys → add JSON key. Keep this file: it is the robot's credential. The `...gserviceaccount.com` address is **not** a real mailbox (no password, no login) — just Google's robot ID format.
3. GSC's "Add user" rejects robot IDs ("invalid email"). Relay through a Google Group instead: groups.google.com → create a group → allow external members → add the service-account address (`client_email` in the key JSON) as a **direct** member (not an invite) → then in Search Console add the **group email** as a Restricted user. Fresh groups may take minutes–hours to be accepted; retry later on "unspecified error".
4. Put the JSON path (or contents) in `.env` as `GSC_SERVICE_ACCOUNT_JSON`.

## CF Web Analytics setup

1. Cloudflare dashboard → your account → Web Analytics (already sending data via the template's beacon).
2. Create API token with **Account > Analytics > Read**.
3. Set `CF_API_TOKEN` and `CF_ACCOUNT_ID` in `.env`.

## Development

This package lives in `tools/anvil-ops/` inside the template repo but is fully self-contained (own lockfile, own tsconfig; the repo root excludes `tools/` from its lint/typecheck).

```bash
cd tools/anvil-ops
pnpm install   # self workspace root (pnpm-workspace.yaml with allowBuilds)
pnpm test
pnpm build
```
