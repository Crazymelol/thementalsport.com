'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackLinksCheckout, trackLinksClick } from '@/lib/analytics';

type TrackedLinkProps = {
    href: string;
    product: string;
    checkout?: boolean;
    external?: boolean;
    className?: string;
    children: ReactNode;
};

export default function TrackedLink({
    href,
    product,
    checkout = false,
    external = false,
    className,
    children,
}: TrackedLinkProps) {
    function onClick() {
        if (checkout) trackLinksCheckout(product);
        else trackLinksClick(product);
    }

    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={className} onClick={onClick}>
            {children}
        </Link>
    );
}
