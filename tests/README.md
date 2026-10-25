# Frontend test program (T18)

Three layers, one rule: **put a test where the failure lives, not where the code is**.
`npm test` runs all three and reports the wall clock; the card's budget is < 5 minutes.

| Layer | Runner | Where it lives | Runs against |
|---|---|---|---|
| Unit (pure logic) | `vitest run` — **node** project | `*.test.ts` next to the source | nothing — pure functions/modules |
| Component / hook / BFF | `vitest run` — **node or jsdom** project | `*.test.tsx` (+ a few `*.test.ts`) next to the source | jsdom + React Testing Library + **MSW** at the network edge |
| End-to-end journeys | `playwright test` | [`e2e/`](e2e/) | the **real stack** (throwaway `mongod`, compiled `c0c-bake`, `next start`) |

```
npm test                  # unit + e2e, wall clock reported
npm run test:unit         # vitest only (fast inner loop)
npm run test:e2e          # next build && playwright test
npx vitest run --coverage # coverage with the package gates below
```

## Placement rules

1. **Pure function/module** → unit `.test.ts`, node environment.
   Anything with no React and no network: formatting, date maths, policy checks
   (`password-policy`), permission tables (`permissions.ts`), BFF cookie contracts.
   The node project also owns BFF route handlers (`src/app/api/**/*.test.ts`) — they
   are plain request→response functions; Node's `fetch` + MSW-in-node covers them.

2. **Hook or component** → `*.test.tsx`, jsdom environment (the vitest projects config
   maps by extension: `.test.tsx` ⇒ jsdom; a `.test.ts` that needs the DOM opts in with
   a `// @vitest-environment jsdom` pragma). Render through the shared
   [`tests/helpers/render.tsx`](helpers/render.tsx) (wraps QueryClient + route mocks);
   intercept network with **MSW** via [`tests/msw/server.ts`](msw/server.ts) — never
   stub `fetch` ad hoc next to a component that uses axios.

3. **BFF route handler** (`src/app/api/auth/**`, session, ws-token) → node project:
   exact `NextRequest` construction in, `NextResponse` shape + cookie contract out.

4. **`middleware.ts` and cross-cutting security primitives** → node project with
   `vi.mock('next/server')` where the runtime is unavailable in tests.

5. **A boundary flow** — anything that involves a real redirect, a real cookie set by
   a real server, two browser contexts, or a webhook verification over raw bytes →
   **E2E**, [`e2e/specs/`](e2e/specs/). If you are about to mock the auth service or
   fake `window.location` to test "redirect after signup", you are writing the E2E
   journey in the wrong layer; move it.

## The five E2E journeys

| Journey | File | Proves |
|---|---|---|
| 1 | `journey-1-signup-onboarding.spec.ts` | landing → signup → T13 onboarding gate → all six wizard steps → seeded project reachable from the dashboard |
| 2 | `journey-2-invite-accept.spec.ts` | owner invites from the workspace; invitee ACCEPTS in a second, unauthenticated browser context, completes onboarding themselves, lands in the project as editor and performs an editor mutation |
| 3 | `journey-3-viewer-denied.spec.ts` | negative authorization: viewer sees read-only UI AND a direct `PATCH /projects/:id` from their own session returns **404** (ADR-009 masking), via both the backend origin and the app's `/api/v1` rewrite |
| 4 | `journey-4-quota-upgrade.spec.ts` | starter `ai.generation` quota exhausts against the real backend (429-driven loop, no guessed count) → shipped UpgradePrompt renders → upgrade arrives as a **locally signed Stripe webhook** to the real webhook route → the same Generate succeeds |
| 5 | `journey-5-session-refresh.spec.ts` | expired-but-correctly-signed access token swapped mid-session → in-page mutation triggers the single-flight silent refresh once → user never sees `/login` |

## What the E2E stack replaces — and what it deliberately does not

`tests/e2e/global-setup.ts` boots, in order: a throwaway `mongod` (system binary,
temp `dbpath`), the compiled backend (`c0c-bake` `node dist/server.js`) with E2E-only
env, and the built frontend (`next start`). Fixed ports (also in [`e2e/harness.ts`](e2e/harness.ts)):
**FE 19321 · API 19531 · fake AI 19367 · mongo 19532**. A second concurrent E2E run is
not supported — the port allocation is exclusive.

- **AI provider**: the real Alibaba client inside the real backend is pointed at a
  local OpenAI-compatible stub on `127.0.0.1:19367` via `ALIBABA_BASE_URL`. The SDK and
  its JSON-extraction run unchanged; only the network destination is replaced. No live
  API key is ever dialed.
- **Stripe**: only the *delivery* leg is simulated. `deliverStripeEvent` signs
  `checkout.session.completed` locally with the E2E-only `STRIPE_WEBHOOK_SECRET` and
  POSTs the exact bytes to the backend's real `/api/v1/webhooks/stripe` — raw-body
  parsing, the `t=…,v1=…` HMAC check, the idempotency ledger and subscription sync all
  run for real. What is NOT exercised: hosted checkout (`checkout.stripe.com` round
  trip) — the card forbids depending on a real Stripe sandbox; the T17 build is already
  contract-tested against an HTTPS-URL invariant at the unit layer.
- **Fixture users**: registered through the REAL BFF register route (not forged
  tokens), each in its own `X-Forwarded-For` bucket so the backend's auth rate limiter
  (10/15 min per IP) can never trip mid-suite; the backend is launched with
  `TRUST_PROXY_HOPS=1`. Journey 1's persona signs up through the actual browser form.
- **Session expiry (journey 5)** is forced with a correctly-signed token whose `exp`
  is in the past — deterministic, no wall-clock sleeps.
- **A manual `browser.newContext()` inside a test that sets `test.use({ storageState })`
  inherits that cookie jar in Playwright 1.64.** Journeys 2/3 pass
  `{ storageState: undefined }` explicitly to get the genuinely unauthenticated jar
  the persona needs; a bare `newContext()` ran as the OWNER (session initializer saw
  their session, the anonymous invite card never rendered).

## Coverage gates (hard failures — `vitest.config.mts`)

Merged v8 coverage across both projects; a run that misses any threshold exits
non-zero. Demo of the "hard failure" AC: `src/lib/**` branches temporarily set to
100 (above the measured 99.2) → `ERROR: Coverage for branches (99.2%) does not
meet "src/lib/**" threshold (100%)` → exit 1 → reverted. The pre-calibration runs
(see the PR description) show the same polarity organically: features/shared
thresholds failing while every test passed.

| Package | Gate (stmts/branches/funcs/lines) | Measured | Card |
|---|---|---|---|
| `src/app/api/**` | 90 / 90 / 95 / 90 | **100.0 / 100.0 / 100.0 / 100.0** | ≥90 ✓ |
| `src/lib/**` | 98 / 98 / 95 / 95 | 99.01 / 99.2 / 96 / 100 | ≥90 ✓ |
| `src/middleware.ts` | 95 / 85 / 100 / 95 | 100.0 / 100.0 / 100.0 / 100.0 | ≥90 ✓ |
| `src/services/**` | 90 / 80 / 100 / 90 | 97.5 / 86.66 / 100 / 100 | ✓ |
| `src/hooks/**` | 70 / 70 / 70 / 70 | 97.76 / 81.48 / 94.44 / 100 | ✓ |
| `src/store/**` | 90 / 75 / 100 / 90 | 100.0 / 100.0 / 100.0 / 100.0 | ✓ |
| `src/features/**` | 47 / 50 / 36 / 47 — **floors** | 47.25 / 50.2 / 36.29 / 47.13 | ≥80 — ratchet |
| `src/components/shared/**` | 44 / 33 / 25 / 43 — **floors** | 44.11 / 33.33 / 25 / 43.75 | ≥80 — ratchet |

Ratchet policy: gates start at what the code actually measures today and move up
in later PRs — never silently lowered, never raised above what is measured. The
card's ≥90 packages (`api/**`, `lib/**`, `middleware.ts`) sit at or above the
card today; `features/**` and `components/shared/**` sit at their measured floors
with an explicit ratchet path toward the card's 80. New source files under the
first six rows must arrive with tests at the existing gate levels.

Exemptions (all stated, none silent):
- vendored `src/components/ui/**` — out of the coverage program entirely (testing
  Radix wrappers is testing Radix, not us);
- `src/features/**/types.ts`, `src/types/**`, `**/*.test.*`,
  `src/features/**/test-fixtures.ts` — type-only / harness code with no runtime
  branch;
- the single in-code mark: `src/lib/relative-time.ts`'s final `return` carries a
  commented `v8 ignore next` — the unit loop above it always exits via the
  unconditional `'second'` guard, so that branch is provably dead.
