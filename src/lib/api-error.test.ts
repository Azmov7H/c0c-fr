import { describe, expect, it } from 'vitest';

import { ApiError, toApiError } from './api-error';

/**
 * T18 — the one place every caller's `unknown` narrows. The priority chain is
 * the contract: a real ApiError passes through untouched; an Error's own
 * message wins; the backend's {error:{code,message}} envelope wins over the
 * axios boilerplate; the caller's fallbackMessage is last.
 */
describe('toApiError', () => {
    it('passes an existing ApiError through unchanged (no re-wrapping)', () => {
        const original = new ApiError({ code: 'FORBIDDEN', message: 'Nope.', status: 403 });
        expect(toApiError(original, 'fallback')).toBe(original);
    });

    it('wraps a plain Error with UNEXPECTED_ERROR and its message', () => {
        const err = toApiError(new Error('socket blew up'), 'fallback');
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('UNEXPECTED_ERROR');
        expect(err.message).toBe('socket blew up');
        expect(err.status).toBe(0);
    });

    it('falls back to the caller message when the Error carries no message', () => {
        expect(toApiError(new Error(''), 'fallback wins').message).toBe('fallback wins');
    });

    it('reads code and message from the axios error envelope', () => {
        const err = toApiError(
            { response: { data: { error: { code: 'QUOTA_EXCEEDED', message: 'Slow down.' } } } },
            'fallback'
        );
        expect(err.code).toBe('QUOTA_EXCEEDED');
        expect(err.message).toBe('Slow down.');
    });

    it('envelope with a code but no message surfaces the code as the message, not the fallback', () => {
        const err = toApiError(
            { response: { data: { error: { code: 'QUOTA_EXCEEDED' } } } },
            'fallback'
        );
        expect(err.code).toBe('QUOTA_EXCEEDED');
        expect(err.message).toBe('QUOTA_EXCEEDED');
    });

    it('falls back for a response without an error envelope', () => {
        const err = toApiError({ response: { data: {} } }, 'fallback wins');
        expect(err.code).toBe('UNEXPECTED_ERROR');
        expect(err.message).toBe('fallback wins');
    });

    it('falls back for arbitrary throwables (strings, objects without response)', () => {
        const a = toApiError('boom', 'fallback wins');
        const b = toApiError({ something: 1 }, 'fallback wins');
        for (const err of [a, b]) {
            expect(err.code).toBe('UNEXPECTED_ERROR');
            expect(err.message).toBe('fallback wins');
        }
    });
});
