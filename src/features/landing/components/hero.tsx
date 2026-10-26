import { getImageProps } from 'next/image';
import { ArrowRight } from 'lucide-react';

import { MarketingCtaLink } from '@/components/layout/marketing-cta';

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
                    <MarketingCtaLink href="/signup" size="lg" className="h-12 px-8 text-base">
                        Start creating — free
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </MarketingCtaLink>
                    <MarketingCtaLink
                        href="#assets"
                        size="lg"
                        variant="outline"
                        className="h-12 px-8 text-base"
                    >
                        See the four assets
                    </MarketingCtaLink>
                </div>

                <div className="mx-auto mt-14 max-w-5xl">
                    {/*
                      T20: `next/image`'s server API, not the client component.
                      The landing page is the one route with a 140 kB budget and
                      this is its only image, so the Image component's ~5.6 kB
                      client runtime was the entire route-specific cost over the
                      framework floor. `getImageProps` still goes through Next's
                      image optimizer (same AVIF/WebP formats and `sizes`), but
                      renders a plain <img> at build time — no hydration code for
                      an image that has no behaviour.

                      LCP treatment is preserved explicitly: eager loading, high
                      fetch priority and a matching srcSet preload. `priority` is
                      passed too so the generated props keep the same eager
                      semantics the component had.
                    */}
                    <HeroImage />
                </div>
            </div>
        </section>
    );
}

/**
 * The hero visual is a real capture of the running product. `getImageProps`
 * is evaluated once at build time because the marketing route is static.
 */
const HERO_IMAGE = {
    src: '/landing/dashboard.jpg',
    alt: 'The Ideas & Trends workspace ranking viral topics with score bars and growth percentages',
    width: 1600,
    height: 1000,
    priority: true,
    sizes: '(max-width: 768px) 100vw, 1024px',
    className: 'rounded-xl border border-border/60 shadow-2xl',
    fetchPriority: 'high' as const,
    loading: 'eager' as const,
};

const { props: heroImageProps } = getImageProps(HERO_IMAGE);

function HeroImage() {
    return (
        <>
            <link
                rel="preload"
                as="image"
                href={heroImageProps.src}
                imageSrcSet={heroImageProps.srcSet}
                imageSizes={heroImageProps.sizes}
                fetchPriority="high"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- props come from next/image's getImageProps (optimizer, srcSet, sizes); the lint rule cannot see through the spread. */}
            <img {...heroImageProps} alt={HERO_IMAGE.alt} />
        </>
    );
}
