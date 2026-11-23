import { serverGet } from '@/lib/server-api';
import { OverviewDashboard } from '@/features/admin/components/overview-dashboard';
import { parseOverviewRange } from '@/features/admin/lib/overview-data';
import type {
    OverviewAccountRow,
    OverviewAiOperationRow,
    OverviewAnomaly,
    OverviewAuditRow,
    OverviewTransactionRow,
    OverviewUserRow,
} from '@/features/admin/lib/overview-data';

/**
 * Admin Overview — AP-021, spec §4.1: "Overview" page — header (title, range
 * selector, refresh, last updated), KPI row (StatCards), charts (signups
 * area / AI requests line / credit movements stacked bar), needs attention,
 * recent audit. Server component: fetches the read-only surfaces via
 * `serverGet` (spec §5.1 — the backend re-checks). Each fetch is isolated
 * (`fetchSafe`) so a role without the permission renders the section absent
 * — nothing (including permission details) leaks through (spec §5.2).
 */

async function fetchSafe<T>(path: string, params?: object): Promise<T | undefined> {
    try {
        return await serverGet<T>(path, params);
    } catch {
        return undefined;
    }
}

export default async function OverviewPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string | null }>;
}) {
    const { range } = await searchParams;
    const parsedRange = parseOverviewRange(range ?? null);
    const [accounts, transactions, users, aiOperations, audits, anomalies] = await Promise.all([
        fetchSafe<OverviewAccountRow[]>('/admin/credits/accounts', { limit: 200 }),
        fetchSafe<OverviewTransactionRow[]>('/admin/credits/transactions', { limit: 100 }),
        fetchSafe<OverviewUserRow[]>('/admin/users', { limit: 100 }),
        fetchSafe<OverviewAiOperationRow[]>('/admin/ai-operations', { limit: 100 }),
        fetchSafe<OverviewAuditRow[]>('/admin/audit-logs', { limit: 10 }),
        fetchSafe<{ anomalies: OverviewAnomaly[] }>('/admin/credits/anomalies'),
    ]);
    return (
        <OverviewDashboard
            accounts={accounts ?? []}
            transactions={transactions ?? []}
            users={users ?? []}
            aiOperations={aiOperations ?? []}
            audits={audits ?? []}
            anomalies={anomalies?.anomalies ?? []}
            rangeValue={parsedRange.value}
            lastUpdatedAt={new Date().toISOString()}
        />
    );
}
