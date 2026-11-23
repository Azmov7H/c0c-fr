import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { verifySessionToken } from '@/lib/auth-verify';
import { isAppLocale, routing } from '@/i18n/routing';
import type { AppLocale } from '@/i18n/routing';

/**
 * Optimistic gate, NOT an authorization boundary.
 *
 * Decision D2 (tasks/plan/ARCHITECTURE.md): the middleware never reads the
 * database; the backend remains the only authority on what a user may do.
 * This file decides three things: which locale a request is rendered in,
 * whether to bounce a stranger without a valid session to /login, and which
 * CSP header to hand the browser.
 *
 * Modes via AUTH_MIDDLEWARE_MODE (read per request — an env change plus a
 * restart, no rebuild):
 *   verify   (default) — cryptographically verify signature + expiry
 *   presence — pre-T09 behaviour (cookie presence only); rollback escape hatch
 *   off      — no auth gate at all (last resort)
 *
 * Protected prefixes are an explicit list (FE-04); /onboarding joined in T13 —
 * a signed-out visitor gets bounced to login with a callback, while the
 * completed/incomplete routing itself is client-side (the flag lives in the
 * session payload, and the backend's 428 remains the real boundary).
 *
 * AR-005 — the locale composition (ROUTING-STRATEGY §5):
 *
 *   1. the locale middleware runs FIRST: it negotiates the locale, redirects
 *      a locale-less path to the negotiated locale and hands the request on;
 *   2. the auth gate then runs against the LOCALE-STRIPPED path, so the
 *      prefix lists below stay in their plain form (`/dashboard`, not
 *      `/en/dashboard`) and there is exactly one place that knows about the
 *      prefix;
 *   3. the CSP nonce is attached last, on the request that is passed through.
 */

/**
 * Pages a signed-in user is redirected away from. `/register` is not here:
 * it is a 301 handler to /signup (T12), and reset/verify pages must stay
 * reachable regardless of session state (see session-initializer.tsx).
 */
const protectedPrefixes = [
    '/admin', // AP-019 — the console is an internal surface (optimistic gate).
    '/dashboard',
    '/onboarding',
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

const authPrefixes = ['/login', '/signup', '/forgot-password'];

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
 *
 * AR-005: a locale-prefixed path (`/ar/dashboard`) is a valid target — it is
 * still a single-slash, same-origin path, and the locale prefix is part of
 * the route, not of the origin. The invariant is unchanged; only the set of
 * accepted targets grew.
 */
export function sanitizeRedirectPath(
    target: string | null | undefined,
    fallback = '/dashboard'
): string {
    if (!target) return fallback;
    if (!/^\/($|[^/\\])/.test(target)) return fallback;
    return target;
}

/**
 * Splits a request path into its locale and the locale-less path the auth
 * gate matches against.
 *
 * `/en/dashboard` → `{ locale: 'en', corePath: '/dashboard' }`
 * `/dashboard`    → `{ locale: 'en', corePath: '/dashboard' }` (the default
 *                    locale: the locale middleware redirects this path to
 *                    `/en/dashboard` before the gate ever sees it)
 */
export function splitLocalePath(pathname: string): { locale: AppLocale; corePath: string } {
    const segments = pathname.split('/');
    const first = segments[1];
    if (isAppLocale(first)) {
        const rest = segments.slice(2).join('/');
        return { locale: first, corePath: `/${rest}` };
    }
    return { locale: routing.defaultLocale, corePath: pathname };
}

function createNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
}

/**
 * AP-019 — the `/admin` prefix (UI-UX-SPEC §2.4, `src/app/[locale]/(admin)`).
 * `isAdminPath` matches the locale-less core path (`/admin`, `/admin/…`).
 */
const isAdminPath = (corePath: string): boolean =>
    corePath === '/admin' || corePath.startsWith('/admin/');

/** AP-019 — every /admin route is noindex + no-store (an internal surface). */
const applyAdminHeaders = (response: NextResponse): void => {
    response.headers.set('x-robots-tag', 'noindex');
    response.headers.set('cache-control', 'no-store');
};

export function buildContentSecurityPolicy(scriptNonce: string, enforce = false): string {
    return [
        "default-src 'self'",
        // Per-request nonce + strict-dynamic: no 'unsafe-inline' for scripts, ever.
        // `https:` is a CSP2 fallback only; CSP3 browsers ignore it once strict-dynamic
        // is present, but CSP2-only agents still need it for Next's bootstrap.
        `script-src 'self' 'nonce-${scriptNonce}' 'strict-dynamic' https:`,
        // Required by Tailwind v4's injected styles and Radix's runtime style
        // attributes. Documented rather than pretended away — scripts stay nonce-only.
        "style-src 'self' 'unsafe-inline'",
        // `images.unsplash.com` is the Unsplash CDN: the photos picked with the
        // stock-photo picker are hotlinked from it (the URL the API returned,
        // ixid included), so the browser has to be allowed to load them.
        "img-src 'self' data: blob: https://images.unsplash.com",
        // next/font self-hosts (T08); data: covers inlined subsets.
        "font-src 'self' data:",
        // Same-origin topology (FE-01): BFF and socket both go through this origin.
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        // Meaningless inside a report-only policy — browsers log console errors
        // and ignore it (T11 Lighthouse a11y/BP pass). Enforcing policies get it.
        ...(enforce ? ['upgrade-insecure-requests'] : []),
    ].join('; ');
}

/**
 * The locale middleware (AR-002). It resolves the locale from the URL, the
 * cookie or `Accept-Language`, redirects a locale-less path to the
 * negotiated locale and remembers the choice in the locale cookie.
 */
const handleI18nRouting = createMiddleware(routing);

/** A redirect response — the locale middleware's answer to a locale-less path. */
function isRedirect(response: Response): boolean {
    return response.status >= 300 && response.status < 400;
}

export async function proxy(request: NextRequest) {
    const mode = process.env.AUTH_MIDDLEWARE_MODE ?? 'verify';

    // ── 1. the locale ──────────────────────────────────────────────────────
    // The locale middleware runs first and owns the redirect matrix: a
    // locale-less path is answered with a redirect to the negotiated locale,
    // and the auth gate then sees the locale-prefixed path.
    const intlResponse = handleI18nRouting(request);
    if (isRedirect(intlResponse)) return intlResponse;

    const { pathname } = request.nextUrl;
    const { locale, corePath } = splitLocalePath(pathname);

    if (mode === 'off') return intlResponse;

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

    const isProtectedRoute = protectedPrefixes.some((prefix) => corePath.startsWith(prefix));

    if (isProtectedRoute && !authenticated) {
        // The login page is locale-aware and the callback keeps the locale,
        // so a signed-out visitor lands in the language they asked for.
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set('callbackUrl', `/${locale}${corePath}`);
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

    const isAuthRoute = authPrefixes.some((prefix) => corePath.startsWith(prefix));

    if (isAuthRoute && authenticated) {
        const from = sanitizeRedirectPath(
            request.nextUrl.searchParams.get('from') ??
                request.nextUrl.searchParams.get('callbackUrl'),
            `/${locale}/dashboard`
        );
        return NextResponse.redirect(new URL(from, request.url));
    }

    // ── 3. the CSP ─────────────────────────────────────────────────────────
    // CSP: report-only until the reports are clean; CSP_ENFORCE=true flips the header
    // name. A config change, not a rebuild — and trivially revertible.
    const scriptNonce = createNonce();
    const enforce = process.env.CSP_ENFORCE === 'true';
    const headerName = enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
    const policy = buildContentSecurityPolicy(scriptNonce, enforce);

    const requestHeaders = new Headers(request.headers);
    // Next.js reads this to stamp the per-request nonce onto its inline scripts.
    requestHeaders.set('x-nonce', scriptNonce);
    // …and it reads the POLICY on the request, not only on the response: the
    // nonce is extracted from the request's CSP header while the page is
    // rendered. Without the policy on the request, the rendered scripts carry
    // no nonce at all and the enforced policy would block them.
    requestHeaders.set(headerName, policy);

    // The locale middleware's response carries the locale cookie and the
    // alternate-links header; the request it built carries the locale. The
    // pass-through is re-issued here so the CSP nonce can ride along on the
    // REQUEST headers (that is where Next.js reads it from).
    const response = NextResponse.next({
        request: { headers: requestHeaders },
        headers: intlResponse.headers,
    });
    response.headers.set(headerName, policy);
    // Observability marker (T21): distinguishes "proved by the auth gate" from
    // "reached the edge without the gate active" (mode: off bypasses above and
    // never carries this header).
    response.headers.set('x-proxy-next', '1');
    // AP-019 — the admin console: nothing about it is SEO-visible or shareable.
    if (isAdminPath(corePath)) applyAdminHeaders(response);

    return response;
}

export const config = {
    matcher: [
        // Document routes only. API handlers police themselves (BFF routes check
        // cookies, the backend checks tokens), and static assets — images, fonts,
        // favicon, manifest, service worker, anything with a file extension — are
        // exempt so the gate is not paid on every byte (R-14).
        //
        // `/register` is exempt as well: it is a 301 handler to `/signup` that
        // must stay outside the locale processing (ROUTING-STRATEGY §5.6) — the
        // signup target is resolved by the locale middleware's default-locale
        // redirect.
        '/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|register$|.*\\..*).*)',
    ],
};
