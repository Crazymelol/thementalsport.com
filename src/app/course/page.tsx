import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Star, ArrowRight, Lock, Clock, BookOpen, Award } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Mental Performance Protocol | 8-Week Course',
    description: 'The complete 8-week mental performance system for athletes. Build unshakable confidence, eliminate competition anxiety, and dominate your sport.',
    keywords: ['mental performance course', 'sports psychology course', 'mental toughness training', 'athlete mindset course'],
    openGraph: {
        title: 'The Mental Performance Protocol — 8-Week Online Course',
        description: 'Build the mental edge elite athletes use. 8 modules, 36 video lessons, lifetime access.',
        type: 'website',
    },
};

const CHECKOUT_STANDARD = 'https://wzawde-yw.myshopify.com/cart/53608319811927:1';
const CHECKOUT_PREMIUM = 'https://wzawde-yw.myshopify.com/cart/53804113494359:1';
const CHECKOUT_ELITE = 'https://wzawde-yw.myshopify.com/cart/53804113527127:1';

const modules = [
    { num: 1, title: 'Foundation: The Inner Game', lessons: 4, time: '32 min' },
    { num: 2, title: 'The Competition Protocol (T-Minus 7)', lessons: 7, time: '42 min' },
    { num: 3, title: 'Resilient Confidence', lessons: 4, time: '40 min' },
    { num: 4, title: 'Visualizing Disaster (and recovering)', lessons: 3, time: '36 min' },
    { num: 5, title: 'Breath, Rituals, and Flow Triggers', lessons: 5, time: '40 min' },
    { num: 6, title: 'The Physiology Layer', lessons: 4, time: '40 min' },
    { num: 7, title: 'Mental Toughness in Real Time', lessons: 5, time: '40 min' },
    { num: 8, title: 'Mastery & Mentorship', lessons: 4, time: '40 min' },
];

const bonuses = [
    { title: 'All 8 books (PDF)', value: '$89' },
    { title: '30-day Mental Performance Journal', value: '$29' },
    { title: 'Audio version of every lesson', value: '$49' },
    { title: 'Private Discord community', value: 'Priceless' },
    { title: 'Monthly live Q&A (6 months)', value: '$297' },
];

export default function CoursePage() {
    return (
        <main className="min-h-screen bg-white">
            <section className="bg-zinc-950 text-white py-20 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(220,38,38,0.15),_transparent_50%)]"></div>
                <div className="container mx-auto px-6 max-w-5xl text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-black uppercase tracking-[0.2em]">
                        <Star className="w-3 h-3 fill-current" /> New Release 2026
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                        The Mental Performance<br />
                        <span className="text-red-500">Protocol</span>
                    </h1>
                    <p className="text-xl lg:text-2xl text-zinc-400 max-w-2xl mx-auto">
                        The 8-week system elite athletes use to <strong className="text-white">build unshakable confidence, eliminate competition anxiety, and dominate their sport.</strong>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                        <a href={CHECKOUT_STANDARD} target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2">
                            Enroll Now — $297 <ArrowRight className="w-4 h-4" />
                        </a>
                        <a href="#curriculum" className="px-10 py-5 border-2 border-zinc-700 hover:border-white text-white font-black uppercase tracking-widest text-sm transition-all">
                            See What&apos;s Inside
                        </a>
                    </div>
                    <p className="text-zinc-500 text-sm pt-2">⚡ Lifetime access • 30-day money-back guarantee</p>
                </div>
            </section>

            <section className="py-12 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mb-8">Methodologies trusted by athletes in</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20">
                        {['NBA', 'NFL', 'MLB', 'NCAA', 'OLYMPICS'].map(l => (
                            <span key={l} className="text-3xl font-black text-zinc-900 tracking-tighter">{l}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 container mx-auto px-6 max-w-5xl">
                <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tighter text-center mb-16">
                    This Course Is For You If...
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {[
                        'You freeze, choke, or tighten up at the moment that matters most',
                        'You train hard physically but performance doesn\'t match effort',
                        'You can\'t shut off the inner critic mid-competition',
                        'You\'re a coach or parent who wants to give your athlete a real edge',
                        'You want a step-by-step protocol — not vague motivational advice',
                        'You\'re ready to do the work to become unbreakable',
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <CheckCircle2 className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                            <p className="text-lg text-zinc-700 font-medium">{item}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="curriculum" className="py-24 bg-zinc-50 border-y border-zinc-200">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="text-center mb-16">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">The Curriculum</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tighter">8 Modules. 36 Video Lessons.</h2>
                        <p className="text-zinc-600 text-lg mt-4">Self-paced. Lifetime access. Progress at your own speed.</p>
                    </div>
                    <div className="space-y-4">
                        {modules.map((m) => (
                            <div key={m.num} className="bg-white p-6 border border-zinc-200 hover:border-zinc-900 transition-all flex items-center gap-6">
                                <div className="text-4xl font-black text-zinc-200">{String(m.num).padStart(2, '0')}</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{m.title}</h3>
                                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-4">
                                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {m.lessons} lessons</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.time}</span>
                                    </p>
                                </div>
                                <Lock className="w-5 h-5 text-zinc-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 container mx-auto px-6 max-w-5xl">
                <div className="text-center mb-16">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 mb-4">$464 in Bonuses Included</p>
                    <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tighter">Everything You Need</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {bonuses.map((b, i) => (
                        <div key={i} className="bg-zinc-950 text-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Award className="w-5 h-5 text-red-500" />
                                <p className="font-bold">{b.title}</p>
                            </div>
                            <span className="text-zinc-400 font-mono text-sm">{b.value}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="py-24 bg-zinc-950 text-white">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">Choose Your Path</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: 'Standard', price: '$297', features: ['All 8 modules (36 video lessons)', 'All 5 bonuses', 'Lifetime access', 'Self-paced'], cta: 'Get Standard', highlight: false, checkoutUrl: CHECKOUT_STANDARD },
                            { name: 'Premium', price: '$497', features: ['Everything in Standard', '3× 1-on-1 coaching calls (60 min)', 'Priority email support', 'Custom mental performance plan'], cta: 'Get Premium', highlight: true, checkoutUrl: CHECKOUT_PREMIUM },
                            { name: 'Elite', price: '$1,497', features: ['Everything in Premium', '90-day group coaching cohort', 'Weekly live group calls', 'Direct access to Giannis'], cta: 'Apply for Elite', highlight: false, checkoutUrl: CHECKOUT_ELITE },
                        ].map((tier) => (
                            <div key={tier.name} className={`p-8 border-2 ${tier.highlight ? 'border-red-600 bg-red-950/20' : 'border-zinc-800'} flex flex-col`}>
                                {tier.highlight && (
                                    <div className="text-xs font-black uppercase tracking-widest text-red-500 mb-2">Most Popular</div>
                                )}
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{tier.name}</h3>
                                <div className="text-5xl font-black my-6">{tier.price}</div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((f, i) => (
                                        <li key={i} className="flex gap-2 text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <a href={tier.checkoutUrl} target="_blank" rel="noopener noreferrer" className={`w-full py-4 text-center font-black uppercase tracking-widest text-sm transition-all ${tier.highlight ? 'bg-red-600 hover:bg-red-700' : 'bg-white text-zinc-900 hover:bg-zinc-200'}`}>
                                    {tier.cta}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 container mx-auto px-6 max-w-3xl text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-100 mb-6 rounded-full">
                    <Award className="w-10 h-10 text-zinc-900" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-zinc-900 uppercase tracking-tighter mb-4">
                    30-Day Money-Back Guarantee
                </h2>
                <p className="text-lg text-zinc-700 leading-relaxed">
                    If after 30 days the protocol hasn&apos;t given you a measurable mental edge, email me directly. I&apos;ll refund every dollar. No questions, no friction.
                </p>
            </section>

            <section className="py-24 bg-zinc-950 text-white text-center">
                <div className="container mx-auto px-6 max-w-3xl">
                    <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-6">
                        Stop Losing Games in Your Head.
                    </h2>
                    <p className="text-xl text-zinc-400 mb-10">
                        Build the mental system that holds when everything else falls apart.
                    </p>
                    <a href={CHECKOUT_STANDARD} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-12 py-6 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base transition-all">
                        Enroll Now — $297 <ArrowRight className="w-5 h-5" />
                    </a>
                    <p className="text-zinc-500 text-sm mt-6">Lifetime access • 30-day guarantee • Start today</p>
                </div>
            </section>

            <footer className="bg-zinc-950 text-zinc-500 py-12 text-center text-sm border-t border-zinc-900">
                <Link href="/" className="hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">← Back to The Mental Sport</Link>
                <p className="mt-6">&copy; 2026 Giannis Notaras. Build The Mindset.</p>
            </footer>
        </main>
    );
}
