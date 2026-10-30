'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { subscribeEmail } from '@/lib/subscribe';
import { KIT_FORM_RESET_GUIDE_ID, KIT_TAGS, RESET_GUIDE_PDF_PATH } from '@/lib/kit';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResetGuideSignupFormProps = {
    idPrefix?: string;
    formLocation?: string;
};

// Email signup for the free guide "The Reset Between Points". Uses the same
// client-side ConvertKit form post as the other signups (see lib/subscribe.ts),
// then reveals the PDF download on the page.
export default function ResetGuideSignupForm({
    idPrefix = 'reset-guide',
    formLocation = 'free_guide_reset',
}: ResetGuideSignupFormProps) {
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!EMAIL_PATTERN.test(email.trim())) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        try {
            await subscribeEmail(email.trim(), KIT_TAGS.resetGuide, formLocation, {
                firstName: firstName.trim(),
                formId: KIT_FORM_RESET_GUIDE_ID || undefined,
            });
            setStatus('success');
        } catch (error) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
        }
    }

    if (status === 'success') {
        return (
            <div className="space-y-5" aria-live="polite">
                <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-black uppercase tracking-widest text-sm">Thank you. Your guide is ready.</p>
                </div>
                <p className="text-zinc-600 leading-relaxed">
                    Download it below and keep it somewhere you can find it before training. The tracker on page 10 is made to be printed.
                </p>
                <a
                    href={RESET_GUIDE_PDF_PATH}
                    download
                    className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm hover:bg-black transition-colors"
                >
                    <Download className="w-4 h-4" /> Download the guide (PDF)
                </a>
                <p className="text-xs text-zinc-500">
                    If you also get a confirmation email, that is from my email provider. Your download is already here.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
            <div>
                <label htmlFor={`${idPrefix}-first-name`} className="sr-only">First name, optional</label>
                <input
                    id={`${idPrefix}-first-name`}
                    type="text"
                    name="first_name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name (optional)"
                    maxLength={80}
                    className="w-full px-4 py-3 border border-zinc-300 bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none"
                    disabled={status === 'loading'}
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor={`${idPrefix}-email`} className="sr-only">Email</label>
                <input
                    id={`${idPrefix}-email`}
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        if (status === 'error') setStatus('idle');
                    }}
                    placeholder="Email address"
                    className="flex-1 px-4 py-3 border border-zinc-300 bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none"
                    disabled={status === 'loading'}
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-3 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50"
                >
                    {status === 'loading' ? 'Sending...' : 'Get the guide'}
                </button>
            </div>
            {status === 'error' && (
                <p className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" /> {errorMessage}
                </p>
            )}
            <p className="text-xs text-zinc-500">
                Free. You&apos;ll also get my occasional emails on mental performance. Unsubscribe anytime.{' '}
                <Link href="/privacy" className="underline hover:text-zinc-900">Privacy</Link>
            </p>
        </form>
    );
}
