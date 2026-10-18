import { describe, expect, it } from 'vitest';

import {
    LOGIN_GENERIC_ERROR,
    RATE_LIMIT_ERROR,
    mapAuthError,
    type AuthRequestErrorShape,
} from './auth-error-map';

describe('mapAuthError', () => {
    it('always maps 429 to the rate-limit message, by status or by code', () => {
        expect(mapAuthError({ status: 429, message: 'x' }, 'fallback').message).toBe(RATE_LIMIT_ERROR);
        expect(mapAuthError({ code: 'TOO_MANY_REQUESTS' }, 'fallback').message).toBe(RATE_LIMIT_ERROR);
    });

    it('uses the provided unauthorizedMessage for 401 (login non-enumeration)', () => {
        const mapped = mapAuthError(
            { status: 401, message: 'Invalid email or password' },
            'fallback',
            { unauthorizedMessage: LOGIN_GENERIC_ERROR }
        );
        expect(mapped.message).toBe(LOGIN_GENERIC_ERROR);
    });

    it('falls back to the backend excerpt for 401 when no override is given', () => {
        const mapped = mapAuthError(
            { status: 401, response: { data: { error: { message: 'Current password is incorrect' } } } },
            'fallback'
        );
        expect(mapped.message).toBe('Current password is incorrect');
    });

    it('5xx: generic message plus the BFF support reference', () => {
        const mapped = mapAuthError(
            { status: 502, reference: 'AUTH-deadbeef' },
            'fallback'
        );
        expect(mapped.message).toBe('Something went wrong on our side. Please try again.');
        expect(mapped.reference).toBe('AUTH-deadbeef');
    });

    it('4xx: backend message passes through and carries no reference', () => {
        const mapped = mapAuthError(
            {
                status: 400,
                response: { data: { error: { message: 'This reset link is invalid or has expired' } } },
            },
            'fallback'
        );
        expect(mapped.message).toBe('This reset link is invalid or has expired');
        expect(mapped.reference).toBeUndefined();
    });

    it('missing error yields the caller fallback', () => {
        for (const error of [null, undefined, {} as AuthRequestErrorShape]) {
            expect(mapAuthError(error, 'the fallback').message).toBe('the fallback');
        }
    });
});
