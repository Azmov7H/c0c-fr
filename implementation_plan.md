# خطة تنفيذ Design System (UX/UI) — Content Creator Cloud

## الوضع الحالي

المشروع قائم على Next.js App Router مع shadcn/ui + Tailwind CSS v4. الهيكل معمول بشكل صحيح لكن تحتاج الصفحات إلى:
1. **Sidebar** — يعمل لكن يفتقر للتوسع حسب المواصفات (groups كاملة من DESIGN_SPEC)
2. **Header** — يفتقر لـ Create CTA dropdown + Theme switcher + Breadcrumbs + Command palette
3. **Dashboard** — موجود بشكل جيد، يحتاج تحسينات طفيفة
4. **Layouts** — `(dashboard)/layout.tsx` يستخدم `"use client"` غير ضروري
5. **صفحات ناقصة التنفيذ**: settings, team, trends — تعتمد على مكونات بدون اكتمال
6. **مكونات مفقودة**: command-menu, breadcrumb, data-table, chart, scroll-area
7. **SSR** — لا يُستفاد منه — يجب تحويل layout إلى Server Component وعزل client islands

---

## مبادئ التنفيذ

- **SSR First**: كل layout وpage يبدأ كـ Server Component إلا إذا احتاج تفاعل
- **Client Islands**: فقط المكونات التي تحتاج state/event تحمل `"use client"`
- **Clean Code**: لا تكرار، لا arbitray values، مبنية على design tokens
- **Performance**: Skeleton over spinner، optimistic UI، debounced search، lazy load
- **Context Preservation**: لا نكسر ما يعمل — نُحسّن ونُضيف فقط

---

## المراحل

---

## المرحلة 1: Design System Foundation & Layout Fixes
**الهدف**: إصلاح الهيكل الأساسي + إضافة المكونات المفقودة الحيوية

### الملفات المُعدَّلة/المُضافة:

#### [MODIFY] globals.css
- إضافة `font-space-grotesk` variable ← ربط المتغير الموجود في layout
- إضافة utility classes: `container-dashboard`, `section-title`
- تأكيد وجود shadow-glow و shadow-premium

#### [MODIFY] (dashboard)/layout.tsx
- إزالة `"use client"` ← تحويل لـ Server Component
- إضافة `ScrollArea` wrapper لمحتوى الصفحة

#### [MODIFY] components/layout/sidebar.tsx
- توسيع `links` لتشمل جميع الـ groups الكاملة من DESIGN_SPEC:
  - Overview: Dashboard
  - Content Engine: Script Generator, Content Planner, Trends
  - Studio Tools: Media Library, Thumbnails, Audio
  - Insights: Analytics
  - Management: Team, Settings
- إضافة `Tooltip` عند الـ collapse
- إضافة `Separator` بين الـ groups

#### [MODIFY] components/layout/header.tsx
- إضافة `Create` button مع `DropdownMenu`
- إضافة `ThemeToggle` في الـ header
- إضافة `Breadcrumb` component
- ربط Search بـ Command palette dialog

#### [NEW] components/layout/command-menu.tsx
- Command palette Cmd+K للبحث العالمي
- داخل Dialog مع `CommandInput`, `CommandList`

#### [NEW] src/components/ui/scroll-area.tsx (shadcn)
- تثبيت عبر shadcn CLI

#### [NEW] src/components/ui/breadcrumb.tsx (shadcn)
- تثبيت عبر shadcn CLI

---

## المرحلة 2: Dashboard Home Page Enhancement
**الهدف**: تحسين الـ dashboard page لمطابقة المواصفات الكاملة

### الملفات المُعدَّلة/المُضافة:

#### [MODIFY] app/(dashboard)/dashboard/page.tsx
- Server Component (بلا `"use client"`)
- إضافة metadata لـ SEO
- تحسين Creator Performance Summary cards (أيقونات + percentage badges)
- إضافة Trend Insights section (placeholder chart)
- إضافة AI Quick Tools shortcuts
- إضافة Content Calendar Preview mini-Kanban
- إضافة Suggested Hashtags section

---

## المرحلة 3: Trends Page
**الهدف**: تنفيذ صفحة Trends كاملة بـ DataTable + Filtering + Side Sheet

### الملفات المُعدَّلة/المُضافة:

#### [MODIFY] app/(dashboard)/trends/page.tsx
- تحويل لـ Server Component
- إضافة metadata

#### [MODIFY] features/trends/components/trends-dashboard.tsx
- `"use client"` Client Component
- Filters bar (Category + Platform selects)
- DataTable مع columns: Topic, Category, Viral Score (Progress bar), Growth, Action
- Trend Cards grid view كـ alternative
- Side Sheet: تفاصيل الـ trend + "Generate Script" CTA
- Skeleton loading

---

## المرحلة 4: Projects Page Enhancement
**الهدف**: تحسين Projects page لمطابقة المواصفات

### الملفات المُعدَّلة/المُضافة:

#### [MODIFY] app/(dashboard)/projects/page.tsx
- إضافة metadata (Server-compatible)
- نقل state management للـ ProjectsView client component

#### [NEW] features/projects/components/projects-view.tsx
- `"use client"` Client Component
- Debounced search
- Filter dropdown (status, platform)
- Skeleton + Empty State + Cards grid
- Optimistic delete

#### [MODIFY] components/dashboard/project/ProjectCard.tsx
- Hover actions (Open, Edit, Delete confirm)
- Platform badge
- Status badge بالألوان الصحيحة

---

## المرحلة 5: Settings Page
**الهدف**: Settings page كاملة بـ tabs navigation

### الملفات المُعدَّلة/المُضافة:

#### [MODIFY] app/(dashboard)/settings/page.tsx
- Server Component + metadata

#### [MODIFY] features/settings/components/settings-dashboard.tsx
- Tabs: Profile, Workspace, Preferences
- Profile: Name, Email, Avatar upload, Password change
- Workspace: Rename, Delete workspace
- Preferences: Theme switcher, Language, Notification toggles
- Auto-save on blur pattern
- Confirmation modal لـ destructive actions

---

## المرحلة 6: Team Page
**الهدف**: Team management مع roles + invite + member list

### الملفات المُعدَّلة/المُضافة:

#### [MODIFY] app/(dashboard)/team/page.tsx
- Server Component + metadata

#### [MODIFY] components/dashboard/teams/team-management.tsx
- Split layout: Left (team switcher) + Middle (invite form) + Right (members list)
- Role badges (owner/admin/editor/viewer)
- Confirm dialog للحذف
- Permission-aware UI

---

## المرحلة 7: Missing Pages — Script Generator & Media Library & Analytics
**الهدف**: إضافة الصفحات الناقصة كليًا

### الملفات المُضافة:

#### [NEW] app/(dashboard)/scripts/page.tsx
#### [NEW] app/(dashboard)/media/page.tsx
#### [NEW] app/(dashboard)/analytics/page.tsx
- كل منها Server Component + metadata
- تستورد من features المقابلة

#### [NEW] features/scripts/components/script-generator-form.tsx
- Script Generator: Left panel form + Right panel output
- Platform Selector, Tone ToggleGroup, Generate button

#### [NEW] features/analytics/components/analytics-view.tsx (تحسين)
- Charts: AreaChart, BarChart, PieChart
- Date range picker
- Dynamic chart data

---

## خطة التحقق

### بعد كل مرحلة:
```bash
npm run build  # التأكد من عدم وجود build errors
```

### تحقق بصري:
- فتح المتصفح والتنقل بين الصفحات
- التحقق من Sidebar collapse/expand
- التحقق من Dark/Light mode
- التحقق من Responsive على mobile

---

## ملاحظات SSR مهمة

| Component | Strategy |
|-----------|----------|
| Layout files | Server Components |
| Page files | Server Components (إلا ما يحتاج state) |
| Data-fetching components | React Query في Client Components |
| Interactive UI | `"use client"` Client Components |
| Sidebar, Header | Client (usePathname, useRouter) |
| Dashboard stats | Server fetch مباشر أو React Query initial data |

