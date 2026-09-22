/**
 * Landing page copy — 中文 (/zh/landing). Data-only module split out of
 * landing.ts (v2.31.1) and assembled into `landingContent` by the facade.
 * Typed against LandingContent so a missing key vs the en module fails
 * typecheck (漏译在 typecheck 就拦下,不用等线上).
 */

import type { LandingContent } from './landing-types';
import {
  FORK_URL,
  PROJECT_VERSION,
  RELEASES,
  SHOWCASE_DATA,
} from './landing-shared';

export const zh: LandingContent = {
  htmlLang: 'zh',
  title: 'AnvilWiki — 开源游戏 Wiki 模板 + AI 内容工作流',
  // 同意横幅 — zh 不是 wiki locale（UI JSON 只有 en/ja），BaseLayout 的兜底是
  // 英文文案 + /zh/privacy-policy/（不存在，404）。经 LandingLayout 整组下传；
  // 隐私链接指向 zh 落地层自带的中文隐私政策页（src/pages/zh/landing/privacy.astro）。
  consent: {
    title: 'Cookie',
    text: '本站为免费运营，使用 Cookie 进行流量统计与广告展示。',
    accept: '同意',
    decline: '拒绝',
    privacyLabel: '隐私政策',
    privacyHref: '/zh/landing/privacy/',
  },
  description:
    '开源游戏 wiki 模板 + AI 原生内容工作流:选对游戏、和 AI 对话就能产页、codes 页自动保鲜。Lighthouse 4×100、Cloudflare 免费部署、广告收入 100% 归你。',
  announcement: {
    text: `AnvilWiki 模板更新日志（v${PROJECT_VERSION}）：第 23 轮 24h 风险审计——当日变更五类高置信运行风险零发现。信任面修复：demo 兑换码页正文不再把已过期代码说成可用（en+ja 全面对齐四个有效码）、首页兑换码模块展示完整有效集，并新增测试套件——保鲜批轮换了代码却不同步两个展示面时 CI 直接红。fork 用户 merge 上游、照常 pnpm install 即可。本条为模板发版通告，非站点故障；详情与完整变更见 GitHub Releases。`,
    href: RELEASES,
    dismissLabel: '关闭公告',
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
    fandomSwitch: {
      title: '为什么 Fandom 用户搬家——自定义页面模板、广告控制权与数据主权',
      subtitle:
        '「how to create a wiki template on fandom」全球每月约 1,380 次搜索,「templates fandom」约 610 次(SimilarWeb 关键词数据,2026-08)。两组搜索背后是同一批人:想让 wiki 长得不一样、赚得也不一样的创作者。下面是诚实的清单——哪些东西仍然握在 Fandom 手里:',
      items: [
        {
          title: '页面模板与布局由平台固定',
          text: '社区可以在 Fandom 主题系统内改配色、调样式,但页面骨架——皮肤、布局结构、模板组件——由平台统一下发,没有官方途径给 wiki 换上自己的页面模板,最接近的变通只有社区 CSS。',
        },
        {
          title: '广告是平台的生意,不是你的',
          text: '广告网络、版位、形式都由 Fandom 决定,广告主关系也握在平台手里;收益是否分成、分多少,由平台说了算——接入自己的 AdSense 不在选项之内。',
        },
        {
          title: 'wiki 住在 fandom.com 子域下',
          text: '社区只能挂在 *.fandom.com 子域,没有自定义域名选项,每一条外链、每一分品牌积累都记在平台域名名下;导出是有的,但搬家意味着从 dump 重建,不是一键切换。',
        },
        {
          title: '没有 AI 辅助写作的工作流',
          text: 'Fandom 围绕网页编辑器里的志愿者编辑设计——没有 git 历史,没有评审流水线,批量自动建页会撞上机器人与反垃圾政策。如果你习惯和 AI agent 协作写内容,那边没有对应路径。AnvilWiki 是相反的形状:MDX 进 git,agent 起草、你审校、CI 把关。',
        },
      ],
      note: '这些都不代表 Fandom 不是好归宿——对想要免费托管、自带曝光、零维护的粉丝社区,它依然是稳妥选择;上文的建议保持不变:大型公开社区百科,MediaWiki 或 Fandom 仍是正解。上面这些取舍真正咬人,是在站点成为你自己的项目时——单人运营、SEO 驱动、以变现为目标,这时「模板、广告、域名归谁」才开始要紧。',
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
      secondaryHref: '/zh/landing/#docs',
    },
  },
  communityHighlights: {
    title: '社群精华',
    subtitle:
      '来自「AnvilWiki 交流群」的真实讨论，AI 每天自动整理：实操干货、变现避坑、真实问答，以及群友对模板的意见。怎么选词、怎么做站、哪里有坑——这里都是过来人的一手经验。',
    navLabel: '社群精华',
    tocLabel: '本页导航',
    updatedLabel: '最后更新',
    sinceLabel: '记录自',
    disclaimer:
      '本页由每日定时管道从群聊记录自动整理（AI 归纳，仅显示群昵称，不公开原始记录）。内容为群友个人经验分享，不代表项目立场；如需删除请联系主理人。',
    sections: {
      gold: { title: '精华干货', hint: '可复用的方法、SOP、工具与关键数据' },
      pitfalls: { title: '避坑警示', hint: '群友真金白银换来的教训' },
      qa: { title: '问答精选', hint: '群友真实提问与群里给出的解答' },
      feedback: { title: '反馈与建议', hint: '大家对模板、手册和技能的意见' },
      news: { title: '动态公告', hint: '版本发布、showcase 收录与群事件' },
      daily: { title: '每日速览', hint: '一天一句话' },
    },
    openLabel: '待处理',
    resolvedLabel: '已处理',
    todayLabel: '今天',
    yesterdayLabel: '昨天',
    report: {
      title: '每日报告',
      statsMessages: '条消息',
      statsSpeakers: '人发言',
      statsPeak: '高峰',
      quotesTitle: '精华观点',
      takeawaysTitle: '干货要点',
      qaTitle: '答疑记录',
      resourcesTitle: '资源分享',
      faqTitle: '高频问题',
      topicsTitle: '选题预告',
    },
    expandLabel: '展开全部',
    cta: {
      title: '也在做游戏内容站？',
      subtitle: '点右下角二维码加群一起讨论，或 fork 模板，30 分钟上线你自己的 wiki 站。',
      primaryLabel: 'GitHub 上 Fork',
      primaryHref: FORK_URL,
      secondaryLabel: '阅读文档',
      secondaryHref: '/zh/landing/docs/',
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
    browserUrl: 'anvil.wiki/bosses/emberfang',
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
        href: '/zh/landing/docs/find-candidates/',
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
        href: '/zh/landing/docs/rebrand-your-site/',
      },
      {
        icon: 'lucide:search',
        title: 'SEO 指南',
        description: '从被收录到有排名——选词地图、单页自检、AI 引用。',
        href: '/zh/landing/docs/rank-one-keyword/',
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
        linkLabel: '课 10 · 把站跑起来',
        href: '/zh/landing/docs/run-your-site/',
      },
      {
        title: '换成你的游戏',
        description:
          '一条交互式 CLI 替换游戏信息、主题色、多语言与导航,并重置 demo 配置(含 wrangler.toml)。',
        command: 'pnpm apply-template',
        linkLabel: '课 11 · 换成你的游戏',
        href: '/zh/landing/docs/rebrand-your-site/',
      },
      {
        title: '和 AI 对话产页',
        description:
          '用 ZCode / Claude Code / Codex 打开仓库直接说——agent 技能随仓库分发,Zod schema 把住每一页的质量关。',
        command: '"帮我写一篇 Boss 攻略,要点如下:…"',
        linkLabel: '课 13 · AI 产页',
        href: '/zh/landing/docs/first-article/',
      },
      {
        title: '免费部署上线',
        description:
          '推到 GitHub、连接 Cloudflare Pages——自动识别 Astro 构建,免费无限带宽 + 全球 CDN。',
        command: 'pnpm build && git push',
        linkLabel: '课 18 · 网站上线',
        href: '/zh/landing/docs/put-site-online/',
      },
      {
        title: '保持新鲜',
        description:
          '每周审计工作流自动标记过期页面,兑换码技能守住长尾流量,上游更新随时可同步。',
        command: 'pnpm refresh-audit',
        linkLabel: '课 25 · 每周保鲜',
        href: '/zh/landing/docs/weekly-ops/',
      },
    ],
    allDocs: {
      label: '打开文档中心 —— 两本实操手册,含可复制的 AI 提示词',
      href: '/zh/landing/docs/',
    },
  },
  search: {
    label: '搜索',
    placeholder: '搜索 AnvilWiki…',
    noResults: '没有找到相关内容',
    close: '关闭',
    loadError: '搜索加载失败，请刷新页面后重试。',
  },
  handbook: {
    hubTitle: 'AnvilWiki 文档中心',
    hubSubtitle:
      '两本相互独立的实操手册,按完全零基础标准编写:学习手册带你从选游戏走到上线、收录、变现,再教你把站打磨成模板、批量铺内页放大、把排名和 AI 引用做上去;开发手册覆盖定制与工程。每一步都是 SOP + 可复制的 AI 提示词。',
    beginnerHint: {
      text: '完全零基础?从学习手册「选品找词」阶段开始',
      href: '/zh/landing/docs/find-candidates/',
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
          '面向定制者与贡献者:改动地图、加栏目与加语言、换主题与改首页、功能开关总表、CI 门禁与安全、同步上游与贡献回流、让 AI 替你运营(GSC API 接入、anvilwiki-ops 与 MCP)。',
      },
    },
    chapterLabel: '第',
    chapterSuffix: '课',
    backToHub: '全部文档',
    prevLabel: '上一课',
    nextLabel: '下一课',
    editLabel: '在 GitHub 上编辑',
    updatedLabel: '更新于',
    readLabel: '阅读本课',
    tldrLabel: '太长不看',
    onThisPageLabel: '本页目录',
    manualsLabel: '手册目录',
    roadmap: {
      title: '建一个游戏 wiki 站:全部工作一览',
      hint: '从零到赚钱一共 10 件事。点任意一项,直接跳到手把手教你的那一课。',
      items: [
        { label: '选对游戏', time: '2 天', href: '/zh/landing/docs/find-candidates/' },
        { label: '装好 6 样工具', time: '30 分钟', href: '/zh/landing/docs/install-tools/' },
        { label: '把模板变成你的站', time: '30 分钟', href: '/zh/landing/docs/rebrand-your-site/' },
        { label: '用 AI 写首日 10 页', time: '1 天', href: '/zh/landing/docs/first-article/' },
        { label: '网站上线(免费托管)', time: '15 分钟', href: '/zh/landing/docs/put-site-online/' },
        { label: '在 Google 登记(站长后台+目录)', time: '20 分钟', href: '/zh/landing/docs/get-on-google/' },
        { label: '买域名并绑定', time: '30 分钟', href: '/zh/landing/docs/put-site-online/' },
        { label: '接广告(AdSense)', time: '审核数天', href: '/zh/landing/docs/enable-ads/' },
        { label: '每周 30 分钟保鲜', time: '每周', href: '/zh/landing/docs/weekly-ops/' },
        { label: '定制:加栏目/语言/换肤', time: '按需', href: '/zh/landing/docs/categories-and-locales/' },
      ],
    },
    openManualLabel: '打开这本手册',
    chaptersCountLabel: '课',
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
    creditsLabel: '致谢:',
    credits: [
      {
        name: 'yan-labs/yan-skills',
        href: 'https://github.com/yan-labs/yan-skills',
        note: '选品判决框架的方法论来源 game-opportunity(MIT)',
      },
      {
        name: 'yantoumu/adsense-site-auditor-skill',
        href: 'https://github.com/yantoumu/adsense-site-auditor-skill',
        note: 'AdSense 申请前审计技能的灵感来源',
      },
      {
        name: 'kennyzir/7deer_skills',
        href: 'https://github.com/kennyzir/7deer_skills',
        note: '视频转攻略工作流的管线设计来源 youtube-content-gen(MIT)',
      },
      {
        name: '誓言(Shiyan)',
        href: 'https://github.com/lyglzhl',
        note: '社区群友——2026-09-15 外部代码审查报告,v2.27.0 fallback SEO 修复与 roadmap 复杂度候选项的直接来源',
      },
    ],
  },
};

