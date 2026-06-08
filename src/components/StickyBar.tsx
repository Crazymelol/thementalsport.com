'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import NewsletterModal from './NewsletterModal';

export default function StickyBar() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('stickyBarDismissed')) {
            setDismissed(true);
            return;
        }
        const timer = setTimeout(() => setVisible(true), 20000);
        return () => clearTimeout(timer);
    }, []);

    function dismiss() {
        setDismissed(true);
        localStorage.setItem('stickyBarDismissed', 'true');
    }

    if (dismissed || !visible) return null;

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 text-white border-t-2 border-red-600 shadow-2xl animate-in slide-in-from-bottom duration-500">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 max-w-5xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-red-600 flex items-center justify-center flex-shrink-0">
                            <Download className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold truncate">
                            <span className="text-red-400">FREE:</span> Chapter 1 of The Competition Protocol — The Biology of Choking
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => setModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest px-4 py-2 transition-colors whitespace-nowrap">
                            Get It Free
                        </button>
                        <button
                            onClick={dismiss}
                            className="text-zinc-500 hover:text-white transition-colors p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            <NewsletterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}
