/*
 * AR-031 — the intl half of the workspace test providers.
 *
 * A workspace component reads `workspace` (its own copy) and `projects`
 * (shared stage/role vocabulary); the nested billing prompts read `billing`,
 * and `EmptyState` reads `dataState`. The English catalogs are the regression
 * floor: a test rendered through this helper asserts the same English copy
 * the pre-extraction source produced.
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

import enWorkspace from '../../messages/en/workspace.json';
import arWorkspace from '../../messages/ar/workspace.json';
import enProjects from '../../messages/en/projects.json';
import arProjects from '../../messages/ar/projects.json';
import enBilling from '../../messages/en/billing.json';
import arBilling from '../../messages/ar/billing.json';
import enDataState from '../../messages/en/dataState.json';
import arDataState from '../../messages/ar/dataState.json';
import enMedia from '../../messages/en/media.json';
import arMedia from '../../messages/ar/media.json';

const EN = {
    workspace: enWorkspace,
    projects: enProjects,
    billing: enBilling,
    dataState: enDataState,
    media: enMedia,
};
const AR = {
    workspace: arWorkspace,
    projects: arProjects,
    billing: arBilling,
    dataState: arDataState,
    media: arMedia,
};

export function WorkspaceIntlProvider({
    children,
    locale = 'en',
}: {
    children: ReactNode;
    locale?: 'en' | 'ar';
}) {
    return (
        <NextIntlClientProvider locale={locale} messages={locale === 'en' ? EN : AR}>
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
            <WorkspaceIntlProvider>{children}</WorkspaceIntlProvider>
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
            <WorkspaceIntlProvider locale="ar">{children}</WorkspaceIntlProvider>
        ),
    });
}
