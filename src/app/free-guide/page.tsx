import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ResetGuideSignupForm from '@/components/ResetGuideSignupForm';

export const metadata: Metadata = {
    title: 'The Reset Between Points: Free Guide',
    description:
        'A free 11-page guide to the 15-second mental reset that stops one mistake from becoming three. For fencers and athletes in any sport, with pages for coaches and parents and a printable tracker.',
    alternates: { canonical: '/free-guide' },
    openGraph: {
        title: 'The Reset Between Points: Free Guide',
        description:
            'The 15-second mental reset that stops one mistake from becoming three. For athletes, coaches, and parents.',
        url: 'https://thementalsport.com/free-guide',
    },
};

const STEPS = [
    { name: 'Breathe', time: 'Seconds 0–5', line: 'One slow breath in, a longer breath out. The signal to your body that the point is over.' },
    { name: 'Release', time: 'Seconds 5–10', line: 'A small gesture and a short word that let the last point go. Acknowledge it, then put it down.' },
    { name: 'Refocus', time: 'Seconds 10–15', line: 'One simple cue for the next point. One, not five. Then step back into position.' },
];

const INSIDE = [
    'Why one mistake so often turns into three, and what is happening in that gap',
    'The reset at a glance: breathe, release, refocus in about 15 seconds',
    'Each step explained, with examples for fencing and other sports',
    'A cueing guide for coaches, for lessons and team sessions',
    'A page for parents on what to say after a mistake or a loss',
    'A printable two-week practice tracker',
];

const AUDIENCES = [
    {
        who: 'Coaches and clubs',
        line: 'A simple, shared routine you can cue in lessons and sessions, so your athletes recover the same way every time.',
    },
    {
        who: 'Sports parents',
        line: 'What the reset looks like from the stands, and how to talk with your child after a hard moment without adding pressure.',
    },
    {
        who: 'Young athletes',
        line: 'A short routine you can practise in training, so it is already there for you when a bout or match gets tight.',
    },
];

export default function FreeGuidePage() {
    return (
        <main className="min-h-screen bg-white text-zinc-900">
            {/* Hero + signup */}
            <section className="bg-zinc-950 text-white pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Free guide · 11 pages · PDF</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                        The Reset Between Points
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-300 max-w-2xl leading-relaxed">
                        A free 11-page guide to the 15-second mental reset that stops one mistake from becoming three.
                        For fencers and athletes in any sport, with pages for coaches and parents and a printable tracker.
                    </p>
                </div>
            </section>

            <section id="get-the-guide" className="py-16 px-6 bg-zinc-50 border-b border-zinc-200">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Get your free copy</h2>
                        <p className="text-zinc-600 leading-relaxed mb-6">
                            Enter your email and the download appears right here on the page.
                        </p>
                        <ResetGuideSignupForm idPrefix="free-guide" />
                    </div>
                    <div className="border-l-4 border-zinc-900 pl-6">
                        <p className="text-zinc-700 leading-relaxed italic">
                            &ldquo;As a fencing coach, the moment I watch most closely is not the touch itself. It is the walk back to the
                            en-garde line afterwards. Most of us were never taught what to do in that gap. This guide gives you the
                            instructions.&rdquo;
                        </p>
                        <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-500">Giannis Notaras</p>
                    </div>
                </div>
            </section>

            {/* The reset */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">The reset, in 15 seconds</h2>
                    <p className="text-zinc-500 mb-12 text-lg max-w-2xl">
                        It will not make mistakes disappear. It is a small habit you build in training, so the way back is already familiar when it matters.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {STEPS.map((step) => (
                            <div key={step.name} className="border border-zinc-200 p-6">
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">{step.time}</p>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-3">{step.name}</h3>
                                <p className="text-zinc-600 text-sm leading-relaxed">{step.line}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What's inside */}
            <section className="py-20 px-6 bg-zinc-950 text-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-10">What&apos;s inside</h2>
                    <ul className="space-y-4">
                        {INSIDE.map((item) => (
                            <li key={item} className="flex gap-4 text-zinc-300 leading-relaxed">
                                <span className="mt-2 w-2 h-2 bg-red-600 flex-shrink-0" aria-hidden="true"></span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Who it's for */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-10">Who it&apos;s for</h2>
                    <div className="space-y-8">
                        {AUDIENCES.map((a) => (
                            <div key={a.who} className="border-l-4 border-zinc-950 pl-6">
                                <p className="font-black text-lg mb-2">{a.who}</p>
                                <p className="text-zinc-600 leading-relaxed">{a.line}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Soft lead to the course */}
            <section className="py-16 px-6 bg-zinc-50 border-t border-zinc-200">
                <div className="max-w-4xl mx-auto md:flex md:items-center md:justify-between gap-8">
                    <p className="text-zinc-600 leading-relaxed max-w-2xl mb-6 md:mb-0">
                        The reset is one small piece of a bigger picture. If you find it useful, my course,{' '}
                        <strong className="text-zinc-900">The Mental Performance Protocol</strong>, brings the full system together.
                    </p>
                    <Link
                        href="/course"
                        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:text-zinc-600 transition-colors whitespace-nowrap"
                    >
                        About the course <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </main>
    );
}
