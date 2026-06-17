import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const authHeader = request.headers.get('Authorization') || '';
  const cookieToken = request.cookies.get('staffAccessToken')?.value 
    || request.cookies.get('adminAccessToken')?.value 
    || request.cookies.get('token')?.value 
    || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader : (cookieToken ? `Bearer ${cookieToken}` : '');

  // Reconstruct query parameters
  const { searchParams } = new URL(request.url);
  const queryStr = searchParams.toString();
  const url = `${BACKEND_URL}/api/chat/${path.join('/')}${queryStr ? `?${queryStr}` : ''}`;

  const method = request.method;
  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': token } : {}),
  };

  let body: any = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      body = await request.blob();
    } else {
      headers['Content-Type'] = 'application/json';
      try {
        const json = await request.json();
        body = JSON.stringify(json);
      } catch (err) {
        body = undefined;
      }
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] Error forwarding request to /chat/${path.join('/')}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export {
  handleProxy as GET,
  handleProxy as POST,
  handleProxy as PUT,
  handleProxy as DELETE,
};
