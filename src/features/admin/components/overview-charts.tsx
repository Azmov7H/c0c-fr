'use client';

import { useTranslations } from 'next-intl';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';

import { useAdminMe } from '@/features/admin/hooks/use-admin';
import { hasAdminPermission } from '@/features/admin/lib/permissions';
import { formatCredits } from '@/lib/format';
import { useUrlLocale } from '@/i18n/locale';
import { daySeries, type CreditMovementSeries, type OverviewRange } from '@/features/admin/lib/overview-data';

/**
 * Admin Overview charts (spec §4.1): credit movements (stacked bar, by kind),
 * AI requests (line), signups (area). Permission-gated: the financial chart
 * needs `credits.read`, AI with `ai.operations.read`, users with `users.read`
 * (spec §5.2). Values are integer-formatted via the format layer.
 */
export function OverviewCharts({
    range,
    creditMovementSeries,
    aiCounts,
    signupCounts,
}: {
    range: OverviewRange;
    creditMovementSeries: CreditMovementSeries;
    aiCounts: number[];
    signupCounts: number[];
}) {
    const t = useTranslations('admin');
    const me = useAdminMe();
    const locale = useUrlLocale();
    if (!me) return null;

    const hasFinancial = hasAdminPermission(me.permissions, 'credits.read');
    const hasAi = hasAdminPermission(me.permissions, 'ai.operations.read');
    const hasUsers = hasAdminPermission(me.permissions, 'users.read');

    const barData = daySeries(range.days).map((day, i) => {
        const point: Record<string, string | number> = { day };
        for (const kind of Object.keys(creditMovementSeries.series)) {
            point[kind] = creditMovementSeries.series[kind][i] ?? 0;
        }
        return point;
    });
    const lineData = daySeries(range.days).map((day, i) => ({ day, requests: aiCounts[i] ?? 0 }));
    const signupData = daySeries(range.days).map((day, i) => ({ day, signups: signupCounts[i] ?? 0 }));

    return (
        <section className="space-y-5">
            {hasFinancial && Object.keys(creditMovementSeries.series).length > 0 ? (
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        {t('pages.overview.charts.creditMovements')}
                    </h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barData}>
                            <XAxis dataKey="day" fontSize={12} tickLine={false} />
                            <YAxis fontSize={12} tickLine={false} />
                            <RechartsTooltip formatter={(value) => formatCredits(Number(value), locale)} />
                            {Object.keys(creditMovementSeries.series).map((kind) => (
                                <Bar key={kind} dataKey={kind} stackId="movements" />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : null}
            {hasAi && aiCounts.some((c) => c > 0) ? (
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        {t('pages.overview.charts.aiRequests')}
                    </h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={lineData}>
                            <XAxis dataKey="day" fontSize={12} tickLine={false} />
                            <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                            <RechartsTooltip />
                            <Line
                                type="monotone"
                                dataKey="requests"
                                stroke="currentColor"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : null}
            {hasUsers && signupCounts.some((c) => c > 0) ? (
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        {t('pages.overview.charts.signups')}
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={signupData}>
                            <XAxis dataKey="day" fontSize={12} tickLine={false} />
                            <RechartsTooltip />
                            <Area dataKey="signups" stroke="currentColor" fill="currentColor" fillOpacity={0.15} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : null}
        </section>
    );
}
