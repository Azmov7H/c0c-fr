'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import {
    DataState,
    type DataStateLabels,
} from '@/components/shared/data-state';

/**
 * AR-027 — `DataState` is shared by a dozen authenticated surfaces and keeps
 * English defaults for the ones that have not been extracted yet. The
 * dashboard is extracted, so this thin wrapper supplies the `dataState`
 * catalog to its four shared states without changing every other call site.
 *
 * Caller-provided copy still wins: the widgets pass their own empty titles and
 * descriptions, and only the loading/error/retry labels come from here.
 */
export function DashboardDataState({
    emptyTitle,
    emptyDescription,
    labels,
    ...props
}: React.ComponentProps<typeof DataState>) {
    const t = useTranslations('dataState');

    const merged: DataStateLabels = {
        loading: t('loading'),
        errorTitle: t('errorTitle'),
        errorFallback: t('errorFallback'),
        retry: t('retry'),
        ...labels,
    };

    return (
        <DataState
            {...props}
            emptyTitle={emptyTitle ?? t('emptyTitle')}
            emptyDescription={emptyDescription ?? t('emptyDescription')}
            labels={merged}
        />
    );
}
