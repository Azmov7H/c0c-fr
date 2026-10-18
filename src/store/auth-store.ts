import { create } from 'zustand';
import type { User } from '@/types';
import { getQueryClient } from '@/lib/query-client';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),

    logout: () => {
        // Drop every cached response before the next user can render it.
        // This is the one choke point every sign-out path goes through
        // (useLogout, a 401 handler, the session initializer) — without it
        // the previous user's projects/data flash for the next one on a
        // shared machine. Cancel first so an in-flight /projects response
        // cannot land in the cache after the clear.
        const queryClient = getQueryClient();
        void queryClient.cancelQueries();
        queryClient.clear();
        set({ user: null, isAuthenticated: false, isLoading: false });
    },
}));
