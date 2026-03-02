import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const res = await fetch(`${BACKEND_URL}/api/ai/visa-interview/final-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Visa interview final-report proxy error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to generate report' },
            { status: 500 }
        );
    }
}
