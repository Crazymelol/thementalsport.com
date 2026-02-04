'use client';

import React, { useEffect, useState } from 'react';
import NewsletterModal from './NewsletterModal';

export default function ExitIntentPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            // Check if already triggered in this session
            const isTriggered = sessionStorage.getItem('exitIntentTriggered');

            // Only trigger if mouse leaves the top of the viewport and hasn't triggered yet
            if (e.clientY <= 0 && !isTriggered && !hasTriggered) {
                setIsOpen(true);
                setHasTriggered(true);
                sessionStorage.setItem('exitIntentTriggered', 'true');
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [hasTriggered]);

    return (
        <NewsletterModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
        />
    );
}
