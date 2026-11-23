import { Suspense } from 'react';
import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { BillingSettings } from '@/features/settings/components/billing-settings';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('billing');
    return {
        title: t('page.metadataTitle'),
        description: t('page.metadataDescription'),
    };
}

export default async function BillingPage() {
    const t = await getTranslations('billing');

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('page.title')}
                description={t('page.description')}
            />
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                <BillingSettings />
            </Suspense>
        </div>
    );
}
