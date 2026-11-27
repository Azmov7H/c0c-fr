/**
 * AR-040 — the SEO finalization proof against the real stack.
 *
 * The unit suites prove the helpers and the proxy in isolation. This suite
 * proves what a crawler actually receives after routing, prerendering and the
 * locale middleware have all run:
 *
 *  - every public page in both locales self-canonicalises and publishes the
 *    same en/ar/x-default alternate map the sitemap publishes;
 *  - the head copy follows the rendered locale (not an English head with an
 *    Arabic URL) and the brand is the one canonical SITE_NAME;
 *  - the bare public paths 301 at the default locale, preserve the query and
 *    land on a page whose canonical is the permanent destination;
 *  - robots.txt / noindex still keep the auth surface out of the index.
 *
 * The E2E stack does not set SITE_URL, so the served origin is the documented
 * fallback. The unit suite covers the env-driven override.
 */

import { expect, test } from '@playwright/test';

import { FE_URL } from '../harness';

const SITE_URL = 'https://avyra-an.vercel.app';
const SITE_NAME = 'Avyra || AI Content Engine';
const PUBLIC_PATHS = ['/', '/pricing', '/privacy', '/terms'];
const LOCALES = ['en', 'ar'] as const;
const OG_LOCALE: Record<string, string> = { en: 'en_US', ar: 'ar_AR' };

function attr(tag: string, name: string): string | null {
    // React's SSR output keeps the JSX spelling (`hrefLang`), while the
    // sitemap serializer emits lowercase `hreflang`. Both are the same
    // attribute in HTML — read either form.
    return tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] ?? null;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tags(html: string, element: string): string[] {
    return Array.from(html.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'g')), (match) => match[0]);
}

function canonicalOf(html: string): string | null {
    const canonical = tags(html, 'link').find((tag) => attr(tag, 'rel') === 'canonical');
    return canonical ? attr(canonical, 'href') : null;
}

function alternatesOf(html: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const tag of tags(html, 'link')) {
        if (attr(tag, 'rel') !== 'alternate') continue;
        const lang = attr(tag, 'hreflang');
        const href = attr(tag, 'href');
        if (lang && href) result[lang] = href;
    }
    return result;
}

function metaOf(html: string, key: 'property' | 'name', value: string): string | null {
    const re = new RegExp(`<meta\\b[^>]*${key}="${escapeRegex(value)}"[^>]*>`);
    const tag = html.match(re)?.[0];
    return tag ? attr(tag, 'content') : null;
}

function titleOf(html: string): string | null {
    return html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;
}

function pathFor(locale: string, path: string): string {
    return `/${locale}${path === '/' ? '' : path}`;
}

function expectedAlternates(path: string): Record<string, string> {
    const suffix = path === '/' ? '' : path;
    return {
        en: `${SITE_URL}/en${suffix}`,
        ar: `${SITE_URL}/ar${suffix}`,
        'x-default': `${SITE_URL}/en${suffix}`,
    };
}

test.describe('AR-040 rendered SEO surface', () => {
    for (const locale of LOCALES) {
        for (const path of PUBLIC_PATHS) {
            test(`${pathFor(locale, path)} self-canonicalises with the complete alternate map`, async ({
                request,
            }) => {
                const response = await request.get(pathFor(locale, path));
                expect(response.ok()).toBe(true);
                const html = await response.text();

                expect(canonicalOf(html)).toBe(`${SITE_URL}${pathFor(locale, path)}`);
                expect(alternatesOf(html)).toMatchObject(expectedAlternates(path));
                expect(metaOf(html, 'property', 'og:locale')).toBe(OG_LOCALE[locale]);
                expect(metaOf(html, 'property', 'og:url')).toBe(`${SITE_URL}${pathFor(locale, path)}`);
                expect(metaOf(html, 'property', 'og:site_name')).toBe(SITE_NAME);
                expect(metaOf(html, 'name', 'description')).not.toBeNull();
            });
        }
    }

    test('the Arabic head is localized, not the English head with an Arabic URL', async ({
        request,
    }) => {
        const english = await (await request.get('/en')).text();
        const arabic = await (await request.get('/ar')).text();

        expect(titleOf(english)).toMatch(/thumbnails/i);
        expect(titleOf(arabic)).toMatch(/[؀-ۿ]/);
        expect(metaOf(arabic, 'name', 'description')).toMatch(/[؀-ۿ]/);
        expect(metaOf(arabic, 'property', 'og:title')).toMatch(/[؀-ۿ]/);
    });

    test('the sitemap publishes both locales and the same alternates, with no lastmod', async ({
        request,
    }) => {
        const response = await request.get('/sitemap.xml');
        expect(response.ok()).toBe(true);
        const xml = await response.text();
        expect(xml).not.toContain('<lastmod');

        const alternates = Array.from(
            xml.matchAll(/<xhtml:link\b[^>]*>/g),
            (match) => match[0]
        );

        for (const path of PUBLIC_PATHS) {
            for (const locale of LOCALES) {
                expect(xml).toContain(`<loc>${SITE_URL}${pathFor(locale, path)}</loc>`);
            }
            for (const [lang, href] of Object.entries(expectedAlternates(path))) {
                expect(
                    alternates.some(
                        (tag) => attr(tag, 'hreflang') === lang && attr(tag, 'href') === href
                    )
                ).toBe(true);
            }
        }
    });

    test('robots.txt and the auth pages keep the private surface out of the index', async ({
        request,
    }) => {
        const robots = await (await request.get('/robots.txt')).text();
        expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
        for (const path of ['/login', '/signup', '/register']) {
            expect(robots).toContain(`Disallow: ${path}`);
            expect(robots).toContain(`Disallow: /en${path}`);
            expect(robots).toContain(`Disallow: /ar${path}`);
        }

        const login = await (await request.get('/en/login')).text();
        expect(login).toMatch(/<meta name="robots" content="[^"]*noindex[^"]*"/);
    });

    test('a public bare path 301s at the default locale and lands on its canonical', async ({
        request,
    }) => {
        const response = await request.get('/pricing?utm_source=seo', { maxRedirects: 0 });
        expect(response.status()).toBe(301);
        // Next's redirect header is relative; resolve it against the stack's
        // own origin before inspecting path/query.
        const destination = new URL(response.headers().location, FE_URL);
        expect(destination.pathname).toBe('/en/pricing');
        expect(destination.searchParams.get('utm_source')).toBe('seo');

        const html = await (await request.get(`${destination.pathname}${destination.search}`)).text();
        expect(canonicalOf(html)).toBe(`${SITE_URL}/en/pricing`);
    });
});
