import Link from 'next/link';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PlanTier } from '../types';

/**
 * The three tiers are the real ones from the backend's entitlement matrix
 * (c0c-bake/src/shared/entitlements.ts, delivered in T06) — quotas, member
 * limits and concurrency included.
 *
 * No dollar figures: prices are not final, and the T11 card is explicit that
 * a wrong public price is worse than no price. The JSON-LD on this page
 * therefore omits `offers` entirely.
 */
const TIERS: readonly PlanTier[] = [
    {
        id: 'starter',
        name: 'Starter',
        audience: 'For getting the first videos out',
        priceNote: 'Free',
        features: [
            '50 AI generations per month',
            '1 GB storage',
            '1 member per project',
            '1 generation at a time',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        audience: 'For creators publishing on a schedule',
        priceNote: 'Announced at launch',
        highlighted: true,
        features: [
            '500 AI generations per month',
            '50 GB storage',
            'Up to 10 members per project',
            '3 generations at a time',
            'API access',
            'Advanced analytics & CSV export',
        ],
    },
    {
        id: 'studio',
        name: 'Studio',
        audience: 'For teams running multiple channels',
        priceNote: 'Announced at launch',
        features: [
            '2,000 AI generations per month',
            '500 GB storage',
            'Unlimited members per project',
            '10 generations at a time',
            'Priority generation queue',
            'Everything in Pro',
        ],
    },
];

export function PricingTeaser() {
    return (
        <section id="pricing" className="scroll-mt-20 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Simple plans that match how much you publish
                    </h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">
                        Start free. Paid plans add more generations, more storage and
                        more people — never a feature you already had.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {TIERS.map((tier) => (
                        <article
                            key={tier.id}
                            className={`flex flex-col rounded-2xl border bg-card p-6 ${
                                tier.highlighted
                                    ? 'border-primary ring-1 ring-primary'
                                    : 'border-border/60'
                            }`}
                        >
                            {tier.highlighted && (
                                <span className="mb-3 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
                                    Most popular
                                </span>
                            )}
                            <h3 className="text-xl font-semibold">{tier.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{tier.audience}</p>
                            <p className="mt-4 text-2xl font-bold">{tier.priceNote}</p>

                            <ul className="mt-6 flex-1 space-y-3 text-sm">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className="mt-6 w-full"
                                variant={tier.highlighted ? 'default' : 'outline'}
                                asChild
                            >
                                <Link href="/signup">
                                    {tier.id === 'starter' ? 'Start free' : `Start free, upgrade later`}
                                </Link>
                            </Button>
                        </article>
                    ))}
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Paid plans are switched on at launch — every new account starts on
                    Starter, no card required.
                </p>
            </div>
        </section>
    );
}
