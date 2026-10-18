# Content Creator Cloud (COC) - Dashboard Design Specification

## 1. Global Layout Specification

**Layout Structure:**
```tsx
<DashboardLayout>
  <Sidebar />
  <div className="flex flex-col flex-1 h-screen overflow-hidden">
    <Header />
    <MainContentContainer>
        <ScrollArea>
           {children}
        </ScrollArea>
    </MainContentContainer>
  </div>
</DashboardLayout>
```

**Requirements & Execution:**
- **Sidebar Constraint:** Fixed position on the left for desktop (`w-64` default, `w-16` collapsed). Uses `sticky top-0 h-screen`.
- **Main Content Area:** Takes up the remaining viewport width (`flex-1`).
- **Responsive Drawer:** On devices `< 1024px` (`lg:` breakpoint in Tailwind), the sidebar is hidden (`hidden lg:block`). A hamburger menu in the Header triggers a shadcn `Sheet` component sliding from the left.
- **Header:** Sticky at the top of the content container (`h-16`, `backdrop-blur-md bg-background/80`, `border-b`). `z-50`.
- **Scrollable Content:** The `MainContentContainer` holds a `ScrollArea` that is vertically scrollable, meaning only the content scrolls while the sidebar and header remain fixed.
- **Spacing & Container Width:** 
  - Sub-views have a `max-w-7xl mx-auto`.
  - Content padding is `p-4 md:p-6 lg:p-8` based on screen size.
  - Layout Grid uses a standard 12-column CSS Grid (`grid-cols-12 gap-6`).

---

## 2. Sidebar Navigation Design

A creator-focused sidebar designed for rapid access to content tools.

**Grouping and Categories:**
- **Overview**
  - Dashboard (Icon: `LayoutDashboard`)
- **Content Engine**
  - Ideas / Trend Explorer (Icon: `Lightbulb`)
  - Script Generator (Icon: `FileText`)
  - Content Planner (Icon: `CalendarDays`)
  - Title Generator (Icon: `Type`)
  - Hashtag Generator (Icon: `Hash`)
- **Studio Tools**
  - Thumbnail Studio (Icon: `Image`)
  - Media Library (Icon: `FolderVideo`)
  - Audio Effects (Icon: `Music`)
  - Templates (Icon: `LayoutTemplate`)
- **Insights**
  - Analytics (Icon: `BarChart3`)
- **Management**
  - Team (Icon: `Users`)
  - Settings (Icon: `Settings`)

**Styling Rules:**
- **Active Route:** Uses a solid primary background with primary text color: `bg-primary/10 text-primary font-medium border-l-4 border-primary`.
- **Hover States:** Soft background fade: `hover:bg-muted/50 hover:text-foreground text-muted-foreground transition-colors`.
- **Collapsed Mode:**
  - Sidebar shrinks to `w-16`. 
  - Text is hidden (`opacity-0 hidden`).
  - Icons are centered.
  - Uses shadcn `Tooltip` with `side="right"` to show the route name on hover.
- **shadcn Components Used:** `ScrollArea` (for scrolling long sidebar), `Button` (ghost variants for links), `Tooltip`, `Sheet` (mobile wrapper), `Separator` (between groups).

---

## 3. Header Design (Top Bar)

The Header acts as a universal command bar.

**Left Side:**
- **Sidebar Toggle:** `Button` (ghost, icon-only) to collapse or expand the desktop sidebar.
- **Contextual Breadcrumbs:** shadcn `Breadcrumb` component indicating current depth (e.g., `Dashboard > Script Generator > New Script`).

**Center:**
- **Global Search:** A wide, placeholder input (`w-96`, muted text "Search projects, trends... ⌘K"). Clicking opens the `Command` palette dialog, providing universal search across media, past scripts, and settings.

**Right Side:**
- **Primary CTA:** A prominent "Create" `Button` (primary variant, with a `Plus` icon), which opens a `DropdownMenu` offering quick actions: "New Script", "Upload Media", etc.
- **Notifications:** A bell icon `Button` (ghost) with an absolute-positioned red `Badge` dot. Triggers a `Popover` displaying recent creator notifications.
- **Theme Switcher:** A Sun/Moon icon toggle for Light/Dark mode.
- **User Avatar:** A shadcn `Avatar` component that acts as a trigger for a `DropdownMenu`. The menu includes: Profile Settings, Billing & Plans, Switch Team, Log Out.

---

## 4. Dashboard Home Layout

The home dashboard is built on a 12-column grid (`grid grid-cols-12 gap-6`).

**Widgets:**
1. **Creator Performance Summary (Top Row):** 
   - Uses `col-span-12 md:col-span-3` (4 cards total).
   - Display: Total Views, Avg Engagement Rate, Follower Growth, Est. Revenue.
   - Internal Structure: Uses standard `Card` with `CardHeader` (Title + subtle icon), `CardContent` (Large numeric value + green/red percentage change `Badge`).
2. **Trend Insights (Middle Row, Left):** 
   - `col-span-12 lg:col-span-8`.
   - Line chart showing account velocity vs platform trend velocity. Wraps shadcn `Chart` component.
3. **AI Quick Tools (Middle Row, Right):** 
   - `col-span-12 lg:col-span-4`.
   - A list stack. Features `Button` blocks for "Generate Hook", "Analyze Audio", "Find Trending Sound".
4. **Content Calendar Preview (Bottom Row, Left):** 
   - `col-span-12 lg:col-span-8`.
   - A mini Kanban or list of upcoming content. Uses `Badge` for Platform (YouTube, TikTok) and Status (Scripting, Editing, Scheduled).
5. **Suggested Titles & Hashtags (Bottom Row, Right):** 
   - `col-span-12 lg:col-span-4`.
   - Direct copy-to-clipboard elements. Wraps hashtags in pill-shaped secondary `Badge`s.

---

## 5. Feature Pages UI - Script Generator Page

**UI Flow:**
A split-screen interface mimicking a professional IDE environment.

**Left Panel: Idea Input (`w-1/3`, bordered container)**
- **Inputs:** `Textarea` for the core idea or brief.
- **Platform Selector:** `Select` component (TikTok, Shorts, Reels, Long-form).
- **Video Length:** `Select` component or `Slider`.
- **Tone Selector:** Pill-shaped `ToggleGroup` (Educational, Hype, Storytelling, Conversational).
- **Action:** A sticky bottom "Generate Script" primary `Button` featuring a loading spinner component during generation.

**Right Panel: Output Area (`w-2/3`, `ScrollArea`)**
- Displayed inside an elevated `Card` simulating a document editor.
- **Segmented Visuals:** 
  - **Hook:** Prominently boxed with an "Alternative Hooks" dropdown.
  - **Main Body:** Separated paragraphs, with a secondary sidebar or tooltip offering to "Rewrite" or "Make Shorter/Punchier".
  - **CTA:** Suggested calls to action highlighted at the bottom.
- **Action Bar:** Floating at the top-right of the output card containing ghost `Button`s for: `Regenerate`, `Copy (ClipboardIcon)`, `Export (DownloadIcon)`.

---

## 6. Feature Pages UI - Trend Analysis Page

A data-heavy discovery page.

**Header Layout:**
- Left: Page title + Subtitle ("Discover what's viral in your niche right now").
- Right: A set of `Select` filters (Category: Gaming, Tech, Finance) and Platform choice.

**Data Display:**
- **Primary View:** A rich `DataTable`.
  - Columns: Topic/Sound Name, Category, Trending Score (1-100 mapped to a gradient `Progress` bar), 24h Growth trajectory sparkline chart, Source Link icon.
- **Secondary View:** Trend Cards (`grid-cols-4`).
- Interactive: Clicking a trend opens a side `Sheet` showing recent top-performing videos using that trend and a button to "Generate Script using Trend".

---

## 7. Feature Pages UI - Media Library Page

A robust asset management system.

**Header:**
- Search `Input` (filtering by name or tags).
- Upload `Button` (Primary). Triggers a centralized drag-and-drop modal.

**Filters:**
- Under the header, a `Tabs` component: `Images`, `Thumbnails`, `B-Roll`, `Audio Effects`, `All`.

**Grid Layout:**
- `grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4`.
- **Card Design:** Aspect ratio locked (16:9 for thumbnails/video, 1:1 for music icons). Uses `next/image` heavily optimized. 
- Hover state reveals a dark gradient overlay with "Play/View", "Copy URL", and "Delete" ghost buttons.
- **Preview Modal:** Clicking an asset opens a massive `Dialog` displaying the high-res image or custom video/audio player alongside a metadata sidebar (Size, Date, Auto-generated Tags).

---

## 8. Feature Pages UI - Analytics Page

**Chart Implementations (shadcn/ui `Chart` over Recharts):**
- **Views Over Time:** Large, smooth `AreaChart` (`col-span-12`). X-axis: Dates. Y-axis: View count. Supports multi-line overlays (comparing total cross-platform vs individual).
- **Engagement Funnel:** `BarChart` (`col-span-6`) showing Impressions -> Clicks -> Average View Duration.
- **Audience Geography/Demographics:** `PieChart` or horizontal `BarChart` (`col-span-6`).
- **Date Controls:** Global `Popover` with a custom `Calendar` allowing "Last 7 Days", "Last 30 Days", "Year to Date". Controls impact all charts dynamically.

---

## 9. Design System

- **Typography Scale:**
  - Font Families: `Inter` (sans) for UI/Body, loaded with `next/font` onto `--font-body` and exposed as the `--font-sans` / `font-sans` token.
    `Space Grotesk` (variable) is the display face, loaded onto `--font-space-grotesk` and exposed as `--font-display` / `font-display` — used for page titles and expressive headings.
    Both are self-hosted by `next/font` with size-adjusted fallbacks; no external font request is made at runtime.
  - Desktop H1: `text-4xl font-extrabold tracking-tight`
  - Desktop H2: `text-3xl font-bold tracking-tight`
  - Body: `text-base font-normal leading-7`
  - Muted Detail: `text-sm font-medium text-muted-foreground`
- **Spacing System:** Based on standard Tailwind 4px multiplier. Internal padding `p-4`, generous section gaps `gap-6` and `mb-8`.
- **Border Radius:** `radius: 0.75rem` (Tailwind `xl` or `lg`). Gives a modern, softer SaaS feel typical in creator tools. Buttons default to `rounded-md`.
- **Shadow System:**
  - Base Layout: Flat, no shadows. Relying on borders (`border-border`).
  - Cards resting: `shadow-sm`.
  - Hover states / Floating elements (dropdowns): `shadow-lg shadow-primary/5`.

---

## 10. Color System (Light & Dark)

Built using CSS variables required by Tailwind mapping to the shadcn setup.

**Light Mode Palette (`:root`):**
- **Background**: `#FAFAFA` (zinc-50) – slightly off-white to reduce eye strain.
- **Card**: `#FFFFFF` (white) – clean contrast against background.
- **Primary**: `#5D61EF` (was `#6366F1`; darkened 2% lightness in T08 to reach WCAG AA on background, 4.53:1).
- **Secondary**: `#F4F4F5` (zinc-100) – low-contrast backgrounds.
- **Accent**: `#10B981` (emerald-500) – for positive actions/growth metrics.
- **Muted**: `#F4F4F5` (zinc-100) / Text: `#71717A` (zinc-500).
- **Border**: `#E4E4E7` (zinc-200).

**Dark Mode Palette (`.dark`):**
- **Background**: `#09090B` (zinc-950) – deep, focused canvas.
- **Card**: `#161618` (custom near-black) – subtle elevation.
- **Primary**: `#818CF8` (indigo-400) – adjusted for legibility against dark.
- **Secondary**: `#27272A` (zinc-800) – pill backgrounds, secondary buttons.
- **Accent**: `#34D399` (emerald-400).
- **Muted**: `#27272A` (zinc-800) / Text: `#A1A1AA` (zinc-400).
- **Border**: `#27272A` (zinc-800) – faint separation lines.

**Semantic state colours (added T08):** §10 previously defined no success/warning/info,
so state UI wrote raw palette classes. These tokens now cover it — `--success`
(emerald-500 / dark: emerald-400), `--warning` (amber-500 / amber-400), `--info`
(blue-500 / blue-400), `--negative` (rose-500 / rose-400). Fixed brand hues are
tokens too (`--brand-red`, `--brand-cyan`, `--brand-pink`, `--brand-violet`) so
platform marks and decorative gradients stop using palette classes. `--chart-1..5`
provide theme-aware series colours for the chart wrapper. Raw palette classes are
banned outside `globals.css` by an ESLint rule (`design-system/no-raw-palette-classes`).

---

## 11. Dark Mode Implementation

- **Library:** `next-themes` setup wrapping the main layout in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.
- **Theme Switcher:** Toggled via the Header. Dropdown contains: "Light", "Dark", "System".
- **Preference Detection:** The `system` setup reads the user's `prefers-color-scheme` automatically.
- **Transitions:** Implemented in `globals.css` `@layer base`: a 150 ms transition on colour, background, border, outline, fill and stroke for all elements, with `prefers-reduced-motion` collapsing it to 0.01 ms. Scoped to colour properties only — no layout/animation properties are transitioned. `disableTransitionOnChange` is **not** set on the provider, since it would suppress exactly this.

---

## 12. Component Library

All built utilizing `shadcn/ui` and Radix primitives:
- `Button` (Variants: default, destructive, outline, secondary, ghost, link).
- `Input` & `Textarea` (Form controls, full integration with `react-hook-form` & zod).
- `Card` (Contains Cards, Header, Title, Description, Content, Footer).
- `Select` & `DropdownMenu` (For context actions and routing selections).
- `Tabs` (Filters on Media/Trends).
- `Dialog` & `Sheet` (Modals for asset preview, Sheets for mobile sidebar and trend details).
- `Toast` (Integrated via `sonner` for non-intrusive copy confirmations / generation success).
- `DataTable` (`@tanstack/react-table` driven, sortable, paginated) — `src/components/ui/data-table.tsx`.
- `Chart` (shadcn-wrapped Recharts).
- `Popover` & `Calendar` (DatePicker logic).
- `Badge` (Small statuses, tags, hashtags).
- `Avatar` (User and Workspace visualization).
- `Tooltip` (Action hints).
- `Command` (Cmd+K searching interface).
- `Breadcrumb` (Header depth mapping).
- `ScrollArea` (Custom scrollbars for specific bounded sections).
- `Alert` (`src/components/ui/alert.tsx`) — inline status/notice blocks, used by `DataState`'s error branch.
- `Accordion`, `Popover`, `Calendar`, `Pagination` — added in T08 for T14/T17/T18; `Pagination` is consumed by `DataTable`.

### Layout primitives (T08)

- `PageHeader` (`src/components/shared/page-header.tsx`) — title (rendered in `font-display`), description, `breadcrumb` slot, `actions` slot. Supersedes the removed `FeatureHeader`.
- `SectionCard` (`src/components/shared/section-card.tsx`) — card with a standard header (title, description, actions) and content padding.
- `DataState` (`src/components/shared/data-state.tsx`) — one component covering **loading / empty / error / success** for any data-driven view; loading renders a skeleton (never a spinner-only affordance), empty renders `EmptyState`, error renders an `Alert`. Precedence: loading → error → empty → content.
- `MockDataBanner` (`src/components/shared/mock-data-banner.tsx`) — visible dev-only marker for pages backed by demo data; the demo data itself is gated in `src/lib/dev-mocks.ts` and eliminated from production builds.

---

## 13. File Structure

Next.js App Router specific structure utilizing feature-driven architecture logic to keep the project highly scalable.

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Public auth routes
│   │   ├── (dashboard)/               # Protected dashboard layout
│   │   │   ├── layout.tsx             # Defines DashboardLayout (Sidebar, Header)
│   │   │   ├── page.tsx               # Home Dashboard widgets
│   │   │   ├── script-generator/page.tsx
│   │   │   ├── trends/page.tsx
│   │   │   ├── media/page.tsx
│   │   │   └── analytics/page.tsx
│   │   ├── layout.tsx                 # Root layout (Html, Body, Providers, Fonts)
│   │   └── globals.css                # Tailwind base + CSS Variables
│   ├── components/                    # Global/Shared Components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx            # Desktop & responsive drawer combined
│   │   │   ├── header.tsx             # Top command bar
│   │   │   └── command-menu.tsx       # Cmd+K trigger/dialog
│   │   ├── ui/                        # Isolated shadcn/ui components (button, card, etc.)
│   │   └── shared/                    # ThemeSwitcher, GenericError, PageLoading
│   ├── features/                      # Feature modules (Business Logic & Scoped UI)
│   │   ├── dashboard/                 # Home widgets & logic
│   │   ├── scripts/
│   │   │   ├── components/            # e.g., GeneratorForm, OutputView
│   │   │   ├── hooks/                 # e.g., use-generate-script.ts
│   │   │   └── schemas/               # Zod validation
│   │   ├── trends/
│   │   ├── media/
│   │   └── analytics/
│   ├── lib/                           # Core utilities (cn utility, API fetchers)
│   └── styles/                        # Additional css configurations if necessary
├── tailwind.config.ts                 # Extended with design system variables
└── components.json                    # shadcn/ui configuration
```

## 14. Marketing / Landing Page (T11)

Route `/` — `src/app/(marketing)/page.tsx`, a server component composing
`src/features/landing/components/*` (hero, problem, assets, how-it-works,
collaboration, proof, pricing-teaser, final-cta). Copy rules: no fabricated
proof (the proof section is a marked placeholder), no dollar figures (tiers
show the real entitlement matrix with "Announced at launch"), and every link
resolves — `marketing-links.test.ts` walks header/footer/CTA hrefs.

- Hero visual: `public/landing/dashboard.jpg` (1600×1000) — a capture of the
  shipped Ideas & Trends surface (product components, sample data) in dark
  theme; rendered through `next/image` with explicit dimensions, `priority`
  only here.
- Theme: this route does not mount `next-themes`. A pre-paint inline script
  (`theme-pre-paint-script.tsx`) applies the stored `theme` localStorage key
  (falling back to `prefers-color-scheme`) before first paint;
  `ThemeQuickToggle` is the plain light/dark button. Query/tooltip/session/
  websocket providers moved to `app-providers.tsx`, mounted by the
  `(dashboard)` and `(auth)` layouts only.
- SEO: `src/lib/public-routes.ts` is the single route table behind `robots.ts`
  and `sitemap.ts` (only `/`, `/privacy`, `/terms`; auth pages excluded by
  policy). `(marketing)/opengraph-image.tsx` renders the 1200×630 card using
  vendored Inter woffs (`assets/fonts/`) so builds never depend on the Google
  Fonts CDN. Icons: `src/app/icon.svg`, `public/favicon.ico`,
  `src/app/apple-icon.png`.
- Legal: `/privacy` and `/terms` are minimal, clearly marked template
  placeholders pending legal review. `/signup` is a re-export of
  `(auth)/register` until T12 turns it into the real page.
- CSP: the route stays statically rendered (○ in the build route table). T09's
  nonce policy remains report-only; enforcement on static routes needs a
  script-hash pipeline because prerendered HTML carries no nonces (see
  `tasks/T11-STATUS.md`).
- Budget: measured modern first-load 151.2 kB gzip vs the 140 kB card budget —
  the gap is the framework floor (react-dom 69.1 + app-router 36.2 + shared
  40.6) plus the AC-mandated `next/image` runtime (5.3). The route's own client
  JS is ~0 kB; the 38.5 kB legacy polyfill is `<script nomodule>` and is never
  fetched by modern browsers. Screenshots live in `docs/screenshots/`,
  Lighthouse reports in `docs/lighthouse/`.

## 15. Auth Pages & Account Recovery (T12)

Canonical surface: `/signup` (real page), `/login`, `/forgot-password`,
`/reset-password`, `/verify-email` — all inside `(auth)/`, sharing one
`AuthFormLayout` shell (heading/card/footer). `/register` is a route handler
returning **301 → /signup** (GET + HEAD), replacing the old page.

- **One password policy**: `src/lib/password-policy.ts` (`passwordSchema`,
  `passwordChecks`, `passwordScore`) is consumed by the BFF request schemas,
  every form's zod schema and the strength meter — the meter cannot mark valid
  what the API rejects. A behavioural matrix test pins it to the backend rule
  (≥ 8, upper, lower, digit, ≤ 200).
- **BFF routes** (`src/app/api/auth/`): `forgot-password`, `reset-password`,
  `verify-email`, `change-password`, `logout-all`, plus `resend-verification`
  for the banner. All Zod-validated (strict), relayed through
  `src/lib/auth-relay.ts`, no request or response carries account-existence
  signals. On 5xx/network the BFF attaches an `AUTH-<8hex>` support reference
  (logged with the upstream status); 4xx carry none.
- **Token hygiene**: reset/verify tokens are captured on first render, scrubbed
  from the URL immediately (`router.replace`), held only in component state,
  and exchanged only on explicit user action — auto-exchange would let link
  scanners burn single-use tokens. Expired vs used reset tokens are a single
  backend message by design (enumeration oracle); malformed links (< 20 chars)
  are caught before any request.
- **Sessions**: T02 delivers the refresh token as a backend-scoped httpOnly
  cookie; the BFF login/register routes promote it onto the BFF-owned
  `__Host-refresh_token` cookie (`extractRefreshToken`), restoring session
  renewal. Reset/change-password succeed by **clearing** cookies (the backend
  issues no replacement tokens): reset → `/login?reset=1`, change →
  `/login?changed=1`, sign-out-everywhere → `/login?signout=1`, verification →
  `/login?verified=1` when no session exists.
- **Verification banner** (`(dashboard)` layout): renders only for
  `emailVerified === false` (new backend field, `sanitizeUser`); resend is
  click-only with a 60 s `sessionStorage` cooldown; never blocks the app.
- **Indexing**: `robots.ts` disallows all six auth paths and the `(auth)`
  layout emits a `noindex, nofollow` meta (the meta is what removes an
  already-indexed URL).
- Screenshots: `docs/screenshots/auth-{page}-{size}-{theme}.png` (5 pages ×
  desktop/mobile × light/dark).
