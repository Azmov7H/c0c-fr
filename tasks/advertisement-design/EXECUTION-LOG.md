# Advertisement System — Execution Log

> **Canonical log:** `tasks/advertisement-design/EXECUTION-LOG.md`.
> **Mirrors:** `c0c-bake/docs/advertisement-design/EXECUTION-LOG.md` and `c0c-fr/docs/advertisement-design/EXECUTION-LOG.md`.
> **Status vocabulary:** `NOT_STARTED / IN_PROGRESS / BLOCKED / COMPLETED / VERIFIED`. See `IMPLEMENTATION-STATUS.md` for the current matrix.

## 2026-11-22 — A0 planning milestone

- Produced the 17-document advertisement design blueprint under `tasks/advertisement-design/`, including ADRs AD1–AD10 and the D1–D12 relation table.
- Recorded D7 credits and D8 TTS as explicit gates; defined the MVP cut line and the original A0–A10 dependency graph.
- Applied the Motion Graphics / Generate Video direction refresh: AD11–AD16, A3-L, A4-M, A6-S, project-first entry point, typed compositions, audio-driven timing, and Arabic/English typography.
- **Status:** A0 `VERIFIED` (planning scope only). No application source was changed at this stage.

## 2026-11-23 — Branch setup and backend foundation (A1, A3-L, A6-S, A4-M)

- Created `feat/advertisement-system` in both repositories from the current branch tips; did not touch `main`.
- Backend: added `src/modules/advertisements/` with constants, model, repository, validation, service, controller, routes, language detection, audio analysis, motion schema, motion engine, motion director, render service, and worker seams.
- Implemented 1:1 `AdvertisementProject` state keyed by `projectId`, soft-delete restoration, unique partial index on `isDeleted: false`, ownership/authz guards, and audit-friendly mutation paths.
- Implemented content-language detection with explicit confirmation, direction/typography profiles, and non-inference from UI locale.
- Implemented `ffprobe`-backed audio analysis with cumulative scene boundaries, Unicode-safe Arabic/Latin segmentation, null-safe word timestamps, drift measurement, and duration refit guards.
- Implemented versioned typed composition generation with preset allowlists, deterministic fallback, and `generatedBy` reporting.
- Added backend unit/orchestration suites for language, motion schema, motion engine, audio analysis, and HTTP orchestration.
- **Status:** A1 `VERIFIED`, A3-L `VERIFIED`, A6-S `VERIFIED`, A4-M `VERIFIED`; A3 `COMPLETED`.

## 2026-11-23 — Render lifecycle and storage/export (A5, A9)

- Implemented render-job creation, active-job idempotency, concurrency cap, retry, cancellation, quota reservation/refund latch (`quotaReserved`), stale-job sweep, progress, and storage-503 handling.
- Implemented the real worker path: Playwright/Chromium frame capture, deterministic `window.__seek(t)`, FFmpeg encoding/muxing, poster generation, and Cloudinary poster/video upload seams.
- Added `render-worker.contract.test.ts`, which drives the real Playwright + FFmpeg path with Cloudinary uploads mocked.
- Extended `storage.service.ts` for advertisement upload, voice upload, signed delivery, and download/destroy paths.
- Fixed render-job unique index to use `partialFilterExpression`; cancel response now reports `quotaReserved: false` after refund.
- **Status:** A5 `COMPLETED`, A9 `COMPLETED`; live Cloudinary acceptance moved to A10.

## 2026-11-23 — Audio pipeline and D8 gate (A6)

- Implemented existing-audio, upload, generated, and no-narration voice paths with language/voice consistency checks.
- Kept Arabic AI voice behind `ADS_AI_VOICE_ENABLED=false`; the service returns `403 AI_VOICE_GATED` when disabled.
- Kept `ffprobe` restricted to allowlisted sources before spawning a process.
- **Status:** A6 `COMPLETED`; D8 live verification remains `BLOCKED` under A10.

## 2026-11-23 — Entitlements and quota-shaped credits (A8)

- Added `ads.access`, `ads.upload`, `ads.voice.upload`, `ads.download`, `ads.render`, and `ads.styles.advanced` capabilities.
- Set `ads.render` quotas to 3/20/100 by plan and wired reservation/refund through the existing D7-shaped quota infrastructure.
- Priced `ads.*` credit operations at `0` pending Cost Analysis; no parallel ledger was created.
- **Status:** A8 `COMPLETED` for quota-shaped MVP gating; paid launch remains blocked by cost sign-off under A10.

## 2026-11-23 — Frontend workflow and bilingual UI (A7)

- Added frontend types, service, query keys, render-status helpers, labels, hooks, and bilingual `advertisements.json` catalogs.
- Added `advertise-card`, list view, detail view, `gate-error`, `preview-player`, `language-gate`, `composition-panel`, `audio-panel`, `voice-panel`, `render-panel`, `VideoPipeline`, and `VideoTab` components.
- Added `/advertisements` and `/advertisements/[id]` routes, navigation entry under `Content Engine`, protected `/advertisements` prefix, and lazy workspace `video` tab.
- Added role-gated **Generate Video** action to the project workspace header; project role derives from `useProjectMembers`, `useAuthStore`, and `can(role, 'edit')`.
- Shared `VideoPipeline` between the top-level detail page and workspace Video tab.
- Added frontend service, render-status, hook, i18n/RTL, navigation, and workspace-copy regression tests.
- **Status:** A7 `COMPLETED`; full browser e2e deferred to A10.

## 2026-11-23 — Validation corrections

- Backend: `compositionHash()` changed to `stableStringify()`; language confirmation gate corrected to `!languageConfirmed`; cancel response corrected to `quotaReserved: false`; render-job index changed to `partialFilterExpression`; worker lint warnings addressed.
- Frontend: added `advertisements` to the navigation-copy floor and `video` to the workspace-copy floor; replaced raw `bg-amber-50/40` with semantic `bg-warning/10`; removed unused `RotateCcw`; documented the Cloudinary poster `<img>` exception.
- Frontend tests were aligned with the real `apiClient` response shape (`{ data: envelope }`) and the real preview contract (`allow-scripts` only; widened sandbox values rejected to `''`).
- **Status:** No remaining in-repo validation failures introduced by this work.

## 2026-11-23 — Validation matrix

### Backend

- `npx tsc --noEmit` — clean.
- Targeted advertisement suites — 6 files, 32 tests passed.
- `npx eslint src/modules/advertisements tests/advertisements tests/unit/advertisements-*.test.ts` — 0 errors, 27 warnings.
- `npm run lint` — 0 errors, 742 warnings (baseline-heavy).
- `npm run build` — passed.
- Full `npx vitest run` — 758 tests passed, 5 skipped; only the two pre-existing MongoMemoryServer suites failed (`storage`, `trends.perf`).

### Frontend

- `pnpm exec tsc --noEmit` — clean.
- Targeted advertisement/navigation/workspace-copy suites — 6 files, 29 tests passed.
- `pnpm test:unit` — 138 files, 953 tests passed.
- `pnpm lint` — 0 errors, 1 pre-existing warning in `scripts/check-rtl.mjs`.
- `pnpm check:i18n`, `pnpm check:rtl`, `pnpm check:links` — passed.
- `pnpm build` — Next build and bundle budget passed; both advertisement routes are present.
- **Status:** Local automated gates green; external gates unchanged.

## 2026-11-23 — Status documentation and handoff

- Authored canonical `IMPLEMENTATION-STATUS.md` and this execution log.
- Mirrored both documents into `c0c-bake/docs/advertisement-design/` and `c0c-fr/docs/advertisement-design/`.
- Committed each repository separately on `feat/advertisement-system` and pushed to `origin` without force-push, branch deletion, or merge.
- `gh` is not installed in this environment; PR creation/update must be done through the GitHub web UI or API from an authenticated environment.
- **Status:** A10 `BLOCKED` until the external gates in `IMPLEMENTATION-STATUS.md` are satisfied.

## 2026-11-24 — Live Cloudinary smoke and storage fix (A2, A9)

- Confirmed live Cloudinary credentials and provider connectivity (`api.ping` returned `ok`) without printing credentials.
- Reproduced a real upload failure: the storage seam sent `data:image/*;base64,...`, which Cloudinary rejected; `data:application/octet-stream;base64,...` was accepted and sniffed as `png`.
- Created `fix/cloudinary-image-mime` from `origin/main` (`70d5873`). Changed image data URIs to `application/octet-stream` and added `invalidate: true` to `destroy()` so deleted renders are purged from the CDN edge cache.
- Added `tests/unit/storage-mime.test.ts` covering the wildcard-MIME regression, explicit video/audio MIMEs, and CDN invalidation. Replaced the unsafe secret assertion in `signUpload()` with an explicit guard so both TypeScript and ESLint are clean.
- Live smoke passed: image, poster, and video uploads returned `200`; signed upload was generated; all three delivery URLs returned `404` after invalidation propagated (~5–7 s for warm cache). Unique public IDs were used and cleanup was attempted in `finally`.
- Validation on the fix branch: `npx tsc --noEmit` clean, 7 files/35 targeted tests passed, targeted ESLint 0 errors/0 warnings, `npm run build` passed, and the live Cloudinary smoke passed again after the `signUpload()` guard change.
- Committed as `9a8b23d` and pushed to `origin/fix/cloudinary-image-mime`. No PR was created here because `gh`/`GITHUB_TOKEN` are unavailable.
- **Status:** A2 `VERIFIED`, A9 `VERIFIED`; backend feature PR #30 remains externally merged and the new fix PR is pending.

## 2026-11-24 — Live render and D8 TTS evidence (A5, A6, A10)

- Ran a live render smoke with real MongoMemoryServer, Chromium, FFmpeg, and Cloudinary using a 2 s Arabic RTL 16:9 composition. The job reached `completed`/`100`, produced H.264 `1280x720` with probed duration `2 s`, uploaded MP4 and poster, both delivered `200`, and cleanup returned `404`.
- Ran a D8 live TTS smoke with the configured `qwen-audio-3.1-tts-flash` model and `longanhuan_v3.1` voice. Short Arabic and English prompts returned non-silent MP3 audio: ar 2487 ms/3.648 s/−19 dB, en 2305 ms/3.168 s/−19.8 dB, `expiresAt: 1795567351`. No signed URLs or credentials were printed.
- Recorded the limits explicitly: the render was 2 s, not the 30 s acceptance duration; the TTS result proves provider acceptance of short text only, not Arabic voice/language correctness, roster, gender/dialect, pricing, limits, or a D8 decision. `ADS_AI_VOICE_ENABLED` remains false.
- **Status:** A5 `COMPLETED` with partial live evidence; A6 `COMPLETED` with partial D8 evidence; A10 remains `BLOCKED` on full-duration render, golden RTL review, D8 decision, worker operations, R-01 rotation, e2e/Lighthouse, and cost sign-off.

## 2026-11-24 — Status refresh and PR handoff

- Refreshed the canonical `IMPLEMENTATION-STATUS.md` with the merged backend PR state, the new backend fix branch, live Cloudinary evidence, the 2 s render evidence, and the partial D8 TTS evidence.
- Mirrored the updated status/log documents into `c0c-bake/docs/advertisement-design/` and `c0c-fr/docs/advertisement-design/` and updated `PR-HANDOFF.md` / `PR-BODY-c0c-fr.md` for manual PR creation.
- **Status:** A10 `BLOCKED`; no assistant-performed merge, force-push, branch deletion, or `main` modification.

## 2026-11-24 — Full 30 s render and golden RTL capture (A5, A10)

- Repeated the live render smoke at the full 30 s acceptance duration with a 900-frame Arabic RTL 16:9 composition. The job reached `completed`/`100`, produced H.264 `1280x720` with probed duration `30 s`, uploaded MP4 and poster, both delivered `200`, and cleanup returned `404`.
- Extracted frames at 1 s, 15 s, and 29 s. Each is 1280×720; bright-pixel content in the expected headline area stayed stable, with the Arabic text bounding box at x 939–1148 inside the x 128–1152 headline region, consistent with RTL anchoring. This is a mechanical check, not human visual approval.
- **Status:** Full 30 s render gate `PASSED`; golden RTL frame review `PARTIAL` pending human sign-off; A10 remains `BLOCKED`.

## 2026-11-24 — Extended D8 evidence (A6, A10)

- Fetched the official non-real-time speech-synthesis guide, Qwen-Audio-TTS HTTP API, voice list, and model-pricing page. Confirmed the configured model/endpoint shape, `ar` as a valid `language_hints` code, `longanhuan_v3.1` as a female multilingual/dialect voice, `qwen-audio-3.1-tts-flash-naseem_ar` as a dedicated Arabic male voice, SSML/instruction/timestamp support, and token-based prices.
- Ran a bounded live smoke with three calls: `longanhuan_v3.1` + `language_hints: ["ar"]`, `qwen-audio-3.1-tts-flash-naseem_ar`, and a 1500-character Arabic cap probe. All returned HTTP `200`, non-silent MP3s, `usage` token counts, and 24-hour URLs. The cap probe produced 252.624 s audio and 415/3157 input/output tokens. No credentials or signed URLs were logged.
- Recorded the evidence in `D8-EVIDENCE-2026-11-24.md` and added an interim engineering decision to keep `ADS_AI_VOICE_ENABLED=false`, add no language/gender/dialect/SSML option, and require owner listening review, dialect/locale policy, and cost sign-off before a formal D8 decision.
- **Status:** D8 evidence gates §7.1–§7.5 have supporting evidence; D8 remains `NOT DECIDED`, A6 remains `COMPLETED`, and A10 remains `BLOCKED`.

## 2026-11-24 — Playwright and Lighthouse triage (A10)

- Ran the full Playwright suite twice: `25 passed / 5 failed`, then `24 passed / 6 failed`. A targeted RTL rerun produced `12 passed / 2 failed`. No advertisement route, component, or navigation entry was implicated.
- Root-caused the failing journeys: `journey-2-invite-accept`, `journey-3-viewer-denied`, and `m2-workspace` still drive the old three-step wizard, while the shipped wizard has had four steps since `d05787b`. `git diff 661b22e..HEAD -- tests/e2e playwright.config.ts package.json` is empty.
- Attempted spec-only wizard updates, then reverted them. They advanced to deeper unrelated baseline failures: invite-preview SSR error digest `263232933` while waiting for `Create an account`, and `m2-workspace` expecting a `Scripts` heading where the UI renders it as text. No e2e spec or advertisement source was left changed.
- Investigated the axe failure: `label-content-name-mismatch` is accepted debt capped at 4 nodes; `/projects` was observed with 6 nodes on target `#radix-_r_4_`, a sidebar Account menu button with visible initials `JO`. A debug run observed 2 nodes, so the count fluctuates; the Advertisements nav link is not among the offenders. The one-run `/settings` `color-contrast` violation (24 nodes) did not reproduce in the targeted rerun.
- Ran Lighthouse CI with Playwright Chromium (`CHROME_PATH=... LHCI_RUNS=1 pnpm lhci`). Collected `/en`, `/en/dashboard`, `/en/projects`, and `/en/login`: LCP `5.343 / 3.260 / 5.160 / 6.556 s`, TBT `2917 / 5470 / 3829 / 5945 ms`, CLS `0`, accessibility `1 / 1 / 1 / 0.96`, performance `0.47 / 0.54 / 0.44 / 0.42`. Every route also reports `"accessibility" is not a known audit`.
- Confirmed `lighthouserc.cjs` is unchanged from the pre-advertisement branch and historical reports already exceed the same LCP/TBT budgets, including `2026-11-13` and October/November TBT as high as `12561 ms`. No advertisement source change was made for either gate.
- **Status:** Full e2e and Lighthouse remain `BLOCKED` by stale specs, accepted axe debt, invalid LHCI configuration, and pre-existing performance debt. No new advertisement regression was identified; A10 remains `BLOCKED`.

## 2026-11-24 — 1080 p acceptance render (A5, A10)

- Reused the live render harness with the direct `1080p` worker config (plan gating remains server-side) and repeated the full 30 s Arabic RTL 16:9 acceptance with real MongoMemoryServer, Chromium, FFmpeg, and Cloudinary.
- The job reached `completed`/`100`, produced H.264 `1920x1080` with probed duration `30 s`, and uploaded MP4 and poster; both delivery URLs returned `200`. Cloudinary admin lookups for both public IDs returned `404` after cleanup. No credentials or signed URLs were logged.
- Extracted frames at 1 s, 15 s, and 29 s. All three are 1920×1080 with a stable bright-pixel bounding box at x 1408–1722 inside the expected x 192–1728 headline area and entirely on the right half, consistent with RTL anchoring. This is a mechanical check; human visual sign-off is still pending for both 720 p and 1080 p frame sets.
- **Status:** Full 30 s render gate is now `PASSED` at both 720 p and 1080 p. Golden RTL frame review remains `PARTIAL`; A10 remains `BLOCKED`.

## 2026-11-24 — External PR merge verification

- Fetched remote-tracking refs only (no local `main` checkout or modification) and verified that backend PR #31 merged at `0cfcb98` and PR #32 merged at `651e3fc`; current `c0c-bake` `origin/main` is `651e3fc`. PR #32 included the Cloudinary fix and the e2e/Lighthouse triage docs through head `39bbf40`. The branch has two later docs-only commits (`b4b709d` 1080 p evidence, `3a9e103` PR-state note) that are not on `main`.
- Verified through the public GitHub API that frontend PR #66 was merged by the repository owner at `2026-11-24T10:44:04Z` with merge commit `d9b599a` and head `fc3aa4d`; current `c0c-fr` `origin/main` is `d9b599a`. PR #65 had merged earlier at `8f5bb00`. The branch has one later docs-only commit (`fd96a62`) that is not on `main`.
- The curated `PR-BODY-c0c-fr.md` remains in the handoff directory even though PR #66 used an auto-generated Gitar body. If the trailing documentation-only commits are required on `main`, a new doc-only PR is needed; no reset or force-push should be used.
- **Status:** PR handoff evidence refreshed with external merge facts. A10 remains `BLOCKED`; no assistant-performed PR creation, merge, force-push, branch deletion, or local `main` modification occurred.

## 2026-11-25 — Cross-milestone Cost Analysis evidence (A8, A10)

- Created the canonical [`../COST-ANALYSIS.md`](../COST-ANALYSIS.md) evidence package. It records current `credit-prices.ts` placeholders, all nine `CreditOperation` rows, `PLAN_GRANT_MONTHLY`, quota/plan ladders, and the missing P11 estimate endpoint.
- Collected official Alibaba Model Studio, Cloudinary, Vercel, and MongoDB Atlas unit prices with retrieval dates and region caveats. Derived arithmetic examples from the project's recorded TTS token usage; no provider price was guessed.
- Mapped every price/credit consumer in both repositories, including `export` `402 PRICING_PENDING`, the ledger/history reads, and the absence of a paid guard on `ads.*`. Recorded the worker-host, telemetry, delivery-byte, and production-configuration gaps that still prevent a signed numeric table.
- Cross-linked the evidence from the task registry, Milestone 3 tracker/decisions/status files, and the canonical advertisement status. No application price, entitlement value, feature flag, or status was changed.
- **Status:** A8 remains `COMPLETED` (quota-shaped MVP only); A10 remains `BLOCKED`. Provider-cost evidence is `COMPLETE`; numeric price table and owner sign-off remain `BLOCKED`.

## 2026-11-25 — Pricing-readiness code path (`c0c-bake` `feat/pricing-readiness`)

- Implemented `GET /api/v1/billing/credits/estimate?op=<CreditOperation>&sections=&narrationSeconds=` on the authenticated billing router. Query values are coerced by Zod and the operation vocabulary is derived from `CREDIT_PRICES`; no client price is accepted. It is side-effect-free (no `requireEntitlement`, no ledger/quota writes) and honestly reports `creditCost: 0` / `pricePending: true` from `cost-analysis-pending.v0`. Six HTTP tests pin auth, validation, all nine operations, coercion, and zero side effects.
- Added raw provider `usage` telemetry: token counts are normalised at the Alibaba text/TTS response seams, accumulated in the ambient `AiRequest` context, and persisted on success and failure in `withAiRequest`. The two ads director calls are now instrumented as `ads.motion.generate` / `ads.motion.scene.regen`. No generated record, `motionProject`, `compositionHash`, provider contract, or credit price was changed.
- Added the shared 402 `PRICING_PENDING` error and `requirePublishedPrice` middleware. A new default-off `ADS_PAID_ENABLED=false` keeps the shipped quota-only MVP unchanged; in paid mode, unpriced `ads.motion.generate`, `ads.motion.scene.regen`, `ads.voice.generate`, `ads.render`, and retry are refused before quota/credit/job side effects. D8 voice precedence (`403 AI_VOICE_GATED`) is preserved while `ADS_AI_VOICE_ENABLED=false`.
- Validation: `tsc --noEmit` clean; targeted suites 61/61 plus 8/8 guard tests; full lint 0 errors / 731 warnings (baseline 742); `npm run build` clean. Full `npm test` had 844 passed / 28 skipped with 4 file failures: two known MongoMemoryServer start timeouts (both pass in isolation) and two admin config assertions that fail only because the local `.env` now contains real Cloudinary credentials (both pass with those variables cleared). No new advertisement-source regression.
- **Status:** Pricing readiness code is `IMPLEMENTED` on the branch only (no merge, no price published). A8 remains `COMPLETED`; A10 remains `BLOCKED` on owner sign-off, D8, human RTL review, worker operations, and R-01 rotation.

## 2026-11-25 — Minimal e2e/LHCI spec and config repair (`c0c-fr` `fix/e2e-lhci-spec-config`)

- Created `fix/e2e-lhci-spec-config` from `feat/pricing-readiness` (base `92fc54b`), with no application source changes.
- `journey-2-invite-accept.spec.ts` and `journey-3-viewer-denied.spec.ts`: added the missing third wizard `Continue` so they reach the shipped four-step review state instead of submitting from step 3.
- `m2-workspace.spec.ts`: added the two missing `Continue` clicks, clicked the real `Create “M2 workspace journey”` button, tightened the project URL assertion to `/\/projects\/[a-f\d]{24}$/`, and replaced false-positive headings with scoped text locators (`#scripts` `Scripts`, exact `Project Thumbnail`, exact `Images`).
- `lighthouserc.cjs`: replaced the invalid audit key `accessibility` / `minNumericValue` with `categories:accessibility` / `minScore: 0.95`. LCP/TBT/CLS numbers were not changed, and `rtl-a11y.spec.ts` axe caps were not raised.
- Validation: `pnpm exec tsc --noEmit` clean; `API_URL=http://localhost:19531 pnpm exec next build` clean; `git diff --check` clean. Targeted Playwright: `m2-workspace.spec.ts` passes (`1 passed`, 45.3 s); `journey-2` and `journey-3` pass the four-step wizard creation portion, then time out waiting for `Create an account` on the invite preview because the frontend logs SSR error digest `263232933`.
- LHCI assertion verification with `@lhci/utils` 0.15.1 against retained LHRs: the corrected key resolves to `categories.accessibility` and passes `minScore` at `1 / 1 / 1 / 0.96` on `/en`, `/en/dashboard`, `/en/projects`, and `/en/login`; the old key produces `auditRan passed=false` on all four routes. Retained LHRs still fail LCP `5343.38 / 3259.67 / 5160.10 / 6555.50 ms` and TBT `2917.31 / 5469.5 / 3828.5 / 5944.75 ms` against unchanged budgets.
- Remaining baseline debt: invite-preview SSR error, accepted `label-content-name-mismatch` axe debt (observed 6 vs cap 4, fluctuates), intermittent `/settings` `color-contrast`, and pre-existing LCP/TBT. No new advertisement-attributable failure was introduced.
- **Status:** Stale wizard steps and the invalid LHCI key are `FIXED` on the test/config-only branch; full e2e/Lighthouse gates remain `BLOCKED` by unrelated baseline debt. A10 remains `BLOCKED`; no PR was created or merged.

## 2026-11-26 — Invite-preview SSR fix (`c0c-fr` `fix/invite-preview-intl-provider`)

- Created `fix/invite-preview-intl-provider` from `fix/e2e-lhci-spec-config` (`6997ca8`). One application-layout source file changed: `src/app/[locale]/invites/layout.tsx`.
- Root cause: `/[locale]/invites/[token]` sits outside the `(auth)` and `(dashboard)` route groups, so `AppProviders` alone supplies no `NextIntlClientProvider`. `InviteLanding` calls `useTranslations('projects')` as a client component during SSR, which threw digest `263232933` before the preview could render the sign-up link. The minified SSR chunk confirms the digest maps to that call.
- Fix: the invite layout is now async and wraps its children in `NextIntlClientProvider` using `getLocale()` and only `messages.projects`, mirroring the auth layout's scoped provider pattern. No axe cap, performance budget, advertisement source, or backend file was changed.
- Validation: `pnpm exec tsc --noEmit` clean; targeted ESLint clean; `API_URL=http://localhost:19531 pnpm exec next build` clean; `git diff --check` clean. Targeted Playwright `journey-2-invite-accept` and `journey-3-viewer-denied` now report `2 passed (2.5m)`, with digest `263232933` occurrences `0` in `/tmp/opencode/e2e-invite-intl-provider.log`. The existing compiled backend was reused; `c0c-bake` was not modified or rebuilt.
- Remaining baseline debt: accepted `label-content-name-mismatch` axe debt (observed 6 vs cap 4, fluctuates), intermittent `/settings` `color-contrast`, and pre-existing LCP/TBT performance budgets. No new advertisement-attributable failure was introduced.
- **Status:** Invite-preview SSR blocker `RESOLVED` on this branch; full e2e/Lighthouse gates remain `BLOCKED` by the remaining baseline debt. A10 remains `BLOCKED`; no PR was created or merged.

## 2026-11-26 — Axe accessibility debt (`c0c-fr` `fix/axe-accessibility-debt`)

- Created `fix/axe-accessibility-debt` from `fix/invite-preview-intl-provider` (`3eb1359`). Baseline reproduced in `/tmp/opencode/axe-baseline.log`: `1 failed / 13 passed`, with `label-content-name-mismatch` 6 nodes on `/projects` against cap 4.
- Root causes and fixes — no axe cap was raised:
  - `label-content-name-mismatch`: icon/sr-only controls omitted their visible text from the accessible name. The account menu initials, search visible text plus `⌘K`, unread count, and filter text are now part of their accessible names. Project thumbnail links use a contiguous `${initial}${platform}` token so axe's tokenizer finds the visible `J`/`M` and `YouTube` text inside the label (separators and uppercase variants still failed).
  - `color-contrast`: light-theme tokens were too light for tinted surfaces (`--primary`, `--ring`, sidebar primary/ring, `--muted-foreground`, `--destructive`, `--success`, `--warning`), and several callers overrode them with opacity or muted classes (sidebar group label, verification banner body, auth footer/subheading, destructive alert description). Those callers now use full-contrast foreground/tokens, the alert uses `text-destructive` instead of `text-destructive/90`, and `--success` is darkened to 25% for AA on success-tinted badges.
  - Scan stability: the axe helper waits for network idle and injects a reduced-motion-neutral style (zero animation/transition duration) before scanning. Data-backed `animate-in fade-in` surfaces had been scanned mid-fade, where blended colors (for example `#74747d` from `#6c6c71` at 90% opacity) produced false positives.
- `tests/e2e/specs/rtl-a11y.spec.ts`: both the `color-contrast` (cap 16) and `label-content-name-mismatch` (cap 4) exceptions were **removed**. `region` (3), `page-has-heading-one` (1), and `aria-required-children` (1) were not changed.
- Validation: `pnpm exec tsc --noEmit` clean; targeted ESLint clean; `git diff --check` clean; `API_URL=http://localhost:19531 pnpm exec next build` clean (`/tmp/opencode/axe-build5.log`). `pnpm exec playwright test tests/e2e/specs/rtl-a11y.spec.ts` passed `14 passed` twice (`/tmp/opencode/axe-rtl-final4.log`, `/tmp/opencode/axe-rtl-final5.log`). Per-page instrumentation showed zero `color-contrast` and zero `label-content-name-mismatch` nodes on `/`, `/login`, `/pricing`, `/dashboard`, `/projects`, and `/settings` in both locales. Full Playwright passed `30 passed` (`/tmp/opencode/axe-full-e2e-final.log`); an earlier full run hit a pre-existing flaky assertion in `journey-2-invite-accept` (`/invites/[a-zA-Z0-9]+` rejects generated tokens beginning `_`/`-`), and the isolated rerun passed (`/tmp/opencode/axe-invite-retry2.log`). No Lighthouse budget or performance number was changed; LCP/TBT remain baseline-blocked.
- **Status:** `color-contrast` and `label-content-name-mismatch` `VERIFIED` with no accepted exceptions; A10 remains `BLOCKED` by external gates and the unchanged LCP/TBT budgets. No PR was created or merged; `c0c-bake` was untouched.

## 2026-11-26 — Invite token regex flake (`c0c-fr` `fix/invite-token-regex`)

- Created `fix/invite-token-regex` from `fix/axe-accessibility-debt` (`c8b9be3`). Only two e2e assertions changed: `tests/e2e/specs/journey-2-invite-accept.spec.ts:61` and `tests/e2e/specs/journey-3-viewer-denied.spec.ts:52`.
- Root cause: generated invite tokens use the backend's URL-safe alphabet `^[A-Za-z0-9_-]{20,200}$` (`c0c-bake` `members.validation.ts` `inviteTokenParamSchema`), but both specs asserted `/invites/[a-zA-Z0-9]+`. A token starting with `_` or `-` made the journey fail intermittently; the observed full run failed on `_0btVAy3ZYyjOENUlpt76v_aU1vIXXJYRZAnHS3z6Vc` while the isolated rerun passed.
- Fix: both assertions now mirror the backend schema with `/\/invites\/[A-Za-z0-9_-]{20,200}$/`. No application source, axe cap, performance budget, or backend file was changed.
- Validation: `pnpm exec tsc --noEmit`, targeted ESLint, and `git diff --check` clean. Targeted invite journeys `2 passed (1.7m)` (`/tmp/opencode/invite-regex-targeted.log`); full Playwright `30 passed (4.0m)` (`/tmp/opencode/invite-regex-full.log`).
- **Status:** flaky invite-token assertion `VERIFIED`; A10, Lighthouse budgets, D8, and pricing remain unchanged. No PR was created or merged; `c0c-bake` was untouched.

## 2026-11-26 — Lighthouse performance gate re-measured; remains `BLOCKED` (`c0c-fr` `docs/lighthouse-blocked-evidence`)

- Created a docs-only branch from `fix/invite-token-regex` (`e36d8d6`). No application source, LHCI assertion, URL pattern, axe cap, or budget changed; `c0c-bake` was untouched.
- Rebuilt the current head (`/tmp/opencode/lighthouse-baseline-build.log`; bundle budget `PASSED`: landing `134.5 kB`, dashboard `217.3 kB`, workspace `258 kB` gzip) and ran the unchanged LHCI config with `CHROME_PATH=... LHCI_RUNS=3 pnpm lhci` (`/tmp/opencode/lighthouse-head-baseline-3runs.log`; 12 reports retained in `.lighthouseci/`).
- Median results: landing LCP `5.87 s` / TBT `6692 ms`; dashboard `9.50 s` / `19281 ms`; projects `6.31 s` / `13591 ms`; login `10.76 s` / `9716 ms`. CLS is `0` and accessibility is `1` on all 12 reports. Every TBT run exceeds the unchanged `200 ms` lab proxy budget.
- A prior single run on the same head (`/tmp/opencode/lighthouse-baseline-lhci.log`) reported LCP `4.8 / 2.9 / 5.5 / 7.5 s` and TBT `2086 / 5460 / 8137 / 8610 ms` (landing/dashboard/projects/login). The spread is environment noise, not a gate improvement.
- Rejected harness probes: changing `startServerCommand` to `node .next/standalone/server.js` first appeared to reduce TBT to `210–267 ms`, but every CSS/JS/font request returned `404` (`/tmp/opencode/lighthouse-standalone-lhci.log`; reports in `/tmp/opencode/lhci-rejected-standalone/`), so it measured an unstyled page. After copying `.next/static` and `public` into `.next/standalone` as a real deployment would, TBT was `9.9–14.3 s` (`/tmp/opencode/lighthouse-standalone-assets-lhci.log`). The temporary config was deleted; the default `next start` harness remains authoritative.
- CPU profile (`/tmp/opencode/profile-login.log`, 4× throttle) and LHR long-task attribution continue to point at Next/React hydration (`0d9snta4ce-31.js`, 73 KB transfer) plus unattributable main-thread work, not advertisement code. The landing hero image is already eager/high-priority; its LCP breakdown is dominated by render delay (52%) and load delay (16%), not a missing priority hint.
- New observation, deliberately left unchanged: the assertMatrix patterns `^http://localhost:3100/$` and `^http://localhost:3100/dashboard$` do not match the actual LHCI URLs `/en` and `/en/dashboard`, so those two LCP budgets are currently unasserted. Changing them is a gate-policy decision; this docs-only branch does not do it.
- **Status:** Lighthouse LCP/TBT `BLOCKED` / `UNCHANGED`; budgets, assertions, and application code unchanged. A10, D8, pricing, and all external gates remain unchanged. No PR was created or merged.

## 2026-11-26 — Vision alignment audit (Phase 1/2)

- Revisited the original planning record before changing code: advertisement A0–A10 and refreshed A3-L/A4-M/A6-S cards, milestone P04–P12 documents, D8 evidence, Cost Analysis, localization SEO status, execution logs, and handoff notes.
- Audited the backend generation/persistence/render/export paths and the frontend generation-to-UI lifecycle without modifying application source.
- Produced canonical `VISION-ALIGNMENT-AUDIT-2026-11-26.md` with task-to-implementation mapping, original behavior, current behavior, problems, root causes, required corrections, and verification criteria.
- Confirmed the real Generate Video chain exists (project-first entry, typed motion, audio analysis, durable worker, MP4/poster delivery), but found material divergence from the creative-production vision: SFX/music have no bytes; generic TTS persists expiring URLs; ADS voice is D8-gated and lacks a player; async script lifecycle and SEO/preview error states are incomplete; export omits ADS/SEO artifacts; and creative direction is implicit rather than an inspectable plan.
- Confirmed **“Sound Mail” is absent from planning and code**. Recorded open question `Q-SM-01`; did not invent a new feature or alias it to SFX/voice-over.
- Re-opened A2, A3, A4-M, A5, A6, A7, and A9 as `IN_PROGRESS` in `IMPLEMENTATION-STATUS.md`. A10, D8, pricing, golden RTL review, worker operations, R-01 rotation, and Lighthouse budgets are unchanged.
- **Status:** Phase 1 audit and Phase 2 root-cause analysis complete. No code fix was applied before the audit; no PR was created or merged.

## 2026-11-26 — Owner decisions after audit

- `Q-SM-01` resolved: “Sound Mail” is a **project audio message**, not email delivery. Traced as new task `A6-M` with explicit spec in `14-SOUND-MAIL.md`. Generated text path remains D8-gated; uploaded path is unblocked.
- SFX/music byte source: add real uploaded audio plus a deterministic royalty-free synthesized pool; keep suggestions-only state explicit where bytes are unavailable.
- D8: keep `ADS_AI_VOICE_ENABLED=false`; repair lifecycle, persistence, players, errors, and retry without enabling AI voice by default.
- Created isolated feature worktrees from current `origin/main` (`c0c-bake` `627dfd4`, `c0c-fr` `ce6ab88`) on branch `fix/creative-vision-pipeline`; no existing checkout, uncommitted work, `main`, force-push, or branch deletion was touched.

## 2026-11-26 — Vision-alignment repair (`fix/creative-vision-pipeline`)

- Backend: generated TTS bytes are fetched, validated, and uploaded before persistence; deterministic royalty-free SFX/music WAV bytes are synthesized; audio layers accept signed uploads; the render worker loads and mixes narration/music/SFX; export gained `video`, `seo`, and Sound Mail scopes; SEO generation validates provider output; the realtime render event is mirrored over the wire; and download filenames are Arabic-safe with RFC 5987 headers.
- Frontend: the fake script generator was replaced with project-scoped async generation that polls durable `202 {jobId, status:'queued'}` jobs; Sound Mail and audio layers have real players/states; SEO exposes score, provider error, and retry; `generation:completed` and `advertisement:render.updated` invalidate caches; composition/preview failures show localized alerts; and MP4 download uses authenticated blob fetch with RFC 5987 filename parsing.
- Owner gates stayed closed: `ADS_AI_VOICE_ENABLED=false`, generated Sound Mail/AI voice return `403 AI_VOICE_GATED`, `ads.*` prices remain `0`, and no voice picker or paid-launch toggle was added.
- Backend gates: targeted vision suites `6 files / 25 tests` passed; `npm run typecheck`, `pnpm lint` (0 errors, 683 baseline warnings), and `pnpm build` passed. Full `pnpm test` had 81 passing files / 4 failing files and 901 passing / 13 failing / 16 skipped tests; failures are timing-sensitive performance assertions, Unsplash tests without `UNSPLASH_ACCESS_KEY`, MongoMemoryServer startup, and a missing `winston-transport` dev dependency. No targeted vision suite failed.
- Frontend gates: targeted vision suites `10 files / 69 tests`; catalog-floor rerun `3 files / 26 tests`; final copy/i18n rerun `4 files / 31 tests`; `pnpm test:unit` `149 files / 997 tests`; `pnpm build` and bundle budget passed. `tsc --noEmit`, `pnpm lint` (0 errors, one pre-existing `scripts/check-rtl.mjs` warning), `pnpm check:i18n`, and `pnpm check:links` passed. `pnpm check:rtl` still fails on 17 pre-existing physical utilities in untouched admin files; no changed file is implicated.
- Targeted Playwright: `rtl-a11y.spec.ts` plus `locale-routing.spec.ts` first ran `19 passed / 3 failed`; all locale-routing, public-page, and gallery RTL/axe tests passed. The authenticated-shell failures were `Execution context was destroyed, most likely because of a navigation`, with concurrent `Refresh token has been revoked` logs and no axe violations. An authenticated-shell-only rerun was `1 passed / 5 failed` on a different case set with the same context/auth race. Full browser e2e sign-off remains pending; no e2e spec, auth source, axe cap, or performance budget was changed to chase it.
- Status at that time: A2, A3, A5, A6, A6-M, and A9 are `VERIFIED` in-repo; A4-M remained `IN_PROGRESS` because the first-class `creativeDirection` artifact and Scenario B were open (superseded on 2026-11-27 below); A7 remained `IN_PROGRESS` pending full e2e sign-off; A10, D8, golden RTL human review, worker operations, R-01 rotation, pricing, and Lighthouse budgets were unchanged.
- Gate evidence was collected before the local commits on each worktree. The four canonical audit/spec/status/log documents were mirrored into both worktrees; no push, PR, merge, force-push, or `main` modification was made.

## 2026-11-27 — A4-M creative-direction closure (`fix/creative-vision-pipeline`)

- Backend: added optional first-class `creativeDirection` (`direction.v1`) inside `MotionProject` and per-scene `directionNotes`; legacy compositions remain valid without the new field. The model may supply only bounded rationale prose; the server owns palette values, typography profile/treatment, transitions, versions, `generatedBy`, and explicit `fallbackReason`.
- Deterministic style inference maps technical → `showcase`, educational → `educational`, and cinematic → `cinematic`. Visual identity, palette, typography, structure, animation language, transitions, layer entrances/emphasis, and scene notes differ materially; identical inputs/versions replay to the same `compositionHash`. `regenerateMotionScene` preserves the persisted plan.
- Frontend: added the read-only `CreativeDirectionPanel`, per-scene notes, explicit unavailable/fallback states, EN/AR catalog copy, and composition-query invalidation after generation and scene regeneration. Because `creativeDirection` is nested in `motionProject`, export includes it without a route change.
- Backend gates: targeted suites `6 files / 37 tests` passed; `npm run typecheck`, `pnpm lint` (0 errors, 685 baseline warnings), and `npm run build` passed. Full `pnpm test`: `83 files passed / 3 failed`, `900 passed / 11 failed / 25 skipped`; failures remain the known baseline (MongoMemoryServer startup, missing `winston-transport`, and `UNSPLASH_ACCESS_KEY` absent). No A4-M suite failed.
- Frontend gates: targeted suites `5 files / 23 tests`; `pnpm exec tsc --noEmit`, `pnpm check:i18n` (255 dynamic-key notes), `pnpm lint` (0 errors, 1 pre-existing warning), and `pnpm build` with bundle budget passed. Full `pnpm test:unit`: `149 files / 1001 tests` passed. `pnpm check:rtl` remains blocked by 17 pre-existing physical utilities in untouched admin files; no changed file is implicated.
- Owner gates unchanged: `ADS_AI_VOICE_ENABLED=false`, generated voice/Sound Mail still return `403 AI_VOICE_GATED`, and `ads.*` prices remain `0`. No price, D8 gate, axe cap, or performance budget changed.
- **Status:** A4-M `VERIFIED` in-repo, including Scenario B. A7 remains `IN_PROGRESS` pending full e2e sign-off; A10, D8, golden RTL human review, worker operations, R-01 rotation, pricing, and Lighthouse budgets are unchanged. No push, PR, merge, force-push, or `main` modification was made.

## 2026-11-27 — A7 full browser e2e sign-off (`c0c-fr` `fix/a7-e2e-signoff`)

- Created `fix/a7-e2e-signoff` from current frontend `origin/main` (`736938d`); the e2e harness ran the current backend `origin/main` (`178d8bc`) in `/tmp/opencode/c0c-bake-a7`. For this temporary harness only, `/tmp/opencode/c0c-bake` was symlinked to that detached worktree; the original `/tmp/opencode/c0c-bake-vision` checkout was not moved. The compiled backend was reused unchanged.
- Baseline full Playwright on current `main` was `24 passed / 6 failed`; a serial rerun reproduced all six. Browser console/trace evidence showed `console: Error` / `Error(void 0)` from `useTranslations` wrappers and `Something went wrong` page boundaries, with only 200/307 document responses. Root cause: A4-M added `useTranslations('common')` to `useWebSocket()` via `AppProviders`, but the auth, dashboard, and invite layouts mounted `AppProviders` outside `NextIntlClientProvider`.
- Fix: all three layouts now wrap `AppProviders` inside their intl provider. Auth and invite providers carry `common` alongside their narrow namespaces; the dashboard already passes the full catalog. No socket, hook, or advertisement source was changed.
- After the provider fix the full suite improved to `29 passed / 1 failed`, with `journey-4-quota-upgrade` failing at `quota was not exhausted within 60 attempts`. Instrumentation showed sixty `502` responses: the isolated backend worktree has no `.env`, so the real Alibaba client refused to dial the local fake-AI stub, and every call was correctly refunded. The webhook then also returned `503` because `isStripeConfigured()` requires both Stripe env vars.
- Fixes in the harness/spec only: inject non-live `ALIBABA_API_KEY` and `STRIPE_SECRET_KEY` into the E2E backend process (the local stub is the sole provider destination and the webhook handler performs no SDK call), and change `response.ok` to `response.ok()` in the quota journey so a provider failure fails loudly instead of being misreported as quota. No billing semantics, price, provider client, or webhook gate was relaxed.
- Validation: `pnpm exec tsc --noEmit`, targeted ESLint, and `git diff --check` clean. Targeted quota journey `1 passed`. One full run hit a transient proxy `ECONNRESET` in `journey-2-invite-accept`; the next full run passed `30 passed (3.2m)` (`/tmp/opencode/a7-full-e2e-final2.log`), including real 50-call starter quota exhaustion, signed Stripe webhook, and post-upgrade generation.
- The branch was rebased onto the then-current `origin/main` (`45f450f`, unrelated docs PR #74) before handoff. `pnpm exec tsc --noEmit`, targeted ESLint, `git diff --check`, and `API_URL=http://localhost:19531 pnpm exec next build` pass on the rebased tree; a fresh full Playwright run passed `30 passed (3.8m)` (`/tmp/opencode/a7-rebase-full-e2e.log`).
- **Status:** A7 `VERIFIED` in-repo with full browser e2e sign-off on current `main` plus this fix branch. A10, D8, golden RTL human review, worker operations, R-01 rotation, pricing, and Lighthouse budgets are unchanged.
