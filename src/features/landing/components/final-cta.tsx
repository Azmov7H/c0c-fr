import { ArrowRight } from 'lucide-react';

import { MarketingCtaLink } from '@/components/layout/marketing-cta';

/** Repeat the hero promise, one CTA. The last thing on the page converts. */
export function FinalCta() {
    return (
        <section className="border-t border-border/60 bg-muted/30 py-20 md:py-28">
            <div className="container mx-auto max-w-3xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Everything a video needs, in one place.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                    Your first project — and your first set of thumbnails, scripts,
                    sounds and images — takes minutes.
                </p>
                <MarketingCtaLink href="/signup" size="lg" className="mt-8 h-12 px-8 text-base">
                    Start creating — free
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </MarketingCtaLink>
            </div>
        </section>
    );
}
