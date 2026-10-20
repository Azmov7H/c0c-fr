import type { Platform, UserPlan } from '@/types';

/**
 * Dashboard widget registry and layout rules (T14).
 *
 * Mirrors `c0c-bake/src/shared/dashboard-widgets.ts`. The backend allowlist is
 * the authority — this list exists so the UI can render controls for exactly the
 * ids persistence accepts and nothing else.
 */
export const DASHBOARD_WIDGET_IDS = [
    'stats',
    'projects',
    'status',
    'platforms',
    'trending',
    'activity',
    'upcoming',
    'quickActions',
    'analytics',
    'health',
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export interface DashboardPreferences {
    hiddenWidgets: DashboardWidgetId[];
    interests: string[];
    preferredPlatforms: Platform[];
}

export const EMPTY_PREFERENCES: DashboardPreferences = {
    hiddenWidgets: [],
    interests: [],
    preferredPlatforms: [],
};

export const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
    stats: 'Key metrics',
    projects: 'Projects',
    status: 'Project status',
    platforms: 'Platform split',
    trending: 'Trending for you',
    activity: 'Recent activity',
    upcoming: 'Upcoming content',
    quickActions: 'Quick actions',
    analytics: 'Creation trend',
    health: 'System status',
};

/**
 * Interest-aware default order.
 *
 * A creator who chose short-form platforms (or any interests at all) gets the
 * personalised trend feed above the generic summaries. Everyone else gets the
 * activity/status first: with no onboarding signal there is nothing to
 * personalise against, and pretending otherwise would be fabricated relevance.
 */
export function defaultWidgetOrder(preferences: DashboardPreferences): DashboardWidgetId[] {
    const personalised =
        preferences.preferredPlatforms.length > 0 || preferences.interests.length > 0;

    const tail: DashboardWidgetId[] = personalised
        ? ['trending', 'activity', 'status', 'platforms', 'analytics', 'upcoming', 'quickActions', 'health']
        : ['activity', 'status', 'platforms', 'trending', 'analytics', 'upcoming', 'quickActions', 'health'];

    return ['stats', 'projects', ...tail];
}

export function visibleWidgets(preferences: DashboardPreferences): DashboardWidgetId[] {
    const hidden = new Set(preferences.hiddenWidgets);
    return defaultWidgetOrder(preferences).filter((id) => !hidden.has(id));
}

/** Platforms ordered by the creator's stated preference, then the rest. */
export function orderPlatforms(preferred: Platform[]): Platform[] {
    const all: Platform[] = ['youtube', 'tiktok', 'instagram'];
    const set = new Set(preferred);
    return [...all.filter((p) => set.has(p)), ...all.filter((p) => !set.has(p))];
}

export interface WidgetLock {
    locked: boolean;
    reason?: string;
    upgradeHref?: string;
}

/**
 * Locked widgets stay visible with the reason and a path to upgrade.
 *
 * Hiding a feature from someone who cannot use it teaches them nothing and
 * removes the only reason they would ever pay for it (card §2).
 */
export function widgetLock(id: DashboardWidgetId, plan: UserPlan | undefined): WidgetLock {
    if (id === 'analytics' && plan === 'starter') {
        return {
            locked: true,
            reason: 'Creation analytics is available on Pro and Studio plans.',
            upgradeHref: '/settings/billing',
        };
    }
    return { locked: false };
}

export function isDashboardWidgetId(value: string): value is DashboardWidgetId {
    return (DASHBOARD_WIDGET_IDS as readonly string[]).includes(value);
}

export function normalisePreferences(input: Partial<DashboardPreferences> | undefined): DashboardPreferences {
    const hidden = (input?.hiddenWidgets ?? []).filter(isDashboardWidgetId);
    return {
        hiddenWidgets: [...new Set(hidden)],
        interests: input?.interests ?? [],
        preferredPlatforms: input?.preferredPlatforms ?? [],
    };
}
