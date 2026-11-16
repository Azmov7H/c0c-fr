import type { Metadata } from 'next';

import { Hero } from '@/features/landing/components/hero';
import { Problem } from '@/features/landing/components/problem';
import { Assets } from '@/features/landing/components/assets';
import { HowItWorks } from '@/features/landing/components/how-it-works';
import { Collaboration } from '@/features/landing/components/collaboration';
import { Proof } from '@/features/landing/components/proof';
import { PricingTeaser } from '@/features/landing/components/pricing-teaser';
import { FinalCta } from '@/features/landing/components/final-cta';
import { PLAN_CATALOGUE, PLAN_IDS } from '@/features/billing/lib/plans';
import { getTranslations } from '@/i18n/server';

const SITE_URL = 'https://c0c-fr.vercel.app';

/**
 * AR-022: the metadata copy is in the catalog, so the page speaks the
 * visitor's language in the search result too.
 *
 * What is NOT here yet: the per-locale canonical, the hreflang pairs and the
 * per-locale Open Graph locale. Those are AR-025's job (the public route
 * pairs), and this task is the copy extraction.
 */
export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('landing');

    return {
        title: t('meta.title'),
        description: t('meta.description'),
        alternates: { canonical: '/' },
        openGraph: {
            title: t('meta.ogTitle'),
            description: t('meta.ogDescription'),
            url: SITE_URL,
            siteName: 'AI Content Engine',
            locale: 'en_US',
            type: 'website',
            // og:image comes from opengraph-image.tsx (next/og, 1200×630).
        },
        twitter: {
            card: 'summary_large_image',
            title: t('meta.ogTitle'),
            description: t('meta.ogDescription'),
        },
    };
}

/**
 * The one and only landing page. Every section is a server component; the
 * only client JavaScript this route ships is the theme toggle in the
 * marketing header (see theme-provider.tsx for the provider split).
 *
 * Sections, in order, each with a job (T11 card):
 *   hero → state the value in one line
 *   problem → make the pain legible
 *   assets → show, don't tell (the four assets)
 *   how-it-works → reduce perceived effort
 *   collaboration → the differentiator teams care about
 *   proof → credibility without fabrication (marked placeholder)
 *   pricing → qualify visitors (real tiers, no invented prices)
 *   final-cta → convert
 */
export default async function LandingPage() {
    const t = await getTranslations('landing');

    // The structured data is built per request (per locale) so the
    // description is the visitor's language. The plan names are still the
    // catalogue's own strings — AR-023 moves that copy into the catalog.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'C0C',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: t('meta.jsonLdDescription'),
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

    return (
        <>
            <script
                type="application/ld+json"
                // Static build-time constant; the stringify keeps it a data
                // block, and no user input reaches it.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Hero />
            <Problem />
            <Assets />
            <HowItWorks />
            <Collaboration />
            <Proof />
            <PricingTeaser />
            <FinalCta />
        </>
    );
}
