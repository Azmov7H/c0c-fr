# Projects Module — UI/UX & Architecture Spec (as shipped, T15)

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
  components/   # view, toolbar, card, table, actions, wizard + steps
  hooks/        # use-projects (queries + optimistic mutations), use-project-view
  lib/          # zod schema/limits, URL filters, sessionStorage draft, query keys
  services/     # projectsService
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
