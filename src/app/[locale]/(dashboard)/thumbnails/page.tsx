import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ThumbnailStudio } from '@/features/thumbnails/components/thumbnail-studio';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('thumbnails');
    return {
        title: t('page.title'),
        description: t('page.description'),
    };
}

export default function ThumbnailsPage() {
    return <ThumbnailStudio />;
}
