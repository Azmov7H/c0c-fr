# c0c-fr — AI Content Engine web app

The Next.js frontend for the c0c content engine. Creators turn an idea into a
script, thumbnail, audio and publishing plan; the app is the whole surface they
touch — marketing pages, auth, dashboard, project workspace, planner and
billing.

The backend lives in the sibling repo `c0c-bake` (Express + MongoDB). This repo
never talks to MongoDB, and the browser never talks to the backend directly:

```
browser ── /api/v1/*  ──▶ Next rewrite ──▶ c0c-bake   (API_URL, server-side)
        └─ /api/auth/* ──▶ BFF route handlers ──▶ c0c-bake  (sets HttpOnly cookies)
```

Two consequences worth knowing before reading the code:

- **Same-origin by design.** The client always calls its own origin
  (`src/config/index.ts` → `/api/v1`). `next.config.ts` rewrites `/api/v1/:path*`
  to `API_URL`. `NEXT_PUBLIC_API_URL` is deliberately gone: nothing in the
  browser needs the backend's address, and shipping it would turn a server-side
  secret into public configuration.
- **Auth is BFF-owned.** Login/refresh/logout and the rest of `/api/auth/*` are
  route handlers that call the backend and set `HttpOnly` session/refresh
  cookies. Client code never stores a token, and `src/proxy.ts` verifies the
  session cookie on protected routes.

## Quickstart

```bash
pnpm install                       # pnpm 12 — packageManager pins the version
cp .env.local.example .env.local   # fill API_URL and JWT_SECRET
pnpm dev                           # Next dev server on :3000
```

The backend must be running for anything past the marketing pages:

```bash
# in the sibling repo
cd ../c0c-bake && pnpm dev         # :5000
```

### Environment variables

| Variable | Required | What it does |
|---|---|---|
| `API_URL` | yes | Server-side backend base URL used by the rewrite and the BFF routes. Defaults to `http://localhost:5001`. Never exposed to the browser. |
| `JWT_SECRET` | yes | Verifies session cookies in `src/proxy.ts`. Must equal the backend's `JWT_SECRET`; missing means fail-closed (every protected route redirects to `/login`). |
| `AUTH_MIDDLEWARE_MODE` | no | `verify` (default) cryptographically verifies the session; `presence` is the pre-T09 rollback; `off` disables the gate. |
| `SESSION_COOKIE_MAX_AGE` | no | BFF cookie lifetime in seconds. |
| `CSP_ENFORCE` | no | Unset → `Content-Security-Policy-Report-Only`; `true` → enforcing CSP (nonce-based, set in `src/proxy.ts`). |
| `SENTRY_DSN` | no | Server-side Sentry DSN (`src/instrumentation.ts`). Unset → the SDK is never imported. |
| `NEXT_PUBLIC_SENTRY_DSN` | no | Client-side Sentry DSN. Unset → error boundaries do not fetch the browser SDK. The SDK is lazy-loaded, so it is not part of the T20 first-load budget. |
| `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | no | Sentry environment tag; defaults to `NODE_ENV`. |
| `SENTRY_TRACES_SAMPLE_RATE` | no | `0`–`1`, default `0` (errors only). |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | no | Build-time source-map upload credentials. Owner-side secret; never committed. |

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server |
| `pnpm build` / `pnpm start` | production build (`next build` + bundle budgets) / serve it |
| `pnpm test:unit` | vitest — node + jsdom projects, coverage floors enforced |
| `pnpm test:e2e` | build + Playwright journeys (needs the backend on `:19531`; see `tests/README.md`) |
| `pnpm lint` / `pnpm lint:baseline` | eslint / warnings-ratchet gate (never loosens) |
| `pnpm exec tsc --noEmit` | the typecheck CI runs |
| `pnpm check:client-secrets` | scans client bundles for secret-shaped strings |
| `pnpm check:links` | resolves every internal `href` + README route row against the real `src/app` route table |
| `pnpm audit:gate` | production dependency audit at ≥ high (ledgered dev-tree exceptions) |

## Routes

Pages live in `src/app`; `(auth)`, `(dashboard)` and `(marketing)` are route
groups and do not appear in URLs. `pnpm check:links` reads this table (and every
`href` in the code) against the real route table — a dead link fails the build.

| Route | What it renders |
|---|---|
| `/` | marketing landing page |
| `/pricing` | plans and feature comparison |
| `/privacy` / `/terms` | legal pages |
| `/login` / `/register` / `/signup` | sign-in and account creation |
| `/forgot-password` / `/reset-password` | password recovery |
| `/verify-email` | email verification landing |
| `/dashboard` | creator dashboard (widgets are lazy-loaded, T20) |
| `/projects` / `/projects/new` / `/projects/[id]` | project list, creation wizard, workspace |
| `/scripts` / `/thumbnails` / `/titles` / `/hashtags` | generation tools |
| `/audio` / `/media` | audio suggestions and media library |
| `/trends` / `/seo` / `/analytics` | research and analytics |
| `/planner` | publishing calendar |
| `/team` | members, invites and activity |
| `/settings` / `/settings/billing` | account settings and billing |
| `/onboarding` | first-run interests/platform wizard |
| `/invites/[token]` | invite acceptance landing |

The BFF surface (`src/app/api/auth/*`) is what the browser calls; each route
relays to `c0c-bake` and owns its cookie behaviour.

| Route | Purpose |
|---|---|
| `/api/auth/login` | credentials → backend session, sets HttpOnly cookies |
| `/api/auth/register` | account creation, sets HttpOnly cookies |
| `/api/auth/refresh` | rotates the access cookie using the refresh cookie |
| `/api/auth/logout` / `/api/auth/logout-all` | clears cookies, revokes backend sessions |
| `/api/auth/session` | current session envelope for the client |
| `/api/auth/ws-token` | short-lived token for the WebSocket handshake |
| `/api/auth/forgot-password` / `/api/auth/reset-password` | recovery flow |
| `/api/auth/verify-email` / `/api/auth/resend-verification` | verification flow |
| `/api/auth/change-password` | authenticated password change |

`/api/v1/**` is not a route in this app — it is the rewrite to the backend.
Its contract is validated in `c0c-bake`.

## Testing

`tests/README.md` is the long form: fixtures, MSW semantics, journey setup and
the coverage ratchet table. The short version:

- **Unit/component** — vitest with two projects (`node` for route handlers and
  lib code, `jsdom` for components). Coverage is measured per group
  (`src/app/api/**`, `src/lib/**`, `src/services/**`, `src/features/**`, …) and
  every floor is a hard failure. The `src/features/**` and
  `src/components/shared/**` floors are ratchets at today's measured values —
  they only move up.
- **E2E** — Playwright journeys drive the real frontend and the real backend;
  see `tests/README.md` for the throwaway-database setup. CI runs them only
  once the owner adds the `T21_SIBLING_PAT` secret (the job skips green with an
  explicit marker until then).

## CI — every gate is blocking

`.github/workflows/ci.yml`:

1. **quality** — lint (0 errors; warnings ratcheted against
   `.lint-baseline.json`), `tsc --noEmit`, and `pnpm build` (bundle budgets are
   part of the build).
2. **test** — full vitest suite under coverage; per-group floors fail the job.
   Also `pnpm check:client-secrets`.
3. **e2e** — Playwright, gated on the sibling-repo PAT (see above).
4. **links** — `node scripts/check-links.mjs`; dead internal links fail with
   `file:line`.
5. **audit** — `pnpm audit --scope prod` at ≥ high. Dev-tree advisories are
   ledgered in `.audit-exceptions.json` with a reason, owner and review date;
   stale entries fail the gate.
6. **secrets** — gitleaks v8.28.0 (checksum-pinned) over the **full history**,
   including merge commits.

`.github/workflows/docker.yml` builds the production image, boots it, asserts
`/robots.txt` and `/` answer 200, asserts the process runs as uid 1000
(`USER node`), then scans with Trivy (HIGH/CRITICAL fail).

## Docker

```bash
docker build -t c0c-fr .
docker run -p 3000:3000 -e API_URL=http://host.docker.internal:5001 c0c-fr
```

The image is a multi-stage standalone build (`output: 'standalone'`): the
runtime stage carries `server.js`, the static assets and only the production
`node_modules` Next computed — no sources, tests, dev dependencies or `.env`
files. It runs as the image's non-root `node` user (uid 1000) and its
`HEALTHCHECK` probes `/robots.txt`, which proves this server process is alive
only; end-to-end readiness (database included) belongs to the backend's
`/api/v1/health/ready`.

## Deployment

Vercel builds this repo directly; set `API_URL` and `JWT_SECRET` in the project
environment (both server-side, never `NEXT_PUBLIC_*`). The Docker image is the
alternative target for any container host. Rollback, uptime monitoring and
alerting are described in the T21 runbook (`T21-STATUS.md`).

### Error reporting and source maps

- **Server** — `src/instrumentation.ts` initialises Sentry only when
  `SENTRY_DSN` is set, and forwards unhandled route/server-component errors via
  `onRequestError`. Without a DSN nothing is imported.
- **Client** — `src/lib/report-error.ts` is called from the route error boundary
  and `global-error.tsx`. It `import()`s the browser SDK *when an error
  happens*; a healthy page load never downloads it, which keeps the landing
  route inside its 140 kB gzip budget.
- **Source maps** — `productionBrowserSourceMaps: true` emits `.map` files next
  to the production chunks. Upload them to Sentry at deploy time with
  `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT`; the token is
  owner-side and must never be committed. The maps are what turn a minified
  stack trace into a file/line in the Sentry issue.
