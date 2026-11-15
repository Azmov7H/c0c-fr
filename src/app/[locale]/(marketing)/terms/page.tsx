import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'The terms for using AI Content Engine.',
};

/**
 * Minimal placeholder — see /privacy for the full reasoning. A dead legal
 * link is worse than an honest placeholder; this page says exactly which it
 * is.
 */
export default function TermsPage() {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
                <strong>Template — pending legal review.</strong> This is a minimal
                placeholder so the footer link resolves. Bracketed fields are
                fill-ins, not facts.
            </p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
                <section>
                    <h2 className="text-lg font-semibold text-foreground">The service</h2>
                    <p className="mt-2">
                        AI Content Engine generates creative assets (thumbnails,
                        scripts, sound effects, images) for your video projects. You
                        keep the rights to the content you create, subject to the
                        provider terms that govern the generation models.
                    </p>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-foreground">Fair use</h2>
                    <p className="mt-2">
                        Do not use the service to generate unlawful content or to
                        attack the platform. Plan quotas are enforced per account.
                    </p>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-foreground">Contact</h2>
                    <p className="mt-2">
                        Questions about these terms: [CONTACT EMAIL].
                    </p>
                </section>
                <p className="text-xs">
                    Governing entity: [COMPANY LEGAL NAME], [JURISDICTION]. Effective
                    date: [DATE].
                </p>
            </div>
        </div>
    );
}
