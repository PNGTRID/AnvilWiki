/**
 * Project-level flags — describe the AnvilWiki open-source project itself,
 * NOT the demo game. This file survives `apply-template` (unlike the landing
 * page files, which the CLI removes).
 */

/**
 * Whether the project landing page (/landing, /zh/landing) exists.
 * When true, the demo site header shows a small hammer icon linking to it,
 * so demo visitors can discover the template behind the demo.
 *
 * `apply-template` flips this to false when it removes the landing page —
 * the header link disappears together with the pages.
 */
export const landingLinkEnabled = true;

/**
 * Demo-only extra entry in the wiki language switcher: the marketing site has
 * a Chinese edition at /zh/landing/, but zh is NOT a wiki UI locale (routing
 * stays en+ja for content), so Chinese visitors landing on the wiki had zero
 * Chinese entry point (community feedback 2026-09-05 — two members hit it).
 * Gated by `landingLinkEnabled`: apply-template removes the landing layer and
 * flips the flag, so forks never render this.
 */
export const zhLandingLink = { label: '中文 · 官网', href: '/zh/landing/' } as const;
