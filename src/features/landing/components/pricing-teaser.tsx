import { PricingCards } from '@/features/billing/components/pricing';

export function PricingTeaser() {
    return (
        <section id="pricing" className="scroll-mt-20 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Simple plans that match how much you publish
                    </h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">
                        Start free. Paid plans add more generations, more storage and
                        more people — never a feature you already had.
                    </p>
                </div>

                <PricingCards className="mt-12" />

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Every new account starts on Starter, no card required.{' '}
                    <a className="underline underline-offset-4" href="/pricing">
                        See the full comparison
                    </a>
                    .
                </p>
            </div>
        </section>
    );
}
