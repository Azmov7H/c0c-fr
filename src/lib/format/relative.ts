import type { AppLocale } from '@/i18n/routing';

import { BASE_DATE_OPTIONS, formatLocaleTag } from './locale';

/**
 * AR-013 — the relative-time formatter.
 *
 * A relative label plus the absolute value a screen reader (or a hovering
 * user) can resolve without arithmetic.
 *
 * The units are the same ladder the app has always used; the locale decides
 * how they are worded ("3 minutes ago" / "منذ 3 دقائق" — with Latin digits,
 * AR-D-04).
 */

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['week', 7 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
    ['second', 1000],
];

export interface RelativeTime {
    relative: string;
    absolute: string;
}

export function formatRelativeTime(
    value: string | number | Date | null | undefined,
    locale: AppLocale,
    now: Date = new Date(),
    fallback: { relative: string; absolute: string } = { relative: '', absolute: '' }
): RelativeTime {
    const date =
        value === null || value === undefined
            ? null
            : value instanceof Date
              ? value
              : new Date(value);
    if (!date || Number.isNaN(date.getTime())) return fallback;

    const tag = formatLocaleTag(locale);
    const absolute = new Intl.DateTimeFormat(tag, {
        ...BASE_DATE_OPTIONS,
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
    const relativeFormatter = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });

    const delta = date.getTime() - now.getTime();
    const magnitude = Math.abs(delta);

    for (const [unit, ms] of RELATIVE_UNITS) {
        if (magnitude >= ms || unit === 'second') {
            return {
                relative: relativeFormatter.format(Math.round(delta / ms), unit),
                absolute,
            };
        }
    }

    // The loop above always returns via the unconditional 'second' guard (its
    // magnitude term is a strict subset), so this fallback is unreachable by
    // construction — kept only to satisfy the function's return type.
    // v8 ignore next -- provably dead branch, not skipped logic
    return { relative: relativeFormatter.format(0, 'second'), absolute };
}
