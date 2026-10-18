import { FileText, Image as ImageIcon, Music, MoveRight, Palette } from 'lucide-react';

/**
 * Make the pain legible. No invented numbers — the section describes the
 * real workflow a video creator juggles today (four tools plus the folder
 * shuffle between them), which is the problem the product exists to remove.
 */
export function Problem() {
    return (
        <section className="border-y border-border/60 bg-muted/30 py-16 md:py-24">
            <div className="container mx-auto max-w-4xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    A finished video touches five different tools
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
                    The script lives in one app, the thumbnail in another, the sound
                    effects come from a stock site, the images from somewhere else —
                    and the style quietly drifts apart between all of them.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <FileText className="h-4 w-4 text-muted-foreground" aria-hidden /> Docs for the script
                    </span>
                    <MoveRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <Palette className="h-4 w-4 text-muted-foreground" aria-hidden /> An editor for thumbnails
                    </span>
                    <MoveRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <Music className="h-4 w-4 text-muted-foreground" aria-hidden /> Stock sites for SFX
                    </span>
                    <MoveRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden /> Somewhere else for images
                    </span>
                </div>

                <p className="mx-auto mt-8 max-w-xl text-sm text-muted-foreground">
                    Moving files between them is the part that eats the evening.
                </p>
            </div>
        </section>
    );
}
