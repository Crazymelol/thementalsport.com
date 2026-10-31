// Single source for the course offer shown on /course. Link-in-bio, blog
// CTAs, and checkout events read this so the name and price cannot drift.
export const COURSE = {
    name: 'The Mental Performance Protocol',
    price: 297,
    checkoutUrl: 'https://notarasio.gumroad.com/l/qjsfty',
    pitch:
        'The 8-week system elite athletes use to build unshakable confidence, eliminate competition anxiety, and dominate their sport.',
} as const;

// TODO: Replace lessonCountPlaceholder when Giannis confirms the lesson count.
// Coach wording and the bonus are confirmed. Do not add ratings, review counts,
// client logos, or credentials he has not confirmed.
export const COURSE_PAGE_DRAFT = {
    coach: {
        heading: 'Who is your coach',
        lead: 'Coach of the Greek pre-Olympic sabre squad for LA 2028, and coach at A.O. Apollon Vrilission',
        support:
            'He founded The Mental Sport and has written a series of books on the mental side of competition.',
    },
    // Name from the course offer list (price omitted). Description is the Titans
    // Protocol series page line, copied as written.
    bonuses: [
        'The 48-Day Titans Protocol. A day-by-day mental performance system, built one habit at a time.',
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
