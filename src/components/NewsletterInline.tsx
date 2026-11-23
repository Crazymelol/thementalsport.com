'use client';

import ResetGuideSignupForm from '@/components/ResetGuideSignupForm';

export default function NewsletterInline({ formLocation = 'newsletter_inline' }: { formLocation?: string }) {
    return (
        <div className="bg-zinc-50 border border-zinc-200 p-8 md:p-12">
            <div className="max-w-2xl mx-auto mb-8">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Free guide</p>
                <h3 className="text-3xl font-black text-zinc-900 mb-4 uppercase tracking-tighter">
                    The Reset Between Points
                </h3>
                <p className="text-zinc-600 text-lg">
                    A free 11-page guide for the moment after a point. Lost a point? Reset before the next one starts.
                </p>
            </div>
            <ResetGuideSignupForm idPrefix={`inline-${formLocation}`} formLocation={formLocation} />
        </div>
    );
}
