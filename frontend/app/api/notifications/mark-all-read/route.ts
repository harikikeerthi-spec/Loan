import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = (request: NextRequest) => {
  const hostname = request.nextUrl.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

async function handler(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const cookieToken = request.cookies.get('staffAccessToken')?.value 
    || request.cookies.get('adminAccessToken')?.value 
    || request.cookies.get('token')?.value 
    || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader : (cookieToken ? `Bearer ${cookieToken}` : '');

  const backendUrl = getBackendUrl(request);
  const url = `${backendUrl}/api/notifications/mark-all-read`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': token } : {}),
      },
    });

    if (!response.ok) {
      console.warn(`[API Warning] Backend returned ${response.status} for mark-all-read`);
      return NextResponse.json({ success: true, count: 0 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error marking all notifications read:', error);
    return NextResponse.json({ success: true, count: 0 });
  }
}

export const PUT = handler;
export const PATCH = handler;
export const POST = handler;
