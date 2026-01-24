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
        <main className="min-h-screen bg-[#FAFAF9] selection:bg-amber-100 selection:text-amber-900">

            {/* Newsletter Modal */}
            <NewsletterModal
                isOpen={isNewsletterOpen}
                onClose={() => setIsNewsletterOpen(false)}
            />

            {/* 1. AUTHOR HERO */}
            <section className="bg-stone-900 text-stone-100 py-24 lg:py-32">
                <div className="container mx-auto px-6 max-w-5xl text-center space-y-8">
                    <h1 className="text-5xl lg:text-7xl font-bold font-serif italic mb-6">
                        Giannis Notaras
                    </h1>
                    <p className="text-xl lg:text-2xl text-stone-300 font-light max-w-2xl mx-auto">
                        Performance Expert. Author. Helping you win the inner game.
                    </p>
                    <div className="pt-8">
                        <button
                            onClick={() => setIsNewsletterOpen(true)}
                            className="px-8 py-4 bg-white text-stone-900 font-bold rounded-full hover:bg-amber-50 transition-colors uppercase tracking-widest text-sm">
                            Join The Newsletter
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. BOOK CATALOG */}
            <section className="py-24 container mx-auto px-6">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-bold text-stone-900 font-serif">Latest Releases</h2>
                    <div className="h-px bg-stone-200 flex-1 ml-8"></div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {books.map((book) => (
                        <Link href={`/book/${book.id}`} key={book.id} className="group block">
                            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-stone-100">
                                {/* Card Image Area */}
                                <div className="aspect-[3/4] bg-stone-200 relative flex items-center justify-center p-8 group-hover:bg-amber-50 transition-colors overflow-hidden">
                                    <Image
                                        src={book.coverImage}
                                        alt={`${book.title} cover`}
                                        width={300}
                                        height={400}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                <div className="p-8 space-y-4">
                                    <div className="text-amber-600 text-xs font-bold uppercase tracking-widest">
                                        New Release
                                    </div>
                                    <h3 className="text-2xl font-bold font-serif text-stone-900 group-hover:text-amber-700 transition-colors">
                                        {book.title}
                                    </h3>
                                    <p className="text-stone-600 text-sm line-clamp-3">
                                        {book.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-stone-900 font-bold text-sm pt-4">
                                        View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 3. ABOUT AUTHOR (SHORT) */}
            <section className="py-24 bg-white border-t border-stone-100">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-stone-900 font-serif mb-8">About Giannis</h2>
                    <p className="text-lg text-stone-600 leading-relaxed mb-8">
                        Dedicated to helping athletes, executives, and students overcome the mental hurdles that stand between them and their potential.
                    </p>
                    <div className="flex justify-center gap-4">
                        <a href="#" className="text-stone-400 hover:text-stone-900 transition-colors">Twitter</a>
                        <a href="#" className="text-stone-400 hover:text-stone-900 transition-colors">LinkedIn</a>
                        <a href="#" className="text-stone-400 hover:text-stone-900 transition-colors">Instagram</a>
                    </div>
                </div>
            </section>

            <footer className="bg-stone-900 text-stone-500 py-12 text-center text-sm">
                &copy; 2026 Giannis Notaras. All rights reserved.
            </footer>

        </main>
    );
}
