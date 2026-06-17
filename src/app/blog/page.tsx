import React from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { getStandaloneArticles, getSeriesArticles, pickBook, Article } from '@/lib/blog';
import NewsletterInline from '@/components/NewsletterInline';

export const metadata = {
    title: 'The Insight',
    description: 'Articles on mental performance, fencing psychology, and high-performance neuroscience.',
};

export const revalidate = 0; // Disable cache to ensure Latest Articles always show

function ArticleCard({ article }: { article: Article }) {
    const book = pickBook(article.tags);
    const accent = book.palette.primary;

    return (
        <Link
            href={`/blog/${article.slug}`}
            style={{ '--accent': accent } as React.CSSProperties}
            className="group flex flex-col bg-white border border-zinc-200 hover:border-[var(--accent)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
            <div className="h-1.5 w-full" style={{ backgroundColor: accent }}></div>
            <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                    <span>{article.date.split('T')[0]}</span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                    <span style={{ color: accent }}>{article.tags[0]}</span>
                </div>
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight leading-snug group-hover:underline decoration-2 underline-offset-4">
                    {article.title}
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed line-clamp-3">
                    {article.description}
                </p>
                <div
                    className="pt-2 mt-auto text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all"
                    style={{ color: accent }}
                >
                    Read More <ArrowRight className="w-3 h-3" />
                </div>
            </div>
        </Link>
    );
}

export default function BlogIndex() {
    const standalone = getStandaloneArticles();
    const series = getSeriesArticles();
    const totalCount = standalone.length + series.length;

    const [spotlight, ...rest] = standalone;
    const spotlightBook = spotlight ? pickBook(spotlight.tags) : null;

    return (
        <main className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">

            {/* HERO */}
            <section className="bg-zinc-950 text-white py-24 text-center">
                <div className="container mx-auto px-6 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                        {totalCount} Articles &middot; Mental Performance Insights
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">
                        The Insight
                    </h1>
                    <p className="text-zinc-400 text-lg font-medium max-w-xl mx-auto">
                        Deep dives into the psychology of winning. No fluff. Just actionable strategies for the obsessively dedicated.
                    </p>
                </div>
            </section>

            {/* SPOTLIGHT — latest article */}
            {spotlight && spotlightBook && (
                <section className="py-24 border-b border-zinc-200">
                    <div className="container mx-auto px-6 max-w-4xl">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-10 text-center">Latest</p>
                        <Link
                            href={`/blog/${spotlight.slug}`}
                            style={{ '--accent': spotlightBook.palette.primary } as React.CSSProperties}
                            className="group block bg-white border border-zinc-200 hover:border-[var(--accent)] transition-all duration-300"
                        >
                            <div className="h-2 w-full" style={{ backgroundColor: spotlightBook.palette.primary }}></div>
                            <div className="p-10 md:p-14 space-y-6">
                                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    <span>{spotlight.date.split('T')[0]}</span>
                                    <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                    <span style={{ color: spotlightBook.palette.primary }}>{spotlight.tags[0]}</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-tight group-hover:underline decoration-2 underline-offset-4">
                                    {spotlight.title}
                                </h2>
                                <p className="text-zinc-600 text-lg leading-relaxed max-w-2xl">
                                    {spotlight.description}
                                </p>
                                <div
                                    className="pt-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all"
                                    style={{ color: spotlightBook.palette.primary }}
                                >
                                    Read Article <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>
            )}

            {/* GRID — remaining standalone articles */}
            <section className="py-24 container mx-auto px-6 max-w-6xl">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rest.map((article) => (
                        <ArticleCard key={article.slug} article={article} />
                    ))}
                </div>
            </section>

            {/* SERIES BANNER */}
            {series.length > 0 && (
                <section className="pb-24 container mx-auto px-6 max-w-6xl">
                    <Link
                        href="/blog/series/titans-protocol"
                        className="group block bg-zinc-950 text-white p-10 md:p-14 relative overflow-hidden hover:bg-zinc-900 transition-colors"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,_rgba(220,38,38,0.15),_transparent_50%)] pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                            <div className="space-y-4 max-w-2xl">
                                <div className="inline-flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-xs">
                                    <Layers className="w-4 h-4" /> {series.length}-Part Series
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                                    The Titans Protocol
                                </h3>
                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    A day-by-day mental performance system covering pressure, sleep, nutrition, identity, and competition. Start from Day 1 or jump into the archive.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm group-hover:bg-zinc-200 transition-colors whitespace-nowrap">
                                View The Series <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                </section>
            )}

            <section className="pb-24 pt-8 container mx-auto px-6 max-w-3xl">
                <NewsletterInline />
            </section>
        </main>
    );
}
