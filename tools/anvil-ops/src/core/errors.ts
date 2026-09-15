export class OpsError extends Error {
  constructor(
    message: string,
    public readonly fix: string,
  ) {
    super(message);
    this.name = 'OpsError';
  }
}

/**
 * Corrupt site config (wrangler.toml that no longer parses). Deliberately NOT
 * an OpsError: resolveEffectiveRoot treats an OpsError from loadSiteConfig as
 * "no site config here" and falls back to another registered site — a corrupt
 * wrangler.toml must surface loudly at the repo it was found in instead of
 * silently redirecting a write command like submit to someone else's repo.
 */
export class ConfigParseError extends Error {
  constructor(path: string, cause: unknown) {
    super(
      `Failed to parse ${path}: ${cause instanceof Error ? cause.message : String(cause)} — check wrangler.toml syntax (section headers like [vars] need closing brackets, values need quotes).`,
    );
    this.name = 'ConfigParseError';
  }
}
