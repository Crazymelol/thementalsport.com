import React from 'react';
import { books } from '@/data/books';
import { getAllArticles } from '@/lib/blog';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import NewsletterWrapper from '@/components/NewsletterWrapper';
import LeadMagnet from '@/components/LeadMagnet';

export const revalidate = 0; // Ensure homepage always shows latest articles

export default function AuthorHome() {
    // Fetch latest 3 articles
    const latestArticles = getAllArticles().slice(0, 3);

    return (
        <main className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">

            {/* 1. AUTHOR HERO */}
            <section className="bg-zinc-950 text-white py-24 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,_rgba(220,38,38,0.15),_transparent_50%)] pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/40 to-zinc-950 pointer-events-none"></div>
                <div className="container mx-auto px-6 max-w-5xl text-center space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
                        <Star className="w-3 h-3 fill-current" /> 8 Books · Mental Performance Masterclass
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black mb-6 uppercase tracking-tighter leading-none">
                        Win The<br/><span className="text-red-500">Inner Game</span>
                    </h1>
                    <p className="text-xl lg:text-2xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        The mental performance system used by elite athletes — built by Giannis Notaras.
                    </p>
                    <div className="pt-8 mb-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <NewsletterWrapper className="px-10 py-4 bg-white text-zinc-950 font-black rounded-none hover:bg-zinc-200 transition-colors uppercase tracking-widest text-sm">
                            Get The Free Protocol
                        </NewsletterWrapper>
                        <Link href="/books" className="px-10 py-4 border border-zinc-700 text-white font-black rounded-none hover:border-white transition-colors uppercase tracking-widest text-sm flex items-center gap-2">
                            Browse Books <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <p className="text-zinc-600 text-xs uppercase tracking-widest">Free 7-day system • No credit card</p>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-stone-400 animate-bounce">
                    <ArrowRight className="w-6 h-6 rotate-90" />
                </div>
            </section>

            {/* TRUST STRIP */}
            <section className="py-12 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mb-8">Trusted methodologies used by athletes in</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-80">
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">NBA</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">NFL</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">MLB</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">NCAA</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">OLYMPICS</span>
                    </div>
                </div>
            </section>

            {/* NEW: LATEST INSIGHTS (Articles) */}
            <section className="py-24 container mx-auto px-6 border-b border-zinc-200">
                <div className="flex items-center justify-between mb-16">
                    <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">Latest Insights</h2>
                    <div className="hidden md:flex h-px bg-zinc-200 flex-1 ml-12 mr-8"></div>
                    <Link href="/blog" className="text-sm font-bold uppercase tracking-widest hover:text-zinc-600 transition-colors flex items-center gap-2">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {latestArticles.map((article) => (
                        <Link href={`/blog/${article.slug}`} key={article.slug} className="group block space-y-4">
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                                <span>{article.date.split('T')[0]}</span>
                                <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                <span className="text-zinc-900">{article.tags[0]}</span>
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 leading-tight group-hover:underline decoration-2 underline-offset-4 decoration-zinc-900">
                                {article.title}
                            </h3>
                            <p className="text-zinc-600 leading-relaxed text-sm line-clamp-3">
                                {article.description}
                            </p>
                            <div className="pt-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                Read More <ArrowRight className="w-3 h-3" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 2. BOOK CATALOG */}
            <section id="books" className="py-24 container mx-auto px-6 bg-white">
                <div className="flex items-center justify-between mb-16">
                    <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">Latest Releases</h2>
                    <div className="h-px bg-zinc-200 flex-1 ml-12"></div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {books.map((book) => (
                        <Link href={`/book/${book.id}`} key={book.id} className="group block">
                            <div className="bg-white rounded-none border border-zinc-200 hover:border-zinc-900 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                                <div style={{ backgroundColor: book.palette.primary }} className="h-1.5 w-full"></div>
                                {/* Card Image Area */}
                                <div className="aspect-[3/4] bg-zinc-100 relative flex items-center justify-center p-8 group-hover:bg-zinc-50 transition-colors overflow-hidden border-b border-zinc-100">
                                    <Image
                                        src={book.coverImage}
                                        alt={`${book.title} cover`}
                                        width={300}
                                        height={400}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                                        New Release
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-900 group-hover:underline decoration-2 underline-offset-4">
                                        {book.title}
                                    </h3>
                                    <p className="text-zinc-600 text-sm line-clamp-3 leading-relaxed">
                                        {book.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                        <span className="text-lg font-black text-zinc-900">{book.price}</span>
                                        <span className="flex items-center gap-2 text-zinc-900 font-bold text-sm uppercase tracking-widest">
                                            View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* LEAD MAGNET */}
            <LeadMagnet />

            {/* 3. ABOUT AUTHOR */}
            <section id="about" className="py-24 bg-zinc-50 border-t border-zinc-200">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
                        {/* Image Side - Featured Work */}
                        <div className="aspect-[3/4] bg-zinc-900 rounded-none relative overflow-hidden group shadow-2xl flex items-center justify-center p-12">
                            <Image
                                src="/covers/final_neon_cover.jpg"
                                alt="The Competition Protocol — book by Giannis Notaras"
                                width={400}
                                height={533}
                                className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute bottom-6 left-6 right-6 text-center">
                                <span className="inline-block px-4 py-2 bg-white text-zinc-950 text-xs font-black uppercase tracking-[0.2em]">
                                    Author Of 8 Books
                                </span>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="space-y-8">
                            <h2 className="text-5xl md:text-6xl font-black text-zinc-900 leading-none uppercase tracking-tighter">
                                More than <br /> just a coach.
                            </h2>
                            <div className="w-24 h-2 bg-red-600"></div>
                            <p className="text-xl text-zinc-700 leading-relaxed font-medium border-l-4 border-red-600 pl-6">
                                &quot;My mission isn&apos;t just to help you win a game. It&apos;s to help you dominate the inner battles that define your life.&quot;
                            </p>
                            <p className="text-zinc-600 leading-relaxed text-lg">
                                Giannis Notaras is a dedicated performance expert helping athletes, executives, and students overcome the mental hurdles that stand between them and their potential.
                            </p>

                            <div className="pt-6 flex gap-8">
                                <a href="https://www.linkedin.com/in/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-950 transition-colors uppercase text-sm font-black tracking-widest">LinkedIn</a>
                                <a href="https://www.instagram.com/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-950 transition-colors uppercase text-sm font-black tracking-widest">Instagram</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-zinc-950 text-zinc-500 py-16 text-center text-sm border-t border-zinc-900">
                <div className="mb-6 flex flex-wrap justify-center gap-6 font-bold uppercase tracking-widest text-xs">
                    <Link href="/books" className="hover:text-white transition-colors">Books</Link>
                    <Link href="/course" className="hover:text-white transition-colors">Course</Link>
                    <Link href="/blog" className="hover:text-white transition-colors">Articles</Link>
                    <NewsletterWrapper className="hover:text-white transition-colors">Newsletter</NewsletterWrapper>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
                </div>
                &copy; 2026 Giannis Notaras. Build The Mindset.
            </footer>

        </main>
    );
}
