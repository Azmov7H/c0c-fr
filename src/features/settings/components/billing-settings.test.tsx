// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { BillingSummary } from '@/features/billing/types';
import { BillingSettings } from './billing-settings';

const mocks = vi.hoisted(() => ({
    summary: null as BillingSummary | null,
    checkout: { mutate: vi.fn(), isPending: false },
    portal: { mutate: vi.fn(), isPending: false },
    checkoutReturn: { phase: 'idle', target: null as 'pro' | 'studio' | null },
}));

vi.mock('@/features/billing/hooks/use-billing', () => ({
    useBillingSummary: () => ({
        data: mocks.summary,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
    }),
    useCheckout: () => mocks.checkout,
    usePortal: () => mocks.portal,
    useCheckoutReturn: () => mocks.checkoutReturn,
}));

const summary = (overrides: Partial<BillingSummary> = {}): BillingSummary => ({
    plan: 'pro',
    features: [
        'ai.generation',
        'teams.create',
        'teams.invite',
        'media.publish',
        'api.access',
        'project.members',
        'analytics.advanced',
        'export.csv',
    ],
    quota: {
        'ai.generation': 500,
        'teams.create': 10,
        'project.members': 10,
        storageGB: 50,
    },
    concurrentGenerations: 3,
    usage: [
        {
            feature: 'ai.generation',
            month: '2026-10',
            used: 12,
            limit: 500,
            remaining: 488,
            resetAt: '2026-11-05T12:00:00.000Z',
        },
    ],
    renewalDate: '2026-11-05T12:00:00.000Z',
    cancelAtPeriodEnd: false,
    status: 'active',
    managedByStripe: true,
    ...overrides,
});

beforeEach(() => {
    mocks.summary = summary();
    mocks.checkoutReturn.phase = 'idle';
    mocks.checkoutReturn.target = null;
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('billing settings', () => {
    it('shows the plan, price, renewal date and usage meters', () => {
        render(<BillingSettings />);

        expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
        expect(screen.getAllByText('$49/month').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Nov 5, 2026').length).toBeGreaterThan(0);
        expect(screen.getByText('12 / 500')).toBeTruthy();
        expect(screen.getByRole('button', { name: /manage subscription/i })).toBeTruthy();
    });

    it('surfaces a failed payment and sends the user to the portal', () => {
        mocks.summary = summary({ status: 'past_due' });
        render(<BillingSettings />);

        expect(screen.getByText('Your payment needs attention')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /update payment method/i }));
        expect(mocks.portal.mutate).toHaveBeenCalled();
    });

    it('explains a scheduled cancellation and offers a new plan', () => {
        mocks.summary = summary({ cancelAtPeriodEnd: true });
        render(<BillingSettings />);

        expect(screen.getByText('Your plan is ending')).toBeTruthy();
        const link = screen.getByRole('link', { name: 'Choose a plan' });
        expect(link.getAttribute('href')).toBe('#choose-plan');
        expect(screen.getByText(/After that it changes to Starter/i)).toBeTruthy();
    });

    it('starts an upgrade through checkout from the plan chooser', () => {
        render(<BillingSettings />);

        fireEvent.click(screen.getByRole('button', { name: /upgrade to studio/i }));
        expect(mocks.checkout.mutate).toHaveBeenCalledWith(
            'studio',
            expect.objectContaining({ onError: expect.any(Function) })
        );
    });

    it('sends downgrades through the portal rather than changing the plan locally', () => {
        render(<BillingSettings />);

        fireEvent.click(screen.getByRole('button', { name: /downgrade to starter/i }));
        expect(mocks.portal.mutate).toHaveBeenCalled();
        expect(mocks.checkout.mutate).not.toHaveBeenCalled();
    });

    it('never announces success while the webhook is still being confirmed', () => {
        mocks.summary = summary({
            plan: 'starter',
            status: null,
            managedByStripe: false,
        });
        mocks.checkoutReturn.phase = 'confirming';
        mocks.checkoutReturn.target = 'pro';
        render(<BillingSettings />);

        expect(screen.getByText(/We're confirming your payment/i)).toBeTruthy();
        expect(screen.queryByText('Payment confirmed')).toBeNull();
    });

    it('shows a processing state with a refresh control after a timeout', () => {
        mocks.checkoutReturn.phase = 'processing';
        mocks.checkoutReturn.target = 'pro';
        render(<BillingSettings />);

        expect(screen.getByText('Your payment is processing')).toBeTruthy();
        expect(screen.getByRole('button', { name: /refresh status/i })).toBeTruthy();
    });
});
