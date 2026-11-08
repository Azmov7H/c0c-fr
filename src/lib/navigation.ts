import {
    BarChart3,
    CalendarDays,
    CreditCard,
    FileText,
    Flame,
    FolderKanban,
    Image,
    LayoutDashboard,
    Library,
    Search,
    Settings,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Single source of truth for the app shell (T10).
 *
 * The sidebar, the ⌘K palette, the breadcrumbs and the quick actions all
 * render from this file — a destination added or renamed here changes every
 * surface at once, so they can never drift apart.
 *
 * Routes are NOT renamed by labels: `/settings` stays `/settings` (bookmarks,
 * sitemap), only its label is "Account" per the brief. The sidebar keeps the
 * five-group layout from DESIGN_SPEC.md §2.
 *
 * M2-T22 (project-centric): standalone generation pages (Scripts/Titles/
 * Hashtags/Audio Studio) are removed from primary navigation — their real
 * generation already lives in the project workspace Assets tab (project-
 * scoped forms, `can(role, 'edit')` gates, 429 → UpgradePrompt). The legacy
 * URLs redirect to `/projects`; the generation components stay for their
 * workspace mounting. "Services" has no page (Settings AI-keys tab stays) and
 * "Video" has none at all (see docs/nav-audit.md Q0).
 */

export interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Content Engine',
        items: [
            { title: 'Projects', url: '/projects', icon: FolderKanban },
        ],
    },
    {
        label: 'Studio Tools',
        items: [
            { title: 'Thumbnails', url: '/thumbnails', icon: Image },
            { title: 'Media Library', url: '/media', icon: Library },
        ],
    },
    {
        label: 'Insights',
        items: [
            { title: 'Trending', url: '/trends', icon: Flame },
            { title: 'Analytics', url: '/analytics', icon: BarChart3 },
            { title: 'Planner', url: '/planner', icon: CalendarDays },
            { title: 'SEO Analyzer', url: '/seo', icon: Search },
        ],
    },
    {
        label: 'Management',
        items: [
            { title: 'Team', url: '/team', icon: Users },
            { title: 'Billing & Plan', url: '/settings/billing', icon: CreditCard },
            { title: 'Account', url: '/settings', icon: Settings },
        ],
    },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const NAV_URLS: string[] = NAV_ITEMS.map((item) => item.url);

/**
 * Breadcrumb label per path segment, derived from the nav config:
 * `/settings/billing` → "billing" appears after "settings", so the longer
 * route wins its own label ("Billing & Plan") while `/settings` stays
 * "Account". "new" and dynamic segments fall back sensibly.
 */
export const ROUTE_LABELS: Record<string, string> = {
    ...Object.fromEntries(NAV_ITEMS.map((item) => [item.url.split('/').pop()!, item.title])),
    new: 'New',
    // M2-T22: redirect stubs keep their labels so breadcrumb coverage
    // (navigation.test.ts enforces every dashboard segment) still holds.
    scripts: 'Scripts',
    titles: 'Titles',
    hashtags: 'Hashtags',
    audio: 'Audio Studio',
    // T13: focused flow, no header/breadcrumb in the shell, but every route
    // segment still carries a label (navigation.test.ts enforces it).
    onboarding: 'Get started',
};

/**
 * The deepest nav destination that contains `pathname`, or null.
 * Longest-first so `/settings/billing` highlights "Billing & Plan", not both
 * it and "Account".
 */
export function getActiveNavUrl(pathname: string): string | null {
    const sorted = [...NAV_URLS].sort((a, b) => b.length - a.length);
    return sorted.find((url) => pathname === url || pathname.startsWith(url + '/')) ?? null;
}

export interface QuickAction {
    id: string;
    title: string;
    url: string;
    icon: LucideIcon;
    /** Second key of the g-prefixed accelerator (g then p → New Project). */
    shortcutKey: string;
}

/**
 * Quick-create destinations. Every url here is asserted to resolve to a real
 * page by src/lib/navigation.test.ts — no dead links from the shell.
 */
export const QUICK_ACTIONS: QuickAction[] = [
    { id: 'new-project', title: 'New Project', url: '/projects/new', icon: FolderKanban, shortcutKey: 'p' },
    { id: 'new-script', title: 'New Script', url: '/projects', icon: FileText, shortcutKey: 's' },
    { id: 'new-thumbnail', title: 'New Thumbnail', url: '/thumbnails', icon: Image, shortcutKey: 't' },
    { id: 'new-planner-event', title: 'New Planner Event', url: '/planner', icon: CalendarDays, shortcutKey: 'e' },
    { id: 'invite-member', title: 'Invite a Member', url: '/team', icon: Users, shortcutKey: 'i' },
];
