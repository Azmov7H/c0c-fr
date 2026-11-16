import type { Metadata } from 'next';

import {
    PlanComparisonTable,
    PricingCards,
    PricingFaq,
} from '@/features/billing/components/pricing';
import { PLAN_CATALOGUE, PLAN_IDS } from '@/features/billing/lib/plans';
import { buildPricingCopy } from '@/features/billing/lib/pricing-copy';
import { PUBLIC_ROUTES } from '@/lib/public-routes';
import { getLocale, getTranslations } from '@/i18n/server';

const SITE_URL = 'https://aicontentengine.com';
const canonical = PUBLIC_ROUTES.find((route) => route.path === '/pricing')?.path ?? '/pricing';

/**
 * AR-023: the metadata copy is in the catalog, so the pricing page speaks the
 * visitor's language in the search result too.
 *
 * What is NOT here yet: the per-locale canonical and the hreflang pairs —
 * those are AR-025's job (the public route pairs).
 */
export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('pricing');

    return {
        title: t('meta.title'),
        description: t('meta.description'),
        alternates: { canonical },
        openGraph: {
            title: t('meta.ogTitle'),
            description: t('meta.ogDescription'),
            url: `${SITE_URL}/pricing`,
            siteName: 'AI Content Engine',
            locale: 'en_US',
            type: 'website',
        },
    };
}

export default async function PricingPage() {
    const locale = await getLocale();
    const t = await getTranslations('pricing');
    const copy = buildPricingCopy(t);

    // The structured data is built per request (per locale) so the
    // description — and the plan names — are the visitor's language.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AI Content Engine',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        url: `${SITE_URL}/pricing`,
        description: t('meta.jsonLdDescription'),
        offers: PLAN_IDS.map((id) => {
            const plan = PLAN_CATALOGUE[id];
            return {
                '@type': 'Offer',
                name: copy.planName(id),
                price: (plan.monthlyPriceCents / 100).toFixed(0),
                priceCurrency: 'USD',
                category: plan.monthlyPriceCents === 0 ? 'free' : 'subscription',
                url: `${SITE_URL}/pricing`,
            };
        }),
    };

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
                            {t('page.title')}
                        </h1>
                        <p className="mt-4 text-muted-foreground md:text-lg">
                            {t('page.description')}
                        </p>
                    </div>
                    <PricingCards className="mt-12" locale={locale} />
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        {t('page.billingNote')}
                    </p>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container mx-auto max-w-6xl px-4">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {t('compare.title')}
                    </h2>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        {t('compare.description')}
                    </p>
                    <div className="mt-8">
                        <PlanComparisonTable locale={locale} />
                    </div>
                </div>
            </section>

            <section className="border-t border-border/40 py-16 md:py-24">
                <div className="container mx-auto max-w-3xl px-4">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {t('faq.title')}
                    </h2>
                    <div className="mt-8">
                        <PricingFaq locale={locale} />
                    </div>
                </div>
            </section>
        </div>
    );
}
