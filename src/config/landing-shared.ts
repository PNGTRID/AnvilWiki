/**
 * Landing page SHARED data — the version constant, the GitHub URL constants,
 * and the locale-independent COMMUNITY_SITES list. Consumed by the en/zh copy
 * modules (landing-en.ts / landing-zh.ts) and re-exported by the landing.ts
 * facade; split out of landing.ts (v2.31.1) to keep every file small.
 *
 * 👉 Like landing.ts, this file is NOT part of the "apply template" config
 *    layer — fork users don't need to touch it. It describes the AnvilWiki
 *    open-source project. apply-template deletes it together with the facade.
 */

/** Keep in sync with package.json "version" (used by the announcement bar).
 *  Lives on this leaf module (not the landing.ts facade) so the en/zh copy
 *  modules can interpolate it without an import cycle through the facade. */
export const PROJECT_VERSION = '2.32.0';

export const RELEASES = 'https://github.com/PNGTRID/AnvilWiki/releases';
export const FORK_URL = 'https://github.com/PNGTRID/AnvilWiki/fork';
export const SHOWCASE_DATA =
  'https://github.com/PNGTRID/AnvilWiki/blob/main/src/config/landing-shared.ts';

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
  {
    name: 'Resonance Wiki',
    url: 'https://resonanceplaguetale.wiki/',
    game: 'Resonance: A Plague Tale Legacy',
    image: '/images/showcase/sites/resonance.jpg',
    imageAltEn: 'Screenshot of the Resonance Wiki homepage',
    imageAltZh: 'Resonance Wiki 首页截图',
    descriptionEn:
      'A fan-made wiki for Resonance: A Plague Tale Legacy — full chapter walkthrough, all collectible locations, trophy roadmap, and puzzle solutions.',
    descriptionZh: '《Resonance: A Plague Tale Legacy》粉丝 wiki——全章节流程攻略、全部收集品位置、奖杯路线图、谜题解法与 Sophia 技能推荐。',
  },
  {
    name: 'Warhounds Wiki',
    url: 'https://warhounds.org/',
    game: 'Warhounds',
    image: '/images/showcase/sites/warhounds.jpg',
    imageAltEn: 'Screenshot of the Warhounds Wiki homepage',
    imageAltZh: 'Warhounds Wiki 首页截图',
    descriptionEn:
      'An independent tactical-strategy wiki for Warhounds — source-checked guides for classes, combat, base management, equipment, missions, and current patch status.',
    descriptionZh:
      'Warhounds 的独立战术策略 wiki——基于来源核验的职业、战斗、基地管理、装备、任务与当前版本攻略。',
  },
  {
    name: 'Sandustry.top',
    url: 'https://sandustry.top/',
    game: 'Sandustry',
    image: '/images/showcase/sites/sandustry.jpg',
    imageAltEn: 'Screenshot of the Sandustry.top homepage',
    imageAltZh: 'Sandustry.top 首页截图',
    descriptionEn:
      'An independent Sandustry guide site for factory automation — recipes, machines, production chains, world seeds, troubleshooting, and Early Access status.',
    descriptionZh:
      'Sandustry 的独立工厂自动化攻略站——配方、机器、生产链、世界种子、故障排查与抢先体验版本信息。',
  },
];
