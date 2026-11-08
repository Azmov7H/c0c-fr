'use client';

import { useState } from 'react';
import { Download, FileImage, Music, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectAudio } from '@/features/audio/hooks/use-audio';
import { useProjectMedia } from '@/features/media/hooks/use-media';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';
import { useProjects } from '@/features/projects/hooks/use-projects';

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

export function MediaWorkspace({ projectId }: { projectId: string }) {
    const projects = useProjects({ limit: 100 });
    const project = projects.data?.data.find((p) => p._id === projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const media = useProjectMedia(projectId);
    const audio = useProjectAudio(projectId);
    const [imgError, setImgError] = useState<Record<string, boolean>>({});

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
    const currentAudio = (audio.data ?? []).find((a) => a.isCurrent) ?? (audio.data ?? [])[0];

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="size-4" aria-hidden="true" /> Project Thumbnail
                    </CardTitle>
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
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm" className="h-11">
                                    <a href={thumbUrl} download={`thumbnail.png`} rel="noreferrer">
                                        <Download className="mr-1 size-4" aria-hidden="true" /> Download
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No thumbnail yet. Generate one from the Thumbnails section.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
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
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-11" disabled>
                                            <Upload className="mr-1 size-4" aria-hidden="true" /> Replace
                                        </Button>
                                        {item?.fileUrl && (
                                            <Button asChild variant="ghost" size="sm" className="h-11">
                                                <a href={item.fileUrl} download={`image-${slot + 1}.png`} rel="noreferrer">
                                                    <Download className="mr-1 size-4" aria-hidden="true" /> Download
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground" title="Storage pending (M2-T26)">
                                        Replace pending — storage not configured.
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Music className="size-4" aria-hidden="true" /> Audio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {currentAudio?.fileUrl ? (
                        <div className="space-y-3">
                            <audio
                                controls
                                preload="none"
                                src={currentAudio.fileUrl}
                                className="w-full"
                                aria-label="Narration playback"
                            />
                            <p className="text-xs text-muted-foreground">
                                Duration: {currentAudio.durationSeconds ? formatDuration(currentAudio.durationSeconds) : 'unknown'} · Source: {currentAudio.source ?? 'generated'}
                            </p>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm" className="h-11">
                                    <a href={currentAudio.fileUrl} download={`narration.${currentAudio.format ?? 'mp3'}`} rel="noreferrer">
                                        <Download className="mr-1 size-4" aria-hidden="true" /> Download
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ) : currentAudio ? (
                        <p className="text-sm text-muted-foreground">Legacy suggestion (no playable file yet).</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">No audio yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
