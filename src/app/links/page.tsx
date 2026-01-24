import Link from 'next/link';
import { ArrowRight, Instagram, Linkedin, Twitter } from 'lucide-react';

export const metadata = {
    title: 'Giannis Notaras | Links',
    description: 'Quick links for Giannis Notaras - Mental Performance Expert.',
};

export default function LinksPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Texture */}
            <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/10 via-zinc-950/40 to-zinc-950 pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md space-y-8 text-center">

                {/* Profile / Header */}
                <div className="space-y-4">
                    <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto flex items-center justify-center border-2 border-zinc-700 overflow-hidden shadow-2xl">
                        {/* Placeholder for Profile IMG */}
                        <span className="text-2xl font-black text-zinc-500">GN</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Giannis Notaras</h1>
                        <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mt-1">Mental Performance Expert</p>
                    </div>
                </div>

                {/* Links Stack */}
                <div className="space-y-4 w-full">

                    {/* Primary Button */}
                    <a
                        href="/#newsletter-modal" // Need to handle this interaction, or just link to home with fragment
                        // In a real app we might want a client component here to open modal, 
                        // but sticking to simple links is safer for "Bio" pages. 
                        // Let's link to the home page newsletter section for now.
                        className="block w-full py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        Join The Newsletter
                    </a>

                    {/* Book Button */}
                    <a
                        href="https://www.amazon.com/dp/B0F87QX82W" // Using ASIN from data
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-4 bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-widest text-sm hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                        Get "Mental Blocks" Book
                    </a>

                    {/* All Books */}
                    <Link
                        href="/#books"
                        className="block w-full py-4 bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-widest text-sm hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                        View All Books
                    </Link>

                    {/* Website */}
                    <Link
                        href="/"
                        className="block w-full py-4 bg-transparent text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                    >
                        Visit Official Website
                    </Link>

                </div>

                {/* Socials */}
                <div className="flex justify-center gap-6 pt-4 text-zinc-500">
                    <a href="https://www.instagram.com/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                        <Instagram className="w-6 h-6" />
                    </a>
                    <a href="https://www.linkedin.com/in/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                        <Linkedin className="w-6 h-6" />
                    </a>
                    <a href="#" className="hover:text-white transition-colors">
                        <Twitter className="w-6 h-6" />
                    </a>
                </div>

                <footer className="text-zinc-700 text-[10px] uppercase tracking-widest pt-8">
                    © 2026 The Mental Sport
                </footer>

            </div>
        </main>
    );
}
