// Single source for the course offer shown on /course. Link-in-bio, blog
// CTAs, and checkout events read this so the name and price cannot drift.
export const COURSE = {
    name: 'The Mental Performance Protocol',
    price: 297,
    checkoutUrl: 'https://notarasio.gumroad.com/l/qjsfty',
    pitch:
        'The 8-week system elite athletes use to build unshakable confidence, eliminate competition anxiety, and dominate their sport.',
} as const;

// Highest-read posts from the Web Analytics review. Both flow-state URLs are
// included: the site publishes two separate articles on that topic.
export const COURSE_CTA_SLUGS = new Set([
    'how-to-mentally-prepare-for-penalty-shootout',
    'quiet-eye-training-putting-shooting',
    'flow-state-how-to-enter',
    'flow-state',
    'novak-djokovic-mental-routine',
]);
