import { FolderPlus, Send, Sparkles } from 'lucide-react';

const STEPS = [
    {
        icon: FolderPlus,
        title: 'Create a project',
        body: 'Pick the channel and the style once. Every thumbnail, script, sound and image after this point matches it.',
    },
    {
        icon: Send,
        title: 'Invite your team',
        body: 'Bring in your editor and designer with roles — owner, admin, editor or viewer — and they land straight in the same project.',
    },
    {
        icon: Sparkles,
        title: 'Generate everything',
        body: 'Write the brief. Collect the four assets: thumbnails, scripts, sound effects and images, all stored with the project.',
    },
] as const;

export function HowItWorks() {
    return (
        <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-muted/30 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        From brief to assets in three steps
                    </h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">
                        No pipeline to configure before you see anything.
                    </p>
                </div>

                <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {STEPS.map((step, i) => (
                        <li
                            key={step.title}
                            className="relative rounded-2xl border border-border/60 bg-card p-6"
                        >
                            <div className="flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <step.icon className="h-5 w-5" aria-hidden />
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
                    ))}
                </ol>
            </div>
        </section>
    );
}
