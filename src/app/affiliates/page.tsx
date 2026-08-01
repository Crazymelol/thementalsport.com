import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, DollarSign, Link2, Share2, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Affiliate Program — Earn Up to 40% Sharing The Mental Sport',
    description: 'Get paid to share the mental-training books and course athletes actually need. Up to 40% per sale, tracked automatically. For coaches, athletes, and sports parents.',
    alternates: { canonical: 'https://thementalsport.com/affiliates' },
    openGraph: {
        type: 'website',
        url: 'https://thementalsport.com/affiliates',
        title: 'Become an Affiliate — The Mental Sport',
        description: 'Up to 40% per sale sharing mental-performance books and the course. Tracked automatically on Gumroad.',
        siteName: 'The Mental Sport',
    },
};

// Where "Apply" points. Email keeps it working today; swap for your Gumroad
// self-serve affiliate signup link once you enable affiliates on the products.
const APPLY_URL = 'mailto:hello@thementalsport.com?subject=Affiliate%20Application&body=Hi%20Giannis%2C%20I%27d%20like%20to%20become%20an%20affiliate.%20Here%27s%20where%20I%27ll%20share%20(handle%2Fsite)%3A';

export default function AffiliatesPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <section className="py-24 lg:py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,_rgba(220,38,38,0.15),_transparent_55%)]" />
                <div className="container mx-auto max-w-4xl relative text-center space-y-6">
                    <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-red-500">Affiliate Program</span>
                    <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                        Get Paid to Share<br /><span className="text-red-500">What Works</span>
                    </h1>
                    <p className="text-zinc-400 text-lg lg:text-xl max-w-2xl mx-auto">
                        You already talk to athletes, parents, and coaches. Point them to the mental training they need, and earn <strong className="text-white">up to 40% on every sale</strong>. Tracked automatically. Paid by Gumroad.
                    </p>
                    <div className="pt-4">
                        <a href={APPLY_URL} className="inline-flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all">
                            Apply to Join <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-center mb-14">Why promote it</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: DollarSign, t: 'Up to 40% per sale', d: 'High commission on 8 books ($12-17) and a $297 course. One course sale is real money.' },
                            { icon: Link2, t: 'Zero effort tracking', d: 'Gumroad gives you one link and tracks every click and sale automatically. No spreadsheets.' },
                            { icon: Share2, t: 'It sells itself', d: 'Every athlete and sports parent has a mental-game problem. You are handing them the fix, not pushing junk.' },
                        ].map((c, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 p-8">
                                <c.icon className="w-8 h-8 text-red-500 mb-4" />
                                <h3 className="text-xl font-black uppercase tracking-tight mb-2">{c.t}</h3>
                                <p className="text-zinc-400 leading-relaxed">{c.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-center mb-14">How it works</h2>
                    <ol className="space-y-6">
                        {[
                            ['Apply', 'Send a quick note with where you\'ll share (your handle, team, or site). Approval is fast.'],
                            ['Get your link', 'You receive a unique Gumroad affiliate link for the books and course.'],
                            ['Share it', 'Drop it in your bio, posts, videos, team chat, or emails. Talk about the mental game and point people to the fix.'],
                            ['Get paid', 'Gumroad tracks every sale from your link and pays your commission. That\'s it.'],
                        ].map(([t, d], i) => (
                            <li key={i} className="flex gap-5 items-start">
                                <span className="shrink-0 w-10 h-10 grid place-items-center bg-red-600 text-white font-black">{i + 1}</span>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">{t}</h3>
                                    <p className="text-zinc-400 leading-relaxed">{d}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-center mb-10">Who this is for</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {['Coaches and trainers', 'Athletes with a following', 'Sports parents and team accounts', 'Creators in the sports / fitness niche'].map((w, i) => (
                            <div key={i} className="flex gap-3 items-center bg-zinc-900 border border-zinc-800 p-5">
                                <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                                <span className="font-bold">{w}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 px-6 border-t border-zinc-800 text-center">
                <div className="container mx-auto max-w-2xl space-y-6">
                    <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">Start earning</h2>
                    <p className="text-zinc-400 text-lg">Share tools that actually help people, and get paid for it.</p>
                    <a href={APPLY_URL} className="inline-flex items-center gap-3 px-12 py-6 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base transition-all">
                        Apply to Join <ArrowRight className="w-5 h-5" />
                    </a>
                    <p className="text-zinc-600 text-sm pt-4">
                        Prefer to browse first? <Link href="/books" className="text-zinc-300 underline hover:text-white">See the books</Link> or the <Link href="/course" className="text-zinc-300 underline hover:text-white">course</Link>.
                    </p>
                </div>
            </section>
        </main>
    );
}
