'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePlannerEvents } from '@/features/planner/hooks/use-planner';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { formatRelativeTime } from '@/lib/relative-time';
import type { PlannerEvent } from '@/features/planner/services/planner.service';

const STATUS_STYLE: Record<PlannerEvent['status'], string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-info/10 text-info',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-negative/10 text-negative',
};

const monthLabel = (date: Date) =>
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

export function ContentPlanner() {
    const projects = useProjects({ limit: 100 });
    const [projectId, setProjectId] = useState('all');
    const [monthOffset, setMonthOffset] = useState(0);

    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);

    const events = usePlannerEvents({
        limit: 100,
        startDate: month.toISOString(),
        endDate: nextMonth.toISOString(),
        projectId: projectId === 'all' ? undefined : projectId,
    });

    const list = (events.data?.data ?? []).slice().sort(
        (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Content planner"
                description="Scheduled work for your projects, straight from the API."
            />

            <div className="flex flex-wrap items-center gap-3">
                <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="h-11 w-64" aria-label="Filter by project">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All projects</SelectItem>
                        {(projects.data?.data ?? []).map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                                {project.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="size-11" aria-label="Previous month" onClick={() => setMonthOffset((value) => value - 1)}>
                        <ChevronLeft className="size-4" aria-hidden="true" />
                    </Button>
                    <span className="min-w-40 text-center text-sm font-medium">{monthLabel(month)}</span>
                    <Button variant="outline" size="icon" className="size-11" aria-label="Next month" onClick={() => setMonthOffset((value) => value + 1)}>
                        <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <SectionCard
                title={
                    <span className="flex items-center gap-2">
                        <Calendar className="size-4 text-primary" aria-hidden="true" />
                        {monthLabel(month)}
                    </span>
                }
            >
                {events.isLoading ? (
                    <div className="space-y-3" role="status" aria-label="Loading events">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <EmptyState
                        className="min-h-0 border-0 bg-transparent p-6"
                        icon={Calendar}
                        title="Nothing scheduled this month"
                        description="Plan events from a project workspace or create one when the planner flow ships."
                    />
                ) : (
                    <ul className="divide-y divide-border/60">
                        {list.map((event) => (
                            <li key={event._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                <div>
                                    <p className="text-sm font-medium">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelativeTime(event.scheduledDate).absolute} · {event.type}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={STATUS_STYLE[event.status]}>
                                        {event.status.replace('_', ' ')}
                                    </Badge>
                                    {event.projectId && (
                                        <Button asChild variant="ghost" className="h-11">
                                            <Link href={`/projects/${event.projectId}`}>Open project</Link>
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>
        </div>
    );
}
