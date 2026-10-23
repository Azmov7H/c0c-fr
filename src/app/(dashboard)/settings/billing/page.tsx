import { Suspense } from 'react';
import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { BillingSettings } from '@/features/settings/components/billing-settings';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
    title: 'Billing & Plan',
    description: 'Your current plan, usage and available upgrades.',
};

export default function BillingPage() {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Billing & Plan"
                description="See what your plan includes and what you have used this period. Upgrades and cancellations are handled by Stripe."
            />
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                <BillingSettings />
            </Suspense>
        </div>
    );
}
