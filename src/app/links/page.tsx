import Link from 'next/link';
import { Instagram, Linkedin, Twitter, Mail, BookOpen } from 'lucide-react';
import { books } from '@/data/books';

export const metadata = {
    title: 'Giannis Notaras | Links',
    description: 'Quick links for Giannis Notaras - Mental Performance Expert.',
};

export default function LinksPage() {
    // Feature the "Mental Blocks" book as the primary push
    const featuredBook = books.find(b => b.id === 'mental-blocks') || books[0];

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Background Texture */}
            <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/10 via-zinc-950/40 to-zinc-950 pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md space-y-10 text-center">

                {/* Profile / Header */}
                <div className="space-y-4 animate-in fade-in zoom-in duration-700">
                    <div className="w-28 h-28 bg-zinc-800 rounded-full mx-auto flex items-center justify-center border-4 border-zinc-800 shadow-2xl overflow-hidden relative group">
                        {/* Placeholder for Profile IMG - In real app, put actual image here */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-700 to-zinc-600 group-hover:scale-110 transition-transform duration-700"></div>
                        <span className="relative text-3xl font-black text-zinc-400 z-10">GN</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Giannis Notaras</h1>
                        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em] mt-2">Mental Performance Expert</p>
                    </div>
                </div>

                {/* Links Stack */}
                <div className="space-y-4 w-full animate-in slide-in-from-bottom-4 duration-1000 delay-200">

                    {/* 1. LEAD MAGNET (Primary Action) */}
                    <a
                        href="/#newsletter-modal"
                        className="group relative block w-full p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] transition-all transform hover:-translate-y-1"
                    >
                        <div className="bg-zinc-950 h-full w-full p-4 flex items-center justify-between relative z-10 hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-white uppercase tracking-wider text-sm">Join the Inner Circle</div>
                                    <div className="text-zinc-400 text-xs font-medium">Get exclusive mental drills</div>
                                </div>
                            </div>
                        </div>
                    </a>

                    {/* 2. FEATURED BOOK (Visual) */}
                    <a
                        href="https://www.amazon.com/dp/B0F87QX82W"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all p-4 group hover:bg-zinc-800 overflow-hidden relative"
                    >
                        <div className="flex items-center gap-4">
                            {/* Tiny Cover Preview */}
                            <div className="w-12 h-16 bg-zinc-800 shrink-0 shadow-lg border border-zinc-700 group-hover:scale-105 transition-transform">
                                <img src={featuredBook.coverImage} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Best Seller</div>
                                <div className="font-black text-white uppercase tracking-wide text-sm leading-tight block mb-1">
                                    {featuredBook.title}
                                </div>
                                <div className="text-zinc-400 text-xs">
                                    Get the Roadmap <span className="opacity-50">|</span> <span className="text-white font-bold">Available on Amazon</span>
                                </div>
                            </div>
                        </div>
                    </a>

                    {/* 3. ALL BOOKS */}
                    <Link
                        href="/#books"
                        className="block w-full p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-none border border-zinc-700 bg-zinc-800 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <div className="font-black text-white uppercase tracking-wider text-sm">Browse The Library</div>
                                <div className="text-zinc-500 text-xs font-medium">{books.length} Books Available</div>
                            </div>
                        </div>
                    </Link>

                    {/* 4. WEBSITE */}
                    <Link
                        href="/"
                        className="block w-full py-4 text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors border border-transparent hover:border-zinc-800"
                    >
                        Visit Official Website
                    </Link>

                </div>

                {/* Socials */}
                <div className="flex justify-center gap-8 pt-4">
                    <a href="https://www.instagram.com/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                        <Instagram className="w-6 h-6" />
                    </a>
                    <a href="https://www.linkedin.com/in/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                        <Linkedin className="w-6 h-6" />
                    </a>
                    <a href="#" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                        <Twitter className="w-6 h-6" />
                    </a>
                </div>

                <footer className="text-zinc-800 text-[10px] uppercase tracking-widest pt-8 pb-4">
                    © 2026 The Mental Sport
                </footer>

            </div>
        </main>
    );
}
