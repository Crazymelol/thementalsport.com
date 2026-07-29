// Client-side email capture for the static site. Posts directly to Kit's
// (ConvertKit's) public form-subscription endpoint — the same request Kit's
// own embed forms make from the browser, so no secret API key is exposed.
//
// Set the public form id at build time:  NEXT_PUBLIC_KIT_FORM_ID=<numeric id>
// (find it in Kit -> your form -> the number in the embed/URL). Until it's set,
// subscribing throws a clear message instead of silently failing.

export async function subscribeEmail(email: string, tag?: string): Promise<void> {
  const formId = process.env.NEXT_PUBLIC_KIT_FORM_ID;
  if (!formId) {
    throw new Error("Signup isn't connected yet — email hello@thementalsport.com and we'll send it over.");
  }

  const res = await fetch(`https://app.convertkit.com/forms/${formId}/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email_address: email, ...(tag ? { tags: [tag] } : {}) }),
  });

  if (!res.ok) {
    throw new Error("Subscription failed. Please try again.");
  }
}
