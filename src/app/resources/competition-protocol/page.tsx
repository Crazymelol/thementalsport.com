'use client';

import React, { useRef } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function CompetitionProtocolGuide() {
    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    return (
        <main className="min-h-screen bg-stone-50 print:bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white print:text-black">
            {/* Navigation - Hidden on Print */}
            <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 p-4 z-50 print:hidden">
                <div className="container mx-auto max-w-4xl flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-zinc-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors rounded-none">
                        <Printer className="w-4 h-4" /> Print / Save as PDF
                    </button>
                </div>
            </nav>

            {/* Document Container */}
            <article className="container mx-auto px-6 py-32 print:py-0 max-w-4xl" ref={contentRef}>

                {/* Visual Cover Sheet for Print */}
                <div className="min-h-[60vh] flex flex-col justify-center items-center text-center border-b-2 border-zinc-900 mb-16 pb-16 print:min-h-screen print:border-none print:mb-0">
                    <div className="text-zinc-400 text-sm font-bold uppercase tracking-[0.4em] mb-8">The Mental Sport</div>
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                        The<br />Competition<br />Protocol
                    </h1>
                    <div className="w-32 h-2 bg-zinc-900 mb-8"></div>
                    <p className="text-xl md:text-2xl text-zinc-600 font-medium max-w-2xl uppercase tracking-widest">
                        Elite Edition • 2026
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-zinc prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight print:prose-sm">

                    <div className="bg-zinc-100 p-8 mb-12 border-l-4 border-zinc-900 print:bg-transparent print:border-zinc-900 print:border">
                        <h3 className="m-0 text-xl font-bold uppercase tracking-widest">The Core Philosophy</h3>
                        <p className="mt-4 mb-0 text-zinc-700 italic font-serif text-lg">
                            &quot;We do not rise to the level of our expectations. We fall to the level of our training.&quot; — Archilochus
                        </p>
                    </div>

                    <h2>Phase 1: The Taper (7 Days Out)</h2>
                    <p>
                        Most athletes leave their best performance in the practice room. Peaking requires the strategic reduction of volume while maintaining intensity.
                    </p>
                    <ul>
                        <li><strong>Day 7 (Last Hard Session):</strong> High Intensity, Normal Volume. Go to the well one last time.</li>
                        <li><strong>Day 5 (Volume Cut):</strong> Maintain speed/weight, but cut strict volume (reps/mileage) by 30%.</li>
                        <li><strong>Day 3 (The Sharpener):</strong> Moderate Intensity, 50% Volume. Focus on perfect technique.</li>
                        <li><strong>Day 1 (The Prime):</strong> Neural wake-up only. Fast twitch activators (jumps, sprints) for 15 mins. No fatigue.</li>
                    </ul>

                    <hr className="my-12 border-zinc-200" />

                    <h2>Phase 2: The Pre-Game Algorithm</h2>
                    <p>When the pressure hits, the Prefrontal Cortex (logic) shuts down. You must rely on a rigid checklist.</p>

                    <h3>3 Hours Out: The Fueling Window</h3>
                    <ul>
                        <li><strong>Meal:</strong> Simple carbs, moderate protein, low fat/fiber (e.g., Chicken & Rice).</li>
                        <li><strong>Hydration:</strong> 500ml water + Electrolytes.</li>
                    </ul>

                    <h3>60 Minutes Out: The Social Firewall</h3>
                    <ul>
                        <li>Phone goes on <strong>Do Not Disturb.</strong></li>
                        <li>Headphones ON. Playlist: &quot;The Tunnel&quot; (Low BPM, focus music).</li>
                        <li>No interactions with fans, media, or extraneous family members.</li>
                    </ul>

                    <h3>30 Minutes Out: The Activation</h3>
                    <ul>
                        <li><strong>Dynamic Warmup:</strong> Increase core temp.</li>
                        <li><strong>Visualization:</strong> Replay your &quot;Highlight Reel&quot; (past successes) for 3 minutes.</li>
                    </ul>

                    <hr className="my-12 border-zinc-200" />

                    <h2>Phase 3: Crisis Management</h2>
                    <p>What to do when panic sets in.</p>

                    <div className="grid md:grid-cols-2 gap-8 not-prose">
                        <div className="bg-white border border-zinc-200 p-6">
                            <h4 className="font-bold uppercase tracking-widest mb-2 text-red-600">Symptom: The Shake</h4>
                            <p className="text-sm text-zinc-600">Hands trembling, heart racing.</p>
                            <div className="mt-4 font-bold text-sm">Protocol: Physiological Sigh</div>
                            <p className="text-sm mt-1">Double inhale through nose, long exhale through mouth. Repeat 5x. Resets CO2 balance.</p>
                        </div>
                        <div className="bg-white border border-zinc-200 p-6">
                            <h4 className="font-bold uppercase tracking-widest mb-2 text-red-600">Symptom: The Doubter</h4>
                            <p className="text-sm text-zinc-600">&quot;I&apos;m not ready. They are better than me.&quot;</p>
                            <div className="mt-4 font-bold text-sm">Protocol: The Mantra Loop</div>
                            <p className="text-sm mt-1">Replace the thought stream with a mechanical instruction. E.g., &quot;Smooth is fast,&quot; or &quot;Attack the ball.&quot;</p>
                        </div>
                    </div>

                    <hr className="my-12 border-zinc-200" />

                    <div className="text-center pt-12 pb-24 print:pb-0">
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-4">You are ready.</p>
                        <h2 className="text-4xl font-black uppercase tracking-tighter m-0">Trust The Protocol.</h2>
                        <div className="mt-12 text-xs text-zinc-400 uppercase tracking-widest print:hidden">
                            &copy; 2026 Giannis Notaras • The Mental Sport
                        </div>
                    </div>

                </div>
            </article>
        </main>
    );
}
