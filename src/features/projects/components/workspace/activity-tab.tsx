'use client';

import { useState } from 'react';
import {
    Activity,
    ChevronLeft,
    ChevronRight,
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
import { formatAbsoluteTime, formatRelativeTime } from '@/lib/relative-time';
import { toApiError } from '@/lib/api-error';

import { useProjectActivity } from '../../hooks/use-collaboration';
import type { ProjectActivityType } from '../../types';

const TYPE_META: Record<ProjectActivityType, { label: string; icon: typeof Activity }> = {
    member_added: { label: 'added a member', icon: UserPlus },
    member_removed: { label: 'removed a member', icon: UserMinus },
    member_role_changed: { label: 'changed a role', icon: Shield },
    invite_created: { label: 'invited someone', icon: Mail },
    invite_accepted: { label: 'accepted an invite', icon: MailCheck },
    invite_revoked: { label: 'revoked an invite', icon: MailX },
    script_generated: { label: 'generated a script', icon: FileText },
    thumbnail_generated: { label: 'generated a thumbnail', icon: ImageIcon },
    audio_generated: { label: 'generated audio', icon: Music },
};

const FILTERS: Array<{ value: 'all' | ProjectActivityType; label: string }> = [
    { value: 'all', label: 'All activity' },
    { value: 'member_added', label: 'Members added' },
    { value: 'member_removed', label: 'Members removed' },
    { value: 'member_role_changed', label: 'Role changes' },
    { value: 'invite_created', label: 'Invites sent' },
    { value: 'invite_accepted', label: 'Invites accepted' },
    { value: 'invite_revoked', label: 'Invites revoked' },
    { value: 'script_generated', label: 'Scripts' },
    { value: 'thumbnail_generated', label: 'Thumbnails' },
    { value: 'audio_generated', label: 'Audio' },
];

export function ActivityTab({ projectId }: { projectId: string }) {
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
                    Activity
                </CardTitle>
                <Select
                    value={filter}
                    onValueChange={(value) => {
                        setFilter(value as 'all' | ProjectActivityType);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="h-11 w-full sm:w-56" aria-label="Filter activity by type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FILTERS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {query.isLoading ? (
                    <div className="space-y-4" role="status" aria-label="Loading activity">
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
                        <AlertTitle>Could not load activity</AlertTitle>
                        <AlertDescription className="flex items-center gap-3">
                            {toApiError(query.error, 'Try again in a moment.').message}
                            <Button variant="outline" className="h-11" onClick={() => query.refetch()}>
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : items.length === 0 ? (
                    filter === 'all' ? (
                        <EmptyState
                            icon={Activity}
                            title="No activity yet"
                            description="Invites, member changes and generations will appear here as your team works."
                        />
                    ) : (
                        <EmptyState
                            icon={Activity}
                            title="No activity matches this filter"
                            description="Try a different activity type, or show everything."
                            action={{ label: 'Show all activity', onClick: () => setFilter('all') }}
                        />
                    )
                ) : (
                    <>
                        <ul className="divide-y divide-border/60" aria-label="Project activity">
                            {items.map((item) => {
                                const meta = TYPE_META[item.type];
                                const Icon = meta?.icon ?? Activity;
                                const actorName = item.actor
                                    ? [item.actor.firstName, item.actor.lastName].filter(Boolean).join(' ') || item.actor.email
                                    : 'Someone';
                                const relative = formatRelativeTime(item.createdAt);
                                const label = meta?.label ?? item.type.replace(/_/g, ' ');
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
                                                <span className="font-medium">{actorName}</span> {label}{' '}
                                                <span className="font-medium">{item.target}</span>
                                                {item.role ? ` as ${item.role}` : ''}.
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground" title={formatAbsoluteTime(item.createdAt)}>
                                                {relative.relative} · {relative.absolute}
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
                                    Page {meta.page} of {Math.max(1, meta.totalPages)} · {meta.total} events
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        disabled={!meta.hasPrevPage}
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    >
                                        <ChevronLeft className="mr-1 size-4" aria-hidden="true" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        disabled={!meta.hasNextPage}
                                        onClick={() => setPage((current) => current + 1)}
                                    >
                                        Next
                                        <ChevronRight className="ml-1 size-4" aria-hidden="true" />
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
