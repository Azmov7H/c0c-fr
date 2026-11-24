'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Mic2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toApiError } from '@/lib/api-error';

import { useGenerateVoice, useSetVoice } from '../hooks/use-advertisements';
import { voiceSourceLabel } from '../lib/labels';
import type { AdvertisementDetail, VoiceSource } from '../types';
import { GateError } from './gate-error';

const SOURCES: readonly VoiceSource[] = ['none', 'existing', 'generated'];

export function VoicePanel({
    detail,
    canEdit,
    compact = false,
}: {
    detail: AdvertisementDetail;
    canEdit: boolean;
    compact?: boolean;
}) {
    const t = useTranslations('advertisements');
    const setVoice = useSetVoice(detail.advertisement.id);
    const generateVoice = useGenerateVoice(detail.advertisement.id);
    const [source, setSource] = useState<VoiceSource>(detail.advertisement.voiceSource);
    const active = detail.advertisement.voiceSource;
    const pending = setVoice.isPending || generateVoice.isPending;

    const choose = (next: VoiceSource) => {
        setSource(next);
        if (next === 'generated') {
            generateVoice.mutate();
            return;
        }
        setVoice.mutate(
            next === 'existing' && detail.audio
                ? { source: 'existing', audioId: detail.audio.id }
                : { source: 'none' }
        );
    };

    const generateError = generateVoice.error
        ? toApiError(generateVoice.error, '')
        : null;

    return (
        <Card>
            <CardHeader className={compact ? 'pb-3' : undefined}>
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Mic2 className="size-5" aria-hidden="true" />
                        {t('voice.title')}
                    </CardTitle>
                    <CardDescription>{t('voice.description')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <label className="block space-y-1.5">
                    <span className="text-xs font-medium">{t('voice.title')}</span>
                    <select
                        value={source}
                        onChange={(event) => choose(event.target.value as VoiceSource)}
                        disabled={!canEdit || pending}
                        aria-label={t('voice.title')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {SOURCES.map((value) => (
                            <option key={value} value={value} disabled={value === 'existing' && !detail.audio}>
                                {voiceSourceLabel(t, value)}
                            </option>
                        ))}
                    </select>
                </label>

                {detail.audio && active !== 'existing' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!canEdit || pending}
                        onClick={() => choose('existing')}
                    >
                        {t('voice.useExisting')}
                    </Button>
                ) : null}

                <Button
                    size="sm"
                    disabled={!canEdit || pending || !detail.script}
                    onClick={() => choose('generated')}
                >
                    {generateVoice.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                    {generateVoice.isPending ? t('voice.generating') : t('voice.generate')}
                </Button>

                <p className="text-xs text-muted-foreground">
                    {t('voice.active', { source: voiceSourceLabel(t, active) })}
                </p>

                {generateError?.code === 'AI_VOICE_GATED' ? (
                    <Alert>
                        <AlertDescription>{t('voice.gated')}</AlertDescription>
                    </Alert>
                ) : null}
                <GateError error={setVoice.error} feature="ads.voice.upload" />
                <GateError error={generateVoice.error} feature="ads.voice.generate" />
            </CardContent>
        </Card>
    );
}
