# 🎨 Content Creator Cloud — Design System (Full Specification)

## 1. Overview

This design system defines the complete UI/UX foundation for a scalable AI content platform built with Next.js, Tailwind CSS, and shadcn/ui.

It ensures:
- Consistency across all modules
- High-performance UI behavior
- Predictable user experience
- Scalable component architecture

---

# 2. Design Principles

## 2.1 Core Principles

- **Clarity First** → every element has a single purpose
- **Content-Driven UI** → UI never competes with content
- **System Consistency** → reuse over reinvention
- **Progressive Disclosure** → show only what is needed
- **Speed Perception** → UI must feel instant

---

## 2.2 UX Rules

- Every screen answers ONE primary question
- Every action has a visible feedback state
- No hidden interactions
- No unnecessary UI noise
- Empty states must guide action
- Loading states must be informative

---

# 3. Visual System

## 3.1 Color System

### Primary Palette
- Primary: Main brand action color
- Primary foreground: text/icon on primary

### Semantic Colors
- Success: positive actions
- Warning: attention states
- Error: destructive actions
- Info: system hints

### Neutral Scale
- 50 → 950 grayscale system
- Used for:
  - backgrounds
  - borders
  - muted text

### Rules
- Never introduce random colors
- Always use semantic meaning
- Prefer opacity variations over new colors

---

## 3.2 Typography

### Hierarchy

- H1: 32–40px / Bold / Tight tracking
- H2: 24–28px / Bold
- H3: 18–20px / Semibold
- Body: 14–16px / Medium
- Caption: 12px / Muted

### Rules
- Max 3 font weights
- Line height optimized for readability
- Avoid excessive uppercase

---

## 3.3 Spacing System

Based on 4px grid:

| Token | Value |
|------|------|
| xs   | 4px  |
| sm   | 8px  |
| md   | 16px |
| lg   | 24px |
| xl   | 32px |
| 2xl  | 48px |

### Rule
- No arbitrary spacing
- Always use system tokens

---

## 3.4 Radius System

- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- full: circle

---

## 3.5 Elevation System

### Levels

- Level 1: Base cards
- Level 2: Hover elevation
- Level 3: Dropdowns / popovers
- Level 4: Modals / dialogs

---

# 4. Layout System

## 4.1 App Structure

---

## 4.2 Grid System

- 12-column grid for dashboards
- 1-column for mobile
- 2–3 columns for cards
- 70/30 split for workspace views

---

## 4.3 Breakpoints

| Size | Value |
|------|------|
| sm   | 640px |
| md   | 768px |
| lg   | 1024px |
| xl   | 1280px |

---

# 5. Component System

## 5.1 Buttons

### Variants
- Primary → main action
- Secondary → supporting action
- Ghost → minimal UI
- Destructive → dangerous actions

### Rules
- One primary button per screen
- Hover = subtle elevation
- Disabled = reduced opacity

---

## 5.2 Cards

### Behavior
- Hover lift (-2px translate)
- Border highlight on focus
- Actions appear on hover only

---

## 5.3 Inputs

- Always visible label
- Placeholder is not label
- Inline validation
- Error message under field

---

## 5.4 Modals

- Focus trap enabled
- Escape closes modal
- Confirm for destructive actions
- Avoid overuse

---

## 5.5 Badges

- Used for status only
- Never for navigation
- Must be semantic (not decorative)

---

# 6. Navigation System

## 6.1 Sidebar

- Icon + label structure
- Active state clearly highlighted
- Collapsible mode supported
- Tooltips on collapse

---

## 6.2 Header

- Global actions only
- Search entry point (CMD + K)
- Notifications access
- User profile menu

---

# 7. Data Experience System

## 7.1 Lists & Tables

- Sorting enabled
- Filtering always available
- Pagination or infinite scroll
- Row hover actions

---

## 7.2 Empty States

Must include:
- Icon
- Title
- Short explanation
- One primary CTA

No decorative empty states

---

## 7.3 Loading States

- Skeleton preferred over spinner
- Match final layout structure
- No layout shift

---

# 8. Interaction System

## 8.1 Transitions

- Duration: 150–300ms
- Easing: ease-out preferred
- No aggressive animations

---

## 8.2 Micro-interactions

- Button press feedback
- Hover elevation
- Icon subtle animations
- Toast notifications for actions

---

## 8.3 Feedback System

Every action must return:
- Loading state
- Success state
- Error state

No silent failures

---

# 9. Accessibility System

- WCAG 2.1 compliance
- Keyboard navigation required
- Visible focus ring
- ARIA labels for interactive elements
- Color never used alone for meaning

---

# 10. Performance UX Rules

- Optimistic UI for mutations
- Debounced search
- Lazy loading for heavy components
- Avoid full page re-renders
- Cache API responses

---

# 11. Feature UX Standards

## 11.1 Projects
- Fast creation flow
- Inline editing
- Quick actions on hover

## 11.2 Teams
- Role-based UI visibility
- Clear permission states
- Safe destructive actions

## 11.3 Workspace
- Tab-based structure
- Context-aware actions
- Persistent state per project

## 11.4 Notifications
- Real-time updates
- Read/unread distinction
- Batch actions

---

# 12. Design Tokens (Tailwind Mapping)

## Colors
- primary
- secondary
- muted
- accent
- destructive

## Utilities
- glass effect
- shadow-premium
- shadow-glow

---

# 13. Final Rule

> UI should never require explanation.

If a user needs to think → redesign it.