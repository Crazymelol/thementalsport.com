'use client';

import React, { useState } from 'react';
import { ArrowRight, BookOpen, X } from 'lucide-react';

export default function LeadMagnet() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, tag: 'lead-magnet-free-chapter' }),
            });
            if (res.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <section className="relative bg-zinc-950 text-white py-16 border-t border-zinc-800">
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="container mx-auto px-6 max-w-3xl text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-[0.2em]">
                    <BookOpen className="w-3 h-3" /> Free Chapter
                </div>
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">
                    Get the First Chapter Free
                </h2>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                    Download the opening chapter of <strong className="text-white">The Competition Protocol</strong> — the 7-day pre-event mental framework used by elite athletes.
                </p>

                {status === 'success' ? (
                    <div className="py-6 text-green-400 font-black uppercase tracking-widest text-lg">
                        ✓ Check your inbox — it&apos;s on its way.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email address"
                            className="flex-1 px-5 py-4 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-white text-sm font-medium rounded-none"
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="px-8 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 rounded-none disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Sending...' : <>Send It <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                )}

                {status === 'error' && (
                    <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
                )}

                <p className="text-zinc-600 text-xs">No spam. Unsubscribe anytime.</p>
            </div>
        </section>
    );
}
