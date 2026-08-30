"use client"

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

const AUTH_PAGES = ['/login', '/register'];

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

                if (session.authenticated) {
                    setUser(session.user);
                } else {
                    setUser(null);
                    const isAuthPage = AUTH_PAGES.some((p) => pathname?.startsWith(p));
                    if (!isAuthPage) {
                        const cb = pathname ?? '';
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
