import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    extractRefreshToken,
    getSetCookieHeaders,
    relayAuthRequest,
    relayFailure,
} from './auth-relay';

/**
 * T12: T02 moved the refresh token from the auth JSON bodies into a
 * backend-scoped httpOnly cookie. The BFF must promote that cookie or session
 * renewal dies when the access token expires — these pin both the body
 * (legacy) and Set-Cookie paths.
 */
describe('extractRefreshToken', () => {
    it('prefers the JSON body when present (legacy contract)', () => {
        expect(
            extractRefreshToken({ data: { refreshToken: 'from-body' } }, ['refreshToken=from-cookie; Path=/api/v1/auth'])
        ).toBe('from-body');
    });

    it('falls back to the backend Set-Cookie header (T02 contract)', () => {
        expect(
            extractRefreshToken({ data: { user: {}, accessToken: 'a' } }, [
                'refreshToken=cookie-value-1; Max-Age=604800; Path=/api/v1/auth; HttpOnly; SameSite=Strict',
            ])
        ).toBe('cookie-value-1');
    });

    it('decodes URL-encoded cookie values', () => {
        expect(
            extractRefreshToken(null, ['refreshToken=abc%2Fdef; Path=/api/v1/auth'])
        ).toBe('abc/def');
    });

    it('ignores unrelated cookies and returns undefined when absent', () => {
        expect(extractRefreshToken(null, ['theme=dark; Path=/', 'auth_session=xyz; Path=/'])).toBeUndefined();
        expect(extractRefreshToken(null, [])).toBeUndefined();
        expect(extractRefreshToken({ data: {} }, [])).toBeUndefined();
        expect(extractRefreshToken({ data: { refreshToken: '' } }, [])).toBeUndefined();
    });
});

describe('getSetCookieHeaders', () => {
    it('reads multiple Set-Cookie headers via getSetCookie()', () => {
        const response = new Response('{}', {
            headers: [['Set-Cookie', 'a=1; Path=/'], ['Set-Cookie', 'b=2; Path=/']],
        });
        expect(getSetCookieHeaders(response)).toEqual(['a=1; Path=/', 'b=2; Path=/']);
    });

    it('returns an empty array when the response sets no cookies', () => {
        expect(getSetCookieHeaders(new Response('{}'))).toEqual([]);
    });

    it('falls back to the folded Set-Cookie header on runtimes without getSetCookie()', () => {
        const response = {
            headers: { get: () => 'a=1; Path=/' },
        } as unknown as Response;
        expect(getSetCookieHeaders(response)).toEqual(['a=1; Path=/']);
    });

    it('and to [] when even the folded header is absent on such runtimes', () => {
        const response = {
            headers: { get: () => null },
        } as unknown as Response;
        expect(getSetCookieHeaders(response)).toEqual([]);
    });
});

describe('relayAuthRequest', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('POSTs to the backend with a bearer header and no body when called WITHOUT options', async () => {
        const fetchMock = vi.fn(async () =>
            Response.json({ success: true }, { status: 200 })
        );
        vi.stubGlobal('fetch', fetchMock);

        const { status, body } = await relayAuthRequest('/api/v1/auth/resend-verification');

        expect(status).toBe(200);
        expect(body).toEqual({ success: true });
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toContain('/api/v1/auth/resend-verification');
        expect(init.method).toBe('POST');
        expect(init.body).toBeUndefined();
    });
});

describe('relayFailure (error envelope assembly)', () => {
    it('an upstream 5xx envelope without details gets a reference and NO details key', () => {
        const res = relayFailure('t18-route', 502, {
            error: { code: 'UPSTREAM', message: 'boom' },
        });

        expect(res.status).toBe(502);
        void res.json().then((body) => {
            expect(body.error).toMatchObject({ code: 'UPSTREAM', message: 'boom' });
            expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
            expect(body.error).not.toHaveProperty('details'); // user is not to blame here
        });
    });
});
