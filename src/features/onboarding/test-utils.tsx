// @vitest-environment jsdom
/**
 * AR-029 — the onboarding components read their copy from the `onboarding`
 * catalog, and the loading/error states through `LocalizedDataState` read
 * `dataState`. A test that mounts any of them therefore needs an intl provider
 * with the REAL catalogs, exactly as the dashboard layout hands them over in
 * production.
 *
 * The English catalog is the regression floor: every existing English
 * assertion becomes a check that the extracted copy is verbatim. `renderArabic`
 * mounts the Arabic catalogs for the tests that prove the translation renders.
 *
 * The caller keeps its own providers (react-query, mocked router) — this module
 * only adds the language.
 */
import type { ReactElement } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import {
    render as rtlRender,
    type RenderOptions,
    type RenderResult,
} from '@testing-library/react';

import enOnboarding from '../../../messages/en/onboarding.json';
import arOnboarding from '../../../messages/ar/onboarding.json';
import enDataState from '../../../messages/en/dataState.json';
import arDataState from '../../../messages/ar/dataState.json';

export const ONBOARDING_EN = enOnboarding;
export const ONBOARDING_AR = arOnboarding;
export const DATA_STATE_EN = enDataState;
export const DATA_STATE_AR = arDataState;

const EN = { onboarding: enOnboarding, dataState: enDataState };
const AR = { onboarding: arOnboarding, dataState: arDataState };

/** `render`, plus the English catalogs around whatever the caller mounts. */
export function render(
    ui: ReactElement,
    options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
    return rtlRender(ui, {
        ...options,
        wrapper: ({ children }: { children?: React.ReactNode }) => (
            <NextIntlClientProvider locale="en" messages={EN}>
                {children}
            </NextIntlClientProvider>
        ),
    });
}

/** Mounts in ARABIC — used by the tests that assert the Arabic copy renders. */
export function renderArabic(
    ui: ReactElement,
    options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
    return rtlRender(ui, {
        ...options,
        wrapper: ({ children }: { children?: React.ReactNode }) => (
            <NextIntlClientProvider locale="ar" messages={AR}>
                {children}
            </NextIntlClientProvider>
        ),
    });
}
