// @vitest-environment jsdom
/**
 * AR-027 — the dashboard tests render in ENGLISH.
 *
 * The view and the widgets read their copy from the `dashboard` catalog now,
 * the shared four-state wrapper reads `dataState`, and the locked-analytics
 * card carries the billing upsell. A test that mounts any of them needs an
 * intl provider, so this module is a drop-in `render` that mounts the REAL
 * English catalogs. Every existing English assertion becomes a floor: if a key
 * went missing or a sentence changed, the test fails.
 *
 * The caller keeps its own providers (react-query, mocked router) — this
 * wrapper only adds the language.
 */
import type { ReactElement } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import {
    render as rtlRender,
    type RenderOptions,
    type RenderResult,
} from '@testing-library/react';

import enDashboard from '../../../messages/en/dashboard.json';
import arDashboard from '../../../messages/ar/dashboard.json';
import enDataState from '../../../messages/en/dataState.json';
import arDataState from '../../../messages/ar/dataState.json';
import enBilling from '../../../messages/en/billing.json';
import arBilling from '../../../messages/ar/billing.json';

export const DASHBOARD_EN = enDashboard;
export const DASHBOARD_AR = arDashboard;
export const DATA_STATE_EN = enDataState;
export const DATA_STATE_AR = arDataState;
export const BILLING_EN = enBilling;
export const BILLING_AR = arBilling;

const EN = { dashboard: enDashboard, dataState: enDataState, billing: enBilling };
const AR = { dashboard: arDashboard, dataState: arDataState, billing: arBilling };

/** The English catalogs the dashboard tests render in. */
export function DashboardIntlProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextIntlClientProvider locale="en" messages={EN}>
            {children}
        </NextIntlClientProvider>
    );
}

/** `render`, plus the English catalogs around whatever the caller mounts. */
export function render(
    ui: ReactElement,
    options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
    return rtlRender(ui, {
        ...options,
        wrapper: ({ children }: { children?: React.ReactNode }) => (
            <DashboardIntlProvider>{children}</DashboardIntlProvider>
        ),
    });
}

/** Mounts in ARABIC — used by the tests that assert the Arabic copy renders. */
export function renderArabic(ui: ReactElement): RenderResult {
    return rtlRender(ui, {
        wrapper: ({ children }: { children?: React.ReactNode }) => (
            <NextIntlClientProvider locale="ar" messages={AR}>
                {children}
            </NextIntlClientProvider>
        ),
    });
}
