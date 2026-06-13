import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Video, FileText, Zap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Start Here | The Mental Sport — Mental Performance for Athletes',
    description: 'New to The Mental Sport? Start here. Free resources, best articles, and the right book for your situation. Mental performance training for competitive athletes.',
    keywords: ['mental performance training', 'sports psychology', 'athlete mindset', 'start here', 'mental training for athletes'],
};

export default function StartHerePage() {
    return (
        <main className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">

            {/* HERO */}
            <section className="bg-zinc-950 text-white pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-3xl text-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Welcome</p>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                        Start Here
                    </h1>
                    <p className="text-xl text-zinc-400 leading-relaxed max-w-xl mx-auto">
                        The mental game is the last untrained edge in competitive sport. Here&apos;s exactly where to begin.
                    </p>
                </div>
            </section>

            {/* THE CORE TRUTH */}
            <section className="py-16 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="border-l-4 border-zinc-900 pl-8 py-2">
                        <p className="text-2xl font-black uppercase tracking-tight leading-tight mb-4">
                            Mental performance is a skill.<br />
                            Skills are trained, not inherited.
                        </p>
                        <p className="text-zinc-600 leading-relaxed">
                            The athletes who perform under pressure aren&apos;t built differently. They&apos;ve built different systems.
                            This site exists to give you those systems — evidence-based, sport-tested, and immediately applicable.
                        </p>
                    </div>
                </div>
            </section>

            {/* STEP 1: FREE PROTOCOL */}
            <section className="py-16 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 bg-zinc-900 text-white flex items-center justify-center font-black text-lg flex-shrink-0">1</div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Start Free</p>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Get The Free Competition Protocol</h2>
                            <p className="text-zinc-600 leading-relaxed mb-6">
                                The 7-day mental preparation system. Covers the taper phase, the 24-hour window, the 60-minute warmup, and crisis management during competition. One page. Used by athletes across every sport. Free.
                            </p>
                            <div className="flex items-center gap-4">
                                <Link href="/resources/competition-protocol"
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm hover:bg-black transition-colors">
                                    <FileText className="w-4 h-4" /> Access Free Protocol
                                </Link>
                                <span className="text-xs text-zinc-400 uppercase tracking-widest">No email required</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP 2: FIND YOUR SPORT */}
            <section className="py-16 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 bg-zinc-900 text-white flex items-center justify-center font-black text-lg flex-shrink-0">2</div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Sport-Specific</p>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Find Your Sport&apos;s Mental Guide</h2>
                            <p className="text-zinc-600 leading-relaxed mb-6">
                                Every sport has unique psychological demands. Generic mental performance advice fails because it ignores context.
                                Find the guide built for your sport.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                {['Swimming', 'Basketball', 'Tennis', 'Running', 'Boxing', 'Soccer'].map(sport => (
                                    <Link key={sport} href={`/mental-performance/${sport.toLowerCase()}`}
                                        className="border border-zinc-200 hover:border-zinc-900 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors text-center">
                                        {sport}
                                    </Link>
                                ))}
                            </div>
                            <Link href="/mental-performance" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:underline">
                                All Sports <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP 3: BOOK */}
            <section className="py-16 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 bg-zinc-900 text-white flex items-center justify-center font-black text-lg flex-shrink-0">3</div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Find Your Book</p>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Pick The Right Book for Your Situation</h2>
                            <p className="text-zinc-600 leading-relaxed mb-6">8 books. Each targets a specific mental performance challenge. Find yours:</p>
                            <div className="space-y-3">
                                {[
                                    { situation: 'I have a competition coming up (within 7 days)', book: 'the-competition-protocol', title: 'The Competition Protocol' },
                                    { situation: 'I freeze up or choke under pressure', book: 'mental-blocks', title: 'Overcoming Mental Blocks' },
                                    { situation: 'I need more resilience after setbacks', book: 'unbreakable', title: 'Unbreakable' },
                                    { situation: 'I struggle with confidence', book: 'confidence-building', title: 'Confidence Building' },
                                    { situation: 'I have ADHD and want to use it as an edge', book: 'adhd-athletes-edge', title: 'ADHD Athletes Edge' },
                                ].map(item => (
                                    <Link key={item.book} href={`/book/${item.book}`}
                                        className="flex items-center justify-between p-4 border border-zinc-200 hover:border-zinc-900 group transition-colors">
                                        <span className="text-sm text-zinc-700 group-hover:text-zinc-900">{item.situation}</span>
                                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 hidden sm:block">{item.title} →</span>
                                    </Link>
                                ))}
                            </div>
                            <Link href="/books" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:underline mt-4">
                                All 8 Books <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP 4: ARTICLES */}
            <section className="py-16 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 bg-zinc-900 text-white flex items-center justify-center font-black text-lg flex-shrink-0">4</div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Read</p>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Start With These Articles</h2>
                            <div className="space-y-3">
                                {[
                                    { href: '/blog/how-to-stop-choking-under-pressure', title: 'How to Stop Choking Under Pressure', tag: 'Neuroscience' },
                                    { href: '/blog/pre-competition-routine-guide', title: 'The Pre-Competition Routine: Complete Guide', tag: 'Preparation' },
                                    { href: '/blog/how-to-build-mental-toughness', title: 'How to Build Mental Toughness', tag: 'Resilience' },
                                    { href: '/blog/performance-anxiety-sports-guide', title: 'Performance Anxiety in Sports: Full Guide', tag: 'Anxiety' },
                                    { href: '/blog/clutch-performance-science', title: 'The Science of Clutch Performance', tag: 'Science' },
                                ].map(article => (
                                    <Link key={article.href} href={article.href}
                                        className="flex items-center justify-between p-4 border border-zinc-100 hover:border-zinc-300 group transition-colors">
                                        <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{article.title}</span>
                                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400 hidden sm:block">{article.tag}</span>
                                    </Link>
                                ))}
                            </div>
                            <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:underline mt-4">
                                All 63 Articles <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP 5: COURSE */}
            <section className="py-16 bg-zinc-950 text-white">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 bg-white text-zinc-950 flex items-center justify-center font-black text-lg flex-shrink-0">5</div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Go Deep</p>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">The Full System: Mental Performance Masterclass</h2>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                8 modules. 36 video lessons. Everything you need — pre-competition prep, performing under pressure, recovering from slumps, building an identity that holds under adversity. The complete mental performance framework for serious athletes.
                            </p>
                            <Link href="/course"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors">
                                <Video className="w-4 h-4" /> Explore The Course <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
