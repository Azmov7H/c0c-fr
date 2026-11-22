'use client';

import { useProjectAudio } from '@/features/audio/hooks/use-audio';
import { audioLayerOf } from '@/features/audio/types';
import { useProjectMedia } from '@/features/media/hooks/use-media';
import { useProjectScripts } from '@/features/scripts/hooks/use-scripts';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';
import { UnsplashAttribution } from '@/features/images/components/unsplash-attribution';
import { unsplashMetadataOf } from '@/features/images/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { FileText, Image as ImageIcon, Music, PackageOpen } from 'lucide-react';

import { useProject } from '../../hooks/use-projects';
import { missingAssetLabel } from '../../lib/workspace-labels';

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
    const t = useTranslations('workspace');
    const project = useProject(projectId);
    const scripts = useProjectScripts(projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const media = useProjectMedia(projectId);
    const audio = useProjectAudio(projectId);

    const loading =
        project.isLoading || scripts.isLoading || thumbnails.isLoading || media.isLoading || audio.isLoading;
    if (loading) {
        return (
            <div className="space-y-3" role="status" aria-label={t('preview.loading')}>
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
    if (!script) missing.push(missingAssetLabel(t, 'script'));
    if (!thumbUrl) missing.push(missingAssetLabel(t, 'thumbnail'));
    if (images.length === 0) missing.push(missingAssetLabel(t, 'sceneImages'));
    if (!narration) missing.push(missingAssetLabel(t, 'narration'));

    if (!script && !thumbUrl && images.length === 0 && !narration) {
        return (
            <EmptyState
                title={t('preview.emptyTitle')}
                description={t('preview.emptyDescription')}
                icon={PackageOpen}
            />
        );
    }

    return (
        <div className="space-y-6">
            {missing.length > 0 ? (
                <p className="text-sm text-muted-foreground" role="status">
                    {t('preview.stillMissing', { list: missing.join(', ') })}
                </p>
            ) : null}

            {thumbUrl ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ImageIcon className="size-4" aria-hidden="true" />
                            {t('preview.thumbnailTitle')}
                        </CardTitle>
                        <CardDescription>{t('preview.thumbnailDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-xl border border-border/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={thumbUrl}
                                alt={t('preview.thumbnailAlt')}
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
                            {t('preview.imagesTitle')}
                            <Badge variant="secondary">{images.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid gap-3 sm:grid-cols-3">
                            {images.map((item) => {
                                const unsplash = unsplashMetadataOf(item.metadata);
                                return (
                                    <li key={item._id} className="overflow-hidden rounded-xl border border-border/50">
                                        {item.fileUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.fileUrl}
                                                alt={item.title || t('preview.imageAlt')}
                                                className="aspect-video w-full object-cover"
                                            />
                                        ) : null}
                                        {/* The credit the Unsplash guidelines require. */}
                                        {unsplash && (
                                            <div className="p-2">
                                                <UnsplashAttribution photo={unsplash} />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
            ) : null}

            {script ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="size-4" aria-hidden="true" />
                            {t('preview.scriptTitle')}
                            <Badge variant="secondary">{t('preview.scriptVersion', { version: script.version })}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {t('preview.scriptDetail', {
                                scenes: script.sections.length,
                                words: script.wordCount,
                            })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3">
                            {script.sections.map((section) => (
                                <li key={section.order}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {section.label}
                                    </p>
                                    <p dir="auto" className="mt-1 whitespace-pre-wrap text-sm leading-6">
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
                            {t('preview.narrationTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <audio
                            controls
                            preload="none"
                            src={narration.fileUrl}
                            className="w-full"
                            aria-label={t('preview.narrationAria')}
                        />
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
