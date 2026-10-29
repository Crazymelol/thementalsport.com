'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { trackBeginCheckout } from '@/lib/analytics';

type CheckoutLinkProps = Omit<ComponentProps<'a'>, 'href'> & {
    href: string;
    productName: string;
    price: string | number;
};

export default function CheckoutLink({
    href,
    productName,
    price,
    onClick,
    target,
    rel,
    children,
    ...rest
}: CheckoutLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        trackBeginCheckout(productName, price);
        onClick?.(event);
    }

    return (
        <a
            {...rest}
            href={href}
            target={target ?? '_blank'}
            rel={rel ?? 'noopener noreferrer'}
            onClick={handleClick}
        >
            {children}
        </a>
    );
}
