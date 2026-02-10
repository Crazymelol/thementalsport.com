import Link from 'next/link';
import Image from 'next/image';
import { Book } from '@/data/books';
import { ArrowRight, Star } from 'lucide-react';

export default function BookCTA({ book }: { book: Book }) {
    return (
        <div className="my-16 bg-zinc-900 text-white overflow-hidden relative group">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/40 to-transparent pointer-events-none"></div>

            <div className="grid md:grid-cols-items-center gap-8 md:grid-cols-[1fr_300px] p-8 md:p-12 relative z-10">
                {/* Content */}
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-xs">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Best Seller</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                        Master The Full System
                    </h3>

                    <p className="text-zinc-400 text-lg leading-relaxed">
                        You are reading just one piece of the puzzle. Get the complete <strong>{book.title}</strong> and learn the exact step-by-step system used by elite athletes to dominate under pressure.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                        <Link
                            href={`/book/${book.id}`}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-zinc-950 font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors group-hover:px-10 duration-300"
                        >
                            <span>Buy Now</span>
                            <span className="w-px h-4 bg-zinc-300"></span>
                            <span>{book.price}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <span className="text-xs text-zinc-500 py-4 font-medium uppercase tracking-wide">
                            Instant Digital Download
                        </span>
                    </div>
                </div>

                {/* Book Cover */}
                <div className="relative hidden md:block">
                    <div className="aspect-[3/4] relative rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out shadow-2xl">
                        <Image
                            src={book.coverImage}
                            alt={book.title}
                            fill
                            className="object-cover border-4 border-white/10"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
