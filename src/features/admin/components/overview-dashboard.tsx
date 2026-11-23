'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RefreshCw, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { formatLocaleTag } from '@/lib/format';
import { useUrlLocale } from '@/i18n/locale';
import { useAdminMe } from '@/features/admin/hooks/use-admin';
import {
    OVERVIEW_RANGES,
    countSeries,
    creditMovementSeries,
    parseOverviewRange,
    sumAccounts,
    type OverviewRangeValue,
} from '@/features/admin/lib/overview-data';
import type {
    OverviewAccountRow,
    OverviewAiOperationRow,
    OverviewAuditRow,
    OverviewAnomaly,
    OverviewTransactionRow,
    OverviewUserRow,
} from '@/features/admin/lib/overview-data';

import { OverviewAttention } from './overview-attention';
import { OverviewAudit } from './overview-audit';
import { OverviewCharts } from './overview-charts';
import { OverviewKpis, type OverviewKpi } from './overview-kpis';

export interface OverviewDashboardProps {
    accounts: OverviewAccountRow[];
    transactions: OverviewTransactionRow[];
    users: OverviewUserRow[];
    aiOperations: OverviewAiOperationRow[];
    audits: OverviewAuditRow[];
    anomalies: OverviewAnomaly[];
    rangeValue: OverviewRangeValue;
    lastUpdatedAt: string;
}

/**
 * Admin Overview dashboard (spec §4.1) — client chrome: range selector,
 * refresh button, last-updated stamp, and the permission-gated sections.
 * Data is server-fetched by the page; `key` remounts the dashboard on range
 * change so the server's re-render is the source of the new data.
 */
export function OverviewDashboard(props: OverviewDashboardProps) {
    const t = useTranslations('admin');
    const locale = useUrlLocale();
    const router = useRouter();
    const me = useAdminMe();
    const range = parseOverviewRange(props.rangeValue);
    const { creditBalance, pendingHolds } = sumAccounts(props.accounts);
    const hasAnyData =
        props.transactions.length > 0 ||
        props.aiOperations.length > 0 ||
        props.users.length > 0 ||
        props.anomalies.length > 0;

    // KPI labels are literal catalog keys (i18n usage gate).
    const kpis: OverviewKpi[] = [
        { label: t('pages.overview.kpi.creditBalance'), value: String(creditBalance), permission: 'overview.financial.read', icon: TrendingUp },
        { label: t('pages.overview.kpi.pendingHolds'), value: String(pendingHolds), permission: 'overview.financial.read', icon: TrendingUp },
        { label: t('pages.overview.kpi.users'), value: String(props.users.length), permission: 'users.read', icon: TrendingUp },
        { label: t('pages.overview.kpi.aiRequests'), value: String(props.aiOperations.length), permission: 'ai.operations.read', icon: TrendingUp },
    ];

    const onRangeChange = (value: string) => {
        const next = OVERVIEW_RANGES.find((r) => r.value === value)?.value;
        if (next) void router.push(`?range=${next}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pages.overview.title')}
                actions={
                    <div className="flex items-center gap-3">
                        <Select value={range.value} onValueChange={onRangeChange}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">{t('pages.overview.ranges.24h')}</SelectItem>
                                <SelectItem value="7d">{t('pages.overview.ranges.7d')}</SelectItem>
                                <SelectItem value="30d">{t('pages.overview.ranges.30d')}</SelectItem>
                                <SelectItem value="90d">{t('pages.overview.ranges.90d')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => router.refresh()}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t('pages.overview.refresh')}
                        </Button>
                    </div>
                }
            />
            <p className="text-sm text-muted-foreground">
                {t('pages.overview.lastUpdated', {
                    time: new Intl.DateTimeFormat(formatLocaleTag(locale), {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }).format(new Date(props.lastUpdatedAt)),
                })}
            </p>

            <OverviewKpis me={me} kpis={kpis} />

            <OverviewCharts
                range={range}
                creditMovementSeries={creditMovementSeries(props.transactions, range)}
                aiCounts={countSeries(props.aiOperations.map((op) => new Date(op.createdAt)), range)}
                signupCounts={countSeries(props.users.map((u) => new Date(u.createdAt)), range)}
            />

            {hasAnyData ? (
                <>
                    <OverviewAttention anomalies={props.anomalies} />
                    <OverviewAudit audits={props.audits} />
                </>
            ) : (
                <EmptyState
                    title={t('pages.overview.empty')}
                    description={t('pages.overview.emptyDescription')}
                    icon={TrendingUp}
                />
            )}
        </div>
    );
}
