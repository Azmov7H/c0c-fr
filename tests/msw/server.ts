/*
 * MSW server shared by tests that cross the network layer.
 *
 * The per-test contract (T18):
 *   - tests import { msw } and call msw.start(handlers); the lifecycle is the
 *     handler's default state and `afterEach` restores it, so overrides and
 *     state never leak between tests;
 *   - `http` / `HttpResponse` are re-exported so a test file only ever imports
 *     from 'tests/msw/server'.
 */
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export { http, HttpResponse };

/**
 * msw v3 renamed/moved its handler type; deriving it from the server's own
 * `use()` keeps this compile-safe across msw versions instead of coupling to
 * one export name.
 */
export type HttpHandler = Parameters<ReturnType<typeof setupServer>['use']>[number];

export const server = setupServer();

/**
 * Starts MSW and installs cleanup that runs between tests:
 * unhandled requests pass through (component tests may still stub fetch),
 * and handler overrides from a previous test are always dropped.
 */
export function startMsw(defaultHandlers: HttpHandler[] = []) {
    beforeAll(() =>
        // msw v3's option typings drifted from v2 while runtime still accepts
        // v2's shape; cast keeps the documented bypass behaviour without a
        // version-specific import.
        server.listen({ onUnhandledRequest: 'bypass' } as never)
    );
    afterEach(() => server.resetHandlers(...defaultHandlers));
    afterAll(() => server.close());
    return server;
}
