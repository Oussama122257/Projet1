import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const publicPaths = ['/', '/auth', '/track', '/api/webhooks', '/api/tracking'];
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));

  if (isPublic) {
    return NextResponse.next();
  }

  // For dashboard routes, check for session (simplified - use proper auth in production)
  if (pathname.startsWith('/dashboard')) {
    // In production, verify JWT session cookie here
    // For now, allow access for development
    return NextResponse.next();
  }

  // For API routes, check for shop ID header
  if (pathname.startsWith('/api/')) {
    // In production, verify JWT and extract shop ID
    // For development, we pass through
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|carriers/).*)',
  ],
};
