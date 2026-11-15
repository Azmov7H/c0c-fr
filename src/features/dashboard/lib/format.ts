import type { AppLocale } from '@/i18n/routing';
import { formatNumber as formatNumberValue, formatPercent as formatPercentValue, formatShortDate } from '@/lib/format';

export { formatAbsoluteTime, formatRelativeTime } from '@/lib/relative-time';

/**
 * One number formatter for the whole dashboard (T14). Dates moved to
 * `src/lib/relative-time.ts` in T15 so the projects list shares them instead
 * of keeping a second copy.
 *
 * AR-014: the locale is an argument — the layer under `src/lib/format/`
 * owns the formatting.
 */
export function formatNumber(value: number, locale: AppLocale): string {
    return formatNumberValue(value, locale);
}

export function formatPercent(value: number, locale: AppLocale): string {
    return formatPercentValue(value, locale);
}

export function formatShortMonthDay(value: string, locale: AppLocale): string {
    return formatShortDate(value, locale);
}
