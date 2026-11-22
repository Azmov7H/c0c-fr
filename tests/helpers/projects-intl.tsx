/*
 * AR-030 — the intl half of the test providers.
 *
 * A component that reads `useTranslations('projects')` (and `LocalizedDataState`
 * reads `dataState`) needs a `NextIntlClientProvider` in the tree. The English
 * catalogs are the regression floor: a test that renders through this helper
 * asserts the same English copy the pre-extraction source produced.
 *
 * `renderArabic` mounts the Arabic catalogs with the URL locale set to `/ar`,
 * as in production, for the tests that prove the components really read them.
 */
import type { ReactElement, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import {
    render as rtlRender,
    type RenderOptions,
    type RenderResult,
} from '@testing-library/react';

import enProjects from '../../messages/en/projects.json';
import arProjects from '../../messages/ar/projects.json';
import enDataState from '../../messages/en/dataState.json';
import arDataState from '../../messages/ar/dataState.json';

const EN = { projects: enProjects, dataState: enDataState };
const AR = { projects: arProjects, dataState: arDataState };

export function ProjectsIntlProvider({ children }: { children: ReactNode }) {
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
        wrapper: ({ children }: { children?: ReactNode }) => (
            <NextIntlClientProvider locale="en" messages={EN}>
                {children}
            </NextIntlClientProvider>
        ),
    });
}

/** The same component, but in Arabic with `/ar` as the reported URL locale. */
export function renderArabic(
    ui: ReactElement,
    options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
    return rtlRender(ui, {
        ...options,
        wrapper: ({ children }: { children?: ReactNode }) => (
            <NextIntlClientProvider locale="ar" messages={AR}>
                {children}
            </NextIntlClientProvider>
        ),
    });
}
