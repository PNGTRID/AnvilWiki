/**
 * Landing page configuration — text content for the project landing pages
 * at /landing (English) and /zh/landing (中文). They introduce the AnvilWiki
 * template itself, NOT the demo game.
 *
 * This is separate from site.ts (which holds the DEMO GAME config).
 * The landing page represents the PROJECT, so its copy lives here.
 *
 * 👉 This file is NOT part of the "apply template" config layer — fork users
 *    don't need to touch it. It describes the AnvilWiki open-source project.
 */

/** Keep in sync with package.json "version" (used by the announcement bar). */
export const PROJECT_VERSION = '2.4.0';

export type LandingLocale = 'en' | 'zh';

interface ManualCopy {
  label: string;
  description: string;
}

export interface LandingContent {
  htmlLang: string;
  title: string;
  description: string;
  announcement: { text: string; href: string } | null;
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
  handbook: {
    hubTitle: string;
    hubSubtitle: string;
    /** Explicit "complete beginner start here" pill on the docs hub. */
    beginnerHint: { text: string; href: string };
    manuals: { learn: ManualCopy; dev: ManualCopy };
    chapterLabel: string;
    /** Empty for en ("Chapter 3"); "章" for zh ("第 3 章"). */
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
  footer: { tagline: string; license: string; madeWith: string; author: string };
}

const RELEASES = 'https://github.com/PNGTRID/AnvilWiki/releases';
const FORK_URL = 'https://github.com/PNGTRID/AnvilWiki/fork';
const SHOWCASE_DATA =
  'https://github.com/PNGTRID/AnvilWiki/blob/main/src/config/landing.ts';

/**
 * Community-built sites — locale-independent list shown by CommunitySites.astro.
 * To add your site, open a PR appending an entry here (README §Showcase explains).
 */
export const COMMUNITY_SITES: {
  name: string;
  url: string;
  game: string;
  /** Screenshot in public/images/showcase/sites/ (CLI-deleted on fork). */
  image: string;
  imageAltEn: string;
  imageAltZh: string;
  descriptionEn: string;
  descriptionZh: string;
}[] = [
  {
    name: 'Aniimo Wiki',
    url: 'https://aniimo.wiki/',
    game: 'Aniimo',
    image: '/images/showcase/sites/aniimo.jpg',
    imageAltEn: 'Screenshot of the Aniimo Wiki homepage',
    imageAltZh: 'Aniimo Wiki 首页截图',
    descriptionEn:
      'A community wiki for the Roblox anime game Aniimo — guides, tier lists, and fresh codes.',
    descriptionZh: 'Roblox 动漫游戏 Aniimo 的社区 wiki——攻略、强度榜与最新兑换码。',
  },
  {
    name: "No Man's Sky Wiki",
    url: 'https://nomanssky.wiki/',
    game: "No Man's Sky",
    image: '/images/showcase/sites/nomanssky.jpg',
    imageAltEn: "Screenshot of the No Man's Sky Wiki homepage",
    imageAltZh: '无人深空 Wiki 首页截图',
    descriptionEn:
      'A wiki for the space sandbox classic No Man\'s Sky — mechanics references and update guides.',
    descriptionZh: '太空沙盒经典《无人深空》的 wiki——机制资料与版本更新攻略。',
  },
  {
    name: 'Steal an Egg Wiki',
    url: 'https://steal-anegg.wiki/',
    game: 'Steal an Egg',
    image: '/images/showcase/sites/steal-anegg.jpg',
    imageAltEn: 'Screenshot of the Steal an Egg Wiki homepage',
    imageAltZh: 'Steal an Egg Wiki 首页截图',
    descriptionEn:
      'A wiki for the Roblox hit Steal an Egg — pets, eggs, codes, and strategies.',
    descriptionZh: 'Roblox 热门游戏 Steal an Egg 的 wiki——宠物、蛋、兑换码与玩法攻略。',
  },
  {
    name: 'Jujutsu Shenanigans Player Guide',
    url: 'https://jjs-player-guide.pages.dev/',
    game: 'Jujutsu Shenanigans',
    image: '/images/showcase/sites/jjs-player-guide.png',
    imageAltEn: 'Screenshot of the Jujutsu Shenanigans Player Guide homepage',
    imageAltZh: 'Jujutsu Shenanigans Player Guide 首页截图',
    descriptionEn:
      'A trilingual Roblox player wiki for Jujutsu Shenanigans — character routes, Black Flash, maps, codes, and patch notes.',
    descriptionZh:
      'Jujutsu Shenanigans 的中英日三语 Roblox 玩家 wiki——角色路线、Black Flash、地图、兑换码与版本更新。',
  },
  {
    name: 'Mortal Shell II Wiki',
    url: 'https://mortalshell2.space/',
    game: 'Mortal Shell II',
    image: '/images/showcase/sites/mortal-shell-ii.png',
    imageAltEn: 'Screenshot of the Mortal Shell II Wiki homepage',
    imageAltZh: 'Mortal Shell II Wiki 首页截图',
    descriptionEn:
      'A fan-made Mortal Shell II wiki with independent guides for Shells, weapons, bosses, locations, items, and the Open Beta.',
    descriptionZh:
      '独立的《Mortal Shell II》玩家 wiki，涵盖 Shell、武器、Boss、地点、物品与 Open Beta 的资料和攻略。',
  },
  {
    name: 'Sephiria Builds',
    url: 'https://sephiriabuilds.xyz/',
    game: 'Sephiria',
    image: '/images/showcase/sites/sephiria.jpg',
    imageAltEn: 'Screenshot of the Sephiria Builds homepage',
    imageAltZh: 'Sephiria Builds 首页截图',
    descriptionEn:
      'A build database for the action roguelite Sephiria — patch-stamped weapon tier lists and evidence-graded build guides.',
    descriptionZh: '动作肉鸽 Sephiria 的 build 数据库——带版本戳的武器强度榜与证据分级的 build 攻略。',
  },
];

const en: LandingContent = {
  htmlLang: 'en',
  title: 'AnvilWiki — Open-Source Game Wiki Template for Cloudflare',
  description:
    'An open-source game wiki template with an AI-native content workflow: pick the right game, generate pages by talking to your AI tool, codes pages stay fresh on autopilot. Lighthouse 4×100, free on Cloudflare, 100% ad revenue yours.',
  announcement: {
    text: `v${PROJECT_VERSION} — hardened from three production-site postmortems: sitewide trailing-slash URLs (no more 308 hops for Google), empty categories go noindex, per-article FAQ schema, smart title suffixes, related-article fallbacks, plus built-in IndexNow push and themed-asset generators.`,
    href: RELEASES,
  },
  hero: {
    badge: 'Open Source · MIT · Cloudflare Pages',
    title: 'Turn a trending game into a traffic site — in 24 hours, not weeks',
    subtitle:
      'An SEO-hardened game wiki template (Astro + Cloudflare Pages — Lighthouse 4×100, free unlimited bandwidth) with an AI content workflow that ships inside your repo: talk to your AI to generate pages, codes stay fresh on autopilot. Every ad dollar is yours.',
    primaryCta: { label: 'Fork on GitHub', href: FORK_URL },
    secondaryCta: { label: 'Star on GitHub', href: 'https://github.com/PNGTRID/AnvilWiki' },
    tertiaryCta: { label: 'Live Demo', href: '/' },
    installCommand: `git clone https://github.com/PNGTRID/AnvilWiki.git
cd anvilwiki
pnpm install && pnpm dev`,
    screenshotCaption: 'The live demo — a complete wiki for the fictional game "Anvil Quest"',
    screenshotAlt: 'AnvilWiki demo homepage — game wiki built with the template',
    terminalLabel: 'Terminal',
    copyLabel: 'Copy',
    copiedLabel: 'Copied!',
  },
  socialProof: {
    lighthouse: [
      { label: 'Performance', score: 100 },
      { label: 'Accessibility', score: 100 },
      { label: 'Best Practices', score: 100 },
      { label: 'SEO', score: 100 },
    ],
    poweredBy: 'Powered by Astro + Cloudflare Pages — free unlimited bandwidth',
  },
  features: [
    {
      icon: 'lucide:bot',
      title: 'AI-Native Content Workflow',
      description:
        'Agent skills ship inside the repo (.agent/skills/, Agent Skills open standard). Tell ZCode / Claude Code / Codex "write a boss guide from these notes" — you get a build-passing MDX page, auto-verified by schema + lint. No scripts to learn.',
    },
    {
      icon: 'lucide:crosshair',
      title: 'Game Selection Playbook',
      description:
        'The fork-user funnel most templates ignore: a 4-layer game-selection scoring model (demand validation via Trends + SERP gap check) plus a "first-day 10 pages" plan — because the 2-8 week window after a game blows up is where all the traffic lives.',
    },
    {
      icon: 'lucide:ticket',
      title: 'Codes Pages on Autopilot',
      description:
        'Structured codes frontmatter (status/expiry/source) auto-renders Active one-click-copy blocks + an Expired table that keeps long-tail "is X still working" traffic. A weekly audit workflow files an issue whenever pages go stale — freshness without you remembering.',
    },
    {
      icon: 'lucide:dollar-sign',
      title: '100% Your Revenue',
      description:
        'Built-in AdSense slots, sponsor card and affiliate CTA component — all env-gated, off by default. No platform cut, unlike hosted wiki farms that eat your earnings.',
    },
    {
      icon: 'lucide:zap',
      title: 'SEO Engineering + Blazing Fast',
      description:
        'Sitemap with lastmod, JSON-LD suite, hreflang, Quick Answer blocks for AI search, llms.txt — on top of Astro zero-JS and Lighthouse 4×100 out of the box.',
    },
    {
      icon: 'lucide:cloud',
      title: 'Free Forever',
      description:
        'Deploy to Cloudflare Pages with zero config: free unlimited bandwidth + global CDN + SSL. i18n built in (English at root, fallback so URLs never 404). No hosting bills, ever.',
    },
  ],
  compare: {
    title: 'Why AnvilWiki?',
    subtitle: 'How it compares to other options for game content sites.',
    columns: ['AnvilWiki', 'Fandom', 'Starlight', 'Next.js DIY'],
    rows: [
      {
        label: 'Best for',
        values: ['Game SEO content sites', 'Community wikis', 'Product docs', 'Custom apps'],
      },
      {
        label: 'AI content pipeline',
        values: ['Skills ship in repo', 'None', 'None', 'Build yourself'],
      },
      {
        label: 'Game selection guide',
        values: ['Funnel + first-day plan', 'None', 'None', 'None'],
      },
      {
        label: 'Ad revenue',
        values: ['100% yours', 'Platform-split', 'None', 'DIY'],
      },
      {
        label: 'Hosting cost',
        values: ['Free, unlimited BW', 'Free (hosted)', 'Pay your own', 'Pay your own'],
      },
      {
        label: 'SEO built-in',
        values: ['Full suite', 'Platform-controlled', 'Docs-focused', 'Build yourself'],
      },
      {
        label: 'Performance',
        values: ['Lighthouse 4×100', 'Medium', 'High', 'Varies'],
      },
      {
        label: 'You own it',
        values: ['Yes (MIT)', 'No', 'Yes', 'Yes'],
      },
    ],
    full: {
      label: 'Full comparison — vs Fandom, Wiki.js, BookStack & more →',
      href: '/landing/comparison/',
    },
  },
  comparisonPage: {
    title: 'AnvilWiki vs Fandom vs Wiki.js — How to Choose',
    subtitle:
      'An honest, data-backed comparison of hosted wiki platforms (Fandom), self-hosted wiki engines (Wiki.js, BookStack, MediaWiki, DokuWiki, Docmost), and AnvilWiki — a static publishing template with an AI content workflow.',
    intro:
      'These tools get recommended in the same breath, but they are three different species. Pick with three questions: who writes the content, who keeps the revenue, and how much server you want to run.',
    tldrTitle: 'The three species',
    tldrItems: [
      {
        name: 'Fandom',
        text: 'Hosted community platform — free hosting and community editors, but the platform controls the ads, the domain, and takes a cut of the revenue.',
      },
      {
        name: 'Wiki.js · BookStack · MediaWiki · DokuWiki · Docmost',
        text: 'Self-hosted collaboration engines — web editors, accounts, permissions. You run (and pay for) a server and a database.',
      },
      {
        name: 'AnvilWiki',
        text: 'Static publishing template — you and your AI agent write MDX in git, deploy free on Cloudflare Pages, keep 100% of ad revenue.',
      },
    ],
    table: {
      title: 'The core comparison',
      subtitle: 'AnvilWiki vs a hosted platform vs self-hosted engines.',
      columns: ['AnvilWiki', 'Fandom', 'Self-hosted engines'],
      rows: [
        {
          label: 'Species',
          values: ['Static site template', 'Hosted wiki platform', 'Self-hosted wiki software'],
        },
        {
          label: 'Who writes content',
          values: ['You + AI agent (git / PR)', 'Community volunteers (web editor)', 'Team members (web editor)'],
        },
        {
          label: 'Server cost',
          values: ['Free — Cloudflare Pages', 'Free (platform-hosted)', 'Your own VPS + database'],
        },
        {
          label: 'Ad revenue',
          values: ['100% yours (AdSense slots built in)', 'Platform takes a cut', 'DIY — rarely built in'],
        },
        {
          label: 'SEO control',
          values: ['Full suite built in', 'Platform-controlled', 'Depends on setup'],
        },
        {
          label: 'Performance',
          values: ['Lighthouse 4×100 out of the box', 'Medium', 'Depends on caching'],
        },
        {
          label: 'Multi-user editing',
          values: ['Not needed — solo + AI', 'Strong', 'Strong — accounts + permissions'],
        },
        {
          label: 'AI content workflow',
          values: ['Built in — agent skills ship in the repo', 'None', 'None'],
        },
        {
          label: 'License',
          values: ['MIT', 'Commercial platform', 'GPL / AGPL / MIT (varies)'],
        },
        {
          label: 'Data ownership',
          values: ['Your git repo — portable', 'Platform-locked, limited export', 'Your server'],
        },
      ],
    },
    engines: {
      title: 'The self-hosted engines, at a glance',
      subtitle: 'Neutral facts, alphabetical order. GitHub data as of 2026-08.',
      columns: ['Project', 'Positioning', 'License', 'Stars', 'Latest release', 'Best for'],
      entries: [
        {
          name: 'BookStack',
          url: 'https://github.com/BookStackApp/BookStack',
          positioning: 'Structured team knowledge base (shelves → books → chapters → pages)',
          license: 'MIT',
          stars: '~19.0k',
          release: 'v26.05 (2026-07)',
          bestFor: 'Team docs, non-technical editors',
        },
        {
          name: 'Docmost',
          url: 'https://github.com/docmost/docmost',
          positioning: 'Modern real-time collaboration — a Notion/Confluence alternative',
          license: 'AGPL-3.0',
          stars: '~21.4k',
          release: 'v0.95 (2026-07)',
          bestFor: 'Real-time collaborative knowledge bases',
        },
        {
          name: 'DokuWiki',
          url: 'https://github.com/dokuwiki/dokuwiki',
          positioning: 'PHP wiki with no database — content lives in plain files',
          license: 'GPL-2.0',
          stars: '~4.7k',
          release: '2026-07-14',
          bestFor: 'Low-resource self-hosting',
        },
        {
          name: 'MediaWiki',
          url: 'https://github.com/wikimedia/mediawiki',
          positioning: 'The engine behind Wikipedia',
          license: 'GPL',
          stars: '~5.2k (mirror)',
          release: 'Continuous',
          bestFor: 'Large community encyclopedias',
        },
        {
          name: 'Wiki.js',
          url: 'https://github.com/requarks/wiki',
          positioning: 'Node.js wiki with Git sync and a modern UI',
          license: 'AGPL-3.0',
          stars: '~28.8k',
          release: 'v2.5 (2026-05)',
          bestFor: 'Modern self-hosted wikis',
        },
      ],
      note: 'AnvilWiki itself is young — v2.0 shipped in 2026-08 and its GitHub star count is still small, not a decade of ecosystem like the projects above. What you get instead is an architecture written for the AI-search era: static, structured, agent-driven. Judge it by the demo, not the star count.',
    },
    notFor: {
      title: 'When NOT to pick AnvilWiki',
      subtitle: 'Honest guidance — the right tool beats another star.',
      items: [
        {
          need: 'A team needs a web editor with accounts and permissions',
          pick: 'Wiki.js or BookStack',
        },
        { need: 'You want a large public community encyclopedia', pick: 'MediaWiki or Fandom' },
        { need: 'You need real-time collaborative docs for a company', pick: 'Docmost' },
        {
          need: 'Your goal is a solo, SEO-driven, ad-monetized game content site',
          pick: 'AnvilWiki',
        },
      ],
    },
    cta: {
      title: 'Still deciding? Try the demo.',
      subtitle:
        'A complete game wiki built with AnvilWiki — Lighthouse 4×100, deployable in 30 minutes.',
      primaryLabel: 'View the demo',
      primaryHref: '/',
      secondaryLabel: 'Get started',
      secondaryHref: '/landing#docs',
    },
  },
  showcase: {
    title: 'See it in action',
    subtitle:
      'A live demo built with AnvilWiki — a complete game wiki for the fictional "Anvil Quest".',
    points: [
      'Real game wiki layout (Hero → QuickStart → content modules → CTA)',
      'Measured Lighthouse Performance 100 on a full content site',
      'Real i18n: English at root + Japanese prefixed, with fallback',
      'Working ad slots, search, comments — all env-gated, off by default',
    ],
    cta: { label: 'View live demo →', href: '/' },
    browserUrl: 'anvilwiki.pages.dev/bosses/emberfang',
    mobileCaption: 'Mobile-first: clean first screen, scrollable tables, tap-to-copy codes.',
    articleAlt: 'Boss guide article — Quick Answer card and structured Boss Overview data card',
    mobileAlt: 'Mobile view of the demo homepage',
  },
  builtWith: {
    title: 'Built with AnvilWiki',
    subtitle:
      'Real sites launched by the community — from Roblox hits to Steam classics. Yours could be next.',
    submitLabel: 'Built a site? Submit yours →',
    submitHref: SHOWCASE_DATA,
  },
  docsEntry: {
    title: 'Get started in minutes',
    cards: [
      {
        icon: 'lucide:crosshair',
        title: 'Pick Your Game',
        description:
          'Which game is worth a wiki? A 4-layer selection funnel plus the first-day 10-pages plan.',
        href: '/landing/docs/pick-your-game/',
      },
      {
        icon: 'lucide:rocket',
        title: 'Quick Start',
        description: 'Install the 6 tools and get your environment ready — once and for all.',
        href: '/landing/docs/install-tools/',
      },
      {
        icon: 'lucide:palette',
        title: 'Apply Template',
        description: 'Fork the template and swap in your game — one guided command.',
        href: '/landing/docs/launch-your-site/',
      },
      {
        icon: 'lucide:search',
        title: 'SEO Guide',
        description: 'From indexed to ranking — keyword maps, on-page checks, and AI citations.',
        href: '/landing/docs/seo-traffic/',
      },
    ],
    readLabel: 'Read',
  },
  devGuide: {
    title: 'How to use it — 5 steps',
    subtitle:
      'From fork to a live site in about 30 minutes. Every step ships with a full doc behind it.',
    steps: [
      {
        title: 'Fork & run locally',
        description:
          'Clone your fork and start the dev server — the demo wiki (fictional game "Anvil Quest") works out of the box.',
        command: 'pnpm install && pnpm dev',
        linkLabel: 'Ch.3 · Launch your site',
        href: '/landing/docs/launch-your-site/',
      },
      {
        title: 'Make it yours',
        description:
          'One interactive CLI swaps game identity, theme color, locales and nav — and resets demo values (incl. wrangler.toml).',
        command: 'pnpm apply-template',
        linkLabel: 'Ch.3 · Apply the template',
        href: '/landing/docs/launch-your-site/',
      },
      {
        title: 'Write pages by chatting',
        description:
          'Open the repo in ZCode / Claude Code / Codex and just talk — agent skills ship inside the repo and the Zod schema gates every page.',
        command: '"write a boss guide from these notes"',
        linkLabel: 'Ch.4 · Write pages with AI',
        href: '/landing/docs/first-10-pages/',
      },
      {
        title: 'Deploy for free',
        description:
          'Push to GitHub and connect Cloudflare Pages — the Astro build is auto-detected; free unlimited bandwidth + global CDN.',
        command: 'pnpm build && git push',
        linkLabel: 'Ch.5 · Put it online',
        href: '/landing/docs/put-site-online/',
      },
      {
        title: 'Stay fresh',
        description:
          'A weekly audit workflow flags stale pages, codes skills keep redemption pages current, and upstream updates sync cleanly.',
        command: 'pnpm refresh-audit',
        linkLabel: 'Ch.8 · Stay fresh',
        href: '/landing/docs/weekly-ops/',
      },
    ],
    allDocs: {
      label: 'Open the docs center — two hands-on manuals with copy-paste AI prompts',
      href: '/landing/docs/',
    },
  },
  handbook: {
    hubTitle: 'AnvilWiki Docs',
    hubSubtitle:
      'Two separate hands-on manuals, written for complete beginners: the Learning Manual walks you from game selection to a live, indexed, monetized wiki — then shows you how to templatize it, batch-produce inner pages, and win rankings and AI citations; the Development Manual covers customization and engineering. Every step is a SOP with copy-paste AI prompts.',
    beginnerHint: {
      text: 'Complete beginner? Start with Learning Manual Chapter 1 — pick your game',
      href: '/landing/docs/pick-your-game/',
    },
    manuals: {
      learn: {
        label: 'Learning Manual',
        description:
          'Zero experience required: pick the right game, install the tools, launch your site, write 10 pages with AI on day one, get on Google, turn on ads, run a 30-minute weekly ops loop — then turn your first site into a template, batch-create dozens of traffic-entrance pages, and climb from indexed to ranking and AI-cited.',
      },
      dev: {
        label: 'Development Manual',
        description:
          'For customizers and contributors: the change map, categories & locales, theme & homepage copy, feature switches, CI & security, syncing upstream or contributing back, and running ops through AI (anvilwiki-ops CLI + MCP).',
      },
    },
    chapterLabel: 'Chapter',
    chapterSuffix: '',
    backToHub: 'All docs',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    editLabel: 'Edit on GitHub',
    updatedLabel: 'Updated',
    readLabel: 'Read chapter',
    tldrLabel: 'TL;DR',
    onThisPageLabel: 'On this page',
    manualsLabel: 'Manual contents',
    roadmap: {
      title: 'Building a game wiki: the whole job at a glance',
      hint: 'Ten jobs from zero to earning. Click any job to jump to the chapter that walks you through it step by step.',
      items: [
        { label: 'Pick the right game', time: '2 days', href: '/landing/docs/pick-your-game/' },
        { label: 'Install the 6 tools', time: '30 min', href: '/landing/docs/install-tools/' },
        { label: 'Turn the template into your site', time: '30 min', href: '/landing/docs/launch-your-site/' },
        { label: 'Write the first 10 pages with AI', time: '1 day', href: '/landing/docs/first-10-pages/' },
        { label: 'Put the site online (free hosting)', time: '15 min', href: '/landing/docs/put-site-online/' },
        { label: 'Register with Google (GSC + sitemap)', time: '20 min', href: '/landing/docs/get-on-google/' },
        { label: 'Buy and connect a domain', time: '30 min', href: '/landing/docs/put-site-online/' },
        { label: 'Turn on ads (AdSense)', time: 'review: days', href: '/landing/docs/enable-ads/' },
        { label: 'Weekly 30-min freshness loop', time: 'weekly', href: '/landing/docs/weekly-ops/' },
        { label: 'Customize: categories, languages, theme', time: 'as needed', href: '/landing/docs/categories-and-locales/' },
      ],
    },
    openManualLabel: 'Open this manual',
    chaptersCountLabel: 'chapters',
  },
  finalCta: {
    title: 'Ready to launch your game wiki?',
    subtitle: 'Fork, configure, deploy — all in 30 minutes, completely free.',
    primaryCta: { label: 'Fork on GitHub', href: FORK_URL },
    secondaryCta: { label: 'Open the docs center', href: '/landing/docs/' },
  },
  community: {
    title: 'Join the discussion',
    subtitle:
      'Questions about deploying your own wiki, feature ideas, or just want to chat about game content sites? Scan the QR code to add the maintainer on WeChat and join the group.',
    qrAlt: 'WeChat QR code — scan to add the maintainer and join the discussion group',
    qrCaption: 'Scan with WeChat',
    qrNote: 'WeChat group · 中文/English both welcome',
    buttonLabel: 'Join the group',
    buttonAria: 'Open the WeChat group QR code',
    closeAria: 'Close QR code',
  },
  footer: {
    tagline: 'Open-source game wiki site template. Free, fast, beginner-friendly.',
    license: 'MIT License',
    madeWith: 'Built with Astro · Deployed on Cloudflare Pages',
    author: 'Open-sourced by 袁锐钦 (Yuan Ruiqin), lead of the PNGTRIBE team',
  },
};

const zh: LandingContent = {
  htmlLang: 'zh',
  title: 'AnvilWiki — 开源游戏 Wiki 模板 + AI 内容工作流',
  description:
    '开源游戏 wiki 模板 + AI 原生内容工作流:选对游戏、和 AI 对话就能产页、codes 页自动保鲜。Lighthouse 4×100、Cloudflare 免费部署、广告收入 100% 归你。',
  announcement: {
    text: `v${PROJECT_VERSION} 加固——三站生产事故复盘落地 16 项:全站尾斜杠统一(谷歌零 308)、空分类自动 noindex、文章级 FAQ 结构化数据、智能标题后缀、相关文章三层兜底,新增 IndexNow 推送与主题色图标一键生成。`,
    href: RELEASES,
  },
  hero: {
    badge: '开源 · MIT 协议 · Cloudflare Pages',
    title: '把一个爆发期游戏,24 小时变成你的流量站',
    subtitle:
      'SEO 强化的游戏 wiki 模板(Astro + Cloudflare Pages,Lighthouse 4×100、免费无限带宽)+ 随仓库分发的 AI 内容工作流:跟 AI 对话就能产页、codes 页自动保鲜——每一分广告收入都归你。',
    primaryCta: { label: 'Fork 本仓库', href: FORK_URL },
    secondaryCta: { label: 'GitHub 加星', href: 'https://github.com/PNGTRID/AnvilWiki' },
    tertiaryCta: { label: '查看 Demo', href: '/' },
    installCommand: `git clone https://github.com/PNGTRID/AnvilWiki.git
cd anvilwiki
pnpm install && pnpm dev`,
    screenshotCaption: '在线 Demo —— 虚构游戏「Anvil Quest」的完整 wiki',
    screenshotAlt: 'AnvilWiki 演示站首页 —— 用模板搭建的游戏 wiki',
    terminalLabel: '终端',
    copyLabel: '复制',
    copiedLabel: '已复制!',
  },
  socialProof: {
    lighthouse: [
      { label: '性能', score: 100 },
      { label: '无障碍', score: 100 },
      { label: '最佳实践', score: 100 },
      { label: 'SEO', score: 100 },
    ],
    poweredBy: '基于 Astro + Cloudflare Pages —— 免费无限带宽',
  },
  features: [
    {
      icon: 'lucide:bot',
      title: 'AI 原生内容工作流',
      description:
        'Agent 技能随仓库分发(.agent/skills/,Agent Skills 开放标准)。对 ZCode / Claude Code / Codex 说「根据这些笔记写一篇 Boss 攻略」,直接产出通过构建校验的 MDX 页面——schema + lint 自动质检,不用学任何脚本。',
    },
    {
      icon: 'lucide:crosshair',
      title: '选品方法论',
      description:
        '多数模板忽略的第一步:四层选品漏斗(Trends 需求验证 + SERP 空位检查)+ 首日 10 页计划——新游爆发的 2-8 周黄金窗口,流量全在这里。',
    },
    {
      icon: 'lucide:ticket',
      title: 'codes 页自动化',
      description:
        '结构化 codes 数据(状态/到期/来源)自动渲染 Active 一键复制区 + Expired 长尾表格(承接「XX 还能用吗」搜索);每周定时审计自动开 issue 提醒保鲜——不用你记得去更新。',
    },
    {
      icon: 'lucide:dollar-sign',
      title: '广告收入 100% 归你',
      description:
        '内置 AdSense 广告位、赞助卡片、联盟链接组件——全部 env 门控默认关闭。无平台抽成,和托管 wiki 农场完全不同。',
    },
    {
      icon: 'lucide:zap',
      title: 'SEO 工程化 + 极致性能',
      description:
        'sitemap(含 lastmod)、JSON-LD 全套、hreflang、面向 AI 搜索的 Quick Answer、llms.txt——建立在 Astro 零 JS 和开箱 Lighthouse 4×100 之上。',
    },
    {
      icon: 'lucide:cloud',
      title: '永久免费',
      description:
        '零配置部署到 Cloudflare Pages:免费无限带宽 + 全球 CDN + SSL;多语言开箱即用(英文根路径,回退机制保证直链永不 404)。永远没有服务器账单。',
    },
  ],
  compare: {
    title: '为什么选择 AnvilWiki?',
    subtitle: '与其他游戏内容站方案的对比。',
    columns: ['AnvilWiki', 'Fandom', 'Starlight', 'Next.js 自建'],
    rows: [
      {
        label: '适用场景',
        values: ['游戏 SEO 内容站', '社区协作 wiki', '产品文档', '定制应用'],
      },
      {
        label: 'AI 内容管道',
        values: ['技能随仓库分发', '无', '无', '自建'],
      },
      {
        label: '选品指导',
        values: ['漏斗 + 首日计划', '无', '无', '无'],
      },
      {
        label: '广告收入',
        values: ['100% 归你', '平台分成', '无广告', '自己接'],
      },
      {
        label: '托管成本',
        values: ['免费无限带宽', '免费(平台托管)', '自付', '自付'],
      },
      {
        label: 'SEO 内置',
        values: ['全套', '平台控制', '文档向', '自建'],
      },
      {
        label: '性能',
        values: ['Lighthouse 4×100', '中等', '高', '取决于实现'],
      },
      {
        label: '完全拥有',
        values: ['是(MIT)', '否', '是', '是'],
      },
    ],
    full: {
      label: '完整对比——vs Fandom、Wiki.js、BookStack 等 →',
      href: '/zh/landing/comparison/',
    },
  },
  comparisonPage: {
    title: 'AnvilWiki 对比 Fandom、Wiki.js——怎么选',
    subtitle:
      '托管平台(Fandom)、自托管协作引擎(Wiki.js / BookStack / MediaWiki / DokuWiki / Docmost)与 AnvilWiki(静态发布模板 + AI 内容工作流)的诚实对比,附 GitHub 数据。',
    intro:
      '这些工具经常被放在一起推荐,但其实是三个不同的物种。选型只需要三个问题:内容谁来写、收入归谁、服务器想运维多少。',
    tldrTitle: '三个物种',
    tldrItems: [
      {
        name: 'Fandom',
        text: '托管社区平台——免费托管、社区共建,但广告、域名、收入分成都由平台说了算。',
      },
      {
        name: 'Wiki.js · BookStack · MediaWiki · DokuWiki · Docmost',
        text: '自托管协作引擎——网页编辑器、账号、权限一应俱全,代价是你要自己养服务器和数据库。',
      },
      {
        name: 'AnvilWiki',
        text: '静态发布模板——你和 AI agent 在 git 里写 MDX,Cloudflare Pages 免费部署,广告收入 100% 归你。',
      },
    ],
    table: {
      title: '核心对比',
      subtitle: 'AnvilWiki vs 托管平台 vs 自托管引擎。',
      columns: ['AnvilWiki', 'Fandom', '自托管引擎'],
      rows: [
        { label: '物种', values: ['静态站点模板', '托管 wiki 平台', '自托管 wiki 软件'] },
        {
          label: '内容谁来写',
          values: ['你 + AI agent(git / PR)', '社区志愿者(网页编辑)', '团队成员(网页编辑)'],
        },
        {
          label: '服务器成本',
          values: ['免费——Cloudflare Pages', '免费(平台托管)', '自付 VPS + 数据库'],
        },
        {
          label: '广告收入',
          values: ['100% 归你(内置 AdSense 位)', '平台抽成', '自己接(多数无内置)'],
        },
        { label: 'SEO 控制权', values: ['全套内置', '平台说了算', '取决于配置'] },
        { label: '性能', values: ['开箱 Lighthouse 4×100', '中等', '取决于缓存'] },
        { label: '多人协作', values: ['不需要——单人 + AI', '强', '强——账号 + 权限'] },
        { label: 'AI 内容工作流', values: ['内置——技能随仓库分发', '无', '无'] },
        { label: '协议', values: ['MIT', '商业平台', 'GPL / AGPL / MIT(各异)'] },
        { label: '数据所有权', values: ['你的 git 仓库,随时迁走', '平台锁定,导出受限', '你的服务器'] },
      ],
    },
    engines: {
      title: '自托管引擎速览',
      subtitle: '中立事实,按字母序排列。GitHub 数据,截至 2026-08。',
      columns: ['项目', '定位', '协议', 'Stars', '最近发版', '适合谁'],
      entries: [
        {
          name: 'BookStack',
          url: 'https://github.com/BookStackApp/BookStack',
          positioning: '结构化团队知识库(书架 → 书 → 章节 → 页面)',
          license: 'MIT',
          stars: '~19.0k',
          release: 'v26.05(2026-07)',
          bestFor: '团队文档、非技术编辑者',
        },
        {
          name: 'Docmost',
          url: 'https://github.com/docmost/docmost',
          positioning: '现代实时协作,Notion/Confluence 的替代',
          license: 'AGPL-3.0',
          stars: '~21.4k',
          release: 'v0.95(2026-07)',
          bestFor: '实时协作团队知识库',
        },
        {
          name: 'DokuWiki',
          url: 'https://github.com/dokuwiki/dokuwiki',
          positioning: '免数据库的 PHP wiki,内容即纯文本文件',
          license: 'GPL-2.0',
          stars: '~4.7k',
          release: '2026-07-14',
          bestFor: '低资源自托管',
        },
        {
          name: 'MediaWiki',
          url: 'https://github.com/wikimedia/mediawiki',
          positioning: '维基百科背后的引擎',
          license: 'GPL',
          stars: '~5.2k(镜像)',
          release: '持续发版',
          bestFor: '大型社区百科',
        },
        {
          name: 'Wiki.js',
          url: 'https://github.com/requarks/wiki',
          positioning: 'Node.js wiki,Git 同步 + 现代界面',
          license: 'AGPL-3.0',
          stars: '~28.8k',
          release: 'v2.5(2026-05)',
          bestFor: '现代自托管 wiki',
        },
      ],
      note: 'AnvilWiki 本身还很年轻——v2.0 于 2026-08 发布,GitHub star 数还很少,没有上面这些项目十年积累的生态;你换来的是为 AI 搜索时代写的架构:静态、结构化、agent 驱动。请用 demo 判断它,而不是用 star 数。',
    },
    notFor: {
      title: '什么时候不该选 AnvilWiki',
      subtitle: '诚实的建议——选对工具比多一颗星重要。',
      items: [
        { need: '团队需要网页编辑器 + 账号 + 权限', pick: 'Wiki.js 或 BookStack' },
        { need: '要做大型公开社区百科', pick: 'MediaWiki 或 Fandom' },
        { need: '公司需要实时协作文档', pick: 'Docmost' },
        { need: '目标是单人 SEO 流量 + 广告变现的游戏内容站', pick: 'AnvilWiki' },
      ],
    },
    cta: {
      title: '还在犹豫?先看 Demo。',
      subtitle: '用 AnvilWiki 搭的完整游戏 wiki——Lighthouse 4×100,30 分钟可上线。',
      primaryLabel: '查看 Demo',
      primaryHref: '/',
      secondaryLabel: '快速开始',
      secondaryHref: '/zh/landing#docs',
    },
  },
  showcase: {
    title: '看看实际效果',
    subtitle: '用 AnvilWiki 构建的在线 Demo——虚构游戏「Anvil Quest」的完整 wiki 站。',
    points: [
      '真实的游戏 wiki 布局(Hero → 快速入口 → 内容模块 → CTA)',
      '完整内容站实测 Lighthouse 性能 100',
      '真实多语言:英文根路径 + 日文带前缀 + 自动回退',
      '广告位 / 搜索 / 评论全部可用(env 驱动,默认关闭)',
    ],
    cta: { label: '查看在线 Demo →', href: '/' },
    browserUrl: 'anvilwiki.pages.dev/bosses/emberfang',
    mobileCaption: '移动优先:首屏干净、表格横滑、兑换码点击即复制。',
    articleAlt: 'Boss 攻略文章页 —— 快速答案卡片 + 结构化 Boss 数据卡',
    mobileAlt: '演示站首页的移动端视图',
  },
  builtWith: {
    title: '用 AnvilWiki 建成的站',
    subtitle: '社区用户的真实案例——从 Roblox 热游到 Steam 经典,下一个可能就是你的站。',
    submitLabel: '你也建了站?提交案例 →',
    submitHref: SHOWCASE_DATA,
  },
  docsEntry: {
    title: '几分钟即可上手',
    cards: [
      {
        icon: 'lucide:crosshair',
        title: '选对游戏',
        description: '哪个游戏值得建 wiki?四层选品漏斗 + 首日 10 页计划。',
        href: '/zh/landing/docs/pick-your-game/',
      },
      {
        icon: 'lucide:rocket',
        title: '快速开始',
        description: '装好 6 样工具,准备开工环境——只装一次,以后永远用。',
        href: '/zh/landing/docs/install-tools/',
      },
      {
        icon: 'lucide:palette',
        title: '套用模板',
        description: 'Fork 模板,一条问答式命令换成你的游戏。',
        href: '/zh/landing/docs/launch-your-site/',
      },
      {
        icon: 'lucide:search',
        title: 'SEO 指南',
        description: '从被收录到有排名——选词地图、单页自检、AI 引用。',
        href: '/zh/landing/docs/seo-traffic/',
      },
    ],
    readLabel: '阅读',
  },
  devGuide: {
    title: '怎么用:5 步走',
    subtitle: '从 fork 到上线约 30 分钟,每一步背后都有完整文档。',
    steps: [
      {
        title: 'Fork 并本地跑起来',
        description: '克隆你的 fork、启动开发服务器——demo wiki(虚构游戏「Anvil Quest」)开箱即用。',
        command: 'pnpm install && pnpm dev',
        linkLabel: '第 3 章·建起你的站',
        href: '/zh/landing/docs/launch-your-site/',
      },
      {
        title: '换成你的游戏',
        description:
          '一条交互式 CLI 替换游戏信息、主题色、多语言与导航,并重置 demo 配置(含 wrangler.toml)。',
        command: 'pnpm apply-template',
        linkLabel: '第 3 章·换皮命令',
        href: '/zh/landing/docs/launch-your-site/',
      },
      {
        title: '和 AI 对话产页',
        description:
          '用 ZCode / Claude Code / Codex 打开仓库直接说——agent 技能随仓库分发,Zod schema 把住每一页的质量关。',
        command: '"帮我写一篇 Boss 攻略,要点如下:…"',
        linkLabel: '第 4 章·AI 产页',
        href: '/zh/landing/docs/first-10-pages/',
      },
      {
        title: '免费部署上线',
        description:
          '推到 GitHub、连接 Cloudflare Pages——自动识别 Astro 构建,免费无限带宽 + 全球 CDN。',
        command: 'pnpm build && git push',
        linkLabel: '第 5 章·免费上线',
        href: '/zh/landing/docs/put-site-online/',
      },
      {
        title: '保持新鲜',
        description:
          '每周审计工作流自动标记过期页面,兑换码技能守住长尾流量,上游更新随时可同步。',
        command: 'pnpm refresh-audit',
        linkLabel: '第 8 章·每周保鲜',
        href: '/zh/landing/docs/weekly-ops/',
      },
    ],
    allDocs: {
      label: '打开文档中心 —— 两本实操手册,含可复制的 AI 提示词',
      href: '/zh/landing/docs/',
    },
  },
  handbook: {
    hubTitle: 'AnvilWiki 文档中心',
    hubSubtitle:
      '两本相互独立的实操手册,按完全零基础标准编写:学习手册带你从选游戏走到上线、收录、变现,再教你把站打磨成模板、批量铺内页放大、把排名和 AI 引用做上去;开发手册覆盖定制与工程。每一步都是 SOP + 可复制的 AI 提示词。',
    beginnerHint: {
      text: '完全零基础?从学习手册第 1 章「选对游戏」开始',
      href: '/zh/landing/docs/pick-your-game/',
    },
    manuals: {
      learn: {
        label: '学习手册',
        description:
          '零经验起步:选对游戏、装好工具、建起自己的站、首日用 AI 产出 10 页、被 Google 收录、接上广告、每周 30 分钟运营节奏,把第一个站打磨成模板、批量做出几十个流量入口,最后从被收录走到有排名、被 AI 引用。',
      },
      dev: {
        label: '开发手册',
        description:
          '面向定制者与贡献者:改动地图、加栏目与加语言、换主题与改首页、功能开关总表、CI 门禁与安全、同步上游与贡献回流、让 AI 替你运营(anvilwiki-ops 命令行与 MCP)。',
      },
    },
    chapterLabel: '第',
    chapterSuffix: '章',
    backToHub: '全部文档',
    prevLabel: '上一章',
    nextLabel: '下一章',
    editLabel: '在 GitHub 上编辑',
    updatedLabel: '更新于',
    readLabel: '阅读本章',
    tldrLabel: '太长不看',
    onThisPageLabel: '本页目录',
    manualsLabel: '手册目录',
    roadmap: {
      title: '建一个游戏 wiki 站:全部工作一览',
      hint: '从零到赚钱一共 10 件事。点任意一项,直接跳到手把手教你的那一章。',
      items: [
        { label: '选对游戏', time: '2 天', href: '/zh/landing/docs/pick-your-game/' },
        { label: '装好 6 样工具', time: '30 分钟', href: '/zh/landing/docs/install-tools/' },
        { label: '把模板变成你的站', time: '30 分钟', href: '/zh/landing/docs/launch-your-site/' },
        { label: '用 AI 写首日 10 页', time: '1 天', href: '/zh/landing/docs/first-10-pages/' },
        { label: '网站上线(免费托管)', time: '15 分钟', href: '/zh/landing/docs/put-site-online/' },
        { label: '在 Google 登记(站长后台+目录)', time: '20 分钟', href: '/zh/landing/docs/get-on-google/' },
        { label: '买域名并绑定', time: '30 分钟', href: '/zh/landing/docs/put-site-online/' },
        { label: '接广告(AdSense)', time: '审核数天', href: '/zh/landing/docs/enable-ads/' },
        { label: '每周 30 分钟保鲜', time: '每周', href: '/zh/landing/docs/weekly-ops/' },
        { label: '定制:加栏目/语言/换肤', time: '按需', href: '/zh/landing/docs/categories-and-locales/' },
      ],
    },
    openManualLabel: '打开这本手册',
    chaptersCountLabel: '章',
  },
  finalCta: {
    title: '准备好上线你的游戏 wiki 了吗?',
    subtitle: 'Fork、配置、部署——30 分钟搞定,完全免费。',
    primaryCta: { label: 'Fork 开始建站', href: FORK_URL },
    secondaryCta: { label: '打开文档中心', href: '/zh/landing/docs/' },
  },
  community: {
    title: '扫码进群,一起讨论',
    subtitle:
      '部署自己的 wiki 站有问题?想聊功能建议或游戏内容站怎么做?微信扫码添加主理人好友,拉你进交流群。',
    qrAlt: '微信二维码——扫码添加主理人好友,进群交流讨论',
    qrCaption: '微信扫码',
    qrNote: '交流群 · 中文/English 均可',
    buttonLabel: '加群交流',
    buttonAria: '打开微信交流群二维码',
    closeAria: '关闭二维码',
  },
  footer: {
    tagline: '开源游戏 wiki 站点模板。免费、快速、新手友好。',
    license: 'MIT 协议',
    madeWith: '基于 Astro 构建 · 部署于 Cloudflare Pages',
    author: '由 PNG 部落团队主理人 袁锐钦 开源',
  },
};

export const landingContent: Record<LandingLocale, LandingContent> = { en, zh };

/** Landing-page routes per locale (for language switching + hreflang). */
export const landingPath = (locale: LandingLocale) => (locale === 'en' ? '/landing' : `/zh/landing`);
