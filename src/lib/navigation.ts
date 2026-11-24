import {
    BarChart3,
    CalendarDays,
    Clapperboard,
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

/**
 * AR-029 — the English `title`/`label` stay as DATA (routes, tests, the no-dead-
 * links gate and the English floor all read them). The `*Key` fields are the
 * `navigation` catalog keys the surfaces render; on `/en` the catalog values
 * are verbatim copies of these strings.
 */
export interface NavItem {
    title: string;
    titleKey: string;
    url: string;
    icon: LucideIcon;
}

export interface NavGroup {
    label: string;
    labelKey: string;
    items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Overview',
        labelKey: 'groups.overview',
        items: [
            { title: 'Dashboard', titleKey: 'items.dashboard', url: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Content Engine',
        labelKey: 'groups.contentEngine',
        items: [
            { title: 'Projects', titleKey: 'items.projects', url: '/projects', icon: FolderKanban },
            { title: 'Advertisements', titleKey: 'items.advertisements', url: '/advertisements', icon: Clapperboard },
        ],
    },
    {
        label: 'Studio Tools',
        labelKey: 'groups.studioTools',
        items: [
            { title: 'Thumbnails', titleKey: 'items.thumbnails', url: '/thumbnails', icon: Image },
            { title: 'Media Library', titleKey: 'items.mediaLibrary', url: '/media', icon: Library },
        ],
    },
    {
        label: 'Insights',
        labelKey: 'groups.insights',
        items: [
            { title: 'Trending', titleKey: 'items.trending', url: '/trends', icon: Flame },
            { title: 'Analytics', titleKey: 'items.analytics', url: '/analytics', icon: BarChart3 },
            { title: 'Planner', titleKey: 'items.planner', url: '/planner', icon: CalendarDays },
            { title: 'SEO Analyzer', titleKey: 'items.seoAnalyzer', url: '/seo', icon: Search },
        ],
    },
    {
        label: 'Management',
        labelKey: 'groups.management',
        items: [
            { title: 'Team', titleKey: 'items.team', url: '/team', icon: Users },
            { title: 'Billing & Plan', titleKey: 'items.billingPlan', url: '/settings/billing', icon: CreditCard },
            { title: 'Account', titleKey: 'items.account', url: '/settings', icon: Settings },
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
 * AR-029 — the catalog keys behind `ROUTE_LABELS`, with the same precedence:
 * the deeper nav destination wins (`billing` → `items.billingPlan`, not the
 * `settings` → `items.account` entry). The header reads these through the
 * `navigation` translator so a breadcrumb is in the page's language.
 */
export const ROUTE_LABEL_KEYS: Record<string, string> = {
    ...Object.fromEntries(NAV_ITEMS.map((item) => [item.url.split('/').pop()!, item.titleKey])),
    new: 'routes.new',
    scripts: 'routes.scripts',
    titles: 'routes.titles',
    hashtags: 'routes.hashtags',
    audio: 'routes.audio',
    onboarding: 'routes.onboarding',
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
    titleKey: string;
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
    { id: 'new-project', title: 'New Project', titleKey: 'quickActions.newProject', url: '/projects/new', icon: FolderKanban, shortcutKey: 'p' },
    { id: 'new-script', title: 'New Script', titleKey: 'quickActions.newScript', url: '/projects', icon: FileText, shortcutKey: 's' },
    { id: 'new-thumbnail', title: 'New Thumbnail', titleKey: 'quickActions.newThumbnail', url: '/thumbnails', icon: Image, shortcutKey: 't' },
    { id: 'new-planner-event', title: 'New Planner Event', titleKey: 'quickActions.newPlannerEvent', url: '/planner', icon: CalendarDays, shortcutKey: 'e' },
    { id: 'invite-member', title: 'Invite a Member', titleKey: 'quickActions.inviteMember', url: '/team', icon: Users, shortcutKey: 'i' },
];
