'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Languages, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useUrlLocale } from '@/i18n/locale';
import { getFormatters } from '@/lib/format';

import { useConfirmLanguage } from '../hooks/use-advertisements';
import { languageLabel } from '../lib/labels';
import type { AdvertisementLanguage } from '../types';
import { GateError } from './gate-error';

interface LanguageGateProps {
    id: string;
    language: AdvertisementLanguage;
    confidence: number;
    confirmed: boolean;
    canEdit: boolean;
    compact?: boolean;
}

export function LanguageGate({
    id,
    language,
    confidence,
    confirmed,
    canEdit,
    compact = false,
}: LanguageGateProps) {
    const t = useTranslations('advertisements');
    const locale = useUrlLocale();
    const formatters = getFormatters(locale);
    const [selected, setSelected] = useState<AdvertisementLanguage>(language);
    const confirm = useConfirmLanguage(id);
    const percent = formatters.number(Math.round(confidence * 100));

    if (confirmed) {
        return (
            <p className="text-xs text-muted-foreground">
                {t('languageGate.confirmed', {
                    language: languageLabel(t, language),
                    confidence: percent,
                })}
            </p>
        );
    }

    return (
        <Alert className={compact ? '' : 'bg-warning/10'}>
            <Languages className="size-4" aria-hidden="true" />
            <AlertTitle>{t('languageGate.title')}</AlertTitle>
            <AlertDescription className="space-y-3">
                <p>{t('languageGate.description')}</p>
                <div className="flex flex-wrap items-end gap-3">
                    <label className="min-w-44 space-y-1.5">
                        <span className="text-xs font-medium">{t('languageGate.label')}</span>
                        <select
                            value={selected}
                            onChange={(event) => setSelected(event.target.value as AdvertisementLanguage)}
                            disabled={!canEdit || confirm.isPending}
                            aria-label={t('languageGate.label')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="ar">{languageLabel(t, 'ar')}</option>
                            <option value="en">{languageLabel(t, 'en')}</option>
                        </select>
                    </label>
                    <Button
                        className="h-10"
                        disabled={!canEdit || confirm.isPending}
                        onClick={() => confirm.mutate(selected)}
                    >
                        {confirm.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                        {t('languageGate.confirm')}
                    </Button>
                </div>
                <GateError error={confirm.error} feature="ads.language" />
            </AlertDescription>
        </Alert>
    );
}
