# 14 — Sound Mail (A6-M)

> **Task ID:** `A6-M` (new; no original task existed for “Sound Mail”)  
> **Status:** `VERIFIED` in-repo; generated path externally `BLOCKED` by D8  
> **Owner decision:** 2026-11-26 — Sound Mail is a **project audio message**. It is not email delivery.  
> **D8:** Text-to-speech generation remains gated by `ADS_AI_VOICE_ENABLED=false`; uploaded project audio messages are always available.

## 1. Objective

A project can carry a short, playable audio message that summarizes or accompanies the project. It is a first-class project resource: generated or uploaded from project context, persisted with the correct `userId`/`projectId`, shown in the workspace, playable, refresh-safe, and usable in export.

## 2. Definition

**Sound Mail** = a project-scoped audio message attached to the project, not sent to recipients. It uses the one audio collection via `assetType: 'soundmail'`, like `narration`, `music`, and `sfx`.

Two sources:

- `uploaded`: user supplies a real audio file; uploaded through the signed storage seam and persisted with an https URL.
- `generated` (D8-gated): a short summary message synthesized from the project idea/script using the existing TTS integration and immediately ingested to durable storage.

## 3. Inputs

- `projectId` (required).
- `scriptId` (optional; scopes the message to that script).
- `text` (optional explicit message text; otherwise derived from script/idea).
- For upload: `fileUrl`, `format`, `fileSize`, `durationSeconds` from the signed upload result.

Generation text cap: 1500 characters, matching the verified single-call TTS limit. Longer text must return `NARRATION_TOO_LONG`; no silent truncation.

## 4. API

- `POST /api/v1/audio/sign-upload` — returns Cloudinary signed upload parameters for `assetType: 'soundmail' | 'narration' | 'music' | 'sfx'`.
- `POST /api/v1/audio/sound-mail/generate` — generates a durable Sound Mail row; `403 AI_VOICE_GATED` while D8 is off.
- Existing `POST /api/v1/audio/upload` and `GET /api/v1/audio/project/:projectId` carry the new layer.

## 5. Lifecycle

1. Initial state: no Sound Mail row.
2. Loading: generate/upload mutation pending state.
3. Success: one current `soundmail` row with a playable https URL, duration, format, size, and source.
4. Failure: explicit inline error; no success state and no orphan current row.
5. Retry: new call with idempotency key; previous failed state cleared.
6. Refresh: row retrieved from `/audio/project/:projectId`; player restored.
7. Export: included when its URL is available, otherwise marked `missing`.

## 6. UI

- Sound Mail panel in the project audio workspace.
- Upload button (signed upload → persisted asset).
- Generate button (shows D8 gate message while disabled).
- Audio player with project association and status.
- Explicit loading/error/retry states.

## 7. Tests

Backend:

- sign-upload authz and allowlisted asset type.
- generated Sound Mail ingests bytes and persists a Cloudinary URL (with flag enabled in test).
- D8 gate precedence returns `403 AI_VOICE_GATED`.
- upload/replace uses the `soundmail` layer without touching other layers.
- export includes Sound Mail file when present.

Frontend:

- generated/uploaded message appears immediately and after refetch.
- player uses the persisted URL.
- gate/error states are visible and retryable.

## 8. Acceptance criteria

- `AC-SM-1`: A Sound Mail row belongs to the correct project/user and survives refresh.
- `AC-SM-2`: The UI shows the real generated/uploaded message with a working player.
- `AC-SM-3`: A failed or gated generation never shows a success state.
- `AC-SM-4`: Sound Mail does not overwrite narration, music, or SFX assets.
- `AC-SM-5`: Export includes the real audio file or explicitly reports it missing.

## 9. Remaining blockers

- D8 signed decision is required before generated Sound Mail can be enabled by default. Uploaded Sound Mail is unblocked.
