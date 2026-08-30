import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication (explicit list; FE-04).
const protectedPrefixes = [
  '/dashboard',
  '/projects',
  '/trends',
  '/scripts',
  '/media',
  '/analytics',
  '/audio',
  '/thumbnails',
  '/planner',
  '/titles',
  '/hashtags',
  '/team',
  '/settings',
  '/panel',
];

// Routes that should redirect to dashboard if already authenticated
const authPrefixes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = request.cookies.has('auth_session') || request.cookies.has('__Host-auth_session');

  // Check if accessing a protected route without auth
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated, redirect away from auth pages
  const isAuthRoute = authPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isAuthRoute && hasAuthCookie) {
    const from = request.nextUrl.searchParams.get('from') || request.nextUrl.searchParams.get('callbackUrl');
    return NextResponse.redirect(new URL(from || '/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
