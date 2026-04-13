# Settings Module

## Goal
Centralized user & workspace configuration system.

---

## Sections

### 1. Profile Settings
- Name
- Email
- Avatar upload
- Password change

### 2. Workspace Settings
- Rename workspace
- Delete workspace
- Transfer ownership

### 3. Preferences
- Theme (light/dark/system)
- Language
- Notification toggles

---

## UX Rules
- Split into tabs or sidebar navigation
- Auto-save on blur (no full submit needed)
- Toast feedback for updates

---

## Security
- Password changes require re-authentication
- Sensitive actions require confirmation modal

---

## API
- GET /user
- PATCH /user
- PATCH /workspace
- DELETE /workspace