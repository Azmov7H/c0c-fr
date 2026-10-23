import type { Metadata } from 'next';

import {
    PlanComparisonTable,
    PricingCards,
    PricingFaq,
} from '@/features/billing/components/pricing';
import { PLAN_CATALOGUE, PLAN_IDS } from '@/features/billing/lib/plans';
import { PUBLIC_ROUTES } from '@/lib/public-routes';

const SITE_URL = 'https://aicontentengine.com';
const canonical = PUBLIC_ROUTES.find((route) => route.path === '/pricing')?.path ?? '/pricing';

export const metadata: Metadata = {
    title: 'Pricing — Starter, Pro and Studio',
    description:
        'Compare AI generations, storage, members and API access. Starter is free; Pro and Studio add higher quotas and team capabilities.',
    alternates: { canonical },
    openGraph: {
        title: 'Pricing — Starter, Pro and Studio',
        description:
            'Start free, then add generations, storage and team capabilities as you publish more.',
        url: `${SITE_URL}/pricing`,
        siteName: 'AI Content Engine',
        locale: 'en_US',
        type: 'website',
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Content Engine',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}/pricing`,
    description:
        'Generate thumbnails, scripts, sound effects and images for video creators in one project workspace.',
    offers: PLAN_IDS.map((id) => {
        const plan = PLAN_CATALOGUE[id];
        return {
            '@type': 'Offer',
            name: plan.name,
            price: (plan.monthlyPriceCents / 100).toFixed(0),
            priceCurrency: 'USD',
            category: plan.monthlyPriceCents === 0 ? 'free' : 'subscription',
            url: `${SITE_URL}/pricing`,
        };
    }),
};

export default function PricingPage() {
    return (
        <div id="pricing" className="scroll-mt-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <section className="border-b border-border/40 py-16 md:py-24">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                            Pricing that stays honest about limits
                        </h1>
                        <p className="mt-4 text-muted-foreground md:text-lg">
                            Every quota and capability below is enforced by the product.
                            Start free, then move up when your publishing schedule needs it.
                        </p>
                    </div>
                    <PricingCards className="mt-12" />
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        All paid plans are billed monthly in USD. Prices exclude any
                        taxes that may apply.
                    </p>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container mx-auto max-w-6xl px-4">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Compare every limit
                    </h2>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        Quotas reset each billing period for paid plans and each calendar
                        month for Starter.
                    </p>
                    <div className="mt-8">
                        <PlanComparisonTable />
                    </div>
                </div>
            </section>

            <section className="border-t border-border/40 py-16 md:py-24">
                <div className="container mx-auto max-w-3xl px-4">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Questions before you upgrade
                    </h2>
                    <div className="mt-8">
                        <PricingFaq />
                    </div>
                </div>
            </section>
        </div>
    );
}
