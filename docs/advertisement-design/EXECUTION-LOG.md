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
