import { describe, expect, it } from 'vitest';

import { mapAuthError, type AuthRequestErrorShape } from './auth-error-map';

/**
 * AR-026: the map produces the KEY of the form's message, not a sentence —
 * the sentence is the catalog's. Upstream text is passed through as DATA.
 */
describe('mapAuthError', () => {
    it('always maps 429 to the rate-limit key, by status or by code', () => {
        expect(mapAuthError({ status: 429, message: 'x' }, 'loginFallback').messageKey).toBe(
            'rateLimit'
        );
        expect(mapAuthError({ code: 'TOO_MANY_REQUESTS' }, 'loginFallback').messageKey).toBe(
            'rateLimit'
        );
    });

    it('uses the provided unauthorized key for 401 (login non-enumeration)', () => {
        const mapped = mapAuthError(
            { status: 401, message: 'Invalid email or password' },
            'loginFallback',
            { unauthorizedKey: 'invalidCredentials' }
        );
        expect(mapped.messageKey).toBe('invalidCredentials');
        // AUTH-05: an unauthorized login never carries the upstream text.
        expect(mapped.excerpt).toBeUndefined();
    });

    it('falls back to the backend excerpt for 401 when no override is given', () => {
        const mapped = mapAuthError(
            { status: 401, response: { data: { error: { message: 'Current password is incorrect' } } } },
            'changeFallback'
        );
        expect(mapped.messageKey).toBe('changeFallback');
        expect(mapped.excerpt).toBe('Current password is incorrect');
    });

    it('5xx: the server key plus the BFF support reference', () => {
        const mapped = mapAuthError({ status: 502, reference: 'AUTH-deadbeef' }, 'loginFallback');
        expect(mapped.messageKey).toBe('server');
        expect(mapped.reference).toBe('AUTH-deadbeef');
    });

    it('4xx: the backend message passes through and carries no reference', () => {
        const mapped = mapAuthError(
            {
                status: 400,
                response: { data: { error: { message: 'This reset link is invalid or has expired' } } },
            },
            'resetFallback'
        );
        expect(mapped.messageKey).toBe('resetFallback');
        expect(mapped.excerpt).toBe('This reset link is invalid or has expired');
        expect(mapped.reference).toBeUndefined();
    });

    it('missing error yields the caller fallback key alone', () => {
        for (const error of [null, undefined, {} as AuthRequestErrorShape]) {
            expect(mapAuthError(error, 'loginFallback')).toEqual({ messageKey: 'loginFallback' });
        }
    });
});
