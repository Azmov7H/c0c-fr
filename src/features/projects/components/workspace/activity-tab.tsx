'use client';

import { useUrlLocale } from '@/i18n/locale';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Activity,
    FileText,
    Image as ImageIcon,
    Mail,
    MailCheck,
    MailX,
    Music,
    Shield,
    UserMinus,
    UserPlus,
} from 'lucide-react';

import { DirIcon } from '@/components/icons/dir-icon';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toApiError } from '@/lib/api-error';

import { useProjectActivity } from '../../hooks/use-collaboration';
import type { ProjectActivityType } from '../../types';
import {
    activityFilterLabel,
    activityTypeLabel,
    workspaceAbsoluteTime,
    workspaceRelativeTime,
} from '../../lib/workspace-labels';

/** The icon is decoration; the words come from `activity.types` in the catalog. */
const TYPE_ICON: Record<ProjectActivityType, typeof Activity> = {
    member_added: UserPlus,
    member_removed: UserMinus,
    member_role_changed: Shield,
    invite_created: Mail,
    invite_accepted: MailCheck,
    invite_revoked: MailX,
    script_generated: FileText,
    thumbnail_generated: ImageIcon,
    audio_generated: Music,
};

/** Stable wire values — the visible labels come from the catalog. */
const FILTERS: readonly ('all' | ProjectActivityType)[] = [
    'all',
    'member_added',
    'member_removed',
    'member_role_changed',
    'invite_created',
    'invite_accepted',
    'invite_revoked',
    'script_generated',
    'thumbnail_generated',
    'audio_generated',
];

export function ActivityTab({ projectId }: { projectId: string }) {
    const locale = useUrlLocale();
    const t = useTranslations('workspace');
    const [filter, setFilter] = useState<'all' | ProjectActivityType>('all');
    const [page, setPage] = useState(1);
    const query = useProjectActivity(projectId, {
        type: filter === 'all' ? undefined : filter,
        page,
    });

    const items = query.data?.items ?? [];
    const meta = query.data?.meta;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Activity className="size-5" aria-hidden="true" />
                    {t('activity.title')}
                </CardTitle>
                <Select
                    value={filter}
                    onValueChange={(value) => {
                        setFilter(value as 'all' | ProjectActivityType);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="h-11 w-full sm:w-56" aria-label={t('activity.filterAria')}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FILTERS.map((value) => (
                            <SelectItem key={value} value={value}>
                                {activityFilterLabel(t, value)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {query.isLoading ? (
                    <div className="space-y-4" role="status" aria-label={t('activity.loading')}>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <Skeleton className="size-9 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : query.isError ? (
                    <Alert variant="destructive">
                        <AlertTitle>{t('activity.errorTitle')}</AlertTitle>
                        <AlertDescription className="flex items-center gap-3">
                            {toApiError(query.error, t('activity.errorFallback')).message}
                            <Button variant="outline" className="h-11" onClick={() => query.refetch()}>
                                {t('activity.retry')}
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : items.length === 0 ? (
                    filter === 'all' ? (
                        <EmptyState
                            icon={Activity}
                            title={t('activity.emptyTitle')}
                            description={t('activity.emptyDescription')}
                        />
                    ) : (
                        <EmptyState
                            icon={Activity}
                            title={t('activity.filteredTitle')}
                            description={t('activity.filteredDescription')}
                            action={{ label: t('activity.showAll'), onClick: () => setFilter('all') }}
                        />
                    )
                ) : (
                    <>
                        <ul className="divide-y divide-border/60" aria-label={t('activity.listAria')}>
                            {items.map((item) => {
                                const Icon = TYPE_ICON[item.type] ?? Activity;
                                const actorName = item.actor
                                    ? [item.actor.firstName, item.actor.lastName].filter(Boolean).join(' ') || item.actor.email
                                    : t('activity.someone');
                                const relative = workspaceRelativeTime(t, item.createdAt, locale);
                                const absolute = workspaceAbsoluteTime(t, item.createdAt, locale);
                                const label = activityTypeLabel(t, item.type);
                                return (
                                    <li key={item.id} className="flex items-start gap-3 py-4">
                                        <Avatar className="size-9">
                                            {item.actor?.avatar && <AvatarImage src={item.actor.avatar} alt="" />}
                                            <AvatarFallback>
                                                {actorName.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                <span className="font-medium"><bdi>{actorName}</bdi></span> {label}{' '}
                                                <span className="font-medium"><bdi>{item.target}</bdi></span>
                                                {item.role ? t('activity.asRole', { role: item.role }) : ''}.
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground" title={absolute}>
                                                {relative} · {absolute}
                                            </p>
                                        </div>
                                        <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    </li>
                                );
                            })}
                        </ul>
                        {meta && meta.total > meta.limit && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    {t('activity.pageOf', {
                                        page: meta.page,
                                        total: Math.max(1, meta.totalPages),
                                        count: meta.total,
                                    })}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        disabled={!meta.hasPrevPage}
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    >
                                        <DirIcon name="ChevronLeft" className="me-1 size-4" aria-hidden="true" />
                                        {t('activity.previous')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        disabled={!meta.hasNextPage}
                                        onClick={() => setPage((current) => current + 1)}
                                    >
                                        {t('activity.next')}
                                        <DirIcon name="ChevronRight" className="ms-1 size-4" aria-hidden="true" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
