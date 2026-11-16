import { Quote } from 'lucide-react';

import { getTranslations } from '@/i18n/server';

/**
 * A marked placeholder, not a fabricated testimonial.
 *
 * The old page carried three invented quotes and a "Trusted by" logo strip.
 * The card's rule is explicit: no fabricated proof. Until a real creator
 * quote exists, this section states what it is.
 */
export async function Proof() {
    const t = await getTranslations('landing');

    return (
        <section className="border-y border-border/60 bg-muted/30 py-16 md:py-24">
            <div className="container mx-auto max-w-3xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {t('proof.title')}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                    {t('proof.description')}
                </p>

                <figure className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-8">
                    <Quote className="mx-auto h-6 w-6 text-muted-foreground/50" aria-hidden />
                    <blockquote className="mt-4 text-lg italic text-muted-foreground">
                        {t('proof.quote')}
                    </blockquote>
                    <figcaption className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t('proof.caption')}
                    </figcaption>
                </figure>
            </div>
        </section>
    );
}
