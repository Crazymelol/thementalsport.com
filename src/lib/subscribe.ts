// Client-side email capture for the static site. Posts directly to Kit's
// (ConvertKit's) public form-subscription endpoint — the same request Kit's
// own embed forms make from the browser, so no secret API key is exposed.
//
// Set the public form id at build time:  NEXT_PUBLIC_KIT_FORM_ID=<numeric id>
// (find it in Kit -> your form -> the number in the embed/URL). Until it's set,
// subscribing throws a clear message instead of silently failing.

import { trackSignUp } from './analytics';
import { KIT_DEFAULT_FORM_ID } from './kit';

export type SubscribeExtras = {
  firstName?: string;
  /** Extra tag names, in addition to `tag`. Names only — no numeric ids in this repo. */
  tags?: string[];
  /** Override the form. Empty or omitted uses the existing default form. */
  formId?: string;
};

export async function subscribeEmail(
  email: string,
  tag?: string,
  formLocation = 'convertkit',
  extras?: SubscribeExtras,
): Promise<void> {
  const formId = extras?.formId || KIT_DEFAULT_FORM_ID;
  if (!formId) {
    throw new Error("Signup isn't connected yet — email hello@thementalsport.com and we'll send it over.");
  }

  const tags = [...(tag ? [tag] : []), ...(extras?.tags ?? [])].filter(Boolean);
  const firstName = extras?.firstName?.trim();
  const body: Record<string, unknown> = { email_address: email };
  if (firstName) body.first_name = firstName;
  if (tags.length) body.tags = tags;

  const res = await fetch(`https://app.convertkit.com/forms/${formId}/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null) as { status?: string; errors?: { messages?: string[] } } | null;
  if (!res.ok || data?.status === 'failed') {
    throw new Error(data?.errors?.messages?.[0] || "Subscription failed. Please try again.");
  }

  trackSignUp(formLocation);
}
