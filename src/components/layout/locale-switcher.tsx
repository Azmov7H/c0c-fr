'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { setLocaleCookie } from '@/i18n/locale-cookie';
import { defaultLocale, localeFromPath, pathInLocale } from '@/i18n/routing';

/**
 * AR-006 — the language switch.
 *
 * One component, three placements (marketing header, auth header, app
 * header), per FR-1.
 *
 * The switch is a navigation, not a state change: the visitor stays on the
 * page they are on and only the language changes. The URL carries the locale
 * (AR-D-01), so the target is the current path with the locale swapped —
 * the deep path AND the query survive (FR-2).
 *
 * Why it does NOT use the next-intl client router: the locale-aware router
 * would pull the i18n runtime into every route's client bundle, and the
 * landing page's first-load budget has no room for it. Next's own router
 * navigates to `/ar/dashboard` just as well — the target is a real route —
 * and the switch is a client-side navigation either way, so the page is not
 * re-downloaded.
 *
 * The persistence is the locale cookie. AR-006 let the proxy write it on the
 * next navigation; AR-039 writes it here too so the cookie agrees with the
 * switch immediately. For a signed-in visitor the DB preference is updated as
 * well — the cookie is only the render-time cache, the account is the source
 * of truth (USER-PREFERENCES §5). The patch is fire-and-forget, through a
 * dependency-free helper loaded on click: a slow or failing preference endpoint
 * must never strand the visitor on the old page or inflate first-load JS.
 *
 * The switch never touches the session: no logout, no re-authentication
 * (FR-6). A preference PATCH is not an auth mutation.
 */

const TARGET_LABEL = {
    en: { text: 'English', lang: 'en' },
    ar: { text: 'العربية', lang: 'ar' },
} as const;

export interface LocaleSwitcherProps {
    /** Extra classes for the placement (the three headers differ). */
    className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();

    const current = localeFromPath(pathname) ?? defaultLocale;
    const target = current === 'en' ? 'ar' : 'en';
    const label = TARGET_LABEL[target];
    const href = pathInLocale(pathname, target);

    const switchLocale = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>) => {
            // The anchor is the fallback (it works without JavaScript); the
            // router keeps the switch a client-side navigation and leaves the
            // history clean — the back button does not walk through the
            // other language.
            event.preventDefault();
            const search = typeof window === 'undefined' ? '' : window.location.search;

            // Cookie first: the next render (and the next visit) must not read
            // a stale locale even if the PATCH or the navigation is slow.
            setLocaleCookie(target);
            void import('@/i18n/locale-preference-sync').then(({ syncLocalePreference }) => {
                syncLocalePreference(target);
            });

            router.replace(`${href}${search}`, { scroll: false });
        },
        [router, href, target]
    );

    return (
        <a
            href={href}
            lang={label.lang}
            onClick={switchLocale}
            aria-label={target === 'ar' ? 'التبديل إلى العربية' : 'Switch to English'}
            data-testid="locale-switcher"
            className={
                className ??
                'inline-flex h-9 items-center rounded-md px-2.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            }
        >
            {label.text}
        </a>
    );
}
