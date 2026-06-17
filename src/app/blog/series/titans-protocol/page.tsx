import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getSeriesArticles, getSeriesDayNumber } from '@/lib/blog';

export const metadata = {
    title: 'The Titans Protocol Series | The Insight',
    description: 'A day-by-day mental performance system for competitive athletes — pressure, sleep, nutrition, identity, and competition.',
};

export const revalidate = 0;

export default function TitansProtocolSeries() {
    const articles = getSeriesArticles();

    return (
        <main className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">

            {/* HERO */}
            <section className="bg-zinc-950 text-white py-20 text-center">
                <div className="container mx-auto px-6 max-w-3xl space-y-4">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to All Articles
                    </Link>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">{articles.length}-Part Series</p>
                    <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">
                        The Titans Protocol
                    </h1>
                    <p className="text-zinc-400 text-lg font-medium max-w-xl mx-auto">
                        A day-by-day mental performance system, built one habit at a time. Start at Day 1, or jump to whatever you&apos;re working on today.
                    </p>
                </div>
            </section>

            {/* DAY-BY-DAY LIST */}
            <section className="py-20 container mx-auto px-6 max-w-3xl">
                <div className="divide-y divide-zinc-200 border-t border-b border-zinc-200">
                    {articles.map((article) => {
                        const day = getSeriesDayNumber(article) ?? 0;
                        return (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group flex items-center gap-6 md:gap-10 py-6 px-2 -mx-2 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="text-3xl md:text-4xl font-black text-zinc-200 group-hover:text-red-600 transition-colors w-14 md:w-20 shrink-0 tabular-nums">
                                    {String(day).padStart(2, '0')}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base md:text-lg font-black text-zinc-900 uppercase tracking-tight leading-snug line-clamp-2 group-hover:underline decoration-2 underline-offset-4">
                                        {article.title}
                                    </h2>
                                    <p className="hidden sm:block text-zinc-500 text-sm line-clamp-1 mt-1">{article.description}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
