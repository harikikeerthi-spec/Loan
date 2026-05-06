import { NextResponse } from 'next/server';

type Body = {
  countries: string[];
  limit?: number;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const countries = body.countries || [];
    const limit = body.limit || 40;

    if (!Array.isArray(countries) || countries.length === 0) {
      return NextResponse.json({ error: 'No countries provided', results: [] }, { status: 400 });
    }

    const results: any[] = [];
    const seen = new Set<string>();

    await Promise.all(countries.map(async (country) => {
      const url = `http://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      for (const u of data.slice(0, limit)) {
        const key = `${u.name}::${u.country}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(u);
        }
      }
    }));

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err), results: [] }, { status: 500 });
  }
}
