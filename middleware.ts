import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow admin routes to be handled by Next.js
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};