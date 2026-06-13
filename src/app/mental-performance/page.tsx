import { sports } from '@/data/sports';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Mental Performance by Sport | Sports Psychology Hub',
    description: 'Sport-specific mental performance guides for elite athletes. Swimming, basketball, tennis, running, boxing, gymnastics, soccer, golf, weightlifting, and martial arts.',
    keywords: ['mental performance', 'sports psychology', 'athlete mindset', 'mental training', 'peak performance'],
};

const SPORT_ICONS: Record<string, string> = {
    swimming: '🏊',
    basketball: '🏀',
    tennis: '🎾',
    running: '🏃',
    boxing: '🥊',
    gymnastics: '🤸',
    soccer: '⚽',
    golf: '⛳',
    weightlifting: '🏋️',
    'martial-arts': '🥋',
};

export default function MentalPerformanceHub() {
    return (
        <main className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">

            {/* HERO */}
            <section className="bg-zinc-950 text-white pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-5xl text-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Sport-Specific Mental Performance</p>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                        The Mental Game<br />For Your Sport
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Generic mental performance advice doesn&apos;t work. Every sport has unique psychological demands. Choose your sport below.
                    </p>
                </div>
            </section>

            {/* SPORT GRID */}
            <section className="py-20">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sports.map(sport => (
                            <Link key={sport.slug} href={`/mental-performance/${sport.slug}`}
                                className="group border border-zinc-200 hover:border-zinc-900 p-8 transition-all hover:shadow-lg">
                                <div className="text-4xl mb-4">{SPORT_ICONS[sport.slug] ?? '🏆'}</div>
                                <h2 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:underline decoration-2 underline-offset-4">
                                    {sport.name}
                                </h2>
                                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{sport.subheadline}</p>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-900">
                                    Read Guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* COURSE CTA */}
            <section className="py-20 bg-zinc-950 text-white">
                <div className="container mx-auto px-6 max-w-3xl text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">The Complete System</p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                        Mental Performance Masterclass
                    </h2>
                    <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
                        36 video lessons covering every aspect of athletic mental performance — from pre-competition prep to recovering from failure. Built for serious competitors.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/course" className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors">
                            Explore The Course <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/books" className="inline-flex items-center justify-center gap-3 px-10 py-4 border border-zinc-700 text-white font-black uppercase tracking-widest text-sm hover:border-white transition-colors">
                            Browse Books
                        </Link>
                    </div>
                </div>
            </section>

        </main>
    );
}
