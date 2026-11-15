import { describe, expect, it } from 'vitest';

import { isQaRouteEnabled, QA_ROUTES_ENABLED_ENV } from './qa-route';

/**
 * AR-021 — the QA route gate.
 *
 * The QA gallery is a review tool. It must open on the developer's machine
 * and in the E2E stack (which runs the production build), and it must be a
 * 404 everywhere else. These assertions are the whole contract; the page
 * itself only reads the answer.
 */

describe('the QA route gate', () => {
    it('opens in development', () => {
        expect(isQaRouteEnabled({ NODE_ENV: 'development' })).toBe(true);
    });

    it('opens in test — the unit suite renders the gallery', () => {
        expect(isQaRouteEnabled({ NODE_ENV: 'test' })).toBe(true);
    });

    it('is closed in production by default', () => {
        expect(isQaRouteEnabled({ NODE_ENV: 'production' })).toBe(false);
    });

    it('opens in production when it is asked for explicitly', () => {
        expect(
            isQaRouteEnabled({ NODE_ENV: 'production', [QA_ROUTES_ENABLED_ENV]: '1' })
        ).toBe(true);
    });

    it('is not opened by a flag that is not exactly "1"', () => {
        // A half-typed flag must not open a route in production.
        expect(
            isQaRouteEnabled({ NODE_ENV: 'production', [QA_ROUTES_ENABLED_ENV]: 'true' })
        ).toBe(false);
        expect(
            isQaRouteEnabled({ NODE_ENV: 'production', [QA_ROUTES_ENABLED_ENV]: '' })
        ).toBe(false);
    });

    it('is closed when the environment says nothing', () => {
        // An unknown environment is treated as production: the safe default
        // for a route that must not be reachable by accident.
        expect(isQaRouteEnabled({})).toBe(false);
    });
});
