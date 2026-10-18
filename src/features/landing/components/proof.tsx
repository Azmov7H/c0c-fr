import { Quote } from 'lucide-react';

/**
 * A marked placeholder, not a fabricated testimonial.
 *
 * The old page carried three invented quotes and a "Trusted by" logo strip.
 * The card's rule is explicit: no fabricated proof. Until a real creator
 * quote exists, this section states what it is.
 */
export function Proof() {
    return (
        <section className="border-y border-border/60 bg-muted/30 py-16 md:py-24">
            <div className="container mx-auto max-w-3xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Creator stories, coming soon
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                    We would rather show you nothing than invent a testimonial. Real
                    creator quotes go here as soon as our first teams are ready to share
                    their numbers.
                </p>

                <figure className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-8">
                    <Quote className="mx-auto h-6 w-6 text-muted-foreground/50" aria-hidden />
                    <blockquote className="mt-4 text-lg italic text-muted-foreground">
                        This space is reserved for a real creator quote.
                    </blockquote>
                    <figcaption className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Placeholder — no customer claims are published yet
                    </figcaption>
                </figure>
            </div>
        </section>
    );
}
