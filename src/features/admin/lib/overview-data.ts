/**
 * Admin Overview page — shared pure data shaping (AP-021, spec §4.1).
 *
 * All derivations live here so they are unit-testable: KPI sums and the
 * day-bucketed chart series (credit movements per kind, AI requests per day,
 * signups per day). The server page and the client components stay
 * presentational — the page fetches (spec §5.1: backend re-checks).
 */

/** Subset of `GET /admin/credits/accounts` (spec §6.1) the Overview uses. */
export interface OverviewAccountRow {
    userId: string;
    balance: number;
    held: number;
}

/** Subset of `GET /admin/credits/transactions` (spec §6.3). */
export interface OverviewTransactionRow {
    id: string;
    kind: string;
    amount: number;
    createdAt: string;
}

/** Subset of `GET /admin/ai-operations` (Branch AP-034/036). */
export interface OverviewAiOperationRow {
    id: string;
    operation: string;
    status: string;
    provider: string;
    createdAt: string;
}

/** Subset of `GET /admin/users` (AP-022 `ListUserRow`) the Overview uses. */
export interface OverviewUserRow {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    plan: string;
    createdAt: string;
    suspended?: boolean | null;
    lastSeenAt?: string | null;
}

/** Subset of `GET /admin/audit-logs` (Branch AP-050). */
export interface OverviewAuditRow {
    id: string;
    action: string;
    actor: { id: string; email: string; role: string } | null;
    targetId: string | null;
    outcome: string | null;
    createdAt: string;
}

/** Subset of `GET /admin/credits/anomalies` (spec §6.7). */
export interface OverviewAnomaly {
    kind: string;
    userId: string;
    accountId: string | null;
    balance: number | null;
    period: string | null;
    detail: string;
}

export type OverviewRangeValue = '24h' | '7d' | '30d' | '90d';

export interface OverviewRange {
    value: OverviewRangeValue;
    days: number;
}

export const OVERVIEW_RANGES: OverviewRange[] = [
    { value: '24h', days: 1 },
    { value: '7d', days: 7 },
    { value: '30d', days: 30 },
    { value: '90d', days: 90 },
];

export const DEFAULT_OVERVIEW_RANGE_VALUE: OverviewRangeValue = '30d';

export function parseOverviewRange(value: string | null | undefined): OverviewRange {
    return (
        OVERVIEW_RANGES.find((range) => range.value === value) ??
        OVERVIEW_RANGES.find((range) => range.value === DEFAULT_OVERVIEW_RANGE_VALUE)!
    );
}

const DAY_MS = 86_400_000;

/** UTC day key `YYYY-MM-DD` — computed arithmetically (no Intl, so pure). */
export const dayKey = (date: Date): string => {
    const d = new Date(date.getTime());
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
};

/** The `days` UTC day keys ending today, oldest first. */
export function daySeries(days: number): string[] {
    const keys: string[] = [];
    const today = Date.now();
    for (let i = days - 1; i >= 0; i--) {
        keys.push(dayKey(new Date(today - i * DAY_MS)));
    }
    return keys;
}

/** Per-day totals — counts or sums — keyed by the range's day series. */
export function countSeries(dates: Date[], range: OverviewRange): number[] {
    const keys = daySeries(range.days);
    const index = new Map(keys.map((key, i) => [key, i]));
    const counts = new Array<number>(keys.length).fill(0);
    for (const date of dates) {
        const i = index.get(dayKey(date));
        if (i !== undefined) counts[i] += 1;
    }
    return counts;
}

/** KPI sums — financial view of the accounts. */
export function sumAccounts(accounts: OverviewAccountRow[]): { creditBalance: number; pendingHolds: number } {
    return accounts.reduce(
        (acc, acct) => ({
            creditBalance: acc.creditBalance + (acct.balance ?? 0),
            pendingHolds: acc.pendingHolds + (acct.held ?? 0),
        }),
        { creditBalance: 0, pendingHolds: 0 },
    );
}

/** Credit movements, per day per kind (the stacked bar) — only kinds present. */
export interface CreditMovementSeries {
    days: string[];
    /** kind → per-day amounts (aligned to `days`). */
    series: Record<string, number[]>;
}

export function creditMovementSeries(
    transactions: OverviewTransactionRow[],
    range: OverviewRange,
): CreditMovementSeries {
    const keys = daySeries(range.days);
    const index = new Map(keys.map((key, i) => [key, i]));
    const series: Record<string, number[]> = {};
    for (const tx of transactions) {
        const i = index.get(dayKey(new Date(tx.createdAt)));
        if (i === undefined) continue;
        series[tx.kind] ??= new Array<number>(keys.length).fill(0);
        series[tx.kind][i] += tx.amount;
    }
    return { days: keys, series };
}
