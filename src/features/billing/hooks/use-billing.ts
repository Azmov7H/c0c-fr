import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { billingService } from '../services/billing.service';
import type { BillingSummary, PlanId } from '../types';
import {
    CHECKOUT_POLL_INTERVAL_MS,
    CHECKOUT_POLL_TIMEOUT_MS,
    clearCheckoutTarget,
    isCheckoutSettled,
    isStripeHostedUrl,
    readCheckoutTarget,
    saveCheckoutTarget,
} from '../lib/checkout-return';

export const billingKeys = {
    all: ['billing'] as const,
    subscription: () => [...billingKeys.all, 'subscription'] as const,
};

export function useBillingSummary() {
    return useQuery({
        queryKey: billingKeys.subscription(),
        queryFn: () => billingService.getSubscription(),
        staleTime: 30_000,
    });
}

export function useCheckout() {
    return useMutation({
        mutationFn: async (plan: PlanId) => {
            const session = await billingService.createCheckoutSession(plan);
            if (!isStripeHostedUrl(session.url)) {
                throw new Error('The billing provider returned an unexpected checkout URL.');
            }
            saveCheckoutTarget(plan);
            return session;
        },
        onSuccess: (session) => {
            window.location.assign(session.url);
        },
    });
}

export function usePortal() {
    return useMutation({
        mutationFn: async () => {
            const session = await billingService.createPortalSession();
            if (!isStripeHostedUrl(session.url)) {
                throw new Error('The billing provider returned an unexpected portal URL.');
            }
            return session;
        },
        onSuccess: (session) => {
            window.location.assign(session.url);
        },
    });
}

export type CheckoutReturnPhase =
    | 'idle'
    | 'cancelled'
    | 'confirming'
    | 'confirmed'
    | 'processing';

interface CheckoutReturnOptions {
    summary: BillingSummary | undefined;
    refetch: () => Promise<unknown>;
}

export function useCheckoutReturn({ summary, refetch }: CheckoutReturnOptions) {
    const searchParams = useSearchParams();
    const checkout = searchParams.get('checkout');
    const success = checkout === 'success';
    const target = success ? readCheckoutTarget() : null;
    const settled = isCheckoutSettled(summary, target);
    const [timedOut, setTimedOut] = React.useState(false);

    React.useEffect(() => {
        if (!success || settled || timedOut) return;

        const startedAt = Date.now();
        const timer = window.setInterval(() => {
            if (Date.now() - startedAt >= CHECKOUT_POLL_TIMEOUT_MS) {
                window.clearInterval(timer);
                setTimedOut(true);
                return;
            }
            void refetch();
        }, CHECKOUT_POLL_INTERVAL_MS);

        return () => window.clearInterval(timer);
    }, [success, settled, timedOut, refetch]);

    React.useEffect(() => {
        if (settled) clearCheckoutTarget();
    }, [settled]);

    const phase: CheckoutReturnPhase = !success
        ? checkout === 'cancelled'
            ? 'cancelled'
            : 'idle'
        : settled
          ? 'confirmed'
          : timedOut
            ? 'processing'
            : 'confirming';

    return { phase, target };
}
