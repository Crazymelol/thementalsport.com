'use client';

import React from 'react';
import { X } from 'lucide-react';
import ResetGuideSignupForm from '@/components/ResetGuideSignupForm';

interface NewsletterModalProps {
    isOpen: boolean;
    onClose: () => void;
    formLocation?: string;
    variant?: 'newsletter' | 'protocol';
}

export default function NewsletterModal({
    isOpen,
    onClose,
    formLocation = 'newsletter_modal',
    variant = 'newsletter',
}: NewsletterModalProps) {
    if (!isOpen) return null;

    const location = variant === 'protocol' ? 'protocol_reset' : formLocation;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white rounded-none shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200 border border-zinc-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Free guide</p>
                    <h2 id="modal-title" className="text-3xl font-black text-zinc-900 mb-2 uppercase tracking-tighter">The Reset Between Points</h2>
                    <p className="text-zinc-600">Lost a point? Reset before the next one starts.</p>
                </div>
                <ResetGuideSignupForm idPrefix="modal-reset" formLocation={location} />
            </div>
        </div>
    );
}
