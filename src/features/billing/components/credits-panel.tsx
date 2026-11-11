'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, CircleSlash, Coins, ShieldQuestion } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataState } from '@/components/shared/data-state';
import { Skeleton } from '@/components/ui/skeleton';
import { creditHistoryLabel } from '../lib/credit-history';
import { formatCount, formatDate } from '../lib/format';
import { useCreditHistory, useCredits } from '../hooks/use-billing';
import type { CreditEvent } from '../types';

const HISTORY_PAGE_SIZE = 10;

/**
 * P08.4: the credits visible to the user are the server's numbers —
 * `GET /billing/credits` — plus the immutable ledger, newest first.
 * Prices have not been recorded yet (Cost Analysis is pending), so the
 * panel never shows a cost and never invents one.
 */
export function CreditsPanel() {
    const credits = useCredits();
    const { data, isLoading, error, refetch } = credits;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardDescription>Monthly credits</CardDescription>
                        <CardTitle className="mt-1 flex items-center gap-2 text-2xl">
                            <Coins className="size-5 text-muted-foreground" aria-hidden />
                            {data ? (
                                <span>{`${formatCount(data.balance)} available`}</span>
                            ) : (
                                <span>Credits</span>
                            )}
                            {data && data.held > 0 ? (
                                <Badge variant="secondary">{formatCount(data.held)} held</Badge>
                            ) : null}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <DataState
                    isLoading={isLoading}
                    error={error}
                    onRetry={() => void refetch()}
                    loadingFallback={
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                    }
                >
                    {data ? (
                        <>
                            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                                <div>
                                    <dt className="text-muted-foreground">Available</dt>
                                    <dd className="mt-1 font-medium tabular-nums">
                                        {formatCount(data.balance)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">In progress</dt>
                                    <dd className="mt-1 font-medium tabular-nums">
                                        {data.held > 0
                                            ? `${formatCount(data.held)} held`
                                            : 'None'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Cycle</dt>
                                    <dd className="mt-1 font-medium">
                                        {data.period}
                                        {data.resetAt
                                            ? ` — resets ${formatDate(data.resetAt)}`
                                            : ''}
                                    </dd>
                                </div>
                            </dl>

                            {/* TODO(Cost-Analysis): top-up packs are priced on Pro;
                                the purchase flow ships with the recorded prices.
                                Copy: access/entitlement language, not "api.access". */}
                            <p className="flex items-start gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground">
                                <ShieldQuestion className="mt-0.5 size-4 shrink-0" aria-hidden />
                                <span>
                                    Generations reserve credits before they run and settle at the
                                    actual cost when they finish. If something fails, the reserved
                                    credits come back to you.
                                </span>
                            </p>

                            <CreditHistory />
                        </>
                    ) : null}
                </DataState>
            </CardContent>
        </Card>
    );
}

function CreditHistory() {
    const [page, setPage] = React.useState(1);
    const history = useCreditHistory(page, HISTORY_PAGE_SIZE);
    const { data, isLoading, error, refetch } = history;

    const events = data?.events ?? null;
    const total = data?.total ?? 0;
    const limit = data?.limit ?? HISTORY_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    

    return (
        <div>
            <h3 className="text-sm font-semibold">Recent activity</h3>

            {isLoading ? (
                <div className="mt-3 space-y-2" aria-label="Loading credit activity" role="status">
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>
            ) : (
                <DataState
                    error={error}
                    isEmpty={events !== null && events.length === 0}
                    emptyTitle="No credit activity yet"
                    emptyDescription="Activity appears here when a generation settles or a new cycle is granted."
                    emptyIcon={CircleSlash}
                    onRetry={() => void refetch()}
                >
                    <ul className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60">
                        {events?.map((event, index) => (
                            <li
                                key={`${event.createdAt}-${event.kind}-${index}`}
                                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {creditHistoryLabel(event)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(event.createdAt)} · balance{' '}
                                        {formatCount(event.balanceAfter)}
                                    </p>
                                </div>
                                <DeltaBadge event={event} />
                            </li>
                        ))}
                    </ul>
                    {totalPages > 1 ? (
                        <div className="mt-3 flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={page <= 1 || isLoading}
                            >
                                <ChevronLeft className="size-4" aria-hidden />
                                Newer
                            </Button>
                            <span className="text-xs tabular-nums text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                disabled={page >= totalPages || isLoading}
                            >
                                Older
                                <ChevronRight className="size-4" aria-hidden />
                            </Button>
                        </div>
                    ) : null}
                </DataState>
            )}
        </div>
    );
}

function DeltaBadge({ event }: { event: CreditEvent }) {
    const sign =
        event.kind === 'grant' || event.kind === 'topup'
            ? '+'
            : event.kind === 'refund'
              ? '+'
              : event.kind === 'reserve'
                ? ''
                : event.kind === 'release'
                  ? ''
                  : '-';
    const tone = sign === '+' ? 'text-success' : sign === '-' ? 'text-destructive' : 'text-muted-foreground';

    return (
        <span
            className={`shrink-0 text-sm font-medium tabular-nums ${tone}`}
            aria-label={`amount ${event.amount}`}
        >
            {sign}
            {formatCount(event.amount)}
        </span>
    );
}
