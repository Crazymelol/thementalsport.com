import { sports } from '@/data/sports';
import { books } from '@/data/books';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import Image from 'next/image';

interface PageProps {
    params: Promise<{ sport: string }>;
}

export async function generateStaticParams() {
    return sports.map(s => ({ sport: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { sport } = await params;
    const data = sports.find(s => s.slug === sport);
    if (!data) return {};
    return {
        title: data.metaTitle,
        description: data.metaDescription,
        keywords: data.tags,
        openGraph: { title: data.metaTitle, description: data.metaDescription, type: 'website' },
    };
}

export default async function SportPage({ params }: PageProps) {
    const { sport } = await params;
    const data = sports.find(s => s.slug === sport);
    if (!data) notFound();

    const book = books.find(b => b.id === data.bookId) ?? books[0];

    return (
        <main className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">

            {/* HERO */}
            <section className="bg-zinc-950 text-white pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <Link href="/mental-performance" className="inline-flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors mb-10">
                        <ArrowLeft className="w-3 h-3" /> Mental Performance Hub
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                        {data.headline}
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10">
                        {data.subheadline}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {data.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* INTRO */}
            <section className="py-16 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-4xl">
                    <p className="text-xl text-zinc-700 leading-relaxed">{data.description}</p>
                </div>
            </section>

            {/* CORE CHALLENGE */}
            <section className="py-20 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="flex items-start gap-6">
                        <div className="w-1 flex-shrink-0 bg-zinc-900 self-stretch rounded-full"></div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">The Core Mental Challenge</p>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">{data.uniqueChallenge}</h2>
                            <p className="text-lg text-zinc-700 leading-relaxed">{data.challengeDetail}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* TECHNIQUES */}
            <section className="py-20 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
                        4 Techniques That Work
                    </h2>
                    <p className="text-zinc-500 mb-14 text-lg">Specific, actionable tools — not generic advice.</p>
                    <div className="space-y-12">
                        {data.techniques.map((t, i) => (
                            <div key={i} className="grid md:grid-cols-[80px_1fr] gap-6 items-start">
                                <div className="text-6xl font-black text-zinc-100 leading-none">0{i + 1}</div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight mb-3">{t.title}</h3>
                                    <p className="text-zinc-600 leading-relaxed">{t.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ATHLETES */}
            <section className="py-20 bg-zinc-950 text-white border-b border-zinc-800">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-14">
                        What Elite {data.name} Athletes Know
                    </h2>
                    <div className="grid md:grid-cols-{data.athletes.length === 2 ? '2' : '1'} gap-8">
                        {data.athletes.map((a, i) => (
                            <div key={i} className="border border-zinc-800 p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-zinc-700 flex items-center justify-center font-black text-sm uppercase">
                                        {a.name.charAt(0)}
                                    </div>
                                    <div className="font-black uppercase tracking-wider text-sm">{a.name}</div>
                                </div>
                                <p className="text-zinc-400 leading-relaxed">{a.lesson}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BOOK CTA */}
            <section className="py-20 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="bg-zinc-900 text-white overflow-hidden">
                        <div className="grid md:grid-cols-[1fr_240px] items-center gap-8 p-10 md:p-14">
                            <div className="space-y-5">
                                <div className="inline-flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-xs">
                                    <Star className="w-3 h-3 fill-current" /> Recommended for {data.name} Athletes
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                                    Take It Further
                                </h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    The techniques above are just the beginning. <strong className="text-white">{book.title}</strong> gives you the complete system — step by step — so you perform your best when it matters most.
                                </p>
                                <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                                    {book.gumroadUrl && (
                                        <a href={book.gumroadUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors">
                                            Buy Now — {book.price} <ArrowRight className="w-4 h-4" />
                                        </a>
                                    )}
                                    <Link href={`/book/${book.id}`}
                                        className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-white font-black uppercase tracking-widest text-sm hover:border-white transition-colors">
                                        Learn More
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <div className="aspect-[3/4] relative shadow-2xl">
                                    <Image src={book.coverImage} alt={book.title} fill className="object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* COURSE CTA */}
            <section className="py-16 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Ready for the complete system?</p>
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Mental Performance Masterclass</h3>
                    <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
                        8 modules. 36 video lessons. Everything you need to perform at your peak — built specifically for competitive athletes.
                    </p>
                    <Link href="/course" className="inline-flex items-center gap-3 px-10 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm hover:bg-black transition-colors">
                        Explore The Course <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* RELATED ARTICLES */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Related Articles</h3>
                        <Link href="/blog" className="text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                            All Articles <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { href: '/blog/titans-protocol-day-01-biology-of-choking', title: 'The Biology of Choking', desc: 'Why your body betrays you under pressure — and how to rewire the response.' },
                            { href: '/blog/titans-protocol-day-06-power-of-rituals', title: 'The Power of Pre-Game Rituals', desc: 'How elite athletes use rituals to trigger peak state on demand.' },
                            { href: '/blog/titans-protocol-day-05-breath-control', title: 'Breath Control Under Pressure', desc: 'The breathing technique that resets your nervous system in 60 seconds.' },
                        ].map((a, i) => (
                            <Link key={i} href={a.href} className="group border border-zinc-200 hover:border-zinc-900 p-6 transition-colors">
                                <h4 className="font-black uppercase tracking-tight mb-2 group-hover:underline">{a.title}</h4>
                                <p className="text-zinc-500 text-sm">{a.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    );
}
