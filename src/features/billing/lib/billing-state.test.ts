import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import enBilling from '../../../../messages/en/billing.json';
import { deriveBillingNotice, type BillingTranslator } from './billing-state';
import type { BillingSummary } from '../types';

/**
 * AR-023 — the notices name the plan, so their copy moved with the name.
 *
 * The translator is the catalog's `billing` namespace, and the plan names
 * are values: a sentence that names a plan in one language and labels it in
 * another is not a translation.
 */
const t = createTranslator({
    locale: 'en',
    messages: { billing: enBilling },
    namespace: 'billing',
}) as unknown as BillingTranslator;

const context = { t, plan: 'Pro', starter: 'Starter' };

const base: BillingSummary = {
    plan: 'pro',
    features: ['ai.generation', 'analytics.advanced'],
    quota: { 'ai.generation': 500 },
    concurrentGenerations: 3,
    usage: [],
    renewalDate: '2026-11-05T12:00:00.000Z',
    cancelAtPeriodEnd: false,
    status: 'active',
    managedByStripe: true,
};

describe('billing notices', () => {
    it('treats a failed payment as the highest-priority state', () => {
        const notice = deriveBillingNotice({ ...base, status: 'past_due' }, 'en', context);
        expect(notice).toMatchObject({
            kind: 'payment_failed',
            action: 'portal',
        });
        expect(notice?.title).toMatch(/payment needs attention/i);
    });

    it('shows the end date for a scheduled cancellation', () => {
        const notice = deriveBillingNotice(
            { ...base, cancelAtPeriodEnd: true },
            'en',
            context
        );
        expect(notice).toMatchObject({ kind: 'cancelled', action: 'plans' });
        expect(notice?.description).toContain('Nov 5, 2026');
        expect(notice?.description).toMatch(/changes to Starter/i);
    });

    it('keeps the sentence whole when the date is unknown', () => {
        const notice = deriveBillingNotice(
            { ...base, cancelAtPeriodEnd: true, renewalDate: null },
            'en',
            context
        );
        // The fallback is copy, not a formatter default.
        expect(notice?.description).toContain('the end of the billing period');
    });

    it('shows trial end date and portal action', () => {
        const notice = deriveBillingNotice({ ...base, status: 'trialing' }, 'en', context);
        expect(notice).toMatchObject({ kind: 'trial', action: 'portal' });
        expect(notice?.description).toContain('Nov 5, 2026');
    });

    it('does not nag an active or free account', () => {
        expect(deriveBillingNotice(base, 'en', context)).toBeNull();
        expect(
            deriveBillingNotice(
                { ...base, plan: 'starter', status: null, managedByStripe: false },
                'en',
                context
            )
        ).toBeNull();
    });
});
