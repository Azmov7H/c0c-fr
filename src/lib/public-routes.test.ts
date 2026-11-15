import { describe, expect, it } from 'vitest';

import {
    PUBLIC_ROUTES,
    SITE_URL,
    absolutePublicUrl,
    alternateLanguages,
    publicUrl,
} from './public-routes';

/**
 * T11 — the public route table is the single source of truth for what the
 * sitemap and robots advertise.
 *
 * AR-007 — the table keeps locale-less paths (a table entry describes a
 * page, not its URLs) and the helpers build the per-locale URLs from the
 * locale list, so a new locale cannot be half-advertised.
 */
describe('public route table', () => {
    it('lists only the four public pages', () => {
        expect(PUBLIC_ROUTES.map((route) => route.path)).toEqual([
            '/',
            '/pricing',
            '/privacy',
            '/terms',
        ]);
    });

    it('builds the per-locale path', () => {
        expect(publicUrl('/', 'en')).toBe('/en');
        expect(publicUrl('/', 'ar')).toBe('/ar');
        expect(publicUrl('/pricing', 'en')).toBe('/en/pricing');
        expect(publicUrl('/pricing', 'ar')).toBe('/ar/pricing');
    });

    it('builds the absolute per-locale URL', () => {
        expect(absolutePublicUrl('/pricing', 'ar')).toBe(`${SITE_URL}/ar/pricing`);
        expect(absolutePublicUrl('/', 'en')).toBe(`${SITE_URL}/en`);
    });

    it('builds the hreflang map of a page', () => {
        expect(alternateLanguages('/pricing')).toEqual({
            en: `${SITE_URL}/en/pricing`,
            ar: `${SITE_URL}/ar/pricing`,
        });
        expect(Object.keys(alternateLanguages('/'))).toEqual(['en', 'ar']);
    });
});
