import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
                <Button size="lg" className="mt-8 h-12 px-8 text-base" asChild>
                    <Link href="/signup">
                        Start creating — free
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Link>
                </Button>
            </div>
        </section>
    );
}
