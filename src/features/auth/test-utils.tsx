// @vitest-environment jsdom
/**
 * AR-026 — the auth tests render in ENGLISH.
 *
 * The components read their copy from the `auth` catalog now, so a test that
 * mounts one needs an intl provider. This module is a drop-in `render` that
 * mounts the component inside next-intl with the REAL English catalog — which
 * makes every existing English assertion (the labels, the confirmation, the
 * strength meter's aria-label) a floor assertion: if a key went missing or a
 * sentence changed, the test fails.
 *
 * The caller keeps its own providers (react-query, mocked router) inside; this
 * wrapper only adds the language.
 */
import type { ReactElement } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import {
    render as rtlRender,
    type RenderOptions,
    type RenderResult,
} from '@testing-library/react';

import enAuth from '../../../messages/en/auth.json';
import arAuth from '../../../messages/ar/auth.json';

export const AUTH_EN = enAuth;
export const AUTH_AR = arAuth;

/** The English `auth` catalog, the one the tests render in. */
export function AuthIntlProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider locale="en" messages={{ auth: enAuth }}>
            {children}
        </NextIntlClientProvider>
    );
}

/** `render`, plus the English `auth` catalog around whatever the caller mounts. */
export function render(
    ui: ReactElement,
    options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
    return rtlRender(ui, {
        ...options,
        wrapper: ({ children }: { children?: React.ReactNode }) => (
            <AuthIntlProvider>{children}</AuthIntlProvider>
        ),
    });
}

/** Mounts in ARABIC — used by the tests that assert the Arabic copy renders. */
export function renderArabic(ui: ReactElement): RenderResult {
    return rtlRender(ui, {
        wrapper: ({ children }: { children?: React.ReactNode }) => (
            <NextIntlClientProvider locale="ar" messages={{ auth: arAuth }}>
                {children}
            </NextIntlClientProvider>
        ),
    });
}
