import { Article } from '@/lib/blog';

// Emits schema.org JSON-LD for a blog article as a single @graph: BlogPosting +
// BreadcrumbList, plus FAQPage when the article carries FAQ items. This is what
// earns rich results in Google and lets answer engines (ChatGPT, Perplexity,
// AI Overviews) understand and cite the page. Rendered server-side so it lands
// in the static HTML.

const SITE = 'https://thementalsport.com';
const AUTHOR = 'Giannis Notaras';

export default function ArticleSchema({ article }: { article: Article }) {
    const url = `${SITE}/blog/${article.slug}`;
    const keywords = article.keywords?.length ? article.keywords : article.tags;

    const graph: Record<string, unknown>[] = [
        {
            '@type': 'BlogPosting',
            '@id': `${url}#article`,
            headline: article.title,
            description: article.description,
            image: `${SITE}/og-image.png`,
            datePublished: article.date,
            dateModified: article.date,
            author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/about` },
            publisher: {
                '@type': 'Organization',
                name: 'The Mental Sport',
                url: SITE,
                logo: { '@type': 'ImageObject', url: `${SITE}/og-image.png` },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            articleSection: article.tags[0] ?? 'Mental Performance',
            keywords: keywords.join(', '),
        },
        {
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
                { '@type': 'ListItem', position: 2, name: 'The Insight', item: `${SITE}/blog` },
                { '@type': 'ListItem', position: 3, name: article.title, item: url },
            ],
        },
    ];

    if (article.faq && article.faq.length > 0) {
        graph.push({
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: article.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
        });
    }

    const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

    // Escape "<" so a stray "</script>" in any field can't break out of the tag.
    const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

    return (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
    );
}
