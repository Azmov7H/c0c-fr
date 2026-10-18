/**
 * Empty stand-in for the `server-only` package under vitest.
 *
 * `server-only` throws on import unless the bundler resolves the
 * `react-server` export condition (which Next applies to server bundles).
 * Vitest serves it with default conditions, so the real package would break
 * every BFF test that transitively imports it.
 *
 * The enforcement this shim skips is real — `next build` fails on a client
 * import of a server-only module, which is demonstrated in the T09 evidence.
 * Tests are not the enforcement point; the build is.
 */
export {};
