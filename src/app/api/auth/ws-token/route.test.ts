import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST } from './route';
import { buildBackendMock, makeRequest } from '../../../../../tests/helpers/auth-route';

/** T18: the ws-token route is the socket-auth boundary; a regression hands
 *  either an unusable token (silent disconnects) or the session cookie value
 *  downstream. Both halves were untested before this file.
 */
const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/ws-token', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('POST → 405 method not allowed', async () => {
        const res = await POST();
        expect(res.status).toBe(405);
    });

    it('no session cookie → 401 envelope, backend never called', async () => {
        const res = await GET(
            makeRequest({ method: 'GET', url: 'http://localhost/api/auth/ws-token' })
        );

        expect(res.status).toBe(401);
        await expect(res.json()).resolves.toEqual({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' },
        });
    });

    it('session cookie → backend ws-token consulted with the bearer token', async () => {
        const seen: Array<{ url: string; init?: RequestInit }> = [];
        const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
            seen.push({ url: String(url), init });
            return new Response(
                JSON.stringify({ success: true, data: { wsToken: 'ws-1' } }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        });
        vi.stubGlobal('fetch', fetchMock);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/ws-token',
                cookies: { [sessionName]: 'access-1' },
            })
        );

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            success: true,
            data: { wsToken: 'ws-1' },
        });
        // The session token travels as the bearer, never as a body field.
        expect(
            (seen[0]?.init?.headers as Record<string, string>)?.Authorization
        ).toBe('Bearer access-1');
    });

    it('backend rejects → status and error envelope passed through', async () => {
        backend.install([
            {
                status: 401,
                body: { success: false, error: { code: 'TOKEN_EXPIRED', message: 'expired' } },
            },
        ]);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/ws-token',
                cookies: { [sessionName]: 'access-1' },
            })
        );

        expect(res.status).toBe(401);
        await expect(res.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'TOKEN_EXPIRED', message: 'expired' },
        });
    });

    it('backend !ok with a body lacking an error envelope → fallback UNAUTHORIZED, status kept', async () => {
        backend.install([
            {
                status: 502,
                body: { success: false }, // no error object — gateway-style body
            },
        ]);

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/ws-token',
                cookies: { [sessionName]: 'access-1' },
            })
        );

        expect(res.status).toBe(502);
        await expect(res.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Could not obtain socket token.' },
        });
    });

    it('backend unreachable → 500 SERVER_ERROR envelope', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('ECONNREFUSED');
            })
        );

        const res = await GET(
            makeRequest({
                method: 'GET',
                url: 'http://localhost/api/auth/ws-token',
                cookies: { [sessionName]: 'access-1' },
            })
        );

        expect(res.status).toBe(500);
        await expect(res.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'SERVER_ERROR' },
        });
    });
});
