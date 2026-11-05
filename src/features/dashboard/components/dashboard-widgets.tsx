'use client';

import Link from 'next/link';
import {
    ArrowRight,
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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
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
    EMPTY_PREFERENCES,
    orderPlatforms,
} from '../lib/widget-layout';
import { formatNumber, formatPercent, formatRelativeTime } from '../lib/format';

const PLATFORM_LABEL: Record<Platform, string> = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
};

const PLATFORM_TONE: Record<Platform, string> = {
    youtube: 'bg-negative/10 text-negative',
    tiktok: 'bg-info/10 text-info',
    instagram: 'bg-brand-violet/10 text-brand-violet',
};

export type LazyWidgetId =
    | 'status'
    | 'platforms'
    | 'trending'
    | 'activity'
    | 'upcoming'
    | 'quickActions'
    | 'health';

function StatusWidget() {
    const { data, isLoading, isError, refetch } = useDashboardStats();
    const rows: Array<{ key: ProjectStatus; label: string; count: number }> = [
        { key: 'draft', label: 'Draft', count: data?.overview.draftProjects ?? 0 },
        { key: 'processing', label: 'In progress', count: data?.overview.activeProjects ?? 0 },
        { key: 'completed', label: 'Completed', count: data?.overview.completedProjects ?? 0 },
        { key: 'archived', label: 'Archived', count: data?.overview.archivedProjects ?? 0 },
    ];
    const total = rows.reduce((sum, row) => sum + row.count, 0);

    return (
        <DataState
            isLoading={isLoading}
            error={isError ? new Error('Project status could not be loaded.') : null}
            onRetry={() => void refetch()}
            loadingFallback={<Skeleton className="h-36 w-full rounded-xl" />}
        >
            <ul className="space-y-3">
                {rows.map((row) => {
                    const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
                    return (
                        <li key={row.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{row.label}</span>
                                <span className="tabular-nums text-muted-foreground">
                                    {formatNumber(row.count)}
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
        </DataState>
    );
}

function PlatformsWidget() {
    const { data, isLoading, isError, refetch } = useDashboardStats();
    const preferences = useDashboardPreferences().data ?? EMPTY_PREFERENCES;
    const platforms = orderPlatforms(preferences.preferredPlatforms);
    const counts = data?.projectsByPlatform ?? { youtube: 0, tiktok: 0, instagram: 0 };
    const total = platforms.reduce((sum, platform) => sum + counts[platform], 0);

    return (
        <DataState
            isLoading={isLoading}
            error={isError ? new Error('Platform split could not be loaded.') : null}
            isEmpty={!isLoading && total === 0}
            emptyTitle="No projects by platform yet"
            emptyDescription="Create a project and it will appear in this breakdown."
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
                                    {formatNumber(count)} · {formatPercent(share)}
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
        </DataState>
    );
}

function TrendingWidget() {
    const { data, isLoading, isError, refetch } = useForMeTrendFeed(DASHBOARD_TRENDS_WINDOW, false);
    const topics = data?.topics?.slice(0, 4) ?? [];

    return (
        <DataState
            isLoading={isLoading}
            error={isError ? new Error('Your trend feed could not be loaded.') : null}
            isEmpty={topics.length === 0}
            emptyTitle="No trends measured for you yet"
            emptyDescription="Pick interests in onboarding and we can rank topics against them."
            emptyIcon={Flame}
            emptyAction={{
                label: 'Update your interests',
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
                                {topic.matchedPlatforms.length > 0
                                    ? topic.matchedPlatforms.join(' · ')
                                    : topic.platforms.join(' · ')}
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-warning/30 bg-warning/10 text-[10px] font-semibold text-warning"
                        >
                            {formatNumber(topic.viralScore)} score
                        </Badge>
                    </li>
                ))}
            </ul>
            <div className="mt-2 text-right">
                <Link href="/trends" className="text-xs font-medium text-primary hover:underline">
                    Explore trends <ArrowRight className="ml-0.5 inline size-3" aria-hidden="true" />
                </Link>
            </div>
        </DataState>
    );
}

function ActivityWidget() {
    const { data, isLoading, isError, refetch } = useRecentActivity(DASHBOARD_ACTIVITY_LIMIT);

    return (
        <DataState
            isLoading={isLoading}
            error={isError ? new Error('Recent activity could not be loaded.') : null}
            isEmpty={(data?.length ?? 0) === 0}
            emptyTitle="No activity yet"
            emptyDescription="Generate a script or create a project to start the feed."
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
                    const when = formatRelativeTime(item.createdAt);
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
                                        {item.type} ·{' '}
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
                                {item.status || 'new'}
                            </Badge>
                        </li>
                    );
                })}
            </ul>
        </DataState>
    );
}

function UpcomingWidget() {
    const { data, isLoading, isError, refetch } = useDashboardStats();
    const events = data?.upcomingEvents ?? [];

    return (
        <DataState
            isLoading={isLoading}
            error={isError ? new Error('Upcoming content could not be loaded.') : null}
            isEmpty={events.length === 0}
            emptyTitle="Nothing scheduled"
            emptyDescription="Plan a publish date and it will show up here."
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
                                    {when.toLocaleString('en-US', { month: 'short' })}
                                </p>
                                <p className="text-base font-black leading-none">{when.getDate()}</p>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{event.title}</p>
                                <p className="text-[10px] capitalize text-muted-foreground">{event.status}</p>
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
        </DataState>
    );
}

function QuickActionsWidget() {
    const actions = [
        { title: 'Generate Script', sub: 'AI content engine', icon: Zap, href: '/scripts', tone: 'bg-primary/10 text-primary' },
        { title: 'Explore Trends', sub: 'What is rising', icon: Lightbulb, href: '/trends', tone: 'bg-warning/10 text-warning' },
        { title: 'New Project', sub: 'Start from an idea', icon: Plus, href: '/projects/new', tone: 'bg-success/10 text-success' },
        { title: 'Team', sub: 'Invite collaborators', icon: Users, href: '/team', tone: 'bg-brand-violet/10 text-brand-violet' },
    ];

    return (
        <ul className="grid gap-2 sm:grid-cols-2">
            {actions.map((action) => (
                <li key={action.title}>
                    <Link
                        href={action.href}
                        className="flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-all hover:border-primary/30 hover:bg-muted/40"
                    >
                        <div className={`${action.tone} shrink-0 rounded-lg p-2`}>
                            <action.icon className="size-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{action.title}</p>
                            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                                {action.sub}
                            </p>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function HealthWidget() {
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
    const label = isError
        ? 'Status unavailable — the API could not be reached'
        : data.status === 'ready'
            ? 'API ready — database connected'
            : `Degraded — database ${data.checks.database}`;

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
                <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => void refetch()}>
                    <RotateCcw className="mr-1 size-3" aria-hidden="true" /> Retry
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
