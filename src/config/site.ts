/**
 * Site configuration — the single source of truth for game-specific metadata.
 *
 * 👉 APPLY TEMPLATE: Change every field here when building a new game wiki.
 * This is part of the CONFIG LAYER — framework code reads from here, never the reverse.
 */

export interface SiteConfig {
  /** Full site name, used in <title> suffix and Organization JSON-LD. e.g. "Anvil Quest Wiki" */
  name: string;
  /** Short name for PWA manifest and mobile logo. e.g. "AQ Wiki" */
  shortName: string;
  /** Site description for Organization JSON-LD and og:site_name. */
  description: string;
  /** Domain without protocol or trailing slash. e.g. "anvilquestwiki.wiki" */
  domain: string;
  /** Hero tagline shown under the site title. */
  tagline: string;
  /** Copyright / legal disclaimer line shown in footer. */
  legalNotice: string;
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
}

export const site: SiteConfig = {
  name: 'Aniimo Wiki',
  shortName: 'Aniimo Wiki',
  description:
    'Complete Aniimo wiki with codes, tier lists, Aniilog creature database, evolution guides, and walkthroughs. Updated daily by the community.',
  domain: 'aniimowiki.pages.dev',
  tagline: 'Your home for everything Aniimo',
  legalNotice:
    'Aniimo Wiki is a fan-made community site. Not affiliated with or endorsed by Pawprint Studio or Kingsglory.',
  social: {
    official: 'https://www.aniimo.com/',
    discord: undefined,
    youtube: undefined,
    twitter: 'https://x.com/aniimogame',
    reddit: 'https://www.reddit.com/r/AniimoGame/',
  },
  // Canonical pages about the game (Organization JSON-LD sameAs).
  sameAs: [
    'https://www.aniimo.com/',
    'https://store.steampowered.com/app/4126040/Aniimo/',
  ],
  game: {
    name: 'Aniimo',
    platform: 'PS5, Xbox Series X|S, PC, iOS, Android',
    developer: 'Pawprint Studio',
    genre: 'Creature-Collecting Open-World Action RPG',
    releaseDate: '2026-09-16',
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
