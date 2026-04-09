import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, Next.js internals, and the login page/auth API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname === '/login' ||
    pathname === '/api/auth'
  ) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get('auth_role')?.value;

  // If no auth cookie, redirect to login
  if (!roleCookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is a 1on1_viewer, they can only access /1on1 and APIs
  if (roleCookie === '1on1_viewer') {
    if (!pathname.startsWith('/1on1') && !pathname.startsWith('/api')) {
      const redirectUrl = new URL('/1on1', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Admin has full access, 1on1_viewer is already contained, so proceed
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all paths except the ones filtered out via conditional above
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
