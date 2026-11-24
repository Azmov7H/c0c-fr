# Advertisement System — Implementation Status

> **Snapshot:** 2026-11-24
> **Scope:** Advertisement System, refreshed Motion Graphics direction (A0–A10 plus A3-L, A4-M, A6-S).
> **Canonical location:** `tasks/advertisement-design/IMPLEMENTATION-STATUS.md`. Versioned copies live in `c0c-bake/docs/advertisement-design/` and `c0c-fr/docs/advertisement-design/`.

## Status legend

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No implementation exists for the card. |
| `IN_PROGRESS` | Code exists but an in-repo acceptance criterion is still open. |
| `BLOCKED` | In-repo work is done, but an external gate prevents release verification. |
| `COMPLETED` | In-repo deliverables are implemented and reviewed against the card. |
| `VERIFIED` | `COMPLETED` plus automated evidence in this snapshot. |

## Branch and repository state

| Repo | Branch | Base before this work | State at snapshot |
|---|---|---|---|
| `c0c-bake` | `feat/advertisement-system` | `2715110` (`docs(advertisement): publish the advertisement-design planning milestone`) | Head `baf0bfe2754cfee906fa0f0ffb40e80138e13251`. PR #30 was created and merged externally into `origin/main` at `70d5873f43c93a200d183c6c737aad92a5ec3fb1`; this session did not merge or modify `main`. |
| `c0c-bake` | `fix/cloudinary-image-mime` | `origin/main` (`70d5873f43c93a200d183c6c737aad92a5ec3fb1`) | Live-smoke fix committed as `9a8b23d` with a follow-up docs refresh, both pushed to `origin/fix/cloudinary-image-mime`. Current head is tracked in `PR-HANDOFF.md`. No PR was created here because `gh`/`GITHUB_TOKEN` are unavailable. |
| `c0c-fr` | `feat/advertisement-system` | `661b22e` (`fix(ui): make dashboard sidebar RTL logical`) | Feature work and a follow-up docs refresh are pushed to `origin/feat/advertisement-system`. Current head is tracked in `PR-HANDOFF.md`. No PR exists yet. |

The design roadmap prescribed one branch per A-task. This implementation was explicitly consolidated into one feature branch per repository. No force-push, branch deletion, or assistant-performed merge occurred.

## Status matrix

| Task | Status | Evidence / scope actually delivered |
|---|---|---|
| **A0 — Product Discovery & Architecture** | `VERIFIED` | The 17 planning documents, ADRs AD1–AD16, D1–D12 relation table, D7/D8 gates, refreshed dependency graph, and MVP cut line are present under `tasks/advertisement-design/`. Linkage is checked with `check-links`; the planning milestone remains the historical source of truth. |
| **A1 — Data Models & Backend Foundation** | `VERIFIED` | `advertisements.model.ts`, `advertisements.repository.ts`, `advertisements.validation.ts`, `advertisements.service.ts`, `advertisements.controller.ts`, `advertisements.routes.ts`, and `video.routes.ts`. Video state is a 1:1 child keyed by `projectId`, with a unique partial index on `isDeleted: false`; initialization restores a soft-deleted row. Ownership/authz uses existing `can()`/onboarding guards. Seven HTTP orchestration tests pass. |
| **A2 — Asset Management** | `VERIFIED` | Implemented against the refreshed direction: the pipeline consumes existing project images/audio instead of adding a second AI-image or vision pipeline. `storage.service.ts` provides advertisement upload/delivery/destroy seams. A live Cloudinary smoke passed for image, video, poster, signed upload, delivery, and invalidated deletion; a regression test locks the MIME and invalidation contracts. |
| **A3 — AI Marketing Pipeline** | `COMPLETED` | `motion-director.ts` builds a typed composition from real project context through the existing synchronous AI provider path; deterministic fallback composition is used when the provider is unavailable or invalid. Scene regeneration and language/voice mutations are covered by the orchestration tests. No durable async motion-generation job was added. |
| **A3-L — Language & Content Consistency** | `VERIFIED` | `language.ts` derives `ar`/`en` from content with a confidence/ambiguity gate; UI locale is never inferred as content language. The confirmation gate uses `!languageConfirmed`, direction/typography are persisted, and Arabic/English preview contracts are asserted. Seven dedicated unit tests pass. |
| **A4 — Motion Engine** | `VERIFIED` | `motion.schema.ts` and `motion-engine.ts` provide typed MotionProject/MotionScene elements, keyframes, easing, z-order, transitions, and RTL/bidi composition. No AI HTML/CSS/JS is accepted. `compositionHash()` uses `stableStringify()`. One generated HTML document is shared by preview (`srcDoc`) and the worker (`window.__seek(t)`). Eleven schema/engine unit tests pass. |
| **A4-M — AI Motion Director & Composition Builder** | `VERIFIED` | Versioned `schemaVersion`/`presetLibraryVersion`/`promptVersion`/`seed`, preset allowlists, multiple elements per scene, meaning-grounded scene generation, and `generatedBy: 'ai' | 'fallback'` reporting are covered by the motion schema/engine suites. Unknown presets are rejected. |
| **A5 — Rendering Infrastructure** | `COMPLETED` | `render.service.ts` and `render.worker.ts` implement create/poll/cancel/retry, active-job idempotency, concurrency cap, quota reservation/refund latch (`quotaReserved`), stale-job sweep, progress/heartbeat, storage-503 handling, frame capture via Playwright/Chromium, FFmpeg encoding/muxing, poster generation, and MP4 upload. A full 30 s Arabic RTL 720 p live render passed with real Chromium, FFmpeg, and Cloudinary; container/autoscale deployment remains an A10 gate. |
| **A6 — Audio Pipeline** | `COMPLETED` | Existing audio, uploaded narration, generated-narration handoff, and no-narration paths are implemented. `ffprobe` only probes allowlisted sources. Arabic TTS remains D8-gated: `ADS_AI_VOICE_ENABLED=false`, and the service returns `403 AI_VOICE_GATED` when the flag is off. Muxing is verified in the render worker contract. Extended D8 evidence now covers an Arabic hint, a dedicated Arabic voice, the 1500-character cap, official voice/pricing docs, and token usage; no voice picker or SSML/timestamp option was added. |
| **A6-S — Audio Analysis & Synchronization Engine** | `VERIFIED` | `audio-analysis.ts` probes duration, segments Arabic/Latin narration without reversing characters, maps cumulative boundaries to scenes, keeps `wordTimestamps: null`-safe, computes drift, and refits composition durations only on count matches. Six dedicated unit tests pass. |
| **A7 — Advertisement Editor / Project Workflow** | `COMPLETED` | The refreshed project-first workflow is implemented: role-gated **Generate Video** in `workspace-header.tsx`, lazy `video` workspace tab, `/advertisements` list and `[id]` detail routes, language gate, composition/audio/voice/render panels, `VideoPipeline`, bilingual catalogs (`advertisements.json` in `en`/`ar`), nav entry, protected `/advertisements` prefix, gate-error and upgrade states. Component/hook/service tests, i18n parity, RTL gate, link gate, typecheck, and production build pass. Full browser e2e is deferred to A10. |
| **A8 — Subscription & Credits (D7 integration)** | `COMPLETED` | `ads.access`, `ads.upload`, `ads.voice.upload`, `ads.download`, `ads.render`, and `ads.styles.advanced` are wired into existing entitlements. `ads.render` quotas are 3/20/100 by plan and are reserved/refunded through the existing quota infrastructure; no parallel ledger exists. `ads.*` credit operations are priced at `0` pending Cost Analysis, so this is quota-shaped MVP gating, not a paid launch. |
| **A9 — Storage & Export** | `VERIFIED` | Upload, signed delivery (5–15 min TTL), download URL construction, poster/video upload, and destroy/cleanup seams exist in `storage.service.ts` and the render service. Owner/foreign/expired delivery is enforced through the authoritative backend routes. Live Cloudinary upload/delivery/invalidation passed; warm-cache deletion propagated in ~5–7 s. |
| **A10 — QA & Production Readiness** | `BLOCKED` | In-repo gates pass. Cloudinary live smoke, a full 30 s live render, and extended D8 evidence now exist. Playwright and Lighthouse were run and triaged; no advertisement-attributable regression was found, but stale journey specs, accepted axe debt, an invalid LHCI audit key, and pre-existing performance budgets still block the gates. Release still requires human golden RTL frame sign-off, a signed D8 decision, worker deployment/SLOs/runbooks, R-01 key rotation, and pricing/cost sign-off. Existing CI baseline failures are documented below and were not introduced by this change. |

## Validation evidence

### Backend (`c0c-bake`)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Clean. |
| `npx vitest run tests/unit/storage-mime.test.ts tests/unit/advertisements-language.test.ts tests/unit/advertisements-motion-schema.test.ts tests/unit/advertisements-audio-analysis.test.ts tests/unit/advertisements-motion-engine.test.ts tests/advertisements/video-orchestration.http.test.ts tests/advertisements/render-worker.contract.test.ts` | 7 files, 35 tests passed (includes the new storage MIME/invalidation regression suite). |
| `npx eslint src/modules/advertisements tests/advertisements tests/unit/advertisements-*.test.ts` | 0 errors, 27 warnings. |
| `npx eslint src/shared/services/storage.service.ts tests/unit/storage-mime.test.ts` | 0 errors, 0 warnings. |
| `npm run lint` | 0 errors, 742 warnings (baseline-heavy repository lint). |
| `npm run build` | Passed. |
| `npx vitest run` | 758 tests passed, 5 skipped. Two pre-existing MongoMemoryServer suites fail (`tests/storage/storage.test.ts`, `tests/trends/trends.perf.test.ts`) with `Instance failed to start within 10000ms` / `Cannot read properties of undefined (reading 'stop')`. No advertisement suite failed. |

### Frontend (`c0c-fr`)

| Command | Result |
|---|---|
| `pnpm exec tsc --noEmit` | Clean. |
| `pnpm exec vitest run src/features/advertisements src/lib/navigation-copy.test.ts src/features/projects/workspace-copy.test.ts` | 6 files, 29 tests passed. |
| `pnpm test:unit` | 138 files, 953 tests passed. |
| `pnpm lint` | 0 errors, 1 pre-existing warning in `scripts/check-rtl.mjs`. |
| `pnpm check:i18n` | Parity and usage gates pass; `items.advertisements` is declared dynamic as required. |
| `pnpm check:rtl` | Passed — 20 physical utilities, all allowlisted. |
| `pnpm check:links` | Passed — 72 internal links resolve against 44 route patterns. |
| `pnpm build` | Next build and bundle budget passed; `/[locale]/advertisements` and `/[locale]/advertisements/[id]` are present in the route table. |

### Live external evidence (2026-11-24)

| Gate | Evidence |
|---|---|
| Cloudinary storage smoke | Passed with unique public IDs and cleanup. Image/poster/video uploads returned `200` (`image/png`, `video/mp4;codecs=avc1`), signed upload generated, and `destroy({ invalidate: true })` returned `404` for all three URLs after CDN propagation (~5–7 s). Root cause found: Cloudinary rejects a wildcard `image/*` data-URI MIME; `application/octet-stream` lets it sniff the real format from the bytes. No credentials or signed URLs were printed. |
| Live Cloudinary-backed render | Passed for the full 30 s Arabic RTL 16:9 720 p acceptance duration using real Chromium, FFmpeg, and Cloudinary. Job `completed`, progress `100`, H.264 `1280x720`, probed duration `30 s`, MP4 and poster delivery `200`, cleanup `404`. |
| Golden RTL frame capture | Captured frames at 1 s, 15 s, and 29 s from the 30 s MP4. All three are 1280×720 with stable bright-pixel content in the headline region; the Arabic text bounding box stays on the right side of the composition (x 939–1148 within the expected x 128–1152 headline area), consistent with RTL anchoring. Mechanical checks passed; human visual sign-off is still pending. |
| D8 TTS partial evidence | Configured model `qwen-audio-3.1-tts-flash`, voice `longanhuan_v3.1`, MP3/24 kHz. `ar`: 2487 ms latency, 3.648 s duration, −19 dB mean volume. `en`: 2305 ms latency, 3.168 s duration, −19.8 dB mean volume. `expiresAt: 1795567351`. This proves short Arabic/English text returns non-silent audio; it does not prove Arabic voice/language correctness, roster, gender/dialect, pricing, text-length behavior, or the D8 decision. |
| D8 TTS extended evidence | `language_hints: ["ar"]` with `longanhuan_v3.1` succeeded (2641 ms, 3.264 s, 12/40 tokens); dedicated `qwen-audio-3.1-tts-flash-naseem_ar` succeeded (1040 ms, 5.328 s, 12/66 tokens); the exact 1500-character app cap succeeded (23451 ms, 252.624 s, 415/3157 tokens). Official docs confirm `ar` as a valid hint, female/male voice genders, SSML/timestamp support, the endpoint/model fit, and token prices. Recorded in `D8-EVIDENCE-2026-11-24.md`; D8 remains undecided and no new options shipped. |

### Browser e2e and Lighthouse triage (2026-11-24)

| Gate | Evidence |
|---|---|
| Full Playwright e2e | Two full runs produced `25 passed / 5 failed` and `24 passed / 6 failed`; a targeted RTL rerun produced `12 passed / 2 failed`. Failures are stale 3-step-wizard journeys (`journey-2-invite-accept`, `journey-3-viewer-denied`, `m2-workspace`), the accepted `label-content-name-mismatch` axe debt, and an intermittent `/settings` `color-contrast` violation. No advertisement route, component, or navigation entry was implicated. `git diff 661b22e..HEAD -- tests/e2e playwright.config.ts package.json` is empty: the shipped wizard has had four steps since `d05787b`, while those specs still drive three. |
| E2E experiment | Spec-only wizard updates were attempted and reverted. They exposed deeper unrelated baseline failures: invite-preview SSR error digest `263232933` while waiting for `Create an account`, and `m2-workspace` expecting a `Scripts` heading where the UI renders it as text. No e2e spec or advertisement source was left changed by the experiment. |
| Accepted axe debt | `rtl-a11y.spec.ts` caps `label-content-name-mismatch` at 4 nodes. `/projects` was observed with 6 nodes on target `#radix-_r_4_` (sidebar Account menu button with visible initials `JO`); a debug run observed 2 nodes, so the count fluctuates. The Advertisements nav link is not among the offending targets. |
| Lighthouse CI | Ran with Playwright Chromium via `CHROME_PATH=... LHCI_RUNS=1 pnpm lhci`. Collected `/en`, `/en/dashboard`, `/en/projects`, `/en/login`: LCP `5.343 / 3.260 / 5.160 / 6.556 s`, TBT `2917 / 5470 / 3829 / 5945 ms`, CLS `0`, accessibility `1 / 1 / 1 / 0.96`, performance `0.47 / 0.54 / 0.44 / 0.42`. LHCI also reports `"accessibility" is not a known audit` on every route. |
| Lighthouse baseline | `lighthouserc.cjs` is unchanged from the pre-advertisement branch. Historical reports already exceed the same budgets (`2026-11-13`: landing LCP `4.477 s`/TBT `1797 ms`, dashboard `2.065 s`/`6264 ms`, projects `4.278 s`/`7799 ms`, login `6.423 s`/`2914 ms`; October/November TBT range `1004–12561 ms`). No advertisement source change was made for these gates. |

## Bugs found and fixed during validation

- `compositionHash()` now uses `stableStringify()` so semantically identical compositions do not churn render invalidation.
- Language confirmation gate was inverted; it now blocks on `!languageConfirmed`.
- Cancel response now reflects `quotaReserved: false` after refund.
- Render-job unique index now uses `partialFilterExpression`.
- Frontend regression floors were updated for the `advertisements` nav item and `video` workspace tab.
- Frontend lint/RTL issues were fixed (semantic warning token, unused import, documented Cloudinary poster `<img>` exception).
- Frontend service tests were corrected to the real `apiClient` envelope shape (`{ data: envelope }`) and the real preview sandbox contract (`allow-scripts` accepted; widened values rejected to `''`).
- Render worker lint warnings were addressed.
- Cloudinary image data URIs now use `application/octet-stream`; the previous `image/*` MIME was rejected by the live provider.
- `storageService.destroy()` now passes `invalidate: true`; warm CDN assets otherwise stayed downloadable for several seconds after deletion.
- `signUpload()` narrows the configured API secret with an explicit guard instead of an unsafe assertion.

## Decisions and intentional deviations

1. Current repository code is authoritative where the historical design docs are stale.
2. D7 credit/quota infrastructure is reused; no parallel advertisement ledger was created.
3. Advertisement video state is a 1:1 child keyed by `projectId` with a unique partial index on `isDeleted: false`; initialization restores soft-deleted rows.
4. Rendering input is a typed `MotionProject`/`MotionScene`; there is no AI-generated HTML/CSS/JS render contract.
5. Preview iframe uses `sandbox="allow-scripts"` only, without `allow-same-origin`; hostile server values are rejected to `''`.
6. AI motion generation uses the existing synchronous provider path, returns `200` with the composition, has a deterministic fallback, and reports `generatedBy`.
7. No durable async motion-generation job was added in this iteration.
8. AI voice-over remains D8-gated (`ADS_AI_VOICE_ENABLED=false`).
9. MVP is 16:9, 30 FPS, 720p/1080p by plan, Cloudinary delivery, and quota-shaped `ads.render` gating.
10. `ads.*` credit operations are priced `0` pending Cost Analysis.
11. Backend `/api/v1/advertisements/*` and `/api/v1/projects/:projectId/video/*` are authoritative; frontend paths omit `/api/v1` because Next rewrites.
12. Advertisements were added to the existing five-group navigation under `Content Engine`, and `/advertisements` was added to `proxy.ts` protected prefixes.
13. The Generate Video action lives in the project workspace header; the top-level `/advertisements` list/detail remains the history surface.
14. Top-level detail and workspace Video tab share `VideoPipeline`; project role is derived from `useProjectMembers` + `useAuthStore` + `can(role, 'edit')`.
15. The live render smoke uses the full 30 s acceptance duration; golden RTL frames are captured mechanically but still require human visual sign-off.
16. D8 evidence gathering is recorded separately in `D8-EVIDENCE-2026-11-24.md`; the audited D8 verdict is preserved and no language/gender/dialect/SSML option was added before a signed decision.
17. Playwright and Lighthouse failures are classified as stale-test/accepted-debt/performance-debt issues, not advertisement regressions. Spec-only fix attempts were reverted; no advertisement source was changed to chase baseline failures.

## External gates and required next action

| Gate | Status | Current evidence | Next action |
|---|---|---|---|
| Cloudinary live smoke | `PASSED` | Live upload, signed upload, delivery, and invalidated deletion; regression test `tests/unit/storage-mime.test.ts`. | Merge `origin/fix/cloudinary-image-mime` and include it in the release branch. |
| D8 TTS decision | `BLOCKED` | Extended live and official-document evidence is recorded in `D8-EVIDENCE-2026-11-24.md`; `ADS_AI_VOICE_ENABLED` remains false. | Obtain owner listening/feature-fit approval, Arabic dialect/locale policy, cost sign-off, and a signed D8 decision before enabling AI voice or a voice picker. |
| Full 30 s MP4 render | `PASSED` | 30 s Arabic RTL 720 p render passed with real Chromium, FFmpeg, and Cloudinary; H.264 1280×720, duration 30 s, MP4/poster `200`, cleanup `404`. | No further 720 p render needed; optionally repeat at 1080 p before launch if the release matrix requires it. |
| Golden RTL frame review | `PARTIAL` | Frames captured at 1 s/15 s/29 s with stable RTL-anchored Arabic text; mechanical checks pass. | Obtain human visual approval of the captured frames at pinned font/preset versions. |
| Worker deployment / SLOs / runbooks | `BLOCKED` | Worker source and lifecycle exist; container/autoscale/dashboards are outside this repo change. | Deploy the digest-pinned, non-root worker; rehearse scale-to-zero rollback and add render p50/p95/failure-rate dashboards. |
| R-01 key rotation | `BLOCKED` | Legacy xAI/HF keys remain in git history; human rotation is outstanding. | Rotate at the providers and confirm gitleaks remains green. |
| Full e2e and Lighthouse | `BLOCKED` | Playwright and Lighthouse were run and triaged: two full e2e runs had 5 and 6 failures, a targeted RTL rerun had 2, and Lighthouse fails on an invalid config key plus pre-existing LCP/TBT budgets. No advertisement-attributable failure was found; evidence is in the browser-e2e/Lighthouse triage section above. | Update the stale wizard specs, resolve the accepted axe debt and configuration key, and retire the existing LCP/TBT performance debt. Rerun only after those source/config changes. |
| Pricing / cost sign-off | `BLOCKED` | `ads.*` prices are `0`; quotas are live. | Complete Cost Analysis and set prices before enabling paid operations. |
| Existing CI baseline | `BASELINE` | Gitleaks history, `pnpm audit` mongoose advisories, MongoMemoryServer provider failures, and Workers Builds failures predate this work. | Track separately; do not attribute them to the advertisement feature. |

## Debt

- No durable async motion-generation queue; generation is synchronous with deterministic fallback.
- No in-repo worker container image, autoscale policy, or SLO dashboard.
- Cloudinary live smoke, a full 30 s live render, and extended D8 evidence exist; human golden RTL review, signed D8 decision, cost sign-off, and R-01 rotation remain open. Full e2e and Lighthouse were run but remain blocked by stale specs, accepted axe debt, an invalid LHCI audit key, and pre-existing performance budgets.
- The backend Cloudinary fix branch has been pushed but has no PR yet; the frontend feature branch also has no PR yet.
- Historical design docs still describe a standalone wizard and AI-image/vision pipeline; the refreshed direction sections and this status file supersede them where they conflict.
- Full backend lint has a large baseline warning count; targeted advertisement lint is 0 errors with 27 warnings.

## Deployment readiness

**Not release-ready.** The refreshed MVP is code-complete and all local automated gates pass. Cloudinary live storage, a full 30 s live render, and extended D8 evidence are verified, but A10 remains `BLOCKED` on human golden RTL sign-off, a signed D8 decision, worker operations, R-01 rotation, stale e2e/axe/Lighthouse debt, and cost sign-off. The safe next release step is to open the frontend PR and the backend fix PR, then complete the external gate checklist before enabling paid or AI-voice paths.
