'use client';

import { useState } from 'react';
import { Download, FileImage, Music, RefreshCw, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectAudio, useGenerateAudio, useUpdateAudioSuggestion } from '@/features/audio/hooks/use-audio';
import { audioLayerOf, type AudioSuggestion } from '@/features/audio/types';
import { GenerationIndicator } from '@/features/billing/components/generation-indicator';
import { useMediaAllowance, useProjectMedia, useRegenerateMedia } from '@/features/media/hooks/use-media';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { useRegenerateThumbnail } from '@/features/thumbnails/hooks/use-thumbnails';

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
}: {
    title: string;
    rows: AudioSuggestion[];
    projectId: string;
    description: string;
    /** P11.2: the deep-link anchor for this stage panel. */
    anchor?: string;
}) {
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
                <Button
                    variant="outline"
                    size="sm"
                    className="h-11"
                    disabled={generate.isPending}
                    onClick={() => generate.mutate({ projectId })}
                >
                    <RefreshCw className="mr-1 size-4" aria-hidden={generate.isPending} />
                    Regenerate
                </Button>
            </CardHeader>
            <CardContent>
                {current ? (
                    <div className="space-y-3">
                        {current.fileUrl ? (
                            <>
                                <audio
                                    controls
                                    preload="none"
                                    src={current.fileUrl}
                                    className="w-full"
                                    aria-label={`${title} playback`}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Duration: {current.durationSeconds ? formatDuration(current.durationSeconds) : 'unknown'} · Source: {current.source ?? 'generated'}
                                </p>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline" size="sm" className="h-11">
                                        <a href={current.fileUrl} download={`audio.${current.format ?? 'mp3'}`} rel="noreferrer">
                                            <Download className="mr-1 size-4" aria-hidden="true" /> Download
                                        </a>
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Suggestions only — no audio file from the provider yet.</p>
                        )}
                        <div className="grid gap-4 border-t border-border/50 pt-3 sm:grid-cols-2">
                            <div>
                                <Label htmlFor={`volume-${current.id}`}>Volume ({Math.round((current.volume ?? 1) * 100)}%)</Label>
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
                                    aria-label={`Enable ${title}`}
                                />
                                <Label htmlFor={`enabled-${current.id}`}>Enabled</Label>
                            </div>
                        </div>
                        {rows.filter((a) => a.id !== current.id).map((row) => (
                            <p key={row.id} className="text-xs text-muted-foreground">
                                Older {title.toLowerCase()} from {formatDuration(row.durationSeconds ?? 0)} — history.
                            </p>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No {title.toLowerCase()} yet — regenerate to create it.</p>
                )}
            </CardContent>
        </Card>
    );
}

export function MediaWorkspace({ projectId }: { projectId: string }) {
    const projects = useProjects({ limit: 100 });
    const project = projects.data?.data.find((p) => p._id === projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const media = useProjectMedia(projectId);
    const audio = useProjectAudio(projectId);
    const allowance = useMediaAllowance(projectId);
    const regenMedia = useRegenerateMedia(projectId);
    const regenThumb = useRegenerateThumbnail();
    const [imgError, setImgError] = useState<Record<string, boolean>>({});
    const [replacing, setReplacing] = useState<number | null>(null);
    const [regenUrl, setRegenUrl] = useState('');

    const loading = thumbnails.isLoading || media.isLoading || audio.isLoading;
    if (loading) {
        return (
            <div className="grid gap-6" role="status" aria-label="Loading media">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
            </div>
        );
    }

    // Documented precedence: Project.thumbnailUrl, else latest completed Thumbnail.
    const latestThumb = (thumbnails.data ?? [])
        .filter((t) => t.status === 'completed' && t.imageUrl)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const thumbUrl = project?.thumbnailUrl ?? latestThumb?.imageUrl;

    const bySlot = (slot: number) =>
        (media.data?.data ?? []).find(
            (m) => m.category === 'image' && m.metadata && (m.metadata as { slot?: unknown }).slot === slot,
        );

    // P06.7: narration vs music/SFX are separate panels. Legacy rows (no
    // assetType) are narration bytes + suggestions in one — they show under
    // Narration with an upgrade note (regenerate to split them).
    const narrationRows = (audio.data ?? []).filter((a) => audioLayerOf(a) === 'narration');
    const musicRows = (audio.data ?? []).filter((a) => audioLayerOf(a) === 'music');
    const sfxRows = (audio.data ?? []).filter((a) => audioLayerOf(a) === 'sfx');
    const hasLegacy = (audio.data ?? []).some((a) => a.assetType === undefined);

    return (
        <div className="grid gap-6">
            <Card id="thumbnail">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="size-4" aria-hidden="true" /> Project Thumbnail
                    </CardTitle>
                    {/* P11.4: the server's remaining allowance on the control. */}
                    <GenerationIndicator className="mt-1" />
                </CardHeader>
                <CardContent>
                    {thumbUrl ? (
                        <div className="space-y-3">
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                {imgError.thumbnail ? (
                                    <p className="p-6 text-sm text-muted-foreground">This image link expired — regenerate it.</p>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={thumbUrl}
                                        alt="Project thumbnail"
                                        className="aspect-video w-full object-cover"
                                        onError={() => setImgError((e) => ({ ...e, thumbnail: true }))}
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm" className="h-11">
                                    <a href={thumbUrl} download={`thumbnail.png`} rel="noreferrer">
                                        <Download className="mr-1 size-4" aria-hidden="true" /> Download
                                    </a>
                                </Button>
                                {latestThumb && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-11"
                                        disabled={regenThumb.isPending}
                                        onClick={() => regenThumb.mutate({ id: latestThumb.id })}
                                    >
                                        <RefreshCw className="mr-1 size-4" aria-hidden={regenThumb.isPending} /> Regenerate
                                    </Button>
                                )}
                            </div>
                            {allowance.data?.thumbnail && (
                                <p className="text-xs text-muted-foreground">
                                    {allowance.data.thumbnail.used} of {allowance.data.thumbnail.limit ?? '∞'} thumbnail(s) used.
                                    {allowance.data.thumbnail.limit !== null && allowance.data.thumbnail.used >= allowance.data.thumbnail.limit
                                        ? ' At limit — regenerate or remove to add more.'
                                        : ''}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No thumbnail yet. Generate one from the Thumbnails section.</p>
                    )}
                </CardContent>
            </Card>

            <Card id="gallery">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="size-4" aria-hidden="true" /> AI Generated Images
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
                            return (
                                <div key={key} className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Slot {slot + 1}</p>
                                    <div className="overflow-hidden rounded-xl border border-border/50">
                                        {item?.fileUrl ? (
                                            imgError[key] ? (
                                                <p className="p-4 text-sm text-muted-foreground">Source expired — regenerate.</p>
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.fileUrl}
                                                    alt={`Generated image slot ${slot + 1}`}
                                                    className="aspect-square w-full object-cover"
                                                    onError={() => setImgError((e) => ({ ...e, [key]: true }))}
                                                />
                                            )
                                        ) : (
                                            <p className="flex aspect-square items-center justify-center text-sm text-muted-foreground">Empty</p>
                                        )}
                                    </div>
                                    {sceneRef && (
                                        <p className="text-xs text-muted-foreground">
                                            Scene {sceneRef}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        {replacing === slot && item ? (
                                            <div className="flex flex-1 items-center gap-2">
                                                <Input
                                                    value={regenUrl}
                                                    onChange={(e) => setRegenUrl(e.target.value)}
                                                    placeholder="https://…allowlisted host…"
                                                    aria-label={`New URL for slot ${slot + 1}`}
                                                    className="h-11 text-base"
                                                />
                                                <Button
                                                    size="sm"
                                                    className="h-11"
                                                    disabled={!regenUrl.trim() || regenMedia.isPending}
                                                    onClick={() => {
                                                        regenMedia.mutate(
                                                            { id: item._id, fileUrl: regenUrl.trim() },
                                                            { onSuccess: () => { setReplacing(null); setRegenUrl(''); } }
                                                        );
                                                    }}
                                                >
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-11" onClick={() => { setReplacing(null); setRegenUrl(''); }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-11"
                                                    disabled={!item}
                                                    onClick={() => setReplacing(slot)}
                                                >
                                                    <Upload className="mr-1 size-4" aria-hidden="true" /> Replace
                                                </Button>
                                                {item?.fileUrl && (
                                                    <Button asChild variant="ghost" size="sm" className="h-11">
                                                        <a href={item.fileUrl} download={`image-${slot + 1}.png`} rel="noreferrer">
                                                            <Download className="mr-1 size-4" aria-hidden="true" /> Download
                                                        </a>
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {imagesAtCap
                                            ? `Gallery at limit (${allowance.data?.images.used}/${allowance.data?.images.limit} images) — regenerate or remove to add more.`
                                            : `${allowance.data?.images.used ?? 0} of ${allowance.data?.images.limit ?? '∞'} images used.`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <LayerCard
                title="Narration"
                rows={narrationRows}
                projectId={projectId}
                description="Voiceover from the verified TTS voice. Playback uses the current narration only."
                anchor="narration"
            />
            {hasLegacy && narrationRows.length > 0 && (
                <p role="note" className="text-sm text-muted-foreground">
                    Older audio combines narration and suggestions in one row — regenerate to split them into narration, music, and SFX.
                </p>
            )}
            <LayerCard
                title="Music"
                rows={musicRows}
                projectId={projectId}
                description="Background music suggestions. Volume and enable are per-layer."
            />
            <LayerCard
                title="Sound effects"
                rows={sfxRows}
                projectId={projectId}
                description="SFX suggestions. Independent of narration."
                anchor="effects"
            />
        </div>
    );
}
