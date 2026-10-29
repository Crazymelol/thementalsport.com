import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { COURSE } from '@/data/course';

export default function CourseCTA({ prominent = false }: { prominent?: boolean }) {
    if (prominent) {
        return (
            <aside className="my-10 bg-zinc-950 text-white p-8 md:p-10 not-prose">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500 mb-3">
                    The full system
                </p>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                    {COURSE.name}
                </h2>
                <p className="text-zinc-300 text-lg leading-relaxed mt-4 max-w-xl">
                    {COURSE.pitch}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <Link
                        href="/course"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-sm hover:bg-red-700 transition-colors"
                    >
                        See the course — ${COURSE.price} <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        36 video lessons · Lifetime access · 30-day guarantee
                    </p>
                </div>
            </aside>
        );
    }

    return (
        <div className="my-10 border-l-4 border-red-600 pl-6 py-2 not-prose">
            <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-2">
                <Zap className="inline w-3 h-3 mr-1" />
                Want the full system?
            </p>
            <p className="text-zinc-700 text-base leading-snug mb-4">
                <strong>{COURSE.name}</strong>. {COURSE.pitch} Lifetime access, 36 video lessons — <strong>${COURSE.price}</strong>.
            </p>
            <Link
                href="/course"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors"
            >
                See the course — ${COURSE.price} <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    );
}
