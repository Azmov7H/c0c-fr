/** T18: the auth cookie contract. The same file must produce two attribute
 *  sets — dev (unprefixed, insecure) and production (__Host- prefix, secure) —
 *  plus the 7-day default lifetime and env override.
 */
import { describe, expect, it, vi } from 'vitest';

type AuthCookies = typeof import('./auth-cookies');

/**
 * TS reads NODE_ENV as a literal union, so direct assignment fails to compile
 * even though `process.env` is trivially mutable at runtime. Cast once, mutate
 * two fields, restore both.
 */
function mutateEnv(mutator: (env: Record<string, string | undefined>) => void): () => void {
    const env = process.env as Record<string, string | undefined>;
    const before = { NODE_ENV: env.NODE_ENV, SESSION_COOKIE_MAX_AGE: env.SESSION_COOKIE_MAX_AGE };
    mutator(env);
    return () => {
        env.NODE_ENV = before.NODE_ENV;
        env.SESSION_COOKIE_MAX_AGE = before.SESSION_COOKIE_MAX_AGE;
    };
}

async function loadWithEnv(nodeEnv: string, maxAgeEnv?: string): Promise<AuthCookies> {
    vi.resetModules();
    const restore = mutateEnv((env) => {
        env.NODE_ENV = nodeEnv;
        if (maxAgeEnv === undefined) delete env.SESSION_COOKIE_MAX_AGE;
        else env.SESSION_COOKIE_MAX_AGE = maxAgeEnv;
    });
    try {
        return await import('./auth-cookies');
    } finally {
        restore();
    }
}

describe('auth cookie contract', () => {
    it('production: __Host- prefixes, Secure, path=/ (the [Unforgeable] part of the __Host- rules)', async () => {
        const m = await loadWithEnv('production');

        expect(m.SESSION_COOKIE).toBe('__Host-auth_session');
        expect(m.REFRESH_COOKIE).toBe('__Host-refresh_token');

        const set = m.authCookieOptions({ maxAge: 10 });
        expect(set).toEqual({
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 10,
        });
    });

    it('development: unprefixed cookies without Secure (browsers reject __Host- on http)', async () => {
        const m = await loadWithEnv('test');

        expect(m.SESSION_COOKIE).toBe('auth_session');
        expect(m.REFRESH_COOKIE).toBe('refresh_token');

        const set = m.authCookieOptions({ maxAge: 10 });
        expect(set.secure).toBe(false);
        expect(set.httpOnly).toBe(true);
        expect(set.sameSite).toBe('lax');
    });

    it('session lifetime defaults to 7 days (it tracks the refresh token, not the access TTL)', async () => {
        const m = await loadWithEnv('test');
        expect(m.SESSION_COOKIE_MAX_AGE).toBe(7 * 24 * 60 * 60);
    });

    it('SESSION_COOKIE_MAX_AGE env var overrides the default as an integer', async () => {
        const m = await loadWithEnv('test', '30');
        expect(m.SESSION_COOKIE_MAX_AGE).toBe(30);
    });

    it('clear options zero the age so the browser drops the cookie', async () => {
        const m = await loadWithEnv('test');
        expect(m.clearCookieOptions()).toEqual({
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
    });
});
