import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { email } = await request.json();

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const apiKey = process.env.KIT_API_KEY;
    const formId = process.env.KIT_FORM_ID;

    if (!apiKey || !formId) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                email: email,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data.message || 'Failed to subscribe' }, { status: res.status });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
