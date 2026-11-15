import type { AppLocale } from '@/i18n/routing';
import {
    formatDate as formatDateValue,
    formatNumber as formatNumberValue,
    formatShortDate as formatShortDateValue,
} from '@/lib/format';

/**
 * The billing dates and counts (T06).
 *
 * AR-014: the locale is an argument — the layer under `src/lib/format/`
 * owns the formatting.
 */
export function formatDate(
    value: string | null | undefined,
    locale: AppLocale,
    fallback = 'Not scheduled'
): string {
    return formatDateValue(
        value,
        locale,
        { month: 'short', day: 'numeric', year: 'numeric' },
        fallback
    );
}

export function formatShortDate(
    value: string | null | undefined,
    locale: AppLocale,
    fallback = '—'
): string {
    return formatShortDateValue(value, locale, fallback);
}

export function formatCount(value: number, locale: AppLocale): string {
    return formatNumberValue(value, locale);
}
