import React from 'react';
import { books } from '@/data/books';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Star, ArrowRight, ShoppingCart, CheckCircle2, Quote } from 'lucide-react';

/* 
 * This is a Server Component. 
 * Next.js 15+ Params are promises, so we await them.
 */
interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return books.map((book) => ({
        slug: book.id,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const book = books.find((b) => b.id === slug);

    if (!book) {
        return {
            title: 'Book Not Found',
        };
    }

    return {
        title: book.title,
        description: book.description,
        keywords: [book.title, book.author, 'mental performance', 'peak performance', 'mental toughness'],
        authors: [{ name: book.author }],
        openGraph: {
            title: `${book.title} - ${book.subtitle}`,
            description: book.description,
            type: 'book',
            images: [
                {
                    url: book.coverImage,
                    width: 600,
                    height: 900,
                    alt: `${book.title} cover`,
                }
            ],
            authors: [book.author],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${book.title} - ${book.subtitle}`,
            description: book.description,
            images: [book.coverImage],
        },
    };
}

export default async function BookPage({ params }: PageProps) {
    const { slug } = await params;
    const book = books.find((b) => b.id === slug);

    if (!book) {
        notFound();
    }

    const AMAZON_LINK = `https://www.amazon.com/dp/${book.asin}`;

    // Structured Data (JSON-LD) for SEO
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": book.title,
        "author": {
            "@type": "Person",
            "name": book.author
        },
        "description": book.description,
        "image": book.coverImage,
        "isbn": book.asin,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": book.reviews.length.toString()
        },
        "review": book.reviews.map(review => ({
            "@type": "Review",
            "author": {
                "@type": "Person",
                "name": review.author
            },
            "reviewBody": review.quote
        })),
        "offers": {
            "@type": "Offer",
            "url": AMAZON_LINK,
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": "Amazon"
            }
        }
    };

    return (
        <main className="min-h-screen relative overflow-x-hidden selection:bg-zinc-900 selection:text-white bg-white">
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* 1. HERO SECTION */}
            <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left: Text */}
                    <div className="order-2 lg:order-1 space-y-8 animate-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-900 text-xs font-black uppercase tracking-[0.2em] border border-zinc-200">
                            <Star className="w-3 h-3 fill-current" /> New Release 2025
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] text-zinc-900 uppercase tracking-tighter">
                            {book.title} <br />
                            <span className="text-zinc-500 text-4xl lg:text-5xl block mt-2">{book.subtitle}</span>
                        </h1>
                        <p className="text-xl text-zinc-600 leading-relaxed max-w-lg text-balance font-medium">
                            {book.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <a href={AMAZON_LINK} target="_blank" rel="noopener noreferrer" className="btn-amazon justify-center">
                                <ShoppingCart className="w-5 h-5" /> Buy on Amazon
                            </a>
                            <button className="px-8 py-4 border-2 border-zinc-200 text-zinc-900 font-black uppercase tracking-widest hover:border-zinc-900 transition-colors flex items-center justify-center gap-2 rounded-none">
                                Read a Sample <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Book Cover Image */}
                    <div className="order-1 lg:order-2 flex justify-center animate-in slide-in-from-right duration-1000">
                        <div className="relative group cursor-pointer transition-transform hover:scale-105 duration-500">
                            <img
                                src={book.coverImage}
                                alt={`${book.title} cover`}
                                className="w-[300px] h-[450px] object-contain shadow-[20px_20px_60px_rgba(0,0,0,0.3)] border border-zinc-100 bg-zinc-50"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. CUSTOMER REVIEWS */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-zinc-900 mb-6 uppercase tracking-tighter">What Readers Are Saying</h2>
                        <p className="text-zinc-500 text-lg font-bold uppercase tracking-widest">Real reviews from people who&apos;ve transformed their performance</p>
                    </div>

                    {/* Reviews Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {book.reviews.map((review, i) => (
                            <div key={i} className="bg-zinc-50 p-8 border border-zinc-200 hover:border-zinc-900 transition-colors">
                                <Quote className="w-10 h-10 text-zinc-200 mb-4" />
                                <p className="text-zinc-800 italic mb-6 leading-relaxed font-medium">
                                    &ldquo;{review.quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center text-sm font-bold text-white uppercase">
                                        {review.author.charAt(0)}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-bold text-zinc-900 uppercase tracking-wide">{review.author}</div>
                                        <div className="text-zinc-500 text-xs uppercase tracking-widest">{review.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Key Features */}
                    <div className="bg-zinc-950 p-12 text-white">
                        <h3 className="text-3xl font-black mb-12 text-center uppercase tracking-tighter">What You&apos;ll Learn</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            {book.features.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start border-l-2 border-zinc-800 pl-4">
                                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-1" />
                                    <p className="text-lg text-zinc-300 font-medium">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. RELATED BOOKS */}
            <section className="py-24 bg-zinc-50 border-t border-zinc-200">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-black text-zinc-900 mb-12 text-center uppercase tracking-tighter">You Might Also Like</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {books.filter(b => b.id !== book.id).slice(0, 3).map((relatedBook) => (
                            <a href={`/book/${relatedBook.id}`} key={relatedBook.id} className="group block bg-white border border-zinc-200 hover:border-zinc-900 transition-all">
                                <div className="aspect-[3/4] bg-zinc-100 relative overflow-hidden border-b border-zinc-100">
                                    <img
                                        src={relatedBook.coverImage}
                                        alt={`${relatedBook.title} cover`}
                                        className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-8">
                                    <h3 className="font-black text-lg text-zinc-900 group-hover:underline decoration-2 underline-offset-4 mb-2 uppercase tracking-tight">
                                        {relatedBook.title}
                                    </h3>
                                    <p className="text-zinc-500 text-sm line-clamp-2">{relatedBook.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* STICKY BOTTOM BAR (Mobile) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 md:hidden z-50 flex items-center justify-between">
                <div className="font-black text-zinc-900 text-xs uppercase tracking-widest max-w-[200px] truncate">{book.title}</div>
                <a href={AMAZON_LINK} target="_blank" className="bg-zinc-900 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-none">
                    Buy
                </a>
            </div>

        </main>
    );
}
