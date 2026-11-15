import type { AppLocale } from '@/i18n/routing';

import { formatLocaleTag } from './locale';

/**
 * AR-013 — the duration formatters.
 *
 * A duration is direction-neutral but LTR-ordered ("12:05"), so it renders
 * in an LTR island inside RTL text (RTL-DESIGN-SYSTEM §5). The format
 * itself does not change with the locale — the digits follow the numeral
 * policy.
 */

/** A duration in seconds as `m:ss` — the media workspace's format. */
export function formatDuration(seconds: number): string {
    const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    const minutes = Math.floor(safe / 60);
    const rest = Math.round(safe % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/**
 * The MINUTES of a reading time, formatted for the locale.
 *
 * The unit is a catalog key, not a formatter concern: "5 min read" is copy
 * ("5 دقائق قراءة" in Arabic), and only the number is formatted here.
 */
export function formatReadingTime(words: number, locale: AppLocale): string {
    if (!Number.isFinite(words) || words <= 0) return new Intl.NumberFormat(formatLocaleTag(locale)).format(0);
    const minutes = Math.round(words / 200);
    return new Intl.NumberFormat(formatLocaleTag(locale), {
        maximumFractionDigits: 0,
    }).format(minutes);
}
