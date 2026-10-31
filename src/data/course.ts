// Single source for the course offer shown on /course. Link-in-bio, blog
// CTAs, and checkout events read this so the name and price cannot drift.
export const COURSE = {
    name: 'The Mental Performance Protocol',
    price: 297,
    checkoutUrl: 'https://notarasio.gumroad.com/l/qjsfty',
    pitch:
        'The 8-module system elite athletes use to build unshakable confidence, eliminate competition anxiety, and dominate their sport.',
} as const;

// One-line swap if the course bonus is renamed. Not the blog series title.
export const COURSE_BONUS_NAME = 'The 48-Day Mental Performance Protocol' as const;
const COURSE_BONUS_DESCRIPTION = 'A day-by-day mental performance system, built one habit at a time.' as const;

// Confirmed: 8 video modules, about 2 hours 49 minutes. Display rounds to 2 hours 50 minutes.
// `full` is the /course line. `short` is the same count for tighter spots.
export const COURSE_LESSON_COUNT = {
    full: '8 in-depth video modules (about 2 hours 50 minutes)',
    short: '8 in-depth video modules',
} as const;

// Coach wording and the bonus name are confirmed. Do not add ratings, review counts,
// client logos, or credentials he has not confirmed.
export const COURSE_PAGE_DRAFT = {
    coach: {
        heading: 'Who is your coach',
        lead: 'Coach of the Greek pre-Olympic sabre squad for LA 2028, and coach at A.O. Apollon Vrilission',
        support:
            'He founded The Mental Sport and has written a series of books on the mental side of competition.',
    },
    bonuses: [`${COURSE_BONUS_NAME}. ${COURSE_BONUS_DESCRIPTION}`],
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
