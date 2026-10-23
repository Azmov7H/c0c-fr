// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BillingSummary } from '../types';
import { CHECKOUT_TARGET_KEY, isStripeHostedUrl } from '../lib/checkout-return';
import { useCheckoutReturn } from './use-billing';

const nav = vi.hoisted(() => ({ search: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
    useSearchParams: () => nav.search,
}));

const starter: BillingSummary = {
    plan: 'starter',
    features: ['ai.generation'],
    quota: { 'ai.generation': 50 },
    concurrentGenerations: 1,
    usage: [],
    renewalDate: null,
    cancelAtPeriodEnd: false,
    status: null,
    managedByStripe: false,
};

const pro: BillingSummary = {
    ...starter,
    plan: 'pro',
    features: ['ai.generation', 'analytics.advanced'],
    status: 'active',
    renewalDate: '2026-11-05T12:00:00.000Z',
    managedByStripe: true,
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T10:00:00.000Z'));
    nav.search = new URLSearchParams('checkout=success');
    window.sessionStorage.clear();
});

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe('checkout return polling', () => {
    it('never treats the success URL as proof of payment', async () => {
        window.sessionStorage.setItem(CHECKOUT_TARGET_KEY, 'pro');
        const refetch = vi.fn().mockResolvedValue(undefined);

        const { result, rerender } = renderHook(
            ({ summary }) => useCheckoutReturn({ summary, refetch }),
            { initialProps: { summary: starter as BillingSummary } }
        );

        expect(result.current.phase).toBe('confirming');

        await act(async () => {
            vi.advanceTimersByTime(4000);
        });
        expect(refetch).toHaveBeenCalled();
        expect(result.current.phase).toBe('confirming');

        rerender({ summary: pro });
        expect(result.current.phase).toBe('confirmed');
        expect(window.sessionStorage.getItem(CHECKOUT_TARGET_KEY)).toBeNull();
    });

    it('shows processing, not an error, when the webhook misses the window', async () => {
        window.sessionStorage.setItem(CHECKOUT_TARGET_KEY, 'pro');
        const refetch = vi.fn().mockResolvedValue(undefined);

        const { result } = renderHook(() =>
            useCheckoutReturn({ summary: starter, refetch })
        );

        await act(async () => {
            vi.advanceTimersByTime(30_000);
        });

        expect(result.current.phase).toBe('processing');
        expect(refetch).toHaveBeenCalled();
    });

    it('reports a cancelled checkout without polling', async () => {
        nav.search = new URLSearchParams('checkout=cancelled');
        const refetch = vi.fn().mockResolvedValue(undefined);

        const { result } = renderHook(() =>
            useCheckoutReturn({ summary: starter, refetch })
        );

        expect(result.current.phase).toBe('cancelled');
        await act(async () => {
            vi.advanceTimersByTime(10_000);
        });
        expect(refetch).not.toHaveBeenCalled();
    });
});

describe('stripe redirect guard', () => {
    it('accepts only Stripe-hosted HTTPS URLs', () => {
        expect(isStripeHostedUrl('https://checkout.stripe.com/c/pay/cs_test')).toBe(true);
        expect(isStripeHostedUrl('https://billing.stripe.com/p/session')).toBe(true);
        expect(isStripeHostedUrl('http://checkout.stripe.com/c/pay')).toBe(false);
        expect(isStripeHostedUrl('https://checkout.stripe.com.evil.test/')).toBe(false);
        expect(isStripeHostedUrl('not a url')).toBe(false);
    });
});
