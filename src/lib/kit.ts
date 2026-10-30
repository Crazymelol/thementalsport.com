// ConvertKit (Kit) ids that already exist in this repo. Do not invent new
// numeric ids here. Dedicated forms are optional overrides; blank means the
// signup still posts to the live default form.

/** Public form used by newsletter, book-chapter, giveaway, and these gates. */
export const KIT_DEFAULT_FORM_ID = process.env.NEXT_PUBLIC_KIT_FORM_ID || '9008498';

/**
 * Optional. In ConvertKit, create a form named "Free 7-Day Protocol", attach
 * the tag `free-protocol`, and set NEXT_PUBLIC_KIT_FORM_PROTOCOL to that
 * form's numeric id. Until then, protocol signups use KIT_DEFAULT_FORM_ID
 * and still send the `free-protocol` tag name.
 */
export const KIT_FORM_PROTOCOL_ID = process.env.NEXT_PUBLIC_KIT_FORM_PROTOCOL || '';

/**
 * Optional. In ConvertKit, create a form named "Mental Game Quiz", attach
 * the tag `quiz`, and set NEXT_PUBLIC_KIT_FORM_QUIZ to that form's numeric id.
 * Until then, quiz signups use KIT_DEFAULT_FORM_ID and still send `quiz` plus
 * the result tag (`quiz-nerves`, `quiz-focus`, `quiz-confidence`, `quiz-recovery`).
 */
export const KIT_FORM_QUIZ_ID = process.env.NEXT_PUBLIC_KIT_FORM_QUIZ || '';

/**
 * Optional. In ConvertKit, create a form named "The Reset Between Points",
 * attach the tag `lead-magnet-reset-between-points`, and set
 * NEXT_PUBLIC_KIT_FORM_RESET_GUIDE to that form's numeric id. Until then,
 * guide signups use KIT_DEFAULT_FORM_ID and still send the tag name.
 */
export const KIT_FORM_RESET_GUIDE_ID = process.env.NEXT_PUBLIC_KIT_FORM_RESET_GUIDE || '';

/** Tag names. Create these in ConvertKit if they are not already on the form. */
export const KIT_TAGS = {
    protocol: 'free-protocol',
    quiz: 'quiz',
    resetGuide: 'lead-magnet-reset-between-points',
} as const;

/** Public path of the free guide PDF (served from /public). */
export const RESET_GUIDE_PDF_PATH = '/guides/the-reset-between-points.pdf';

export function quizResultTag(dimension: string): string {
    return `quiz-${dimension}`;
}
