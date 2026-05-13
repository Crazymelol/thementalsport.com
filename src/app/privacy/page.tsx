import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | The Mental Sport',
    description: 'Privacy Policy for The Mental Sport — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-white">
            <section className="bg-zinc-950 text-white py-20 text-center">
                <div className="container mx-auto px-6 max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Legal</p>
                    <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter">Privacy Policy</h1>
                    <p className="text-zinc-400 mt-4">Last updated: May 13, 2026</p>
                </div>
            </section>

            <section className="py-20 container mx-auto px-6 max-w-3xl">
                <div className="space-y-8 text-zinc-700 leading-relaxed">
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Who We Are</h2>
                        <p>The Mental Sport (thementalsport.com) is owned and operated by Giannis Notaras, a mental performance expert and author of mental performance books for athletes. Contact: notarasioannis@gmail.com.</p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Email address</strong> — when you subscribe to our newsletter or download free chapters via our opt-in forms.</li>
                            <li><strong>Name (optional)</strong> — when provided through our contact or signup forms.</li>
                            <li><strong>Usage data</strong> — anonymous analytics about how visitors interact with our site.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To send you the requested content (free chapters, newsletter)</li>
                            <li>To send educational emails about mental performance, our books, and our courses</li>
                            <li>To improve our website and content</li>
                            <li>To respond to your inquiries</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Third-Party Services</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Kit (formerly ConvertKit)</strong> — to manage our email list. <a href="https://kit.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Kit Privacy Policy</a></li>
                            <li><strong>Vercel</strong> — to host our website. <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></li>
                            <li><strong>Amazon</strong> — books are sold and fulfilled by Amazon. Their privacy policy applies to book purchases.</li>
                            <li><strong>Pinterest, LinkedIn, Instagram</strong> — used for content distribution. Their respective privacy policies apply.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Your Rights</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Unsubscribe</strong> from our emails at any time using the link in any email.</li>
                            <li><strong>Request deletion</strong> of your data by emailing notarasioannis@gmail.com.</li>
                            <li><strong>Access</strong> the personal data we hold about you.</li>
                            <li><strong>Correct</strong> any inaccurate information.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Cookies</h2>
                        <p>We use minimal cookies for essential site functionality and anonymous analytics. We do not use cookies for advertising or tracking across other sites.</p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Data Security</h2>
                        <p>We use industry-standard security measures to protect your data. All data transmitted through our website is encrypted via HTTPS.</p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Children&apos;s Privacy</h2>
                        <p>Our services are not directed at children under 13. We do not knowingly collect personal information from children under 13.</p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Changes to This Policy</h2>
                        <p>We may update this privacy policy from time to time. The latest version will always be available at this URL.</p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">Contact</h2>
                        <p><strong>Giannis Notaras</strong><br />
                            <a href="mailto:notarasioannis@gmail.com" className="text-blue-600 underline">notarasioannis@gmail.com</a></p>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-zinc-200">
                    <Link href="/" className="text-sm font-black uppercase tracking-widest text-zinc-900 hover:text-zinc-600">← Back to home</Link>
                </div>
            </section>
        </main>
    );
}
