import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes — no auth needed
const PUBLIC_ROUTES = ['/login', '/forgot-password'];

// Static/API paths to always let through
const SKIP_PREFIXES = ['/_next', '/api', '/favicon'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes and static assets
  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    SKIP_PREFIXES.some(p => pathname.startsWith(p)) ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (set by AuthContext on login)
  const sessionCookie = request.cookies.get('annaitech_session');

  if (!sessionCookie?.value) {
    // Not authenticated → send to login
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated: let the client-side AppShell handle role-based routing
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
