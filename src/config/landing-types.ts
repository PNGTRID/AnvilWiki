/**
 * Landing page TYPES — the LandingLocale union and the LandingContent
 * interface shared by the en/zh copy modules (landing-en.ts / landing-zh.ts)
 * and re-exported by the landing.ts facade. Split out of landing.ts (v2.31.1)
 * to keep every file small; the public API is unchanged.
 *
 * 👉 Like landing.ts, this file is NOT part of the "apply template" config
 *    layer — fork users don't need to touch it. It describes the AnvilWiki
 *    open-source project. apply-template deletes it together with the facade.
 */

export type LandingLocale = 'en' | 'zh';

/** The apply-template site presets a landing direction card points at. */
export type LandingPreset = 'game-wiki' | 'coupon-hub' | 'tutorial-hub';

interface ManualCopy {
  label: string;
  description: string;
}

export interface LandingContent {
  htmlLang: string;
  title: string;
  description: string;
  /** Consent-banner override for landing-only languages (zh): no wiki locale
   *  JSON exists (BaseLayout's fallback labels are English) and no localized
   *  legal page (its derived privacy link would 404). en leaves it undefined —
   *  the wiki UI JSON already yields identical strings. */
  consent?: {
    title: string;
    text: string;
    accept: string;
    decline: string;
    privacyLabel: string;
    privacyHref: string;
  };
  announcement: { text: string; href: string; dismissLabel: string } | null;
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    tertiaryCta: { label: string; href: string };
    installCommand: string;
    screenshotCaption: string;
    screenshotAlt: string;
    terminalLabel: string;
    copyLabel: string;
    copiedLabel: string;
  };
  /**
   * "Pick a direction" — the tutorials-first face of the landing root. One
   * card per launched site-type preset; each card's tutorial links are
   * grouped from the tutorials collection by preset (lib/landing-tutorials'
   * tutorialsForPreset), so this block carries copy only — no slugs, no
   * counts. A fourth direction (recipe sites) joins when that preset ships.
   */
  directions: {
    title: string;
    subtitle: string;
    /** Card CTA label jumping to lesson one of the direction. */
    startLabel: string;
    /** Card link label to the grouped tutorials hub. */
    moreLabel: string;
    items: Record<
      LandingPreset,
      {
        icon: string;
        title: string;
        description: string;
        /** One line: how this direction earns money. */
        earn: string;
      }
    >;
  };
  socialProof: {
    lighthouse: { label: string; score: number }[];
    poweredBy: string;
  };
  features: { icon: string; title: string; description: string }[];
  compare: {
    title: string;
    subtitle: string;
    columns: string[];
    rows: { label: string; values: string[] }[];
    /** Link under the homepage table opening the full comparison page. */
    full: { label: string; href: string };
  };
  /** Standalone comparison page (/landing/comparison) — full, honest,
   *  data-backed comparison vs Fandom and self-hosted wiki engines. */
  comparisonPage: {
    title: string;
    subtitle: string;
    intro: string;
    tldrTitle: string;
    tldrItems: { name: string; text: string }[];
    table: {
      title: string;
      subtitle: string;
      columns: string[];
      rows: { label: string; values: string[] }[];
    };
    /** "Why Fandom users switch" — long-tail section for creators hitting
     *  Fandom's template/ads/domain limits (~2k combined monthly searches on
     *  Fandom template queries, SimilarWeb 2026-08). Facts and trade-offs
     *  only; Fandom stays the right home for big community wikis. */
    fandomSwitch: {
      title: string;
      subtitle: string;
      items: { title: string; text: string }[];
      note: string;
    };
    engines: {
      title: string;
      subtitle: string;
      columns: string[];
      entries: {
        name: string;
        url: string;
        positioning: string;
        license: string;
        stars: string;
        release: string;
        bestFor: string;
      }[];
      note: string;
    };
    notFor: { title: string; subtitle: string; items: { need: string; pick: string }[] };
    cta: {
      title: string;
      subtitle: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
    };
  };
  /** Standalone community highlights page (/landing/community) — AI-curated
   *  digest of the WeChat group chat, refreshed daily by automation. Item
   *  content lives in community-digest.json next to the page component
   *  (Chinese source, kept as-is on the en page). */
  communityHighlights: {
    title: string;
    subtitle: string;
    /** Short label for the landing footer link. */
    navLabel: string;
    /** Left sidebar "on this page" heading label. */
    tocLabel: string;
    updatedLabel: string;
    sinceLabel: string;
    disclaimer: string;
    sections: {
      gold: { title: string; hint: string };
      pitfalls: { title: string; hint: string };
      qa: { title: string; hint: string };
      feedback: { title: string; hint: string };
      news: { title: string; hint: string };
      daily: { title: string; hint: string };
    };
    /** Chip label for open feedback items. */
    openLabel: string;
    /** Chip label for feedback items the maintainer has resolved. */
    resolvedLabel: string;
    /** Relative day labels on the two newest daily cards. */
    todayLabel: string;
    yesterdayLabel: string;
    /** Public subset of the per-day structured report (latest day rendered
     *  under the daily band; owner-only dims stay out of the public page). */
    report: {
      title: string;
      statsMessages: string;
      statsSpeakers: string;
      statsPeak: string;
      quotesTitle: string;
      takeawaysTitle: string;
      qaTitle: string;
      resourcesTitle: string;
      faqTitle: string;
      topicsTitle: string;
    };
    /** Fold summary label for section items beyond the default window. */
    expandLabel: string;
    cta: {
      title: string;
      subtitle: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
    };
  };
  showcase: {
    title: string;
    subtitle: string;
    points: string[];
    cta: { label: string; href: string };
    browserUrl: string;
    mobileCaption: string;
    articleAlt: string;
    mobileAlt: string;
  };
  builtWith: {
    title: string;
    subtitle: string;
    submitLabel: string;
    submitHref: string;
  };
  docsEntry: {
    title: string;
    cards: { icon: string; title: string; description: string; href: string }[];
    readLabel: string;
  };
  devGuide: {
    title: string;
    subtitle: string;
    steps: { title: string; description: string; command: string; linkLabel: string; href: string }[];
    allDocs: { label: string; href: string };
  };
  /** "About the author" block on the landing root — who builds AnvilWiki and
   *  why. Part of the landing demo-identity layer: apply-template deletes
   *  landing-en/zh.ts whole, so forks never inherit it. */
  author: {
    title: string;
    name: string;
    role: string;
    bio: string;
    links: { label: string; href: string }[];
  };
  /** Docs-center search (Pagefind modal). Landing zh isn't a wiki locale,
   * so SearchButton can't fall back to src/locales — docs pages pass these. */
  search: {
    label: string;
    placeholder: string;
    noResults: string;
    close: string;
    loadError: string;
  };
  handbook: {
    hubTitle: string;
    hubSubtitle: string;
    /** Explicit "complete beginner start here" pill on the docs hub. */
    beginnerHint: { text: string; href: string };
    manuals: { learn: ManualCopy; dev: ManualCopy };
    chapterLabel: string;
    /** Empty for en ("Lesson 3"); "课" for zh ("第 3 课"). */
    chapterSuffix: string;
    backToHub: string;
    prevLabel: string;
    nextLabel: string;
    editLabel: string;
    updatedLabel: string;
    readLabel: string;
    tldrLabel: string;
    /** Right-hand "On this page" heading TOC label. */
    onThisPageLabel: string;
    /** Left-hand manual-tree nav label (mobile <details> summary). */
    manualsLabel: string;
    /** The "whole job at a glance" checklist shown above the manuals on the hub. */
    roadmap: {
      title: string;
      hint: string;
      items: { label: string; time: string; href: string }[];
    };
    /** Label for the hub card / nav link opening a manual's own page. */
    openManualLabel: string;
    /** "N chapters" counter label on manual pages. */
    chaptersCountLabel: string;
  };
  /**
   * Flagship tutorial line (/landing/tutorials + /zh/landing/tutorials) —
   * landing-layer marketing content, removed from forks with the rest of
   * the landing tree. Labels shared by the hub + article pages; the tail
   * trio (fork CTA → WeChat → same-topic next) is component-rendered so it
   * can never be dropped from an article.
   */
  tutorials: {
    /** Short header/footer nav label. */
    navLabel: string;
    hubTitle: string;
    hubSubtitle: string;
    /** Hub card link label ("Read tutorial"). */
    readLabel: string;
    updatedLabel: string;
    backToHub: string;
    prevLabel: string;
    nextLabel: string;
    /** Tail CTA card (fork the template). */
    ctaTitle: string;
    ctaSubtitle: string;
    ctaPrimaryLabel: string;
    /** Per-site-type line: what to pick when the CLI asks for the site type. */
    presetCta: Record<LandingPreset, string>;
    /** Tail link into the matching handbook lesson ("go deeper" layer). */
    docsHint: string;
    /** Tail WeChat card (QR itself is the shared /images/wechat-qr.jpg asset). */
    communityTitle: string;
    communityHint: string;
    /** Tail "same-topic next" recommendation label. */
    nextInTopicLabel: string;
  };
  finalCta: {
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  community: {
    title: string;
    subtitle: string;
    qrAlt: string;
    qrCaption: string;
    qrNote: string;
    buttonLabel: string;
    buttonAria: string;
    closeAria: string;
  };
  footer: {
    tagline: string;
    license: string;
    madeWith: string;
    author: string;
    creditsLabel: string;
    // href is optional: entries without one (individual contributors) render
    // as plain text instead of a link (LandingLayout footer).
    credits: { name: string; href?: string; note: string }[];
  };
}
