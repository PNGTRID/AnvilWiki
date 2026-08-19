/**
 * Adsterra ad unit configuration — single source of truth for ad keys.
 *
 * Keys come from Adsterra dashboard (Ad Units → code → 'key' value).
 * An empty key disables that slot: the component renders nothing.
 * The actual ad script lives in public/ads/banner.html (iframe-isolated),
 * which receives the key via query params — so no key is duplicated here.
 */

export interface AdsConfig {
  /** 320×50 mobile sticky banner (SOP: primary revenue slot). */
  sticky320x50: string;
  /** 300×250 medium rectangle (end-of-article, all devices). */
  rect300x250: string;
}

export const ads: AdsConfig = {
  sticky320x50: 'bd59d32645344591d1066e763b9b2b2b',
  rect300x250: '79c3d7223d6274d63a4bb89273e96760',
};
