import {
    Captions,
    FileText,
    Image as ImageIcon,
    ListMusic,
    Play,
    Type,
} from 'lucide-react';

import type { LandingAsset } from '../types';

const ASSETS: readonly LandingAsset[] = [
    {
        id: 'thumbnails',
        title: 'Thumbnails',
        description:
            'Generate on-brand cover images from your script — one style per project, so every thumbnail looks like the same channel.',
        icon: Captions,
    },
    {
        id: 'scripts',
        title: 'Scripts',
        description:
            'Draft the hook, the outline and the full script with the structure of your niche built in. Edit anything by hand; the draft is a starting point, not a locked output.',
        icon: FileText,
    },
    {
        id: 'sound-effects',
        title: 'Sound Effects',
        description:
            'Describe the mood — "tense build to a punchline" — and get sound effects and music beds that fit the cut instead of hunting stock libraries.',
        icon: ListMusic,
    },
    {
        id: 'images',
        title: 'Images',
        description:
            'Scene stills and supporting visuals that match the thumbnails, stored next to the project they belong to.',
        icon: ImageIcon,
    },
];

/**
 * The four assets, one card each, each with a small example output. The
 * examples are UI previews built from the same design tokens as the product,
 * labelled "Example" — they are illustrative samples, not fabricated
 * customer work, and the label says so.
 */
export function Assets() {
    return (
        <section id="assets" className="scroll-mt-20 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        The four assets, in one project
                    </h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">
                        Every generation is stored with the project it belongs to, in the
                        style you set once.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {ASSETS.map((asset) => (
                        <article
                            key={asset.id}
                            className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <asset.icon className="h-5 w-5" aria-hidden />
                                </span>
                                <h3 className="text-xl font-semibold">{asset.title}</h3>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                {asset.description}
                            </p>
                            <div className="mt-5 flex-1">
                                <ExampleOutput id={asset.id} />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Small, token-styled previews. `<figure>` + visible "Example" badge. */
function ExampleOutput({ id }: { id: LandingAsset['id'] }) {
    return (
        <figure
            className="overflow-hidden rounded-xl border border-border/60 bg-muted/40"
            aria-label={`Example ${id.replace('-', ' ')} output`}
        >
            {id === 'thumbnails' && (
                <div className="grid grid-cols-2 gap-2 p-3">
                    <div className="flex aspect-video flex-col justify-end rounded-lg bg-linear-to-tr from-brand-violet/70 to-brand-cyan/60 p-3">
                        <span className="text-sm font-bold leading-tight text-white">
                            5 Editing Tricks I Wish I Knew
                        </span>
                    </div>
                    <div className="flex aspect-video flex-col justify-end rounded-lg bg-linear-to-br from-brand-pink/70 to-brand-red/60 p-3">
                        <span className="text-sm font-bold leading-tight text-white">
                            Why Your Hook Fails
                        </span>
                    </div>
                </div>
            )}

            {id === 'scripts' && (
                <div className="space-y-2 p-4 font-mono text-xs">
                    <p className="text-muted-foreground">
                        <span className="mr-2 rounded bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground">HOOK</span>
                        Nobody talks about the second week.
                    </p>
                    <p className="text-muted-foreground">
                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">BEAT 1</span>
                        The first week is easy — the format is new.
                    </p>
                    <p className="text-muted-foreground">
                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">BEAT 2</span>
                        Then the numbers flatten, and here is why.
                    </p>
                </div>
            )}

            {id === 'sound-effects' && (
                <div className="flex items-center gap-3 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Play className="h-4 w-4 translate-x-px fill-current" aria-hidden />
                    </span>
                    <div className="flex h-8 flex-1 items-end gap-1" aria-hidden>
                        {[40, 70, 55, 90, 60, 30, 75, 95, 50, 65, 85, 45, 60, 35, 70, 55].map(
                            (h, i) => (
                                <span
                                    key={i}
                                    style={{ height: `${h}%` }}
                                    className="w-1.5 rounded-full bg-primary/50"
                                />
                            )
                        )}
                    </div>
                </div>
            )}

            {id === 'images' && (
                <div className="grid grid-cols-3 gap-2 p-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`flex aspect-square items-center justify-center rounded-lg ${
                                i === 1 ? 'bg-brand-violet/50' : 'bg-muted'
                            }`}
                        >
                            <ImageIcon
                                className={`h-6 w-6 ${i === 1 ? 'text-white/80' : 'text-muted-foreground/60'}`}
                                aria-hidden
                            />
                        </div>
                    ))}
                </div>
            )}

            <figcaption className="flex items-center gap-1.5 border-t border-border/60 bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
                <Type className="h-3 w-3" aria-hidden />
                Example output — sample content, not a customer project
            </figcaption>
        </figure>
    );
}
