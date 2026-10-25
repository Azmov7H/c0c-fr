import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST } from './route';
import { buildBackendMock, makeRequest, cookiesOf } from '../../../../../tests/helpers/auth-route';

/** T18: the session route had no test of its own — it is the boot-time
 *  endpoint (SessionInitializer) and the silent-refresh path for an expired
 *  access cookie, so drift here breaks login for everyone at once.
 */
const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';
const ME = { success: true, data: { id: 'u1', email: 'a@b.c', name: 'A', role: 'user' } };

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/session', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('POST → 405 method not allowed', async () => {
        const res = await POST();
        expect(res.status).toBe(405);
    });

    it('no cookies at all → unauthenticated, and no clearing churn', async () => {
        const res = await GET(
            makeRequest({ method: 'GET', url: 'http://localhost/api/auth/session' })
        );
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            success: true,
            data: { authenticated: false },
        });
        expect(cookiesOf(res)).toHaveLength(0);
    });

    it('valid access token → /me consulted, authenticated payload returned', async () => {
        const installed = backend.install([{ status: 200, body: ME }]);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [sessionName]: 'access-1' },
            })
        );

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data).toEqual({ authenticated: true, user: ME.data });
        expect(installed.remaining()).toBe(0);
    });

    it('expired access token + refresh cookie → silent refresh, rotated cookies, user payload', async () => {
        backend.install([
            { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED' } } }, // me (access)
            {
                status: 200,
                body: { success: true, data: { accessToken: 'access-2', refreshToken: 'refresh-2' } },
            },
            { status: 200, body: ME },
        ]);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [sessionName]: 'access-1', [refreshName]: 'refresh-1' },
            })
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            success: true,
            data: { authenticated: true, user: ME.data },
        });
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('access-2');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('refresh-2');
    });

    it('refresh fails after an expired access token → cookies cleared, unauthenticated', async () => {
        backend.install([
            { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED' } } }, // me
            { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED' } } }, // refresh
        ]);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [sessionName]: 'access-1', [refreshName]: 'refresh-1' },
            })
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            success: true,
            data: { authenticated: false },
        });
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });

    it('backend unreachable for /me with no refresh cookie → cleared, unauthenticated (fail closed)', async () => {
        const fetchThrow = vi.fn(async () => {
            throw new Error('ECONNREFUSED');
        });
        vi.stubGlobal('fetch', fetchThrow);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [sessionName]: 'access-1' },
            })
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            success: true,
            data: { authenticated: false },
        });
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
    });

    it('a REFRESH-ONLY session (expired access cookie) falls back to the refresh leg and issues a fresh session', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/auth/me')) {
                return new Response(JSON.stringify(ME), { status: 200 });
            }
            if (url.includes('/auth/refresh')) {
                return new Response(JSON.stringify({ success: true, data: { accessToken: 'a2' } }), {
                    status: 200,
                });
            }
            return new Response('{}', { status: 404 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [refreshName]: 'r-old' },
            })
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
            success: true,
            data: { authenticated: true },
        });
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('a2');
        // No rotation offered by the backend → the old refresh cookie stays put.
        expect(cookies.find((c) => c.name === refreshName)).toBeUndefined();
    });

    it('a rotated refresh response re-issues BOTH cookies', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/auth/me')) {
                return new Response(JSON.stringify(ME), { status: 200 });
            }
            if (url.includes('/auth/refresh')) {
                return new Response(
                    JSON.stringify({ success: true, data: { accessToken: 'a2', refreshToken: 'r2' } }),
                    { status: 200 }
                );
            }
            return new Response('{}', { status: 404 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [refreshName]: 'r-old' },
            })
        );

        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('a2');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('r2');
    });

    it('a me probe that fails EVEN after refresh clears the session instead of admitting anyone', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/auth/me')) return new Response('{}', { status: 401 });
            if (url.includes('/auth/refresh')) {
                return new Response(JSON.stringify({ success: true, data: { accessToken: 'a2' } }), {
                    status: 200,
                });
            }
            return new Response('{}', { status: 404 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [refreshName]: 'r-old' },
            })
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            success: true,
            data: { authenticated: false },
        });
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
    });

    it('a refresh transport failure clears the boot session rather than 500ing it', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            if (String(input).includes('/auth/refresh')) throw new Error('ECONNREFUSED');
            return new Response('{}', { status: 401 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/session',
                cookies: { [refreshName]: 'r-old' },
            })
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ success: true, data: { authenticated: false } });
    });
});
