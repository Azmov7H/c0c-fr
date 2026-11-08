# M2-T22 — navigation audit (Q0 disposition + target IA)

Date: 2026-11-08. Branch: `refactor/T22-project-centric-navigation`.

## Q0 — Services / Video disposition

- **Services**: no `src/app/**/services` page exists; the Settings "AI API
  Keys" tab (`settings-dashboard.tsx:104`) is the services surface and stays.
  *No page removed.* (Pending owner confirmation of this mapping.)
- **Video**: no page, no nav entry, marketing copy only. *Nothing to remove.*
  No real video synthesis is built in this task.

## Route audit (dashboard)

| Route | Disposition | Workspace home |
|---|---|---|
| `/scripts` → `ScriptGenerator` (client-simulated) | redirect → `/projects` | Assets tab Scripts card (real API + quota prompt) |
| `/titles` → `TitleGenerator` (client-simulated) | redirect → `/projects` | Assets tab SEO card |
| `/hashtags` → `HashtagGenerator` (client-simulated) | redirect → `/projects` | Assets tab SEO card |
| `/audio` → `AudioStudio` (real generation + T24 player) | redirect → `/projects` | Assets tab Audio card + player |
| `/thumbnails`, `/media`, `/trends`, `/analytics`, `/planner`, `/seo` | stay | Projects stay in navigation per the card's target list |
| `/team`, `/settings`, `/settings/billing`, `/dashboard`, `/projects*` | stay | unchanged |

No-project case: redirects land on `/projects` (list) because no project
id is known at redirect time; there is no per-project anchor without one.

## Capability inventory (preserved, not deleted)

Generation components stay (`ScriptGenerator`, `TitleGenerator`,
`HashtagGenerator`, `ThumbnailStudio`, `AudioStudio`); only their mounting
leaves navigation. Real generation already lives in the Assets tab with
`can(role, 'edit')` gates and the 429 → UpgradePrompt path.

## Redirect mapping

`/scripts`, `/titles`, `/hashtags`, `/audio` → `/projects`
(`redirect()` stubs, verified by `check-links.mjs` since the pages still
resolve). Direct hits never 404.
