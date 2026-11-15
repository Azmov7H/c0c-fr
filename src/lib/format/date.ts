import type { AppLocale } from '@/i18n/routing';

import { BASE_DATE_OPTIONS, formatLocaleTag } from './locale';

/**
 * AR-013 — the date formatters.
 *
 * Every date the app displays goes through here, with the locale as an
 * argument. The English output is BYTE-IDENTICAL to the hardcoded
 * `Intl.DateTimeFormat('en-US', …)` calls this layer replaces (the golden
 * snapshots in `tests/format/` are the proof); the Arabic output is the same
 * values in Arabic, with Latin digits (AR-D-04).
 *
 * The time zone is always an INPUT, never inferred from the locale
 * (FORMATTING-STRATEGY §2): the planner is timezone-honest end to end, and
 * that behaviour must survive the migration.
 */

function toDate(value: string | number | Date | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** A medium date with a short time — the "when did this happen" format. */
export function formatDateTime(
    value: string | number | Date | null | undefined,
    locale: AppLocale,
    fallback = ''
): string {
    const date = toDate(value);
    if (!date) return fallback;
    return new Intl.DateTimeFormat(formatLocaleTag(locale), {
        ...BASE_DATE_OPTIONS,
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

/** A short date: "Nov 12, 2025" in English, "12‏/11‏/2025" in Arabic. */
export function formatDate(
    value: string | number | Date | null | undefined,
    locale: AppLocale,
    options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
    fallback = ''
): string {
    const date = toDate(value);
    if (!date) return fallback;
    return new Intl.DateTimeFormat(formatLocaleTag(locale), {
        ...BASE_DATE_OPTIONS,
        ...options,
    }).format(date);
}

/** A date without the year: "Nov 12". */
export function formatShortDate(
    value: string | number | Date | null | undefined,
    locale: AppLocale,
    fallback = ''
): string {
    return formatDate(value, locale, { month: 'short', day: 'numeric' }, fallback);
}

/** The month and the year: "November 2025". */
export function formatMonthYear(
    value: string | number | Date | null | undefined,
    locale: AppLocale,
    fallback = ''
): string {
    const date = toDate(value);
    if (!date) return fallback;
    return new Intl.DateTimeFormat(formatLocaleTag(locale), {
        ...BASE_DATE_OPTIONS,
        month: 'long',
        year: 'numeric',
    }).format(date);
}

/** The month alone: "Nov". */
export function formatMonth(
    value: string | number | Date | null | undefined,
    locale: AppLocale,
    fallback = ''
): string {
    const date = toDate(value);
    if (!date) return fallback;
    return new Intl.DateTimeFormat(formatLocaleTag(locale), {
        ...BASE_DATE_OPTIONS,
        month: 'short',
    }).format(date);
}

/**
 * The ISO day key of a date in the browser's wall calendar.
 *
 * This is a MACHINE value, not a display value: the planner's day keys and
 * the export CSVs must not change shape with the locale. It therefore does
 * NOT go through the locale at all (FORMATTING-STRATEGY §2, §6).
 */
export function formatIsoDate(value: string | number | Date | null | undefined): string {
    const date = toDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}
