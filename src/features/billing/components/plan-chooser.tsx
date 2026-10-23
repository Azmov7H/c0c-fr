import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '../lib/format';
import {
    PLAN_CATALOGUE,
    PLAN_IDS,
    formatMonthlyPrice,
    planHighlights,
    planRank,
} from '../lib/plans';
import type { BillingSummary, PlanId } from '../types';

interface PlanChooserProps {
    summary: BillingSummary;
    checkoutPending: boolean;
    portalPending: boolean;
    onCheckout: (plan: PlanId) => void;
    onPortal: () => void;
}

export function PlanChooser({
    summary,
    checkoutPending,
    portalPending,
    onCheckout,
    onPortal,
}: PlanChooserProps) {
    const currentRank = planRank(summary.plan);
    const paidPlan = summary.plan !== 'starter';

    return (
        <section id="choose-plan" className="scroll-mt-24 space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Change plan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Upgrades start in Stripe Checkout. Downgrades and cancellation happen
                    in the Customer Portal, so nothing changes without your confirmation.
                </p>
            </div>

            {paidPlan ? (
                <p className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Downgrades take effect at the end of the current billing period
                    {summary.renewalDate ? ` (${formatDate(summary.renewalDate)})` : ''}. You
                    keep {PLAN_CATALOGUE[summary.plan].name} until then; after that the lower
                    plan&apos;s generation, storage and member limits apply.
                </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
                {PLAN_IDS.map((id) => {
                    const plan = PLAN_CATALOGUE[id];
                    const rank = planRank(id);
                    const current = id === summary.plan;
                    const direction = rank > currentRank ? 'upgrade' : 'downgrade';

                    return (
                        <div
                            key={id}
                            className="flex flex-col rounded-xl border border-border/60 p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold">{plan.name}</h3>
                                {current ? <Badge variant="secondary">Current</Badge> : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {formatMonthlyPrice(plan)}
                            </p>
                            <ul className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
                                {planHighlights(plan).slice(0, 4).map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>

                            {current ? null : direction === 'upgrade' ? (
                                <Button
                                    type="button"
                                    className="mt-4 w-full gap-2"
                                    onClick={() => onCheckout(id)}
                                    disabled={checkoutPending || portalPending}
                                >
                                    <ArrowUpRight className="size-4" aria-hidden />
                                    {checkoutPending ? 'Opening checkout…' : `Upgrade to ${plan.name}`}
                                </Button>
                            ) : summary.managedByStripe ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-4 w-full gap-2"
                                    onClick={onPortal}
                                    disabled={checkoutPending || portalPending}
                                >
                                    <ArrowDownRight className="size-4" aria-hidden />
                                    {portalPending ? 'Opening portal…' : `Downgrade to ${plan.name}`}
                                </Button>
                            ) : (
                                <p className="mt-4 text-xs text-muted-foreground">
                                    This plan was granted manually. Support manages changes
                                    to it.
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
