import type { useTranslations } from 'next-intl';

import type { AppLocale } from '@/i18n/routing';

import type { BillingSummary } from '../types';
import { formatDate } from './format';

export type BillingNoticeKind = 'payment_failed' | 'cancelled' | 'trial';

export interface BillingNotice {
    kind: BillingNoticeKind;
    title: string;
    description: string;
    action: 'portal' | 'plans';
    actionLabel: string;
}

/**
 * AR-023 — the notices' copy comes from the catalog.
 *
 * The translator is bound to the `billing` namespace; the plan names are
 * VALUES, because a notice that names the plan cannot be split across two
 * languages: the sentence and the name it carries have to be the same
 * language.
 */
export type BillingTranslator = ReturnType<typeof useTranslations<'billing'>>;

export interface BillingNoticeContext {
    /** The catalog's translator, bound to the `billing` namespace. */
    t: BillingTranslator;
    /** The current plan's display name. */
    plan: string;
    /** The free plan's display name — the plan the subscription changes to. */
    starter: string;
}

export function deriveBillingNotice(
    summary: BillingSummary | undefined,
    locale: AppLocale,
    context: BillingNoticeContext
): BillingNotice | null {
    if (!summary) return null;

    const { t, plan: planName, starter: starterName } = context;

    if (summary.status === 'past_due' || summary.status === 'incomplete') {
        return {
            kind: 'payment_failed',
            title: t('notice.paymentFailedTitle'),
            description: t('notice.paymentFailedDescription'),
            action: 'portal',
            actionLabel: t('notice.paymentFailedAction'),
        };
    }

    if (
        summary.plan !== 'starter' &&
        (summary.cancelAtPeriodEnd || summary.status === 'canceled')
    ) {
        return {
            kind: 'cancelled',
            title: t('notice.cancelledTitle'),
            description: t('notice.cancelledDescription', {
                plan: planName,
                date: formatDate(
                    summary.renewalDate,
                    locale,
                    t('notice.endOfBillingPeriod')
                ),
                starter: starterName,
            }),
            action: 'plans',
            actionLabel: t('notice.cancelledAction'),
        };
    }

    if (summary.status === 'trialing') {
        return {
            kind: 'trial',
            title: t('notice.trialTitle'),
            description: t('notice.trialDescription', {
                date: formatDate(
                    summary.renewalDate,
                    locale,
                    t('notice.portalDate')
                ),
                plan: planName,
            }),
            action: 'portal',
            actionLabel: t('notice.trialAction'),
        };
    }

    return null;
}
