import { NextResponse } from 'next/server';

const domainCache: Record<string, string> = {};
let pendingRequests: Record<string, Promise<string | null> | undefined> = {};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const country = searchParams.get('country') || '';

    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const cacheKey = `${name}-${country}`.toLowerCase();

    // Check cache
    if (domainCache[cacheKey]) {
        return NextResponse.json({ domain: domainCache[cacheKey] });
    }

    // De-duplicate in-flight requests
    if (pendingRequests[cacheKey]) {
        try {
            const domain = await pendingRequests[cacheKey];
            return NextResponse.json({ domain });
        } catch (e) {
            return NextResponse.json({ domain: null });
        }
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
        return NextResponse.json({ error: 'GROQ API Key not configured' }, { status: 500 });
    }

    const promise = (async () => {
        try {
            const prompt = `What is the primary, official website domain for the university/college "${name}" located in "${country}"? Reply STRICTLY with ONLY the raw domain name (e.g., harvard.edu, ox.ac.uk, utoronto.ca). Do not include http://, https://, or www. Do not write any explanations or other words. If you are entirely unsure, reply with UNKNOWN.`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0,
                    max_tokens: 15,
                })
            });

            if (!response.ok) {
                console.error('Groq API Error:', await response.text());
                return null;
            }

            const data = await response.json();
            const message = data.choices?.[0]?.message?.content?.trim();

            if (!message || message === 'UNKNOWN' || message.includes(' ')) {
                return null;
            }

            const cleanDomain = message.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase();
            domainCache[cacheKey] = cleanDomain;
            return cleanDomain;
        } catch (error) {
            console.error('Failed to fetch university domain:', error);
            return null;
        } finally {
            delete pendingRequests[cacheKey];
        }
    })();

    pendingRequests[cacheKey] = promise;

    const domain = await promise;
    return NextResponse.json({ domain });
}
