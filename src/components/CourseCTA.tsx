import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export default function CourseCTA() {
    return (
        <div className="my-10 border-l-4 border-red-600 pl-6 py-2">
            <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-2">
                <Zap className="inline w-3 h-3 mr-1" />
                Want the full system?
            </p>
            <p className="text-zinc-700 text-base leading-snug mb-4">
                The <strong>Mental Performance Masterclass</strong> gives you 36 video lessons, live coaching, and a complete blueprint — built for athletes who are serious about performing when it matters.
            </p>
            <Link
                href="/course"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors"
            >
                Explore the Course <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    );
}
