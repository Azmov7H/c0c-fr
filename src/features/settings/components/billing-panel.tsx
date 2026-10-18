'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Shield, Zap } from 'lucide-react';
import { useProfile } from '../hooks/use-settings';
import { DataState } from '@/components/shared/data-state';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Real tiers from the backend entitlement matrix (T06,
 * c0c-bake/src/shared/entitlements.ts). The $0/$49/$199 this panel used to
 * print were invented: no such prices exist anywhere in the billing system
 * (Stripe price IDs come from env), so "Announced at launch" is the honest
 * label until the public pricing matrix is finalised. Same rule as the
 * landing page (T11): a wrong price is worse than no price.
 */
const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        priceNote: 'Free',
        icon: Zap,
        features: ['50 AI generations/month', '1 GB storage', '1 member per project', '1 concurrent generation'],
    },
    {
        id: 'pro',
        name: 'Pro',
        priceNote: 'Announced at launch',
        icon: Star,
        features: ['500 AI generations/month', '50 GB storage', 'Up to 10 members per project', '3 concurrent generations', 'API access', 'Analytics & CSV export'],
    },
    {
        id: 'studio',
        name: 'Studio',
        priceNote: 'Announced at launch',
        icon: Shield,
        features: ['2,000 AI generations/month', '500 GB storage', 'Unlimited members per project', '10 concurrent generations', 'Priority queue', 'Everything in Pro'],
    },
] as const;

/**
 * Billing lives at /settings/billing since T10 — it left the settings tab so
 * the sidebar's "Billing & Plan" entry has a real destination. Plans remain
 * read-only (SEC-06/AUTHZ-08): upgrades go through billing/support.
 */
export function BillingPanel() {
    const { data: profile, isLoading, error } = useProfile();

    return (
        <DataState
            isLoading={isLoading}
            error={error}
            loadingFallback={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full rounded-xl" />
                    ))}
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                    <Card key={plan.id} className={`relative overflow-hidden transition-all ${profile?.plan === plan.id ? 'border-primary ring-1 ring-primary' : 'hover:border-border/80'}`}>
                        {profile?.plan === plan.id && (
                            <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground rounded-bl-lg">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                        <CardHeader>
                            <plan.icon className={`w-8 h-8 ${profile?.plan === plan.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <CardTitle className="mt-4">{plan.name}</CardTitle>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold">{plan.priceNote}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2">
                                {plan.features.map(f => (
                                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Check className="w-3 h-3 text-primary" /> {f}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {/* SEC-06/AUTHZ-08: plans are read-only. Upgrades go
                                through billing/support, never self-service. */}
                            <Button
                                variant={profile?.plan === plan.id ? "ghost" : "outline"}
                                className="w-full"
                                disabled
                                title={
                                    profile?.plan === plan.id
                                        ? 'Current plan'
                                        : 'Contact support to change plans'
                                }
                            >
                                {profile?.plan === plan.id ? 'Current Plan' : 'Contact Sales'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </DataState>
    );
}
