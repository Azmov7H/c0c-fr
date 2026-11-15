import type { AppLocale } from '@/i18n/routing';

import { formatCurrency, formatUsd } from './currency';
import { formatCredits } from './credits';
import { formatDate, formatDateTime, formatIsoDate, formatMonth, formatMonthYear, formatShortDate } from './date';
import { formatDuration, formatReadingTime } from './duration';
import { BASE_DATE_OPTIONS, FORMAT_LOCALE_TAGS, formatLocaleTag } from './locale';
import { formatCompact, formatNumber, formatPercent } from './number';
import { formatRelativeTime } from './relative';
import { formatFileSize } from './size';

/**
 * AR-013 — the format layer.
 *
 * Every display format in the app goes through this module. It is a set of
 * PURE functions with the locale as an argument: no ambient locale, no
 * hidden default, and a golden snapshot per locale.
 *
 * The rules it encodes (FORMATTING-STRATEGY):
 *
 *   - the locale comes from the i18n layer, never from an ambient default;
 *   - machine values (API payloads, ledger rows, CSV exports, planner day
 *     keys) are never locale-formatted — formatting is a display concern at
 *     the component boundary;
 *   - financial accuracy is sacred: no rounding beyond the declared
 *     precision;
 *   - the numerals are Latin in both locales (AR-D-04).
 */
export {
    BASE_DATE_OPTIONS,
    FORMAT_LOCALE_TAGS,
    formatCompact,
    formatCredits,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatDuration,
    formatFileSize,
    formatIsoDate,
    formatLocaleTag,
    formatMonth,
    formatMonthYear,
    formatNumber,
    formatPercent,
    formatReadingTime,
    formatRelativeTime,
    formatShortDate,
    formatUsd,
};

export type { RelativeTime } from './relative';

/**
 * The formatters bound to one locale.
 *
 * The binding is what a component uses: `const f = getFormatters(locale)` and
 * then `f.date(value)` — the intent is named at every call site, and the
 * locale is stated once.
 */
export function getFormatters(locale: AppLocale) {
    return {
        locale,
        tag: formatLocaleTag(locale),
        date: (value: string | number | Date | null | undefined, fallback = '') =>
            formatDate(value, locale, { month: 'short', day: 'numeric', year: 'numeric' }, fallback),
        shortDate: (value: string | number | Date | null | undefined, fallback = '') =>
            formatShortDate(value, locale, fallback),
        dateTime: (value: string | number | Date | null | undefined, fallback = '') =>
            formatDateTime(value, locale, fallback),
        monthYear: (value: string | number | Date | null | undefined, fallback = '') =>
            formatMonthYear(value, locale, fallback),
        month: (value: string | number | Date | null | undefined, fallback = '') =>
            formatMonth(value, locale, fallback),
        relative: (value: string | number | Date | null | undefined, now?: Date) =>
            formatRelativeTime(value, locale, now),
        number: (value: number) => formatNumber(value, locale),
        percent: (value: number) => formatPercent(value, locale),
        compact: (value: number) => formatCompact(value, locale),
        credits: (value: number) => formatCredits(value, locale),
        usd: (cents: number) => formatUsd(cents, locale),
        currency: (cents: number, currency: string) => formatCurrency(cents, currency, locale),
        fileSize: (bytes: number) => formatFileSize(bytes, locale),
        duration: (seconds: number) => formatDuration(seconds),
    };
}

export type Formatters = ReturnType<typeof getFormatters>;
