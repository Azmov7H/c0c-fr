import { AlertTriangle } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { usagePercent } from '../lib/entitlements';
import { formatCount, formatDate } from '../lib/format';
import { QUOTA_LABELS, formatLimit } from '../lib/plans';
import type { BillingSummary, UsageRow } from '../types';

interface UsageSummaryProps {
    summary: BillingSummary;
}

function usageRows(summary: BillingSummary): UsageRow[] {
    const rows = [...summary.usage];
    if (!rows.some((row) => row.feature === 'ai.generation')) {
        const limit = summary.quota['ai.generation'] ?? null;
        rows.unshift({
            feature: 'ai.generation',
            month: '',
            used: 0,
            limit,
            remaining: limit === null ? null : limit,
            resetAt: summary.renewalDate ?? '',
        });
    }
    return rows.sort(
        (a, b) =>
            Object.keys(QUOTA_LABELS).indexOf(a.feature) -
            Object.keys(QUOTA_LABELS).indexOf(b.feature)
    );
}

export function UsageSummary({ summary }: UsageSummaryProps) {
    const rows = usageRows(summary);
    const limitRows = Object.entries(summary.quota).filter(
        ([key]) => !rows.some((row) => row.feature === key)
    );

    return (
        <section className="space-y-6" aria-labelledby="usage-heading">
            <div>
                <h2 id="usage-heading" className="text-lg font-semibold">
                    Usage this period
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Counters reset automatically at the date shown. Existing work is
                    never deleted when a quota runs out.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {rows.map((row) => {
                    const label = QUOTA_LABELS[row.feature] ?? row.feature;
                    const limit = row.limit;
                    const percent = usagePercent(row.used, limit);
                    const exhausted = limit !== null && row.used >= limit;

                    return (
                        <div key={row.feature} className="rounded-xl border border-border/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-sm tabular-nums text-muted-foreground">
                                    {limit === null
                                        ? 'Unlimited'
                                        : `${formatCount(row.used)} / ${formatCount(limit)}`}
                                </p>
                            </div>
                            {limit === null ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    No cap on this resource.
                                </p>
                            ) : (
                                <>
                                    <Progress
                                        className="mt-3"
                                        value={percent}
                                        aria-label={`${label}: ${percent}% used`}
                                    />
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span>{percent}% used</span>
                                        <span>
                                            Resets{' '}
                                            {formatDate(
                                                row.resetAt || summary.renewalDate,
                                                'at the end of the period'
                                            )}
                                        </span>
                                    </div>
                                    {exhausted ? (
                                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                                            <AlertTriangle className="size-3.5" aria-hidden />
                                            Quota reached — generation is paused until reset or
                                            upgrade.
                                        </p>
                                    ) : null}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {limitRows.length > 0 ? (
                <div>
                    <h3 className="text-sm font-semibold">Included limits</h3>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                        {limitRows.map(([key, value]) => (
                            <div key={key} className="rounded-lg border border-border/50 px-3 py-2">
                                <dt className="text-xs text-muted-foreground">
                                    {QUOTA_LABELS[key] ?? key}
                                </dt>
                                <dd className="mt-0.5 text-sm font-medium">
                                    {formatLimit(value)}
                                </dd>
                            </div>
                        ))}
                        <div className="rounded-lg border border-border/50 px-3 py-2">
                            <dt className="text-xs text-muted-foreground">
                                Concurrent generations
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium">
                                {summary.concurrentGenerations}
                            </dd>
                        </div>
                    </dl>
                </div>
            ) : null}
        </section>
    );
}
