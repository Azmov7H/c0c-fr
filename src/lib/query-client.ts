import { QueryClient } from '@tanstack/react-query';

/**
 * Shared defaults for every QueryClient instance.
 */
export function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

/**
 * One client per browser context; a fresh one per server render (a
 * module-level singleton shared across SSR requests would leak one user's
 * cached data into another's response).
 *
 * Exported so non-React code — the auth store's logout, notably — can clear
 * the cache without a hook. Signing out MUST clear it (T10 AC6): without it
 * the next user on a shared machine briefly sees the previous user's data
 * from cache.
 */
export function getQueryClient(): QueryClient {
    if (typeof window === 'undefined') return makeQueryClient();
    browserQueryClient ??= makeQueryClient();
    return browserQueryClient;
}
