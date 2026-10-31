import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Star, ArrowRight, Lock, Award } from 'lucide-react';
import { Metadata } from 'next';
import CheckoutLink from '@/components/CheckoutLink';
import { COURSE, COURSE_PAGE_DRAFT } from '@/data/course';

export const metadata: Metadata = {
    title: 'The Mental Performance Protocol | 8-Week Course',
    description: 'The complete 8-week mental performance system for athletes. Build unshakable confidence, eliminate competition anxiety, and dominate your sport.',
    keywords: ['mental performance course', 'sports psychology course', 'mental toughness training', 'athlete mindset course'],
    openGraph: {
        title: 'The Mental Performance Protocol — 8-Week Online Course',
        description: 'An 8-week mental performance course from Giannis Notaras. Lifetime access.',
        type: 'website',
    },
};

const modules = [
    { num: 1, title: 'Foundation: The Inner Game' },
    { num: 2, title: 'The Competition Protocol (T-Minus 7)' },
    { num: 3, title: 'Resilient Confidence' },
    { num: 4, title: 'Visualizing Disaster (and recovering)' },
    { num: 5, title: 'Breath, Rituals, and Flow Triggers' },
    { num: 6, title: 'The Physiology Layer' },
    { num: 7, title: 'Mental Toughness in Real Time' },
    { num: 8, title: 'Mastery & Mentorship' },
];

const included = [
    'The Mental Performance Protocol',
    ...COURSE_PAGE_DRAFT.bonuses,
    'Lifetime access',
    '30-day money-back guarantee',
];

export default function CoursePage() {
    return (
        <main className="min-h-screen bg-white">
            <section className="bg-zinc-950 text-white py-16 lg:py-28 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(220,38,38,0.15),_transparent_50%)]"></div>
                <div className="container mx-auto px-6 max-w-5xl text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-black uppercase tracking-[0.2em]">
                        <Star className="w-3 h-3 fill-current" /> New Release 2026
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                        The Mental Performance<br />
                        <span className="text-red-500">Protocol</span>
                    </h1>
                    <p className="text-lg sm:text-xl lg:text-2xl text-zinc-400 max-w-2xl mx-auto">
                        The 8-week system elite athletes use to <strong className="text-white">build unshakable confidence, eliminate competition anxiety, and dominate their sport.</strong>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <CheckoutLink href={COURSE.checkoutUrl} productName={COURSE.name} price={COURSE.price} className="px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2">
                            Enroll Now — ${COURSE.price} <ArrowRight className="w-4 h-4" />
                        </CheckoutLink>
                        <a href="#curriculum" className="px-10 py-5 border-2 border-zinc-700 hover:border-white text-white font-black uppercase tracking-widest text-sm transition-all">
                            See What&apos;s Inside
                        </a>
                    </div>
                    <p className="text-zinc-500 text-sm pt-2">Lifetime access • 30-day money-back guarantee</p>
                </div>
            </section>

            <section className="py-12 sm:py-16 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-3xl">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tighter mb-6">
                        {COURSE_PAGE_DRAFT.coach.heading}
                    </h2>
                    <div className="space-y-4">
                        <p className="text-lg sm:text-xl text-zinc-900 font-medium leading-relaxed">
                            {COURSE_PAGE_DRAFT.coach.lead}
                        </p>
                        <p className="text-base sm:text-lg text-zinc-700 leading-relaxed">
                            {COURSE_PAGE_DRAFT.coach.support}
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24 container mx-auto px-6 max-w-5xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tighter text-center mb-12 sm:mb-16">
                    This Course Is For You If...
                </h2>
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
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
                            <p className="text-base sm:text-lg text-zinc-700 font-medium">{item}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="curriculum" className="py-16 sm:py-24 bg-zinc-50 border-y border-zinc-200">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="text-center mb-12 sm:mb-16">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">The Curriculum</p>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tighter">8 Modules.</h2>
                        <p className="text-red-600 text-sm font-bold mt-4">{COURSE_PAGE_DRAFT.lessonCountPlaceholder}</p>
                        <p className="text-zinc-600 text-base sm:text-lg mt-4">Self-paced. Lifetime access. Progress at your own speed.</p>
                    </div>
                    <div className="space-y-4">
                        {modules.map((m) => (
                            <div key={m.num} className="bg-white p-5 sm:p-6 border border-zinc-200 hover:border-zinc-900 transition-all flex items-center gap-4 sm:gap-6">
                                <div className="text-3xl sm:text-4xl font-black text-zinc-200">{String(m.num).padStart(2, '0')}</div>
                                <h3 className="flex-1 text-lg sm:text-xl font-black text-zinc-900 uppercase tracking-tight">{m.title}</h3>
                                <Lock className="w-5 h-5 text-zinc-300 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24 container mx-auto px-6 max-w-3xl">
                <div className="text-center mb-12 sm:mb-16">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 mb-4">Here&apos;s Everything You Get</p>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tighter">The Complete System</h2>
                </div>
                <div className="space-y-3">
                    <div className="bg-zinc-950 text-white p-5 sm:p-6 flex items-center gap-3 border-l-4 border-red-600">
                        <Award className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="font-bold text-sm md:text-base">{COURSE.name}</p>
                    </div>
                    {COURSE_PAGE_DRAFT.bonuses.map((title) => (
                        <div key={title} className="bg-zinc-900 text-white p-5 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="font-bold text-sm md:text-base">{title}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-8 text-center">
                    <p className="text-zinc-900 text-2xl font-black uppercase tracking-tight">The course: <span className="text-red-600">${COURSE.price}</span></p>
                    <CheckoutLink href={COURSE.checkoutUrl} productName={COURSE.name} price={COURSE.price} className="mt-8 inline-flex items-center gap-2 px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all">
                        Enroll Now — ${COURSE.price} <ArrowRight className="w-4 h-4" />
                    </CheckoutLink>
                    <p className="text-zinc-400 text-xs mt-4">Lifetime access • 30-day money-back guarantee</p>
                </div>
            </section>

            <section className="py-16 sm:py-24 bg-zinc-950 text-white">
                <div className="container mx-auto px-6 max-w-xl">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter">Enroll Today</h2>
                    </div>
                    <div className="p-6 sm:p-8 border-2 border-red-600 bg-red-950/20 flex flex-col">
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Everything, One Price</h3>
                        <div className="text-5xl font-black mb-6 mt-4">${COURSE.price}</div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {included.map((f) => (
                                <li key={f} className="flex gap-2 text-zinc-300 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> {f}
                                </li>
                            ))}
                        </ul>
                        <CheckoutLink href={COURSE.checkoutUrl} productName={COURSE.name} price={COURSE.price} className="w-full py-4 text-center font-black uppercase tracking-widest text-sm transition-all bg-red-600 hover:bg-red-700">
                            Get Standard
                        </CheckoutLink>
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24 container mx-auto px-6 max-w-3xl text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-100 mb-6 rounded-full">
                    <Award className="w-10 h-10 text-zinc-900" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-zinc-900 uppercase tracking-tighter mb-4">
                    30-Day Money-Back Guarantee
                </h2>
                <p className="text-base sm:text-lg text-zinc-700 leading-relaxed">
                    If after 30 days the protocol hasn&apos;t given you a measurable mental edge, email me directly. I&apos;ll refund every dollar. No questions, no friction.
                </p>
            </section>

            <section className="py-16 sm:py-24 bg-zinc-950 text-white text-center">
                <div className="container mx-auto px-6 max-w-3xl">
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-6">
                        Stop Losing Games in Your Head.
                    </h2>
                    <p className="text-lg sm:text-xl text-zinc-400 mb-10">
                        Build the mental system that holds when everything else falls apart.
                    </p>
                    <CheckoutLink href={COURSE.checkoutUrl} productName={COURSE.name} price={COURSE.price} className="inline-flex items-center justify-center gap-2 px-10 sm:px-12 py-5 sm:py-6 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm sm:text-base transition-all">
                        Enroll Now — ${COURSE.price} <ArrowRight className="w-5 h-5" />
                    </CheckoutLink>
                    <p className="text-zinc-500 text-sm mt-6">Lifetime access • 30-day guarantee</p>
                </div>
            </section>

            <footer className="bg-zinc-950 text-zinc-500 py-12 text-center text-sm border-t border-zinc-900">
                <Link href="/" className="hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">← Back to The Mental Sport</Link>
                <p className="mt-6">&copy; 2026 Giannis Notaras. Build The Mindset.</p>
            </footer>
        </main>
    );
}
