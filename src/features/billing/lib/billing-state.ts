import type { BillingSummary } from '../types';
import { formatDate } from './format';
import { PLAN_CATALOGUE } from './plans';

export type BillingNoticeKind = 'payment_failed' | 'cancelled' | 'trial';

export interface BillingNotice {
    kind: BillingNoticeKind;
    title: string;
    description: string;
    action: 'portal' | 'plans';
    actionLabel: string;
}

export function deriveBillingNotice(
    summary: BillingSummary | undefined
): BillingNotice | null {
    if (!summary) return null;

    const planName = PLAN_CATALOGUE[summary.plan].name;

    if (summary.status === 'past_due' || summary.status === 'incomplete') {
        return {
            kind: 'payment_failed',
            title: 'Your payment needs attention',
            description:
                'We could not confirm your latest payment. Update your payment method to keep your plan and quota.',
            action: 'portal',
            actionLabel: 'Update payment method',
        };
    }

    if (
        summary.plan !== 'starter' &&
        (summary.cancelAtPeriodEnd || summary.status === 'canceled')
    ) {
        return {
            kind: 'cancelled',
            title: 'Your plan is ending',
            description: `Your ${planName} plan stays active until ${formatDate(
                summary.renewalDate,
                'the end of the billing period'
            )}. After that it changes to Starter and paid limits stop.`,
            action: 'plans',
            actionLabel: 'Choose a plan',
        };
    }

    if (summary.status === 'trialing') {
        return {
            kind: 'trial',
            title: 'Your trial is active',
            description: `Your trial ends on ${formatDate(
                summary.renewalDate,
                'the date shown in the portal'
            )}. You will keep ${planName} after that unless you cancel.`,
            action: 'portal',
            actionLabel: 'Manage subscription',
        };
    }

    return null;
}
