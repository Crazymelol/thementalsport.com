import React from 'react';
import { books } from '@/data/books';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Books | Giannis Notaras',
    description: 'Mental performance books for athletes, executives, and parents by Giannis Notaras. Build mental toughness, confidence, and peak performance.',
    keywords: ['mental performance books', 'sports psychology books', 'mental toughness', 'athlete mindset', 'Giannis Notaras books'],
};

export default function BooksPage() {
    return (
        <main className="min-h-screen bg-white">
            <section className="bg-zinc-950 text-white py-24 text-center">
                <div className="container mx-auto px-6 max-w-3xl space-y-4">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">All Books</p>
                    <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">
                        The Full Library
                    </h1>
                    <p className="text-zinc-400 text-lg font-medium max-w-xl mx-auto">
                        Practical mental performance guides for athletes, executives, parents, and anyone who wants to win the inner game.
                    </p>
                </div>
            </section>

            <section className="py-24 container mx-auto px-6 max-w-6xl">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {books.map((book) => (
                        <Link href={`/book/${book.id}`} key={book.id} className="group block">
                            <div className="bg-white border border-zinc-200 hover:border-zinc-900 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
                                <div className="aspect-[3/4] bg-zinc-100 relative flex items-center justify-center p-8 group-hover:bg-zinc-50 transition-colors overflow-hidden border-b border-zinc-100">
                                    <Image
                                        src={book.coverImage}
                                        alt={`${book.title} cover`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">New Release</p>
                                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 mb-2">
                                        {book.title}
                                    </h2>
                                    <p className="text-zinc-500 text-sm line-clamp-2 mb-4 flex-1">{book.description}</p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                                        <span className="text-lg font-black text-zinc-900">{book.price}</span>
                                        <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                            View Details <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
