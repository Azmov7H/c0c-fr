import { describe, expect, it } from 'vitest';

import { getQueryClient, makeQueryClient } from './query-client';

/**
 * T18 — the QueryClient boundary rule: the browser keeps ONE client (module
 * singleton), but every server render gets a FRESH one. A shared SSR
 * singleton would cache one user's prefetched data into another request's
 * React-Query dehydrated state — a cross-user leak (getQueryClient docs).
 */
describe('query-client', () => {
    it('makeQueryClient carries the shared defaults', () => {
        const client = makeQueryClient();
        const options = client.getDefaultOptions().queries as Record<string, unknown>;
        expect(options.staleTime).toBe(5 * 60 * 1000);
        expect(options.gcTime).toBe(10 * 60 * 1000);
        expect(options.retry).toBe(1);
        expect(options.refetchOnWindowFocus).toBe(false);
    });

    it('on the server every call returns a FRESH client (no SSR request sharing)', () => {
        expect(typeof window).toBe('undefined'); // node project guard: this IS the SSR branch
        const a = getQueryClient();
        const b = getQueryClient();
        expect(a).not.toBe(b);
    });
});
