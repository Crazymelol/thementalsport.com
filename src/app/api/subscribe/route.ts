import { NextResponse } from 'next/server';

let cachedFormId: string | null = null;

async function getFormId(apiKey: string): Promise<string | null> {
    if (cachedFormId) return cachedFormId;
    const configuredId = process.env.KIT_FORM_ID;
    if (configuredId) {
        cachedFormId = configuredId;
        return cachedFormId;
    }
    // Auto-discover first available form
    const res = await fetch(`https://api.convertkit.com/v3/forms?api_key=${apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    const id = data.forms?.[0]?.id?.toString() ?? null;
    if (id) cachedFormId = id;
    return id;
}

export async function POST(request: Request) {
    const { email, tag } = await request.json();

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const apiKey = process.env.KIT_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const formId = await getFormId(apiKey);
        if (!formId) {
            return NextResponse.json({ error: 'No ConvertKit form found' }, { status: 500 });
        }

        const body: Record<string, unknown> = { api_key: apiKey, email };
        if (tag) body.tags = [tag];

        const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data.message || 'Failed to subscribe' }, { status: res.status });
        }

        // Fire the n8n nurture sequence webhook (fire-and-forget)
        const n8nWebhook = process.env.N8N_NURTURE_WEBHOOK;
        if (n8nWebhook) {
            fetch(n8nWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, tag }),
            }).catch(() => { /* fire-and-forget */ });
        }

        return NextResponse.json({ success: true, data });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
