"use client"

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

const AUTH_PAGES = ['/login', '/register', '/signup'];

/**
 * T13 lands the onboarding flow (route + backend flag). Until then this seam
 * stays inert: redirecting to a route that does not exist would 404 every
 * freshly registered user, which is worse than skipping onboarding.
 */
const ONBOARDING_ROUTE_READY = false;

function safeCallbackUrl(pathname: string | null): string | null {
    if (!pathname) return null;
    // Same-origin, single-slash paths only — mirrors the middleware guard.
    if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.startsWith('/\\')) {
        return null;
    }
    return pathname;
}

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

                    // Authenticated users have no business on /login or /register.
                    const isAuthPage = AUTH_PAGES.some((p) => pathname?.startsWith(p));
                    if (isAuthPage) {
                        const params = new URLSearchParams(window.location.search);
                        const callbackUrl =
                            safeCallbackUrl(params.get('callbackUrl') || params.get('from'));
                        router.replace(callbackUrl || '/dashboard');
                    }
                } else {
                    setUser(null);
                    const isAuthPage = AUTH_PAGES.some((p) => pathname?.startsWith(p));
                    if (!isAuthPage) {
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
