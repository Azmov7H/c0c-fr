import type { Metadata } from 'next';

import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';

export const metadata: Metadata = {
    title: 'Get started',
    description: 'Tell us what you make so your workspace starts personalised.',
};

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
