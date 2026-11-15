# Projects Module — UI/UX & Architecture Spec (as shipped, T16)

## Goal
The home of the user's work: a live, filterable project list and a resumable
three-step creation wizard.

---

## Project list — `/projects`

- **Live data** from `GET /projects` (paginated, 12 per page).
- **Grid or table**, chosen with a toggle; the choice persists in `localStorage`
  (`c0c:projects:view`). Table collapses to cards below `md`.
- **Search** is debounced 300 ms, server-side, with a clear button and a result
  count. The backend escapes the regex (T03).
- **Filters** — status and platform are multi-select. The state lives in the URL
  (`?q=&status=draft,completed&platform=tiktok&sort=title&page=2`), so a filtered
  view is shareable and survives refresh. Active filters render as removable chips.
- **Sort** is server-side and limited to the T03 allowlist: recent activity
  (`updatedAt`), newest created (`createdAt`), title and status. A hand-crafted
  disallowed `sortBy` is a 400.
- **Archive** is its own view (`status=archived`) with a Restore action.
- **Card contents:** thumbnail (same-origin only), title, description excerpt
  (falls back to the idea), platform badge, status badge and relative updated time
  with the absolute value in `title`.
- **Actions:** change status, archive/restore, remove. Each is optimistic with a
  cache rollback and an error toast. Remove asks for confirmation naming the
  project and says the server keeps an archived record the app cannot restore yet.
- **Empty states are distinct:** no projects at all → “No projects yet” + Create
  your first project; no matches → “No projects match these filters” + Clear
  filters; archive → “No archived projects” + Back to projects.
- **Loading:** shape-matched skeletons for the grid and the table; no spinner.
- Mobile: cards stack, filters live in a Sheet, controls are at least 44 px.

## Project workspace — `/projects/[id]`

- **Tabs in the URL:** `?tab=assets|members|activity`; refresh, back/forward and
  shared links land on the same tab. The shell loads with a layout-matched
  skeleton and renders one not-found state for missing *and* non-member projects
  ("Project not found" only — it never implies the project exists).
- **Header:** inline title editing with an optimistic update and cache rollback;
  idea, platform and status badges; created/updated times; archive (confirmed),
  delete (confirms and states the server keeps an archived record) and duplicate
  (creates a copy from the current fields). Status changes follow
  `ALLOWED_TRANSITIONS` (draft → processing → completed) and keep archive/restore
  reachable.
- **Members:** owner row plus members with avatar, name, email, coloured role
  badge and joined time. The owner's remove control is disabled with the reason
  ("Only the project owner can remove members…"). The owner can change another
  member's role inline; the menu only ever offers roles the backend accepts
  (editor/commenter/viewer, never owner). Removal mirrors the backend invariants.
- **Invites:** RHF + Zod email/role form; the accept URL is returned only to the
  inviter, shown with a copy button, and the copy explains that email delivery is
  not wired yet. A plan member limit disables the form and states `used of limit`
  with an upgrade link. Pending invites list role, inviter, countdown and state,
  refresh every minute, and surface an alert when a row expires in place.
- **Activity:** live GET of the project activity feed with actor, action, target
  and relative time; type filter, pagination, and different empty states for "no
  activity yet" and "no activity matches this filter".
- **Assets:** live scripts, thumbnails, audio, SEO and media with counts and
  per-group empty states. Generation controls require `edit`; a `429` quota
  response becomes an upgrade prompt with a link to billing.
- **Permissions:** every control is derived from `can(role, capability)` in
  `features/projects/lib/permissions.ts` (one source with the backend matrix).
  Viewers get a read-only roster with reasons on disabled controls.
- **Realtime:** project rooms now admit any member with `read`; collaboration and
  asset events invalidate only the affected query keys.
- **Invite landing `/invites/[token]`:** shows the project name, inviter, role and
  expiry only. Expired, revoked and unknown tokens share one message; accepting
  briefly confirms then redirects into the project, while an already-member
  accept shows an "already have access" state with a link in.

## Create New Project — `/projects/new`

Three steps: Details → Platform & tone → Review.

- **Details:** title (1–200), optional description (≤ 1000), the idea (1–5000) —
  each with a live counter using the backend limits. A prompt starter is offered
  when the idea is empty. Interests from onboarding seed the idea; the preferred
  platform from onboarding is pre-selected.
- **Platform & tone:** platform cards explain what changes (thumbnail ratio, script
  length, hashtag conventions); each of the six tones has a one-line description.
- **Review:** every field is summarised with an Edit jump back to its step. The
  primary button names the project.
- **Autosave** to `sessionStorage` (`c0c:projects:new-draft:v1`) after typing
  stops. Returning shows “Draft restored from …” with Start over. Successful
  creation and explicit discard clear it.
- **Keyboard:** Enter advances (Shift+Enter inserts a newline in textareas),
  Escape opens the discard confirmation when there is input.
- **Submit** is guarded by an in-flight ref and a disabled button, so a double
  click creates one project. A `428 ONBOARDING_INCOMPLETE` routes to
  `/onboarding?from=create-project` with a toast explaining why.
- **Success** replaces the wizard with the new project (`router.replace`), so Back
  returns to the list. From the command palette (`?returnTo=projects`) it returns
  to `/projects?created=<id>` instead.

## Architecture
```
src/features/projects/
  components/   # list view/toolbar/card/table/actions, wizard, workspace/*
  hooks/        # use-projects, use-project-view, use-collaboration
  lib/          # zod schema/limits, URL filters, draft, query keys, permissions, status
  services/     # projectsService, collaboration services (members/invites/activity)
```
The old `components/dashboard/project/{ProjectCard,EmptyState,helpers}` files were
removed; their responsibilities live here.

## API
- `GET /projects?page&limit&search&status&platform&sortBy&sortOrder`
  (`status`/`platform` accept comma-separated values)
- `POST /projects` (428 until onboarding completes)
- `GET /projects/:id`
- `PATCH /projects/:id` (status changes, archive, restore)
- `DELETE /projects/:id` (soft delete)
- `GET /projects/:id/members`, `POST/PATCH/DELETE /projects/:id/members[/:userId]`
- `POST/GET/DELETE /projects/:id/invites[/:inviteId]`
- `GET /projects/:id/activity?type&page&limit` (`read`)
- `GET /invites/:token`, `POST /invites/:token/accept` (public preview/accept)

All project routes require authentication. Non-members receive the same 404 as a
missing project (existence hiding); `GET` needs `read`, `PATCH` needs `edit`, and
member/invite mutation needs `manage`.
