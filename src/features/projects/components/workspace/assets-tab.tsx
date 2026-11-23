'use client';

import { useUrlLocale } from '@/i18n/locale';
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
    FileText,
    Image as ImageIcon,
    Loader2,
    Music,
    Search,
    Sparkles,
    Upload,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectAudio, useGenerateAudio } from '@/features/audio/hooks/use-audio';
import dynamic from 'next/dynamic';
import { useProjectMedia } from '@/features/media/hooks/use-media';
import { useProjectScripts, useGenerateScript } from '@/features/scripts/hooks/use-scripts';
import { ProjectExport } from './project-export';

import { useProjectSEO, useGenerateSEO } from '@/features/seo/hooks/use-seo';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';
import { toApiError } from '@/lib/api-error';
import { isCreditError, isQuotaError } from '@/features/billing/lib/generation-error';
import type { ProjectRole } from '../../types';
import { can } from '../../lib/permissions';
import { workspaceRelativeTime } from '../../lib/workspace-labels';
import { ThumbnailGenerator } from '@/features/thumbnails/components/thumbnail-generator';
import { UpgradePrompt } from '@/features/billing/components/upgrade-prompt';
import { GenerationIndicator } from '@/features/billing/components/generation-indicator';
import { useBillingSummary } from '@/features/billing/hooks/use-billing';
import { quotaFor, usageFor } from '@/features/billing/lib/entitlements';

// P11.6: the shared error classifier (402 = credits, 429 = quota).
// P05.7: the per-scene editor (RHF + Zod) is split out of the Assets first
// load — visitors without a script never download the form machinery.
const ScriptEditor = dynamic(
    () => import('@/features/scripts/components/script-editor').then((m) => m.ScriptEditor),
    {
        ssr: false,
        loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
    }
);

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
    const locale = useUrlLocale();
    const t = useTranslations('workspace');
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
                    {[subtitle, createdAt ? workspaceRelativeTime(t, createdAt, locale) : null]
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
    anchor,
    children,
}: {
    title: string;
    icon: typeof FileText;
    count: number;
    description: string;
    action?: ReactNode;
    /** P11.2: the deep-link anchor for the stage that lives here. */
    anchor?: string;
    children: ReactNode;
}) {
    return (
        <Card id={anchor}>
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
    const t = useTranslations('workspace');
    const mayEdit = can(role, 'edit');
    const [quotaError, setQuotaError] = useState<string | null>(null);
    // P11.6: a 402 is money (credits), a 429 is time (quota) — they get
    // different prompts, and both are upgrade-aware.
    const [creditError, setCreditError] = useState<string | null>(null);
    const billing = useBillingSummary();
    const aiUsage = usageFor(billing.data, 'ai.generation');
    const aiLimit = aiUsage?.limit ?? quotaFor(billing.data, 'ai.generation');

    const scripts = useProjectScripts(projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const audio = useProjectAudio(projectId);
    const seo = useProjectSEO(projectId);
    const media = useProjectMedia(projectId);

    const generateScript = useGenerateScript();
    const generateAudio = useGenerateAudio();
    const generateSEO = useGenerateSEO();

    const onGenerationError = (error: unknown) => {
        const apiError = toApiError(error, '');
        if (isCreditError(error)) {
            setQuotaError(null);
            setCreditError(apiError.message);
            return;
        }
        if (isQuotaError(error)) {
            setQuotaError(toApiError(error, t('assets.quotaFallback')).message);
            setCreditError(null);
            return;
        }
        setQuotaError(null);
        setCreditError(null);
    };

    const loading =
        scripts.isLoading || thumbnails.isLoading || audio.isLoading || seo.isLoading || media.isLoading;

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2" role="status" aria-label={t('assets.loading')}>
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-64 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* P11.2: the export stage's panel anchor. */}
            <div id="export">
                <ProjectExport projectId={projectId} title={t('assets.projectTitle')} />
            </div>
            {quotaError && (
                <UpgradePrompt
                    title={t('assets.quotaTitle')}
                    description={quotaError}
                    ctaLabel={t('assets.quotaCta')}
                    feature="ai.generation"
                    used={aiUsage?.used}
                    limit={aiLimit}
                    resetAt={aiUsage?.resetAt}
                    className="items-start text-start"
                />
            )}
            {/* P11.6: 402 — the operation needs credits, not time. */}
            {creditError && (
                <UpgradePrompt
                    title={t('assets.creditTitle')}
                    description={creditError}
                    ctaLabel={t('assets.creditCta')}
                    feature="ai.generation"
                    className="items-start text-start"
                />
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <GroupCard
                    title={t('assets.scripts.title')}
                    icon={FileText}
                    count={scripts.data?.length ?? 0}
                    description={t('assets.scripts.description')}
                    anchor="scripts"
                    action={
                        <div className="flex flex-col items-end gap-1">
                            <Button
                                className="h-11"
                                disabled={!mayEdit || generateScript.isPending}
                                onClick={() =>
                                    generateScript.mutate(projectId, { onError: onGenerationError })
                                }
                            >
                                {generateScript.isPending ? (
                                    <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Sparkles className="me-2 size-4" aria-hidden="true" />
                                )}
                                {t('assets.generate')}
                            </Button>
                            {/* P11.4: the server's remaining allowance on the control. */}
                            <GenerationIndicator />
                        </div>
                    }
                >
                    {(scripts.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t('assets.scripts.empty', {
                                hint: mayEdit
                                    ? t('assets.scripts.emptyEditor')
                                    : t('assets.scripts.emptyViewer'),
                            })}
                        </p>
                    ) : (
                        <>
                            <ul>{(scripts.data ?? []).slice(0, 5).map((script) => (
                                <AssetRow
                                    key={script.id}
                                    title={t('assets.scripts.version', {
                                        version: script.version,
                                        scenes: script.sections.length,
                                    })}
                                    subtitle={t('assets.scripts.words', { count: script.wordCount })}
                                    status={script.status}
                                    createdAt={script.createdAt}
                                />
                            ))}</ul>
                            {mayEdit && (scripts.data ?? []).length > 0 && (
                                <div className="border-t border-border/50 pt-4">
                                    <ScriptEditor scriptId={String((scripts.data ?? [])[0]!.id)} />
                                </div>
                            )}
                        </>
                    )}
                </GroupCard>

                <GroupCard
                    title={t('assets.thumbnails.title')}
                    icon={ImageIcon}
                    count={thumbnails.data?.length ?? 0}
                    description={t('assets.thumbnails.description')}
                >
                    {(thumbnails.data ?? []).length === 0 ? (
                        mayEdit ? (
                            <ThumbnailGenerator projectId={projectId} />
                        ) : (
                            <p className="text-sm text-muted-foreground">{t('assets.thumbnails.empty')}</p>
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
                    title={t('assets.audio.title')}
                    icon={Music}
                    count={audio.data?.length ?? 0}
                    description={t('assets.audio.description')}
                    action={
                        <div className="flex flex-col items-end gap-1">
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
                                    <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Sparkles className="me-2 size-4" aria-hidden="true" />
                                )}
                                {t('assets.generate')}
                            </Button>
                            <GenerationIndicator />
                        </div>
                    }
                >
                    {(audio.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('assets.audio.empty')}</p>
                    ) : (
                        <ul>{(audio.data ?? []).slice(0, 5).map((suggestion) => (
                            <AssetRow
                                key={suggestion.id}
                                title={t('assets.audio.moodLine', {
                                    mood: suggestion.mood,
                                    musicType: suggestion.musicType,
                                })}
                                subtitle={t('assets.audio.tracks', { count: suggestion.tracks.length })}
                                status={suggestion.status}
                                createdAt={suggestion.createdAt}
                            />
                        ))}</ul>
                    )}
                </GroupCard>

                <GroupCard
                    title={t('assets.seo.title')}
                    icon={Search}
                    count={seo.data ? 1 : 0}
                    description={t('assets.seo.description')}
                    action={
                        <div className="flex flex-col items-end gap-1">
                            <Button
                                className="h-11"
                                disabled={!mayEdit || generateSEO.isPending}
                                onClick={() =>
                                    generateSEO.mutate(projectId, { onError: onGenerationError })
                                }
                            >
                                {generateSEO.isPending ? (
                                    <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Sparkles className="me-2 size-4" aria-hidden="true" />
                                )}
                                {t('assets.generate')}
                            </Button>
                            <GenerationIndicator />
                        </div>
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
                        <p className="text-sm text-muted-foreground">{t('assets.seo.empty')}</p>
                    )}
                </GroupCard>

                <GroupCard
                    title={t('assets.media.title')}
                    icon={Upload}
                    count={media.data?.meta?.total ?? media.data?.data.length ?? 0}
                    description={t('assets.media.description')}
                >
                    {(media.data?.data ?? []).length === 0 ? (
                        <EmptyState
                            className="min-h-0 border-0 bg-transparent p-0"
                            icon={Upload}
                            title={t('assets.media.emptyTitle')}
                            description={t('assets.media.emptyDescription')}
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
                    {t('assets.viewerNote')}
                </p>
            )}
        </div>
    );
}
