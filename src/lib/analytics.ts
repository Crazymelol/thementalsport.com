type Gtag = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

function getGtag(): Gtag | undefined {
    if (typeof window === 'undefined') return undefined;
    const candidate = (window as Window & { gtag?: Gtag }).gtag;
    return typeof candidate === 'function' ? candidate : undefined;
}

export function parsePrice(price: string | number): number {
    if (typeof price === 'number') return Number.isFinite(price) ? price : 0;
    const match = price.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
    if (!match) return 0;
    const value = Number(match[0]);
    return Number.isFinite(value) ? value : 0;
}

// GA4 recommended event. `form_location` says which ConvertKit form converted.
// Existing generate_lead / giveaway_entry calls stay where they are.
export function trackSignUp(formLocation: string): void {
    try {
        getGtag()?.('event', 'sign_up', {
            method: 'ConvertKit',
            form_location: formLocation,
        });
    } catch {
        // A failed analytics call must not fail the signup.
    }
}

// GA4 recommended event. Name and price are sent both as top-level params and
// inside `items`, which is what GA4 ecommerce reports read.
export function trackBeginCheckout(productName: string, price: string | number): void {
    try {
        const value = parsePrice(price);
        getGtag()?.('event', 'begin_checkout', {
            currency: 'USD',
            value,
            item_name: productName,
            price: value,
            items: [
                {
                    item_name: productName,
                    price: value,
                    quantity: 1,
                },
            ],
        });
    } catch {
        // A failed analytics call must not block the Gumroad tab.
    }
}
