import { FolderPlus, Send, Sparkles } from 'lucide-react';

import { getTranslations } from '@/i18n/server';

/**
 * AR-022: the copy is in the catalog; the ICONS stay in the code, chosen by
 * the step's id.
 */
const STEP_ICONS = {
    create: FolderPlus,
    invite: Send,
    generate: Sparkles,
} as const;

interface StepCopy {
    id: keyof typeof STEP_ICONS;
    title: string;
    body: string;
}

export async function HowItWorks() {
    const t = await getTranslations('landing');
    const steps = t.raw('howItWorks.steps') as StepCopy[];

    return (
        <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-muted/30 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        {t('howItWorks.title')}
                    </h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">
                        {t('howItWorks.description')}
                    </p>
                </div>

                <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {steps.map((step, i) => {
                        const Icon = STEP_ICONS[step.id];
                        return (
                            <li
                                key={step.id}
                                className="relative rounded-2xl border border-border/60 bg-card p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </span>
                                    <span className="font-mono text-sm text-muted-foreground" aria-hidden>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {step.body}
                                </p>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
