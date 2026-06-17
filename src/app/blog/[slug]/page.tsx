import { getArticleBySlug, getAllArticles, pickBook, isSeriesArticle, getSeriesDayNumber } from '@/lib/blog';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import NewsletterInline from '@/components/NewsletterInline';
import BookCTA from '@/components/BookCTA';
import CourseCTA from '@/components/CourseCTA';

/*
 * Server Component
 */
interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const articles = getAllArticles();
    return articles.map((article) => ({
        slug: article.slug,
    }));
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);

    if (!article) return {};

    return {
        title: `${article.title} | The Insight`,
        description: article.description,
    };
}

export default async function BlogPost({ params }: PageProps) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    const book = pickBook(article.tags);
    const accent = book.palette.primary;
    const seriesDay = isSeriesArticle(article) ? getSeriesDayNumber(article) : null;

    return (
        <main className="min-h-screen pt-32 pb-24 bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
            <article className="container mx-auto px-6 max-w-3xl">

                <div className="h-1.5 w-20 mb-12" style={{ backgroundColor: accent }}></div>

                {/* Back Link */}
                <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-zinc-900 transition-colors mb-12">
                    <ArrowLeft className="w-4 h-4" /> Back to Articles
                </Link>

                {seriesDay && (
                    <Link
                        href="/blog/series/titans-protocol"
                        className="flex w-fit items-center gap-2 mb-8 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:underline"
                        style={{ backgroundColor: `${accent}1A`, color: accent }}
                    >
                        <Layers className="w-3 h-3" /> Titans Protocol Series &middot; Day {seriesDay}
                    </Link>
                )}

                {/* Header */}
                <header className="mb-16 space-y-6">
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {article.tags.map((tag, i) => (
                            <span
                                key={tag}
                                className="px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                                style={i === 0 ? { backgroundColor: `${accent}1A`, color: accent } : { backgroundColor: '#f4f4f5', color: '#52525b' }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[1.1]">
                        {article.title}
                    </h1>
                    <time className="block text-zinc-400 font-medium font-mono text-sm pl-4" style={{ borderLeft: `4px solid ${accent}` }}>
                        PUBLISHED: {article.date}
                    </time>
                </header>

                {/* Content */}
                <div className="prose prose-zinc prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-zinc-900 prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:rounded-none">
                    <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>

                {/* Footer / CTA */}
                <div className="mt-20 pt-12 border-t border-zinc-200">
                    <BookCTA book={book} />
                    <CourseCTA />
                    <NewsletterInline />
                </div>

            </article>
        </main>
    );
}
