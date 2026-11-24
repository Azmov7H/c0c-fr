import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from '@/i18n/server';

import { AdvertisementsView } from '@/features/advertisements/components/advertisements-view';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('advertisements');
    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
    };
}

export default function AdvertisementsPage() {
    return (
        <Suspense>
            <AdvertisementsView />
        </Suspense>
    );
}
