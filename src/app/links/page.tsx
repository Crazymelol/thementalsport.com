import Link from 'next/link';
import Image from 'next/image';
import { Instagram, ArrowRight } from 'lucide-react';
import { COURSE, COURSE_BONUS_NAME, COURSE_LESSON_COUNT } from '@/data/course';
import ResetGuideSignupForm from '@/components/ResetGuideSignupForm';

export const metadata = {
    title: 'Links | Giannis Notaras',
    description: 'Get the free guide The Reset Between Points, or see The Mental Performance Protocol, a $297 self-paced course.',
};

export default function LinksPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center px-6 pt-28 pb-16 relative overflow-hidden font-sans">
            <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/10 via-zinc-950/40 to-zinc-950 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-md space-y-8 text-center">
                <div className="space-y-4">
                    <div className="w-28 h-28 rounded-full mx-auto border-4 border-amber-400/80 shadow-[0_0_35px_rgba(251,191,36,0.3)] overflow-hidden relative">
                        <Image
                            src="/about/giannis-portrait.png"
                            alt="Giannis Notaras"
                            fill
                            sizes="112px"
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Giannis Notaras</h1>
                        <p className="text-amber-400 text-xs font-black uppercase tracking-[0.2em] mt-1.5">
                            Fencing coach • The Mental Sport
                        </p>
                    </div>
                </div>

                <section className="bg-white text-zinc-900 p-5 sm:p-6 text-left space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600">Free guide</p>
                    <h2 className="font-black uppercase tracking-tight text-2xl leading-none">The Reset Between Points</h2>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                        A free 11-page PDF on the 15-second reset between points. For fencers and athletes in any sport, with pages for coaches and parents and a printable tracker.
                    </p>
                    <ResetGuideSignupForm idPrefix="links-reset" formLocation="links_reset_guide" />
                </section>

                <Link
                    href="/course"
                    className="group block w-full border border-zinc-800 bg-zinc-900 p-5 text-left hover:border-zinc-600 transition-colors"
                >
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">The course</span>
                        <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 font-black tracking-normal">${COURSE.price}</span>
                    </div>
                    <div className="font-black text-white uppercase tracking-tight text-lg leading-tight">
                        {COURSE.name}
                    </div>
                    <p className="text-zinc-400 text-sm leading-snug mt-2">
                        Self-paced. {COURSE_LESSON_COUNT.short}. Lifetime access. Includes {COURSE_BONUS_NAME}. ${COURSE.price}, paid once.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
                        Get the Course — ${COURSE.price} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <div className="flex justify-center gap-8 pt-2">
                    <a href="https://www.instagram.com/thementalsportpro/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Instagram className="w-5 h-5 text-zinc-400" /> @thementalsportpro
                    </a>
                    <a href="https://www.instagram.com/giannisnotaras/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Instagram className="w-5 h-5 text-zinc-400" /> @giannisnotaras
                    </a>
                </div>

                <Link href="/" className="block text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors">
                    Visit thementalsport.com
                </Link>

                <footer className="text-zinc-800 text-[10px] uppercase tracking-widest pt-4">
                    © 2026 The Mental Sport
                </footer>
            </div>
        </main>
    );
}
