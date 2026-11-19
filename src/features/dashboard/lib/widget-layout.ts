import type { Platform } from '@/types';

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

/**
 * AR-027 — the widget names are copy, so this registry holds the CATALOG KEY
 * per widget instead of the English sentence. The components translate.
 */
export const WIDGET_LABEL_KEYS = {
    stats: 'widgets.stats',
    projects: 'widgets.projects',
    status: 'widgets.status',
    platforms: 'widgets.platforms',
    trending: 'widgets.trending',
    activity: 'widgets.activity',
    upcoming: 'widgets.upcoming',
    quickActions: 'widgets.quickActions',
    analytics: 'widgets.analytics',
    health: 'widgets.health',
} as const satisfies Record<DashboardWidgetId, string>;

/** AR-027 — enum-to-key maps. The labels are copy, the enum values are data. */
export const PROJECT_STATUS_KEYS = {
    draft: 'statuses.draft',
    processing: 'statuses.processing',
    completed: 'statuses.completed',
    archived: 'statuses.archived',
} as const;

export const ACTIVITY_TYPE_KEYS = {
    project: 'activityWidget.types.project',
    script: 'activityWidget.types.script',
} as const;

export const PLANNER_STATUS_KEYS = {
    pending: 'upcomingWidget.statuses.pending',
    in_progress: 'upcomingWidget.statuses.in_progress',
    completed: 'upcomingWidget.statuses.completed',
    cancelled: 'upcomingWidget.statuses.cancelled',
} as const;

export const DATABASE_STATE_KEYS = {
    connected: 'health.database.connected',
    connecting: 'health.database.connecting',
    disconnected: 'health.database.disconnected',
} as const;

/** The description under a widget heading, when it has one. */
export const WIDGET_DESCRIPTION_KEYS = {
    analytics: 'analytics.description',
    health: 'widgets.healthDescription',
} as const satisfies Partial<Record<DashboardWidgetId, string>>;

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
    const all: Platform[] = ['youtube', 'tiktok', 'instagram', 'facebook'];
    const set = new Set(preferred);
    return [...all.filter((p) => set.has(p)), ...all.filter((p) => !set.has(p))];
}

export interface WidgetLock {
    locked: boolean;
    /** AR-027 — the catalog key of the reason, not the sentence. */
    reasonKey?: 'analytics.lockedTitle';
    upgradeHref?: string;
}

/**
 * Locked widgets stay visible with the reason and a path to upgrade.
 *
 * Hiding a feature from someone who cannot use it teaches them nothing and
 * removes the only reason they would ever pay for it (card §2).
 */
export function widgetLock(
    id: DashboardWidgetId,
    entitled: boolean | undefined
): WidgetLock {
    if (id === 'analytics' && entitled === false) {
        return {
            locked: true,
            reasonKey: 'analytics.lockedTitle',
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
