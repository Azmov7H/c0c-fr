import type { AppLocale } from '@/i18n/routing';
import { formatDateTime, formatRelativeTime as formatRelative } from '@/lib/format';

/**
 * The relative-time labels (T15).
 *
 * AR-014: the locale is an ARGUMENT, not an ambient default — the layer
 * under `src/lib/format/` owns the formatting, and these two functions keep
 * the app's shape (a relative label plus the absolute value a screen reader
 * can resolve without arithmetic).
 *
 * The English fallbacks are copy and move to the catalog with the surface
 * that owns them (AR-028); until then they are the English the product has
 * always shown.
 */
export function formatAbsoluteTime(
    value: string | Date,
    locale: AppLocale,
    unknownDate = 'Unknown date'
): string {
    return formatDateTime(value, locale, unknownDate);
}

export function formatRelativeTime(
    value: string | Date,
    locale: AppLocale,
    now: Date = new Date(),
    fallback: { relative: string; absolute: string } = {
        relative: 'Unknown time',
        absolute: '',
    }
): { relative: string; absolute: string } {
    return formatRelative(value, locale, now, fallback);
}
