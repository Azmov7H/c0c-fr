import { describe, expect, it } from 'vitest';

import { deriveBillingNotice } from './billing-state';
import type { BillingSummary } from '../types';

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
        const notice = deriveBillingNotice({ ...base, status: 'past_due' });
        expect(notice).toMatchObject({
            kind: 'payment_failed',
            action: 'portal',
        });
        expect(notice?.title).toMatch(/payment needs attention/i);
    });

    it('shows the end date for a scheduled cancellation', () => {
        const notice = deriveBillingNotice({ ...base, cancelAtPeriodEnd: true });
        expect(notice).toMatchObject({ kind: 'cancelled', action: 'plans' });
        expect(notice?.description).toContain('Nov 5, 2026');
        expect(notice?.description).toMatch(/changes to Starter/i);
    });

    it('shows trial end date and portal action', () => {
        const notice = deriveBillingNotice({ ...base, status: 'trialing' });
        expect(notice).toMatchObject({ kind: 'trial', action: 'portal' });
        expect(notice?.description).toContain('Nov 5, 2026');
    });

    it('does not nag an active or free account', () => {
        expect(deriveBillingNotice(base)).toBeNull();
        expect(
            deriveBillingNotice({ ...base, plan: 'starter', status: null, managedByStripe: false })
        ).toBeNull();
    });
});
