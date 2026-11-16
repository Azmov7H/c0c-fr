import {
    Captions,
    FileText,
    Image as ImageIcon,
    ListMusic,
    Play,
    Type,
} from 'lucide-react';

import { getTranslations } from '@/i18n/server';

import type { LandingAsset, LandingAssetCopy } from '../types';

/**
 * AR-022: the copy is in the catalog; the code keeps the ICONS.
 *
 * The icon is chosen by the asset's id — a code concern — while the title and
 * the description are copy, and copy belongs to `landing.assets.items`.
 */
const ASSETS: Record<LandingAsset['id'], LandingAsset['icon']> = {
    thumbnails: Captions,
    scripts: FileText,
    'sound-effects': ListMusic,
    images: ImageIcon,
};

/**
 * The four assets, one card each, each with a small example output. The
 * examples are UI previews built from the same design tokens as the product,
 * labelled "Example" — they are illustrative samples, not fabricated
 * customer work, and the label says so.
 */
export async function Assets() {
    const t = await getTranslations('landing');
    const items = t.raw('assets.items') as LandingAssetCopy[];

    return (
        <section id="assets" className="scroll-mt-20 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                        {t('assets.title')}
                    </h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">
                        {t('assets.description')}
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {items.map((asset) => {
                        const Icon = ASSETS[asset.id];
                        return (
                            <article
                                key={asset.id}
                                className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </span>
                                    <h3 className="text-xl font-semibold">{asset.title}</h3>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {asset.description}
                                </p>
                                <div className="mt-5 flex-1">
                                    <ExampleOutput id={asset.id} example={asset.example} />
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/** Small, token-styled previews. `<figure>` + visible "Example" badge. */
async function ExampleOutput({
    id,
    example,
}: {
    id: LandingAsset['id'];
    /** The label form the aria-label uses (the catalog owns the wording). */
    example: string;
}) {
    const t = await getTranslations('landing');
    const thumbnailSamples = t.raw('assets.samples.thumbnails') as string[];
    const scriptLabels = t.raw('assets.samples.scriptLabels') as string[];
    const scriptSamples = t.raw('assets.samples.scripts') as string[];

    return (
        <figure
            className="overflow-hidden rounded-xl border border-border/60 bg-muted/40"
            aria-label={t('assets.exampleLabel', { asset: example })}
        >
            {id === 'thumbnails' && (
                <div className="grid grid-cols-2 gap-2 p-3">
                    <div className="flex aspect-video flex-col justify-end rounded-lg bg-linear-to-tr from-brand-violet/70 to-brand-cyan/60 p-3">
                        <span className="text-sm font-bold leading-tight text-white">
                            {thumbnailSamples[0]}
                        </span>
                    </div>
                    <div className="flex aspect-video flex-col justify-end rounded-lg bg-linear-to-br from-brand-pink/70 to-brand-red/60 p-3">
                        <span className="text-sm font-bold leading-tight text-white">
                            {thumbnailSamples[1]}
                        </span>
                    </div>
                </div>
            )}

            {id === 'scripts' && (
                <div className="space-y-2 p-4 font-mono text-xs">
                    {scriptSamples.map((sample, index) => (
                        <p key={sample} className="text-muted-foreground">
                            {/* The first beat is the HOOK and carries the accent;
                                the beats that follow are muted — a presentation
                                decision, so it stays in the code. */}
                            <span
                                className={
                                    index === 0
                                        ? 'me-2 rounded bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground'
                                        : 'me-2 rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground'
                                }
                            >
                                {scriptLabels[index]}
                            </span>
                            {sample}
                        </p>
                    ))}
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
                {t('assets.exampleCaption')}
            </figcaption>
        </figure>
    );
}
