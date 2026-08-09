import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  try {
    const res = await fetch(`${backendUrl}/api/auth/csrf-token`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const response = NextResponse.json(data);
      const getSetCookie = (res.headers as any).getSetCookie?.bind(res.headers);
      const cookies: string[] = getSetCookie ? getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean) as string[];
      cookies.forEach((cookie) => {
        response.headers.append('set-cookie', cookie);
      });
      return response;
    }
  } catch (e) {
    // Fallback response if NestJS is starting or offline
  }
  return NextResponse.json({ success: true, csrfToken: 'vidyaloans_default_csrf_token' });
}

