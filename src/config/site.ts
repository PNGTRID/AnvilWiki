/**
 * Site configuration — the single source of truth for game-specific metadata.
 *
 * 👉 APPLY TEMPLATE: Change every field here when building a new game wiki.
 * This is part of the CONFIG LAYER — framework code reads from here, never the reverse.
 */

export interface SiteConfig {
  /** Full site name, used in <title> suffix and Organization JSON-LD. e.g. "Anvil Quest Wiki" */
  name: string;
  /** Short name for PWA manifest, mobile logo, and the long-title <title> suffix (>50 chars). e.g. "AQ Wiki" */
  shortName: string;
  /** Site description for Organization JSON-LD and og:site_name. */
  description: string;
  /** Domain without protocol or trailing slash. e.g. "anvilquestwiki.wiki" */
  domain: string;
  /** Hero tagline shown under the site title. */
  tagline: string;
  /** Copyright / legal disclaimer line shown in footer. */
  legalNotice: string;
  /**
   * Optional public contact email — rendered as a mailto link on the contact
   * page when set. AdSense reviewers look for a reachable contact channel;
   * if you run no social channels, set this.
   */
  contactEmail?: string;
  social: {
    /** Official game website URL (the game itself, not the wiki). */
    official: string;
    discord?: string;
    youtube?: string;
    twitter?: string;
    reddit?: string;
  };
  /**
   * Canonical URLs about the GAME (Steam page, official site, Wikipedia entry…).
   * Emitted as Organization JSON-LD `sameAs` — helps Google / AI engines link
   * this wiki to the game's knowledge-graph entity.
   */
  sameAs?: string[];
  game: {
    /** Full game name. */
    name: string;
    /** Platform: "Roblox" | "Steam" | "Epic Games" | "Mobile" | ... */
    platform: string;
    /** Developer / studio name. */
    developer: string;
    /** Genre description. */
    genre: string;
    /** ISO release date (optional). */
    releaseDate?: string;
  };
  /**
   * Dimensions of the default OG/Twitter share image (public/images/hero.webp).
   * Emitted as og:image:width / og:image:height so social crawlers can render
   * the share card without downloading the image first.
   */
  ogImageWidth: number;
  ogImageHeight: number;
  /** Default author name for articles without an explicit `author` in frontmatter (E-E-A-T signal). */
  defaultAuthor?: string;
  /**
   * Build-time site-type signal, written by apply-template for the non-default
   * presets only ('coupon-hub' | 'tutorial-hub'). Game-wiki forks carry NO
   * line at all (absent = game-wiki), keeping the zero-breaking output
   * byte-identical. Read by presentation-layer variants — e.g. the coupon
   * deals overview on the codes list page.
   */
  siteType?: 'coupon-hub' | 'tutorial-hub';
}

export const site: SiteConfig = {
  name: 'Anvil Quest Wiki',
  shortName: 'AQ Wiki',
  description:
    'Complete Anvil Quest wiki with boss guides, tier lists, codes, item locations, and beginner tips. Every guide carries a last-verified date.',
  domain: 'anvil.wiki',
  tagline: 'Your forge for everything Anvil Quest',
  legalNotice:
    'Anvil Quest Wiki is a fan-made community site. Not affiliated with or endorsed by the game developer.',
  // 👉 APPLY TEMPLATE: set a real address if you run no social channels —
  // the contact page renders it as a mailto link.
  contactEmail: '',
  social: {
    official: 'https://example.com/anvil-quest',
    discord: 'https://discord.gg/example',
    youtube: 'https://youtube.com/@example',
    twitter: 'https://twitter.com/example',
    reddit: 'https://reddit.com/r/anvilquest',
  },
  // 👉 APPLY TEMPLATE: point these at the game's real canonical pages.
  sameAs: [
    'https://example.com/anvil-quest',
    'https://en.wikipedia.org/wiki/Anvil_Quest',
  ],
  game: {
    name: 'Anvil Quest',
    platform: 'Roblox',
    developer: 'Forge Studios',
    genre: 'Fantasy RPG',
    releaseDate: '2026-01-15',
  },
  // hero.webp is 1200×630 (the recommended OG share aspect ratio).
  ogImageWidth: 1200,
  ogImageHeight: 630,
};

/** Absolute site URL (no trailing slash). Falls back to the Astro `site` config. */
export const siteUrl: string = (process.env.SITE_URL || `https://${site.domain}`).replace(
  /\/$/,
  '',
);

/** Resolved site type — an absent `siteType` line means the default game wiki. */
export const siteType: 'game-wiki' | 'coupon-hub' | 'tutorial-hub' = site.siteType ?? 'game-wiki';
