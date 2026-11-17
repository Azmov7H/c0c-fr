import type { Metadata } from 'next';

import {
    PlanComparisonTable,
    PricingCards,
    PricingFaq,
} from '@/features/billing/components/pricing';
import { PLAN_CATALOGUE, PLAN_IDS } from '@/features/billing/lib/plans';
import { buildPricingCopy } from '@/features/billing/lib/pricing-copy';
import { absolutePublicUrl } from '@/lib/public-routes';
import { publicPageMetadata } from '@/lib/seo/public-metadata';
import { getLocale, getTranslations } from '@/i18n/server';

/**
 * AR-023: the metadata copy is in the catalog, so the pricing page speaks the
 * visitor's language in the search result too.
 *
 * AR-025: the canonical is now THIS locale's URL (it used to be the
 * locale-less `/pricing`, which told a crawler that the Arabic page was a
 * duplicate of the English one), the hreflang pairs name both faces, and the
 * Open Graph locale follows the visitor.
 */
export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('pricing');
    const locale = await getLocale();

    return publicPageMetadata({
        path: '/pricing',
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        ogTitle: t('meta.ogTitle'),
        ogDescription: t('meta.ogDescription'),
    });
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
        name: 'C0C',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        // AR-025: the structured data points at THIS locale's page and
        // declares its language.
        url: absolutePublicUrl('/pricing', locale),
        inLanguage: locale,
        description: t('meta.jsonLdDescription'),
        offers: PLAN_IDS.map((id) => {
            const plan = PLAN_CATALOGUE[id];
            return {
                '@type': 'Offer',
                name: copy.planName(id),
                price: (plan.monthlyPriceCents / 100).toFixed(0),
                priceCurrency: 'USD',
                category: plan.monthlyPriceCents === 0 ? 'free' : 'subscription',
                url: absolutePublicUrl('/pricing', locale),
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
