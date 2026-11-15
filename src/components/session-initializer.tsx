"use client"

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import { safeCallbackUrl } from '@/features/auth/lib/callback-url';
import { defaultPostAuthTarget, onboardingRedirect } from '@/lib/onboarding-gate';
import { defaultLocale, localeFromPath, stripLocaleFromPath, withLocale } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';

/**
 * Pages a signed-out visitor may view. Reset and verify flows live here so an
 * unauthenticated user opening an email link is never bounced to /login
 * (T12); /register is absent because it 301s server-side before hydration.
 * /onboarding is deliberately absent: an unauthenticated visitor is sent to
 * login with a callback (T13 AC).
 */
const AUTH_FLOW_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

/**
 * Invite links are opened by people who may not have an account yet, and by
 * signed-in users who have not finished onboarding. Neither should be redirected
 * away from the accept page: the first needs to see what they were invited to,
 * the second must be able to accept before doing onboarding.
 */
const isInvitePage = (pathname: string | null): boolean => Boolean(pathname?.startsWith('/invites'));

/** Of those, pages where a signed-in user has no business being. */
const REDIRECT_WHEN_AUTHENTICATED = ['/login', '/signup', '/forgot-password'];

export function SessionInitializer() {
    const { setUser, setLoading } = useAuthStore();
    const router = useRouter();
    // AR-004: the browser path carries the locale prefix (`/en/login`), while
    // the page classification and the gate rules work on the locale-less route
    // (`/login`). The redirects, on the other hand, must carry the locale the
    // visitor is in — a redirect that drops them into the default language
    // would undo the switch they just made.
    const browserPath = usePathname();
    const locale = localeFromPath(browserPath) ?? defaultLocale;
    const pathname = stripLocaleFromPath(browserPath);

    useEffect(() => {
        let cancelled = false;

        async function initSession() {
            setLoading(true);
            try {
                const session = await authService.getSession();
                if (cancelled) return;

                if (session.authenticated && session.user) {
                    setUser(session.user);

                    // T13 gate: incomplete users are routed to the wizard,
                    // finished users away from it. The helper returns null on
                    // /onboarding itself, which is what prevents a loop.
                    const gate = isInvitePage(pathname) ? null : onboardingRedirect({
                        pathname,
                        search: window.location.search,
                        authenticated: true,
                        onboardingCompleted: session.user.onboardingCompleted,
                    });
                    if (gate) {
                        router.replace(withLocale(gate, locale));
                        return;
                    }

                    // Authenticated users have no business on login/signup/forgot.
                    const isRedirectPage = REDIRECT_WHEN_AUTHENTICATED.some((p) => pathname?.startsWith(p));
                    if (isRedirectPage) {
                        const params = new URLSearchParams(window.location.search);
                        const callbackUrl =
                            safeCallbackUrl(params.get('callbackUrl') || params.get('from'));
                        router.replace(
                            callbackUrl ?? withLocale(defaultPostAuthTarget(session.user.onboardingCompleted), locale)
                        );
                    }
                } else {
                    setUser(null);
                    const isAuthFlowPage =
                        AUTH_FLOW_PAGES.some((p) => pathname?.startsWith(p)) ||
                        isInvitePage(pathname);
                    if (!isAuthFlowPage) {
                        // The callback keeps the locale-prefixed path, so the
                        // visitor returns to the page they were on, in the
                        // language they were reading.
                        const cb = safeCallbackUrl(browserPath);
                        router.replace(
                            `/${locale}/login${cb ? `?callbackUrl=${encodeURIComponent(cb)}` : ''}`
                        );
                    }
                }
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        initSession();
        return () => { cancelled = true; };
    }, [setUser, setLoading, pathname, browserPath, locale, router]);

    return null;
}
