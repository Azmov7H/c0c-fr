'use client';

import { useTranslations } from 'next-intl';
import { Loader2, PackageCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useProjectPreparation,
    useRetryPreparationResource,
} from '@/features/advertisements/hooks/use-advertisements';
import type { PreparationResourceStatus } from '@/features/advertisements/types';
import { can } from '../../lib/permissions';
import type { ProjectRole } from '../../types';

/**
 * A2/A3/A6/A7 — the only preparation status surface. Every value here comes
 * from the backend-owned, project-scoped preparation document; the UI must not
 * re-derive readiness from fetched scripts, audio, media or SEO rows.
 */
export function ContentPreparationPanel({
    projectId,
    role,
}: {
    projectId: string;
    role: ProjectRole;
}) {
    const t = useTranslations('advertisements');
    const preparation = useProjectPreparation(projectId);
    const retry = useRetryPreparationResource(projectId);
    const mayEdit = can(role, 'edit');

    if (preparation.isLoading) {
        return <Skeleton className="h-64 rounded-2xl" role="status" aria-label={t('preparation.loading')} />;
    }
    if (!preparation.data) return null;

    const { contentPackageReady, progress, resources } = preparation.data;
    const statusLabels: Record<PreparationResourceStatus, string> = {
        pending: t('preparation.status.pending'),
        queued: t('preparation.status.queued'),
        processing: t('preparation.status.processing'),
        completed: t('preparation.status.completed'),
        failed: t('preparation.status.failed'),
        skipped: t('preparation.status.skipped'),
    };

    return (
        <Card id="preparation">
            <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <PackageCheck className="size-4" aria-hidden="true" />
                        {t('preparation.title')}
                        <Badge variant={contentPackageReady ? 'default' : 'outline'}>
                            {contentPackageReady
                                ? t('preparation.ready')
                                : t('preparation.notReady')}
                        </Badge>
                    </CardTitle>
                    <CardDescription>{t('preparation.description')}</CardDescription>
                </div>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                    {t('preparation.progress', {
                        completed: progress.completed,
                        total: progress.total,
                        percent: progress.percent,
                    })}
                </span>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                    {t('preparation.context', {
                        status: statusLabels[preparation.data.status as PreparationResourceStatus] ??
                            preparation.data.status,
                        language: preparation.data.context.language,
                        direction: preparation.data.context.direction,
                    })}
                </p>
                <ul className="divide-y divide-border/60" aria-label={t('preparation.resourcesAria')}>
                    {resources.map((resource) => (
                        <li key={resource.kind} className="flex flex-wrap items-center gap-2 py-3">
                            <div className="min-w-0 flex-1">
                                <bdi className="block truncate text-sm font-medium">{resource.label}</bdi>
                                <p className="text-xs text-muted-foreground">
                                    {statusLabels[resource.status]}
                                    {resource.errorMessage ? ` · ${resource.errorMessage}` : ''}
                                </p>
                            </div>
                            {resource.status === 'failed' && mayEdit ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={retry.isPending}
                                    onClick={() => retry.mutate(resource.kind)}
                                >
                                    {retry.isPending ? (
                                        <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                    ) : null}
                                    {t('preparation.retry')}
                                </Button>
                            ) : null}
                            {resource.errorCode === 'AI_VOICE_GATED' ? (
                                <Badge variant="secondary">{t('preparation.gated')}</Badge>
                            ) : null}
                        </li>
                    ))}
                </ul>
                {preparation.data.lastError ? (
                    <p className="text-xs text-destructive" role="status">
                        {t('preparation.lastError', { message: preparation.data.lastError })}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}
