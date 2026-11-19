'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import {
    DataState,
    type DataStateLabels,
} from '@/components/shared/data-state';

/**
 * AR-028 — `DataState` is shared by a dozen authenticated surfaces and keeps
 * English defaults for the ones that have not been extracted yet. An extracted
 * surface wraps it with this component, which supplies the `dataState` catalog
 * to its loading/error/retry/empty states without changing every other call
 * site.
 *
 * Caller-provided copy still wins: a surface passes its own empty titles and
 * descriptions, and only what it leaves out comes from here.
 */
export function LocalizedDataState({
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
