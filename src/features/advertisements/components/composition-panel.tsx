'use client';

import { useTranslations } from 'next-intl';
import { Clapperboard, Loader2, Sparkles, WandSparkles } from 'lucide-react';

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
import { useUrlLocale } from '@/i18n/locale';
import { getFormatters } from '@/lib/format';
import { toApiError } from '@/lib/api-error';

import {
    useComposition,
    useGenerateVideo,
    useRegenerateScene,
    useVideoPreview,
} from '../hooks/use-advertisements';
import type { AdvertisementDetail } from '../types';
import { CreativeDirectionPanel } from './creative-direction-panel';
import { GateError } from './gate-error';
import { PreviewPlayer } from './preview-player';

interface CompositionPanelProps {
    detail: AdvertisementDetail;
    canEdit: boolean;
    compact?: boolean;
}

export function CompositionPanel({ detail, canEdit, compact = false }: CompositionPanelProps) {
    const t = useTranslations('advertisements');
    const locale = useUrlLocale();
    const formatters = getFormatters(locale);
    const id = detail.advertisement.id;
    const hasComposition = Boolean(detail.composition);
    const generate = useGenerateVideo(id);
    const regenerate = useRegenerateScene(id);
    const compositionQuery = useComposition(id, hasComposition);
    const previewQuery = useVideoPreview(id, hasComposition);

    const composition = compositionQuery.data?.composition ?? detail.composition;
    const issues = compositionQuery.data?.validationIssues ?? composition?.validationIssues ?? [];
    const voiceMismatch = compositionQuery.data?.voiceLanguageMismatch ?? null;
    const canGenerate = canEdit && Boolean(detail.script);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className={compact ? 'pb-3' : undefined}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clapperboard className="size-5" aria-hidden="true" />
                                {t('composition.title')}
                            </CardTitle>
                            <CardDescription>{t('composition.description')}</CardDescription>
                        </div>
                        <Button
                            className="h-10"
                            disabled={!canGenerate || generate.isPending}
                            onClick={() => generate.mutate()}
                        >
                            {generate.isPending ? (
                                <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Sparkles className="me-2 size-4" aria-hidden="true" />
                            )}
                            {generate.isPending ? t('composition.generating') : t('composition.generate')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!detail.script ? (
                        <Alert>
                            <AlertDescription>{t('composition.scriptRequired')}</AlertDescription>
                        </Alert>
                    ) : null}

                    <GateError error={generate.error} feature="ads.motion.generate" />

                    {compositionQuery.error ? (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {toApiError(compositionQuery.error, t('composition.loadFailed')).message}
                            </AlertDescription>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 gap-2"
                                onClick={() => void compositionQuery.refetch()}
                            >
                                {t('composition.retry')}
                            </Button>
                        </Alert>
                    ) : null}

                    {compositionQuery.isLoading && !composition ? (
                        <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                            {t('composition.loading')}
                        </p>
                    ) : null}

                    {composition ? (
                        <>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary">
                                    {t('composition.scenes', { count: formatters.number(composition.scenes.length) })}
                                </Badge>
                                <span>
                                    {t('composition.duration', {
                                        seconds: formatters.number(composition.totalDurationSec),
                                    })}
                                </span>
                                <Badge variant="outline">
                                    {composition.generatedBy === 'ai'
                                        ? t('composition.generatedAi')
                                        : t('composition.generatedFallback')}
                                </Badge>
                            </div>

                            <ul className="space-y-3">
                                {composition.scenes.map((scene, index) => (
                                    <li key={scene.sceneId} className="rounded-xl border border-border/60 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-1">
                                                <p className="text-sm font-semibold">
                                                    {t('composition.scene', {
                                                        number: formatters.number(index + 1),
                                                    })}
                                                </p>
                                                <p dir={scene.direction} className="text-sm text-muted-foreground">
                                                    {scene.intent}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {scene.layers.map((layer) => layer.type).join(' · ')}
                                                </p>
                                                {scene.directionNotes ? (
                                                    <div className="space-y-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                                                        <p>
                                                            <span className="font-medium">
                                                                {t('creativeDirection.visualFocus')}:
                                                            </span>{' '}
                                                            <bdi dir={scene.direction}>
                                                                {scene.directionNotes.visualFocus}
                                                            </bdi>
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                {t('creativeDirection.narrationRelationship')}:
                                                            </span>{' '}
                                                            <bdi dir={scene.direction}>
                                                                {scene.directionNotes.narrationRelationship}
                                                            </bdi>
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                {t('creativeDirection.sfxCue')}:
                                                            </span>{' '}
                                                            <bdi dir={scene.direction}>
                                                                {scene.directionNotes.sfxCue}
                                                            </bdi>
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline">
                                                    {t('composition.duration', {
                                                        seconds: formatters.number(scene.durationSec),
                                                    })}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-2"
                                                    disabled={
                                                        !canEdit ||
                                                        regenerate.isPending ||
                                                        regenerate.variables === scene.sceneId
                                                    }
                                                    onClick={() => regenerate.mutate(scene.sceneId)}
                                                >
                                                    <WandSparkles className="size-4" aria-hidden="true" />
                                                    {t('composition.regenerate')}
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <GateError error={regenerate.error} feature="ads.motion.scene.regen" />
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                            {t('composition.empty')}
                        </p>
                    )}
                </CardContent>
            </Card>

            {composition ? (
                <CreativeDirectionPanel
                    direction={composition.creativeDirection}
                    contentDirection={composition.direction}
                />
            ) : null}

            {composition ? (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{t('composition.previewTitle')}</CardTitle>
                        <CardDescription>{t('composition.previewDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {previewQuery.error ? (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {toApiError(previewQuery.error, t('composition.previewFailed')).message}
                                </AlertDescription>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 gap-2"
                                    onClick={() => void previewQuery.refetch()}
                                >
                                    {t('composition.retry')}
                                </Button>
                            </Alert>
                        ) : (
                            <PreviewPlayer preview={previewQuery.data} />
                        )}
                    </CardContent>
                </Card>
            ) : null}

            {issues.length > 0 || voiceMismatch ? (
                <Alert variant="destructive">
                    <AlertTitle>{t('composition.validationTitle')}</AlertTitle>
                    <AlertDescription className="space-y-1">
                        {issues.map((issue) => (
                            <p key={`${issue.sceneId}-${issue.message}`}>
                                {t('composition.validationIssue', {
                                    message: issue.message,
                                    sceneId: issue.sceneId,
                                })}
                            </p>
                        ))}
                        {voiceMismatch ? <p>{t('composition.voiceMismatch')}</p> : null}
                    </AlertDescription>
                </Alert>
            ) : null}
        </div>
    );
}
