// @vitest-environment jsdom
/**
 * AR-026 — the auth surface speaks both languages.
 *
 * Three things are pinned here, and each one is a way the extraction could
 * silently half-work:
 *
 *   1. every error key the map can choose exists in BOTH catalogs — the map
 *      produces a KEY, so a missing key is a runtime crash in the form;
 *   2. the login card renders ARABIC labels when the locale is `ar` (the
 *      form reads the provider, not a hardcoded string);
 *   3. the password checklist's four labels are the catalog's, not the old
 *      hardcoded sentences — and they are actually different in Arabic.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';

import { AUTH_AR, AUTH_EN } from './test-utils';
import { LoginForm } from './components/login-form';
import { PasswordStrengthMeter } from './components/password-strength-meter';
import type { AuthErrorMessageKey } from './lib/auth-error-map';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/**
 * The two catalogs, selected by key.
 *
 * A map, not a ternary on the locale: the lint gate bans comparisons against
 * a locale literal (`i18n/no-locale-equality`), even in a test — the intent
 * is the same and the rule stays honest.
 */
const CATALOGS = { en: AUTH_EN, ar: AUTH_AR } as const;

/** Every key `mapAuthError` can return, plus the one literal the alert adds. */
const ERROR_KEYS: AuthErrorMessageKey[] = [
    'rateLimit',
    'invalidCredentials',
    'server',
    'loginFallback',
    'signupFallback',
    'forgotFallback',
    'resetFallback',
    'changeFallback',
    'verifyFallback',
];

function renderIn(locale: 'en' | 'ar', ui: React.ReactNode) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return (
        <QueryClientProvider client={client}>
            <NextIntlClientProvider
                locale={locale}
                messages={{ auth: CATALOGS[locale] }}
            >
                {ui}
            </NextIntlClientProvider>
        </QueryClientProvider>
    );
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('AR-026 the auth surface in both languages', () => {
    it('every error key the map can return exists in both catalogs', () => {
        for (const key of ERROR_KEYS) {
            expect(AUTH_EN.errors[key], `en errors.${key}`).toBeTruthy();
            expect(AUTH_AR.errors[key], `ar errors.${key}`).toBeTruthy();
        }
        for (const catalog of Object.values(CATALOGS)) {
            expect(catalog.errors.reference).toContain('{reference}');
        }
    });

    it('the login card renders Arabic copy under the Arabic locale', () => {
        render(renderIn('ar', <LoginForm />));

        expect(screen.getByText(AUTH_AR.login.heading)).toBeTruthy();
        expect(screen.getByLabelText(AUTH_AR.login.emailLabel)).toBeTruthy();
        expect(screen.getByLabelText(AUTH_AR.login.passwordLabel)).toBeTruthy();
        expect(screen.getByRole('button', { name: AUTH_AR.login.submit })).toBeTruthy();
        expect(screen.queryByText(AUTH_EN.login.heading)).toBeNull();
    });

    it('the password checklist labels come from the catalog, and differ by language', () => {
        for (const locale of ['en', 'ar'] as const) {
            const catalog = CATALOGS[locale];
            render(renderIn(locale, <PasswordStrengthMeter value="a" />));
            for (const key of ['length', 'uppercase', 'lowercase', 'digit'] as const) {
                const expected = catalog.password.checks[key].replace('{count}', '8');
                expect(screen.getByText(expected), `${locale} password.checks.${key}`).toBeTruthy();
            }
            cleanup();
        }
        expect(AUTH_AR.password.checks.length).not.toBe(AUTH_EN.password.checks.length);
    });

    it('the strength meter still announces the same English sentence (floor)', () => {
        render(renderIn('en', <PasswordStrengthMeter value="Password1" />));
        expect(screen.getByRole('img', { name: /Password strength: 4 of 4/ })).toBeTruthy();
    });

    it('the post-redirect confirmations are catalog keys, in both languages', () => {
        for (const key of ['reset', 'changed', 'signout', 'verified'] as const) {
            expect(AUTH_EN.login.success[key]).toBeTruthy();
            expect(AUTH_AR.login.success[key]).toBeTruthy();
        }
    });

    it('a field error is shown in the Arabic of the catalog', async () => {
        render(renderIn('ar', <LoginForm />));

        fireEvent.change(screen.getByLabelText(AUTH_AR.login.emailLabel), {
            target: { value: 'not-an-email' },
        });
        fireEvent.click(screen.getByRole('button', { name: AUTH_AR.login.submit }));

        expect(await screen.findByText(AUTH_AR.validation.invalidEmail)).toBeTruthy();
    });
});
