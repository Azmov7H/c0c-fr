# Advertisement System — Implementation Status

> **Snapshot:** 2026-11-23
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

| Repo | Branch | Base before this work | Working-tree state at snapshot |
|---|---|---|---|
| `c0c-bake` | `feat/advertisement-system` | `2715110` (`docs(advertisement): publish the advertisement-design planning milestone`) | Advertisement module, tests, config, entitlements, storage seam, and status docs staged/committed on the feature branch; no merge performed. |
| `c0c-fr` | `feat/advertisement-system` | `661b22e` (`fix(ui): make dashboard sidebar RTL logical`) | Advertisement feature, routes, catalogs, workspace integration, tests, and status docs staged/committed on the feature branch; no merge performed. |

The design roadmap prescribed one branch per A-task. This implementation was explicitly consolidated into one feature branch per repository; no `main` branch was touched, no force-push was used, and no branch was deleted or merged.

## Status matrix

| Task | Status | Evidence / scope actually delivered |
|---|---|---|
| **A0 — Product Discovery & Architecture** | `VERIFIED` | The 17 planning documents, ADRs AD1–AD16, D1–D12 relation table, D7/D8 gates, refreshed dependency graph, and MVP cut line are present under `tasks/advertisement-design/`. Linkage is checked with `check-links`; the planning milestone remains the historical source of truth. |
| **A1 — Data Models & Backend Foundation** | `VERIFIED` | `advertisements.model.ts`, `advertisements.repository.ts`, `advertisements.validation.ts`, `advertisements.service.ts`, `advertisements.controller.ts`, `advertisements.routes.ts`, and `video.routes.ts`. Video state is a 1:1 child keyed by `projectId`, with a unique partial index on `isDeleted: false`; initialization restores a soft-deleted row. Ownership/authz uses existing `can()`/onboarding guards. Seven HTTP orchestration tests pass. |
| **A2 — Asset Management** | `COMPLETED` | Implemented against the refreshed direction: the pipeline consumes existing project images/audio instead of adding a second AI-image or vision pipeline. `storage.service.ts` was extended for advertisement upload/delivery/destroy seams. Live Cloudinary smoke is deferred to A10. |
| **A3 — AI Marketing Pipeline** | `COMPLETED` | `motion-director.ts` builds a typed composition from real project context through the existing synchronous AI provider path; deterministic fallback composition is used when the provider is unavailable or invalid. Scene regeneration and language/voice mutations are covered by the orchestration tests. No durable async motion-generation job was added. |
| **A3-L — Language & Content Consistency** | `VERIFIED` | `language.ts` derives `ar`/`en` from content with a confidence/ambiguity gate; UI locale is never inferred as content language. The confirmation gate uses `!languageConfirmed`, direction/typography are persisted, and Arabic/English preview contracts are asserted. Seven dedicated unit tests pass. |
| **A4 — Motion Engine** | `VERIFIED` | `motion.schema.ts` and `motion-engine.ts` provide typed MotionProject/MotionScene elements, keyframes, easing, z-order, transitions, and RTL/bidi composition. No AI HTML/CSS/JS is accepted. `compositionHash()` uses `stableStringify()`. One generated HTML document is shared by preview (`srcDoc`) and the worker (`window.__seek(t)`). Eleven schema/engine unit tests pass. |
| **A4-M — AI Motion Director & Composition Builder** | `VERIFIED` | Versioned `schemaVersion`/`presetLibraryVersion`/`promptVersion`/`seed`, preset allowlists, multiple elements per scene, meaning-grounded scene generation, and `generatedBy: 'ai' | 'fallback'` reporting are covered by the motion schema/engine suites. Unknown presets are rejected. |
| **A5 — Rendering Infrastructure** | `COMPLETED` | `render.service.ts` and `render.worker.ts` implement create/poll/cancel/retry, active-job idempotency, concurrency cap, quota reservation/refund latch (`quotaReserved`), stale-job sweep, progress/heartbeat, storage-503 handling, frame capture via Playwright/Chromium, FFmpeg encoding/muxing, poster generation, and MP4 upload. A real local worker contract test passes with Cloudinary uploads mocked; container/autoscale deployment remains an A10 gate. |
| **A6 — Audio Pipeline** | `COMPLETED` | Existing audio, uploaded narration, generated-narration handoff, and no-narration paths are implemented. `ffprobe` only probes allowlisted sources. Arabic TTS remains D8-gated: `ADS_AI_VOICE_ENABLED=false`, and the service returns `403 AI_VOICE_GATED` when the flag is off. Muxing is verified in the render worker contract; D8 live verification is an A10 gate. |
| **A6-S — Audio Analysis & Synchronization Engine** | `VERIFIED` | `audio-analysis.ts` probes duration, segments Arabic/Latin narration without reversing characters, maps cumulative boundaries to scenes, keeps `wordTimestamps: null`-safe, computes drift, and refits composition durations only on count matches. Six dedicated unit tests pass. |
| **A7 — Advertisement Editor / Project Workflow** | `COMPLETED` | The refreshed project-first workflow is implemented: role-gated **Generate Video** in `workspace-header.tsx`, lazy `video` workspace tab, `/advertisements` list and `[id]` detail routes, language gate, composition/audio/voice/render panels, `VideoPipeline`, bilingual catalogs (`advertisements.json` in `en`/`ar`), nav entry, protected `/advertisements` prefix, gate-error and upgrade states. Component/hook/service tests, i18n parity, RTL gate, link gate, typecheck, and production build pass. Full browser e2e is deferred to A10. |
| **A8 — Subscription & Credits (D7 integration)** | `COMPLETED` | `ads.access`, `ads.upload`, `ads.voice.upload`, `ads.download`, `ads.render`, and `ads.styles.advanced` are wired into existing entitlements. `ads.render` quotas are 3/20/100 by plan and are reserved/refunded through the existing quota infrastructure; no parallel ledger exists. `ads.*` credit operations are priced at `0` pending Cost Analysis, so this is quota-shaped MVP gating, not a paid launch. |
| **A9 — Storage & Export** | `COMPLETED` | Upload, signed delivery (5–15 min TTL), download URL construction, poster/video upload, and destroy/cleanup seams exist in `storage.service.ts` and the render service. Owner/foreign/expired delivery is enforced through the authoritative backend routes. Live Cloudinary upload/delivery/destroy smoke is deferred to A10. |
| **A10 — QA & Production Readiness** | `BLOCKED` | In-repo gates pass, but release gates remain external: D8 Arabic TTS live verification, Cloudinary live smoke, live Cloudinary-backed MP4 render/probe, worker container/autoscale deployment, golden RTL frame review, full e2e/Lighthouse, SLO dashboards/runbooks, and pricing/cost sign-off. Existing CI baseline failures are documented below and were not introduced by this change. |

## Validation evidence

### Backend (`c0c-bake`)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Clean. |
| `npx vitest run tests/unit/advertisements-language.test.ts tests/unit/advertisements-motion-schema.test.ts tests/unit/advertisements-audio-analysis.test.ts tests/unit/advertisements-motion-engine.test.ts tests/advertisements/video-orchestration.http.test.ts tests/advertisements/render-worker.contract.test.ts` | 6 files, 32 tests passed. |
| `npx eslint src/modules/advertisements tests/advertisements tests/unit/advertisements-*.test.ts` | 0 errors, 27 warnings. |
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

## Bugs found and fixed during validation

- `compositionHash()` now uses `stableStringify()` so semantically identical compositions do not churn render invalidation.
- Language confirmation gate was inverted; it now blocks on `!languageConfirmed`.
- Cancel response now reflects `quotaReserved: false` after refund.
- Render-job unique index now uses `partialFilterExpression`.
- Frontend regression floors were updated for the `advertisements` nav item and `video` workspace tab.
- Frontend lint/RTL issues were fixed (semantic warning token, unused import, documented Cloudinary poster `<img>` exception).
- Frontend service tests were corrected to the real `apiClient` envelope shape (`{ data: envelope }`) and the real preview sandbox contract (`allow-scripts` accepted; widened values rejected to `''`).
- Render worker lint warnings were addressed.

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

## Blocked external gates and required next action

| Gate | Current evidence | Next action |
|---|---|---|
| D8 Arabic TTS live verification | Flag off; `403 AI_VOICE_GATED`; no live provider report. | Run the D8 live-smoke script with real credentials and paste the signed report before enabling Arabic AI voice or a voice picker. |
| Cloudinary live smoke | Storage seam and worker uploads are mocked in tests. | Run upload + signed delivery + destroy with staging credentials and record public IDs/TTLs. |
| Live Cloudinary-backed MP4 render | Real Playwright/Chromium + FFmpeg contract passes with uploads mocked. | Render a 30 s 16:9 720p/1080p job, probe the MP4, verify the poster, and confirm signed delivery. |
| Worker deployment / SLOs / runbooks | Worker source and lifecycle exist; container/autoscale/dashboards are outside this repo change. | Deploy the digest-pinned, non-root worker; rehearse scale-to-zero rollback and add render p50/p95/failure-rate dashboards. |
| Full e2e and Lighthouse | Unit/component/build gates pass; browser e2e and Lighthouse were not run. | Run the project's Playwright journey and Lighthouse CI gates on a deployed stack. |
| Pricing / cost sign-off | `ads.*` prices are `0`; quotas are live. | Complete Cost Analysis and set prices before enabling paid operations. |
| Existing CI baseline | Gitleaks history, `pnpm audit` mongoose advisories, MongoMemoryServer provider failures, and Workers Builds failures predate this work. | Track separately; do not attribute them to the advertisement feature. |

## Debt

- No durable async motion-generation queue; generation is synchronous with deterministic fallback.
- No in-repo worker container image, autoscale policy, or SLO dashboard.
- No live Cloudinary, D8 TTS, full e2e, Lighthouse, or cost sign-off evidence.
- Historical design docs still describe a standalone wizard and AI-image/vision pipeline; the refreshed direction sections and this status file supersede them where they conflict.
- Full backend lint has a large baseline warning count; targeted advertisement lint is 0 errors with 27 warnings.

## Deployment readiness

**Not release-ready.** The feature branch is code-complete for the refreshed MVP and all local automated gates pass, but A10 remains `BLOCKED` on the external gates above. The safe next release step is to open/update the two PRs, then complete the external gate checklist before enabling paid or AI-voice paths.
