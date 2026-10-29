import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Mail, BookOpen, Download, ArrowRight } from 'lucide-react';
import { books } from '@/data/books';
import { COURSE } from '@/data/course';
import NewsletterWrapper from '@/components/NewsletterWrapper';

export const metadata = {
    title: 'Links | Giannis Notaras',
    description: 'Official links for Giannis Notaras — Mental Performance Expert, Author of 8 Books.',
};

export default function LinksPage() {
    // Feature the "Mental Blocks" or "Competition Protocol" book
    const featuredBook = books.find(b => b.id === 'the-competition-protocol') || books[0];

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Background Texture */}
            <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/10 via-zinc-950/40 to-zinc-950 pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md space-y-10 text-center">

                {/* Profile / Header with Verified Coach Photo */}
                <div className="space-y-4 animate-in fade-in zoom-in duration-700">
                    <div className="w-28 h-28 rounded-full mx-auto border-4 border-amber-400/80 shadow-[0_0_35px_rgba(251,191,36,0.3)] overflow-hidden relative group">
                        <Image
                            src="/about/giannis-portrait.png"
                            alt="Giannis Notaras"
                            fill
                            sizes="112px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Giannis Notaras</h1>
                            <span className="text-blue-400 text-lg" title="Verified Performance Coach">✓</span>
                        </div>
                        <p className="text-amber-400 text-xs font-black uppercase tracking-[0.2em] mt-1.5">
                            Author of 8 Books • Mental Performance Coach
                        </p>
                    </div>
                </div>

                {/* Links Stack */}
                <div className="space-y-4 w-full animate-in slide-in-from-bottom-4 duration-1000 delay-200">

                    {/* 1. COURSE — first and largest, this is the offer Instagram traffic should see */}
                    <Link
                        href="/course"
                        className="group relative block w-full p-[2px] bg-gradient-to-r from-red-600 via-amber-400 to-red-600 shadow-[0_0_55px_rgba(220,38,38,0.55)] hover:shadow-[0_0_70px_rgba(220,38,38,0.75)] transition-all transform hover:-translate-y-1"
                    >
                        <div className="bg-zinc-950 h-full w-full p-5 text-left group-hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">The course</span>
                                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 font-black tracking-normal">${COURSE.price}</span>
                            </div>
                            <div className="font-black text-white uppercase tracking-tight text-lg leading-tight">
                                {COURSE.name}
                            </div>
                            <p className="text-zinc-300 text-sm leading-snug mt-2">
                                {COURSE.pitch}
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
                                Start the protocol <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* 2. OFFICIAL GIVEAWAY + FREE PROTOCOL */}
                    <Link
                        href="/giveaway"
                        className="group relative block w-full p-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_40px_rgba(251,191,36,0.35)] hover:shadow-[0_0_60px_rgba(251,191,36,0.6)] transition-all transform hover:-translate-y-1"
                    >
                        <div className="bg-zinc-950 h-full w-full p-4 flex items-center justify-between relative z-10 hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center shrink-0">
                                    <span className="text-lg">🏆</span>
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                        <span>Official 2026 Giveaway</span>
                                        <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black tracking-normal">$80+ VAULT</span>
                                    </div>
                                    <div className="text-zinc-400 text-xs font-medium">Win 6 Books + Free 7-Day Protocol PDF</div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* 2. FREE COMPETITION PROTOCOL DOWNLOAD */}
                    <Link
                        href="/giveaway"
                        className="group relative block w-full p-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-[0_0_40px_rgba(255,100,0,0.3)] hover:shadow-[0_0_60px_rgba(255,100,0,0.5)] transition-all transform hover:-translate-y-1"
                    >
                        <div className="bg-zinc-950 h-full w-full p-4 flex items-center justify-between relative z-10 hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center shrink-0">
                                    <Download className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                        <span>Free 7-Day Protocol</span>
                                        <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black tracking-normal">FREE PDF</span>
                                    </div>
                                    <div className="text-zinc-400 text-xs font-medium">The Elite Athlete&apos;s Pre-Game Manual</div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* 3. NEWSLETTER / INNER CIRCLE (Opens Functional Modal) */}
                    <NewsletterWrapper className="w-full text-left" formLocation="links">
                        <div className="block w-full border border-zinc-800 hover:border-zinc-700 transition-all bg-zinc-900 p-4 hover:bg-zinc-800 cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-white uppercase tracking-wider text-sm">Join the Inner Circle</div>
                                    <div className="text-zinc-500 text-xs font-medium">Weekly mental drills straight to your inbox</div>
                                </div>
                            </div>
                        </div>
                    </NewsletterWrapper>

                    {/* 4. FEATURED BOOK (Visual) */}
                    <Link
                        href={`/book/${featuredBook.id}`}
                        className="block w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all p-4 group hover:bg-zinc-800 overflow-hidden relative text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-16 bg-zinc-800 shrink-0 shadow-lg border border-zinc-700 group-hover:scale-105 transition-transform relative">
                                <Image src={featuredBook.coverImage} alt="Cover" fill sizes="48px" className="object-cover" />
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">★ Bestseller • $17.00</div>
                                <div className="font-black text-white uppercase tracking-wide text-sm leading-tight block mb-1">
                                    {featuredBook.title}
                                </div>
                                <div className="text-zinc-400 text-xs">
                                    The 7-Day Pre-Game Blueprint <span className="opacity-50">|</span> <span className="text-white font-bold">Instant Download</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* 5. ALL 8 BOOKS */}
                    <Link
                        href="/books"
                        className="block w-full p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 border border-zinc-700 bg-zinc-800 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <div className="font-black text-white uppercase tracking-wider text-sm">Browse The Library</div>
                                <div className="text-zinc-500 text-xs font-medium">{books.length} Books Available • From $9.99</div>
                            </div>
                        </div>
                    </Link>

                    {/* 6. WEBSITE */}
                    <Link
                        href="/"
                        className="block w-full py-4 text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors border border-transparent hover:border-zinc-800"
                    >
                        Visit Official Website → thementalsport.com
                    </Link>

                </div>

                {/* Socials */}
                <div className="flex justify-center gap-8 pt-4">
                    <a href="https://www.instagram.com/thementalsportpro/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-all hover:scale-110 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Instagram className="w-5 h-5 text-zinc-400" /> @thementalsportpro
                    </a>
                    <a href="https://www.instagram.com/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-all hover:scale-110 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Instagram className="w-5 h-5 text-zinc-400" /> @giannisnotaras
                    </a>
                </div>

                <footer className="text-zinc-800 text-[10px] uppercase tracking-widest pt-8 pb-4">
                    © 2026 The Mental Sport • All Rights Reserved
                </footer>

            </div>
        </main>
    );
}
