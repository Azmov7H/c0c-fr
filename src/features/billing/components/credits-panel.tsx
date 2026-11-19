'use client';

import { useTranslations } from 'next-intl';

import { useUrlLocale } from '@/i18n/locale';
import * as React from 'react';
import { CircleSlash, Coins, ShieldQuestion } from 'lucide-react';

import { DirIcon } from '@/components/icons/dir-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { LocalizedDataState } from '@/components/shared/localized-data-state';
import { Skeleton } from '@/components/ui/skeleton';
import { creditHistoryLabel, creditKindKey } from '../lib/credit-history';
import { formatCount, formatDate } from '../lib/format';
import { useCreditHistory, useCredits } from '../hooks/use-billing';
import type { CreditEvent } from '../types';

const HISTORY_PAGE_SIZE = 10;

/**
 * P08.4: the credits visible to the user are the server's numbers —
 * `GET /billing/credits` — plus the immutable ledger, newest first.
 * Prices have not been recorded yet (Cost Analysis is pending), so the
 * panel never shows a cost and never invents one.
 *
 * AR-028 — every label is the `billing` catalog's; the numbers and the ledger
 * notes stay data.
 */
export function CreditsPanel() {
    const locale = useUrlLocale();
    const t = useTranslations('billing');
    const credits = useCredits();
    const { data, isLoading, error, refetch } = credits;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardDescription>{t('credits.title')}</CardDescription>
                        <CardTitle className="mt-1 flex items-center gap-2 text-2xl">
                            <Coins className="size-5 text-muted-foreground" aria-hidden />
                            {data ? (
                                <span>
                                    {t('credits.available', {
                                        count: formatCount(data.balance, locale),
                                    })}
                                </span>
                            ) : (
                                <span>{t('credits.fallbackTitle')}</span>
                            )}
                            {data && data.held > 0 ? (
                                <Badge variant="secondary">
                                    {t('credits.held', {
                                        count: formatCount(data.held, locale),
                                    })}
                                </Badge>
                            ) : null}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <LocalizedDataState
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
                                    <dt className="text-muted-foreground">
                                        {t('credits.availableLabel')}
                                    </dt>
                                    <dd className="mt-1 font-medium tabular-nums">
                                        {formatCount(data.balance, locale)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('credits.inProgress')}
                                    </dt>
                                    <dd className="mt-1 font-medium tabular-nums">
                                        {data.held > 0
                                            ? t('credits.held', {
                                                  count: formatCount(data.held, locale),
                                              })
                                            : t('credits.none')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('credits.cycle')}
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        {data.resetAt
                                            ? t('credits.resets', {
                                                  period: data.period,
                                                  date: formatDate(
                                                      data.resetAt,
                                                      locale,
                                                      t('credits.notScheduled')
                                                  ),
                                              })
                                            : data.period}
                                    </dd>
                                </div>
                            </dl>

                            {/* TODO(Cost-Analysis): top-up packs are priced on Pro;
                                the purchase flow ships with the recorded prices.
                                Copy: access/entitlement language, not "api.access". */}
                            <p className="flex items-start gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground">
                                <ShieldQuestion className="mt-0.5 size-4 shrink-0" aria-hidden />
                                <span>{t('credits.note')}</span>
                            </p>

                            <CreditHistory />
                        </>
                    ) : null}
                </LocalizedDataState>
            </CardContent>
        </Card>
    );
}

function CreditHistory() {
    const locale = useUrlLocale();
    const t = useTranslations('billing');
    const [page, setPage] = React.useState(1);
    const history = useCreditHistory(page, HISTORY_PAGE_SIZE);
    const { data, isLoading, error, refetch } = history;

    const events = data?.events ?? null;
    const total = data?.total ?? 0;
    const limit = data?.limit ?? HISTORY_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div>
            <h3 className="text-sm font-semibold">{t('credits.recent')}</h3>

            {isLoading ? (
                <div className="mt-3 space-y-2" aria-label={t('credits.loading')} role="status">
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>
            ) : (
                <LocalizedDataState
                    error={error}
                    isEmpty={events !== null && events.length === 0}
                    emptyTitle={t('credits.emptyTitle')}
                    emptyDescription={t('credits.emptyDescription')}
                    emptyIcon={CircleSlash}
                    onRetry={() => void refetch()}
                >
                    <ul className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60">
                        {events?.map((event, index) => {
                            const kindKey = creditKindKey(event.kind);
                            return (
                                <li
                                    key={`${event.createdAt}-${event.kind}-${index}`}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {creditHistoryLabel(
                                                event,
                                                kindKey
                                                    ? t(`creditKinds.${kindKey}`)
                                                    : event.kind
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(event.createdAt, locale)} ·{' '}
                                            {t('credits.balance', {
                                                count: formatCount(event.balanceAfter, locale),
                                            })}
                                        </p>
                                    </div>
                                    <DeltaBadge event={event} />
                                </li>
                            );
                        })}
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
                                <DirIcon name="ChevronLeft" className="size-4" aria-hidden />
                                {t('credits.newer')}
                            </Button>
                            <span className="text-xs tabular-nums text-muted-foreground">
                                {t('credits.page', { page, total: totalPages })}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                disabled={page >= totalPages || isLoading}
                            >
                                {t('credits.older')}
                                <DirIcon name="ChevronRight" className="size-4" aria-hidden />
                            </Button>
                        </div>
                    ) : null}
                </LocalizedDataState>
            )}
        </div>
    );
}

function DeltaBadge({ event }: { event: CreditEvent }) {
    const locale = useUrlLocale();
    const t = useTranslations('billing');
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
            aria-label={t('credits.amount', { amount: event.amount })}
        >
            {sign}
            {formatCount(event.amount, locale)}
        </span>
    );
}
