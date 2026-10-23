'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock3, Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { CheckoutReturnPhase } from '../hooks/use-billing';
import type { PlanId } from '../types';
import type { BillingNotice } from '../lib/billing-state';
import { PLAN_CATALOGUE } from '../lib/plans';

interface CheckoutStatusProps {
    phase: CheckoutReturnPhase;
    target: PlanId | null;
    onRefresh: () => void;
}

export function CheckoutStatus({ phase, target, onRefresh }: CheckoutStatusProps) {
    if (phase === 'idle') return null;

    if (phase === 'cancelled') {
        return (
            <Alert>
                <Info />
                <AlertTitle>Checkout cancelled</AlertTitle>
                <AlertDescription>
                    You have not been charged and your plan has not changed.{' '}
                    <Link className="underline underline-offset-4" href="/settings/billing">
                        Dismiss
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    if (phase === 'confirmed') {
        const planName = target ? PLAN_CATALOGUE[target].name : 'your new plan';
        return (
            <Alert>
                <CheckCircle2 />
                <AlertTitle>Payment confirmed</AlertTitle>
                <AlertDescription>
                    {planName} is active. Your new limits are shown below.
                </AlertDescription>
            </Alert>
        );
    }

    if (phase === 'processing') {
        return (
            <Alert>
                <Clock3 />
                <AlertTitle>Your payment is processing</AlertTitle>
                <AlertDescription className="gap-3">
                    <p>
                        Your payment is processing. This page will update shortly. You
                        will not be charged twice if you refresh.
                    </p>
                    <Button type="button" size="sm" variant="outline" onClick={onRefresh}>
                        Refresh status
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert aria-live="polite">
            <Clock3 />
            <AlertTitle>We&apos;re confirming your payment</AlertTitle>
            <AlertDescription>
                Stripe has sent you back, but the payment confirmation can take a few
                seconds. Your plan will update here as soon as it lands.
            </AlertDescription>
        </Alert>
    );
}

interface BillingNoticeBannerProps {
    notice: BillingNotice;
    onPortal: () => void;
    portalPending: boolean;
    managedByStripe: boolean;
}

export function BillingNoticeBanner({
    notice,
    onPortal,
    portalPending,
    managedByStripe,
}: BillingNoticeBannerProps) {
    const destructive = notice.kind === 'payment_failed';
    const Icon = destructive ? AlertTriangle : Info;

    return (
        <Alert variant={destructive ? 'destructive' : 'default'}>
            <Icon />
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription className="gap-3">
                <p>{notice.description}</p>
                {notice.action === 'portal' ? (
                    managedByStripe ? (
                        <Button
                            type="button"
                            size="sm"
                            variant={destructive ? 'destructive' : 'outline'}
                            onClick={onPortal}
                            disabled={portalPending}
                        >
                            {portalPending ? 'Opening portal…' : notice.actionLabel}
                        </Button>
                    ) : null
                ) : (
                    <Button size="sm" variant="outline" asChild>
                        <a href="#choose-plan">{notice.actionLabel}</a>
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
