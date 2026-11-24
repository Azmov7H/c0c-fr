'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUrlLocale } from '@/i18n/locale';
import { getFormatters } from '@/lib/format';

import { languageLabel, statusLabel } from '../lib/labels';
import type { AdvertisementDetail } from '../types';
import { AudioPanel } from './audio-panel';
import { CompositionPanel } from './composition-panel';
import { LanguageGate } from './language-gate';
import { RenderPanel } from './render-panel';
import { VoicePanel } from './voice-panel';

interface VideoPipelineProps {
    detail: AdvertisementDetail;
    canEdit: boolean;
    compact?: boolean;
    showBackLink?: boolean;
}

/**
 * The project-first video surface. It is shared by the top-level detail page
 * and the workspace Video tab so the two never drift: both read the same
 * authoritative advertisement detail and the same role-derived capabilities.
 */
export function VideoPipeline({
    detail,
    canEdit,
    compact = false,
    showBackLink = false,
}: VideoPipelineProps) {
    const t = useTranslations('advertisements');
    const locale = useUrlLocale();
    const formatters = getFormatters(locale);
    const ad = detail.advertisement;

    return (
        <div className={compact ? 'space-y-4' : 'space-y-6'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                    {showBackLink ? (
                        <Button variant="ghost" size="sm" asChild className="-ms-2 gap-2">
                            <Link href="/advertisements">
                                <ArrowLeft className="size-4" aria-hidden="true" />
                                {t('detail.back')}
                            </Link>
                        </Button>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                        <Clapperboard className="size-5 text-primary" aria-hidden="true" />
                        <h2 className="truncate text-xl font-semibold">
                            <bdi>{detail.project.title}</bdi>
                        </h2>
                        <Badge variant="secondary">{statusLabel(t, ad.status)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('detail.project', { title: detail.project.title })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t('detail.language', { language: languageLabel(t, ad.contentLanguage) })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t('detail.plan', {
                            resolution: detail.plan.resolution,
                            fps: formatters.number(detail.plan.fps),
                        })}
                    </p>
                </div>
                <LanguageGate
                    id={ad.id}
                    language={ad.contentLanguage}
                    confidence={ad.languageConfidence}
                    confirmed={ad.languageConfirmed}
                    canEdit={canEdit}
                    compact={compact}
                />
            </div>

            <CompositionPanel detail={detail} canEdit={canEdit} compact={compact} />
            <AudioPanel detail={detail} canEdit={canEdit} compact={compact} />
            <VoicePanel detail={detail} canEdit={canEdit} compact={compact} />
            <RenderPanel detail={detail} canEdit={canEdit} compact={compact} />
        </div>
    );
}
