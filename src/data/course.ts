// Single source for the course offer shown on /course. Link-in-bio, blog
// CTAs, and checkout events read this so the name and price cannot drift.
export const COURSE = {
    name: 'The Mental Performance Protocol',
    price: 297,
    checkoutUrl: 'https://notarasio.gumroad.com/l/qjsfty',
    pitch:
        'The 8-week system elite athletes use to build unshakable confidence, eliminate competition anxiety, and dominate their sport.',
} as const;

// TODO: Draft copy for /course only. Giannis will confirm the coach wording
// and send the real bonus list. Replace the bracketed strings in this object.
// Do not add ratings, review counts, client logos, or credentials he has not confirmed.
export const COURSE_PAGE_DRAFT = {
    coach: {
        draftLabel: '[DRAFT — wording pending confirmation by Giannis]',
        heading: 'Who is your coach',
        paragraphs: [
            '[DRAFT] Giannis Notaras is a fencing coach in Athens, Greece. He coaches at A.O. Apollon Vrilission.',
            '[DRAFT] He is one of the coaches named for athletes in the Hellenic Fencing Federation’s pre-Olympic sabre squad for Los Angeles 2028.',
            '[DRAFT] He founded The Mental Sport and has written a series of books on the mental side of competition.',
        ],
    },
    // TODO: Swap these for the real bonus list when Giannis provides it. No prices until he confirms them.
    bonusesLabel: '[DRAFT — bonus list pending confirmation by Giannis]',
    bonuses: [
        '[BONUS 1 — to be confirmed by Giannis]',
        '[BONUS 2 — to be confirmed by Giannis]',
        '[BONUS 3 — to be confirmed by Giannis]',
    ],
    lessonCountPlaceholder: '[LESSON COUNT — to be confirmed by Giannis]',
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
