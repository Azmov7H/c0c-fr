import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import {
    defaultLocale,
    directionFor,
    isAppLocale,
    locales,
    routing,
} from '../../src/i18n/routing';

/**
 * AR-002 — the compatibility gate (I18N-ARCHITECTURE §2.1).
 *
 * The open question at AR00 was: does a next-intl release compose with
 * Next 16's single `src/proxy.ts` (the file Next 16 renamed from
 * `middleware.ts`)? These assertions are the proof:
 *
 *   1. the pinned release loads under this Node/Next toolchain;
 *   2. `createMiddleware` returns a `(request) => NextResponse` handler —
 *      the exact shape src/proxy.ts needs to compose with the auth gate;
 *   3. the handler behaves as AR-D-01 requires: a locale-less path is
 *      redirected to the default locale, a prefixed path is served, and an
 *      unsupported locale prefix falls back to the default locale with the
 *      deep path preserved (FR-11).
 *
 * If a future upgrade breaks any of these, the suite fails at the gate
 * instead of in production.
 */

const handle = createMiddleware(routing);

function request(path: string): NextRequest {
    return new NextRequest(`http://localhost${path}`);
}

describe('AR-002 next-intl compatibility gate', () => {
    it('the pinned release loads and exposes the middleware factory', () => {
        expect(typeof createMiddleware).toBe('function');
        expect(typeof handle).toBe('function');
    });

    it('the locale model is exactly {en, ar} with en as the default', () => {
        expect(locales).toEqual(['en', 'ar']);
        expect(defaultLocale).toBe('en');
        expect(routing.localePrefix).toBe('always');
    });

    it('the locale helper accepts only known locales', () => {
        expect(isAppLocale('en')).toBe(true);
        expect(isAppLocale('ar')).toBe(true);
        expect(isAppLocale('fr')).toBe(false);
        expect(isAppLocale(undefined)).toBe(false);
    });

    it('Arabic is RTL, English is LTR', () => {
        expect(directionFor('ar')).toBe('rtl');
        expect(directionFor('en')).toBe('ltr');
    });

    it('a locale-less path is redirected to the default locale (AR-D-12)', async () => {
        const response = await handle(request('/pricing'));
        expect(response.status).toBe(307);
        expect(new URL(response.headers.get('location')!).pathname).toBe('/en/pricing');
    });

    it('the deep path survives the default-locale redirect', async () => {
        const response = await handle(request('/projects/42?tab=audio'));
        expect(response.status).toBe(307);
        const location = new URL(response.headers.get('location')!);
        expect(location.pathname).toBe('/en/projects/42');
        expect(location.search).toBe('?tab=audio');
    });

    it('a prefixed path is served, not redirected', async () => {
        const response = await handle(request('/ar/pricing'));
        expect(response.status).toBe(200);
    });

    it('an unsupported locale prefix falls back to the default locale, deep path kept (FR-11)', async () => {
        const response = await handle(request('/fr/pricing'));
        expect(response.status).toBe(307);
        expect(new URL(response.headers.get('location')!).pathname).toBe('/en/fr/pricing');
    });

    it('the middleware remembers the locale in the cookie (FR-3 persistence seam)', async () => {
        const response = await handle(request('/ar/pricing'));
        const setCookie = response.headers.get('set-cookie') ?? '';
        expect(setCookie).toContain('NEXT_LOCALE=ar');
    });
});
