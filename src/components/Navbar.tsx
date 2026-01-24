'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for navbar background
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setIsOpen(false); // Close mobile menu if open
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav
            className={`fixed w-full z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/95 backdrop-blur-md shadow-sm py-4 text-stone-900'
                : 'bg-transparent py-6 text-white'
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-2xl font-black uppercase tracking-tighter custom-kerning">
                    The Mental Sport
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <a
                        href="#books"
                        onClick={(e) => scrollToSection(e, 'books')}
                        className={`text-xs font-black uppercase tracking-[0.2em] hover:text-zinc-500 transition-colors ${!scrolled && 'hover:text-zinc-300'
                            }`}
                    >
                        Books
                    </a>
                    <a
                        href="#about"
                        onClick={(e) => scrollToSection(e, 'about')}
                        className={`text-xs font-black uppercase tracking-[0.2em] hover:text-zinc-500 transition-colors ${!scrolled && 'hover:text-zinc-300'
                            }`}
                    >
                        About
                    </a>
                    <button
                        onClick={() => {
                            // Scroll to footer
                            const footer = document.querySelector('footer');
                            footer?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-6 py-2 rounded-none font-bold text-xs uppercase tracking-widest transition-all ${scrolled
                            ? 'bg-zinc-900 text-white hover:bg-black'
                            : 'bg-white text-zinc-900 hover:bg-zinc-200'
                            }`}
                    >
                        Newsletter
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-stone-900 text-white py-6 shadow-xl md:hidden">
                    <div className="flex flex-col space-y-4 px-6">
                        <a
                            href="#books"
                            onClick={(e) => scrollToSection(e, 'books')}
                            className="text-2xl font-black uppercase tracking-tighter text-white hover:text-zinc-400"
                        >
                            Books
                        </a>
                        <a
                            href="#about"
                            onClick={(e) => scrollToSection(e, 'about')}
                            className="text-2xl font-black uppercase tracking-tighter text-white hover:text-zinc-400"
                        >
                            About
                        </a>
                        <button
                            className="text-left text-2xl font-black uppercase tracking-tighter text-white hover:text-zinc-400"
                            onClick={() => {
                                setIsOpen(false);
                                document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Newsletter
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
