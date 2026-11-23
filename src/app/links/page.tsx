import Image from 'next/image';
import { Instagram } from 'lucide-react';
import { COURSE, COURSE_LESSON_COUNT } from '@/data/course';
import { offers } from '@/data/offers';
import TrackedLink from '@/components/TrackedLink';

const SKOOL_COMMUNITY_URL = 'https://www.skool.com/the-mental-sport-fencing-8049';

export const metadata = {
    title: 'Links | Giannis Notaras',
    description: 'Free guide: The Reset Between Points. Then the $97 plan or the $297 Mental Performance Protocol.',
};

const plan = offers.find((offer) => offer.id === 'personalised-plan');
const call = offers.find((offer) => offer.id === 'coaching-call');

export default function LinksPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center px-4 pt-24 pb-16 font-sans">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-3 text-center">
                    <div className="w-20 h-20 rounded-full mx-auto border-4 border-amber-400/80 overflow-hidden relative">
                        <Image
                            src="/about/giannis-portrait.png"
                            alt="Giannis Notaras"
                            fill
                            sizes="80px"
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Giannis Notaras</h1>
                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                            Fencing coach • The Mental Sport
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <TrackedLink
                        href="/free-guide"
                        product="The Reset Between Points"
                        className="block w-full bg-white text-zinc-900 p-5 text-left"
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600">Free guide</p>
                        <p className="font-black uppercase tracking-tight text-2xl leading-none mt-2">The Reset Between Points</p>
                        <p className="text-zinc-600 text-sm leading-relaxed mt-3">Lost a point? Reset before the next one starts.</p>
                    </TrackedLink>

                    {plan && (
                        <TrackedLink
                            href={plan.checkoutUrl}
                            product={plan.title}
                            checkout
                            external
                            className="block w-full border border-zinc-700 bg-zinc-900 p-5 text-left"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Personalised plan</p>
                                <p className="text-sm font-black">{plan.price}</p>
                            </div>
                            <p className="font-black uppercase tracking-tight text-xl leading-tight mt-2">{plan.title}</p>
                            <p className="text-zinc-400 text-sm leading-relaxed mt-3">{plan.description}</p>
                        </TrackedLink>
                    )}

                    <TrackedLink
                        href="/course"
                        product={COURSE.name}
                        className="block w-full bg-red-600 text-white p-5 text-left"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-100">The course</p>
                            <p className="text-sm font-black">${COURSE.price}</p>
                        </div>
                        <p className="font-black uppercase tracking-tight text-xl leading-tight mt-2">{COURSE.name}</p>
                        <p className="text-red-100 text-sm leading-relaxed mt-3">
                            Self-paced. {COURSE_LESSON_COUNT.short}. Lifetime access. ${COURSE.price}, paid once.
                        </p>
                    </TrackedLink>
                </div>

                <section className="pt-2 space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">More</h2>
                    <div className="space-y-4 text-sm">
                        {call && (
                            <TrackedLink
                                href={call.checkoutUrl}
                                product={call.title}
                                checkout
                                external
                                className="block text-left text-zinc-300 hover:text-white"
                            >
                                <span className="font-bold">{call.title}</span>
                                <span className="text-zinc-500"> · {call.price}</span>
                                <span className="block text-xs text-zinc-500 mt-1 leading-relaxed">{call.description}</span>
                            </TrackedLink>
                        )}
                        <TrackedLink
                            href={SKOOL_COMMUNITY_URL}
                            product="Skool fencing community"
                            external
                            className="block text-zinc-300 hover:text-white font-bold"
                        >
                            Join the free fencing community
                        </TrackedLink>
                        <TrackedLink href="/books" product="Books" className="block text-zinc-300 hover:text-white font-bold">
                            Books
                        </TrackedLink>
                        <TrackedLink
                            href="https://www.instagram.com/thementalsportpro/"
                            product="Instagram @thementalsportpro"
                            external
                            className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest"
                        >
                            <Instagram className="w-4 h-4" /> @thementalsportpro
                        </TrackedLink>
                        <TrackedLink
                            href="https://www.instagram.com/giannisnotaras/"
                            product="Instagram @giannisnotaras"
                            external
                            className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest"
                        >
                            <Instagram className="w-4 h-4" /> @giannisnotaras
                        </TrackedLink>
                        <TrackedLink
                            href="/"
                            product="Homepage"
                            className="block text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white"
                        >
                            Visit thementalsport.com
                        </TrackedLink>
                    </div>
                </section>

                <footer className="text-zinc-700 text-[10px] uppercase tracking-widest pt-2 text-center">
                    © 2026 The Mental Sport
                </footer>
            </div>
        </main>
    );
}
