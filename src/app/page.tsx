'use client';

import React, { useState } from 'react';
import { books } from '@/data/books';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import NewsletterModal from '@/components/NewsletterModal';

export default function AuthorHome() {
    const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

    return (
        <main className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">

            {/* Newsletter Modal */}
            <NewsletterModal
                isOpen={isNewsletterOpen}
                onClose={() => setIsNewsletterOpen(false)}
            />

            {/* 1. AUTHOR HERO */}
            <section className="bg-zinc-950 text-white py-24 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/40 to-zinc-950 pointer-events-none"></div>
                <div className="container mx-auto px-6 max-w-5xl text-center space-y-8 relative z-10">
                    <h1 className="text-6xl lg:text-8xl font-black mb-6 uppercase tracking-tighter leading-none">
                        Giannis Notaras
                    </h1>
                    <p className="text-xl lg:text-2xl text-zinc-400 font-medium max-w-2xl mx-auto uppercase tracking-widest">
                        Performance Expert. Author. <span className="text-white block mt-2 font-bold">Win the inner game.</span>
                    </p>
                    <div className="pt-8 mb-12">
                        <button
                            onClick={() => setIsNewsletterOpen(true)}
                            className="px-10 py-4 bg-white text-zinc-950 font-black rounded-none hover:bg-zinc-200 transition-colors uppercase tracking-widest text-sm border-2 border-transparent">
                            Join The Newsletter
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-stone-400 animate-bounce">
                    <ArrowRight className="w-6 h-6 rotate-90" />
                </div>
            </section>

            {/* TRUST STRIP (New) */}
            <section className="py-12 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mb-8">Trusted methodologies used by athletes in</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-80">
                        {/* Text Placeholders - Bold & Sharp */}
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">NBA</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">NFL</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">MLB</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">NCAA</span>
                        <span className="text-4xl font-black text-zinc-900 tracking-tighter">OLYMPICS</span>
                    </div>
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
                            <div className="bg-white rounded-none border border-zinc-200 hover:border-zinc-900 transition-all duration-300 group-hover:shadow-xl">
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
                                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm pt-4 uppercase tracking-widest">
                                        View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 3. ABOUT AUTHOR (Enhanced) */}
            <section id="about" className="py-24 bg-zinc-50 border-t border-zinc-200">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
                        {/* Image Side - Placeholder */}
                        <div className="aspect-[3/4] bg-zinc-200 rounded-none relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-zinc-300 flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest text-xl group-hover:scale-105 transition-transform duration-700">
                                Author Portrait
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="space-y-8">
                            <h2 className="text-5xl md:text-6xl font-black text-zinc-900 leading-none uppercase tracking-tighter">
                                More than <br /> just a coach.
                            </h2>
                            <div className="w-24 h-2 bg-zinc-900"></div>
                            <p className="text-xl text-zinc-700 leading-relaxed font-medium">
                                &quot;My mission isn&apos;t just to help you win a game. It&apos;s to help you dominate the inner battles that define your life.&quot;
                            </p>
                            <p className="text-zinc-600 leading-relaxed text-lg">
                                Giannis Notaras is a dedicated performance expert helping athletes, executives, and students overcome the mental hurdles that stand between them and their potential.
                            </p>

                            <div className="pt-6 flex gap-8">
                                <a href="#" className="text-zinc-400 hover:text-zinc-950 transition-colors uppercase text-sm font-black tracking-widest">Twitter / X</a>
                                <a href="https://www.linkedin.com/in/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-950 transition-colors uppercase text-sm font-black tracking-widest">LinkedIn</a>
                                <a href="https://www.instagram.com/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-950 transition-colors uppercase text-sm font-black tracking-widest">Instagram</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-zinc-950 text-zinc-500 py-16 text-center text-sm border-t border-zinc-900">
                <div className="mb-6 flex justify-center gap-6 font-bold uppercase tracking-widest text-xs">
                    <button onClick={() => setIsNewsletterOpen(true)} className="hover:text-white transition-colors">Newsletter</button>
                    <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
                </div>
                &copy; 2026 Giannis Notaras. Build The Mindset.
            </footer>

        </main>
    );
}
