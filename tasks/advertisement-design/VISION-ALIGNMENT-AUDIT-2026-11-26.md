# Vision Alignment Audit — Creative Generation Pipeline

> **Date:** 2026-11-26  
> **Canonical location:** `tasks/advertisement-design/VISION-ALIGNMENT-AUDIT-2026-11-26.md`  
> **Status vocabulary:** `NOT_STARTED / IN_PROGRESS / BLOCKED / COMPLETED / VERIFIED`  
> **Method:** read-only audit of planning, status/log/handoff records, backend code, frontend code, and tests. No application source was changed before this report.

## 0. Executive verdict

The repository contains a real, substantial implementation of the refreshed **Generate Video** direction: project-first entry, content-language gate, typed `MotionProject`/`MotionScene` composition, deterministic renderer, durable render jobs, real Chromium/FFmpeg worker, Cloudinary delivery, and 30 s Arabic RTL renders at 720p and 1080p. That work is not a fake or placeholder.

However, the product is **not aligned with the original creative-production vision**:

1. The generated-resource chain is incomplete. The video consumes script, selected images, voice, and audio analysis, but **not music/SFX bytes or SEO content**, and the general export manifest knows nothing about advertisement video artifacts.
2. **Sound effects are metadata-only**; no provider supplies audio bytes, so they cannot be played, muxed, or exported as sound.
3. **Generic TTS persists an expiring provider URL** instead of ingesting bytes into durable storage; the durable ADS voice path exists but is D8-gated and has no player in the UI.
4. **Frontend lifecycle handling is incomplete**: async script jobs are unsupported, audio suggestions are under-rendered, play buttons are inert, SEO/preview errors are swallowed, and realtime completions do not invalidate open views.
5. **Creative direction is implemented as a typed motion composition**, but the explicit plan fields (visual identity, color system, transition rationale, narration/visual relationship, SFX placement, final composition instructions) are not exposed or verified as a distinct scene plan (resolved 2026-11-27; see §9).
6. **“Sound Mail” does not exist in the planning record or code.** It is not a synonym used by the project. Treating it as already implemented would be dishonest.

Audit status: the previously `COMPLETED`/`VERIFIED` cards **A3, A6, A7, and A9 are re-opened as `IN_PROGRESS`** because concrete in-repo acceptance gaps were found. A10 remains `BLOCKED`.

> **Post-audit update (2026-11-27):** A4-M is now `VERIFIED` in-repo, including Scenario B. Current task statuses are authoritative in [`IMPLEMENTATION-STATUS.md`](IMPLEMENTATION-STATUS.md); the table in §2.1 remains the 2026-11-26 audit snapshot. A4-M's resolution and evidence are recorded in §9.

---

## 1. Existing planning reviewed

Canonical documents and records inspected:

- `tasks/advertisement-design/README.md` — direction refresh, state ledger.
- `tasks/advertisement-design/01-PRODUCT-REQUIREMENTS.md` — FR-1–FR-9, AC-1–AC-9, FR-G/V/M/L, AC-G/V/M/L, MVP gate.
- `tasks/advertisement-design/02-USER-FLOWS.md` — F-0, F-V.
- `tasks/advertisement-design/03-ARCHITECTURE.md` — component/data flow.
- `tasks/advertisement-design/04-AI-PIPELINE.md` — Motion Director steps A–E.
- `tasks/advertisement-design/05-MOTION-RENDERING.md` — typed renderer, worker, golden frames.
- `tasks/advertisement-design/06-AUDIO-PIPELINE.md` — voice sources, FFmpeg mix, sync, licensing, Audio Analysis.
- `tasks/advertisement-design/07-DATABASE-AND-API.md` — models and API contracts.
- `tasks/advertisement-design/08-PLANS-CREDITS-AND-PERMISSIONS.md`, `11-COST-AND-PERFORMANCE.md`.
- `tasks/advertisement-design/09-STORAGE-AND-MEDIA.md` — Cloudinary layout and delivery.
- `tasks/advertisement-design/10-SECURITY-AND-RELIABILITY.md`, `12-TESTING-STRATEGY.md`.
- `tasks/advertisement-design/13-IMPLEMENTATION-ROADMAP.md` — A0–A10, A3-L, A4-M, A6-S.
- `tasks/advertisement-design/DECISIONS.md` — AD1–AD17, OQ-1–OQ-12.
- `tasks/advertisement-design/D8-EVIDENCE-2026-11-24.md`.
- `tasks/advertisement-design/IMPLEMENTATION-STATUS.md`, `EXECUTION-LOG.md`, `PR-HANDOFF.md`.
- `tasks/advertisement-design/AUDIT-REPORT.md`.
- `tasks/COST-ANALYSIS.md`.
- `tasks/milestone-3/P04-STATUS.md`, `P05-STATUS.md`, `P06-STATUS.md`, `P07-STATUS.md`, `P08-STATUS.md`, `P09-STATUS.md`, `P11-STATUS.md`, `P12-STATUS.md`, `TASK-TRACKER.md`, `FINAL-REPORT.md`.
- `tasks/localization/SEO-REQUIREMENTS.md`, `AR25-STATUS.md`, `AR34-STATUS.md`.
- `tasks/tasks/T11-landing-page.md`, `tasks/00-audit/BACKEND-AUDIT.md`, `video-project/README.md`.

Terminology preserved from those documents: `تصميم إعلان`, **Generate Video**, **AI Motion Director / Video Director**, `MotionProject`, `MotionScene`, `MotionElement`, `Script.sections[]`, `AudioAnalysis`, `timingPrecision`, `voiceover | music | sfx`, `ads.*`, `403 AI_VOICE_GATED`, `402 PRICING_PENDING`, `ADS_AI_VOICE_ENABLED`, `ADS_PAID_ENABLED`, and task IDs A0–A10, A3-L, A4-M, A6-S, P04–P12, D7, D8.

### 1.1 “Sound Mail” finding

No occurrence of `sound mail`, `soundmail`, `voicemail`, or `رسالة صوتية` exists in planning, status, backend, frontend, or tests. The closest documented concepts are:

- **Sound Effects** as one of the “four assets” in `T11-landing-page.md`.
- **Music/SFX layers** in `P06-STATUS.md`, explicitly described as metadata rows because no provider supplies bytes.
- **Narration / voice-over / TTS** in `06-AUDIO-PIPELINE.md` and D8 evidence.

This audit therefore does **not** pretend Sound Mail already existed. `Q-SM-01` was resolved by the owner on 2026-11-26 as a **project audio message** and traced as new task `A6-M` in [`14-SOUND-MAIL.md`](14-SOUND-MAIL.md).

---

## 2. Task-to-implementation gap analysis

### 2.1 Advertisement roadmap A-tasks

| Task | Original intended behavior | Current implementation | Actual problems | Root cause | Required correction | Verification criteria | Audit status |
|---|---|---|---|---|---|---|---|
| **A0** Product Discovery & Architecture | Evidence-based blueprint; D7/D8 explicit; MVP split. | 17 planning docs, AD1–AD16, D relation table, refresh sections. | Historical standalone-wizard sections conflict with refreshed project-first sections; docs already declare refresh authoritative. | Deliberate planning supersession. | Do not rewrite history; keep refreshed sections authoritative. | Link/check gates pass; status file records precedence. | `VERIFIED` |
| **A1** Data Models & Backend Foundation | 1:1 `AdvertisementProject` + render job, ownership, soft delete, language/motion/audio fields. | Models, repository, routes, validation, service, controller implemented; unique partial index on `projectId` where `isDeleted: false`. | No material implementation gap found in this audit. | — | Preserve. | HTTP orchestration tests; foreign 404; idempotent initialize. | `VERIFIED` |
| **A2** Asset Management | Existing project assets/≤4 images, storage seams, provenance, honest fallback. | Consumes existing project images; Cloudinary upload/delivery/destroy; live smoke passed; no second AI-image pipeline. | Local audio file replacement uses browser `blob:` URL, which backend validation rejects. Music/SFX still have no bytes. | Upload seam missing on frontend; no SFX byte provider. | Add real file upload path for audio layers; document SFX-byte provider constraint. | Replacement persists an https storage URL; refresh keeps player working. | `IN_PROGRESS` |
| **A3** AI Marketing Pipeline | Structured director + script; schema validation; per-scene regen; no generic script. | `motion-director.ts` builds typed composition from real project context; `resolveScript` consumes latest `Script.sections[]`; scene regen exists. | AI errors silently become deterministic fallback composition; explicit creative-direction plan fields are not surfaced; async script lifecycle mismatch. | Fallback-first error handling; composition prompt/schema narrower than plan; frontend assumes synchronous script response. | Enrich director plan/prompt with explicit creative direction; expose it in composition detail; align frontend with `202 {jobId}` contract. | 3 distinct projects yield distinct plans; malformed AI output surfaces `AI_INVALID_RESPONSE` or explicit fallback reason; async job poll works. | `IN_PROGRESS` |
| **A3-L** Language & Content Consistency | Content-derived `ar`/`en`, confirmation gate, RTL/LTR consistency, mismatch blocks render. | `language.ts`, confirmation gate, typography/direction persistence, tests. | No material gap found; D8 voice correctness remains external. | D8 undecided. | Preserve. | Existing 7 unit tests; mismatch render refusal. | `VERIFIED` |
| **A4** Motion Engine | Deterministic typed renderer shared by preview and worker. | `motion.schema.ts`, `motion-engine.ts`, shared HTML, `window.__seek(t)`, `allow-scripts` preview. | No material gap found. | — | Preserve. | Schema/engine unit tests; preview parity. | `VERIFIED` |
| **A4-M** AI Motion Director & Composition Builder | Versioned typed composition, multiple meaning-driven elements, preset registry, no raw code. | Versioned `MotionProject`, preset allowlists, `generatedBy`, fallback reason. | Creative direction is implicit in layers/keyframes; not exposed as visual identity/color/system/SFX placement plan. | Schema/prompt did not model the plan as a first-class artifact. | Extend composition plan without replacing it; expose structured direction+scene instructions. | Plan persisted and rendered in UI; deterministic for same hash/preset versions. | `IN_PROGRESS` (audit snapshot) → `VERIFIED` (2026-11-27; see §9) |
| **A5** Rendering Infrastructure | Durable jobs, real Chromium+FFmpeg, MP4+poster, 30 s acceptance, retry/refund. | Full lifecycle implemented; 30 s 720p/1080p live renders passed. | Worker muxes narration only; music/SFX bytes never loaded. Container/autoscale external. | Worker audio loader queries one narration asset. | Extend job config and worker to load/mix uploaded music/SFX bytes when present. | Final MP4 contains narration + intended SFX/music with correct timing; no desync. | `IN_PROGRESS` |
| **A6** Audio Pipeline | Upload/AI/none voice; TTS ingestion; music/SFX licensing; FFmpeg normalize/duck/fade/mux. | Three audio rows exist; ADS voice ingests Cloudinary bytes but is gated; generic TTS stores provider URL; SFX metadata-only; worker muxes narration. | Generated voice may disappear when provider URL expires; VoicePanel/AudioPanel have no player; failed state not explicit; SFX not audible. | Two divergent TTS persistence paths; no SFX provider; no player in UI. | Ingest generic TTS bytes immediately; add audio players/errors/retry; add real SFX byte source or upload path. | Audio available after refresh, correct project, playable; failures explicit. | `IN_PROGRESS` |
| **A6-S** Audio Analysis & Synchronization | Real voice-over is clock; Unicode-safe segmentation; null-safe timestamps; drift gates. | `audio-analysis.ts` implemented with 6 unit tests. | No material implementation gap found. | — | Preserve; extend cues when additional layers are mixed. | Existing unit tests; drift/refit gates. | `VERIFIED` |
| **A7** Advertisement Editor / Project Workflow | Project-first Generate Video; full initial/success/failure/retry states; refresh persistence. | Header action, Video tab, list/detail routes, panels, bilingual catalogs. | Async script jobs unsupported; SFX suggestions invisible; inert Play buttons; SEO/preview errors not rendered; render events not pushed; download bypasses 401 refresh. | UI built around mutation-only success and subset of realtime events. | Complete lifecycle states and invalidation; render actual resource presence. | Scenario A/D below; Playwright coverage. | `IN_PROGRESS` |
| **A8** Subscription & Credits | D7-shaped reserve/settle/refund; priced only after sign-off. | Quota-shaped gating, `ads.*` priced `0`, default-off paid guard on branch. | Pricing sign-off external; no numeric price published. | Owner business decision. | Do not change prices until reviewed PR. | `402 PRICING_PENDING` precedence tests; cost sign-off. | `COMPLETED` / launch `BLOCKED` |
| **A9** Storage & Export | Cloudinary delivery + export/download with all relevant persisted artifacts. | Storage seams and signed delivery verified; export manifest covers script/thumbnail/images/narration/music/sfx metadata only. | Export omits `AdvertisementProject`, `MotionProject`, render jobs, MP4, poster, and SEO; SFX rows have no `fileUrl`; storage path convention differs from docs. | Export predates ADS chain and was never extended. | Add ADS/SEO scopes and files to export manifest; reconcile storage naming; skip missing files honestly. | Exported package includes MP4/poster/composition/script/SEO/available audio; missing resources marked `missing`, never `included`. | `IN_PROGRESS` |
| **A10** QA & Production Readiness | All security/perf/render/golden/cost gates green. | Extensive evidence; Playwright `30 passed`; Lighthouse blocked; PRs unmerged from session. | D8, golden visual sign-off, worker ops, R-01 rotation, pricing, LCP/TBT budgets remain open. | External owners/environment. | Await explicit decisions; rerun gates after fixes. | §7 verification scenarios. | `BLOCKED` |

### 2.2 Milestone 3 P-tasks reused by the pipeline

| Task | Original intended behavior | Current implementation / gap | Required correction | Verification | Audit status |
|---|---|---|---|---|---|
| **P04** Project configuration | Project idea/config, language/voice/dialect matrix. | Config exists; voice/dialect dropdowns blocked by D8. | Keep hidden until signed D8; do not silently substitute voice/language. | D8 evidence plus signed decision. | `COMPLETED`, policy `BLOCKED` |
| **P05** Structured scripts | `Script.sections[]` with narration/visual direction/transition/duration/assets. | Implemented and consumed by ADS. Editor save always forces `status: 'draft'`, which can demote completed scripts. | Preserve explicit completed status on no-op/valid edit or document intentional draft invalidation. | Editor test covering status preservation and render-stale behavior. | `IN_PROGRESS` |
| **P06** Audio separation | Narration/music/SFX independent rows; controls; current per layer; D8 lanes. | Lanes A+B live; C/D blocked; SFX/music metadata-only. | Add real SFX/music bytes path; keep D8 lanes hidden. | Playable SFX/music rows; refresh persistence. | `IN_PROGRESS` |
| **P07** Visual assets | Asset allowance and selected images. | Implemented; renderer consumes selected images. | Preserve attribution/provenance in composition. | Asset ownership checks. | `COMPLETED` |
| **P08** Subscription/quotas | Existing quota infrastructure. | Implemented. | No parallel ledger; no price changes. | Quota tests. | `COMPLETED` |
| **P09** Export management | Export records, allowance, lifecycle. | Implemented but manifest lacks newer ADS/SEO artifacts. | Extend export manifest and tests. | Export scenario below. | `IN_PROGRESS` |
| **P11** Production workflow | Ten-stage derived workflow including Sound Effects and estimate endpoints. | Workflow exists; per-operation estimate on unmerged `feat/pricing-readiness`; Sound Effects stage is suggestions-only. | Land estimate path only after review; add real SFX bytes. | Estimate `200` with `creditCost: 0`/`pricePending: true`; SFX playable. | `IN_PROGRESS` |
| **P12** Testing and release | Release gates, honest debt. | Playwright/Lighthouse run; performance debt documented and blocked. | Keep budgets unchanged; obtain owner policy for stale locale patterns. | Full gates after release decisions. | `BLOCKED` |

### 2.3 Cross-cutting decision gates

| Gate | Intended | Current | Required action | Status |
|---|---|---|---|---|
| **D7** Credits | D7 is the only ledger; prices signed before paid launch. | Reused; prices `0`; paid guard default-off. | Owner sign-off in reviewed PR. | `BLOCKED` |
| **D8** TTS | Verified voice/language policy before AI voice picker or dialect UI. | Evidence gathered; `ADS_AI_VOICE_ENABLED=false`; `403 AI_VOICE_GATED`; no picker. | Listening/feature-fit approval, Arabic dialect policy, cost sign-off, signed decision. Do not enable by default. | `NOT DECIDED` |
| **AR-025 / AR-034** SEO localization | Locale metadata and localized analyzer strings. | Implemented; OG card text remains English because satori lacks Arabic shaping. | Keep locale metadata; document limitation. | `COMPLETED` with limitation |
| **R-01** Key rotation | Rotate leaked xAI/HF keys. | Human action outstanding. | Rotate at providers. | `BLOCKED` |

---

## 3. Lifecycle audits

### 3.1 Sound Mail

| Stage | Finding |
|---|---|
| Original plan | No requirement found. |
| Current code | No route, model, service, job, UI, or test. |
| Actual problem | Requested feature cannot be validated against an existing acceptance criterion. |
| Root cause | Term is absent from planning record; only generic auth/invite `Mailer` exists. |
| Required correction | Implement owner-defined `A6-M` project audio message; do not alias it to SFX or voice-over. Generated text path stays D8-gated. |
| Verification criteria | Once defined: generation → persistence → API → UI → refresh → retry. |

### 3.2 Sound effects / music

| Stage | Finding |
|---|---|
| Prompt/input context | `audio.service.ts` builds a structured prompt from script/idea, but selected `mood` is not passed by the frontend and not consumed by the backend. |
| Provider response | Returns `{ name, category, description }` suggestions and timeline placements; no bytes and no `fileUrl`. |
| Processing/storage | No audio file is ingested. Test pins narration-only bytes. |
| Persistence | Three rows exist (`narration`, `music`, `sfx`), but music/SFX rows are metadata. |
| API/UI | MediaWorkspace shows `suggestionsOnly`; AudioStudio never renders suggestions; Play buttons have no handler. |
| Render/export | Worker loads only narration; export marks SFX `missing` because `fileUrl` is absent. |
| Root cause | No SFX/music byte provider; upload path uses invalid browser blob URL. |
| Required correction | Add real upload/byte ingestion for SFX/music, render suggestion details, and mix/export available bytes. If no provider exists, keep explicit `suggestionsOnly` state and do not claim generation of audio. |

### 3.3 Script generation

| Stage | Finding |
|---|---|
| Original plan | Structured scenes from real project idea; editable; per-scene regen; async-capable. |
| Live path | Real AI service and persistence; ADS consumes `Script.sections[]`. |
| Problems | Legacy fake component uses `setTimeout` + hardcoded template but is not routed; script editor always saves `status: 'draft'`; frontend cannot handle backend `202 {jobId, status:'queued'}` when `ASYNC_GENERATION=true`; `generation:completed` socket event is not handled. |
| Root cause | Stale UI seam and incomplete async contract mirror. |
| Required correction | Replace/remove the fake generator path, support job poll/socket completion, preserve status semantics, add explicit failure/retry state. |

### 3.4 SEO generation

| Stage | Finding |
|---|---|
| Original plan | Output based on project content; title, description, keywords, defined fields; persisted and displayed. |
| Current backend | Real synchronous provider call, but `generateStructuredContent<any>` with defaults and no schema validation; empty payload pins fabricated `platformScore: 85`; no idempotency. |
| Current frontend | Generation mutation exists; standalone analyzer ignores query `error`/`refetch` and shows empty state on failure; page copy hardcoded English. |
| Root cause | Loose typing and incomplete UI lifecycle. |
| Required correction | Add Zod schema and validated fields; replace fabricated score with explicit unavailable/`error` state; add idempotency; render error/retry. |

### 3.5 Voiceover / TTS

| Stage | Finding |
|---|---|
| Text/script input | ADS uses script narration; generic audio uses script/idea. ADS caps generated input at 1500 chars. |
| Voice/provider config | Alibaba `qwen-audio-3.1-tts-flash`; ADS generated voice D8-gated; no voice picker. |
| Provider response | Returns expiring URL (~24 h) plus usage. |
| Audio handling/storage | Generic path persists provider URL directly; ADS path downloads, validates, uploads to Cloudinary, probes, creates `AudioSuggestion`, and clears other current narration. |
| Persistence/retrieval | ADS path durable; generic path fragile after URL expiry. |
| API/frontend | VoicePanel shows gate/status but no player; AudioPanel does not render `detail.audio.fileUrl`; no explicit missing-audio state. |
| Retry/errors | Gate error is surfaced; other failures mostly toast-only. |
| Root cause | Two TTS persistence paths + missing player/error UI. |
| Required correction | Ingest all generated TTS bytes immediately; add player, explicit error/retry, and query invalidation. Keep D8 gate authoritative. |
| Verification criteria | Generated/existing audio appears immediately and after refresh, is associated with correct project, is playable, and failed generation is never shown as success. |

### 3.6 Creative direction / animation plan

| Stage | Finding |
|---|---|
| Planned | Project-specific visual identity, palette, typography, composition, animation language, transitions, backgrounds, pacing, narration relationship, SFX placement, final instructions. |
| Current | `motion-director.ts` produces a versioned `MotionProject` from project idea, script, images, and audio cues; deterministic fallback on AI error. |
| Problems | No first-class `creativeDirection` artifact is surfaced; UI shows scene intent/layer types/duration only; all AI errors fall back, hiding provider failure. |
| Root cause | Plan scope was implemented implicitly inside layer/keyframe data rather than as an inspectable direction plan. |
| Required correction | Extend the existing director/schema with a structured direction/scene plan; report `generatedBy`/fallback reason explicitly; expose read-only inspection. No parallel creative system, no hardcoded universal template. |
| Verification criteria | Three meaningfully different projects produce different palettes, typography profiles, motion languages, scene structures, and transitions; same project remains deterministic. |

### 3.7 Video composition / render / export

| Stage | Finding |
|---|---|
| Composition generation | Typed `MotionProject`; ownership-checked image refs; language mismatch blocks generation. |
| Resource loading | Renderer loads selected images and one narration audio asset. Music/SFX bytes absent; SEO absent. |
| Audio sync | Audio analysis maps narration segments to scenes; drift/refit gates exist. |
| Render | Durable job, Playwright frames, FFmpeg encode/mux/probe, Cloudinary MP4/poster, retry/refund/cancel. |
| Progress/errors | Polling works for active job; socket event not bound; terminal data can stay stale due 5-minute `staleTime`. |
| Export/download | Backend redirect enforces auth/entitlements; frontend anchor bypasses 401 refresh; export manifest omits ADS/SEO artifacts. |
| Root causes | Resource chain stopped at narration; export predates ADS chain; realtime mirror incomplete. |
| Required correction | Extend render config/worker for available music/SFX; include MP4/poster/composition/SEO in export; bind render updates; use authenticated download flow. |
| Verification criteria | Final MP4 contains correct scenes, project-specific motion, voice, available SFX, correct sync; playback/download/refresh work; failures are explicit and refunded. |

---

## 4. Ranked root causes

1. **Byte-vs-metadata split in audio.** Narration has bytes; music/SFX have metadata only. This single design fact breaks playback, mixing, and export.
2. **Two TTS persistence paths.** `/audio/generate` stores expiring provider URLs; ADS voice correctly ingests bytes but is D8-gated and not player-backed.
3. **Frontend treats success as terminal UI state.** Async job responses, query errors, preview errors, socket events, and resource-presence checks are incomplete.
4. **Export and ADS evolved separately.** Export manifests never learned about `AdvertisementProject`, `MotionProject`, render jobs, MP4, poster, or SEO.
5. **Creative direction was implicit.** The typed composition carries motion data, but not an inspectable project-specific direction plan.
6. **Documentation/spec drift.** Sound Mail is absent; historical standalone wizard conflicts with refreshed project-first direction; storage paths differ from docs.

---

## 5. Correction plan

### Phase 3 — Resource generation

- **P3.1 Audio bytes:** ingest AI TTS bytes through the existing storage seam in `/audio/generate`; upload real audio files for narration/music/SFX; persist https URLs.
- **P3.2 SFX provider policy:** provide real synthesized or uploaded SFX bytes, or keep `suggestionsOnly` explicitly. No fabricated “generated sound effect” success.
- **P3.3 Script:** support async job contract and socket/poll completion; remove fake generator path; preserve explicit status semantics.
- **P3.4 SEO:** add Zod schema, explicit unavailable state, idempotency, and frontend retry.
- **P3.5 TTS UI:** add audio player, explicit gate/error/retry states, and invalidation after success.

### Phase 4 — Creative video planning

- **P4.1** Extend the existing `motion-director` contract with structured `creativeDirection` and per-scene direction fields.
- **P4.2** Surface the plan read-only in `composition-panel.tsx`.
- **P4.3** Preserve deterministic fallback but report it honestly.

### Phase 5 — Video composition and export

- **P5.1** Extend render job config and worker audio loading for music/SFX bytes.
- **P5.2** Add ADS/SEO scopes to export manifest and tests.
- **P5.3** Bind `advertisement.render.updated` and other completion events to WebSocket/client invalidation.
- **P5.4** Route download through authenticated fetch/refresh flow.

### Phase 6 — End-to-end verification

- Scenario A: one project generates all real resources.
- Scenario B: three meaningfully different projects produce distinct creative directions.
- Scenario C: final MP4 uses resources, plays, downloads, and survives refresh.
- Scenario D: provider failures, incomplete payloads, missing resources, render failures, and retries report actual state.

---

## 6. Open decisions / clarifications

| ID | Question | Why it blocks | Recommended handling |
|---|---|---|---|
| **Q-SM-01** | What exactly is “Sound Mail”? There is no existing task, model, route, or UI. | Cannot preserve an original task ID or acceptance criteria that do not exist. | **Resolved 2026-11-26:** owner defined it as a project audio message, not email delivery. Traced as new task `A6-M` in [`14-SOUND-MAIL.md`](14-SOUND-MAIL.md). Generated text path remains D8-gated; uploaded path is unblocked. |
| **Q-D8** | Should AI voice remain gated? | Owner listening/dialect/cost sign-off is absent. | Keep `ADS_AI_VOICE_ENABLED=false`; fix lifecycle around real/uploaded TTS and gated generated TTS. |
| **Q-PRICE** | Numeric price table sign-off. | Paid launch must not start with `0` prices. | Keep price `0`/`PRICING_PENDING`; no application price changes. |
| **Q-LHCI** | Should stale locale LCP patterns be corrected? | It would expose two real LCP failures without changing budgets. | Owner policy decision; leave unchanged until approved. |

---

## 7. Verification criteria by scenario

### Scenario A — Complete resource generation

For a new project, sound effects/music (real bytes or explicit suggestions-only), Sound Mail (once defined), script, SEO, and voiceover must all be generated from project content, stored with correct `userId`/`projectId`, visible in the UI, playable where audio is expected, and present after refresh. No success state may be shown for a missing resource.

### Scenario B — Different creative directions

Three projects with technical, educational, and cinematic concepts must produce materially different visual identity, palette, typography, scene structure, animation language, and motion design. A color-only change fails. Determinism must hold for identical inputs/versions.

**Post-audit evidence (2026-11-27):** `tests/unit/advertisements-motion-director.test.ts` builds technical, educational, and cinematic contexts and asserts distinct `visualIdentity`, palette colours, typography profile/treatment, `composition.structure`, `composition.animationLanguage`, `transitions.primary`, and layer entrance/emphasis signatures. Each context is replayed and asserted to produce the same `compositionHash`. The same suite asserts explicit fallback reasons and server-owned palette/version/provenance; `tests/advertisements/video-orchestration.http.test.ts` asserts persistence and read-back. **Scenario B: `VERIFIED`.**

### Scenario C — Complete video generation

The final MP4 must show script-to-scene consistency, voiceover synchronization, placed sound effects where bytes exist, project-specific motion, correct duration, playable output, working download, and persistence after refresh. Composition and render must consume the generated resources rather than independently generating a generic video.

### Scenario D — Failure handling

Provider errors, malformed AI payloads, missing audio files, expired URLs, render failures, cancellation, and retry must produce explicit states. Failed credit/quota reservations must be refunded. Missing SFX/SEO must be marked missing, never silently included.

---

## 8. Evidence sources

Backend files cited by the audits include:

- `c0c-bake/src/modules/advertisements/` (`service`, `motion-director`, `motion-engine`, `render.service`, `render.worker`, `audio-analysis`, `language`).
- `c0c-bake/src/modules/audio/audio.service.ts`, `audio.model.ts`, `audio.validation.ts`.
- `c0c-bake/src/modules/scripts/scripts.service.ts`, `generation.service.ts`, `scripts.controller.ts`.
- `c0c-bake/src/modules/seo/seo.service.ts`, `seo.routes.ts`.
- `c0c-bake/src/modules/export/export.service.ts`, `export.types.ts`.
- `c0c-bake/src/shared/services/storage.service.ts`, `providers/alibaba-audio.provider.ts`.
- `c0c-bake/src/core/config/env.ts`, `core/websocket/websocket.server.ts`.
- `c0c-bake/tests/advertisements/`, `tests/audio/`, `tests/export/`, `tests/scripts/`, `tests/unit/`.

Frontend files cited include:

- `c0c-fr/src/features/audio/components/audio-studio.tsx`, `hooks/use-audio.ts`, `types.ts`.
- `c0c-fr/src/features/media/components/media-workspace/media-workspace.tsx`.
- `c0c-fr/src/features/scripts/components/script-generator.tsx`, `script-editor.tsx`, `services/scripts.service.ts`, `hooks/use-scripts.ts`.
- `c0c-fr/src/features/seo/components/seo-analyzer.tsx`, `hooks/use-seo.ts`.
- `c0c-fr/src/features/advertisements/components/{voice-panel,audio-panel,composition-panel,render-panel,preview-player}.tsx`, `hooks/use-advertisements.ts`, `services/advertisements.service.ts`.
- `c0c-fr/src/hooks/use-websocket.ts`, `src/types/realtime.ts`, `src/lib/query-client.ts`, `src/services/api-client.ts`.

All findings are traceable to those files and to the planning/status documents listed in §1. No application fix was applied before this report. `Q-SM-01` is now resolved; implementation continues with `A6-M`, durable TTS/SFX bytes, script/SEO lifecycle repair, and export/resource-chain integration.

---

## 9. Post-audit resolution — A4-M (2026-11-27)

| Audit gap | Resolution | Evidence |
|---|---|---|
| Creative direction was implicit in layers/keyframes. | Optional first-class `creativeDirection` (`direction.v1`) is persisted inside `MotionProject`, with per-scene `directionNotes`; legacy compositions without either field keep their stored shape and hash. | `motion.schema.ts`, `motion-director.ts`, `advertisements-motion-schema.test.ts`. |
| Model output needed to be useful without owning visual constants. | `creativeDirectionDraftSchema` admits only bounded rationale prose; `buildCreativeDirection()` derives palette hex values, typography profile/treatment, transition presets, versions, `generatedBy`, and `fallbackReason` from real project context. | `advertisements-motion-director.test.ts`; provider-invalid direction text falls back deterministically. |
| Fallback was silent. | Both motion generation and the direction artifact report the same explicit reason; the UI renders it without pretending AI succeeded. | `advertisements-motion-director.test.ts`, `video-orchestration.http.test.ts`, `creative-direction-panel.tsx`. |
| Direction was not inspectable in the editor. | Read-only bilingual `CreativeDirectionPanel` plus per-scene notes, swatches, source labels, unavailable state, and composition/preview cache invalidation after generate/regen. | `composition-panel.tsx`, `creative-direction-panel.tsx`, `use-advertisements.ts`, `messages/{en,ar}/advertisements.json`, `composition-panel.retry.test.tsx`. |
| Scene regeneration had no direction-preservation contract. | `regenerateMotionScene()` reuses the persisted `creativeDirection`; it never rewrites the plan. | `advertisements-motion-director.test.ts`. |
| Scenario B was unclaimed. | Deterministic style inference yields materially different identity, palette, typography, structure, animation language, transitions, and layer-motion signatures for technical, educational, and cinematic projects; identical inputs replay to the same hash. | `advertisements-motion-director.test.ts`, Scenario B evidence above. |

**Gate result:** backend targeted suites `6 files / 37 tests`, frontend targeted suites `5 files / 23 tests`, frontend full unit suite `149 files / 1001 tests`, typecheck, lint, i18n parity, and production build with bundle budget all passed. Full backend `pnpm test` retained only the three documented environment baselines and no A4-M failure. Nested placement means export includes the direction artifact without an API contract change.

**Status:** A4-M `VERIFIED` in-repo, including Scenario B. A7 remains `IN_PROGRESS` pending full browser e2e sign-off; A10 and all owner/environment gates remain unchanged.
