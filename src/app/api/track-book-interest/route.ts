import { NextResponse } from 'next/server';

// Called when a visitor clicks "Buy on Amazon" on a book page.
// Tags them in ConvertKit so an automated sequence can follow up.
export async function POST(request: Request) {
    const { email, bookId, bookTitle } = await request.json();

    if (!email || !bookId) {
        return NextResponse.json({ error: 'email and bookId are required' }, { status: 400 });
    }

    const apiKey = process.env.KIT_API_KEY;
    const formId = process.env.KIT_FORM_ID;

    if (!apiKey || !formId) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const tag = `book-interest-${bookId}`;
        const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                email,
                tags: [tag],
                fields: { last_book_viewed: bookTitle ?? bookId },
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({ error: data.message || 'Failed' }, { status: res.status });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
