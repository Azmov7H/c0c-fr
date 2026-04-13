"use client"

import { useEffect } from 'react';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

export function SessionInitializer() {
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        let cancelled = false;

        async function initSession() {
            try {
                const user = await authService.getSession();
                if (!cancelled) {
                    setUser(user);
                }
            } catch {
                if (!cancelled) {
                    setUser(null);
                }
            }
        }

        initSession();
        return () => { cancelled = true; };
    }, [setUser]);

    useEffect(() => {
        return () => {
            setLoading(false);
        };
    }, [setLoading]);

    return null;
}
