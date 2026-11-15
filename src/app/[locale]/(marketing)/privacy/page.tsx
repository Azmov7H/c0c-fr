import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'How AI Content Engine handles account and usage data.',
};

/**
 * Minimal placeholder, deliberately obvious about it. The footer used to
 * link to a 404; a dead legal link on a SaaS footer is a trust problem
 * (T11 scope note). This page exists so the link resolves, and says what it
 * is: a template awaiting legal review — not a binding policy yet.
 *
 * The [BRACKETED] fields are placeholders. Do not remove the notice until a
 * lawyer has replaced them (tracked in T11-STATUS follow-ups).
 */
export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
                <strong>Template — pending legal review.</strong> This is a minimal
                placeholder so the footer link resolves. It is not a binding policy,
                and the bracketed fields below are fill-ins, not facts.
            </p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
                <section>
                    <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
                    <p className="mt-2">
                        Account details you provide (name, email address), the content
                        you create in the product, and basic usage data needed to run
                        the service and enforce plan quotas.
                    </p>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-foreground">How it is used</h2>
                    <p className="mt-2">
                        To operate your account, generate the assets you request, and
                        keep the service secure. We do not sell personal data.
                    </p>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-foreground">Contact</h2>
                    <p className="mt-2">
                        Questions about this policy: [CONTACT EMAIL].
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
