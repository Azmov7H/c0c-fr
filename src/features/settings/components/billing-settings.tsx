'use client';

import * as React from 'react';
import Link from 'next/link';
import { CreditCard, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataState } from '@/components/shared/data-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toApiError } from '@/lib/api-error';
import {
    useBillingSummary,
    useCheckout,
    useCheckoutReturn,
    usePortal,
} from '@/features/billing/hooks/use-billing';
import {
    BillingNoticeBanner,
    CheckoutStatus,
} from '@/features/billing/components/billing-status';
import { PlanChooser } from '@/features/billing/components/plan-chooser';
import { UsageSummary } from '@/features/billing/components/usage-summary';
import { deriveBillingNotice } from '@/features/billing/lib/billing-state';
import { formatDate } from '@/features/billing/lib/format';
import { PLAN_CATALOGUE, formatMonthlyPrice } from '@/features/billing/lib/plans';
import type { BillingSummary, PlanId, SubscriptionStatus } from '@/features/billing/types';

function statusBadge(status: SubscriptionStatus | null) {
    switch (status) {
        case 'active':
            return <Badge variant="success">Active</Badge>;
        case 'trialing':
            return <Badge variant="warning">Trial</Badge>;
        case 'past_due':
            return <Badge variant="destructive">Payment failed</Badge>;
        case 'canceled':
            return <Badge variant="outline">Canceled</Badge>;
        case 'incomplete':
            return <Badge variant="destructive">Setup incomplete</Badge>;
        default:
            return <Badge variant="secondary">Free plan</Badge>;
    }
}

function actionError(error: unknown): string {
    const apiError = toApiError(error, 'Billing could not be started.');
    if (apiError.status === 503) {
        return 'Billing is not configured on this deployment yet. No payment was started.';
    }
    if (apiError.status === 0) {
        return 'You appear to be offline. Check your connection and try again.';
    }
    return apiError.message;
}

function CurrentPlan({ summary, onPortal, portalPending }: {
    summary: BillingSummary;
    onPortal: () => void;
    portalPending: boolean;
}) {
    const plan = PLAN_CATALOGUE[summary.plan];
    const renewalLabel = summary.cancelAtPeriodEnd ? 'Access ends' : 'Renews';

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardDescription>Current plan</CardDescription>
                        <CardTitle className="mt-1 flex items-center gap-2 text-2xl">
                            {plan.name}
                            {statusBadge(summary.status)}
                        </CardTitle>
                    </div>
                    <CreditCard className="size-8 text-muted-foreground" aria-hidden />
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="text-muted-foreground">Price</dt>
                        <dd className="mt-1 font-medium">{formatMonthlyPrice(plan)}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{renewalLabel}</dt>
                        <dd className="mt-1 font-medium">
                            {summary.plan === 'starter' && !summary.renewalDate
                                ? 'No billing period'
                                : formatDate(summary.renewalDate, 'Not scheduled')}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Billing</dt>
                        <dd className="mt-1 font-medium">
                            {summary.managedByStripe ? 'Managed by Stripe' : 'Granted manually'}
                        </dd>
                    </div>
                </dl>

                <div className="flex flex-wrap gap-3">
                    {summary.managedByStripe ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={onPortal}
                            disabled={portalPending}
                        >
                            <ExternalLink className="size-4" aria-hidden />
                            {portalPending ? 'Opening portal…' : 'Manage subscription'}
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {summary.plan === 'starter'
                                ? 'Choose a paid plan below to start a subscription.'
                                : 'This plan has no Stripe subscription, so there is nothing to manage in the portal.'}
                        </p>
                    )}
                    {summary.plan === 'starter' ? (
                        <Button asChild>
                            <a href="#choose-plan">Compare paid plans</a>
                        </Button>
                    ) : null}
                </div>

                {summary.cancelAtPeriodEnd ? (
                    <p className="text-sm text-muted-foreground">
                        Cancellation is scheduled. You keep {plan.name} until{' '}
                        {formatDate(summary.renewalDate, 'the end of the period')}.{' '}
                        <Link className="underline underline-offset-4" href="#choose-plan">
                            Choose a plan to continue
                        </Link>
                        .
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}

export function BillingSettings() {
    const summaryQuery = useBillingSummary();
    const checkout = useCheckout();
    const portal = usePortal();
    const { data, isLoading, error, refetch } = summaryQuery;
    const checkoutReturn = useCheckoutReturn({ summary: data, refetch });
    const [mutationError, setMutationError] = React.useState<string | null>(null);

    const notice = deriveBillingNotice(data);
    const pending = checkout.isPending || portal.isPending;

    const onPortal = () => {
        setMutationError(null);
        portal.mutate(undefined, {
            onError: (error) => setMutationError(actionError(error)),
        });
    };

    const onCheckout = (plan: PlanId) => {
        setMutationError(null);
        checkout.mutate(plan, {
            onError: (error) => setMutationError(actionError(error)),
        });
    };

    return (
        <div className="space-y-6">
            <CheckoutStatus
                phase={checkoutReturn.phase}
                target={checkoutReturn.target}
                onRefresh={() => void refetch()}
            />

            {mutationError ? (
                <Alert variant="destructive">
                    <AlertTitle>Billing action failed</AlertTitle>
                    <AlertDescription>{mutationError}</AlertDescription>
                </Alert>
            ) : null}

            <DataState
                isLoading={isLoading}
                error={error}
                onRetry={() => void refetch()}
                loadingFallback={
                    <div className="space-y-4">
                        <Skeleton className="h-56 w-full rounded-xl" />
                        <Skeleton className="h-72 w-full rounded-xl" />
                    </div>
                }
            >
                {data ? (
                    <>
                        {notice ? (
                            <BillingNoticeBanner
                                notice={notice}
                                onPortal={onPortal}
                                portalPending={portal.isPending}
                                managedByStripe={data.managedByStripe}
                            />
                        ) : null}

                        <CurrentPlan
                            summary={data}
                            onPortal={onPortal}
                            portalPending={portal.isPending}
                        />
                        <UsageSummary summary={data} />
                        <PlanChooser
                            summary={data}
                            checkoutPending={checkout.isPending}
                            portalPending={portal.isPending}
                            onCheckout={onCheckout}
                            onPortal={onPortal}
                        />
                        {data.plan === 'starter' ? (
                            <p className="text-sm text-muted-foreground">
                                You are within the free limits. Paid plans are optional;
                                upgrade only when a limit is actually in your way.
                            </p>
                        ) : null}
                        {pending ? (
                            <p className="sr-only" role="status">
                                Billing action in progress
                            </p>
                        ) : null}
                    </>
                ) : null}
            </DataState>
        </div>
    );
}
