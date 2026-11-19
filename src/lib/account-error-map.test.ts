import { describe, expect, it } from 'vitest';

import {
    accountErrorMessage,
    mapAccountError,
    type AccountErrorMessageKey,
} from './account-error-map';

/**
 * AR-028 — the account flows' error-code map.
 *
 * The rules the map encodes, each one a test:
 *   - a transport failure (no response) is "offline", not "server";
 *   - a stable API code wins even when the surface did not attach a status;
 *   - 503 has a different promise in billing ("no payment started");
 *   - an unrecognised failure keeps the upstream detail as an excerpt;
 *   - every mapped key is a catalog key.
 */
describe('account error map', () => {
    it('maps transport failures to offline', () => {
        expect(mapAccountError({ code: 'UNEXPECTED_ERROR', status: 0 })).toMatchObject({
            messageKey: 'offline',
        });
        expect(mapAccountError({ status: 0 })).toMatchObject({ messageKey: 'offline' });
    });

    it('maps rate limits by status and by code', () => {
        expect(mapAccountError({ status: 429 })).toMatchObject({ messageKey: 'rateLimit' });
        expect(mapAccountError({ code: 'TOO_MANY_REQUESTS' })).toMatchObject({
            messageKey: 'rateLimit',
        });
        expect(mapAccountError({ code: 'QUOTA_EXHAUSTED' })).toMatchObject({
            messageKey: 'rateLimit',
        });
    });

    it('gives billing a payment-specific 503 sentence and other flows the server one', () => {
        expect(
            mapAccountError({ status: 503 }, { serviceUnavailableKey: 'notConfigured' })
        ).toMatchObject({ messageKey: 'notConfigured' });
        expect(mapAccountError({ status: 503 })).toMatchObject({ messageKey: 'server' });
        expect(mapAccountError({ code: 'SERVICE_UNAVAILABLE' })).toMatchObject({
            messageKey: 'server',
        });
    });

    it('maps authentication, authorisation, missing and invalid requests', () => {
        expect(mapAccountError({ status: 401 })).toMatchObject({ messageKey: 'sessionExpired' });
        expect(mapAccountError({ code: 'TOKEN_EXPIRED' })).toMatchObject({
            messageKey: 'sessionExpired',
        });
        expect(mapAccountError({ status: 403 })).toMatchObject({ messageKey: 'forbidden' });
        expect(mapAccountError({ status: 404 })).toMatchObject({ messageKey: 'notFound' });
        expect(mapAccountError({ status: 400 })).toMatchObject({ messageKey: 'invalidInput' });
        expect(mapAccountError({ code: 'VALIDATION_ERROR' })).toMatchObject({
            messageKey: 'invalidInput',
        });
    });

    it('maps server failures and keeps a custom fallback', () => {
        expect(mapAccountError({ status: 500 })).toMatchObject({ messageKey: 'server' });
        expect(mapAccountError(null, { fallbackKey: 'server' })).toMatchObject({
            messageKey: 'server',
        });
    });

    it('keeps the upstream detail only when it has no sentence of its own', () => {
        const mapped = mapAccountError({
            status: 418,
            message: 'The upstream said something specific.',
        });
        expect(mapped.messageKey).toBe('generic');
        expect(mapped.excerpt).toBe('The upstream said something specific.');
        expect(
            mapAccountError({ status: 429, message: 'Too many requests' }).excerpt
        ).toBeUndefined();
    });

    it('renders the catalog sentence, or the excerpt for an unknown failure', () => {
        const t = (key: `errors.${AccountErrorMessageKey}`) => `catalog:${key}`;

        expect(accountErrorMessage(t, { messageKey: 'rateLimit' })).toBe(
            'catalog:errors.rateLimit'
        );
        expect(
            accountErrorMessage(t, { messageKey: 'generic', excerpt: 'upstream detail' })
        ).toBe('upstream detail');
        expect(accountErrorMessage(t, { messageKey: 'generic' })).toBe(
            'catalog:errors.generic'
        );
    });
});
