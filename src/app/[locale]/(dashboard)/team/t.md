# Team Management Module

## Goal
Enable multi-user collaboration with roles and permissions.

---

## Core Features
- Create workspace (team)
- Invite members via email
- Role-based access control
- Remove members
- Switch between teams

---

## Roles System
- owner (full control)
- admin (manage members + projects)
- editor (edit content only)
- viewer (read-only)

---

## UI Structure

### Left Panel
- List of teams (switcher)
- Highlight active team

### Middle Panel
- Invite form:
  - email input
  - role selector
  - invite button

### Right Panel
- Members list:
  - avatar
  - name + email
  - role badge
  - remove button (admin+ only)

---

## UX Rules
- Active team persistence (localStorage)
- Inline role badges
- Hover actions for delete
- Confirm dialog for destructive actions

---

## Permissions
- Only owner/admin can invite
- Only owner can delete team
- Editors cannot manage members

---

## API
- GET /teams
- POST /teams
- POST /teams/invite
- DELETE /teams/member