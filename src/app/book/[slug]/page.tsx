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
        <main className="min-h-screen relative overflow-x-hidden selection:bg-amber-100 selection:text-amber-900 bg-[#FAFAF9]">
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-widest">
                            <Star className="w-3 h-3 fill-current" /> New Release 2025
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] text-stone-900">
                            {book.title} <br />
                            <span className="text-amber-600 italic text-4xl lg:text-6xl">{book.subtitle}</span>
                        </h1>
                        <p className="text-xl text-stone-600 leading-relaxed max-w-lg text-balance font-light">
                            {book.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <a href={AMAZON_LINK} target="_blank" rel="noopener noreferrer" className="btn-amazon justify-center">
                                <ShoppingCart className="w-5 h-5" /> Buy on Amazon
                            </a>
                            <button className="px-8 py-4 rounded-lg border border-stone-300 text-stone-600 font-semibold hover:bg-stone-100 transition-colors flex items-center justify-center gap-2">
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
                                className="w-[300px] h-[450px] object-contain rounded-lg shadow-[20px_20px_60px_rgba(0,0,0,0.3)]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. CUSTOMER REVIEWS */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-stone-900 mb-6">What Readers Are Saying</h2>
                        <p className="text-stone-600 text-lg">Real reviews from people who've transformed their performance</p>
                    </div>

                    {/* Reviews Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {book.reviews.map((review, i) => (
                            <div key={i} className="bg-stone-50 p-8 rounded-2xl border border-stone-100 hover:shadow-lg transition-shadow">
                                <Quote className="w-10 h-10 text-amber-200 mb-4" />
                                <p className="text-stone-700 italic mb-6 leading-relaxed">
                                    &ldquo;{review.quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                                        {review.author.charAt(0)}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-bold text-stone-900">{review.author}</div>
                                        <div className="text-stone-500">{review.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Key Features */}
                    <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-12 text-white">
                        <h3 className="text-3xl font-bold mb-8 text-center">What You'll Learn</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {book.features.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                                    <p className="text-lg text-stone-100">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. RELATED BOOKS */}
            <section className="py-24 bg-stone-50">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-stone-900 mb-12 text-center">You Might Also Like</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {books.filter(b => b.id !== book.id).slice(0, 3).map((relatedBook) => (
                            <a href={`/book/${relatedBook.id}`} key={relatedBook.id} className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                                <div className="aspect-[3/4] bg-stone-200 relative overflow-hidden">
                                    <img
                                        src={relatedBook.coverImage}
                                        alt={`${relatedBook.title} cover`}
                                        className="w-full h-full object-contain p-4"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-lg text-stone-900 group-hover:text-amber-600 transition-colors mb-2">
                                        {relatedBook.title}
                                    </h3>
                                    <p className="text-stone-600 text-sm line-clamp-2">{relatedBook.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* STICKY BOTTOM BAR (Mobile) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 md:hidden z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                <div className="font-serif font-bold text-stone-900 text-sm max-w-[200px] truncate">{book.title}</div>
                <a href={AMAZON_LINK} target="_blank" className="bg-[#FF9900] text-white text-sm font-bold px-6 py-3 rounded-full shadow-md">
                    Buy
                </a>
            </div>

        </main>
    );
}
