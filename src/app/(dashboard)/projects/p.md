README# Projects Module - UI/UX & Architecture Spec

## Goal
Build a scalable, clean, and high-performance Projects page for managing AI content projects.

---

## UI Requirements

### Layout
- Responsive grid (1 → 2 → 3 columns)
- Sticky top bar with:
  - Search input
  - Filter dropdown (status, platform, tone)
  - "New Project" CTA

### Project Card
Each card must include:
- Title (bold, truncated)
- Platform badge (YouTube / TikTok / Instagram)
- Status badge (draft / processing / completed)
- Last updated date
- Short idea preview (2–3 lines max)
- Hover actions:
  - Open
  - Edit
  - Delete (confirm dialog)

### Empty State
- Centered illustration
- CTA: "Create your first project"
- No clutter

---

## UX Rules
- Instant search (debounced)
- Optimistic UI on delete
- Skeleton loading for grid
- Smooth transitions (fade + scale)

---

## Performance
- Use React Query caching
- Pagination or infinite scroll
- Avoid full re-render on filter change

---

## Architecture
/features/projects/
  components/
  hooks/
  services/
  types/

---

## API Requirements
- GET /projects
- POST /projects
- DELETE /projects/:id
- PATCH /projects/:id