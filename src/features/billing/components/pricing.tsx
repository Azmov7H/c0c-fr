import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    PLAN_CATALOGUE,
    PLAN_COMPARISON,
    PLAN_IDS,
    PRICING_FAQ,
    formatMonthlyPrice,
    planHighlights,
    type PlanDefinition,
} from '../lib/plans';
import type { PlanId } from '../types';

function planCta(plan: PlanDefinition): { href: string; label: string } {
    if (plan.id === 'starter') return { href: '/signup', label: 'Start free' };
    return {
        href: `/settings/billing?plan=${plan.id}`,
        label: `Choose ${plan.name}`,
    };
}

interface PricingCardsProps {
    className?: string;
    currentPlan?: PlanId;
}

export function PricingCards({ className, currentPlan }: PricingCardsProps) {
    return (
        <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-3', className)}>
            {PLAN_IDS.map((id) => {
                const plan = PLAN_CATALOGUE[id];
                const recommended = Boolean(plan.recommendedLabel);
                const current = currentPlan === id;
                const cta = planCta(plan);

                return (
                    <article
                        key={plan.id}
                        className={cn(
                            'flex flex-col rounded-2xl border bg-card p-6',
                            recommended
                                ? 'border-primary ring-1 ring-primary'
                                : 'border-border/60'
                        )}
                    >
                        <div className="min-h-7">
                            {recommended ? (
                                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
                                    {plan.recommendedLabel}
                                </span>
                            ) : null}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold">{plan.name}</h2>
                        <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                            {plan.audience}
                        </p>
                        <p className="mt-4">
                            <span className="text-2xl font-bold">{formatMonthlyPrice(plan)}</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {plan.monthlyPriceCents === 0
                                ? 'No card required'
                                : 'Billed monthly · cancel any time'}
                        </p>

                        <ul className="mt-6 flex-1 space-y-3 text-sm">
                            {planHighlights(plan).map((feature) => (
                                <li key={feature} className="flex items-start gap-2">
                                    <Check
                                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                                        aria-hidden
                                    />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {current ? (
                            <p className="mt-6 rounded-md border border-border bg-muted/40 px-4 py-2 text-center text-sm font-medium">
                                Current plan
                            </p>
                        ) : (
                            <Button
                                className="mt-6 w-full"
                                variant={recommended ? 'default' : 'outline'}
                                asChild
                            >
                                <a href={cta.href}>{cta.label}</a>
                            </Button>
                        )}
                    </article>
                );
            })}
        </div>
    );
}

export function PlanComparisonTable() {
    return (
        <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <caption className="sr-only">
                    Feature and quota comparison for Starter, Pro and Studio
                </caption>
                <thead>
                    <tr className="border-b border-border/60 bg-muted/40">
                        <th scope="col" className="p-4 font-semibold">
                            Compare plans
                        </th>
                        {PLAN_IDS.map((id) => (
                            <th key={id} scope="col" className="p-4 font-semibold">
                                {PLAN_CATALOGUE[id].name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {PLAN_COMPARISON.map((row) => (
                        <tr key={row.label} className="border-b border-border/40 last:border-0">
                            <th scope="row" className="p-4 font-medium">
                                {row.label}
                            </th>
                            {PLAN_IDS.map((id) => (
                                <td key={id} className="p-4 text-muted-foreground">
                                    {row.values[id]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function PricingFaq() {
    return (
        <div className="space-y-3">
            {PRICING_FAQ.map((item) => (
                <details
                    key={item.question}
                    className="rounded-xl border border-border/60 bg-card p-4"
                >
                    <summary className="cursor-pointer font-medium">{item.question}</summary>
                    <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                </details>
            ))}
        </div>
    );
}
