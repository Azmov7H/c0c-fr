import { describe, expect, it } from 'vitest';

import {
    formatCompact,
    formatLocaleTag,
    getFormatters,
    formatCredits,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatDuration,
    formatFileSize,
    formatIsoDate,
    formatMonth,
    formatMonthYear,
    formatNumber,
    formatPercent,
    formatReadingTime,
    formatRelativeTime,
    formatShortDate,
    formatUsd,
} from '../../src/lib/format';

/**
 * AR-013 — the golden snapshots.
 *
 * The English outputs are BYTE-IDENTICAL to the hardcoded
 * `Intl.DateTimeFormat('en-US', …)` calls this layer replaces. That is the
 * whole point of the layer: the English product must not change by a single
 * character while the Arabic one appears.
 *
 * The Arabic outputs are the same values in Arabic, with Latin digits
 * (AR-D-04) and the Gregorian calendar (FORMATTING-STRATEGY §4).
 *
 * The reference date is fixed AND LOCAL: a date built from local parts
 * formats to the same string in every time zone, so the snapshot is a
 * property of the formatter and not of the machine it runs on.
 */

const REFERENCE = new Date(2025, 10, 12, 15, 4, 5);

describe('the English output does not change', () => {
    it('a medium date with a short time', () => {
        expect(formatDateTime(REFERENCE, 'en')).toBe('Nov 12, 2025, 3:04 PM');
    });

    it('a short date with the year', () => {
        expect(formatDate(REFERENCE, 'en')).toBe('Nov 12, 2025');
    });

    it('a short date without the year', () => {
        expect(formatShortDate(REFERENCE, 'en')).toBe('Nov 12');
    });

    it('a month and a year', () => {
        expect(formatMonthYear(REFERENCE, 'en')).toBe('November 2025');
    });

    it('a month alone', () => {
        expect(formatMonth(REFERENCE, 'en')).toBe('Nov');
    });

    it('a number with the grouping', () => {
        expect(formatNumber(1234567, 'en')).toBe('1,234,567');
    });

    it('a percentage', () => {
        expect(formatPercent(57, 'en')).toBe('57%');
    });

    it('a currency amount', () => {
        expect(formatUsd(1200, 'en')).toBe('$12');
        expect(formatCurrency(1299, 'usd', 'en')).toBe('$13');
    });

    it('a relative time', () => {
        const now = new Date('2025-11-12T15:04:05.000Z');
        expect(formatRelativeTime('2025-11-12T15:01:05.000Z', 'en', now).relative).toBe(
            '3 minutes ago'
        );
        expect(formatRelativeTime('2025-11-12T15:04:05.000Z', 'en', now).relative).toBe('now');
    });

    it('an ISO day key', () => {
        expect(formatIsoDate(REFERENCE)).toBe('2025-11-12');
    });
});

describe('the Arabic output is the same values in Arabic', () => {
    it('uses Latin digits (AR-D-04)', () => {
        expect(formatNumber(1234567, 'ar')).toBe('1,234,567');
        expect(formatCredits(1234567, 'ar')).toBe('1,234,567');
        expect(formatPercent(57, 'ar')).toBe('57%');
    });

    it('uses the Gregorian calendar', () => {
        // A Hijri calendar would render a different year entirely.
        expect(formatDate(REFERENCE, 'ar')).toContain('2025');
        expect(formatIsoDate(REFERENCE)).toBe('2025-11-12');
    });

    it('renders the month in Arabic', () => {
        expect(formatMonth(REFERENCE, 'ar')).not.toBe('Nov');
        expect(formatMonthYear(REFERENCE, 'ar')).toContain('2025');
    });

    it('renders a relative time in Arabic', () => {
        const now = new Date('2025-11-12T15:04:05.000Z');
        const { relative } = formatRelativeTime('2025-11-12T15:01:05.000Z', 'ar', now);
        expect(relative).not.toBe('3 minutes ago');
        expect(relative).toContain('3');
    });

    it('renders a currency amount with the locale placement', () => {
        // The VALUE is identical; the symbol placement is the locale's.
        expect(formatUsd(1200, 'ar').replace(/[‏\s]/g, '')).toContain('12');
        expect(formatUsd(1200, 'ar')).not.toBe(formatUsd(1200, 'en'));
    });
});

describe('the bound formatters', () => {
    it('bind the locale once and name the intent at every call', () => {
        const formatters = getFormatters('ar');
        expect(formatters.locale).toBe('ar');
        expect(formatters.tag).toBe('ar-u-nu-latn');
        expect(formatters.date(REFERENCE)).toBe(formatDate(REFERENCE, 'ar'));
        expect(formatters.shortDate(REFERENCE)).toBe(formatShortDate(REFERENCE, 'ar'));
        expect(formatters.dateTime(REFERENCE)).toBe(formatDateTime(REFERENCE, 'ar'));
        expect(formatters.monthYear(REFERENCE)).toBe(formatMonthYear(REFERENCE, 'ar'));
        expect(formatters.month(REFERENCE)).toBe(formatMonth(REFERENCE, 'ar'));
        expect(formatters.relative(REFERENCE).absolute).toBe(
            formatRelativeTime(REFERENCE, 'ar').absolute
        );
        expect(formatters.number(1234567)).toBe(formatNumber(1234567, 'ar'));
        expect(formatters.percent(57)).toBe(formatPercent(57, 'ar'));
        expect(formatters.compact(1234567)).toBe(formatCompact(1234567, 'ar'));
        expect(formatters.credits(12)).toBe(formatCredits(12, 'ar'));
        expect(formatters.usd(1200)).toBe(formatUsd(1200, 'ar'));
        expect(formatters.currency(1200, 'usd')).toBe(formatCurrency(1200, 'usd', 'ar'));
        expect(formatters.fileSize(1536)).toBe(formatFileSize(1536, 'ar'));
        expect(formatters.duration(125)).toBe(formatDuration(125));
    });
});

describe('the formatters are honest about bad input', () => {
    it('an invalid date falls back instead of printing "Invalid Date"', () => {
        expect(formatDate('not-a-date', 'en', undefined, '—')).toBe('—');
        expect(formatDateTime(null, 'en')).toBe('');
        expect(formatShortDate(undefined, 'ar')).toBe('');
        expect(formatMonthYear('nope', 'ar')).toBe('');
        expect(formatMonth('nope', 'ar')).toBe('');
        expect(formatIsoDate('nope')).toBe('');
    });

    it('an invalid relative time falls back without inventing a date', () => {
        const fallback = { relative: 'Unknown time', absolute: '' };
        expect(formatRelativeTime('nope', 'en', new Date(), fallback)).toEqual(fallback);
    });

    it('a non-finite size is zero', () => {
        expect(formatFileSize(Number.NaN, 'en')).toBe('0 B');
        expect(formatFileSize(0, 'en')).toBe('0 B');
    });

    it('a negative duration is zero', () => {
        expect(formatDuration(-5)).toBe('0:00');
        expect(formatDuration(Number.NaN)).toBe('0:00');
    });

    it('an empty reading time is zero', () => {
        expect(formatReadingTime(0, 'en')).toBe('0');
        expect(formatReadingTime(-10, 'en')).toBe('0');
    });

    it('a reading time is the number of minutes, in the locale', () => {
        expect(formatReadingTime(400, 'en')).toBe('2');
        expect(formatReadingTime(400, 'ar')).toBe('2');
    });

    it('an unknown locale falls back to the default display locale', () => {
        expect(formatLocaleTag('xx' as never)).toBe('en-US');
    });

    it('a relative time accepts a Date as well as a string', () => {
        const now = new Date(2025, 10, 12, 15, 4, 5);
        expect(formatRelativeTime(new Date(2025, 10, 12, 15, 1, 5), 'en', now).relative).toBe(
            '3 minutes ago'
        );
        expect(formatRelativeTime(null, 'en', now, { relative: '', absolute: '' }).relative).toBe('');
    });

    it('a file size stops at the largest unit', () => {
        expect(formatFileSize(1024 ** 4, 'en')).toBe('1,024 GB');
    });
});

describe('the machine values are not locale-formatted', () => {
    it('the ISO day key is the same in every locale', () => {
        expect(formatIsoDate(REFERENCE)).toBe(formatIsoDate(REFERENCE));
        expect(formatIsoDate(REFERENCE)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('a file size keeps its technical units', () => {
        expect(formatFileSize(1536, 'en')).toBe('1.5 KB');
        expect(formatFileSize(1536, 'ar')).toBe('1.5 KB');
    });

    it('a duration keeps its LTR order', () => {
        expect(formatDuration(125)).toBe('2:05');
        expect(formatDuration(3725)).toBe('62:05');
    });

    it('a compact number is still the same number', () => {
        expect(formatCompact(1234567, 'en')).toBe('1.2M');
        expect(formatCompact(1234567, 'ar')).toContain('1.2');
    });
});
