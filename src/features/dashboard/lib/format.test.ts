import { describe, expect, it } from 'vitest';

import {
    formatNumber,
    formatPercent,
    formatRelativeTime,
    formatShortMonthDay,
} from './format';

describe('dashboard formatters', () => {
    it('groups numbers consistently', () => {
        expect(formatNumber(1234567)).toBe('1,234,567');
        expect(formatPercent(42)).toBe('42%');
    });

    it('returns a relative label plus the absolute value', () => {
        const now = new Date('2026-10-20T12:00:00.000Z');
        const result = formatRelativeTime('2026-10-20T10:00:00.000Z', now);

        expect(result.relative).toBe('2 hours ago');
        expect(result.absolute).toMatch(/2026/);
    });

    it('treats invalid dates as unknown instead of inventing one', () => {
        expect(formatRelativeTime('not-a-date')).toEqual({
            relative: 'Unknown time',
            absolute: '',
        });
        expect(formatShortMonthDay('not-a-date')).toBe('');
    });
});
