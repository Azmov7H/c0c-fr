# Notifications System

## Goal
Real-time event delivery system for workspace actions.

---

## Notification Types
- team_invite
- project_updated
- script_generated
- comment_added
- system_alert

---

## UI
- Bell icon in header
- Dropdown panel
- Notification list:
  - icon
  - title
  - timestamp
  - read/unread state

---

## UX Rules
- Unread badge counter
- Mark as read on click
- Mark all as read
- Infinite scroll

---

## Real-time
- WebSocket or SSE support
- Fallback polling every 30–60s

---

## API
- GET /notifications
- POST /notifications/read
- POST /notifications/read-all