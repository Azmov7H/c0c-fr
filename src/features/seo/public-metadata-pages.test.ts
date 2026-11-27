import { describe, expect, it, vi } from 'vitest';

import arLegal from '../../../messages/ar/legal.json';
import arLanding from '../../../messages/ar/landing.json';
import arPricing from '../../../messages/ar/pricing.json';
import enLegal from '../../../messages/en/legal.json';
import enLanding from '../../../messages/en/landing.json';
import enPricing from '../../../messages/en/pricing.json';
import { SITE_NAME, SITE_URL } from '@/lib/public-routes';

/**
 * AR-025 — the public pages' metadata, per locale.
 *
 * The pages are server components, so the server seam is mocked with a real
 * translator over the real catalogs of the locale under test. What is
 * asserted is what a crawler reads: the canonical, the hreflang pairs, the
 * Open Graph locale and the structured data.
 */
const state = vi.hoisted(() => ({ locale: 'en' as 'en' | 'ar' }));

vi.mock('@/i18n/server', async () => {
    const { createTranslator } = await import('next-intl');
    const catalogs = {
        en: { landing: enLanding, pricing: enPricing, legal: enLegal },
        ar: { landing: arLanding, pricing: arPricing, legal: arLegal },
    };
    return {
        getLocale: async () => state.locale,
        getTranslations: async (namespace: string) => {
            const messages = catalogs[state.locale] as Record<string, unknown>;
            if (!(namespace in messages)) {
                throw new Error(`unexpected namespace: ${namespace}`);
            }
            return createTranslator({
                locale: state.locale,
                messages: { [namespace]: messages[namespace] },
                namespace,
            });
        },
    };
});

import LandingPage, {
    generateMetadata as landingMetadata,
} from '@/app/[locale]/(marketing)/page';
import PricingPage, {
    generateMetadata as pricingMetadata,
} from '@/app/[locale]/(marketing)/pricing/page';
import { generateMetadata as privacyMetadata } from '@/app/[locale]/(marketing)/privacy/page';
import { generateMetadata as termsMetadata } from '@/app/[locale]/(marketing)/terms/page';

/**
 * The JSON-LD block of a rendered page: the script the page embeds.
 *
 * The pages are server components, so the tree is inspected, not rendered —
 * the structured data is a prop of the script element.
 */
function findJsonLd(node: unknown): Record<string, unknown> | null {
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = findJsonLd(child);
            if (found) return found;
        }
        return null;
    }
    if (!node || typeof node !== 'object') return null;

    const props = (node as { props?: Record<string, unknown> }).props;
    if (!props) return null;
    if (props.type === 'application/ld+json') {
        const html = (props.dangerouslySetInnerHTML as { __html: string }).__html;
        return JSON.parse(html) as Record<string, unknown>;
    }
    return findJsonLd(props.children);
}

const PAGES = [
    { name: 'the landing page', metadata: landingMetadata, path: '' },
    { name: 'the pricing page', metadata: pricingMetadata, path: '/pricing' },
    { name: 'the privacy page', metadata: privacyMetadata, path: '/privacy' },
    { name: 'the terms page', metadata: termsMetadata, path: '/terms' },
] as const;

describe('the public pages declare per-locale metadata', () => {
    for (const page of PAGES) {
        it(`${page.name} points its canonical at its own locale`, async () => {
            state.locale = 'en';
            const english = await page.metadata();
            state.locale = 'ar';
            const arabic = await page.metadata();

            expect(english.alternates?.canonical).toBe(`${SITE_URL}/en${page.path}`);
            expect(arabic.alternates?.canonical).toBe(`${SITE_URL}/ar${page.path}`);
        });

        it(`${page.name} names both faces in the hreflang pairs`, async () => {
            state.locale = 'en';
            const metadata = await page.metadata();

            expect(metadata.alternates?.languages).toEqual({
                en: `${SITE_URL}/en${page.path}`,
                ar: `${SITE_URL}/ar${page.path}`,
                'x-default': `${SITE_URL}/en${page.path}`,
            });
        });

        it(`${page.name} follows the visitor with the Open Graph locale`, async () => {
            state.locale = 'en';
            const english = await page.metadata();
            state.locale = 'ar';
            const arabic = await page.metadata();

            expect(english.openGraph?.locale).toBe('en_US');
            expect(arabic.openGraph?.locale).toBe('ar_AR');
            expect(english.openGraph?.url).toBe(`${SITE_URL}/en${page.path}`);
            expect(arabic.openGraph?.url).toBe(`${SITE_URL}/ar${page.path}`);
        });

        it(`${page.name} says the same thing in the visitor's language`, async () => {
            state.locale = 'ar';
            const metadata = await page.metadata();

            // The Arabic title is Arabic — the card and the search result
            // are the page, in the page's language.
            expect(String(metadata.title)).toMatch(/[؀-ۿ]/);
            expect(String(metadata.openGraph?.title)).toMatch(/[؀-ۿ]/);
        });
    }
});

describe('the public pages name the site the layout names', () => {
    it('the Open Graph site name is the layout site name', async () => {
        state.locale = 'en';
        const metadata = await landingMetadata();
        expect(metadata.openGraph?.siteName).toBe(SITE_NAME);
        expect(SITE_NAME).toBe('Avyra || AI Content Engine');
    });
});

describe('the locale under test is the locale the metadata claims', () => {
    it('the Arabic page is not the English page with an Arabic label', async () => {
        state.locale = 'ar';
        const arabic = await pricingMetadata();
        state.locale = 'en';
        const english = await pricingMetadata();

        expect(arabic.title).not.toBe(english.title);
        expect(arabic.openGraph?.title).not.toBe(english.openGraph?.title);
    });
});

describe('the structured data describes the locale it is in', () => {
    it('the landing page points at its own locale', async () => {
        state.locale = 'en';
        const english = findJsonLd(await LandingPage());
        state.locale = 'ar';
        const arabic = findJsonLd(await LandingPage());

        expect(english?.url).toBe(`${SITE_URL}/en`);
        expect(english?.inLanguage).toBe('en');
        expect(arabic?.url).toBe(`${SITE_URL}/ar`);
        expect(arabic?.inLanguage).toBe('ar');
    });

    it('the pricing page points at its own locale', async () => {
        state.locale = 'en';
        const english = findJsonLd(await PricingPage());
        state.locale = 'ar';
        const arabic = findJsonLd(await PricingPage());

        expect(english?.url).toBe(`${SITE_URL}/en/pricing`);
        expect(english?.inLanguage).toBe('en');
        expect(arabic?.url).toBe(`${SITE_URL}/ar/pricing`);
        expect(arabic?.inLanguage).toBe('ar');
    });

    it('the offers point at the pricing page in the same locale', async () => {
        state.locale = 'ar';
        const arabic = findJsonLd(await LandingPage());
        const offers = arabic?.offers as Array<Record<string, unknown>>;

        expect(offers).toHaveLength(3);
        for (const offer of offers) {
            expect(offer.url).toBe(`${SITE_URL}/ar/pricing`);
        }
    });
});
