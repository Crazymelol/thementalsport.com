export interface Offer {
    id: string;
    title: string;
    description: string;
    price: string;
    checkoutUrl: string;
    label: string;
    accent: string;
}

export const offers: Offer[] = [
    {
        id: 'personalised-plan',
        title: 'Your Personalised Mental Performance Plan',
        description: 'A written plan built around your sport, current challenge, and next performance target.',
        price: '$97',
        checkoutUrl: 'https://notarasio.gumroad.com/l/mzcxp',
        label: 'Start with a plan',
        accent: '#dc2626',
    },
    {
        id: 'coaching-call',
        title: '60-Minute Sport Psychology Coaching Call',
        description: 'A focused one-to-one session to identify the mental bottleneck and leave with a practical next step.',
        price: '$147',
        checkoutUrl: 'https://notarasio.gumroad.com/l/ezjny',
        label: 'Work one-to-one',
        accent: '#18181b',
    },
];