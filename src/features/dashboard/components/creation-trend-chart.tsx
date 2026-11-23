'use client';

import { useUrlLocale } from '@/i18n/locale';
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatNumber, formatShortMonthDay } from '../lib/format';

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
    const t = useTranslations('dashboard');
    const locale = useUrlLocale();
    const config = {
        count: { label: t('chart.series'), color: 'var(--chart-1)' },
    } satisfies ChartConfig;
    const reducedMotion = usePrefersReducedMotion();
    const total = data.reduce((sum, point) => sum + point.count, 0);
    const peak = data.reduce<CreationTrendPoint | null>(
        (best, point) => (best === null || point.count > best.count ? point : best),
        null
    );

    const summary =
        data.length === 0
            ? t('chart.summaryEmpty')
            : t('chart.summary', { count: total, value: formatNumber(total, locale) }) +
              (peak
                  ? ` ${t('chart.busiest', {
                        date: formatShortMonthDay(peak.date, locale),
                        count: formatNumber(peak.count, locale),
                    })}`
                  : '');

    return (
        <figure className="space-y-3">
            <figcaption className="text-xs text-muted-foreground">{summary}</figcaption>

            <ChartContainer config={config} className="h-48 w-full">
                <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) => formatShortMonthDay(String(value), locale)}
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
                                labelFormatter={(value) => formatShortMonthDay(String(value), locale)}
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
                    {t('chart.viewTable')}
                </summary>
                <table className="mt-2 w-full border-collapse text-start">
                    <caption className="sr-only">{t('chart.caption')}</caption>
                    <thead>
                        <tr className="border-b border-border/60">
                            <th scope="col" className="py-1 font-medium">{t('chart.date')}</th>
                            <th scope="col" className="py-1 text-right font-medium">
                                {t('chart.projects')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((point) => (
                            <tr key={point.date} className="border-b border-border/30 last:border-0">
                                <td className="py-1">{formatShortMonthDay(point.date, locale)}</td>
                                <td className="py-1 text-right tabular-nums">
                                    {formatNumber(point.count, locale)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}
