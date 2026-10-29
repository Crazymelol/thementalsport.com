'use client';

import React, { useState } from 'react';
import NewsletterModal from '@/components/NewsletterModal';

export default function NewsletterWrapper({
    children,
    className = "",
    formLocation = "newsletter_modal",
}: {
    children: React.ReactNode,
    className?: string,
    formLocation?: string,
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={className}>
                {children}
            </button>
            <NewsletterModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                formLocation={formLocation}
            />
        </>
    );
}
