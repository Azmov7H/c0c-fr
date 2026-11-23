'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock3, Info } from 'lucide-react';

import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buildPricingCopy } from '../lib/pricing-copy';
import type { CheckoutReturnPhase } from '../hooks/use-billing';
import type { PlanId } from '../types';
import type { BillingNotice } from '../lib/billing-state';

interface CheckoutStatusProps {
    phase: CheckoutReturnPhase;
    target: PlanId | null;
    onRefresh: () => void;
}

export function CheckoutStatus({ phase, target, onRefresh }: CheckoutStatusProps) {
    // AR-023: the plan's NAME is the catalogue's copy.
    // AR-028: the rest of the checkout copy is the `billing` catalog's.
    const t = useTranslations('pricing');
    const billingT = useTranslations('billing');
    const copy = buildPricingCopy(t);

    if (phase === 'idle') return null;

    if (phase === 'cancelled') {
        return (
            <Alert>
                <Info />
                <AlertTitle>{billingT('checkout.cancelledTitle')}</AlertTitle>
                <AlertDescription>
                    {billingT('checkout.cancelledDescription')}{' '}
                    <Link className="underline underline-offset-4" href="/settings/billing">
                        {billingT('checkout.dismiss')}
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    if (phase === 'confirmed') {
        const planName = target ? copy.planName(target) : billingT('checkout.newPlan');
        return (
            <Alert>
                <CheckCircle2 />
                <AlertTitle>{billingT('checkout.confirmedTitle')}</AlertTitle>
                <AlertDescription>
                    {billingT('checkout.confirmedDescription', { plan: planName })}
                </AlertDescription>
            </Alert>
        );
    }

    if (phase === 'processing') {
        return (
            <Alert>
                <Clock3 />
                <AlertTitle>{billingT('checkout.processingTitle')}</AlertTitle>
                <AlertDescription className="gap-3">
                    <p>{billingT('checkout.processingDescription')}</p>
                    <Button type="button" size="sm" variant="outline" onClick={onRefresh}>
                        {billingT('checkout.refresh')}
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert aria-live="polite">
            <Clock3 />
            <AlertTitle>{billingT('checkout.confirmingTitle')}</AlertTitle>
            <AlertDescription>
                {billingT('checkout.confirmingDescription')}
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
    const billingT = useTranslations('billing');
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
                            {portalPending
                                ? billingT('currentPlan.openingPortal')
                                : notice.actionLabel}
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
