import { describe, expect, it } from 'vitest';

import { formatAbsoluteTime, formatRelativeTime } from './relative-time';

/**
 * T18 — the timestamp helpers render the same strings React does in the
 * workspace shell (activity feeds, T15/T16). The screen-reader contract:
 * `relative` is human, `absolute` resolves without arithmetic, and invalid
 * input yields 'Unknown time' + '' rather than an invented date.
 */
const NOW = new Date('2026-03-15T12:00:00.000Z');

describe('relative-time', () => {
    it('absolute formatting handles ISO strings and Date objects identically', () => {
        const iso = formatAbsoluteTime('2026-03-15T12:00:00.000Z');
        const date = formatAbsoluteTime(new Date('2026-03-15T12:00:00.000Z'));
        expect(iso).toBe(date);
        expect(iso).not.toBe('Unknown date');
    });

    it('an unparseable date never formats a bogus calendar value', () => {
        expect(formatAbsoluteTime('not-a-date')).toBe('Unknown date');
    });

    it('relative output covers past and future and pairs with the absolute value', () => {
        const past = formatRelativeTime(new Date('2026-03-15T11:00:00.000Z'), NOW);
        expect(past.relative).toMatch(/hour/);
        expect(past.absolute).not.toBe('');

        const future = formatRelativeTime(new Date('2026-03-15T12:30:00.000Z'), NOW);
        expect(future.relative).toMatch(/minute/);
        expect(future.absolute).not.toBe('');

        expect(formatRelativeTime(new Date('2025-01-01T00:00:00.000Z'), NOW).relative).toMatch(/year/);
    });

    it('invalid input → Unknown time with an EMPTY absolute (never an invented date)', () => {
        const label = formatRelativeTime('nope', NOW);
        expect(label.relative).toBe('Unknown time');
        expect(label.absolute).toBe('');
    });
});
