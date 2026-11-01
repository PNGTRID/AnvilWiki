/**
 * llms.txt (/llms.txt) — a Markdown "site map" for LLMs (ChatGPT, Perplexity,
 * Claude, etc.) proposed by Jeremy Howard and now a de-facto standard for
 * AI-search visibility.
 *
 * Generated at build time from the wiki Content Collection:
 *   - site intro (name + description)
 *   - every default-locale article: title, absolute URL, one-line summary
 *
 * Game-wiki queries ("how to beat X", "latest codes") increasingly land in
 * AI chatbots; listing content here costs nothing and helps AI crawlers
 * discover and cite the site.
 */
import type { APIRoute } from 'astro';
import { site, siteUrl } from '~/config/site';
import { landingLinkEnabled } from '~/config/project';
import { getCollection } from 'astro:content';
import { parseEntryId } from '~/lib/content';
import { defaultLocale } from '~/i18n/routing';
import { detailPath } from '~/lib/url';
import { newestFirst } from '~/lib/content-utils';
import { chaptersForLocale, handbookPath, parseHandbookId, sortChapters } from '~/lib/handbook';

/**
 * llms.txt entries are ONE Markdown list item per line (`- [title](url): summary`).
 * escapeLinkText keeps a title containing [ or ] from breaking the link shape
 * (backslash escaped first so the added \ can't be double-interpreted);
 * oneLine folds ALL whitespace — a summary with an embedded newline would
 * split one entry into two broken lines.
 */
function escapeLinkText(text: string): string {
  return text.replace(/[\\[\]]/g, '\\$&');
}
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export const GET: APIRoute = async () => {
  const all = await getCollection('wiki');
  const entries = all
    .filter((e) => {
      const parsed = parseEntryId(e.id);
      return parsed?.locale === defaultLocale && !e.data.noindex && !e.data.draft;
    })
    .sort(
      (a, b) => a.data.category.localeCompare(b.data.category, defaultLocale) || newestFirst(a, b),
    );

  const lines: string[] = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `Wiki for ${site.game.name} (${site.game.platform}, by ${site.game.developer}).`,
    '',
    '## Articles',
    '',
  ];

  for (const e of entries) {
    const parsed = parseEntryId(e.id);
    const slug = parsed?.slug ?? '';
    const url = `${siteUrl}${detailPath(e.data.category, slug, defaultLocale)}`;
    const summary = e.data.summary ?? e.data.description;
    lines.push(`- [${escapeLinkText(e.data.title)}](${url}): ${oneLine(summary)}`);
  }

  // Handbook (project docs center, /landing/docs) — this is AnvilWiki-project
  // content, not the site's own game content, so it only appears while the
  // project landing page exists. apply-template removes the landing routes
  // and flips landingLinkEnabled → fork sites never list AnvilWiki URLs here.
  if (landingLinkEnabled) {
    const handbookAll = await getCollection('handbook');
    const chapters = sortChapters(chaptersForLocale(handbookAll, 'en'));
    if (chapters.length > 0) {
      lines.push('', '## Handbook', '');
      for (const c of chapters) {
        const slug = parseHandbookId(c.id)?.slug ?? '';
        lines.push(
          `- [${escapeLinkText(c.data.title)}](${siteUrl}${handbookPath('en', slug)}): ${oneLine(c.data.description)}`,
        );
      }
    }

    // Comparison page — citable facts for "which wiki tool to pick" queries.
    // The three project pages below are NOT handbook chapters — this heading
    // splits them out of `## Handbook` so AI engines don't file them under
    // the docs center.
    lines.push('', '## Project pages', '');
    lines.push(
      `- [AnvilWiki vs Fandom vs Wiki.js — how to choose](${siteUrl}/landing/comparison/): The three species of wiki tooling — hosted platforms, self-hosted collaboration engines, and static publishing templates — and when each fits a game content site, plus why Fandom users switch (platform-fixed page templates, platform-run ads, no custom domain).`,
    );

    // Community highlights — daily AI-curated digest of the maintainer's
    // WeChat builder group (Chinese). Same landing-layer lifecycle as above.
    lines.push(
      `- [AnvilWiki Community Highlights](${siteUrl}/landing/community/): Daily AI-curated digest of the AnvilWiki WeChat group — know-how, monetization pitfalls, real Q&A and template feedback from game-wiki builders (in Chinese).`,
    );

    // Templates showcase — every page type the template produces, each linked
    // to a real page on the live demo. Catches "wiki page templates" queries.
    lines.push(
      `- [Game Wiki Page Templates — every page type, live](${siteUrl}/landing/templates/): One card per page type the AnvilWiki template produces (boss guide, codes page, tier list, beginner guide, item pages, docs center), each linked to a real page on the demo wiki, with the template mechanics behind each (structured codes frontmatter, gallery layout, Quick Answer summary, gameVersion badge).`,
    );

    // Flagship tutorial line — build-your-own-content-site guides, one per
    // site type the template ships. Same landing-layer lifecycle as above.
    lines.push(
      `- [Build Your Own Content Site — tutorials](${siteUrl}/landing/tutorials/): Hands-on guides anchored on what the reader wants to do — build a game redeem-codes site, run a SaaS coupon hub, put up a tutorial knowledge base, build a site with AI in a day, get indexed by Google, monetize a game wiki — each ending with the matching template preset, the community entry and a same-topic next read.`,
    );
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
