import { expect, test } from '@playwright/test';

import { E2E_ARABIC_LOCALE, localePath } from '../harness';

/**
 * AR-008 — the locale routing, proved against the real stack.
 *
 * The unit suite (src/proxy.test.ts) proves the redirect matrix against the
 * proxy in isolation. This suite proves it against the running app: the
 * proxy, the app router, the prerendered pages and the BFF in one go.
 *
 * These assertions are the contract the rest of the program is built on:
 * the locale is visible in the URL (FR-8), the document direction is decided
 * on the server (FR-12), the auth gate speaks the visitor's language, and
 * the API surface is never locale-processed (FR-9).
 */

test.describe('locale routing', () => {
    test('the bare root redirects to the default locale', async ({ request }) => {
        // maxRedirects: 0 — the assertion is about the REDIRECT, not about
        // where the browser ends up.
        const response = await request.get('/', { maxRedirects: 0 });
        expect(response.status()).toBe(307);
        expect(response.headers().location).toContain('/en');
    });

    test('a locale-less deep path keeps its path', async ({ request }) => {
        const response = await request.get('/pricing', { maxRedirects: 0 });
        expect(response.status()).toBe(307);
        expect(response.headers().location).toContain('/en/pricing');
    });

    test('the browser ends up on the prefixed URL', async ({ page }) => {
        await page.goto('/pricing');
        expect(new URL(page.url()).pathname).toBe('/en/pricing');
    });

    test('the English landing page renders an LTR document', async ({ page }) => {
        await page.goto(localePath('/'));
        const html = await page.content();
        expect(html).toContain('lang="en"');
        expect(html).toContain('dir="ltr"');
    });

    test('the Arabic landing page renders an RTL document', async ({ page }) => {
        await page.goto(localePath('/', E2E_ARABIC_LOCALE));
        const html = await page.content();
        expect(html).toContain('lang="ar"');
        expect(html).toContain('dir="rtl"');
    });

    test('a signed-out visitor is sent to the login page in their own language', async ({ page }) => {
        await page.goto(localePath('/dashboard', E2E_ARABIC_LOCALE));
        const url = new URL(page.url());
        expect(url.pathname).toBe('/ar/login');
        expect(url.searchParams.get('callbackUrl')).toBe('/ar/dashboard');
    });

    test('the API surface is never locale-processed', async ({ request }) => {
        const response = await request.get('/api/auth/session');
        // No redirect, no locale: the BFF answers in place.
        expect(response.status()).toBe(200);
    });

    test('/register still redirects to /signup, outside the locale processing', async ({ request }) => {
        const response = await request.get('/register', { maxRedirects: 0 });
        expect(response.status()).toBe(301);
        expect(response.headers().location).toContain('/signup');
    });
});
