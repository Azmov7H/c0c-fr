'use client';

import { useState } from 'react';
import { Download, FileImage, Music, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectAudio, useGenerateAudio, useUpdateAudioSuggestion } from '@/features/audio/hooks/use-audio';
import { audioLayerOf, type AudioSuggestion } from '@/features/audio/types';
import { GenerationIndicator } from '@/features/billing/components/generation-indicator';
import {
    useCreateMedia,
    useDeleteMedia,
    useMediaAllowance,
    useProjectMedia,
    useRegenerateMedia,
} from '@/features/media/hooks/use-media';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { useRegenerateThumbnail } from '@/features/thumbnails/hooks/use-thumbnails';
import { UnsplashAttribution } from '@/features/images/components/unsplash-attribution';
import { useTrackImageDownload } from '@/features/images/hooks/use-images';
import {
    unsplashMetadataFromPhoto,
    unsplashMetadataOf,
    type UnsplashPhoto,
} from '@/features/images/types';

/**
 * The picker is loaded on demand (the P05.7 pattern): the dialog, the
 * orientation select and the search machinery are only needed once somebody
 * actually opens it, and the project page has a first-load budget.
 */
const ImagePicker = dynamic(
    () => import('@/features/images/components/image-picker').then((m) => m.ImagePicker),
    {
        ssr: false,
        loading: () => <Skeleton className="h-8 w-32 rounded-md" />,
    }
);

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function LayerCard({
    title,
    rows,
    projectId,
    description,
    anchor,
    canGenerate = true,
    hint,
}: {
    title: string;
    rows: AudioSuggestion[];
    projectId: string;
    description: string;
    /** P11.2: the deep-link anchor for this stage panel. */
    anchor?: string;
    /** Sound Mail has a dedicated upload/generate flow, not generic regeneration. */
    canGenerate?: boolean;
    hint?: string;
}) {
    const t = useTranslations('media');
    const tw = useTranslations('workspace');
    const generate = useGenerateAudio();
    const update = useUpdateAudioSuggestion();
    const current = rows.find((a) => a.isCurrent) ?? rows[0];

    return (
        <Card id={anchor}>
            <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Music className="size-4" aria-hidden="true" /> {title}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    {/* P11.4: the server's remaining allowance on the control. */}
                    <GenerationIndicator className="mt-1" />
                </div>
                {canGenerate ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-11"
                        disabled={generate.isPending}
                        onClick={() => generate.mutate({ projectId })}
                    >
                        <RefreshCw className="me-1 size-4" aria-hidden={generate.isPending} />
                        {t('regenerate')}
                    </Button>
                ) : null}
            </CardHeader>
            <CardContent>
                {hint ? <p className="mb-3 text-xs text-muted-foreground">{hint}</p> : null}
                {current ? (
                    <div className="space-y-3">
                        {current.fileUrl ? (
                            <>
                                <audio
                                    controls
                                    dir="ltr"
                                    preload="none"
                                    src={current.fileUrl}
                                    className="w-full"
                                    aria-label={tw('media.playbackAria', { title })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('audio.duration', {
                                        duration: current.durationSeconds
                                            ? formatDuration(current.durationSeconds)
                                            : t('audio.unknown'),
                                        source: current.source ?? t('audio.generated'),
                                    })}
                                </p>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline" size="sm" className="h-11">
                                        <a href={current.fileUrl} download={`audio.${current.format ?? 'mp3'}`} rel="noreferrer">
                                            <Download className="me-1 size-4" aria-hidden="true" /> {t('download')}
                                        </a>
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">{t('audio.suggestionsOnly')}</p>
                        )}
                        <div className="grid gap-4 border-t border-border/50 pt-3 sm:grid-cols-2">
                            <div>
                                <Label htmlFor={`volume-${current.id}`}>
                                    {t('audio.volume', {
                                        percent: Math.round((current.volume ?? 1) * 100),
                                    })}
                                </Label>
                                <Input
                                    id={`volume-${current.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={current.volume ?? 1}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        if (Number.isFinite(value) && value >= 0 && value <= 1) {
                                            update.mutate({ id: current.id, data: { volume: value } });
                                        }
                                    }}
                                    className="mt-2 h-11 text-base"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    id={`enabled-${current.id}`}
                                    type="checkbox"
                                    checked={current.enabled ?? true}
                                    onChange={(e) => update.mutate({ id: current.id, data: { enabled: e.target.checked } })}
                                    className="size-5"
                                    aria-label={t('audio.enable', { title })}
                                />
                                <Label htmlFor={`enabled-${current.id}`}>{t('audio.enable', { title })}</Label>
                            </div>
                        </div>
                        {rows.filter((a) => a.id !== current.id).map((row) => (
                            <p key={row.id} className="text-xs text-muted-foreground">
                                {t('audio.history', {
                                    title: title.toLowerCase(),
                                    duration: formatDuration(row.durationSeconds ?? 0),
                                })}
                            </p>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{t('audio.empty', { title: title.toLowerCase() })}</p>
                )}
            </CardContent>
        </Card>
    );
}

export function MediaWorkspace({ projectId }: { projectId: string }) {
    const t = useTranslations('media');
    const tw = useTranslations('workspace');
    const projects = useProjects({ limit: 100 });
    const project = projects.data?.data.find((p) => p._id === projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const media = useProjectMedia(projectId);
    const audio = useProjectAudio(projectId);
    const allowance = useMediaAllowance(projectId);
    const regenMedia = useRegenerateMedia(projectId);
    const createMedia = useCreateMedia(projectId);
    const deleteMedia = useDeleteMedia(projectId);
    const regenThumb = useRegenerateThumbnail();
    const trackDownload = useTrackImageDownload();
    const [imgError, setImgError] = useState<Record<string, boolean>>({});

    const loading = thumbnails.isLoading || media.isLoading || audio.isLoading;
    if (loading) {
        return (
            <div className="grid gap-6" role="status" aria-label={tw('media.loading')}>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
            </div>
        );
    }

    // Documented precedence: Project.thumbnailUrl, else latest completed Thumbnail.
    const latestThumb = (thumbnails.data ?? [])
        .filter((t2) => t2.status === 'completed' && t2.imageUrl)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const thumbUrl = project?.thumbnailUrl ?? latestThumb?.imageUrl;

    const bySlot = (slot: number) =>
        (media.data?.data ?? []).find(
            (m) => m.category === 'image' && m.metadata && (m.metadata as { slot?: unknown }).slot === slot,
        );

    /**
     * The user picked a photo for this slot.
     *
     * A slot that already holds an asset is replaced in place (the siblings
     * are untouched); an empty slot gets a new asset. Either way the photo's
     * provenance travels with it, so the credit is always available.
     */
    const applyPhoto = (slot: number, item: ReturnType<typeof bySlot>, photo: UnsplashPhoto) => {
        const metadata = { ...unsplashMetadataFromPhoto(photo), slot };
        if (item) {
            regenMedia.mutate({
                id: item._id,
                fileUrl: photo.imageUrl,
                thumbnailUrl: photo.thumbnailUrl,
                source: 'external',
                metadata,
                width: photo.width,
                height: photo.height,
            });
            return;
        }
        createMedia.mutate({
            title: photo.altDescription || photo.photographerName || t('gallery.untitled'),
            description: photo.description,
            category: 'image',
            source: 'external',
            mimeType: 'image/jpeg',
            fileUrl: photo.imageUrl,
            thumbnailUrl: photo.thumbnailUrl,
            width: photo.width,
            height: photo.height,
            metadata,
            projectId,
        });
    };

    // P06.7: narration vs music/SFX are separate panels. Legacy rows (no
    // assetType) are narration bytes + suggestions in one — they show under
    // Narration with an upgrade note (regenerate to split them).
    const narrationRows = (audio.data ?? []).filter((a) => audioLayerOf(a) === 'narration');
    const musicRows = (audio.data ?? []).filter((a) => audioLayerOf(a) === 'music');
    const sfxRows = (audio.data ?? []).filter((a) => audioLayerOf(a) === 'sfx');
    const soundMailRows = (audio.data ?? []).filter((a) => audioLayerOf(a) === 'soundmail');
    const hasLegacy = (audio.data ?? []).some((a) => a.assetType === undefined);

    return (
        <div className="grid gap-6">
            <Card id="thumbnail">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="size-4" aria-hidden="true" /> {t('thumbnail.title')}
                    </CardTitle>
                    {/* P11.4: the server's remaining allowance on the control. */}
                    <GenerationIndicator className="mt-1" />
                </CardHeader>
                <CardContent>
                    {thumbUrl ? (
                        <div className="space-y-3">
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                {imgError.thumbnail ? (
                                    <p className="p-6 text-sm text-muted-foreground">{t('thumbnail.expired')}</p>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={thumbUrl}
                                        alt={t('thumbnail.alt')}
                                        className="aspect-video w-full object-cover"
                                        onError={() => setImgError((e) => ({ ...e, thumbnail: true }))}
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm" className="h-11">
                                    <a
                                        href={thumbUrl}
                                        download={`thumbnail.png`}
                                        rel="noreferrer"
                                        // Downloading the photo IS a download:
                                        // the guidelines ask for the event.
                                        onClick={() => {
                                            const unsplash = unsplashMetadataOf(latestThumb?.metadata);
                                            if (!unsplash) return;
                                            trackDownload.mutate({
                                                photoId: unsplash.photoId,
                                                downloadLocation: unsplash.downloadLocation,
                                            });
                                        }}
                                    >
                                        <Download className="me-1 size-4" aria-hidden="true" /> {t('download')}
                                    </a>
                                </Button>
                                {latestThumb && (
                                    <>
                                        <ImagePicker
                                            selected={unsplashMetadataOf(latestThumb.metadata)}
                                            triggerLabel={t('thumbnail.replace')}
                                            orientation="landscape"
                                            onSelect={(photo) =>
                                                regenThumb.mutate({ id: latestThumb.id, image: photo })
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-11"
                                            disabled={regenThumb.isPending}
                                            onClick={() => regenThumb.mutate({ id: latestThumb.id })}
                                        >
                                            <RefreshCw className="me-1 size-4" aria-hidden={regenThumb.isPending} /> {t('regenerate')}
                                        </Button>
                                    </>
                                )}
                            </div>
                            {latestThumb && unsplashMetadataOf(latestThumb.metadata) && (
                                <UnsplashAttribution photo={unsplashMetadataOf(latestThumb.metadata)!} />
                            )}
                            {allowance.data?.thumbnail && (
                                <p className="text-xs text-muted-foreground">
                                    {t('thumbnail.usage', {
                                        used: allowance.data.thumbnail.used,
                                        limit: allowance.data.thumbnail.limit ?? '∞',
                                    })}
                                    {allowance.data.thumbnail.limit !== null && allowance.data.thumbnail.used >= allowance.data.thumbnail.limit
                                        ? ` ${t('thumbnail.atLimit')}`
                                        : ''}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('thumbnail.empty')}</p>
                    )}
                </CardContent>
            </Card>

            <Card id="gallery">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="size-4" aria-hidden="true" /> {t('gallery.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[0, 1, 2].map((slot) => {
                            const item = bySlot(slot);
                            const key = `slot-${slot}`;
                            const imagesAtCap =
                                allowance.data?.images.limit !== null &&
                                allowance.data?.images.limit !== undefined &&
                                allowance.data.images.used >= allowance.data.images.limit;
                            const sceneRef =
                                item?.metadata &&
                                typeof (item.metadata as { sceneRef?: unknown }).sceneRef === 'string'
                                    ? String((item.metadata as { sceneRef: string }).sceneRef)
                                    : undefined;
                            const unsplash = unsplashMetadataOf(item?.metadata);
                            return (
                                <div key={key} className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        {t('gallery.slot', { n: slot + 1 })}
                                    </p>
                                    <div className="overflow-hidden rounded-xl border border-border/50">
                                        {item?.fileUrl ? (
                                            imgError[key] ? (
                                                <p className="p-4 text-sm text-muted-foreground">{t('gallery.expired')}</p>
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.fileUrl}
                                                    alt={unsplash?.altDescription || t('gallery.imageAlt', { n: slot + 1 })}
                                                    className="aspect-square w-full object-cover"
                                                    onError={() => setImgError((e) => ({ ...e, [key]: true }))}
                                                />
                                            )
                                        ) : (
                                            <p className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                                                {t('gallery.empty')}
                                            </p>
                                        )}
                                    </div>
                                    {/* The credit the Unsplash guidelines require. */}
                                    {unsplash && <UnsplashAttribution photo={unsplash} />}
                                    {sceneRef && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('gallery.scene', { ref: sceneRef })}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <ImagePicker
                                            selected={unsplash}
                                            triggerLabel={item ? t('gallery.replace') : t('gallery.pick')}
                                            orientation="squarish"
                                            onSelect={(photo) => applyPhoto(slot, item, photo)}
                                            onClear={item ? () => deleteMedia.mutate(item._id) : undefined}
                                        />
                                        {item?.fileUrl && (
                                            <Button asChild variant="ghost" size="sm" className="h-11">
                                                <a
                                                    href={item.fileUrl}
                                                    download={`image-${slot + 1}.jpg`}
                                                    rel="noreferrer"
                                                    // Downloading the photo IS a
                                                    // download: the guidelines ask
                                                    // for the event to be recorded.
                                                    onClick={() => {
                                                        if (!unsplash) return;
                                                        trackDownload.mutate({
                                                            photoId: unsplash.photoId,
                                                            downloadLocation: unsplash.downloadLocation,
                                                        });
                                                    }}
                                                >
                                                    <Download className="me-1 size-4" aria-hidden="true" /> {t('download')}
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {imagesAtCap
                                            ? t('gallery.atLimit', {
                                                used: allowance.data?.images.used ?? 0,
                                                limit: allowance.data?.images.limit ?? 0,
                                            })
                                            : t('gallery.usage', {
                                                used: allowance.data?.images.used ?? 0,
                                                limit: allowance.data?.images.limit ?? '∞',
                                            })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <LayerCard
                title={t('audio.narration')}
                rows={narrationRows}
                projectId={projectId}
                description={t('audio.narrationDescription')}
                anchor="narration"
            />
            {hasLegacy && narrationRows.length > 0 && (
                <p role="note" className="text-sm text-muted-foreground">
                    {t('audio.legacyNote')}
                </p>
            )}
            <LayerCard
                title={t('audio.music')}
                rows={musicRows}
                projectId={projectId}
                description={t('audio.musicDescription')}
            />
            <LayerCard
                title={t('audio.sfx')}
                rows={sfxRows}
                projectId={projectId}
                description={t('audio.sfxDescription')}
                anchor="effects"
            />
            <LayerCard
                title={t('audio.soundMail')}
                rows={soundMailRows}
                projectId={projectId}
                description={t('audio.soundMailDescription')}
                anchor="sound-mail"
                canGenerate={false}
                hint={t('audio.soundMailHint')}
            />
        </div>
    );
}
