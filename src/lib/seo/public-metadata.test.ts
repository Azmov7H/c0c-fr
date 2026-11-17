import { describe, expect, it } from 'vitest';

import { SITE_URL } from '@/lib/public-routes';

import { ogLocale, publicPageMetadata } from './public-metadata';

/**
 * AR-025 — the metadata seam.
 *
 * The public pages are the same page in two languages. These assertions are
 * about the URLs and the locales a crawler reads:
 *
 *   - the canonical is THIS locale's URL (one canonical for both locales
 *     tells a crawler that the Arabic page is a duplicate);
 *   - the hreflang pairs name every face of the page, plus `x-default`;
 *   - the Open Graph locale follows the page, and the alternate names the
 *     other face.
 */
const INPUT = {
    path: '/pricing',
    title: 'Pricing — Starter, Pro and Studio',
    description: 'Compare AI generations, storage, members and API access.',
};

describe('the public metadata', () => {
    it('points the canonical at the page in ITS locale', () => {
        expect(
            publicPageMetadata({ ...INPUT, locale: 'en' }).alternates?.canonical
        ).toBe(`${SITE_URL}/en/pricing`);
        expect(
            publicPageMetadata({ ...INPUT, locale: 'ar' }).alternates?.canonical
        ).toBe(`${SITE_URL}/ar/pricing`);
    });

    it('names every face of the page in the hreflang pairs', () => {
        expect(publicPageMetadata({ ...INPUT, locale: 'en' }).alternates?.languages).toEqual({
            en: `${SITE_URL}/en/pricing`,
            ar: `${SITE_URL}/ar/pricing`,
            'x-default': `${SITE_URL}/en/pricing`,
        });
    });

    it('gives the landing page its own URL', () => {
        const metadata = publicPageMetadata({
            ...INPUT,
            path: '/',
            locale: 'ar',
        });
        expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/ar`);
        expect(metadata.openGraph?.url).toBe(`${SITE_URL}/ar`);
    });

    it('follows the page with the Open Graph locale', () => {
        const english = publicPageMetadata({ ...INPUT, locale: 'en' });
        const arabic = publicPageMetadata({ ...INPUT, locale: 'ar' });

        expect(english.openGraph?.locale).toBe('en_US');
        expect(arabic.openGraph?.locale).toBe('ar_AR');
        // The other face of the same page.
        expect(english.openGraph?.alternateLocale).toEqual(['ar_AR']);
        expect(arabic.openGraph?.alternateLocale).toEqual(['en_US']);
    });

    it('points the Open Graph URL at the locale', () => {
        expect(
            publicPageMetadata({ ...INPUT, locale: 'ar' }).openGraph?.url
        ).toBe(`${SITE_URL}/ar/pricing`);
    });

    it('falls back to the page copy for the social card', () => {
        const metadata = publicPageMetadata({ ...INPUT, locale: 'en' });
        expect(metadata.openGraph?.title).toBe(INPUT.title);
        expect(metadata.openGraph?.description).toBe(INPUT.description);
        expect(metadata.twitter).toMatchObject({
            card: 'summary_large_image',
            title: INPUT.title,
            description: INPUT.description,
        });
    });

    it('prefers the social copy when there is one', () => {
        const metadata = publicPageMetadata({
            ...INPUT,
            locale: 'en',
            ogTitle: 'Everything a video needs, in one place',
            ogDescription: 'Thumbnails, scripts, sound effects and images.',
        });
        expect(metadata.openGraph?.title).toBe('Everything a video needs, in one place');
        expect(metadata.twitter).toMatchObject({
            title: 'Everything a video needs, in one place',
        });
    });

    it('knows the Open Graph locale of every app locale', () => {
        expect(ogLocale('en')).toBe('en_US');
        expect(ogLocale('ar')).toBe('ar_AR');
    });
});
