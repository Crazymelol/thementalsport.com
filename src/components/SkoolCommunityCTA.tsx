'use client';

import { ArrowRight } from 'lucide-react';
import { trackSkoolJoin, type SkoolCommunityLocation } from '@/lib/analytics';

export const SKOOL_COMMUNITY_URL = 'https://www.skool.com/the-mental-sport-fencing-8049';

const HEADING = 'Join the free fencing community';
const LINE =
    'A free space on Skool where fencers, coaches and parents share what\u2019s working on the mental side of the sport.';

export default function SkoolCommunityCTA({ location }: { location: SkoolCommunityLocation }) {
    return (
        <aside className="not-prose border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter leading-tight">
                <a
                    href={SKOOL_COMMUNITY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackSkoolJoin(location)}
                    className="inline-flex items-center gap-2 text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900"
                >
                    {HEADING}
                    <ArrowRight className="w-4 h-4 shrink-0" />
                </a>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">{LINE}</p>
        </aside>
    );
}
