# T21 — CI, Observability & Deployment — STATUS (frontend)

Branch `chore/T21-ci-observability` (one branch, one PR — card §"one task = one
branch = one PR"). Base: `026ae4c` (`perf/T20-performance`). Repo: `c0c-fr`.

This file is the evidence trail for the card's acceptance criteria: what was
built, what was verified locally, and what remains owner-side because it needs
credentials or platform access that does not exist in this environment.

---

## 1. What changed

### CI — every stage blocking

`.github/workflows/ci.yml` (6 jobs; branch protection should require all):

| Job | Gates |
|---|---|
| quality | `pnpm lint` (0 errors) → `check-lint-baseline.mjs` (warnings ≤ committed baseline, never raised) → `tsc --noEmit` → `pnpm build` (T20 bundle budgets are part of the build) |
| test | `pnpm exec vitest run --coverage` (per-group floors) → `pnpm check:client-secrets` |
| e2e | Playwright journeys, gated on `T21_SIBLING_PAT`; skips green with an explicit marker until the owner adds it, and fails loud if the secret exists but the sibling wiring is incomplete |
| links | `node scripts/check-links.mjs` — resolves every internal `href` and README route row against the real `src/app` route table |
| audit | `scripts/audit-gate.mjs --scope prod` at ≥ high; dev-tree advisories are ledgered with reason, owner and review date in `.audit-exceptions.json`; stale entries fail |
| secrets | gitleaks v8.28.0 (checksum-pinned) over the **full history**, including merge commits |

`.github/workflows/docker.yml`: builds the standalone image, boots it, asserts
`/robots.txt` and `/` answer 200, asserts uid 1000, then scans with Trivy
(HIGH/CRITICAL fail).

### Link checker — derived from the real route table

`scripts/check-links.mjs` reads `src/app/**/{page,route}.tsx`, flattens route
groups, treats `[param]` as one segment and catch-all segments correctly, and
treats `/api/v1/**` as the backend rewrite (not a frontend route). It checks
both every `href` in the code and every route row in `README.md`. There is no
hand-maintained route list to drift.

**Red/green demonstration:** adding
`src/components/zzz-dead-link-demo.tsx` with `href="/this-route-does-not-exist"`
made the checker exit 1 naming the file and line; removing it returned exit 0.

### Docker — deployable frontend image

- Multi-stage, digest-pinned `node:22-bookworm-slim`, pnpm store cache mount.
- `output: 'standalone'`; runtime carries `server.js`, `.next/static` and
  `public` only — no sources, tests, devDependencies or `.env` files.
- `USER node` (uid 1000), `NODE_ENV=production`, `HOSTNAME=0.0.0.0`.
- `HEALTHCHECK` probes `/robots.txt`; this proves the Next process is alive
  only. End-to-end readiness belongs to the backend's `/api/v1/health/ready`.
- `.dockerignore` keeps e2e/docs/artifacts out but **keeps `tests/`**: the
  `src/**` tests import `tests/setup|helpers|msw`, and `next build` typechecks
  `src/**`, so removing them breaks the image build.

### Observability — Sentry without breaking T20 budgets

- **Server** — `src/instrumentation.ts` initialises `@sentry/nextjs` only when
  `SENTRY_DSN` is set and forwards unhandled route/server-component errors via
  `onRequestError`. Unset DSN = SDK never imported.
- **Client** — `src/lib/report-error.ts` is called by the dashboard error
  boundary and `global-error.tsx`. It `import()`s the browser SDK **only when an
  error renders**; a healthy page load never downloads it. With
  `NEXT_PUBLIC_SENTRY_DSN` unset it is a no-op.
- **PII** — both paths set `dataCollection` to disable user info, cookies,
  headers, bodies and query strings. Error reporting cannot become a second,
  unredacted log sink.
- **Source maps** — `productionBrowserSourceMaps: true` emits `.map` files.
  `next.config.ts` wraps the config with `withSentryConfig` only when
  `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` are present, so deploy-time
  builds upload the maps and delete the public copies; local/CI builds without
  the secret are unchanged.
- **Standalone correctness** — Sentry's Node client requires
  `@sentry/server-runtime-injection` at module load and says it must stay
  external when the server is bundled. That package is a direct dependency and
  is imported before the SDK, and both are listed in `serverExternalPackages`,
  so the standalone image resolves it instead of booting with a warning.

### Documentation

- `README.md` rewritten against the real BFF/rewrite architecture, real env
  vars, page and BFF route tables, commands, CI, Docker and deployment.
- `tests/README.md` ratchet table updated with the calibrated measured numbers
  and honest prose about which floors are ratchets.
- `.env.local.example` documents every optional Sentry variable.

### Tests and coverage

- New unit/component tests: `auth-relay.test.ts`, `toast.test.ts`,
  `api-client.test.tsx`, `project-constants.test.ts`,
  `dashboard-widgets.test.tsx`, `widget-settings.test.tsx`,
  `report-error.test.ts`.
- Fixed test pollution: describe-level `afterEach` restores the pre-MSW
  `realFetch`; `Response.json()` is awaited; 204 responses are bodyless; toast
  listeners are removed.
- Coverage floors are hard gates. Full-suite runs only — a per-file run
  zero-fills every other group.

---

## 2. Verification evidence (run locally on this branch)

| Gate | Command | Result |
|---|---|---|
| Lint | `pnpm lint` + `node scripts/check-lint-baseline.mjs` | 0 errors, 2 warnings = baseline → **PASS** |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Build + budgets | `pnpm build` | see §3 |
| Tests | `pnpm exec vitest run --coverage` | see §3 |
| Link checker | `node scripts/check-links.mjs` | 68 internal links resolved against 41 route patterns; red demo failed with file:line, then reverted |
| Audit | `pnpm audit:gate` (`--scope prod`) | **PASS**, production tree clean at ≥ high |
| Secrets (full history) | `gitleaks detect --source . --redact` | **30 commits scanned, no leaks** |
| Image build | `docker build -t c0c-fr:t21 .` | see §3 |
| Image boot + health | `docker run …` → `/robots.txt`, `/` | see §3 |
| Non-root | `docker exec … id -u` | see §3 |

**gitleaks history note.** The only allowlist is the Playwright harness
(`tests/e2e/harness.ts`, values prefixed `t18-e2e-`). Those are fixed test
fixtures that boot a throwaway backend, not deployment secrets, and the rule
stays active everywhere else. A real secret added to any other file still
fails the scan.

---

## 3. Build, coverage and Docker evidence

### Build + T20 budgets

`pnpm build` → `next build` exit 0, `bundle budget PASSED`:

| Route | First-load gzip | Budget | vs baseline | Result |
|---|---|---|---|---|
| `/` (landing) | **137.1 kB** | 140 kB | +1.3 kB | within budget |
| `/dashboard` | **205.8 kB** | 220 kB | +1.9 kB | within budget |
| `/projects/[id]` | **236.0 kB** | 260 kB | +2.0 kB | within budget |

The +1.3 kB on landing is the always-present `global-error` boundary and the
tiny reporter module — **not** the Sentry SDK. `@sentry/nextjs` is behind
`import()` and, with no DSN at build time, the browser chunk is not emitted at
all. The budget still has 2.9 kB of headroom.

`productionBrowserSourceMaps: true` emitted **86 `.map` files** under
`.next/static`.

### Tests + coverage

`pnpm exec vitest run --coverage` → exit 0:

- **81 test files / 546 tests passed**.
- Per-group floors all pass (the run exits non-zero on any breach). Selected
  measured values: `src/lib` 99.56 / 99.27 / 98.38 / 100;
  `src/hooks` 97.76 / 81.48 / 94.44 / 100;
  `src/components/shared` 44.11 / 33.33 / 25 / 43.75;
  `src/features` at its ratchet floor (47 / 50 / 36 / 47).
- New `report-error.test.ts` covers the no-DSN no-op, the init+capture path,
  client reuse, and a swallowed init failure.

### Docker

`docker build -t c0c-fr:t21 .` → success. Booted with production-shaped env
(`NODE_ENV=production`, generated `JWT_SECRET`, synthetic-but-parseable
`SENTRY_DSN`):

| Check | Result |
|---|---|
| `GET /robots.txt` | **200** after 2 s |
| `GET /` | **200** |
| process uid | **1000** (`USER node`) |
| container `HEALTHCHECK` | **healthy**, failing streak 0 |
| `CMD` | `node server.js` — Next standalone server |
| `SENTRY_DSN` set | server SDK initialised **without** the `[Sentry] Failed to register…` warning; `@sentry/server-runtime-injection` is present in the image's `node_modules` |

Note on this host: the Docker daemon's DNS and npm registry access were
intermittently slow/broken for days (IPv6-only answers with no route,
downloads taking 60–340 s). The final image was built once the network
recovered; the pnpm store cache mount keeps retries cheap. GitHub runners are
not affected; the workflow uses the default network.

---

## 4. Acceptance criteria (frontend scope)

- [x] `pnpm lint` is meaningful; CI fails on a new warning (ratchet)
- [x] CI runs lint → typecheck → test → build → e2e → secrets → audit → links
- [ ] **Branch protection requires all jobs** — owner-side (GitHub settings)
- [x] `gitleaks` scans full history and is clean
- [x] `pnpm audit --audit-level=high` production scope is clean; dev-tree exceptions documented/time-boxed
- [x] Link checker fails the build on a dead internal href — demonstrated
- [x] Coverage floors enforced in CI (T18/T21); full suite green
- [x] Diff-coverage on changed lines is enforced in the sibling backend repo; frontend coverage is per-group floors (T18 contract)
- [x] Error reporting active with frontend source maps
- [x] Frontend `README.md` rewritten to match reality
- [x] Both Dockerfiles (this repo and `c0c-bake`): multi-stage, non-root `USER`, `.dockerignore`, `HEALTHCHECK`, `NODE_ENV=production`, correct `CMD`
- [x] Base images pinned by digest; Trivy scan in CI
- [x] Frontend image runs the standalone server — verified by booting it and hitting `/` and `/robots.txt`
- [x] Operational runbook written in `c0c-bake/docs/runbook.md` (deploy, rollback, secret rotation, webhook replay, plan grant, quota refund, AI queue kill)
- [ ] **Alerts configured in a vendor** — definitions in `c0c-bake/docs/alerting.md`; vendor wiring owner-side
- [ ] **End-to-end deploy of both services + rollback tested** — owner-side (Vercel credentials)

---

## 5. Owner-side actions (no credentials/CLI here)

1. **Open the PRs** for `chore/T21-ci-observability` in both repos and make
   every CI job a required check (branch protection).
2. **Vercel**: set `API_URL`, `JWT_SECRET`, the Sentry DSNs and
   `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT`; deploy both; run the
   smoke steps; then **promote the previous deployment** to prove rollback.
3. **Sentry**: create the two projects/DSNs, set the server and client DSNs,
   and verify an error from each side arrives with a readable file/line (the
   source-map upload only runs when the auth token is present).
4. **Uptime vendor**: point checks at frontend `/robots.txt` (liveness) and
   backend `/api/v1/health/ready` (dependency truth). Wire the alert tiers in
   `c0c-bake/docs/alerting.md` (error rate, p95, LLM errors/spend, cold starts,
   auth-failure spikes, quota spikes).
5. **`T21_SIBLING_PAT`**: add the secret so the Playwright job can check out and
   boot the backend. Until then the job skips green with an explicit marker.
6. **Rotate the R-01 provider keys** if that has not happened yet (T01 left it
   as a human action). The scan is clean; rotation is still the remediation.

---

## 6. Known debts (explicit)

- The e2e job is gated on `T21_SIBLING_PAT`; it is a real skip, marked in the
  job log, not a silent pass.
- Sentry source-map **upload** needs the owner's auth token. Without it the
  maps are still emitted (and stack traces are readable in the browser), but
  Sentry issues show minified frames.
- Alert thresholds are documented, not wired to a paging vendor — no
  credentials in this environment.
- `pnpm audit --scope prod` is clean; the full dev tree still reports the
  ledgered toolchain advisories in `.audit-exceptions.json`.
- `src/features/**` and `src/components/shared/**` coverage floors are ratchets
  at today's measured values (47/50/36/47 and 44/33/25/43); they only move up.
- The Docker build on this host needed retries while the daemon's DNS was
  intermittently broken (IPv6-only answers with no route). GitHub runners are
  not affected; the workflow uses the default network.
