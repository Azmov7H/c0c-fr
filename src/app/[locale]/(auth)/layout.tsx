import type { Metadata } from 'next';

import { AppProviders } from '@/components/app-providers';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { getTranslations } from '@/i18n/server';

/**
 * Auth pages are data-shaped: login/register mutations go through react-query
 * and SessionInitializer handles the "already signed in" redirect client-side
 * (the middleware covers document loads). See theme-provider.tsx for the
 * provider split rationale.
 */

/**
 * No auth page belongs in a search index (T12): they are linked from public
 * pages but exist to be used, not found. robots.ts disallows the paths as
 * well; a robots.txt block alone would still allow URL-only indexing, the
 * meta tag is what removes an already-indexed URL.
 */
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // AR-009: the server reads the catalog directly — no provider, no client
    // runtime, and the string is rendered in the server's language.
    const t = await getTranslations('common');

    return (
        <AppProviders>
            {/* FR-1: the language switch is reachable from the auth pages too.
                The auth layout has no header bar, so it sits in the corner. */}
            <div className="fixed end-4 top-4 z-10">
                <LocaleSwitcher />
            </div>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
                {t('_a11y.skipToContent')}
            </a>
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        </AppProviders>
    );
}
