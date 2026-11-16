import { FileText, Image as ImageIcon, Music, Palette } from 'lucide-react';

import { DirIcon } from '@/components/icons/dir-icon';
import { getTranslations } from '@/i18n/server';

/**
 * Make the pain legible. No invented numbers — the section describes the
 * real workflow a video creator juggles today (four tools plus the folder
 * shuffle between them), which is the problem the product exists to remove.
 */
export async function Problem() {
    const t = await getTranslations('landing');
    const tools = t.raw('problem.tools') as string[];

    return (
        <section className="border-y border-border/60 bg-muted/30 py-16 md:py-24">
            <div className="container mx-auto max-w-4xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {t('problem.title')}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
                    {t('problem.description')}
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <FileText className="h-4 w-4 text-muted-foreground" aria-hidden /> {tools[0]}
                    </span>
                    <DirIcon name="MoveRight" className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <Palette className="h-4 w-4 text-muted-foreground" aria-hidden /> {tools[1]}
                    </span>
                    <DirIcon name="MoveRight" className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <Music className="h-4 w-4 text-muted-foreground" aria-hidden /> {tools[2]}
                    </span>
                    <DirIcon name="MoveRight" className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden /> {tools[3]}
                    </span>
                </div>

                <p className="mx-auto mt-8 max-w-xl text-sm text-muted-foreground">
                    {t('problem.note')}
                </p>
            </div>
        </section>
    );
}
