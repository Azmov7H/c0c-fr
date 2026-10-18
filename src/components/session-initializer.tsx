"use client"

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import { safeCallbackUrl } from '@/features/auth/lib/callback-url';
import { useAuthStore } from '@/store/auth-store';

/**
 * Pages a signed-out visitor may view. Reset and verify flows live here so an
 * unauthenticated user opening an email link is never bounced to /login
 * (T12); /register is absent because it 301s server-side before hydration.
 */
const AUTH_FLOW_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

/** Of those, pages where a signed-in user has no business being. */
const REDIRECT_WHEN_AUTHENTICATED = ['/login', '/signup', '/forgot-password'];

/**
 * T13 lands the onboarding flow (route + backend flag). Until then this seam
 * stays inert: redirecting to a route that does not exist would 404 every
 * freshly registered user, which is worse than skipping onboarding.
 */
const ONBOARDING_ROUTE_READY = false;

export function SessionInitializer() {
    const { setUser, setLoading } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let cancelled = false;

        async function initSession() {
            setLoading(true);
            try {
                const session = await authService.getSession();
                if (cancelled) return;

                if (session.authenticated && session.user) {
                    setUser(session.user);

                    // T13 seam: route to /onboarding when the backend says the
                    // flow is incomplete (see ONBOARDING_ROUTE_READY above).
                    if (
                        ONBOARDING_ROUTE_READY &&
                        session.user.onboardingCompleted === false &&
                        pathname !== '/onboarding'
                    ) {
                        router.replace('/onboarding');
                        return;
                    }

                    // Authenticated users have no business on login/signup/forgot.
                    const isRedirectPage = REDIRECT_WHEN_AUTHENTICATED.some((p) => pathname?.startsWith(p));
                    if (isRedirectPage) {
                        const params = new URLSearchParams(window.location.search);
                        const callbackUrl =
                            safeCallbackUrl(params.get('callbackUrl') || params.get('from'));
                        router.replace(callbackUrl || '/dashboard');
                    }
                } else {
                    setUser(null);
                    const isAuthFlowPage = AUTH_FLOW_PAGES.some((p) => pathname?.startsWith(p));
                    if (!isAuthFlowPage) {
                        const cb = safeCallbackUrl(pathname);
                        router.replace(`/login${cb ? `?callbackUrl=${encodeURIComponent(cb)}` : ''}`);
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
    }, [setUser, setLoading, pathname, router]);

    return null;
}
