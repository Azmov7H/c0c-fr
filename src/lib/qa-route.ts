/**
 * AR-021 — the QA route gate.
 *
 * The QA route (`src/app/[locale]/(dev)/qa/rtl`) is a REVIEW tool: it renders
 * the primitives in both directions side by side, so a conversion can be
 * checked by eye before it ships. It is not part of the product and must not
 * be reachable from the public internet.
 *
 * There are exactly two ways to open it:
 *
 *   1. DEVELOPMENT — `NODE_ENV` is `development` or `test`. The developer's
 *      own machine, where `next dev` serves the route;
 *   2. `ENABLE_QA_ROUTES=1` — the E2E stack, which runs the PRODUCTION build
 *      (`next start`, `NODE_ENV=production`) and still has to prove that the
 *      page renders, that both directions are laid out, and that the page
 *      passes axe in each of them.
 *
 * Everything else gets a 404 — including an environment that does not say
 * what it is. The route also declares `robots: { index: false }`, so even an
 * accidental open is not indexed.
 *
 * The flag is read at REQUEST time (the route is `force-dynamic`), so the same
 * build artifact serves the QA page in the E2E job and 404s it in production —
 * no rebuild, no second artifact, and no way to enable it by accident.
 */

export const QA_ROUTES_ENABLED_ENV = 'ENABLE_QA_ROUTES';

export type QaRouteEnv = Record<string, string | undefined>;

/**
 * Is the QA route open in this environment?
 *
 * The `ENABLE_QA_ROUTES=1` opt-in wins over the production check on purpose:
 * it is the explicit, deliberate answer to "I want the QA route in a
 * production build" (the E2E job), while the NODE_ENV check is the default.
 */
export function isQaRouteEnabled(env: QaRouteEnv = process.env): boolean {
    if (env[QA_ROUTES_ENABLED_ENV] === '1') return true;
    // The known non-production environments, by name. An environment that
    // does not say what it is does NOT get the QA route: the safe default for
    // a route that must not be reachable by accident.
    return env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
}
