'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { subscribeEmail } from '@/lib/subscribe';
import { KIT_FORM_PROTOCOL_ID, KIT_TAGS } from '@/lib/kit';
import { unlockProtocol } from '@/lib/protocolAccess';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ProtocolSignupFormProps = {
    /** Called after ConvertKit accepts the signup and the page is unlocked. */
    onUnlocked?: () => void;
    /** Show a link to the protocol page. Omit when this form is already on that page. */
    showReadLink?: boolean;
    submitLabel?: string;
    idPrefix?: string;
};

export default function ProtocolSignupForm({
    onUnlocked,
    showReadLink = false,
    submitLabel = 'Unlock the protocol',
    idPrefix = 'protocol',
}: ProtocolSignupFormProps) {
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
            await subscribeEmail(email.trim(), KIT_TAGS.protocol, 'protocol', {
                firstName: firstName.trim(),
                formId: KIT_FORM_PROTOCOL_ID || undefined,
            });
            unlockProtocol();
            setStatus('success');
            onUnlocked?.();
        } catch (error) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
        }
    }

    if (status === 'success') {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-black uppercase tracking-widest text-sm">Protocol unlocked</p>
                </div>
                <p className="text-zinc-600 text-sm">
                    It&apos;s open on this site now. If a confirmation email arrives, that&apos;s ConvertKit — the protocol is already unlocked here.
                </p>
                {showReadLink && (
                    <Link
                        href="/resources/competition-protocol"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm hover:bg-black transition-colors"
                    >
                        Read the protocol <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
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
                    className="w-full px-4 py-3 border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none"
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
                    className="flex-1 px-4 py-3 border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none"
                    disabled={status === 'loading'}
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-3 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50"
                >
                    {status === 'loading' ? 'Unlocking...' : submitLabel}
                </button>
            </div>
            {status === 'error' && (
                <p className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" /> {errorMessage}
                </p>
            )}
            <p className="text-xs text-zinc-500">
                No spam. Unsubscribe anytime.{' '}
                <Link href="/privacy" className="underline hover:text-zinc-900">Privacy</Link>
            </p>
        </form>
    );
}
