# AR-002 — next-intl pin & Next 16 `proxy.ts` compatibility gate

| | |
|---|---|
| **Task** | AR-002 · [`../../tasks/localization/TASKS.md`](../../tasks/localization/TASKS.md) |
| **Milestone** | AR01 — i18n Architecture & Routing |
| **Decision** | AR-D-02 (i18n library) — adopted the AUDIT-REPORT §7 default recommendation |
| **Gate closed** | I18N-ARCHITECTURE §2.1 "Compatibility verification gate" |

## 1. The question this task had to answer

AR00 left one thing explicitly **UNKNOWN**: does a next-intl release support
Next 16's single middleware file, `src/proxy.ts` (Next 16 renamed
`middleware.ts` → `proxy.ts`), and can it be composed with the existing
auth gate + CSP proxy that already lives in that file?

If the pin had failed, the documented fallback was next-intl's *request-config
API* with manual locale detection in `src/proxy.ts` — the same architecture
without the library middleware.

## 2. Result — the gate passes

| Check | Result |
|---|---|
| Release that declares `next: ^16.0.0` in its peer dependencies | **4.15.1** (published 2026-11-12) — the current `latest` |
| Library documents `proxy.ts` as its supported file | yes — "Note: `proxy.ts` was called `middleware.ts` up until Next.js 16" (next-intl docs, *Proxy / middleware*) |
| `createMiddleware` returns the `(request) => NextResponse` shape `src/proxy.ts` needs to compose | yes — asserted in `tests/i18n/next-intl-compat.test.ts` |
| Locale negotiation matches AR-D-01 / AR-D-12 | yes — locale-less → default locale (307, deep path + query preserved), prefixed → served, unsupported prefix → default locale with the deep path kept |
| Locale cookie seam for FR-3 | yes — the middleware writes `NEXT_LOCALE` |

**Decision: next-intl `4.15.1`, pinned exactly** (no `^` range). A pinned
exact version is deliberate here: the whole program depends on the library's
middleware semantics, and a floating range would silently change the
redirect matrix under the program. The pin is bumped deliberately, with the
compat suite as the gate.

## 3. What ships in this task

| File | Change |
|---|---|
| `package.json` | `next-intl` pinned to `4.15.1` |
| `pnpm-lock.yaml` | regenerated for the new dependency |
| `src/i18n/routing.ts` | the locale model (`locales`, `defaultLocale`, `AppLocale`), the routing contract (`localePrefix: 'always'`, locale detection, the locale cookie) and the direction helper |
| `src/i18n/request.ts` | the server request configuration (`getRequestConfig`) with the empty catalog AR-009/AR-010 will fill |
| `next.config.ts` | `createNextIntlPlugin('./src/i18n/request.ts')` — the only wiring the library needs |
| `tests/i18n/next-intl-compat.test.ts` | the compatibility gate itself |

## 4. What this task deliberately does NOT do

- **No route moves.** `src/app/**` is untouched — the `[locale]` wrapper is
  AR-004 and the proxy composition is AR-005. This task must not change a
  single rendered byte.
- **No middleware wiring.** `src/proxy.ts` is untouched; the composition order
  (intl → auth gate → CSP) is AR-005.
- **No messages.** The catalog is empty on purpose; `messages/**` arrives with
  AR-010, the `common` pilot with AR-009.
- **No RTL, no fonts, no formatters.** AR03/AR02 respectively.

## 5. Risk notes

- The library pulls `@swc/core` (via `next-intl-swc-plugin-extractor`). It is
  a dependency of the *plugin* path only; the runtime middleware does not need
  it. The bundle-budget gate stays green (verified locally).
- `localeCookie` uses the `__Host-` prefix in production and an unprefixed
  name in development — the same convention as the session cookie
  (`src/lib/auth-cookies.ts`), because `__Host-` demands `Secure` and the
  browser rejects it over plain http.
