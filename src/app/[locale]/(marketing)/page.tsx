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

const SITE_URL = 'https://aicontentengine.com';

export const metadata: Metadata = {
    title: 'Thumbnails, scripts, sound effects and images for video creators',
    description:
        'Everything a video needs, in one place. Generate thumbnails, scripts, sound effects and images around your brief — kept in one project, ready to publish.',
    alternates: { canonical: '/' },
    openGraph: {
        title: 'Everything a video needs, in one place',
        description:
            'Thumbnails, scripts, sound effects and images — generated around your brief and kept in one project.',
        url: SITE_URL,
        siteName: 'AI Content Engine',
        locale: 'en_US',
        type: 'website',
        // og:image comes from opengraph-image.tsx (next/og, 1200×630).
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Everything a video needs, in one place',
        description:
            'Thumbnails, scripts, sound effects and images — generated around your brief and kept in one project.',
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Content Engine',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description:
        'Generate thumbnails, scripts, sound effects and images for video creators — in one project workspace.',
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
export default function LandingPage() {
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
