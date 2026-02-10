import Link from 'next/link';
import { getAllArticles } from '@/lib/blog';
import { ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'The Insight | Giannis Notaras',
    description: 'Articles on mental performance, fencing psychology, and high-performance neuroscience.',
};

export const revalidate = 0; // Disable cache to ensure Latest Articles always show

export default function BlogIndex() {
    const articles = getAllArticles();

    return (
        <main className="min-h-screen pt-32 pb-24 bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
            <div className="container mx-auto px-6 max-w-4xl">

                {/* Header */}
                <div className="mb-20 space-y-6">
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                        The Insight
                    </h1>
                    <div className="w-24 h-2 bg-zinc-900"></div>
                    <p className="text-xl text-zinc-600 font-medium max-w-2xl">
                        Deep dives into the psychology of winning. No fluff. Just actionable strategies for the obsessively dedicated.
                    </p>
                </div>

                {/* Articles List */}
                <div className="space-y-12">
                    {articles.map((article) => (
                        <article key={article.slug} className="group border-b border-zinc-200 pb-12">
                            <Link href={`/blog/${article.slug}`} className="block space-y-4">
                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    <span>{article.date}</span>
                                    <span>•</span>
                                    <span className="text-zinc-900">{article.tags[0]}</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight group-hover:underline decoration-4 underline-offset-4 decoration-zinc-900">
                                    {article.title}
                                </h2>
                                <p className="text-lg text-zinc-600 leading-relaxed font-medium">
                                    {article.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest pt-2 group-hover:gap-4 transition-all">
                                    Read Article <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>

            </div>
        </main>
    );
}
