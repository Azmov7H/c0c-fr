/**
 * One number formatter for the whole dashboard (T14). Dates moved to
 * `src/lib/relative-time.ts` in T15 so the projects list shares them instead of
 * keeping a second copy.
 */

export { formatAbsoluteTime, formatRelativeTime } from '@/lib/relative-time';

const numberFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
    return `${numberFormatter.format(value)}%`;
}

export function formatShortMonthDay(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
