# Trending Content Module

## Goal
Provide real-time trending content insights for creators.

---

## Features
- Trending topics feed
- Filter by platform (YouTube, TikTok, Instagram)
- Viral score indicator
- Category tags (tech, finance, gaming, etc.)

---

## UI Layout
- Left: filters
- Center: trending cards list
- Right: insights panel

---

## Trending Card
- Title
- Source platform
- Engagement metrics
- Viral score (0–100)
- "Generate script from trend" CTA

---

## UX Rules
- Auto-refresh every 5–10 minutes
- Smooth skeleton loading
- Highlight rising trends

---

## API
- GET /trends
- GET /trends/:id