import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Above the fold: headline, subhead, one primary CTA, one secondary CTA, one
 * visual. Nothing else — no stats strip, no logo wall (the old page's
 * "Trusted by Agencies" / "10k+ Generations" strip was fabricated and is
 * gone, not restyled).
 *
 * The visual is a real capture of the running product (see
 * docs/screenshots + T11-STATUS for how it was taken), not an illustration.
 * It is the only `priority` image on the page — it is the LCP element.
 */
export function Hero() {
    return (
        <section className="relative overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
            >
                <div className="absolute left-1/2 top-[-20%] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] motion-reduce:animate-none" />
                <div className="absolute bottom-[-30%] right-[-10%] h-[360px] w-[360px] rounded-full bg-brand-violet/10 blur-[100px] motion-reduce:animate-none" />
            </div>

            <div className="container mx-auto max-w-6xl px-4 pb-16 pt-16 text-center md:pt-24">
                <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
                    Everything a video needs, in one place.
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
                    Thumbnails, scripts, sound effects and images — generated around
                    your brief, kept in one project, ready to publish.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button size="lg" className="h-12 px-8 text-base" asChild>
                        <Link href="/signup">
                            Start creating — free
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                        <Link href="#assets">See the four assets</Link>
                    </Button>
                </div>

                <div className="mx-auto mt-14 max-w-5xl">
                    <Image
                        src="/landing/dashboard.jpg"
                        alt="The Ideas & Trends workspace ranking viral topics with score bars and growth percentages"
                        width={1600}
                        height={1000}
                        priority
                        sizes="(max-width: 768px) 100vw, 1024px"
                        className="rounded-xl border border-border/60 shadow-2xl"
                    />
                </div>
            </div>
        </section>
    );
}
