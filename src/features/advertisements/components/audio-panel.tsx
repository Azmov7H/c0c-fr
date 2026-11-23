'use client';

import { useTranslations } from 'next-intl';
import { AudioLines, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useUrlLocale } from '@/i18n/locale';
import { getFormatters } from '@/lib/format';

import { useAnalyzeAudio } from '../hooks/use-advertisements';
import type { AdvertisementDetail } from '../types';
import { GateError } from './gate-error';

export function AudioPanel({
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
    const analyze = useAnalyzeAudio(detail.advertisement.id);
    const analysis = detail.advertisement.audioAnalysis;

    return (
        <Card>
            <CardHeader className={compact ? 'pb-3' : undefined}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <AudioLines className="size-5" aria-hidden="true" />
                            {t('audio.title')}
                        </CardTitle>
                        <CardDescription>{t('audio.description')}</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        className="h-10"
                        disabled={!canEdit || !detail.audio || analyze.isPending}
                        onClick={() => analyze.mutate()}
                    >
                        {analyze.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                        {analyze.isPending ? t('audio.analyzing') : t('audio.analyze')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {!detail.audio ? (
                    <Alert>
                        <AlertDescription>{t('audio.noNarration')}</AlertDescription>
                    </Alert>
                ) : null}

                <GateError error={analyze.error} feature="ads.audio.analyze" />

                {analysis ? (
                    <>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>
                                {t('audio.ready', {
                                    seconds: formatters.number(analysis.totalDurationSec),
                                })}
                            </span>
                            <Badge variant="outline">
                                {analysis.durationSource === 'probe'
                                    ? t('audio.sourceProbe')
                                    : t('audio.sourceFallback')}
                            </Badge>
                            <span>
                                {t('audio.segments', {
                                    count: formatters.number(analysis.segments.length),
                                })}
                            </span>
                        </div>
                        <ul className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            {analysis.segments.map((segment) => (
                                <li key={segment.sceneId} className="rounded-lg border border-border/60 p-3">
                                    <bdi dir="auto">{segment.text}</bdi>
                                    <p>
                                        {formatters.number(segment.startSec)} –{' '}
                                        {formatters.number(segment.endSec)} · {segment.timingPrecision}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : detail.audio ? (
                    <p className="text-sm text-muted-foreground">{t('audio.empty')}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}
