'use client';

import { useTranslations } from 'next-intl';
import { Clapperboard, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { can } from '@/features/projects/lib/permissions';
import type { ProjectRole } from '@/features/projects/types';
import { toApiError } from '@/lib/api-error';

import { useInitializeProjectVideo, useProjectVideo } from '../hooks/use-advertisements';
import { VideoPipeline } from './video-pipeline';

export function VideoTab({ projectId, role }: { projectId: string; role: ProjectRole }) {
    const t = useTranslations('advertisements');
    const state = useProjectVideo(projectId);
    const initialize = useInitializeProjectVideo();
    const canEdit = can(role, 'edit');
    const detail = state.data && 'detail' in state.data ? state.data.detail : undefined;

    if (state.isLoading) {
        return (
            <div className="space-y-3" role="status" aria-label={t('list.loading')}>
                <Skeleton className="h-12 w-64 rounded-lg" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (state.isError) {
        return (
            <Alert variant="destructive">
                <AlertTitle>{t('detail.loadError')}</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                    {toApiError(state.error, t('detail.loadError')).message}
                    <Button variant="outline" className="h-11" onClick={() => void state.refetch()}>
                        {t('detail.retry')}
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    if (!detail) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clapperboard className="size-5" aria-hidden="true" />
                        {t('workspace.title')}
                    </CardTitle>
                    <CardDescription>{t('workspace.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm font-medium">{t('workspace.emptyTitle')}</p>
                    <Alert>
                        <AlertDescription>{t('detail.notInitialized')}</AlertDescription>
                    </Alert>
                    {canEdit ? (
                        <Button
                            className="h-11"
                            disabled={initialize.isPending}
                            onClick={() => initialize.mutate(projectId)}
                        >
                            {initialize.isPending && (
                                <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                            )}
                            {initialize.isPending ? t('workspace.generating') : t('detail.initialize')}
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('workspace.emptyDescription')}</p>
                    )}
                    {initialize.error ? (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {toApiError(initialize.error, t('detail.loadError')).message}
                            </AlertDescription>
                        </Alert>
                    ) : null}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" asChild className="gap-2">
                    <Link href={`/advertisements/${detail.advertisement.id}`}>
                        {t('workspace.openDetail')}
                    </Link>
                </Button>
            </div>
            <VideoPipeline detail={detail} canEdit={canEdit} compact />
        </div>
    );
}
