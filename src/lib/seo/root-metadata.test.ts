import { describe, expect, it } from 'vitest';

import { SITE_NAME, SITE_URL } from '@/lib/public-routes';

import { rootMetadata } from './root-metadata';

const copy = {
    defaultTitle: 'Localized default title',
    description: 'Localized root description',
    ogTitle: 'Localized social title',
    ogDescription: 'Localized social description',
};

describe('AR-040 root metadata', () => {
    it('uses the one origin and the one brand', () => {
        const metadata = rootMetadata('en', copy);

        expect(String(metadata.metadataBase)).toBe(`${SITE_URL}/`);
        expect(metadata.title).toMatchObject({
            template: `%s | ${SITE_NAME}`,
            default: copy.defaultTitle,
        });
        expect(metadata.openGraph).toMatchObject({
            siteName: SITE_NAME,
            title: copy.ogTitle,
        });
    });

    it('follows the rendered locale for the social card', () => {
        expect(rootMetadata('en', copy).openGraph).toMatchObject({
            locale: 'en_US',
            url: `${SITE_URL}/en`,
        });
        expect(rootMetadata('ar', copy).openGraph).toMatchObject({
            locale: 'ar_AR',
            url: `${SITE_URL}/ar`,
        });
        expect(rootMetadata('ar', copy).twitter).toMatchObject({
            title: copy.ogTitle,
            description: copy.ogDescription,
        });
    });

    it('falls back to the default locale for an unexpected locale value', () => {
        expect(rootMetadata('zz', copy).openGraph).toMatchObject({
            locale: 'en_US',
            url: `${SITE_URL}/en`,
        });
    });
});
