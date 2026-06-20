import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = (request: NextRequest) => {
  const hostname = request.nextUrl.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const cookieToken = request.cookies.get('staffAccessToken')?.value 
    || request.cookies.get('adminAccessToken')?.value 
    || request.cookies.get('token')?.value 
    || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader : (cookieToken ? `Bearer ${cookieToken}` : '');

  // Extract query parameters
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const limit = searchParams.get('limit') || '';
  const offset = searchParams.get('offset') || '';

  const backendQuery = new URLSearchParams();
  if (type) backendQuery.set('type', type);
  if (limit) backendQuery.set('limit', limit);
  if (offset) backendQuery.set('offset', offset);

  const queryStr = backendQuery.toString();
  const backendUrl = getBackendUrl(request);
  const url = `${backendUrl}/api/notifications${queryStr ? `?${queryStr}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': token } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
