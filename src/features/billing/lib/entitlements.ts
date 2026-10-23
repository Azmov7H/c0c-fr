import type { BillingFeature, BillingSummary, UsageRow } from '../types';

export function hasFeature(
    summary: BillingSummary | undefined,
    feature: BillingFeature
): boolean | undefined {
    if (!summary) return undefined;
    return summary.features.includes(feature);
}

export function usageFor(summary: BillingSummary | undefined, feature: string): UsageRow | undefined {
    return summary?.usage.find((row) => row.feature === feature);
}

export function quotaFor(summary: BillingSummary | undefined, resource: string): number | null {
    return summary?.quota[resource] ?? null;
}

export function usedFor(summary: BillingSummary | undefined, feature: string): number {
    return usageFor(summary, feature)?.used ?? 0;
}

export function usagePercent(used: number, limit: number | null): number {
    if (limit === null || limit <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}

export function isQuotaExhausted(summary: BillingSummary | undefined, feature: string): boolean {
    const row = usageFor(summary, feature);
    return Boolean(row && row.limit !== null && row.used >= row.limit);
}
