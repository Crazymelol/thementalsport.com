import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Users, Award, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'About Giannis Notaras | Mental Performance Expert & Author',
    description: 'Giannis Notaras is a mental performance expert and author of 8 books on sports psychology, peak performance, and athletic mindset. Founder of The Mental Sport.',
    keywords: ['Giannis Notaras', 'mental performance coach', 'sports psychology author', 'peak performance expert', 'The Mental Sport'],
    openGraph: {
        title: 'About Giannis Notaras | Mental Performance Expert',
        description: 'Author of 8 books on sports psychology and mental performance. Founder of The Mental Sport.',
        type: 'profile',
    },
};

const books = [
    { title: 'The Competition Protocol', desc: 'The 7-day mental system for elite athletes' },
    { title: 'Overcoming Mental Blocks', desc: 'A guide to peak performance under pressure' },
    { title: 'Unbreakable', desc: 'Building mental toughness that lasts' },
    { title: 'Confidence Building', desc: 'The athlete\'s complete guide to self-belief' },
    { title: 'Resilient Confidence', desc: 'Confidence that survives adversity' },
    { title: 'Nurturing Self-Worth', desc: 'Identity and performance in elite sport' },
    { title: 'Physiological Performance', desc: 'The body\'s role in mental excellence' },
    { title: 'ADHD Athletes Edge', desc: 'Turning neurodiversity into competitive advantage' },
];

const stats = [
    { label: 'Books Published', value: '8' },
    { label: 'Articles Written', value: '60+' },
    { label: 'Sports Covered', value: '10+' },
    { label: 'Years Researching', value: '7+' },
];

export default function AboutPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Giannis Notaras',
        jobTitle: 'Mental Performance Expert & Author',
        description: 'Mental performance expert and author of 8 books on sports psychology and peak performance. Founder of The Mental Sport.',
        url: 'https://thementalsport.com/about',
        sameAs: ['https://thementalsport.com'],
        knowsAbout: ['Sports Psychology', 'Mental Performance', 'Peak Performance', 'Athletic Mindset', 'Mental Toughness', 'Sports Science'],
        author: books.map(b => ({ '@type': 'Book', name: b.title })),
    };

    return (
        <main className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            {/* HERO */}
            <section className="bg-zinc-950 text-white pt-32 pb-24">
                <div className="container mx-auto px-6 max-w-4xl">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">The Mental Sport</p>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
                        Giannis<br />Notaras
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                        Mental performance expert, researcher, and author of 8 books on sports psychology, peak performance, and the science of elite athletic mindset.
                    </p>
                </div>
            </section>

            {/* STATS */}
            <section className="py-12 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map(s => (
                            <div key={s.label} className="text-center">
                                <div className="text-4xl font-black text-zinc-900 mb-1">{s.value}</div>
                                <div className="text-xs font-black uppercase tracking-widest text-zinc-500">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* STORY */}
            <section className="py-20 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-8 h-px bg-zinc-900"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">The Story</p>
                    </div>

                    <div className="prose prose-zinc prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter">
                        <p>
                            I got interested in mental performance the same way most people do — I watched it fail.
                        </p>
                        <p>
                            Athletes who trained harder than anyone I'd seen, who had the physical capacity to compete at the highest levels, who would show up in practice performing brilliantly — and then collapse under competition pressure. Not from lack of effort. Not from lack of talent. From a mental game that had never been trained.
                        </p>
                        <p>
                            The physical preparation science is mature. Periodization, nutrition, recovery — decades of research and refined best practices. But the mental side? Most athletes get "be confident" and "believe in yourself." Generic advice that dissolves the moment pressure arrives.
                        </p>
                        <p>
                            I spent years studying the research — sports psychology, neuroscience, cognitive behavioral therapy, the documented practices of elite athletes — and distilling it into systems that actually work in the field. Not in a laboratory. In competition, under real pressure, with real stakes.
                        </p>
                        <p>
                            That research became <strong>The Mental Sport</strong>: a platform, a library of books, and a course built around one core principle — the mental game is a skill, and skills are trained, not inherited.
                        </p>
                        <p>
                            The athletes I work with and write for aren't lacking talent or work ethic. They're lacking a system. That's what I build.
                        </p>
                    </div>
                </div>
            </section>

            {/* METHODOLOGY */}
            <section className="py-20 bg-zinc-50 border-b border-zinc-200">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-12">The Methodology</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: Target,
                                title: 'Evidence-Based',
                                desc: 'Every technique in The Mental Sport library is grounded in peer-reviewed sports psychology and neuroscience research — not folklore, anecdote, or motivational intuition.',
                            },
                            {
                                icon: Award,
                                title: 'Sport-Specific',
                                desc: 'Generic mental performance advice fails because every sport has unique psychological demands. The methodology adapts to the specific pressures of each competitive context.',
                            },
                            {
                                icon: Users,
                                title: 'Athlete-First',
                                desc: 'Written by someone who studies athletes for athletes. Not for executives, life-coaches, or general audiences. Every framework is designed for competitive sporting contexts.',
                            },
                            {
                                icon: BookOpen,
                                title: 'Systematized',
                                desc: 'Mental skills developed through structured systems outperform those developed through inspiration or willpower. Every tool in the library has a specific application protocol.',
                            },
                        ].map(item => (
                            <div key={item.title} className="border border-zinc-200 bg-white p-8">
                                <item.icon className="w-8 h-8 text-zinc-900 mb-4" />
                                <h3 className="font-black uppercase tracking-tight text-lg mb-3">{item.title}</h3>
                                <p className="text-zinc-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BOOKS */}
            <section className="py-20 border-b border-zinc-100">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">The Library</h2>
                        <Link href="/books" className="text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                            All Books <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {books.map((b, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 border border-zinc-100 hover:border-zinc-300 transition-colors">
                                <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <div>
                                    <div className="font-black uppercase tracking-tight text-sm">{b.title}</div>
                                    <div className="text-zinc-500 text-xs mt-1">{b.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-zinc-950 text-white">
                <div className="container mx-auto px-6 max-w-3xl text-center">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">Start Here</h2>
                    <p className="text-zinc-400 mb-10 text-lg">
                        New to The Mental Sport? Start with the free Competition Protocol — the 7-day pre-competition mental system.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/start-here" className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors">
                            Start Here <ArrowRight className="w-4 h-4" />
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
