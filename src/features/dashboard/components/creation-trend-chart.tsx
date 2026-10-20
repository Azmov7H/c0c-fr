'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatNumber, formatShortMonthDay } from '../lib/format';

const config = {
    count: { label: 'Projects created', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export interface CreationTrendPoint {
    date: string;
    count: number;
}

function subscribeToReducedMotion(callback: () => void): () => void {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    query.addEventListener('change', callback);
    return () => query.removeEventListener('change', callback);
}

function getReducedMotionSnapshot(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
    return false;
}

function usePrefersReducedMotion(): boolean {
    return React.useSyncExternalStore(
        subscribeToReducedMotion,
        getReducedMotionSnapshot,
        getReducedMotionServerSnapshot
    );
}

/**
 * Lazy-loaded (see `dashboard-view.tsx`): Recharts is the bundle risk on an
 * authenticated route, so it must not be in the first-load chunk (T14 §4/§6).
 *
 * The chart is never the only way to read a number: a text summary and a data
 * table are always in the DOM, and the table is reachable without hover.
 */
export default function CreationTrendChart({ data }: { data: CreationTrendPoint[] }) {
    const reducedMotion = usePrefersReducedMotion();
    const total = data.reduce((sum, point) => sum + point.count, 0);
    const peak = data.reduce<CreationTrendPoint | null>(
        (best, point) => (best === null || point.count > best.count ? point : best),
        null
    );

    const summary =
        data.length === 0
            ? 'No projects were created in the last seven days.'
            : `${formatNumber(total)} project${total === 1 ? '' : 's'} created in the last seven days.` +
              (peak ? ` Busiest day: ${formatShortMonthDay(peak.date)} with ${formatNumber(peak.count)}.` : '');

    return (
        <figure className="space-y-3">
            <figcaption className="text-xs text-muted-foreground">{summary}</figcaption>

            <ChartContainer config={config} className="h-48 w-full">
                <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatShortMonthDay}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={28}
                    />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(value) => formatShortMonthDay(String(value))}
                            />
                        }
                    />
                    <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={!reducedMotion}
                    />
                </BarChart>
            </ChartContainer>

            <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View as table
                </summary>
                <table className="mt-2 w-full border-collapse text-left">
                    <caption className="sr-only">Projects created per day, last seven days</caption>
                    <thead>
                        <tr className="border-b border-border/60">
                            <th scope="col" className="py-1 font-medium">Date</th>
                            <th scope="col" className="py-1 text-right font-medium">Projects</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((point) => (
                            <tr key={point.date} className="border-b border-border/30 last:border-0">
                                <td className="py-1">{formatShortMonthDay(point.date)}</td>
                                <td className="py-1 text-right tabular-nums">
                                    {formatNumber(point.count)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}
