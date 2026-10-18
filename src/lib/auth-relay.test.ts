import { describe, expect, it } from 'vitest';

import { extractRefreshToken, getSetCookieHeaders } from './auth-relay';

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
});
