/**
 * Landing page copy — English (/landing). Data-only module split out of
 * landing.ts (v2.31.1) and assembled into `landingContent` by the facade.
 * Typed against LandingContent so a missing zh key fails typecheck.
 */

import type { LandingContent } from './landing-types';
import {
  FORK_URL,
  PROJECT_VERSION,
  RELEASES,
  SHOWCASE_DATA,
} from './landing-shared';

export const en: LandingContent = {
  htmlLang: 'en',
  title: 'AnvilWiki — Open-Source Game Wiki Template for Cloudflare',
  description:
    'Learn to build money-making websites on the AnvilWiki template — hands-on tutorials for game wiki hubs, SaaS coupon sites and tutorial knowledge bases: build, get indexed, monetize. Free template, free Cloudflare hosting, 100% of revenue yours.',
  announcement: {
    text: `AnvilWiki template update log (v${PROJECT_VERSION}): the official site homepage becomes a tutorials-first face — you land on a pick-a-direction entry into the build-and-earn tutorials; plus the flagship tutorial line (/landing/tutorials + Chinese twin) — hands-on guides anchored on what you want to do (build a game codes site, run a SaaS coupon hub, put up a tutorial knowledge base, get indexed, monetize), each ending with the matching template preset CTA, the WeChat group entry and a same-topic next read; the setup CLI now also asks for your site type (game wiki default / coupon hub / tutorial hub) and scaffolds the matching shape. Check-versions gating and audit-rebuild fixes from this cycle are all logged. 26 test suites. Forks: merge upstream and pnpm install as usual. This bar tracks template releases — details & full changelog on GitHub Releases.`,
    href: RELEASES,
    dismissLabel: 'Dismiss announcement',
  },
  hero: {
    badge: 'Open Source · Free Tutorials · Cloudflare Pages',
    title: 'Learn to build a money-making website with AnvilWiki',
    subtitle:
      'Hands-on tutorials by direction: game wiki hubs, SaaS coupon sites, tutorial knowledge bases — build, get indexed, monetize. Every step maps to a capability the template already ships, with an AI workflow that turns conversation into pages.',
    primaryCta: { label: 'Pick a direction, start learning', href: '#directions' },
    secondaryCta: { label: 'Fork on GitHub', href: FORK_URL },
    tertiaryCta: { label: 'Live Demo', href: '/demo/' },
    installCommand: `git clone https://github.com/PNGTRID/AnvilWiki.git
cd anvilwiki
pnpm install && pnpm dev`,
    screenshotCaption: 'The live demo — a complete wiki for the fictional game "Anvil Quest"',
    screenshotAlt: 'AnvilWiki demo homepage — game wiki built with the template',
    terminalLabel: 'Terminal',
    copyLabel: 'Copy',
    copiedLabel: 'Copied!',
  },
  directions: {
    title: 'Pick a direction and build your money-making site',
    subtitle:
      'Each direction is a complete route: what site to build, how it earns, where lesson one lives. Pick one and the setup CLI scaffolds exactly that shape — the template ships what the tutorials teach.',
    startLabel: 'Start with lesson one',
    moreLabel: 'Browse all tutorials',
    items: {
      'game-wiki': {
        icon: 'lucide:swords',
        title: 'Build a game wiki hub',
        description:
          'A guide hub around a trending game: boss stat cards, redeem-code pages, gear guides. The 2-8 weeks after a game blows up is the golden window — speed is everything.',
        earn: 'Monetize: display ads + codes-page search traffic',
      },
      'coupon-hub': {
        icon: 'lucide:ticket',
        title: 'Run a SaaS coupon site',
        description:
          'Software promo codes, merchant by merchant: active/expired auto-split, daily CSV sync, Black Friday spikes — the same codes engine, rebranded.',
        earn: 'Monetize: SaaS affiliate commissions that recur with subscriptions',
      },
      'tutorial-hub': {
        icon: 'lucide:graduation-cap',
        title: 'Put up a tutorial knowledge base',
        description:
          'A single-topic how-to site: Quick Answer + FAQ structured answers tuned to earn citations from AI search (ChatGPT / Perplexity) — the more your page reads like the answer, the more it gets cited.',
        earn: 'Monetize: tool affiliates inside tutorials + citation traffic',
      },
      'recipe-hub': {
        icon: 'lucide:cake',
        title: 'Build a recipe site',
        description:
          'Recipe frontmatter + Recipe JSON-LD: ingredients, tools, and times as structured data that wins Google recipe rich results (ratings, cook time, and photos straight on the search page) — cheap, steady traffic.',
        earn: 'Monetize: kitchen-tool affiliates + rich-result traffic',
      },
    },
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
    fandomSwitch: {
      title: 'Why Fandom users switch — custom page templates, ad control, and data ownership',
      subtitle:
        "'How to create a wiki template on Fandom' is searched about 1,380 times a month, and 'templates fandom' another 610 (SimilarWeb keyword data, global, 2026-08). Both queries come from the same place: creators who want their wiki to look and earn differently than the platform allows. The honest list of what stays in Fandom's hands:",
      items: [
        {
          title: 'Page templates and layout are platform-fixed',
          text: "Communities can recolor and restyle within Fandom's theme system, but the page skeleton — skin, layout structure, template components — ships as-is. There is no supported way to give your wiki its own page templates; community CSS is the closest workaround.",
        },
        {
          title: "Ads are the platform's business, not yours",
          text: "Fandom picks the ad networks, the placements, and the formats, and owns the advertiser relationships. Whether revenue is shared with contributors — and how much — is the platform's call. Bringing your own AdSense is not an option.",
        },
        {
          title: 'Your wiki lives under fandom.com',
          text: "Communities sit on a *.fandom.com subdomain — there is no custom-domain option, so every backlink and every bit of brand equity accrues to the platform's domain. Exports exist, but leaving means rebuilding from dumps, not flipping a switch.",
        },
        {
          title: 'No workflow for AI-assisted writing',
          text: 'Fandom is built around volunteer editors in a web UI — no git history, no review pipeline, and bulk automated page creation runs into bot and spam policies. If you write with an AI agent, there is no equivalent path. AnvilWiki is the opposite shape: MDX in git, agent drafts, you review, CI gates the result.',
        },
      ],
      note: "None of this makes Fandom a bad home — for a fan community that wants free hosting, built-in discovery, and zero maintenance, it remains a solid pick, and the advice above stands: large public community encyclopedias belong on MediaWiki or Fandom. The trade-offs above start to bite when the site is your own project — solo-run, SEO-driven, and meant to earn. That is the case where owning the templates, the ads, and the domain matters.",
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
      primaryHref: '/demo/',
      secondaryLabel: 'Get started',
      secondaryHref: '/landing/#docs',
    },
  },
  communityHighlights: {
    title: 'Community Highlights',
    subtitle:
      'The best of our WeChat builder group, curated daily by AI: hard-won know-how, monetization pitfalls, real Q&A, and what members want from the template. The discussion is in Chinese — items are kept faithful to the original.',
    navLabel: 'Highlights',
    tocLabel: 'On this page',
    updatedLabel: 'Last updated',
    sinceLabel: 'Digest since',
    disclaimer:
      'Curated daily from the group chat by an automated pipeline — nicknames only, raw logs stay private. Items are member-shared experience, not official advice; ask the maintainer to remove anything.',
    sections: {
      gold: { title: 'Know-how', hint: 'Reusable methods, SOPs, tools, hard numbers' },
      pitfalls: { title: 'Pitfalls', hint: 'Lessons that cost real money' },
      qa: { title: 'Q&A', hint: 'Real member questions, answers merged from the thread' },
      feedback: { title: 'Feedback & ideas', hint: 'What members want from the template and docs' },
      news: { title: 'Milestones', hint: 'Releases, showcase entries, group events' },
      daily: { title: 'Day by day', hint: 'One line per day' },
    },
    openLabel: 'open',
    resolvedLabel: 'fixed',
    todayLabel: 'Today',
    yesterdayLabel: 'Yesterday',
    report: {
      title: 'Daily report',
      statsMessages: 'messages',
      statsSpeakers: 'speakers',
      statsPeak: 'peak',
      quotesTitle: 'Highlights of the day',
      takeawaysTitle: 'Takeaways',
      qaTitle: 'Resolved Q&A',
      resourcesTitle: 'Resources shared',
      faqTitle: 'Asked repeatedly',
      topicsTitle: 'Article candidates',
    },
    expandLabel: 'Show all',
    cta: {
      title: 'Building game content sites too?',
      subtitle:
        'Scan the QR code (bottom-right) to join the WeChat group, or fork the template and launch your own wiki in about 30 minutes.',
      primaryLabel: 'Fork on GitHub',
      primaryHref: FORK_URL,
      secondaryLabel: 'Read the docs',
      secondaryHref: '/landing/docs/',
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
    cta: { label: 'View live demo →', href: '/demo/' },
    browserUrl: 'anvil.wiki/bosses/emberfang',
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
        href: '/landing/docs/find-candidates/',
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
        href: '/landing/docs/rebrand-your-site/',
      },
      {
        icon: 'lucide:search',
        title: 'SEO Guide',
        description: 'From indexed to ranking — keyword maps, on-page checks, and AI citations.',
        href: '/landing/docs/rank-one-keyword/',
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
        linkLabel: 'Lesson 10 · Run your site',
        href: '/landing/docs/run-your-site/',
      },
      {
        title: 'Make it yours',
        description:
          'One interactive CLI swaps game identity, theme color, locales and nav — and resets demo values (incl. wrangler.toml).',
        command: 'pnpm apply-template',
        linkLabel: 'Lesson 11 · Make it yours',
        href: '/landing/docs/rebrand-your-site/',
      },
      {
        title: 'Write pages by chatting',
        description:
          'Open the repo in ZCode / Claude Code / Codex and just talk — agent skills ship inside the repo and the Zod schema gates every page.',
        command: '"write a boss guide from these notes"',
        linkLabel: 'Lesson 13 · Write pages with AI',
        href: '/landing/docs/first-article/',
      },
      {
        title: 'Deploy for free',
        description:
          'Push to GitHub and connect Cloudflare Pages — the Astro build is auto-detected; free unlimited bandwidth + global CDN.',
        command: 'pnpm build && git push',
        linkLabel: 'Lesson 18 · Take it live',
        href: '/landing/docs/put-site-online/',
      },
      {
        title: 'Stay fresh',
        description:
          'A weekly audit workflow flags stale pages, codes skills keep redemption pages current, and upstream updates sync cleanly.',
        command: 'pnpm refresh-audit',
        linkLabel: 'Lesson 25 · Stay fresh',
        href: '/landing/docs/weekly-ops/',
      },
    ],
    allDocs: {
      label: 'Open the docs center — two hands-on manuals with copy-paste AI prompts',
      href: '/landing/docs/',
    },
  },
  author: {
    title: 'About the author',
    name: '袁锐钦 (Yuan Ruiqin)',
    role: 'AnvilWiki maintainer · lead of the PNG 部落 community',
    bio:
      'Ruiqin spent years in design, teaching, and running a print factory — real business, real pressure. The turn to AI-assisted building follows one belief: code is the means, a shipped product is the skill, and users plus revenue close the loop. AnvilWiki distills that path — keyword sourcing, AI-assisted content, SEO, monetization — into a forkable template that goes live in about 30 minutes, with the bilingual handbook recording what actually worked.',
    links: [
      { label: 'ruiqin.dev — personal site', href: 'https://ruiqin.dev' },
      { label: 'PNG 部落 — pngtrid.cn', href: 'https://pngtrid.cn' },
      { label: 'GitHub — @PNGTRID', href: 'https://github.com/PNGTRID' },
    ],
  },
  search: {
    label: 'Search',
    placeholder: 'Search AnvilWiki...',
    noResults: 'No matches found',
    close: 'Close',
    loadError: 'Search failed to load — refresh the page and try again.',
  },
  handbook: {
    hubTitle: 'AnvilWiki Docs',
    hubSubtitle:
      'Two separate hands-on manuals, written for complete beginners: the Learning Manual walks you from game selection to a live, indexed, monetized wiki — then shows you how to templatize it, batch-produce inner pages, and win rankings and AI citations; the Development Manual covers customization and engineering. Every step is a SOP with copy-paste AI prompts.',
    beginnerHint: {
      text: 'Complete beginner? Start with the Pick & Validate stage — find a game worth writing about',
      href: '/landing/docs/find-candidates/',
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
          'For customizers and contributors: the change map, categories & locales, theme & homepage copy, feature switches, CI & security, syncing upstream or contributing back, and running ops through AI (GSC API setup, anvilwiki-ops CLI + MCP).',
      },
    },
    chapterLabel: 'Lesson',
    chapterSuffix: '',
    backToHub: 'All docs',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    editLabel: 'Edit on GitHub',
    updatedLabel: 'Updated',
    readLabel: 'Read lesson',
    tldrLabel: 'TL;DR',
    onThisPageLabel: 'On this page',
    manualsLabel: 'Manual contents',
    roadmap: {
      title: 'Building a game wiki: the whole job at a glance',
      hint: 'Ten jobs from zero to earning. Click any job to jump to the lesson that walks you through it step by step.',
      items: [
        { label: 'Pick the right game', time: '2 days', href: '/landing/docs/find-candidates/' },
        { label: 'Install the 6 tools', time: '30 min', href: '/landing/docs/install-tools/' },
        { label: 'Turn the template into your site', time: '30 min', href: '/landing/docs/rebrand-your-site/' },
        { label: 'Write the first 10 pages with AI', time: '1 day', href: '/landing/docs/first-article/' },
        { label: 'Put the site online (free hosting)', time: '15 min', href: '/landing/docs/put-site-online/' },
        { label: 'Register with Google (GSC + sitemap)', time: '20 min', href: '/landing/docs/get-on-google/' },
        { label: 'Buy and connect a domain', time: '30 min', href: '/landing/docs/put-site-online/' },
        { label: 'Turn on ads (AdSense)', time: 'review: days', href: '/landing/docs/enable-ads/' },
        { label: 'Weekly 30-min freshness loop', time: 'weekly', href: '/landing/docs/weekly-ops/' },
        { label: 'Customize: categories, languages, theme', time: 'as needed', href: '/landing/docs/categories-and-locales/' },
      ],
    },
    openManualLabel: 'Open this manual',
    chaptersCountLabel: 'lessons',
  },
  tutorials: {
    navLabel: 'Tutorials',
    hubTitle: 'Build Your Own Content Site — Tutorials',
    hubSubtitle:
      'Hands-on guides anchored on what you want to do: build a game codes site, run a coupon hub, put up a tutorial knowledge base, get indexed, monetize. Each one walks the whole job and ends with the exact template preset that ships it.',
    readLabel: 'Read tutorial',
    updatedLabel: 'Updated',
    backToHub: 'All tutorials',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    ctaTitle: 'Ship this with the AnvilWiki template',
    ctaSubtitle:
      'Everything in this tutorial maps to features the open-source template already ships: MDX pages validated at build time, codes pages that stay fresh on autopilot, free unlimited hosting on Cloudflare Pages.',
    ctaPrimaryLabel: 'Fork on GitHub',
    presetCta: {
      'game-wiki':
        'When the setup CLI asks for your site type, keep the default game wiki — this guide maps onto it one-to-one.',
      'coupon-hub':
        'When the setup CLI asks for your site type, pick coupon hub — the same codes engine carries your deal pages.',
      'tutorial-hub':
        'When the setup CLI asks for your site type, pick tutorial hub — a single-guides knowledge base tuned for AI citations.',
      'recipe-hub':
        'When the setup CLI asks for your site type, pick recipe hub — recipe frontmatter and Recipe JSON-LD are built in, with kitchen-tool affiliate slots ready.',
    },
    docsHint: 'Go deeper in the handbook:',
    communityTitle: 'Building this right now?',
    communityHint:
      'The maintainer runs a builder group on WeChat — deployment snags, niche picks, monetization numbers. Scan the code to add the maintainer and get pulled in.',
    nextInTopicLabel: 'Keep reading on this topic',
  },
  finalCta: {
    title: 'Ready to build your money-making site?',
    subtitle: 'Fork, pick a direction, deploy — 30 minutes, completely free.',
    primaryCta: { label: 'Fork on GitHub', href: FORK_URL },
    secondaryCta: { label: 'Open the docs center', href: '/landing/docs/' },
  },
  bridge: {
    title: 'Every tutorial step ships in the template',
    description:
      'AnvilWiki is an open-source (MIT) Astro content-site template — the keyword sourcing, site building, AI page generation, SEO, and monetization you read about in the tutorials are built in, not stitched together. Finish a tutorial, fork, and the site is yours.',
    chips: ['Lighthouse 4×100', 'Free Cloudflare deploy', '30-minute init', 'MIT open source'],
    ctaPrimaryLabel: 'Fork on GitHub',
    ctaSecondaryLabel: 'Full comparison vs Fandom & more →',
    ctaSecondaryHref: '/landing/comparison/',
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
    creditsLabel: 'Credits:',
    credits: [
      {
        name: 'yan-labs/yan-skills',
        href: 'https://github.com/yan-labs/yan-skills',
        note: 'game-opportunity methodology behind our opportunity-scoring framework (MIT)',
      },
      {
        name: 'yantoumu/adsense-site-auditor-skill',
        href: 'https://github.com/yantoumu/adsense-site-auditor-skill',
        note: 'inspiration for the AdSense pre-application audit skill',
      },
      {
        name: 'kennyzir/7deer_skills',
        href: 'https://github.com/kennyzir/7deer_skills',
        note: 'youtube-content-gen pipeline behind our video-to-guide workflow (MIT)',
      },
      {
        name: 'Shiyan (誓言)',
        href: 'https://github.com/lyglzhl',
        note: 'community reviewer — the external code review (2026-09-15) behind our fallback-SEO fix and roadmap complexity candidates',
      },
    ],
  },
};

