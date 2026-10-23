const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

const dayShort = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});

export function formatDate(value: string | null | undefined, fallback = 'Not scheduled'): string {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return day.format(date);
}

export function formatShortDate(value: string | null | undefined, fallback = '—'): string {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return dayShort.format(date);
}

export function formatCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}
