import type { Metadata } from 'next';
import { getTranslations } from '@/i18n/server';

import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('onboarding');
    return {
        title: t('metadata.title'),
        description: t('metadata.description'),
    };
}

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams: Promise<{ edit?: string }>;
}) {
    const { edit } = await searchParams;
    // `?edit=1` reopens the wizard from Account settings for an onboarded user
    // without resetting completion or seeding a second project (card §9).
    return <OnboardingWizard edit={edit === '1'} />;
}
