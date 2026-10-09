'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Trophy,
    Gift,
    CheckCircle2,
    Download,
    ArrowRight,
    Star,
    ShieldCheck,
    Sparkles,
    BookOpen,
    Users
} from 'lucide-react';

const BOOKS = [
    { title: 'The Competition Protocol', cover: '/covers/the-competition-protocol.png', tag: 'Flagship' },
    { title: "The ADHD Athlete's Edge", cover: '/covers/adhd-athletes-edge.png', tag: 'New Release' },
    { title: 'Overcoming Mental Blocks', cover: '/covers/overcoming-mental-blocks.png', tag: 'Bestseller' },
    { title: 'Confidence-Building Workbook', cover: '/covers/confidence-building.png', tag: 'Action Guide' },
    { title: 'Unlocking Resilient Confidence', cover: '/covers/resilient-confidence.png', tag: 'Mental Toughness' },
    { title: 'Physiological Peak Performance', cover: '/covers/physiological-performance.png', tag: 'Neuroscience' },
];

export default function GiveawayPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [sport, setSport] = useState('Basketball');
    const [level, setLevel] = useState('Collegiate / Academy');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        if (!name.trim()) {
            setStatus('error');
            setErrorMessage('Please enter your full name.');
            return;
        }

        setStatus('loading');

        try {
            // Save lead entry to localStorage
            const entry = {
                name,
                email,
                sport,
                level,
                timestamp: new Date().toISOString(),
                source: 'website_giveaway'
            };

            if (typeof window !== 'undefined') {
                const existing = JSON.parse(localStorage.getItem('tms_giveaway_leads') || '[]');
                existing.push(entry);
                localStorage.setItem('tms_giveaway_leads', JSON.stringify(existing));

                // Analytics tracking if present
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((window as any).gtag) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).gtag('event', 'giveaway_entry', {
                        event_category: 'lead_generation',
                        event_label: sport,
                        value: 1
                    });
                }
            }

            setStatus('success');
        } catch (err) {
            console.error('Giveaway entry error:', err);
            // Even on error, let the athlete access the download
            setStatus('success');
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-white selection:bg-amber-400 selection:text-black">
            {/* HERO SECTION */}
            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-zinc-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950/60 to-zinc-950 pointer-events-none"></div>

                <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
                    {/* BADGE */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-full mb-8">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                            Official 2026 Athlete Giveaway • $80+ Value
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6">
                        Win The Ultimate <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
                            Mental Performance Vault
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-10">
                        Enter free to win the complete 6-book performance library + 1-on-1 strategy session with Coach Giannis Notaras. Every entrant immediately unlocks the <strong className="text-white">7-Day Competition Protocol PDF</strong>.
                    </p>

                    {/* PRIZE BREAKDOWN CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left mb-16">
                        <div className="bg-zinc-900/80 border border-amber-500/30 p-6 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <Trophy className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Grand Prize</span>
                                    <h3 className="text-lg font-black uppercase text-white">Full 6-Book Library + Consultation</h3>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Complete access to all 6 bestselling digital athlete playbooks ($80+ value) plus a private game-day mental preparation audit with Giannis Notaras.
                            </p>
                        </div>

                        <div className="bg-zinc-900/80 border border-blue-500/30 p-6 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <Gift className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Guaranteed For Everyone</span>
                                    <h3 className="text-lg font-black uppercase text-white">Instant 7-Day Protocol PDF</h3>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                You don&apos;t leave empty-handed. As soon as you enter, the 7-day pre-competition preparation guide is immediately unlocked for download.
                            </p>
                        </div>
                    </div>

                    {/* FORM CONTAINER */}
                    <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-10 shadow-2xl relative text-left">
                        {status === 'success' ? (
                            <div className="text-center py-6 animate-in fade-in duration-500 space-y-6">
                                <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(251,191,36,0.3)]">
                                    <CheckCircle2 className="w-10 h-10 text-amber-400" />
                                </div>

                                <div>
                                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">Entry Confirmed</span>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-white mt-1">
                                        You&apos;re In The Draw!
                                    </h2>
                                    <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
                                        We&apos;ve registered <span className="text-white font-semibold">{email}</span> for the Grand Prize drawing. Check your inbox for updates!
                                    </p>
                                </div>

                                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                        🎁 Your Guaranteed Entry Gift:
                                    </div>
                                    <div className="text-xl font-black uppercase text-white">
                                        The 7-Day Competition Protocol
                                    </div>
                                    <p className="text-xs text-zinc-400">
                                        Printable pre-game algorithm & crisis reset routine.
                                    </p>

                                    <a
                                        href="/free-chapter.pdf"
                                        download="The-Competition-Protocol-Free.pdf"
                                        className="inline-flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-black uppercase tracking-widest text-sm hover:from-amber-300 hover:to-yellow-400 transition-all shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                                    >
                                        <Download className="w-5 h-5" /> Download Free Protocol (PDF)
                                    </a>
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href="/start-here"
                                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Explore More Training Guides <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="border-b border-zinc-800 pb-4 mb-4">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-white">
                                        Enter The Giveaway
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        100% Free • Instant PDF download unlocks upon submit.
                                    </p>
                                </div>

                                {status === 'error' && (
                                    <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-200 text-xs font-medium">
                                        {errorMessage}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Giannis Notaras"
                                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="athlete@domain.com"
                                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors text-sm"
                                    />
                                    <span className="text-[11px] text-zinc-500 mt-1 block">
                                        Winner will be notified via this email address.
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                                            Primary Sport
                                        </label>
                                        <select
                                            value={sport}
                                            onChange={(e) => setSport(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-400 transition-colors text-sm"
                                        >
                                            <option value="Basketball">Basketball</option>
                                            <option value="Soccer">Soccer / Football</option>
                                            <option value="Tennis">Tennis</option>
                                            <option value="Track & Field">Track & Field / Running</option>
                                            <option value="Swimming">Swimming</option>
                                            <option value="Combat Sports">Boxing / MMA / Wrestling</option>
                                            <option value="Baseball">Baseball / Softball</option>
                                            <option value="Volleyball">Volleyball</option>
                                            <option value="Golf">Golf</option>
                                            <option value="CrossFit / Gym">CrossFit / Powerlifting</option>
                                            <option value="Other">Other Sport</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                                            Current Level
                                        </label>
                                        <select
                                            value={level}
                                            onChange={(e) => setLevel(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-amber-400 transition-colors text-sm"
                                        >
                                            <option value="Collegiate / Academy">Collegiate / Academy</option>
                                            <option value="High School / Club">High School / Club</option>
                                            <option value="Semi-Pro / Professional">Semi-Pro / Professional</option>
                                            <option value="Coach / Trainer">Coach / Trainer</option>
                                            <option value="Parent">Parent of Athlete</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-4 mt-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-black uppercase tracking-widest text-sm hover:from-amber-300 hover:to-yellow-400 transition-all rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.35)] disabled:opacity-50"
                                >
                                    {status === 'loading' ? 'SUBMITTING ENTRY...' : 'ENTER GIVEAWAY & GET FREE PROTOCOL →'}
                                </button>

                                <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-zinc-500">
                                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>No spam. Instant PDF access granted immediately on screen.</span>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* WHAT'S INSIDE THE VAULT */}
            <section className="py-20 bg-zinc-900/40 border-b border-zinc-800">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                            The Grand Prize
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mt-2">
                            The 6-Book Performance Vault
                        </h2>
                        <p className="text-zinc-400 text-sm md:text-base mt-3">
                            The winner receives lifetime digital access to all 6 flagship sports psychology manuals written by Giannis Notaras.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {BOOKS.map((book, idx) => (
                            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center flex flex-col justify-between hover:border-zinc-700 transition-all hover:-translate-y-1">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">
                                        {book.tag}
                                    </div>
                                    <div className="relative aspect-[3/4] w-full mb-3 rounded-lg overflow-hidden shadow-lg border border-zinc-800">
                                        <Image
                                            src={book.cover}
                                            alt={book.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 50vw, 16vw"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xs font-bold text-white leading-tight">
                                    {book.title}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TRUST & AUTHORITY */}
            <section className="py-16 text-center border-b border-zinc-800">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex justify-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                    <blockquote className="text-lg md:text-xl font-medium text-zinc-300 italic mb-6">
                        &quot;Athletes spend 10,000 hours training mechanics, but leave their mindset to chance on game day. The Mental Sport protocols give competitors a repeatable checklist to perform on instinct.&quot;
                    </blockquote>
                    <div className="text-sm font-black uppercase tracking-widest text-white">
                        Giannis Notaras
                    </div>
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mt-1">
                        Founder & Performance Coach
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-10 text-center text-xs text-zinc-600">
                <p>© 2026 The Mental Sport. All rights reserved. • <Link href="/privacy" className="hover:underline">Privacy Policy</Link> • <Link href="/terms" className="hover:underline">Terms</Link></p>
            </footer>
        </main>
    );
}
