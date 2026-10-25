import { defineConfig, devices } from '@playwright/test';

/**
 * T18 — E2E configuration.
 *
 * The five journeys run against the REAL stack that `tests/e2e/global-setup`
 * boots (throwaway mongod + the compiled backend + `next start` on the built
 * frontend), so there is no `webServer` here: the global setup owns the port
 * lifecycle and tears everything down in the same runner process.
 *
 * No sharding: each journey is its own independent database session against a
 * throwaway backend, and the whole layer is expected to complete well inside
 * the 5-minute budget from the card (`npm test` reports the wall clock).
 */

const harnessBase = 'tests/e2e';

export default defineConfig({
    testDir: `${harnessBase}/specs`,
    fullyParallel: true,
    // Keep the throwaway backend from being pummelled by accidental retry
    // loops: a failing journey reruns under human control, not automatically.
    retries: 0,
    timeout: 120_000,
    expect: { timeout: 20_000 },
    reporter: [['list']],
    globalSetup: `${harnessBase}/global-setup.ts`,
    use: {
        baseURL: 'http://localhost:19321', // FE_PORT from tests/e2e/harness.ts
        // Authenticated journeys start from a REAL BFF-issued session cookie
        // (tests/e2e/.auth/*.json, minted by the register route during global
        // setup); unauthenticated journeys (signup) explicitly start from
        // `{ storageState: undefined }` so no cookie smugly pre-exists.
        locale: 'en-GB',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
