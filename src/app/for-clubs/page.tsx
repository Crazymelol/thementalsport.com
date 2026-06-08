import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Mental Conditioning for Sports Clubs & Academies',
    description: 'Done-for-you mental conditioning programs for competitive sports clubs and academies. Reduce choking, build pressure-proof athletes, and win the moments that matter.',
};

const PAIN_POINTS = [
    {
        problem: 'Technically superior squad that underperforms at major tournaments',
        cause: 'No system for managing competitive anxiety and pressure spikes',
    },
    {
        problem: 'Athletes who perform brilliantly in training but collapse in competition',
        cause: 'Training environment doesn\'t replicate competitive psychological demands',
    },
    {
        problem: 'One error cascading into multiple errors in high-stakes moments',
        cause: 'No error recovery protocol — athletes carry mistakes instead of resetting',
    },
    {
        problem: 'Inconsistent performances across a competitive season',
        cause: 'Mental state is unmanaged — athletes arrive to competition in random psychological conditions',
    },
];

const PROGRAM_PHASES = [
    {
        month: 'Month 1',
        title: 'Baseline Assessment',
        items: [
            'Individual mental skills profiling for every athlete',
            'Identify performance limiters: anxiety type, attentional style, confidence structure',
            'Pre-competition routine foundations established',
        ],
    },
    {
        month: 'Months 2–3',
        title: 'Core Skill Installation',
        items: [
            'Pressure simulation training protocols',
            'Error recovery systems embedded into existing sessions',
            'Self-talk restructuring for each athlete\'s profile',
        ],
    },
    {
        month: 'Months 4–5',
        title: 'Competition Application',
        items: [
            'In-competition mental skills reinforcement',
            'Post-competition mental performance debrief',
            'Collective efficacy building for team sports',
        ],
    },
    {
        month: 'Month 6',
        title: 'Autonomy Transfer',
        items: [
            'Athletes run their own mental routines independently',
            'Coaching staff trained to maintain the system',
            'Program documented for ongoing use',
        ],
    },
];

const PROOF_POINTS = [
    { stat: '34%', label: 'Fewer tournament performance collapses in clubs with structured mental conditioning programs' },
    { stat: '23–40%', label: 'Improvement in competition performance metrics after 6-month implementation' },
    { stat: '3', label: 'New club partnerships per quarter — limited intentionally to maintain quality' },
];

export default function ForClubsPage() {
    return (
        <main className="min-h-screen bg-white text-zinc-900">

            {/* Hero */}
            <section className="bg-zinc-950 text-white py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">
                        For Sports Clubs & Academies
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight mb-8">
                        YOUR ATHLETES HAVE THE TALENT.<br />
                        <span className="text-zinc-400">DO THEY HAVE THE MENTAL SYSTEM?</span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mb-10 leading-relaxed">
                        Done-for-you mental conditioning programs for competitive sports clubs and academies.
                        Integrated into your existing training calendar. Built to run after we leave.
                    </p>
                    <a
                        href="mailto:hello@thementalsport.com?subject=Club Assessment Request"
                        className="inline-block bg-white text-zinc-950 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors"
                    >
                        Request Free Assessment →
                    </a>
                    <p className="mt-4 text-zinc-500 text-sm">30 minutes. No pitch. A diagnostic of your team's mental performance gaps.</p>
                </div>
            </section>

            {/* Proof Points */}
            <section className="py-16 px-6 bg-zinc-100">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PROOF_POINTS.map((p) => (
                        <div key={p.stat} className="text-center">
                            <div className="text-5xl font-black text-zinc-950 mb-3">{p.stat}</div>
                            <p className="text-sm text-zinc-600 leading-relaxed">{p.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pain Points */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
                        DOES THIS SOUND FAMILIAR?
                    </h2>
                    <p className="text-zinc-500 mb-12 text-lg">
                        These are not talent problems. They are training gaps.
                    </p>
                    <div className="space-y-8">
                        {PAIN_POINTS.map((p, i) => (
                            <div key={i} className="border-l-4 border-zinc-950 pl-6">
                                <p className="font-black text-lg mb-2">{p.problem}</p>
                                <p className="text-zinc-500 text-sm">Root cause: {p.cause}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Program */}
            <section className="py-20 px-6 bg-zinc-950 text-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
                        WHAT A REAL PROGRAM LOOKS LIKE
                    </h2>
                    <p className="text-zinc-400 mb-12 text-lg max-w-2xl">
                        Not a workshop. Not a seminar. Structural change integrated into your existing training calendar.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {PROGRAM_PHASES.map((phase) => (
                            <div key={phase.month} className="border border-zinc-800 p-8">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{phase.month}</p>
                                <h3 className="text-xl font-black uppercase mb-6">{phase.title}</h3>
                                <ul className="space-y-3">
                                    {phase.items.map((item, i) => (
                                        <li key={i} className="text-zinc-400 text-sm flex gap-3">
                                            <span className="text-white mt-0.5 shrink-0">→</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Who It's For */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-12">
                        WHO THIS IS FOR
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Competitive Youth Academies', desc: 'Clubs developing athletes aged 12–21 for national or professional pathways. Building the mental infrastructure early creates compounding advantages.' },
                            { title: 'Elite Amateur Clubs', desc: 'Competitive organizations at national or high regional level where performance under pressure determines outcomes — and where the physical gap between teams is marginal.' },
                            { title: 'Sports Organizations & Federations', desc: 'National-level bodies seeking to implement mental performance standards across member clubs and coaching education programs.' },
                        ].map((item) => (
                            <div key={item.title} className="bg-zinc-50 p-8">
                                <h3 className="font-black uppercase text-base mb-4">{item.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 bg-zinc-950 text-white text-center">
                <div className="max-w-2xl mx-auto">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">
                        3 Spots Available This Quarter
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase mb-6">
                        START WITH A FREE DIAGNOSTIC
                    </h2>
                    <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
                        30 minutes. We map your club's current mental performance gaps and show you exactly what a structured program would address. No pitch until you ask for one.
                    </p>
                    <a
                        href="mailto:hello@thementalsport.com?subject=Club Assessment Request&body=Club name:%0AYour role:%0ASport:%0ASquad size:%0ABiggest mental performance challenge:"
                        className="inline-block bg-white text-zinc-950 px-10 py-5 text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors mb-6"
                    >
                        Request Free Assessment →
                    </a>
                    <p className="text-zinc-600 text-sm">
                        Or follow{' '}
                        <a href="https://instagram.com/mentalsportpro" className="text-zinc-400 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                            @mentalsportpro
                        </a>
                        {' '}on Instagram for weekly frameworks.
                    </p>
                </div>
            </section>

            {/* Nav back */}
            <div className="py-8 px-6 text-center bg-zinc-100">
                <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 transition-colors">
                    ← TheMentalSport.com
                </Link>
            </div>
        </main>
    );
}
