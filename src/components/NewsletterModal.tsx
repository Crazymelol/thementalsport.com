'use client';

import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface NewsletterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
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

            if (!res.ok) throw new Error('Subscription failed');

            setStatus('success');
            setEmail('');

            // Auto-close after success
            setTimeout(() => {
                onClose();
                setStatus('idle');
            }, 2000);
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setStatus('error');
            setErrorMessage('Something went wrong. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white rounded-none shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200 border border-zinc-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors">
                    <X className="w-6 h-6" />
                </button>

                {status === 'success' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-stone-900 mb-2">You&apos;re In!</h3>
                        <p className="text-stone-600">
                            Check your inbox for a confirmation email.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-zinc-100 rounded-none flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-zinc-900" />
                            </div>
                            <h2 id="modal-title" className="text-3xl font-black text-zinc-900 mb-2 uppercase tracking-tighter">Join The Newsletter</h2>
                            <p className="text-zinc-600">
                                Get exclusive insights on peak performance, mental toughness, and new book releases.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setStatus('idle');
                                        setErrorMessage('');
                                    }}
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 rounded-none border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                                    disabled={status === 'loading'}
                                />
                            </div>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full px-8 py-4 bg-zinc-900 text-white font-black rounded-none hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest border border-transparent hover:border-zinc-500">
                                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            </button>

                            <p className="text-xs text-zinc-400 text-center">
                                We respect your privacy. Unsubscribe at any time.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
