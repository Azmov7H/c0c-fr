import type { Metadata } from 'next';

import { AppProviders } from '@/components/app-providers';

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

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppProviders>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
                Skip to content
            </a>
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        </AppProviders>
    );
}
