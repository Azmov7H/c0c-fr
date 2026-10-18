'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Shield, Zap } from 'lucide-react';
import { useProfile } from '../hooks/use-settings';
import { DataState } from '@/components/shared/data-state';
import { Skeleton } from '@/components/ui/skeleton';

const PLANS = [
    { id: 'starter', name: 'Starter', price: '0', icon: Zap, features: ['10 Projects/mo', 'Basic AI Models', 'Standard Export'] },
    { id: 'pro', name: 'Pro Studio', price: '49', icon: Star, features: ['Unlimited Projects', 'Advanced AI Models', 'Priority Generation', 'Team Collaboration'] },
    { id: 'studio', name: 'Enterprise', price: '199', icon: Shield, features: ['Custom AI Training', 'Dedicated Support', 'API Access', 'SSO & Security'] },
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
                                <span className="text-2xl font-bold">${plan.price}</span>
                                <span className="text-xs text-muted-foreground">/mo</span>
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
