'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
    FileText,
    Image as ImageIcon,
    Loader2,
    Music,
    Search,
    Sparkles,
    TriangleAlert,
    Upload,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectAudio, useGenerateAudio } from '@/features/audio/hooks/use-audio';
import { useProjectMedia } from '@/features/media/hooks/use-media';
import { useProjectScripts, useGenerateScript } from '@/features/scripts/hooks/use-scripts';
import { useProjectSEO, useGenerateSEO } from '@/features/seo/hooks/use-seo';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';
import { toApiError } from '@/lib/api-error';
import { formatRelativeTime } from '@/lib/relative-time';
import type { ProjectRole } from '../../types';
import { can } from '../../lib/permissions';
import { ThumbnailGenerator } from '@/features/thumbnails/components/thumbnail-generator';

const isQuotaError = (error: unknown): boolean => {
    const apiError = toApiError(error, '');
    return apiError.status === 429 || apiError.code === 'QUOTA_EXHAUSTED' || apiError.code === 'RATE_LIMITED';
};

function AssetRow({
    title,
    subtitle,
    status,
    createdAt,
    imageUrl,
}: {
    title: string;
    subtitle?: string;
    status?: string;
    createdAt?: string;
    imageUrl?: string;
}) {
    return (
        <li className="flex items-center gap-3 py-3">
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="size-10 rounded-md object-cover" />
            ) : (
                <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                    <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">
                    {[subtitle, createdAt ? formatRelativeTime(createdAt).relative : null]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            </div>
            {status && <Badge variant="outline">{status}</Badge>}
        </li>
    );
}

function GroupCard({
    title,
    icon: Icon,
    count,
    description,
    action,
    children,
}: {
    title: string;
    icon: typeof FileText;
    count: number;
    description: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="size-4" aria-hidden="true" />
                        {title}
                        <Badge variant="secondary">{count}</Badge>
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                {action}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

export function AssetsTab({ projectId, role }: { projectId: string; role: ProjectRole }) {
    const mayEdit = can(role, 'edit');
    const [quotaError, setQuotaError] = useState<string | null>(null);

    const scripts = useProjectScripts(projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const audio = useProjectAudio(projectId);
    const seo = useProjectSEO(projectId);
    const media = useProjectMedia(projectId);

    const generateScript = useGenerateScript();
    const generateAudio = useGenerateAudio();
    const generateSEO = useGenerateSEO();

    const onGenerationError = (error: unknown) => {
        if (isQuotaError(error)) {
            setQuotaError(toApiError(error, 'Generation quota exhausted.').message);
            return;
        }
        setQuotaError(null);
    };

    const loading =
        scripts.isLoading || thumbnails.isLoading || audio.isLoading || seo.isLoading || media.isLoading;

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2" role="status" aria-label="Loading assets">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-64 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {quotaError && (
                <Alert>
                    <TriangleAlert />
                    <AlertTitle>Generation quota reached</AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center gap-3">
                        {quotaError}
                        <Button asChild className="h-11">
                            <Link href="/settings/billing">Upgrade for more generations</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <GroupCard
                    title="Scripts"
                    icon={FileText}
                    count={scripts.data?.length ?? 0}
                    description="Generated scripts for this project."
                    action={
                        <Button
                            className="h-11"
                            disabled={!mayEdit || generateScript.isPending}
                            onClick={() =>
                                generateScript.mutate(projectId, { onError: onGenerationError })
                            }
                        >
                            {generateScript.isPending ? (
                                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Sparkles className="mr-2 size-4" aria-hidden="true" />
                            )}
                            Generate
                        </Button>
                    }
                >
                    {(scripts.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No scripts yet. {mayEdit ? 'Generate the first one.' : 'An editor can generate one.'}
                        </p>
                    ) : (
                        <ul>{(scripts.data ?? []).slice(0, 5).map((script) => (
                            <AssetRow
                                key={script.id}
                                title={`Version ${script.version}`}
                                subtitle={`${script.wordCount} words`}
                                status={script.status}
                                createdAt={script.createdAt}
                            />
                        ))}</ul>
                    )}
                </GroupCard>

                <GroupCard
                    title="Thumbnails"
                    icon={ImageIcon}
                    count={thumbnails.data?.length ?? 0}
                    description="Visual concepts generated from your idea."
                >
                    {(thumbnails.data ?? []).length === 0 ? (
                        mayEdit ? (
                            <ThumbnailGenerator projectId={projectId} />
                        ) : (
                            <p className="text-sm text-muted-foreground">No thumbnails yet.</p>
                        )
                    ) : (
                        <ul>{(thumbnails.data ?? []).slice(0, 5).map((thumbnail) => (
                            <AssetRow
                                key={thumbnail.id}
                                title={thumbnail.prompt}
                                subtitle={thumbnail.stylePreset}
                                status={thumbnail.status}
                                createdAt={thumbnail.createdAt}
                                imageUrl={thumbnail.imageUrl}
                            />
                        ))}</ul>
                    )}
                </GroupCard>

                <GroupCard
                    title="Audio"
                    icon={Music}
                    count={audio.data?.length ?? 0}
                    description="Music and sound-effect suggestions."
                    action={
                        <Button
                            className="h-11"
                            disabled={!mayEdit || generateAudio.isPending}
                            onClick={() =>
                                generateAudio.mutate(
                                    { projectId },
                                    { onError: onGenerationError }
                                )
                            }
                        >
                            {generateAudio.isPending ? (
                                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Sparkles className="mr-2 size-4" aria-hidden="true" />
                            )}
                            Generate
                        </Button>
                    }
                >
                    {(audio.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No audio profile yet.</p>
                    ) : (
                        <ul>{(audio.data ?? []).slice(0, 5).map((suggestion) => (
                            <AssetRow
                                key={suggestion.id}
                                title={`${suggestion.mood} · ${suggestion.musicType}`}
                                subtitle={`${suggestion.tracks.length} tracks`}
                                status={suggestion.status}
                                createdAt={suggestion.createdAt}
                            />
                        ))}</ul>
                    )}
                </GroupCard>

                <GroupCard
                    title="SEO"
                    icon={Search}
                    count={seo.data ? 1 : 0}
                    description="Titles, hashtags and keywords."
                    action={
                        <Button
                            className="h-11"
                            disabled={!mayEdit || generateSEO.isPending}
                            onClick={() =>
                                generateSEO.mutate(projectId, { onError: onGenerationError })
                            }
                        >
                            {generateSEO.isPending ? (
                                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Sparkles className="mr-2 size-4" aria-hidden="true" />
                            )}
                            Generate
                        </Button>
                    }
                >
                    {seo.data ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{seo.data.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {seo.data.hashtags.slice(0, 12).map((tag) => (
                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No SEO profile yet.</p>
                    )}
                </GroupCard>

                <GroupCard
                    title="Media"
                    icon={Upload}
                    count={media.data?.meta?.total ?? media.data?.data.length ?? 0}
                    description="Images, video and documents attached to the project."
                >
                    {(media.data?.data ?? []).length === 0 ? (
                        <EmptyState
                            className="min-h-0 border-0 bg-transparent p-0"
                            icon={Upload}
                            title="No media yet"
                            description="Uploads need a storage provider, which is not configured yet."
                        />
                    ) : (
                        <ul>{(media.data?.data ?? []).slice(0, 5).map((item) => (
                            <AssetRow
                                key={item._id}
                                title={item.title}
                                subtitle={item.category}
                                createdAt={item.createdAt}
                                imageUrl={item.thumbnailUrl}
                            />
                        ))}</ul>
                    )}
                </GroupCard>
            </div>

            {!mayEdit && (
                <p className="text-sm text-muted-foreground">
                    Your role can view assets but not generate or change them.
                </p>
            )}
        </div>
    );
}
