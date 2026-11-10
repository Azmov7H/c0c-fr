'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { DataState } from '@/components/shared/data-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<PlannerEvent['status'], string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-info/10 text-info',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-negative/10 text-negative',
};

const monthLabel = (date: Date) =>
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

/** `YYYY-MM-DD` of a grid cell in the browser's wall-calendar (no zone override needed). */
const cellKey = (year: number, monthIndex: number, day: number) =>
    new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(year, monthIndex, day));

// Stable render anchors so the memoised grid doesn't rebuild on every render.
const useMonthWindow = (monthOffset: number) =>
    useMemo(() => {
        const now = new Date();
        const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        return { now, month };
    }, [monthOffset]);

/**
 * P02.2: reminders are stored metadata — no dispatch worker exists, so
 * the UI carries an explicit "not dispatched" note instead of a silent
 * no-op or a fake promise.
 */
function ReminderNote({ event }: { event: PlannerEvent }) {
    if (!event.reminders?.length) return null;
    return (
        <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground" role="note">
            <Bell className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
            Reminder stored as metadata — not dispatched yet (no scheduler).
        </p>
    );
}

function EventRow({
    event,
    showDay,
}: {
    event: PlannerEvent;
    showDay?: boolean;
}) {
    return (
        <div className="flex flex-1 flex-col">
            <p className="text-sm font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">
                <Clock className="mr-1 inline size-3" aria-hidden="true" />
                {showDay && event.scheduledDay ? `${event.scheduledDay} · ` : ''}
                {formatRelativeTime(event.scheduledDate).absolute}
                {event.timezone ? ` (${event.timezone})` : ''}
                {' · '}
                {event.type}
            </p>
            <ReminderNote event={event} />
        </div>
    );
}

/**
 * P02.6 — calendar and list are two renders of ONE hook's data and ONE
 * server-computed day key (`scheduledDay`), so the two views can never
 * disagree on an event's day: neither view computes anything itself.
 * Layout is responsive by CSS (list on mobile, grid on desktop — the
 * mobile list chip is generated from the same array).
 */
export function ContentPlanner() {
    const projects = useProjects({ limit: 100 });
    const [projectId, setProjectId] = useState('all');
    const [monthOffset, setMonthOffset] = useState(0);

    // P02.6: the window is derived once per offset change (hook hygiene).
    const { now, month } = useMonthWindow(monthOffset);
    const year = now.getFullYear();
    const monthIndex = now.getMonth() + monthOffset;
    const nextMonth = new Date(year, monthIndex + 1, 1);

    const events = usePlannerEvents({
        limit: 100,
        startDate: month.toISOString(),
        endDate: nextMonth.toISOString(),
        projectId: projectId === 'all' ? undefined : projectId,
    });

    const eventsAll = useMemo(
        () => events.data?.data ?? [],
        [events.data]
    );
    const list = useMemo(
        () =>
            eventsAll
                .slice()
                .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
        [eventsAll]
    );

    // Calendar grid (desktop): events settle on cells by scheduledDay.
    const byDay = useMemo(() => {
        const map = new Map<string, PlannerEvent[]>();
        for (const event of list) {
            const day = event.scheduledDay;
            if (!day) continue;
            const bucket = map.get(day);
            if (bucket) bucket.push(event);
            else map.set(day, [event]);
        }
        return map;
    }, [list]);

    const weekRows = useMemo(() => {
        const firstWeekday = (month.getDay() + 6) % 7; // Monday-first
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const cells: Array<{ key: string; day: number; inMonth: boolean; today: boolean }> = [];
        const total = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
        const todayKey = cellKey(year, now.getMonth(), now.getDate());
        for (let i = 0; i < total; i += 1) {
            const day = i + 1 - firstWeekday;
            const date = new Date(year, monthIndex, day);
            const key = cellKey(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            cells.push({
                key,
                day: date.getDate(),
                inMonth: date.getMonth() === ((monthIndex % 12) + 12) % 12,
                today: key === todayKey,
            });
        }
        return Array.from({ length: total / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
    }, [month, year, monthIndex, now]);

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
                <DataState
                    isLoading={events.isLoading}
                    error={events.error}
                    onRetry={() => events.refetch()}
                    isEmpty={!events.isLoading && !events.error && list.length === 0}
                    emptyIcon={Calendar}
                    emptyTitle="Nothing scheduled this month"
                    emptyDescription="Plan events from a project workspace or create one when the planner flow ships."
                    skeletonRows={4}
                    className="min-h-0"
                >
                    {/* Desktop: month grid reading scheduledDay (P02.3 parity key). */}
                    <div className="hidden md:block" data-testid="planner-calendar">
                        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/50 bg-border/50" role="grid" aria-label="Calendar month grid">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                <div key={day} className="bg-card px-2 py-1 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                            {weekRows.flat().map((cell) => (
                                <div
                                    key={cell.key}
                                    className={cn(
                                        'min-h-24 bg-card p-1.5',
                                        !cell.inMonth && 'bg-muted/30 text-muted-foreground'
                                    )}
                                    data-day={cell.key}
                                >
                                    <span className={cn('text-xs', cell.today && 'font-bold text-primary')}>
                                        {cell.day}
                                    </span>
                                    {(byDay.get(cell.key) ?? []).map((event) => (
                                        <p
                                            key={event._id}
                                            className="truncate rounded bg-primary/10 px-1 py-0.5 text-[11px] text-primary"
                                            title={`${event.title} — ${cell.key} (${event.timezone ?? 'UTC'})`}
                                        >
                                            {event.title}
                                        </p>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile: the SAME events, grouped by the SAME scheduledDay. */}
                    <ul className="divide-y divide-border/60 md:hidden" data-testid="planner-list">
                        {list.map((event) => (
                            <li key={event._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                <EventRow event={event} showDay />
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
                </DataState>
            </SectionCard>
        </div>
    );
}
