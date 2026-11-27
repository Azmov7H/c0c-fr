/**
 * AR-039 — switcher persistence and DB-wins reconciliation against the real
 * stack.
 *
 * The unit suites pin the wiring; these journeys pin the contract across the
 * browser, the BFF and the AR-036 backend:
 *
 *   - a guest switch writes only the locale cookie (no DB surface is called);
 *   - an authenticated switch writes the cookie AND PATCHes the preference;
 *   - the DB value survives a reload and wins over the cookie/URL;
 *   - login applies the DB locale to the landing path even when the visitor
 *     asked for the other language.
 *
 * Each authenticated journey registers its OWN persona: the shared fixture
 * jars are used by other journeys, and this suite deliberately mutates the
 * preference. These tests require the backend running at ../c0c-bake with
 * AR-036 present; global-setup boots the throwaway stack.
 */
import { expect, test, type Browser, type Page } from '@playwright/test';

import {
    API_URL,
    completeOnboarding,
    localePath,
    registerPersona,
    storageStateFor,
} from '../harness';

const PREFERENCE_PATH = '/api/v1/users/profile/preferences/locale';

async function localeCookie(page: Page): Promise<string | undefined> {
    const cookies = await page.context().cookies();
    return cookies.find((cookie) => cookie.name.endsWith('NEXT_LOCALE'))?.value;
}

async function signedInPage(browser: Browser, key: string): Promise<Page> {
    const persona = await registerPersona({
        key,
        firstName: 'Layla',
        lastName: 'Preference',
    });
    await completeOnboarding(persona);
    const state = storageStateFor(persona);
    const context = await browser.newContext({
        storageState: {
            cookies: state.cookies.map((cookie) => ({ ...cookie, expires: -1 })),
            origins: [],
        },
    });
    return context.newPage();
}

test.describe('AR-039 authenticated persistence', () => {
    test.use({ storageState: undefined });

    test('the switcher persists, and the DB wins on the next visit', async ({ browser }) => {
        const page = await signedInPage(browser, `ar39-switch-${Date.now()}`);
        await page.goto(localePath('/dashboard'));

        const patch = page.waitForResponse(
            (response) =>
                response.url().includes(PREFERENCE_PATH) &&
                response.request().method() === 'PATCH'
        );
        await page.getByTestId('locale-switcher').click();

        expect((await patch).status()).toBe(200);
        await expect(page).toHaveURL(/\/ar\/dashboard$/);
        expect(await localeCookie(page)).toBe('ar');

        const stored = await page.request.get(PREFERENCE_PATH);
        expect(stored.ok()).toBeTruthy();
        await expect(stored.json()).resolves.toMatchObject({ data: { locale: 'ar' } });

        // A fresh English URL with an Arabic DB value must be reconciled: the
        // session initializer applies the DB locale to the landing path.
        await page.goto(localePath('/dashboard'));
        await expect(page).toHaveURL(/\/ar\/dashboard$/);
        expect(await localeCookie(page)).toBe('ar');
        await page.context().close();
    });
});

test.describe('AR-039 guest persistence', () => {
    test.use({ storageState: undefined });

    test('a guest switch writes the cookie but never calls the preference API', async ({ page }) => {
        const preferenceCalls: string[] = [];
        page.on('request', (request) => {
            if (request.url().includes(PREFERENCE_PATH)) preferenceCalls.push(request.method());
        });

        await page.goto(localePath('/pricing'));
        await page.getByTestId('locale-switcher').click();

        await expect(page).toHaveURL(/\/ar\/pricing$/);
        expect(await localeCookie(page)).toBe('ar');
        expect(preferenceCalls).toEqual([]);
    });
});

test.describe('AR-039 login reconciliation', () => {
    test.use({ storageState: undefined });

    test('a DB Arabic preference overrides an English login callback', async ({ page }) => {
        const persona = await registerPersona({
            key: `ar39-login-${Date.now()}`,
            firstName: 'Layla',
            lastName: 'Preference',
        });
        await completeOnboarding(persona);

        const staged = await fetch(`${API_URL}${PREFERENCE_PATH}`, {
            method: 'PATCH',
            headers: {
                authorization: `Bearer ${persona.accessToken}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({ locale: 'ar' }),
        });
        expect(staged.ok).toBeTruthy();

        await page.goto(`${localePath('/login')}?callbackUrl=%2Fen%2Fdashboard`);
        await page.getByLabel('Email Address').fill(persona.email);
        await page.getByLabel('Password', { exact: true }).fill(persona.password);
        await page.getByRole('button', { name: 'Sign In to Dashboard' }).click();

        await expect(page).toHaveURL(/\/ar\/dashboard$/);
        expect(await localeCookie(page)).toBe('ar');
    });
});
