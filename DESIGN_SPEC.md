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
  - Font Families: `Inter` (sans) for UI/Body. `Cal Sans` or `Clash Display` for expressive, creator-vibe Headings.
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
- **Primary**: `#6366F1` (indigo-500) – energetic, creative SaaS accent.
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

---

## 11. Dark Mode Implementation

- **Library:** `next-themes` setup wrapping the main layout in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.
- **Theme Switcher:** Toggled via the Header. Dropdown contains: "Light", "Dark", "System".
- **Preference Detection:** The `system` setup reads the user's `prefers-color-scheme` automatically.
- **Transitions:** Global CSS snippet added: `* { transition-property: color, background-color, border-color; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }` ensures smooth transition without flash unstyled content (FOUC).

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
- `DataTable` (`@tanstack/react-table` driven, sortable, paginated).
- `Chart` (shadcn-wrapped Recharts).
- `Popover` & `Calendar` (DatePicker logic).
- `Badge` (Small statuses, tags, hashtags).
- `Avatar` (User and Workspace visualization).
- `Tooltip` (Action hints).
- `Command` (Cmd+K searching interface).
- `Breadcrumb` (Header depth mapping).
- `ScrollArea` (Custom scrollbars for specific bounded sections).

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
