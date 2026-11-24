# DECISIONS — Advertisement Design ADRs

> **How to read:** AD1–AD10 are *recommendations from this planning milestone* (no ADR files exist yet — they would land in `c0c-bake/docs/adr/ADR-017+` on implementation). Each lists: existing condition → problem → alternatives → recommendation → trade-offs → implementation implications. D1–D12 status is in `00-PROJECT-DISCOVERY.md` §11; open owner decisions are **OQ-1–OQ-8** (§12).

## AD1 — Hybrid structured motion engine (not free-form LLM code)

**Existing condition:** `Script.sections[]` is structured prose; `ai.generateStructuredContent` + schema gate exists; frontend has no animation engine; no sandbox exists.
**Problem:** creative flexibility vs determinism/security.
**Alternatives:** (A) AI-generated HTML/CSS/JS per scene; (B) pure structured engine; (C) hybrid (recommended).
**Recommendation:** **Hybrid** — `SceneSchema` → component library (B) + allowlisted `customCssSnippet` (A-lite, parser-rejected when unsafe). **No generated JavaScript, ever.**
**Trade-offs:** slightly less novel than A, but preview==render, auditable, testable, regenerable. Library is bounded (~10 components).
**Implications:** `motion-engine` shared package; CSS allowlist unit tests are release gates; director prompt must target presets, not raw CSS.

## AD2 — Dedicated render worker (not serverless, not MediaRecorder)

**Existing condition:** Vercel 30 s/1024 MB; no queue; `GenerationJob` is in-process + `kind:'script'` only; Docker server runs Socket.IO.
**Problem:** minutes of CPU + hundreds of MB per render.
**Alternatives:** render in-request (serverless), MediaRecorder in browser, dedicated worker, screen-record as product (rejected — see `05-MOTION-RENDERING.md`).
**Recommendation:** **dedicated container worker** (Node + Playwright Chromium + FFmpeg), durable job docs, heartbeat, concurrency caps per plan.
**Trade-offs:** new infrastructure (the only new infra) vs guaranteed timeout/OOM on serverless and non-deterministic MediaRecorder output.
**Implications:** worker gets **no** provider keys/cookies (pre-signed asset URLs only); job payload has `sceneHash + assetHash` for cache; autoscale 1–N.

## AD3 — Durable polling first; Redis queue only if measured

**Existing condition:** Upstash Redis is rate-limit only; `GenerationJob` durable docs + poll works for scripts.
**Problem:** should we add BullMQ/Redis queue now?
**Recommendation:** **defer.** Poll `AdvertisementRenderJob` (skip-locked) at MVP; add BullMQ only if poll latency or thundering-herd is measured (spike + `11-COST-AND-PERFORMANCE.md`).
**Trade-offs:** polling adds ≤5 s staleness (acceptable for renders) vs operating a new queue.
**Implications:** worker heartbeat + sweeper are the "queue" at MVP; queue interface isolates the poller so a swap is local.

## AD4 — Sibling top-level resource (not a Project tab)

**Existing condition:** `Project` + workspace tabs (Assets/Media/Members/Activity); P11 proposes a 10-stage stepper *inside* the workspace.
**Problem:** advertisements have a different lifecycle (re-renderable, long jobs, ≤4 images, voice-over) from `Project`.
**Recommendation:** **sibling resource** `AdvertisementProject` (peer to `Project`, own `/dashboard/advertisements` group), reusing `Media`/`AudioSuggestion` patterns but not `Project.members[]` at MVP.
**Trade-offs:** nav + code duplication cost vs clean lifecycle and independent caps (a Project tab would inherit onboarding/member/memberLimit semantics that don't fit renders).
**Implications:** `NAV_GROUPS` new entry (OQ-4); collaboration post-MVP (add `can()` on the new model then).

## AD5 — Embedded scenes (not per-scene collection)

**Existing condition:** `Script.sections[]` embedded array; `GenerationJob.kind` enum extensible.
**Problem:** scenes are ordered, bounded (≤20), always fetched with the project.
**Recommendation:** **embedded `project.scenes[]`** + `scriptVersion`/`sceneHash` cache keys. No `AdvertisementScene` collection.
**Trade-offs:** array cap must be enforced (Zod `max(20)`); scene-level queries are not needed at MVP volume.
**Implications:** per-scene regen replaces one array element; render cache reuses unchanged scenes by `sceneHash`.

## AD6 — Cloudinary for permanent delivery; worker disk for temp

**Existing condition:** `storage.service` (images-only, 25 MB ingest cap) + `storageConfigured()` 503 gate; M2-T26 dual-write shape; export caps (`1 GB` total, `200 MB`/file).
**Problem:** where do MP4s, posters, temp frames live?
**Recommendation:** **Cloudinary for MP4/poster/images/audio** (extended: `uploadChunked` for MP4, signed delivery 5–15 min TTL); **worker `/tmp`** for frames (swept hourly). No Cloudinary transcoding (worker encodes H.264 directly).
**Trade-offs:** video egress is the dominant new cost (measure — OQ-7); temp-disk avoids storage cost for frames.
**Implications:** MP4 sizing must respect export-style caps (120 s 1080p ≈ 120 MB @ 8 Mbps — downscale starter to 720p).

## AD7 — Signed-upload-first (no backend byte proxying)

**Existing condition:** no multipart/`FormData` path; `express.json 10 MB`; audio frontend sends blob URLs (broken pattern).
**Problem:** uploads must bypass the 10 MB JSON limit and avoid proxying bytes.
**Recommendation:** **backend signs, frontend uploads direct to Cloudinary** (`POST …/upload/sign` → Cloudinary SDK signed upload); server probes (format/size/dims/`ffprobe`) on completion callback, then persists `Media` rows. BFF multipart is a fallback only (≤25 MB).
**Trade-offs:** signed flow is slightly more code than multipart, but correct for video-voice-over sizes and Vercel limits.
**Implications:** SVG rejected (allowlist JPEG/PNG/WebP); EXIF stripped; 4-cap enforced both sides.

## AD8 — Credit-shaped from day one; D7-gated prices

**Existing condition:** `UsageCounter` quotas shipped; D7 ledger specced (`CreditAccount/Transaction`, reserve/settle/release, 402) but unbuilt; prices pending Cost Analysis.
**Problem:** new paid surface without a ledger.
**Recommendation:** routes call a **`creditService` interface** (`reserve/settle/release/refund`) backed at MVP by `UsageCounter` adapters (`ads.*` features) behind `ADS_CREDITS_ENABLED=false`. When D7 lands, the adapter swaps to the ledger with **no route rewiring**. Unpriced ops return 402 `PRICING_PENDING`.
**Trade-offs:** quota-only MVP is simpler but less fair (per-op costs differ); credit-shaped design pays a small adapter cost now to avoid a rewrite.
**Implications:** price table (`credit-prices.ts`) stays empty until Cost Analysis; `ads.*` entitlements still enforced server-side only.

## AD9 — Frames, not screen-recording, for the product MP4

**Existing condition:** `video-project/` promos were manual Playwright captures; product has zero video code; `public/marketing/c0c-advertisement.html` is a standalone screen-recordable film (not product code).
**Problem:** how to produce the MP4?
**Recommendation:** **deterministic frame capture** (Playwright `screenshot` per `t = N/fps` → FFmpeg pipe) per `05-MOTION-RENDERING.md` Option 2. MediaRecorder/screen-recording is **rejected for downloadable MP4s** (non-deterministic, codec/drift issues). The marketing film remains a manual promo, not a product surface.
**Trade-offs:** slower than real-time (≈0.5–1.5×) + worker cost vs guaranteed timing/quality (the brief's core requirement).
**Implications:** golden-frame + `blackdetect`/`ffprobe` gates; `render(scene,t)` purity is a tested invariant.

## AD10 — Single-voice MVP; no picker until D8 verified

**Existing condition:** `longanhuan_v3.1` single voice; languages/dialects/genders **unverified** (D8-TTS-AUDIT §7 not yet run with live credentials); P04 adds `language/voiceGender/dialect` fields (in flight).
**Problem:** promising pickers before verification bills the wrong voice, mismatches language, and blocks launch.
**Recommendation:** ship **upload + no-narration + single AI voice** (with its verified language label only). Picker UI appears only with the D8 live-smoke report pasted in the PR.
**Trade-offs:** smaller launch surface vs immediate launch without a 2–4 week D8 spike blocking everything.
**Implications:** P04's voice/language fields must tolerate "single-voice" values; advertisement reads them but never writes unverified combos.

## §11. Relation to D1–D12

| Existing decision | Relation |
|---|---|
| D1 Stripe (A) | Reused; advertisement checkout/top-up flows extend D7, not D1 |
| D2 `Project.members[]` (A) | Not reused at MVP (AD4); post-MVP collaboration would extend `can()` |
| D3 Deploy (open, de-facto A) | Advertisement adds the render worker as a **fourth shape** — does not resolve D3 |
| D4 RSC+TanStack (A) | Reused for editor/preview polling |
| D5 Async job (implemented) | Pattern reused; durable renders are **not** `GenerationJob` (long jobs + frames) |
| D6 Testing (implemented) | Extended with golden-render gates |
| D7 Credits (decided, unbuilt) | **Advertisement's launch gate** for paid ops (AD8) |
| D8 TTS (unaudited) | **(AD10) single-voice MVP** |
| D9 Provenance (de-facto) | Advertisement analysis/script outputs carry `source: measured|projected`-style provenance (AD5) |
| D10 Audio split (open) | Advertisement uses `Media.metadata.slot: voiceover|music|sfx` (not a new `NarrationAsset` until D10 lands) |
| D11 Per-project quotas (open) | `ads.monthly` counter is a per-user `UsageCounter` feature (not a per-project counter) at MVP |
| D12 Workflow (open) | Advertisement stepper is **derived completion** (D12-B pattern) inside the editor, not a new global workflow system |

## §12. Open questions (owner/PM sign-off — OQ-1–OQ-8)

| ID | Question | Blocks | Default if unanswered |
|---|---|---|---|
| **OQ-1** | Advertisement prices/entitlements (durations, monthly ads, resolution/fps, watermark, retention) | A8 + D7 pricing | Quota-only MVP with proposed matrix; no paid launch |
| **OQ-2** | Upload caps (format/size/dims) + MP4 chunked-upload quota | A2, A5 | JPEG/PNG/WebP ≤10 MB ≤4096px; voice ≤180 s; MP4 via `uploadChunked` |
| **OQ-3** | Aspect ratios: 16:9 only at MVP, or 9:16/1:1 from day one? | A4/A5 | 16:9 only; others post-MVP after QA matrix |
| **OQ-4** | Nav placement (`/dashboard/advertisements` vs `/advertisements`) + collaboration (owner-only at MVP) | A7 | Dashboard group, owner-only |
| **OQ-5** | Duration-fit policy: narration > video (extend/block) + trim UI | A6 | Extend within plan max; block if over max; no trim UI at MVP |
| **OQ-6** | Vision endpoint smoke (Alibaba multimodal) — does it exist/price/limits? | A2 full analysis | Metadata fallback with honest UI notice |
| **OQ-7** | Cloudinary live smoke (video tier, signed delivery, costs) + TTS commercial terms | A9, A6 | Stubbed 503 paths; no public launch on stubs |
| **OQ-8** | Render worker host/instance + SLO targets | A5, A10 | 1–2 vCPU container, poll-autoscale 1–N; SLOs as proposed in §10 |

---

## 13 — Direction refresh decisions (2026-11-22)

AD1–AD10 stay as the historical decision record. Each decision below states the original decision, why it is no longer appropriate (or what new gap it addresses), the replacement, and the migration/compatibility implication. These are **planning recommendations**, not implemented ADRs.

### AD11 — Typed Motion Compositions replace prose/HTML animation (amends AD1)

1. **Original:** hybrid structured engine + allowlisted `customCssSnippet` (`SceneSchema` → HTML/CSS components; no generated JS).
2. **Why it changes:** Markdown/prose scene descriptions and CSS snippets cannot reliably express layers, keyframes, easing, cue timing or RTL/bidi text behaviour; arbitrary CSS weakens preview parity and reproducibility. The new product wants animated typography, shapes, icons, image transitions, presets and keyframes as *engine capabilities*.
3. **Replacement:** versioned `MotionProject`/`MotionScene` schemas + an Animation Library of controlled primitives and presets; a pure Motion Engine evaluator shared by preview/worker. The AI emits structured motion instructions only — no JS, no raw HTML/CSS.
4. **Migration:** keep `Script.sections[]` for text authoring; add an embedded `motionProject` per video state; drop `customCssSnippet` from new compositions; old prose remains readable but is not a renderable video input. Golden-frame tests replace CSS-allowlist tests as the creative gate.

### AD12 — Project-attached Generate Video state (amends AD4)

1. **Original:** sibling top-level `AdvertisementProject` with its own wizard and asset upload/selection flow.
2. **Why it changes:** the refreshed product requires the existing project-generation workflow to stay the foundation (idea → script → scenes → images → TTS → assets) and adds one **Generate Video** action. A second wizard would duplicate content and ownership.
3. **Replacement:** keep the planned collection as a **1:1 video state keyed by unique `projectId`**, reached from the project workspace; it reads `Project`/`Script`/`Media`/`Audio` and never re-creates them.
4. **Migration:** add `projectId` + language/audio/composition fields; existing `/api/v1/images`, `/scripts`, `/audio`, `/media` contracts stay; new `/video/*` routes are orchestration. No data backfill is required for projects without video state.

### AD13 — Audio-driven timing replaces scene-sum-as-clock (amends `06-AUDIO-PIPELINE.md` §3)

1. **Original:** the scene-duration sum was the master clock; narration was fitted to it.
2. **Why it changes:** voice-over is now generated during project creation and must drive animation cues; fitting speech to prose durations causes drift and poor synchronization.
3. **Replacement:** `AudioAnalysis` (probe + segment boundaries, optional word timestamps) is the clock; scene durations and element cues derive from it. No-narration projects still use scene sum.
4. **Migration:** retain authored `durationSeconds` as intent; add measured segments and a precision/confidence flag; drift >500 ms is reported, never silently stretched; existing post-mux `ffprobe` gate is unchanged.

### AD14 — Content-derived language with explicit confirmation (new)

1. **Original (localization program):** no automatic detection of "user wants Arabic" from UI/browser locale; `Project.language` is D8-gated and unpopulated.
2. **Why it changes:** language is now fundamental and must be derived from the user's actual content, with Arabic and English treated equally; neither UI locale nor account preference is sufficient.
3. **Replacement:** a Content-Language Resolver uses Unicode script analysis of idea/script/narration plus the structured generator's declared language, stores confidence, and requires user confirmation/override when ambiguous. `contentLanguage` drives direction, typography, on-screen text, captions and voice-language validation.
4. **Migration:** add fields to the video state without changing `Project.language` (still TTS intent, D8-gated). Existing projects without detection get a one-time confirmation step. Aligns with — and does not override — `AI-LOCALIZATION.md` §4's non-inference rule.

### AD15 — Unsplash hotlink selection replaces AI image generation (new; supersedes FR-2B cost/capability rows)

1. **Original:** generate advertising images with `alibaba-image.provider` + Cloudinary ingest, credit-tracked.
2. **Why it changes:** the image-generation provider was removed on branch `feat/T29-unsplash-image-picker` (pushed, unmerged); the existing image API is the server-side Unsplash proxy. Unsplash guidelines require hotlinking with `ixid` and download tracking on selection.
3. **Replacement:** search/select through `/api/v1/images/*`, store API-returned URLs + provenance, credit the photographer on every surface, trigger `download_tracking` on selection/download only, keep the key server-side.
4. **Migration:** no image re-hosting or Cloudinary ingest for Unsplash; allow `images.unsplash.com` in worker egress/CSP/remotePatterns; rate-limit searches; already-stored Cloudinary uploads remain valid project assets.

### AD16 — Arabic/English typography and RTL golden frames are release gates (new)

1. **Original:** pin Inter + Space Grotesk fonts in preview/worker; `fc-match` boot check; golden frames for layout quality.
2. **Why it changes:** Arabic shaping, connected letters, bidi punctuation/numbers and RTL motion presets can silently regress even when English frames pass; an Arabic project must render correctly end-to-end.
3. **Replacement:** add the Arabic font profile (e.g. Noto Sans Arabic) to the pin, `dir`/`lang`-aware composition, logical start/end motion presets, and mandatory Arabic RTL + English LTR + mixed-language golden-frame gates; no character reversal or injected bidi controls.
4. **Migration:** extend the worker image and preview font loading together (mismatch fails CI); existing English golden frames remain valid; no price or user-facing setting changes.

### AD17 — D8 evidence captured; no picker before signed decision (2026-11-24)

1. **Original:** AD10 deferred every language/voice/dialect option until the D8 live smoke, roster, limit, pricing, and model/endpoint evidence was recorded.
2. **What changed:** official Alibaba docs and bounded live calls now verify the configured `qwen-audio-3.1-tts-flash`/SpeechSynthesizer fit, `ar` as a valid `language_hints` value, the female multilingual `longanhuan_v3.1` voice, the male dedicated Arabic `qwen-audio-3.1-tts-flash-naseem_ar` voice, documented SSML/timestamp support, the app's exact 1500-character cap, and token prices. Evidence: [`D8-EVIDENCE-2026-11-24.md`](./D8-EVIDENCE-2026-11-24.md).
3. **Interim decision:** keep `ADS_AI_VOICE_ENABLED=false`, ship no language/gender/dialect/SSML/timestamp option, and leave the preserved D8 audit verdict untouched. This is an engineering posture, **not** a D8 approval.
4. **Still required:** owner listening/feature-fit review, Arabic dialect/locale policy, provider cost sign-off, and a signed decision entry before any voice picker or AI-voice enablement.

### OQ additions (owner/PM sign-off)

| ID | Question | Blocks | Default if unanswered |
|---|---|---|---|
| **OQ-9** | Content-language detection threshold and confirmation UX (confidence cutoff, locales) | A3-L, A7 | Detect `ar`/`en` from content; ask the user whenever confidence is low or content is mixed; never infer from UI locale |
| **OQ-10** | Motion preset taxonomy and per-plan limits (layers/elements/keyframes per scene) | A4-M, A8 | Starter: bounded safe preset set; advanced presets Pro/Studio; all plans get Arabic/English-capable output |
| **OQ-11** | D8 live-smoke timeline for Arabic AI voice (full Arabic VO requirement) | A6, launch | Arabic on-screen path ships now; upload Arabic narration or no narration until D8 verifies a voice; no silent English TTS |
| **OQ-12** | Audio timing granularity goal (segment vs word) and provider timestamp support | A6-S | Segment-level derived cues; word-level only behind an optional adapter; label precision in UI |
