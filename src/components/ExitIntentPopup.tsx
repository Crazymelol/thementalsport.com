'use client';

import React, { useEffect, useState, useCallback } from 'react';
import NewsletterModal from './NewsletterModal';

export default function ExitIntentPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    const trigger = useCallback(() => {
        if (sessionStorage.getItem('exitIntentTriggered')) return;
        setIsOpen(true);
        setHasTriggered(true);
        sessionStorage.setItem('exitIntentTriggered', 'true');
    }, []);

    useEffect(() => {
        if (sessionStorage.getItem('exitIntentTriggered') || hasTriggered) return;

        // Desktop: trigger when mouse leaves top of viewport
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) trigger();
        };

        // Mobile + all devices: trigger after 45 seconds of browsing
        const timer = setTimeout(trigger, 45000);

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearTimeout(timer);
        };
    }, [hasTriggered, trigger]);

    return (
        <NewsletterModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
        />
    );
}
