'use client';

import { usePathname } from 'next/navigation';

import { defaultLocale, localeFromPath } from './routing';
import type { AppLocale } from './routing';

/**
 * AR-014 — the locale of the current URL.
 *
 * The locale is visible in the URL (AR-D-01), and the URL is the source of
 * truth for it — the cookie is only the persistence. A component that needs
 * the locale therefore reads it from the path it is rendered under, which
 * has two properties the app needs:
 *
 *   - it works in a component that has no message provider (the marketing
 *     chrome deliberately has none — the link runtime does not fit in the
 *     landing page's budget), and
 *   - it is the SAME locale the server rendered the page with, because both
 *     read the same segment.
 */
export function useUrlLocale(): AppLocale {
    const pathname = usePathname();
    return localeFromPath(pathname) ?? defaultLocale;
}
