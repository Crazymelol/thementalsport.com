import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Mental Performance for Parents | The Mental Sport',
    description: 'Practical mental-performance tools for parents supporting young athletes through pressure, setbacks, confidence, and competition.',
    keywords: ['sports parents', 'mental performance for young athletes', 'youth sports anxiety', 'help child confidence in sports'],
};

const parentArticles = [
    { href: '/blog/sports-psychology-for-youth-athletes', title: 'Sports Psychology for Youth Athletes' },
    { href: '/blog/what-to-say-to-nervous-young-athlete', title: 'What to Say to a Nervous Young Athlete' },
    { href: '/blog/sideline-behavior-sports-parents', title: 'The Sports Parent Sideline Guide' },
];

export default function ForParentsPage() {
    return (
        <main className="min-h-screen bg-white text-zinc-900">
            <section className="bg-zinc-950 text-white py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">For Parents of Young Athletes</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight mb-8">
                        SUPPORT THE ATHLETE.<br />
                        <span className="text-red-500">PROTECT THE PERSON.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mb-10 leading-relaxed">
                        Practical tools to help your child handle nerves, mistakes, confidence swings, and the pressure to perform without making sport feel like another test.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/quiz" className="inline-flex items-center gap-2 bg-white text-zinc-950 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors">
                            Take the free quiz <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/books" className="inline-flex items-center gap-2 border border-zinc-700 text-white px-8 py-4 text-sm font-black uppercase tracking-[0.2em] hover:border-white transition-colors">
                            Find a parent guide <BookOpen className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-20 px-6 bg-zinc-50 border-b border-zinc-200">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">What are you seeing?</h2>
                    <p className="text-zinc-500 mb-10 text-lg">The goal is not to remove every difficult feeling. It is to help your child build a response they can trust.</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            ['Nerves before competition', 'Build a simple preparation routine and language that calms without adding pressure.'],
                            ['Confidence after mistakes', 'Help your child reset, learn, and return to the next play instead of carrying the last one.'],
                            ['Pressure from sport', 'Keep performance separate from identity while still supporting serious improvement.'],
                        ].map(([title, description]) => (
                            <div key={title} className="bg-white border border-zinc-200 p-8">
                                <h3 className="font-black uppercase text-base mb-4">{title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">A practical starting point</p>
                        <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-6">Choose the right next step.</h2>
                        <p className="text-zinc-600 leading-relaxed">Start with free guidance, choose a focused parent resource, or bring one specific situation to a one-to-one session.</p>
                    </div>
                    <div className="space-y-4">
                        <Link href="/book/nurturing-self-worth" className="flex items-center justify-between border border-zinc-200 p-5 hover:border-zinc-900 transition-colors">
                            <span><strong className="block font-black uppercase">Nurturing Self-Worth</strong><span className="text-sm text-zinc-500">A parent guide for confidence beyond the scoreboard.</span></span>
                            <ArrowRight className="w-4 h-4 shrink-0" />
                        </Link>
                        <Link href="/book/unbreakable" className="flex items-center justify-between border border-zinc-200 p-5 hover:border-zinc-900 transition-colors">
                            <span><strong className="block font-black uppercase">Unbreakable</strong><span className="text-sm text-zinc-500">A story for young athletes learning to recover from mistakes.</span></span>
                            <ArrowRight className="w-4 h-4 shrink-0" />
                        </Link>
                        <a href="https://notarasio.gumroad.com/l/mzcxp" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border border-red-600 bg-red-50 p-5 hover:bg-red-100 transition-colors">
                            <span><strong className="block font-black uppercase">Personalised Performance Plan</strong><span className="text-sm text-zinc-600">A focused $97 plan for your athlete&apos;s current challenge.</span></span>
                            <ArrowRight className="w-4 h-4 shrink-0" />
                        </a>
                    </div>
                </div>
            </section>

            <section className="py-20 px-6 bg-zinc-950 text-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">Start with these parent resources.</h2>
                    <div className="grid md:grid-cols-3 gap-4 mt-10">
                        {parentArticles.map((article) => (
                            <Link key={article.href} href={article.href} className="border border-zinc-800 p-6 hover:border-white transition-colors">
                                <MessageCircle className="w-5 h-5 text-red-500 mb-8" />
                                <span className="font-black uppercase leading-tight">{article.title}</span>
                                <ArrowRight className="w-4 h-4 mt-6" />
                            </Link>
                        ))}
                    </div>
                    <div className="mt-10 flex flex-wrap gap-6 text-xs font-black uppercase tracking-widest">
                        <Link href="/start-here" className="text-red-400 hover:text-red-300">Start here <ArrowRight className="inline w-3 h-3" /></Link>
                        <Link href="/quiz" className="text-zinc-400 hover:text-white">Take the quiz <ClipboardCheck className="inline w-3 h-3" /></Link>
                    </div>
                </div>
            </section>

            <div className="py-8 px-6 text-center bg-zinc-100">
                <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 transition-colors">← TheMentalSport.com</Link>
            </div>
        </main>
    );
}