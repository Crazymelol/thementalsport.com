'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function NewsletterInline() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                console.error('Newsletter subscription failed. Status:', res.status, 'Response:', errorData);
                throw new Error(errorData?.error || 'Subscription failed');
            }

            // Track conversion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof window !== 'undefined' && (window as any).gtag) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gtag('event', 'generate_lead', {
                    event_category: 'newsletter',
                    event_label: 'inline_signup',
                    value: 1
                });
            }

            setStatus('success');
            setEmail('');
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setStatus('error');
            setErrorMessage('Something went wrong. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 p-8 md:p-12 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">You&apos;re In!</h3>
                <p className="text-stone-600">
                    Check your inbox. We&apos;ve sent you a confirmation email.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-50 border border-zinc-200 p-8 md:p-12">
            <div className="max-w-2xl mx-auto text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 text-white mb-6">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4 uppercase tracking-tighter">
                    Get The Competition Protocol
                </h3>
                <p className="text-zinc-600 text-lg">
                    Join 2,000+ athletes and coaches. Get exclusive strategies on pre-game routines, mental toughness, and performance optimization delivered to your inbox.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setStatus('idle');
                            setErrorMessage('');
                        }}
                        placeholder="Enter your email"
                        className="flex-1 px-4 py-3 rounded-none border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                        disabled={status === 'loading'}
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="px-8 py-3 bg-zinc-900 text-white font-black rounded-none hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest whitespace-nowrap flex items-center justify-center gap-2 group">
                        {status === 'loading' ? 'Subscribing...' : 'Join Now'}
                        {!status && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>

                {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <p className="text-xs text-zinc-400 text-center">
                    No spam. Unsubscribe at any time.
                </p>
            </form>
        </div>
    );
}
