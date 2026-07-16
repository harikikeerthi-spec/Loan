import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref');

  if (ref) {
    const targetPages = ['/', '/apply-loan', '/loan-eligibility'];
    if (targetPages.includes(url.pathname)) {
      const existingCookie = request.cookies.get('referral_code');
      if (!existingCookie) {
        const response = NextResponse.next();
        response.cookies.set('referral_code', ref, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        });
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/apply-loan', '/loan-eligibility'],
};
