import type { useTranslations } from 'next-intl';

import type {
    AdvertisementLanguage,
    AdvertisementStatus,
    RenderJobStatus,
    VoiceSource,
} from '../types';

export type AdvertisementsTranslator = ReturnType<typeof useTranslations<'advertisements'>>;

/**
 * Enum → catalog switches stay literal so `scripts/i18n/extract-usage.mjs` can
 * prove every label exists. Server wire codes are never translated.
 */
export function statusLabel(t: AdvertisementsTranslator, status: AdvertisementStatus): string {
    switch (status) {
        case 'draft': return t('status.draft');
        case 'ready': return t('status.ready');
        case 'rendering': return t('status.rendering');
        case 'completed': return t('status.completed');
        case 'failed': return t('status.failed');
        case 'archived': return t('status.archived');
    }
}

export function languageLabel(t: AdvertisementsTranslator, language: AdvertisementLanguage): string {
    return language === 'ar' ? t('language.ar') : t('language.en');
}

export function renderStatusLabel(
    t: AdvertisementsTranslator,
    status: RenderJobStatus | string | undefined
): string {
    switch (status) {
        case 'queued': return t('jobStatus.queued');
        case 'rendering': return t('jobStatus.rendering');
        case 'processing-audio': return t('jobStatus.processingAudio');
        case 'finalizing': return t('jobStatus.finalizing');
        case 'completed': return t('jobStatus.completed');
        case 'failed': return t('jobStatus.failed');
        case 'cancelled': return t('jobStatus.cancelled');
        default: return status ?? '';
    }
}

export function voiceSourceLabel(t: AdvertisementsTranslator, source: VoiceSource): string {
    switch (source) {
        case 'existing': return t('voice.existing');
        case 'generated': return t('voice.generated');
        case 'none': return t('voice.none');
    }
}
