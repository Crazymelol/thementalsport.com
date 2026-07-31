'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { subscribeEmail } from '@/lib/subscribe';

// "What's Your Mental Game Score?" — a 10-question quiz that scores an athlete
// across four dimensions, names their weakest area, and recommends the matching
// book + the course, then captures the email to send a personalized plan. All
// client-side so it works in the static export; email uses the existing Kit
// integration (subscribeEmail).

type Dim = 'nerves' | 'focus' | 'confidence' | 'recovery';

interface Question {
    q: string;
    dim: Dim;
    opts: string[]; // four options, index 0..3 => score 1..4
}

const QUESTIONS: Question[] = [
    { q: 'The night before a big competition:', dim: 'nerves', opts: ["I can't sleep, stomach in knots", 'I toss and turn', 'A little restless, mostly fine', 'I sleep normally'] },
    { q: 'Minutes before you start, your body feels:', dim: 'nerves', opts: ['Shaking, tight, almost sick', 'Tense', 'Buzzing but under control', 'Loose and ready'] },
    { q: 'When the pressure peaks, your breathing:', dim: 'nerves', opts: ['Goes shallow and fast', 'I feel it tighten', 'I can steady it', 'Stays controlled'] },
    { q: 'During play, your attention is:', dim: 'focus', opts: ['Jumping everywhere', 'On the score and the crowd', 'Mostly on the task', 'Locked on the next play'] },
    { q: 'When a distraction hits (ref, trash talk, a mistake):', dim: 'focus', opts: ['It derails me', 'It rattles me for a while', 'I shake it off eventually', 'I barely register it'] },
    { q: 'Your belief in yourself:', dim: 'confidence', opts: ['Swings with every result', 'Dips after a bad game', 'Is fairly steady', 'Is rock solid, win or lose'] },
    { q: 'Your inner voice under pressure is mostly:', dim: 'confidence', opts: ['Harsh and critical', 'Doubtful', 'Neutral', 'Calm and encouraging'] },
    { q: 'Facing a stronger opponent, you:', dim: 'confidence', opts: ['Expect to lose', 'Hope to keep up', 'Back yourself', 'Relish it'] },
    { q: 'Right after a mistake, you:', dim: 'recovery', opts: ['Dwell on it for plays', 'Take a while to reset', 'Recover within a minute', 'Reset in seconds'] },
    { q: 'One bad game usually turns into:', dim: 'recovery', opts: ['A slump', 'A couple rough games', 'Just the one', 'Fuel for the next'] },
];

const DIM_MAX: Record<Dim, number> = { nerves: 12, focus: 8, confidence: 12, recovery: 8 };

const REC: Record<Dim, { slug: string; title: string; label: string; line: string }> = {
    nerves: { slug: 'mental-blocks', title: 'Overcoming Mental Blocks', label: 'Pre-Game Nerves', line: 'Your nerves are running the show. This is the manual for quieting them and performing anyway.' },
    focus: { slug: 'the-competition-protocol', title: 'The Competition Protocol', label: 'Focus Under Pressure', line: 'Your focus leaks when it matters. This builds the routine that locks you in on game day.' },
    confidence: { slug: 'confidence-building', title: 'Confidence-Building Workbook', label: 'Confidence', line: 'Your confidence rides your results. This makes it durable, so it survives a loss.' },
    recovery: { slug: 'resilient-confidence', title: 'Unlocking Resilient Confidence', label: 'Bouncing Back', line: 'One mistake costs you too much. This teaches the fast reset elite athletes use.' },
};

function tier(total: number): { name: string; blurb: string } {
    if (total <= 20) return { name: 'The Reactor', blurb: 'Right now the game plays you. The good news: the mental side is trainable, and you have the most to gain.' };
    if (total <= 27) return { name: 'The Competitor', blurb: 'You compete hard but the wheels wobble under pressure. Close one gap and your results jump.' };
    if (total <= 33) return { name: 'The Closer', blurb: 'Strong mind, one clear weak spot. Fix it and you perform when it counts, not just in practice.' };
    return { name: 'The Titan', blurb: 'Elite mental profile. Now it is about sharpening the edge and staying there under the brightest lights.' };
}

export default function MentalGameQuiz() {
    const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    function answer(score: number) {
        const next = [...answers, score];
        setAnswers(next);
        if (idx + 1 >= QUESTIONS.length) {
            setPhase('result');
        } else {
            setIdx(idx + 1);
        }
    }

    function restart() {
        setAnswers([]);
        setIdx(0);
        setPhase('intro');
        setStatus('idle');
        setEmail('');
    }

    // Results
    const total = answers.reduce((a, b) => a + b, 0);
    const perDim: Record<Dim, number> = { nerves: 0, focus: 0, confidence: 0, recovery: 0 };
    QUESTIONS.forEach((question, i) => { perDim[question.dim] += answers[i] ?? 0; });
    const weak = (Object.keys(perDim) as Dim[]).reduce((lo, d) =>
        perDim[d] / DIM_MAX[d] < perDim[lo] / DIM_MAX[lo] ? d : lo, 'nerves' as Dim);
    const rec = REC[weak];
    const t = tier(total);

    async function handleEmail(e: React.FormEvent) {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus('error'); setErrorMsg('Enter a valid email'); return;
        }
        setStatus('loading');
        try {
            await subscribeEmail(email, `quiz-${weak}`);
            if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
                (window as unknown as { gtag: (...a: unknown[]) => void }).gtag('event', 'generate_lead', { event_category: 'quiz', event_label: weak });
            }
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
        }
    }

    // ---- INTRO ----
    if (phase === 'intro') {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-black uppercase tracking-[0.2em]">
                    2-Minute Assessment
                </div>
                <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                    What&apos;s Your <span className="text-red-500">Mental Game</span> Score?
                </h1>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                    10 questions. Score your mind across nerves, focus, confidence, and recovery. Find the one weak spot costing you games, and exactly how to fix it.
                </p>
                <button
                    onClick={() => setPhase('quiz')}
                    className="inline-flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all"
                >
                    Start the Quiz <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-zinc-600 text-xs">Free. No signup to see your score.</p>
            </div>
        );
    }

    // ---- QUIZ ----
    if (phase === 'quiz') {
        const question = QUESTIONS[idx];
        const pct = Math.round((idx / QUESTIONS.length) * 100);
        return (
            <div className="max-w-2xl mx-auto">
                <div className="mb-10">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                        <span>Question {idx + 1} / {QUESTIONS.length}</span>
                        <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800">
                        <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-tight mb-8">
                    {question.q}
                </h2>
                <div className="space-y-3">
                    {question.opts.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => answer(i + 1)}
                            className="w-full text-left p-5 bg-zinc-900 border border-zinc-800 hover:border-red-600 hover:bg-zinc-800 transition-all font-medium text-zinc-200 flex items-center justify-between group"
                        >
                            <span>{opt}</span>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ---- RESULT ----
    return (
        <div className="max-w-2xl mx-auto space-y-10">
            <div className="text-center space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Your Mental Game Score</p>
                <div className="text-7xl lg:text-8xl font-black tracking-tighter">
                    {total}<span className="text-zinc-600 text-4xl">/40</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-red-500">{t.name}</h2>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto">{t.blurb}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8">
                <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-2">Your Weak Spot</p>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{rec.label}</h3>
                <p className="text-zinc-300 leading-relaxed mb-6">{rec.line}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/book/${rec.slug}`} className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs transition-all">
                        Get {rec.title} <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/course" className="inline-flex items-center justify-center gap-2 px-6 py-4 border border-zinc-700 hover:border-white text-white font-black uppercase tracking-widest text-xs transition-all">
                        Or fix it all with the Course
                    </Link>
                </div>
            </div>

            {/* Email capture: personalized plan */}
            {status === 'success' ? (
                <div className="bg-green-950/30 border border-green-800 p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Check your inbox</h3>
                    <p className="text-zinc-400">Your personalized {rec.label.toLowerCase()} plan is on its way.</p>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 p-8">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Get your free 7-day {rec.label} plan</h3>
                    <p className="text-zinc-400 text-sm mb-5">A daily protocol built around your weak spot. Straight to your inbox.</p>
                    <form onSubmit={handleEmail} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                            placeholder="Your email"
                            className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                            disabled={status === 'loading'}
                        />
                        <button type="submit" disabled={status === 'loading'} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50">
                            {status === 'loading' ? 'Sending...' : 'Send My Plan'}
                        </button>
                    </form>
                    {status === 'error' && (
                        <p className="flex items-center gap-2 text-red-400 text-sm mt-3"><AlertCircle className="w-4 h-4" /> {errorMsg}</p>
                    )}
                </div>
            )}

            <div className="text-center">
                <button onClick={restart} className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                    <RotateCcw className="w-3 h-3" /> Retake the quiz
                </button>
            </div>
        </div>
    );
}
