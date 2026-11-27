import { afterEach, describe, expect, it, vi } from 'vitest';

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
            // AR-025: `x-default` is where a crawler that sends no
            // `Accept-Language` is sent — the default locale's face.
            'x-default': `${SITE_URL}/en/pricing`,
        });
        expect(Object.keys(alternateLanguages('/'))).toEqual(['en', 'ar', 'x-default']);
    });
});

describe('AR-040 single origin', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('reads SITE_URL from the server environment and normalises it to an origin', async () => {
        vi.stubEnv('SITE_URL', 'https://seo.example.test/');
        vi.resetModules();
        const routes = await import('./public-routes');

        expect(routes.SITE_URL).toBe('https://seo.example.test');
        expect(routes.absolutePublicUrl('/pricing', 'ar')).toBe(
            'https://seo.example.test/ar/pricing'
        );
        expect(routes.alternateLanguages('/pricing')).toEqual({
            en: 'https://seo.example.test/en/pricing',
            ar: 'https://seo.example.test/ar/pricing',
            'x-default': 'https://seo.example.test/en/pricing',
        });
    });

    it('rejects a configured origin that carries a path', async () => {
        vi.stubEnv('SITE_URL', 'https://seo.example.test/base');
        vi.resetModules();
        await expect(import('./public-routes')).rejects.toThrow('SITE_URL must be an origin');
    });
});
