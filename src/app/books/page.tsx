import React from 'react';
import { books, Book } from '@/data/books';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Quote, ShoppingCart } from 'lucide-react';
import NewsletterInline from '@/components/NewsletterInline';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Books',
    description: 'Mental performance books for athletes, executives, and parents by Giannis Notaras. Build mental toughness, confidence, and peak performance.',
    keywords: ['mental performance books', 'sports psychology books', 'mental toughness', 'athlete mindset', 'Giannis Notaras books'],
};

const SPOTLIGHT_ID = 'the-competition-protocol';

const CATEGORIES: { key: Book['category']; label: string; blurb: string }[] = [
    { key: 'athletes', label: 'For Athletes & Competitors', blurb: 'Build the mental edge that shows up on game day.' },
    { key: 'mindset', label: 'Confidence & Mindset', blurb: 'Dismantle self-doubt and build a mindset that holds under pressure.' },
    { key: 'parents-kids', label: 'For Parents & Kids', blurb: 'Help the next generation build resilience early.' },
];

function BookCard({ book }: { book: Book }) {
    const quote = book.reviews[0]?.quote;
    return (
        <Link
            href={`/book/${book.id}`}
            style={{ '--accent': book.palette.primary } as React.CSSProperties}
            className="group block bg-white border border-zinc-200 hover:border-[var(--accent)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
            <div className="aspect-[3/4] bg-zinc-100 relative flex items-center justify-center p-8 group-hover:bg-zinc-50 transition-colors overflow-hidden border-b border-zinc-100">
                <Image
                    src={book.coverImage}
                    alt={`${book.title} cover`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="p-6 flex flex-col gap-4">
                {quote && (
                    <p className="text-zinc-500 text-sm italic line-clamp-2">&ldquo;{quote}&rdquo;</p>
                )}
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4">
                    {book.title}
                </h3>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                    <span className="text-lg font-black text-zinc-900">{book.price}</span>
                    <span style={{ color: book.palette.primary }} className="text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Details <ArrowRight className="w-3 h-3" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function BooksPage() {
    const spotlight = books.find((b) => b.id === SPOTLIGHT_ID)!;
    const spotlightQuote = spotlight.reviews[0];

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

            {/* START HERE SPOTLIGHT */}
            <section className="py-24 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-5xl">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-10 text-center">Start Here</p>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="flex justify-center order-1">
                            <div className="relative group">
                                <div
                                    style={{ backgroundColor: spotlight.palette.primary }}
                                    className="absolute inset-0 blur-3xl opacity-20 scale-90 pointer-events-none"
                                ></div>
                                <Image
                                    src={spotlight.coverImage}
                                    alt={`${spotlight.title} cover`}
                                    width={300}
                                    height={450}
                                    className="relative w-[260px] h-[390px] lg:w-[300px] lg:h-[450px] object-contain shadow-[20px_20px_60px_rgba(0,0,0,0.3)] border border-zinc-100 bg-zinc-50"
                                />
                            </div>
                        </div>
                        <div className="order-2 space-y-6">
                            <div
                                style={{ borderColor: `${spotlight.palette.primary}66`, backgroundColor: `${spotlight.palette.primary}19`, color: spotlight.palette.primary }}
                                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] border"
                            >
                                The Author&apos;s Pick
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-tight">
                                {spotlight.title}
                            </h2>
                            <p className="text-zinc-500 text-lg font-bold">{spotlight.subtitle}</p>
                            <p className="text-zinc-600 leading-relaxed">{spotlight.description}</p>
                            {spotlightQuote && (
                                <div style={{ borderColor: spotlight.palette.primary }} className="border-l-2 pl-4">
                                    <Quote className="w-6 h-6 text-zinc-300 mb-2" />
                                    <p className="text-zinc-800 italic font-medium mb-2">&ldquo;{spotlightQuote.quote}&rdquo;</p>
                                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">— {spotlightQuote.author}, {spotlightQuote.role}</p>
                                </div>
                            )}
                            <div className="flex items-center gap-6 pt-2">
                                <span className="text-2xl font-black text-zinc-900">{spotlight.price}</span>
                                <Link
                                    href={`/book/${spotlight.id}`}
                                    className="px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-5 h-5" /> Get The Book
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORY SECTIONS */}
            {CATEGORIES.map((cat) => {
                const catBooks = books.filter((b) => b.category === cat.key && b.id !== SPOTLIGHT_ID);
                if (catBooks.length === 0) return null;
                return (
                    <section key={cat.key} className="py-20 border-b border-zinc-200 last:border-b-0">
                        <div className="container mx-auto px-6 max-w-6xl">
                            <div className="mb-12">
                                <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter mb-2">{cat.label}</h2>
                                <p className="text-zinc-500">{cat.blurb}</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {catBooks.map((book) => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })}

            <section className="pb-24 pt-8 container mx-auto px-6 max-w-3xl">
                <NewsletterInline />
            </section>
        </main>
    );
}
