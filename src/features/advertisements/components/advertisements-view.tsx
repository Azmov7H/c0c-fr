'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Clapperboard, FilterX, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataState } from '@/components/shared/data-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useUrlLocale } from '@/i18n/locale';
import { getFormatters } from '@/lib/format';

import { useAdvertisements, useRemoveAdvertisement } from '../hooks/use-advertisements';
import { statusLabel } from '../lib/labels';
import type { AdvertisementStatus, AdvertisementsQuery } from '../types';
import { AdvertisementCard } from './advertisement-card';

const STATUSES: readonly AdvertisementStatus[] = [
    'draft',
    'ready',
    'rendering',
    'completed',
    'failed',
    'archived',
];

const PAGE_SIZE = 12;

export function AdvertisementsView() {
    const t = useTranslations('advertisements');
    const locale = useUrlLocale();
    const router = useRouter();
    const formatters = getFormatters(locale);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<AdvertisementStatus | ''>('');
    const [page, setPage] = useState(1);

    const query = useMemo<AdvertisementsQuery>(
        () => ({ page, limit: PAGE_SIZE, search: search.trim() || undefined, status: status || undefined }),
        [page, search, status]
    );
    const list = useAdvertisements(query);
    const remove = useRemoveAdvertisement();

    const hasFilters = search.trim().length > 0 || status !== '';
    const total = list.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const items = list.data?.items ?? [];

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pageHeader.title')}
                description={t('pageHeader.description')}
                actions={
                    <div className="flex flex-col items-end gap-1">
                        <Button asChild className="h-11">
                            <Link href="/projects">
                                <Plus className="me-2 size-4" aria-hidden="true" />
                                {t('pageHeader.new')}
                            </Link>
                        </Button>
                        <span className="text-xs text-muted-foreground">{t('pageHeader.newDescription')}</span>
                    </div>
                }
            />

            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
                <label className="min-w-60 flex-1 space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{t('filters.searchLabel')}</span>
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder={t('filters.searchPlaceholder')}
                        aria-label={t('filters.searchLabel')}
                        maxLength={120}
                    />
                </label>
                <label className="min-w-48 space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{t('filters.statusLabel')}</span>
                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value as AdvertisementStatus | '');
                            setPage(1);
                        }}
                        aria-label={t('filters.statusLabel')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">{t('filters.allStatuses')}</option>
                        {STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {statusLabel(t, value)}
                            </option>
                        ))}
                    </select>
                </label>
                {hasFilters ? (
                    <Button variant="ghost" className="h-10 gap-2" onClick={clearFilters}>
                        <FilterX className="size-4" aria-hidden="true" />
                        {t('filters.clear')}
                    </Button>
                ) : null}
                <span className="text-xs text-muted-foreground" aria-live="polite">
                    {t('filters.resultCount', { count: formatters.number(total) })}
                </span>
            </div>

            <DataState
                isLoading={list.isLoading}
                error={list.isError ? list.error : undefined}
                isEmpty={items.length === 0}
                emptyTitle={hasFilters ? t('list.filteredEmptyTitle') : t('list.emptyTitle')}
                emptyDescription={
                    hasFilters ? t('list.filteredEmptyDescription') : t('list.emptyDescription')
                }
                emptyIcon={Clapperboard}
                emptyAction={
                    hasFilters
                        ? { label: t('filters.clear'), onClick: clearFilters, icon: <FilterX className="size-4" /> }
                        : {
                              label: t('list.emptyAction'),
                              onClick: () => router.push('/projects'),
                              icon: <Plus className="size-4" />,
                          }
                }
                onRetry={() => void list.refetch()}
                loadingFallback={
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="h-72 rounded-xl" />
                        ))}
                        <span className="sr-only" role="status">{t('list.loading')}</span>
                    </div>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((advertisement) => (
                        <AdvertisementCard
                            key={advertisement.id}
                            advertisement={advertisement}
                            canArchive
                            archivePending={remove.isPending && remove.variables === advertisement.id}
                            onArchive={(id) => remove.mutate(id)}
                        />
                    ))}
                </div>

                {totalPages > 1 ? (
                    <nav className="mt-6 flex items-center justify-center gap-3" aria-label={t('filters.statusLabel')}>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                        >
                            {t('list.previous')}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {formatters.number(page)} / {formatters.number(totalPages)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                        >
                            {t('list.next')}
                        </Button>
                    </nav>
                ) : null}
            </DataState>
        </div>
    );
}
