'use client';

import { useTranslations } from 'next-intl';

import { UpgradePrompt } from '@/features/billing/components/upgrade-prompt';
import { isCreditError, isQuotaError } from '@/features/billing/lib/generation-error';

/**
 * A 402 means credits/top-up; a 429 means the monthly render allowance. Both
 * are upgrade paths, never bare failures. The feature tag lets billing report
 * which advertisement action was refused.
 */
export function GateError({ error, feature }: { error?: unknown; feature: string }) {
    const t = useTranslations('advertisements');

    if (isQuotaError(error)) {
        return (
            <UpgradePrompt
                feature={feature}
                title={t('upgrade.title')}
                description={t('upgrade.description')}
                ctaLabel={t('upgrade.cta')}
            />
        );
    }

    if (isCreditError(error)) {
        return (
            <UpgradePrompt
                feature={feature}
                title={t('upgrade.creditTitle')}
                description={t('upgrade.creditDescription')}
                ctaLabel={t('upgrade.cta')}
            />
        );
    }

    return null;
}
