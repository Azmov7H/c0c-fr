'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Loader2, OctagonX, Video } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUrlLocale } from '@/i18n/locale';
import { getFormatters } from '@/lib/format';

import {
    useCancelRender,
    useDownloadRender,
    useRenderJob,
    useRenderJobs,
    useRetryRender,
    useStartRender,
} from '../hooks/use-advertisements';
import { renderPollIntervalMs, isActiveRenderStatus } from '../lib/render-status';
import { renderStatusLabel } from '../lib/labels';
import type { AdvertisementDetail } from '../types';
import { GateError } from './gate-error';

export function RenderPanel({
    detail,
    canEdit,
    compact = false,
}: {
    detail: AdvertisementDetail;
    canEdit: boolean;
    compact?: boolean;
}) {
    const t = useTranslations('advertisements');
    const locale = useUrlLocale();
    const formatters = getFormatters(locale);
    const id = detail.advertisement.id;
    const [resolution, setResolution] = useState<'720p' | '1080p'>(detail.plan.resolution);

    const jobs = useRenderJobs(id);
    const list = jobs.data ?? [];
    const active = list.find((job) => isActiveRenderStatus(job.status));
    const latest = list[0];
    const polled = useRenderJob(id, active?.id);
    const job = polled.data ?? active ?? latest;

    const start = useStartRender(id);
    const cancel = useCancelRender(id);
    const retry = useRetryRender(id);
    const download = useDownloadRender(id);
    const hasComposition = Boolean(detail.advertisement.compositionHash);
    const activeJob = job && isActiveRenderStatus(job.status) ? job : null;

    return (
        <Card>
            <CardHeader className={compact ? 'pb-3' : undefined}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Video className="size-5" aria-hidden="true" />
                            {t('render.title')}
                        </CardTitle>
                        <CardDescription>{t('render.description')}</CardDescription>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium">
                        {t('render.resolution')}
                        <select
                            value={resolution}
                            onChange={(event) => setResolution(event.target.value as '720p' | '1080p')}
                            disabled={Boolean(activeJob) || start.isPending}
                            aria-label={t('render.resolution')}
                            className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                            <option value="720p">720p</option>
                            <option value="1080p">1080p</option>
                        </select>
                    </label>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {detail.advertisement.renderStale ? (
                    <Alert>
                        <AlertDescription>{t('render.stale')}</AlertDescription>
                    </Alert>
                ) : null}

                <GateError error={start.error} feature="ads.render" />
                <GateError error={retry.error} feature="ads.render.retry" />

                {jobs.error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{t('render.jobsError')}</AlertDescription>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-2"
                            onClick={() => void jobs.refetch()}
                        >
                            {t('render.jobsRetry')}
                        </Button>
                    </Alert>
                ) : null}

                {!activeJob ? (
                    <Button
                        className="h-10"
                        disabled={!canEdit || !hasComposition || start.isPending}
                        onClick={() => start.mutate(resolution)}
                    >
                        {start.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                        {start.isPending ? t('render.starting') : t('render.start')}
                    </Button>
                ) : null}

                {start.error && !activeJob ? (
                    <Alert variant="destructive">
                        <AlertDescription>{t('render.error')}</AlertDescription>
                    </Alert>
                ) : null}

                {job ? (
                    <div className="space-y-3 rounded-xl border border-border/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                                {renderStatusLabel(t, job.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {t('render.active', { status: renderStatusLabel(t, job.status) })}
                            </span>
                        </div>

                        {activeJob ? (
                            <>
                                <Progress value={job.progress.percent} aria-label={t('render.progress')} />
                                <p className="text-xs text-muted-foreground">
                                    {t('render.progress', {
                                        percent: formatters.number(job.progress.percent),
                                        stage: job.progress.stage,
                                    })}
                                </p>
                                {job.progress.totalFrames > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('render.frames', {
                                            frame: formatters.number(job.progress.frame),
                                            total: formatters.number(job.progress.totalFrames),
                                        })}
                                    </p>
                                ) : null}
                                {job.etaSeconds !== null ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('render.eta', { seconds: formatters.number(job.etaSeconds) })}
                                    </p>
                                ) : null}
                                <p className="sr-only" role="status" aria-live="polite">
                                    {renderPollIntervalMs(job.status) !== false
                                        ? t('render.active', { status: renderStatusLabel(t, job.status) })
                                        : ''}
                                </p>
                                {canEdit && !job.cancelRequested ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        disabled={cancel.isPending}
                                        onClick={() => cancel.mutate(job.id)}
                                    >
                                        {cancel.isPending ? (
                                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                        ) : (
                                            <OctagonX className="size-4" aria-hidden="true" />
                                        )}
                                        {cancel.isPending ? t('render.cancelling') : t('render.cancel')}
                                    </Button>
                                ) : null}
                            </>
                        ) : null}

                        {job.status === 'completed' ? (
                            <div className="space-y-3">
                                <p className="text-sm">{t('render.completed')}</p>
                                <Button
                                    size="sm"
                                    disabled={download.isPending}
                                    onClick={() => download.mutate()}
                                >
                                    {download.isPending ? (
                                        <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Download className="me-2 size-4" aria-hidden="true" />
                                    )}
                                    {download.isPending ? t('render.downloading') : t('render.download')}
                                </Button>
                            </div>
                        ) : null}

                        {job.status === 'failed' ? (
                            <div className="space-y-3">
                                <Alert variant="destructive">
                                    <AlertTitle>
                                        {t('render.failed', { message: job.error?.message ?? '' })}
                                    </AlertTitle>
                                    {job.error?.code ? (
                                        <AlertDescription>{job.error.code}</AlertDescription>
                                    ) : null}
                                </Alert>
                                {canEdit ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={retry.isPending}
                                        onClick={() => retry.mutate(job.id)}
                                    >
                                        {retry.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                                        {retry.isPending ? t('render.retrying') : t('render.retry')}
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}

                        {job.status === 'cancelled' ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">{t('render.cancelled')}</p>
                                {canEdit ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={retry.isPending}
                                        onClick={() => retry.mutate(job.id)}
                                    >
                                        {retry.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                                        {retry.isPending ? t('render.retrying') : t('render.retry')}
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}

                        {job.status === 'completed' && detail.advertisement.mp4Url ? (
                            <Badge variant="outline">{t('card.ready')}</Badge>
                        ) : null}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{t('render.noJob')}</p>
                )}
            </CardContent>
        </Card>
    );
}
