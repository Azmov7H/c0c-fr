/**
 * T20 — Lighthouse CI: mobile-emulated production build, four routes.
 *
 * The budgets in `tasks/tasks/T20-performance.md` are per-route, so the
 * assertions are an assertMatrix rather than one global set: the landing LCP
 * budget (2.0 s) is stricter than the dashboard's (2.5 s), and applying the
 * stricter number everywhere would fail a dashboard that is within its own
 * budget. CLS and INP are global.
 *
 * Auth: `/dashboard` and `/projects` are gated. The server is started in
 * `AUTH_MIDDLEWARE_MODE=presence` (the documented T09 rollback mode) and the
 * Puppeteer script drops a presence-only cookie for those two URLs, so CI
 * measures the real authenticated shell without a backend or a seeded login.
 * It also clears the cookie for `/` and `/login` so `/login` is not redirected.
 *
 * Lighthouse cannot measure a 15 s AI queue or a Mongo p95 — those budgets are
 * enforced by the backend harness (`c0c-bake`: `npm run perf -- --memory`).
 *
 * Local use:
 *   pnpm build
 *   pnpm lhci                 # requires Chrome/Chromium on PATH
 *   LHCI_RUNS=1 pnpm lhci     # quick single run
 */
module.exports = {
    ci: {
        collect: {
            // PORT via env, not `-- -p 3100`: Next 16's CLI consumes `--` and
            // treats what follows as a project directory ("invalid project
            // directory: ./-p"). AUTH_MIDDLEWARE_MODE=presence (the documented
            // T09 rollback mode) lets the presence-only cookie authenticate.
            startServerCommand: 'PORT=3100 AUTH_MIDDLEWARE_MODE=presence pnpm start',
            startServerReadyPattern: 'Ready in',
            startServerReadyTimeout: 90_000,
            url: [
                'http://localhost:3100/',
                'http://localhost:3100/dashboard',
                'http://localhost:3100/projects',
                'http://localhost:3100/login',
            ],
            // Median of three in CI; one run is enough locally while iterating.
            numberOfRuns: Number(process.env.LHCI_RUNS || 3),
            puppeteerScript: './scripts/lighthouse-auth.cjs',
            // LHCI ignores `settings.chromeFlags` when a puppeteerScript is set —
            // the browser is launched through puppeteer, not chrome-launcher. `--no-sandbox`
            // matters in CI containers and on headless Linux; keep it.
            puppeteerLaunchOptions: {
                args: ['--no-sandbox', '--disable-dev-shm-usage'],
            },
            settings: {
                // Default is mobile emulation (Moto G Power, 4G throttling).
                // Keep it: every budget in the card is a mobile budget.
            },
        },
        assert: {
            assertMatrix: [
                {
                    matchingUrlPattern: '^http://localhost:3100/$',
                    assertions: {
                        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
                    },
                },
                {
                    matchingUrlPattern: '^http://localhost:3100/dashboard$',
                    assertions: {
                        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                    },
                },
                {
                    matchingUrlPattern: '.*',
                    assertions: {
                        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
                        // The card's INP (≤ 200 ms) row, enforced through its lab
                        // proxy: Lighthouse 12.6.1 reports INP as a notApplicable
                        // *insight* (`interaction-to-next-paint-insight`, score
                        // null), so a lab INP audit cannot run at all — asserting
                        // it would create a permanently red gate. TBT (main-thread
                        // work over 50 ms) is the standard lab proxy for the same
                        // cost; the field INP itself is tracked from CrUX in T21.
                        'total-blocking-time': ['error', { maxNumericValue: 200 }],
                    },
                },
            ],
        },
        upload: {
            // Keep the HTML/JSON reports as CI artifacts; no external storage
            // account is needed for a pass/fail gate.
            target: 'filesystem',
            outputDir: '.lighthouseci',
        },
    },
};
