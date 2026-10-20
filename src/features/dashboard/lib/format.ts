/**
 * One date formatter and one number formatter for the whole dashboard (T14).
 *
 * Mixed formats across widgets are the most common dashboard polish defect:
 * "2h ago" here, "Oct 14" there, "10/14/2026" somewhere else. Dates render
 * relative with an absolute value in `title`/`aria-label`; numbers always use
 * the same grouping.
 */

const numberFormatter = new Intl.NumberFormat('en-US');

const absoluteFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const relativeFormatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['week', 7 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
    ['second', 1000],
];

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
    return `${numberFormatter.format(value)}%`;
}

export function formatAbsoluteTime(iso: string | Date): string {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return absoluteFormatter.format(date);
}

/**
 * Relative label plus the absolute value a screen reader (or a hovering user)
 * can resolve without arithmetic. Returns an empty `absolute` for invalid input
 * rather than inventing a date.
 */
export function formatRelativeTime(
    iso: string | Date,
    now: Date = new Date()
): { relative: string; absolute: string } {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (Number.isNaN(date.getTime())) {
        return { relative: 'Unknown time', absolute: '' };
    }

    const delta = date.getTime() - now.getTime();
    const magnitude = Math.abs(delta);

    for (const [unit, ms] of RELATIVE_UNITS) {
        if (magnitude >= ms || unit === 'second') {
            return {
                relative: relativeFormatter.format(Math.round(delta / ms), unit),
                absolute: absoluteFormatter.format(date),
            };
        }
    }

    return { relative: 'just now', absolute: absoluteFormatter.format(date) };
}

export function formatShortMonthDay(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
