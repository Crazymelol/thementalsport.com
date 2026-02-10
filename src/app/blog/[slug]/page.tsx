import { getArticleBySlug, getAllArticles } from '@/lib/blog';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NewsletterInline from '@/components/NewsletterInline';
import BookCTA from '@/components/BookCTA';
import { books } from '@/data/books';

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

    return (
        <main className="min-h-screen pt-32 pb-24 bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
            <article className="container mx-auto px-6 max-w-3xl">

                {/* Back Link */}
                <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-zinc-900 transition-colors mb-12">
                    <ArrowLeft className="w-4 h-4" /> Back to Articles
                </Link>

                {/* Header */}
                <header className="mb-16 space-y-6">
                    <div className="flex gap-2 mb-4">
                        {article.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[1.1]">
                        {article.title}
                    </h1>
                    <time className="block text-zinc-400 font-medium font-mono text-sm border-l-4 border-zinc-200 pl-4">
                        PUBLISHED: {article.date}
                    </time>
                </header>

                {/* Content */}
                <div className="prose prose-zinc prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-zinc-900 prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:rounded-none">
                    <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>

                {/* Footer / CTA */}
                <div className="mt-20 pt-12 border-t border-zinc-200">
                    <BookCTA book={books.find(b => b.id === 'the-competition-protocol') || books[0]} />
                    <NewsletterInline />
                </div>

            </article>
        </main>
    );
}
