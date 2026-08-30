// Shared cookie contract for the same-origin auth topology.
// Production uses the __Host- prefix (requires Secure + path=/).
// Development (over http://localhost) falls back to unprefixed names because
// __Host- mandates Secure, which the browser rejects on non-secure origins.

const IS_PROD = process.env.NODE_ENV === 'production';

export const SESSION_COOKIE = IS_PROD ? '__Host-auth_session' : 'auth_session';
export const REFRESH_COOKIE = IS_PROD ? '__Host-refresh_token' : 'refresh_token';

// Session cookie lifetime tracks the refresh lifetime (AUTH-03), NOT the short
// access-token TTL. The 401->refresh interceptor is the single recovery path.
const DEFAULT_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const SESSION_COOKIE_MAX_AGE = parseInt(
    process.env.SESSION_COOKIE_MAX_AGE || String(DEFAULT_SESSION_MAX_AGE_SECONDS),
    10
);

export interface AuthCookieOptions {
    maxAge: number;
    path?: string;
    httpOnly?: boolean;
}

export function authCookieOptions({ maxAge, path = '/', httpOnly = true }: AuthCookieOptions) {
    return {
        httpOnly,
        secure: IS_PROD,
        sameSite: 'lax' as const,
        path,
        maxAge,
    };
}

export function clearCookieOptions() {
    return {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 0,
    };
}
