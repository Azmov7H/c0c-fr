/* eslint-disable @next/next/no-html-link-for-pages -- AR-004: with the `[locale]` segment the lint rule resolves `/pricing` against the dynamic route and asks for a `next/link`; but this is the landing page, where the link runtime is a ~3 kB gzip client chunk the budget does not have room for (T20). A plain anchor is the deliberate choice here — see marketing-header.tsx. */
import { PricingCards } from '@/features/billing/components/pricing';
import { getLocale, getTranslations } from '@/i18n/server';

export async function PricingTeaser() {
    const locale = await getLocale();
    const t = await getTranslations('landing');
    return (
        <section id="pricing" className="scroll-mt-20 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        {t('pricingTeaser.title')}
                    </h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">
                        {t('pricingTeaser.description')}
                    </p>
                </div>

                <PricingCards className="mt-12" locale={locale} />

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    {t('pricingTeaser.note')}{' '}
                    <a className="underline underline-offset-4" href="/pricing">
                        {t('pricingTeaser.link')}
                    </a>
                    .
                </p>
            </div>
        </section>
    );
}
