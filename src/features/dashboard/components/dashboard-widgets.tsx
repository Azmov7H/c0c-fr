'use client';

import { formatMonth } from '@/lib/format';
import { useUrlLocale } from '@/i18n/locale';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
    Calendar,
    FileText,
    Flame,
    LayoutDashboard,
    Lightbulb,
    Plus,
    RotateCcw,
    Users,
    Zap,
} from 'lucide-react';

import { DirIcon } from '@/components/icons/dir-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardDataState } from './dashboard-data-state';
import type { Platform, ProjectStatus } from '@/types';

import {
    useDashboardPreferences,
    useDashboardStats,
    useHealthReady,
    useRecentActivity,
} from '../hooks/use-dashboard';
import { useForMeTrendFeed } from '@/features/trends/hooks/use-trends';
import type { RecentActivityItem } from '../services/dashboard.service';
import { DASHBOARD_ACTIVITY_LIMIT, DASHBOARD_TRENDS_WINDOW } from '../lib/queries';
import {
    ACTIVITY_TYPE_KEYS,
    DATABASE_STATE_KEYS,
    EMPTY_PREFERENCES,
    PLANNER_STATUS_KEYS,
    PROJECT_STATUS_KEYS,
    orderPlatforms,
} from '../lib/widget-layout';
import { formatNumber, formatPercent, formatRelativeTime } from '../lib/format';

const PLATFORM_LABEL: Record<Platform, string> = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    facebook: 'Facebook',
};

const PLATFORM_TONE: Record<Platform, string> = {
    youtube: 'bg-negative/10 text-negative',
    tiktok: 'bg-info/10 text-info',
    instagram: 'bg-brand-violet/10 text-brand-violet',
    facebook: 'bg-info/10 text-info',
};

type ProjectStatusKey = (typeof PROJECT_STATUS_KEYS)[keyof typeof PROJECT_STATUS_KEYS];
type PlannerStatusKey = (typeof PLANNER_STATUS_KEYS)[keyof typeof PLANNER_STATUS_KEYS];

function projectStatusLabel(
    t: ReturnType<typeof useTranslations<'dashboard'>>,
    status: string | undefined
): string {
    const key = status
        ? (PROJECT_STATUS_KEYS as Record<string, ProjectStatusKey | undefined>)[status]
        : undefined;
    return key ? t(key) : status || t('activityWidget.new');
}

function plannerStatusLabel(
    t: ReturnType<typeof useTranslations<'dashboard'>>,
    status: string | undefined
): string {
    const key = status
        ? (PLANNER_STATUS_KEYS as Record<string, PlannerStatusKey | undefined>)[status]
        : undefined;
    return key ? t(key) : status ?? '';
}

export type LazyWidgetId =
    | 'status'
    | 'platforms'
    | 'trending'
    | 'activity'
    | 'upcoming'
    | 'quickActions'
    | 'health';

function StatusWidget() {
    const t = useTranslations('dashboard');
    const locale = useUrlLocale();
    const { data, isLoading, isError, refetch } = useDashboardStats();
    const rows: Array<{ key: ProjectStatus; count: number }> = [
        { key: 'draft', count: data?.overview.draftProjects ?? 0 },
        { key: 'processing', count: data?.overview.activeProjects ?? 0 },
        { key: 'completed', count: data?.overview.completedProjects ?? 0 },
        { key: 'archived', count: data?.overview.archivedProjects ?? 0 },
    ];
    const total = rows.reduce((sum, row) => sum + row.count, 0);

    return (
        <DashboardDataState
            isLoading={isLoading}
            error={isError ? new Error(t('statusWidget.error')) : null}
            onRetry={() => void refetch()}
            loadingFallback={<Skeleton className="h-36 w-full rounded-xl" />}
        >
            <ul className="space-y-3">
                {rows.map((row) => {
                    const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
                    return (
                        <li key={row.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">
                                    {t(PROJECT_STATUS_KEYS[row.key])}
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                    {formatNumber(row.count, locale)}
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${share}%` }}
                                    role="presentation"
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </DashboardDataState>
    );
}

function PlatformsWidget() {
    const t = useTranslations('dashboard');
    const locale = useUrlLocale();
    const { data, isLoading, isError, refetch } = useDashboardStats();
    const preferences = useDashboardPreferences().data ?? EMPTY_PREFERENCES;
    const platforms = orderPlatforms(preferences.preferredPlatforms);
    const counts = data?.projectsByPlatform ?? { youtube: 0, tiktok: 0, instagram: 0, facebook: 0 };
    const total = platforms.reduce((sum, platform) => sum + counts[platform], 0);

    return (
        <DashboardDataState
            isLoading={isLoading}
            error={isError ? new Error(t('platformsWidget.error')) : null}
            isEmpty={!isLoading && total === 0}
            emptyTitle={t('platformsWidget.emptyTitle')}
            emptyDescription={t('platformsWidget.emptyDescription')}
            emptyIcon={LayoutDashboard}
            onRetry={() => void refetch()}
            loadingFallback={<Skeleton className="h-36 w-full rounded-xl" />}
        >
            <ul className="space-y-3">
                {platforms.map((platform) => {
                    const count = counts[platform];
                    const share = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                        <li key={platform} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{PLATFORM_LABEL[platform]}</span>
                                <span className="tabular-nums text-muted-foreground">
                                    {formatNumber(count, locale)} · {formatPercent(share, locale)}
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={`h-full rounded-full ${PLATFORM_TONE[platform].split(' ')[0]}`}
                                    style={{ width: `${share}%` }}
                                    role="presentation"
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </DashboardDataState>
    );
}

function TrendingWidget() {
    const t = useTranslations('dashboard');
    const locale = useUrlLocale();
    const { data, isLoading, isError, refetch } = useForMeTrendFeed(DASHBOARD_TRENDS_WINDOW, false);
    const topics = data?.topics?.slice(0, 4) ?? [];

    return (
        <DashboardDataState
            isLoading={isLoading}
            error={isError ? new Error(t('trendingWidget.error')) : null}
            isEmpty={topics.length === 0}
            emptyTitle={t('trendingWidget.emptyTitle')}
            emptyDescription={t('trendingWidget.emptyDescription')}
            emptyIcon={Flame}
            emptyAction={{
                label: t('trendingWidget.emptyAction'),
                onClick: () => {
                    window.location.href = '/onboarding?edit=1';
                },
            }}
            onRetry={() => void refetch()}
            loadingFallback={
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                </div>
            }
        >
            <ul className="divide-y divide-border/40">
                {topics.map((topic) => (
                    <li key={topic.topic} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{topic.topic}</p>
                            <p className="truncate text-xs text-muted-foreground">
                                {/* Brand constants: the platform enum is the
                                    name, and it stays Latin in both locales.
                                    Rendered raw to keep the English floor
                                    byte-identical (AR-027). */}
                                {(topic.matchedPlatforms.length > 0
                                    ? topic.matchedPlatforms
                                    : topic.platforms
                                ).join(' · ')}
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-warning/30 bg-warning/10 text-[10px] font-semibold text-warning"
                        >
                            {t('trendingWidget.score', {
                                score: formatNumber(topic.viralScore, locale),
                            })}
                        </Badge>
                    </li>
                ))}
            </ul>
            <div className="mt-2 text-end">
                <Link href="/trends" className="text-xs font-medium text-primary hover:underline">
                    {t('trendingWidget.explore')}{' '}
                    <DirIcon name="ArrowRight" className="ms-0.5 inline size-3" aria-hidden="true" />
                </Link>
            </div>
        </DashboardDataState>
    );
}

function ActivityWidget() {
    const t = useTranslations('dashboard');
    const locale = useUrlLocale();
    const { data, isLoading, isError, refetch } = useRecentActivity(DASHBOARD_ACTIVITY_LIMIT);

    return (
        <DashboardDataState
            isLoading={isLoading}
            error={isError ? new Error(t('activityWidget.error')) : null}
            isEmpty={(data?.length ?? 0) === 0}
            emptyTitle={t('activityWidget.emptyTitle')}
            emptyDescription={t('activityWidget.emptyDescription')}
            emptyIcon={Zap}
            onRetry={() => void refetch()}
            loadingFallback={
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                </div>
            }
        >
            <ul className="divide-y divide-border/40">
                {(data ?? []).map((item: RecentActivityItem) => {
                    const when = formatRelativeTime(item.createdAt, locale);
                    return (
                        <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    {item.type === 'project' ? (
                                        <FileText className="size-3.5" aria-hidden="true" />
                                    ) : (
                                        <Zap className="size-3.5" aria-hidden="true" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{item.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {item.type === 'project'
                                            ? t(ACTIVITY_TYPE_KEYS.project)
                                            : t(ACTIVITY_TYPE_KEYS.script)}{' '}
                                        ·{' '}
                                        <time dateTime={item.createdAt} title={when.absolute}>
                                            {when.relative}
                                        </time>
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-[10px] font-semibold capitalize text-primary"
                            >
                                {projectStatusLabel(t, item.status)}
                            </Badge>
                        </li>
                    );
                })}
            </ul>
        </DashboardDataState>
    );
}

function UpcomingWidget() {
    const t = useTranslations('dashboard');
    const locale = useUrlLocale();
    const { data, isLoading, isError, refetch } = useDashboardStats();
    const events = data?.upcomingEvents ?? [];

    return (
        <DashboardDataState
            isLoading={isLoading}
            error={isError ? new Error(t('upcomingWidget.error')) : null}
            isEmpty={events.length === 0}
            emptyTitle={t('upcomingWidget.emptyTitle')}
            emptyDescription={t('upcomingWidget.emptyDescription')}
            emptyIcon={Calendar}
            onRetry={() => void refetch()}
            loadingFallback={<Skeleton className="h-24 w-full rounded-xl" />}
        >
            <ul className="space-y-2">
                {events.slice(0, 4).map((event) => {
                    const when = new Date(event.scheduledDate);
                    return (
                        <li key={event._id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40">
                            <div className="w-10 shrink-0 text-center">
                                <p className="text-[9px] font-bold uppercase text-muted-foreground">
                                    {formatMonth(when, locale)}
                                </p>
                                <p className="text-base font-black leading-none">{when.getDate()}</p>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{event.title}</p>
                                <p className="text-[10px] capitalize text-muted-foreground">
                                    {plannerStatusLabel(t, event.status)}
                                </p>
                            </div>
                            {event.platform ? (
                                <Badge variant="outline" className="h-4 px-1.5 text-[9px] capitalize">
                                    {event.platform}
                                </Badge>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </DashboardDataState>
    );
}

function QuickActionsWidget() {
    const t = useTranslations('dashboard');
    const actions = [
        {
            key: 'script',
            titleKey: 'quickActions.script.title',
            subKey: 'quickActions.script.sub',
            icon: Zap,
            href: '/scripts',
            tone: 'bg-primary/10 text-primary',
        },
        {
            key: 'trends',
            titleKey: 'quickActions.trends.title',
            subKey: 'quickActions.trends.sub',
            icon: Lightbulb,
            href: '/trends',
            tone: 'bg-warning/10 text-warning',
        },
        {
            key: 'project',
            titleKey: 'quickActions.project.title',
            subKey: 'quickActions.project.sub',
            icon: Plus,
            href: '/projects/new',
            tone: 'bg-success/10 text-success',
        },
        {
            key: 'team',
            titleKey: 'quickActions.team.title',
            subKey: 'quickActions.team.sub',
            icon: Users,
            href: '/team',
            tone: 'bg-brand-violet/10 text-brand-violet',
        },
    ] as const;

    return (
        <ul className="grid gap-2 sm:grid-cols-2">
            {actions.map((action) => (
                <li key={action.key}>
                    <Link
                        href={action.href}
                        className="flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-all hover:border-primary/30 hover:bg-muted/40"
                    >
                        <div className={`${action.tone} shrink-0 rounded-lg p-2`}>
                            <action.icon className="size-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                {t(action.titleKey)}
                            </p>
                            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                                {t(action.subKey)}
                            </p>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function HealthWidget() {
    const t = useTranslations('dashboard');
    const { data, isPending, isError, refetch } = useHealthReady();

    if (isPending) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-3 w-40" />
            </div>
        );
    }

    const degraded = isError || data?.status !== 'ready';
    const databaseKey = data
        ? DATABASE_STATE_KEYS[data.checks.database as keyof typeof DATABASE_STATE_KEYS]
        : undefined;
    const databaseLabel = data
        ? databaseKey
            ? t(databaseKey)
            : data.checks.database
        : '';
    const label = isError
        ? t('health.unavailable')
        : data.status === 'ready'
            ? t('health.ready')
            : t('health.degraded', { state: databaseLabel });

    return (
        <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
                degraded ? 'border-warning/20 bg-warning/5' : 'border-success/20 bg-success/5'
            }`}
            data-state={degraded ? 'degraded' : 'ready'}
        >
            <div className={`size-2 rounded-full ${degraded ? 'bg-warning' : 'bg-success'}`} />
            <p className={`text-xs font-semibold ${degraded ? 'text-warning' : 'text-success'}`}>
                {label}
            </p>
            {isError ? (
                <Button variant="ghost" size="sm" className="ms-auto h-7 px-2 text-xs" onClick={() => void refetch()}>
                    <RotateCcw className="me-1 size-3" aria-hidden="true" /> {t('health.retry')}
                </Button>
            ) : null}
        </div>
    );
}

/**
 * T20: the dashboard's below-the-fold widgets are one lazy module. The page
 * shell, metrics and project list stay server-visible/first-load; everything
 * else is fetched and hydrated after the initial paint. `DashboardWidget`
 * keeps a single dynamic boundary so the client graph gets one shared chunk
 * instead of one per widget.
 */
export function DashboardWidget({ id }: { id: LazyWidgetId }) {
    switch (id) {
        case 'status':
            return <StatusWidget />;
        case 'platforms':
            return <PlatformsWidget />;
        case 'trending':
            return <TrendingWidget />;
        case 'activity':
            return <ActivityWidget />;
        case 'upcoming':
            return <UpcomingWidget />;
        case 'quickActions':
            return <QuickActionsWidget />;
        case 'health':
            return <HealthWidget />;
        default:
            return null;
    }
}
