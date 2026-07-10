import { NextResponse } from 'next/server';
import { fetchUniversityData, ReqBody } from '@/lib/aiSearchService';

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();
    const result = await fetchUniversityData(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API Search Route Error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
