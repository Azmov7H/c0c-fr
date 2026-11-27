'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import type { AdvertisementDirection, CreativeDirection } from '../types';

interface CreativeDirectionPanelProps {
    direction?: CreativeDirection;
    contentDirection: AdvertisementDirection;
}

function DirectionValue({
    children,
    contentDirection,
}: {
    children: ReactNode;
    contentDirection: AdvertisementDirection;
}) {
    return (
        <bdi dir={contentDirection} className="block text-sm leading-relaxed text-foreground">
            {children}
        </bdi>
    );
}

function DirectionItem({
    label,
    value,
    contentDirection,
}: {
    label: string;
    value: ReactNode;
    contentDirection: AdvertisementDirection;
}) {
    return (
        <div className="rounded-xl border border-border/60 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {typeof value === 'string' ? (
                <DirectionValue contentDirection={contentDirection}>{value}</DirectionValue>
            ) : (
                value
            )}
        </div>
    );
}

export function CreativeDirectionPanel({ direction, contentDirection }: CreativeDirectionPanelProps) {
    const t = useTranslations('advertisements');

    if (!direction) {
        return (
            <Alert>
                <AlertDescription>{t('creativeDirection.unavailable')}</AlertDescription>
            </Alert>
        );
    }

    const sourceLabel = (source: 'voiceover' | 'music' | 'sfx') =>
        source === 'voiceover'
            ? t('creativeDirection.sourceVoiceover')
            : source === 'music'
                ? t('creativeDirection.sourceMusic')
                : t('creativeDirection.sourceSfx');

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">{t('creativeDirection.title')}</CardTitle>
                        <CardDescription>{t('creativeDirection.description')}</CardDescription>
                    </div>
                    <Badge variant="outline">
                        {direction.generatedBy === 'ai'
                            ? t('composition.generatedAi')
                            : t('composition.generatedFallback')}
                    </Badge>
                </div>
                {direction.fallbackReason ? (
                    <p className="text-xs text-muted-foreground">
                        <bdi dir="ltr">
                            {t('creativeDirection.fallbackReason', { reason: direction.fallbackReason })}
                        </bdi>
                    </p>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
                <dl className="grid gap-3 sm:grid-cols-2">
                    <DirectionItem
                        label={t('creativeDirection.visualIdentity')}
                        value={direction.visualIdentity}
                        contentDirection={contentDirection}
                    />
                    <DirectionItem
                        label={t('creativeDirection.narrationRelationship')}
                        value={direction.narrationRelationship}
                        contentDirection={contentDirection}
                    />
                    <DirectionItem
                        label={t('creativeDirection.structure')}
                        value={direction.composition.structure}
                        contentDirection={contentDirection}
                    />
                    <DirectionItem
                        label={t('creativeDirection.backgrounds')}
                        value={direction.composition.backgrounds}
                        contentDirection={contentDirection}
                    />
                    <DirectionItem
                        label={t('creativeDirection.pacing')}
                        value={direction.composition.pacing}
                        contentDirection={contentDirection}
                    />
                    <DirectionItem
                        label={t('creativeDirection.animationLanguage')}
                        value={direction.composition.animationLanguage}
                        contentDirection={contentDirection}
                    />
                    <DirectionItem
                        label={t('creativeDirection.transitions')}
                        value={t('creativeDirection.transitionPrimary', {
                            value: direction.transitions.primary,
                        })}
                        contentDirection={contentDirection}
                    />
                    <DirectionItem
                        label={t('creativeDirection.finalInstructions')}
                        value={direction.finalInstructions}
                        contentDirection={contentDirection}
                    />
                </dl>

                <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t('creativeDirection.palette')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {direction.palette.colors.map((color) => (
                            <span
                                key={color}
                                className="inline-flex items-center gap-2 rounded-md border border-border/60 px-2 py-1 text-xs"
                                aria-label={t('creativeDirection.colorSwatch', { color })}
                            >
                                <span
                                    className="size-4 rounded border border-border/60"
                                    style={{ backgroundColor: color }}
                                    aria-hidden="true"
                                />
                                <bdi dir="ltr">{color}</bdi>
                            </span>
                        ))}
                    </div>
                    <div className="mt-2">
                        <DirectionValue contentDirection={contentDirection}>
                            {direction.palette.rationale}
                        </DirectionValue>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t('creativeDirection.typography')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" dir="ltr">
                            {t('creativeDirection.typographyProfile', { value: direction.typography.profile })}
                        </Badge>
                        <Badge variant="secondary" dir="ltr">
                            {t('creativeDirection.typographyTreatment', {
                                value: direction.typography.treatment,
                            })}
                        </Badge>
                    </div>
                    <div className="mt-2">
                        <DirectionValue contentDirection={contentDirection}>
                            {direction.typography.rationale}
                        </DirectionValue>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t('creativeDirection.sfxPlacement')}
                    </p>
                    <ul className="mt-2 space-y-2">
                        {direction.sfxPlacement.map((placement) => (
                            <li key={`${placement.sceneId}-${placement.cue}`} className="text-sm">
                                <Badge variant="outline" dir="ltr">
                                    {sourceLabel(placement.source)}
                                </Badge>{' '}
                                <DirectionValue contentDirection={contentDirection}>
                                    {placement.cue} — {placement.placement}
                                </DirectionValue>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
