'use client';

import { useTranslations } from 'next-intl';

import { useUrlLocale } from '@/i18n/locale';
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
import { LocalizedDataState } from '@/components/shared/localized-data-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toApiError } from '@/lib/api-error';
import {
    accountErrorMessage,
    mapAccountError,
} from '@/lib/account-error-map';
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
import { CreditsPanel } from '@/features/billing/components/credits-panel';
import { deriveBillingNotice } from '@/features/billing/lib/billing-state';
import { formatDate } from '@/features/billing/lib/format';
import { buildPricingCopy } from '@/features/billing/lib/pricing-copy';
import type { BillingSummary, PlanId, SubscriptionStatus } from '@/features/billing/types';

type BillingTranslator = ReturnType<typeof useTranslations<'billing'>>;

function statusBadge(status: SubscriptionStatus | null, t: BillingTranslator) {
    switch (status) {
        case 'active':
            return <Badge variant="success">{t('status.active')}</Badge>;
        case 'trialing':
            return <Badge variant="warning">{t('status.trialing')}</Badge>;
        case 'past_due':
            return <Badge variant="destructive">{t('status.past_due')}</Badge>;
        case 'canceled':
            return <Badge variant="outline">{t('status.canceled')}</Badge>;
        case 'incomplete':
            return <Badge variant="destructive">{t('status.incomplete')}</Badge>;
        default:
            return <Badge variant="secondary">{t('status.free')}</Badge>;
    }
}

function actionError(error: unknown, t: BillingTranslator): string {
    const apiError = toApiError(error, t('errors.generic'));
    return accountErrorMessage(
        t,
        mapAccountError(apiError, { serviceUnavailableKey: 'notConfigured' })
    );
}

function CurrentPlan({ summary, onPortal, portalPending }: {
    summary: BillingSummary;
    onPortal: () => void;
    portalPending: boolean;
}) {
    const locale = useUrlLocale();
    // AR-023: the plan's NAME and its PRICE are the catalogue's copy.
    const t = useTranslations('pricing');
    const billingT = useTranslations('billing');
    const copy = buildPricingCopy(t);
    const renewalLabel = summary.cancelAtPeriodEnd
        ? billingT('currentPlan.ends')
        : billingT('currentPlan.renews');

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardDescription>{billingT('currentPlan.label')}</CardDescription>
                        <CardTitle className="mt-1 flex items-center gap-2 text-2xl">
                            {copy.planName(summary.plan)}
                            {statusBadge(summary.status, billingT)}
                        </CardTitle>
                    </div>
                    <CreditCard className="size-8 text-muted-foreground" aria-hidden />
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="text-muted-foreground">{billingT('currentPlan.price')}</dt>
                        <dd className="mt-1 font-medium">
                            {copy.monthlyPrice(summary.plan, locale)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{renewalLabel}</dt>
                        <dd className="mt-1 font-medium">
                            {summary.plan === 'starter' && !summary.renewalDate
                                ? billingT('currentPlan.noPeriod')
                                : formatDate(
                                      summary.renewalDate,
                                      locale,
                                      billingT('currentPlan.notScheduled')
                                  )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">{billingT('currentPlan.billing')}</dt>
                        <dd className="mt-1 font-medium">
                            {summary.managedByStripe
                                ? billingT('currentPlan.managedByStripe')
                                : billingT('currentPlan.grantedManually')}
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
                            {portalPending
                                ? billingT('currentPlan.openingPortal')
                                : billingT('currentPlan.manage')}
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {summary.plan === 'starter'
                                ? billingT('currentPlan.starterHint')
                                : billingT('currentPlan.manualHint')}
                        </p>
                    )}
                    {summary.plan === 'starter' ? (
                        <Button asChild>
                            <a href="#choose-plan">{billingT('currentPlan.compare')}</a>
                        </Button>
                    ) : null}
                </div>

                {summary.cancelAtPeriodEnd ? (
                    <p className="text-sm text-muted-foreground">
                        {/* AR-023: the sentence names the plan, so it cannot
                            stay English while the plan's name is Arabic. */}
                        {billingT.rich('cancellationScheduled', {
                            plan: copy.planName(summary.plan),
                            date: formatDate(
                                summary.renewalDate,
                                locale,
                                billingT('cancellationEndFallback')
                            ),
                            link: (chunks) => (
                                <Link
                                    className="underline underline-offset-4"
                                    href="#choose-plan"
                                >
                                    {chunks}
                                </Link>
                            ),
                        })}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}

export function BillingSettings() {
    const locale = useUrlLocale();
    const billingT = useTranslations('billing');
    const pricingT = useTranslations('pricing');
    const pricingCopy = buildPricingCopy(pricingT);
    const summaryQuery = useBillingSummary();
    const checkout = useCheckout();
    const portal = usePortal();
    const { data, isLoading, error, refetch } = summaryQuery;
    const checkoutReturn = useCheckoutReturn({ summary: data, refetch });
    const [mutationError, setMutationError] = React.useState<string | null>(null);

    const notice = deriveBillingNotice(data, locale, {
        t: billingT,
        plan: pricingCopy.planName(data?.plan ?? 'starter'),
        starter: pricingCopy.planName('starter'),
    });
    const pending = checkout.isPending || portal.isPending;

    const onPortal = () => {
        setMutationError(null);
        portal.mutate(undefined, {
            onError: (error) => setMutationError(actionError(error, billingT)),
        });
    };

    const onCheckout = (plan: PlanId) => {
        setMutationError(null);
        checkout.mutate(plan, {
            onError: (error) => setMutationError(actionError(error, billingT)),
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
                    <AlertTitle>{billingT('actions.failedTitle')}</AlertTitle>
                    <AlertDescription>{mutationError}</AlertDescription>
                </Alert>
            ) : null}

            <LocalizedDataState
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
                        <CreditsPanel />
                        <PlanChooser
                            summary={data}
                            checkoutPending={checkout.isPending}
                            portalPending={portal.isPending}
                            onCheckout={onCheckout}
                            onPortal={onPortal}
                        />
                        {data.plan === 'starter' ? (
                            <p className="text-sm text-muted-foreground">
                                {billingT('freeNote')}
                            </p>
                        ) : null}
                        {pending ? (
                            <p className="sr-only" role="status">
                                {billingT('actions.inProgress')}
                            </p>
                        ) : null}
                    </>
                ) : null}
            </LocalizedDataState>
        </div>
    );
}
