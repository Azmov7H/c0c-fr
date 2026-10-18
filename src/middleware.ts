import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth-verify';

/**
 * Optimistic gate, NOT an authorization boundary.
 *
 * Decision D2 (tasks/plan/ARCHITECTURE.md): the middleware never reads the
 * database; the backend remains the only authority on what a user may do.
 * This file decides two things: whether to bounce a stranger without a valid
 * session to /login, and which CSP header to hand the browser.
 *
 * Modes via AUTH_MIDDLEWARE_MODE (read per request — an env change plus a
 * restart, no rebuild):
 *   verify   (default) — cryptographically verify signature + expiry
 *   presence — pre-T09 behaviour (cookie presence only); rollback escape hatch
 *   off      — no auth gate at all (last resort)
 *
 * Protected prefixes are an explicit list (FE-04); /onboarding joins when T13
 * lands.
 */

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
    '/seo',
    '/team',
    '/settings',
];

const authPrefixes = ['/login', '/register'];

/**
 * Both names are checked regardless of NODE_ENV: the middleware bundle can be
 * built in one environment and served in another, so it must recognise the
 * cookie contract (src/lib/auth-cookies.ts) either way.
 */
const SESSION_COOKIE_NAMES = ['__Host-auth_session', 'auth_session'] as const;

function readSessionCookie(request: NextRequest): { name: string; value: string } | null {
    for (const name of SESSION_COOKIE_NAMES) {
        const value = request.cookies.get(name)?.value;
        if (value) return { name, value };
    }
    return null;
}

/**
 * Only same-origin, single-slash paths are valid redirect targets.
 * `startsWith('/')` alone is not enough: `//evil.com` and `/\evil.com` both
 * parse as absolute URLs in `new URL(target, base)` — that is the open
 * redirect this guard exists to stop.
 */
export function sanitizeRedirectPath(
    target: string | null | undefined,
    fallback = '/dashboard'
): string {
    if (!target) return fallback;
    if (!/^\/($|[^/\\])/.test(target)) return fallback;
    return target;
}

function createNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
}

export function buildContentSecurityPolicy(scriptNonce: string): string {
    return [
        "default-src 'self'",
        // Per-request nonce + strict-dynamic: no 'unsafe-inline' for scripts, ever.
        // `https:` is a CSP2 fallback only; CSP3 browsers ignore it once strict-dynamic
        // is present, but CSP2-only agents still need it for Next's bootstrap.
        `script-src 'self' 'nonce-${scriptNonce}' 'strict-dynamic' https:`,
        // Required by Tailwind v4's injected styles and Radix's runtime style
        // attributes. Documented rather than pretended away — scripts stay nonce-only.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        // next/font self-hosts (T08); data: covers inlined subsets.
        "font-src 'self' data:",
        // Same-origin topology (FE-01): BFF and socket both go through this origin.
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        'upgrade-insecure-requests',
    ].join('; ');
}

export async function middleware(request: NextRequest) {
    const mode = process.env.AUTH_MIDDLEWARE_MODE ?? 'verify';
    if (mode === 'off') return NextResponse.next();

    const { pathname } = request.nextUrl;
    const session = readSessionCookie(request);

    let authenticated = false;
    if (session) {
        if (mode === 'presence') {
            authenticated = true;
        } else {
            try {
                authenticated = (await verifySessionToken(session.value)) !== null;
            } catch (error) {
                // Fail closed. If verification itself broke (missing secret, runtime
                // fault), the user is bounced to login — never let an unverifiable
                // gate fall through to the app.
                console.error('[middleware] session verification failed closed:', error);
                authenticated = false;
            }
        }
    }

    const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isProtectedRoute && !authenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
        const response = NextResponse.redirect(loginUrl);
        if (session) {
            // Expired, forged or revoked: drop the useless cookie so the browser
            // stops re-sending it. Attributes mirror clearCookieOptions().
            response.cookies.set(session.name, '', {
                path: '/',
                maxAge: 0,
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });
        }
        return response;
    }

    const isAuthRoute = authPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isAuthRoute && authenticated) {
        const from = sanitizeRedirectPath(
            request.nextUrl.searchParams.get('from') ??
                request.nextUrl.searchParams.get('callbackUrl')
        );
        return NextResponse.redirect(new URL(from, request.url));
    }

    // CSP: report-only until the reports are clean; CSP_ENFORCE=true flips the header
    // name. A config change, not a rebuild — and trivially revertible.
    const scriptNonce = createNonce();
    const requestHeaders = new Headers(request.headers);
    // Next.js reads this to stamp the per-request nonce onto its inline scripts.
    requestHeaders.set('x-nonce', scriptNonce);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    const headerName =
        process.env.CSP_ENFORCE === 'true'
            ? 'Content-Security-Policy'
            : 'Content-Security-Policy-Report-Only';
    response.headers.set(headerName, buildContentSecurityPolicy(scriptNonce));

    return response;
}

export const config = {
    matcher: [
        // Document routes only. API handlers police themselves (BFF routes check
        // cookies, the backend checks tokens), and static assets — images, fonts,
        // favicon, manifest, service worker, anything with a file extension — are
        // exempt so the gate is not paid on every byte (R-14).
        '/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|.*\\..*).*)',
    ],
};
