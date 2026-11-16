import { DirIcon } from '@/components/icons/dir-icon';
import { MarketingCtaLink } from '@/components/layout/marketing-cta';
import { getTranslations } from '@/i18n/server';

/** Repeat the hero promise, one CTA. The last thing on the page converts. */
export async function FinalCta() {
    const t = await getTranslations('landing');

    return (
        <section className="border-t border-border/60 bg-muted/30 py-20 md:py-28">
            <div className="container mx-auto max-w-3xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {t('finalCta.title')}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                    {t('finalCta.description')}
                </p>
                <MarketingCtaLink href="/signup" size="lg" className="mt-8 h-12 px-8 text-base">
                    {t('finalCta.cta')}
                    <DirIcon name="ArrowRight" className="ms-2 h-4 w-4" aria-hidden />
                </MarketingCtaLink>
            </div>
        </section>
    );
}
