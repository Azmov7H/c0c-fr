# AR-033 — STATUS · audio studio + thumbnails + media library

| | |
|---|---|
| **Task** | AR-033 — Audio studio (LTR transport, localized labels) + thumbnails + media library |
| **Milestone** | AR06 — Application Surface Localization |
| **Repo** | `c0c-fr` |
| **Branch** | `feat/AR33-media-extraction` |
| **Worktree** | `/home/ali/Desktop/web/c0c/.worktrees/c0c-fr-ar033` |
| **Status** | **Implemented locally; gates green; ready for commit/push/PR handoff** |
| **Base** | `origin/main` `7df4059` (includes merged AR-031 `2c0210a`, AR-032 `3f971b1`) |
| **Depends on** | AR-031, AR-032 patterns/catalog seams |
| **Size / Epic** | L / GH-L-09 |

---

## 1. Scope delivered

- Extracted audio studio, thumbnail generator/studio, media library, Unsplash attribution connectors, and thumbnails page metadata into `messages/{en,ar}/{audio,thumbnails}.json` plus `media.{attribution,library}` and `billing.generation.{creditSuffix,quotaSuffix}`.
- Localized hooks/toasts: `src/features/audio/hooks/use-audio.ts`, `src/features/thumbnails/hooks/use-thumbnails.ts` use `next-intl` + `toast` with localized `generationErrorMessage` suffixes.
- `generation-error.ts` keeps backward-compatible defaults and accepts optional localized suffixes `{ credit?: string; quota?: string }`.
- Preserved AR-D-11: native audio controls keep `dir="ltr"` in `audio-studio.tsx` and `media-workspace/media-workspace.tsx`; labels/ARIA are localized.
- No prompt/generation request/stored data/provider behavior changes (FR-28). Unsplash brand name and external links preserved; connectors localized.

## 2. Files changed (AR-033)

- `messages/en/audio.json`, `messages/ar/audio.json`
- `messages/en/thumbnails.json`, `messages/ar/thumbnails.json`
- `messages/en/media.json`, `messages/ar/media.json` (attribution/library additions)
- `messages/en/billing.json`, `messages/ar/billing.json` (generation suffixes)
- `src/app/[locale]/(dashboard)/thumbnails/page.tsx`
- `src/features/audio/components/audio-studio.tsx`
- `src/features/audio/hooks/use-audio.ts`
- `src/features/billing/lib/generation-error.ts`
- `src/features/images/components/unsplash-attribution.tsx`
- `src/features/media/components/media-library.tsx`
- `src/features/media/components/media-workspace/media-workspace.tsx`
- `src/features/thumbnails/components/thumbnail-generator.tsx`
- `src/features/thumbnails/components/thumbnail-studio.tsx`
- `src/features/thumbnails/hooks/use-thumbnails.ts`
- `src/features/media/ar033-copy.test.ts`
- `src/features/media/ar033-i18n.test.tsx`

## 3. Proof

- `ar033-copy.test.ts`: TSX surface has no hardcoded English UI copy (allowed technical/brand tokens only); TS seams have no stray prose literals except backward-compatible defaults; EN catalogs match verbatim pre-extraction floor; AR keys complete, placeholders/plurals preserved.
- `ar033-i18n.test.tsx`: AudioStudio renders Arabic chrome and keeps `audio[controls][dir="ltr"]`; ThumbnailStudio/MediaLibrary render Arabic chrome; UnsplashAttribution localizes connectors while preserving brand/name links.
- EN floor probe ran in worktree (`ar033-floor-probe.test.tsx`, 3 tests passed) and was removed before commit. No structural DOM diff recorded beyond text-node/catalog extraction; transport controls remain LTR.

## 4. Gates (worktree, sequential/heavy isolated)

| Gate | Result |
|---|---|
| `pnpm vitest run src/features/media/ar033-copy.test.ts src/features/media/ar033-i18n.test.tsx` | PASS (2 files, 9 tests) |
| `pnpm tsc --noEmit` | PASS |
| `pnpm lint` | PASS (0 errors, 1 pre-existing warning in `scripts/check-rtl.mjs`) |
| `pnpm check:i18n` | PASS (dynamic-key warnings only, expected) |
| `pnpm check:links` | PASS |
| `pnpm check:rtl` | PASS |
| `pnpm vitest run` | PASS (134 files, 937 tests) |
| `pnpm build` | PASS; budgets within budget (`/en/projects/[id]` 255.9 kB gzip / 260) |
| `pnpm check:client-secrets` | PASS (post-build) |
| `pnpm audit:gate` | PASS (`--scope prod`, gate ≥ high) |

## 5. Notes / follow-ups

- `AudioStudio` has no app-route mount (`/audio` redirects to `/projects`); still localized as surface component.
- `MediaLibrary` has no app-route mount found; localized as surface component.
- `ThumbnailStudio` mounts at `/[locale]/(dashboard)/thumbnails`; metadata localized via `getTranslations('thumbnails')`.
- Pre-existing lint warning in `scripts/check-rtl.mjs` (`PHYSICAL` unused) unchanged.
- PR creation/push/CI watch are owner-gated in this environment (no `gh` CLI/token configured).
