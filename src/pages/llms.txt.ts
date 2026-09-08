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
import { chaptersForLocale, handbookPath, parseHandbookId, sortChapters } from '~/lib/handbook';

export const GET: APIRoute = async () => {
  const all = await getCollection('wiki');
  const entries = all
    .filter((e) => {
      const parsed = parseEntryId(e.id);
      return parsed?.locale === defaultLocale && !e.data.noindex && !e.data.draft;
    })
    .sort((a, b) => a.data.category.localeCompare(b.data.category));

  const lines: string[] = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `Wiki for ${site.game.name} (${site.game.platform}, by ${site.game.developer}). Articles cover boss guides, tier lists, codes, items, and beginner tips.`,
    '',
    '## Articles',
    '',
  ];

  for (const e of entries) {
    const parsed = parseEntryId(e.id);
    const slug = parsed?.slug ?? '';
    const url = `${siteUrl}${detailPath(e.data.category, slug, defaultLocale)}`;
    const summary = e.data.summary ?? e.data.description;
    lines.push(`- [${e.data.title}](${url}): ${summary}`);
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
          `- [${c.data.title}](${siteUrl}${handbookPath('en', slug)}): ${c.data.description}`,
        );
      }
    }

    // Comparison page — citable facts for "which wiki tool to pick" queries.
    lines.push(
      '',
      `- [AnvilWiki vs Fandom vs Wiki.js — how to choose](${siteUrl}/landing/comparison/): The three species of wiki tooling — hosted platforms, self-hosted collaboration engines, and static publishing templates — and when each fits a game content site.`,
    );

    // Community highlights — daily AI-curated digest of the maintainer's
    // WeChat builder group (Chinese). Same landing-layer lifecycle as above.
    lines.push(
      `- [AnvilWiki Community Highlights](${siteUrl}/landing/community/): Daily AI-curated digest of the AnvilWiki WeChat group — know-how, monetization pitfalls, real Q&A and template feedback from game-wiki builders (in Chinese).`,
    );
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
