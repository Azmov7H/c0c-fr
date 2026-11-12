'use client';

import { useProjectAudio } from '@/features/audio/hooks/use-audio';
import { audioLayerOf } from '@/features/audio/types';
import { useProjectMedia } from '@/features/media/hooks/use-media';
import { useProjectScripts } from '@/features/scripts/hooks/use-scripts';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Image as ImageIcon, Music, PackageOpen } from 'lucide-react';

import { useProject } from '../../hooks/use-projects';

/**
 * P11.3 — the Preview stage.
 *
 * A read-only assembly of what the project HAS: the script, the thumbnail,
 * the gallery images and the narration. It never re-generates anything and
 * never invents a number — every row is an asset the server returned.
 *
 * The stage is derived (D12.B): the panel says plainly which parts are
 * still missing instead of hiding them.
 */
export function PreviewPanel({ projectId }: { projectId: string }) {
    const project = useProject(projectId);
    const scripts = useProjectScripts(projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const media = useProjectMedia(projectId);
    const audio = useProjectAudio(projectId);

    const loading =
        project.isLoading || scripts.isLoading || thumbnails.isLoading || media.isLoading || audio.isLoading;
    if (loading) {
        return (
            <div className="space-y-3" role="status" aria-label="Loading preview">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
        );
    }

    const script = [...(scripts.data ?? [])]
        .filter((s) => !s.isDeleted && s.sections.length > 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const thumbnail = [...(thumbnails.data ?? [])]
        .filter((t) => t.status === 'completed' && t.imageUrl)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const thumbUrl = project.data?.thumbnailUrl ?? thumbnail?.imageUrl;

    const images = (media.data?.data ?? []).filter(
        (item) =>
            item.category === 'image' &&
            item.metadata &&
            typeof (item.metadata as { slot?: unknown }).slot === 'number'
    );

    const narration = (audio.data ?? []).find(
        (row) => audioLayerOf(row) === 'narration' && !row.isDeleted && row.fileUrl
    );

    const missing: string[] = [];
    if (!script) missing.push('script');
    if (!thumbUrl) missing.push('thumbnail');
    if (images.length === 0) missing.push('scene images');
    if (!narration) missing.push('narration');

    if (!script && !thumbUrl && images.length === 0 && !narration) {
        return (
            <EmptyState
                title="Nothing to preview yet"
                description="Generate a script and some assets — they appear here as they land."
                icon={PackageOpen}
            />
        );
    }

    return (
        <div className="space-y-6">
            {missing.length > 0 ? (
                <p className="text-sm text-muted-foreground" role="status">
                    Still missing: {missing.join(', ')}. The preview shows what exists so far.
                </p>
            ) : null}

            {thumbUrl ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ImageIcon className="size-4" aria-hidden="true" />
                            Thumbnail
                        </CardTitle>
                        <CardDescription>The project&apos;s cover image.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-xl border border-border/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={thumbUrl}
                                alt="Project thumbnail"
                                className="aspect-video w-full object-cover"
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {images.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ImageIcon className="size-4" aria-hidden="true" />
                            Scene images
                            <Badge variant="secondary">{images.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid gap-3 sm:grid-cols-3">
                            {images.map((item) => (
                                <li key={item._id} className="overflow-hidden rounded-xl border border-border/50">
                                    {item.fileUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.fileUrl}
                                            alt={item.title || 'Scene image'}
                                            className="aspect-video w-full object-cover"
                                        />
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ) : null}

            {script ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="size-4" aria-hidden="true" />
                            Script
                            <Badge variant="secondary">v{script.version}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {script.sections.length} scene(s) · {script.wordCount} words
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3">
                            {script.sections.map((section) => (
                                <li key={section.order}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {section.label}
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                                        {section.content}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            ) : null}

            {narration?.fileUrl ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Music className="size-4" aria-hidden="true" />
                            Narration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <audio
                            controls
                            preload="none"
                            src={narration.fileUrl}
                            className="w-full"
                            aria-label="Narration playback"
                        />
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
