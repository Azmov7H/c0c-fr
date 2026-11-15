import type { AppLocale } from '@/i18n/routing';

import { formatLocaleTag } from './locale';

/**
 * AR-013 — the number formatters.
 *
 * The grouping separators and the digits are the locale's (Latin digits in
 * both locales, AR-D-04); the value never changes.
 */

/** A number with the locale's grouping: 1234567 → "1,234,567". */
export function formatNumber(value: number, locale: AppLocale): string {
    return new Intl.NumberFormat(formatLocaleTag(locale)).format(value);
}

/** A ratio as a percentage: 0.57 → "57%". */
export function formatPercent(value: number, locale: AppLocale): string {
    return `${formatNumber(value, locale)}%`;
}

/** A short form for large numbers: 1234567 → "1.2M". */
export function formatCompact(value: number, locale: AppLocale): string {
    return new Intl.NumberFormat(formatLocaleTag(locale), {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}
