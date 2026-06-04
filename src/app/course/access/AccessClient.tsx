'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const PLAYLIST_ID = 'PL4B1unWiRnWAEY7O83SLhYUbG9IN9jDc5';
const STORAGE_KEY = 'mpp_access';
const COURSE_PASSWORD = 'MINDSET';

const modules = [
    { num: 1, title: 'Foundation: The Inner Game', lessons: 4, time: '32 min' },
    { num: 2, title: 'The Competition Protocol (T-Minus 7)', lessons: 7, time: '42 min' },
    { num: 3, title: 'Resilient Confidence', lessons: 4, time: '40 min' },
    { num: 4, title: 'Visualizing Disaster (and recovering)', lessons: 3, time: '36 min' },
    { num: 5, title: 'Breath, Rituals, and Flow Triggers', lessons: 5, time: '40 min' },
    { num: 6, title: 'The Physiology Layer', lessons: 4, time: '40 min' },
    { num: 7, title: 'Mental Toughness in Real Time', lessons: 5, time: '40 min' },
    { num: 8, title: 'Mastery & Mentorship', lessons: 4, time: '40 min' },
];

export default function AccessClient() {
    const [unlocked, setUnlocked] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (localStorage.getItem(STORAGE_KEY) === 'true') {
            setUnlocked(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim().toUpperCase() === COURSE_PASSWORD) {
            localStorage.setItem(STORAGE_KEY, 'true');
            setUnlocked(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (!mounted) return null;

    if (!unlocked) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-800">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">
                        Course Access
                    </h1>
                    <p className="text-zinc-400">Enter your access password to unlock the full course.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(false); }}
                            placeholder="Enter password"
                            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-700 text-white font-mono text-center text-lg focus:outline-none focus:border-red-500 transition-colors"
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-sm font-bold uppercase tracking-widest">
                                Incorrect password. Check your purchase email.
                            </p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
                        >
                            Unlock Course <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-zinc-600 text-xs">
                        Need help?{' '}
                        <a href="mailto:notarasioannis@gmail.com" className="text-zinc-400 hover:text-white transition-colors">
                            notarasioannis@gmail.com
                        </a>
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <header className="border-b border-zinc-900 py-6 px-6">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <Link href="/" className="text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                        ← The Mental Sport
                    </Link>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                        <span className="text-zinc-400">Full Access Unlocked</span>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 text-center px-6">
                <div className="container mx-auto max-w-4xl">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-4">Your Course</p>
                    <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-4">
                        The Mental<br />Performance Protocol
                    </h1>
                    <p className="text-zinc-400 text-lg">8 modules · 36 lessons · Lifetime access</p>
                </div>
            </section>

            {/* Video Player */}
            <section className="px-6 pb-12">
                <div className="container mx-auto max-w-5xl">
                    <div className="aspect-video w-full bg-zinc-900 border border-zinc-800">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&rel=0`}
                            title="The Mental Performance Protocol"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                        />
                    </div>
                    <p className="text-zinc-600 text-xs text-center mt-3 uppercase tracking-widest">
                        Use the playlist menu (top-right of player) to navigate between lessons
                    </p>
                </div>
            </section>

            {/* Module List */}
            <section className="px-6 pb-24">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-zinc-400">
                        Course Curriculum
                    </h2>
                    <div className="space-y-3">
                        {modules.map((m) => (
                            <div key={m.num} className="bg-zinc-900 border border-zinc-800 p-5 flex items-center gap-5">
                                <div className="text-3xl font-black text-zinc-700">{String(m.num).padStart(2, '0')}</div>
                                <div className="flex-1">
                                    <h3 className="font-black text-white uppercase tracking-tight">{m.title}</h3>
                                    <p className="text-zinc-500 text-sm mt-1">{m.lessons} lessons · {m.time}</p>
                                </div>
                                <Play className="w-5 h-5 text-red-500 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-xs uppercase tracking-widest">
                Questions?{' '}
                <a href="mailto:notarasioannis@gmail.com" className="text-zinc-400 hover:text-white transition-colors">
                    notarasioannis@gmail.com
                </a>
                <span className="mx-4">·</span>
                © 2026 Giannis Notaras
            </footer>
        </main>
    );
}
