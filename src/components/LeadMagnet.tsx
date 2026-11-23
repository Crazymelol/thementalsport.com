import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// The free chapter offer is retired. This block now points at the one free guide.
export default function LeadMagnet() {
    return (
        <section className="relative bg-zinc-950 text-white py-16 border-t border-zinc-800">
            <div className="container mx-auto px-6 max-w-3xl text-center space-y-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Free guide</p>
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">
                    The Reset Between Points
                </h2>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                    Lost a point? Reset before the next one starts.
                </p>
                <Link
                    href="/free-guide"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors"
                >
                    Get the free guide <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}
