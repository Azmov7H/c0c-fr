import { describe, expect, it } from 'vitest';

import {
    countSeries,
    creditMovementSeries,
    dayKey,
    daySeries,
    DEFAULT_OVERVIEW_RANGE_VALUE,
    OVERVIEW_RANGES,
    parseOverviewRange,
    sumAccounts,
} from './overview-data';

describe('parseOverviewRange (AP-021)', () => {
    it('accepts the four spec range values', () => {
        expect(parseOverviewRange('24h').value).toBe('24h');
        expect(parseOverviewRange('7d').value).toBe('7d');
        expect(parseOverviewRange('30d').value).toBe('30d');
        expect(parseOverviewRange('90d').value).toBe('90d');
    });

    it('falls back to the default for null/unknown values', () => {
        expect(parseOverviewRange(null).value).toBe(DEFAULT_OVERVIEW_RANGE_VALUE);
        expect(parseOverviewRange('whatever').value).toBe(DEFAULT_OVERVIEW_RANGE_VALUE);
        expect(parseOverviewRange('').value).toBe(DEFAULT_OVERVIEW_RANGE_VALUE);
    });

    it('the spec ranges are 24h/7d/30d/90d', () => {
        expect(OVERVIEW_RANGES.map((r) => r.value)).toEqual(['24h', '7d', '30d', '90d']);
    });
});

describe('dayKey / daySeries (AP-021)', () => {
    it('dayKey is the UTC day key', () => {
        expect(dayKey(new Date('2026-11-23T23:30:00Z'))).toBe('2026-11-23');
        expect(dayKey(new Date('2026-11-24T00:30:00Z'))).toBe('2026-11-24');
    });

    it('daySeries(n) returns n keys, oldest first', () => {
        const keys = daySeries(3);
        expect(keys).toHaveLength(3);
        expect(keys[2]).toBe(dayKey(new Date()));
        expect(keys[0]).toBe(dayKey(new Date(Date.now() - 2 * 86_400_000)));
    });
});

describe('sumAccounts (AP-021)', () => {
    it('sums balances and held', () => {
        expect(sumAccounts([{ userId: 'a', balance: 100, held: 10 }, { userId: 'b', balance: -5, held: 0 }])).toEqual({
            creditBalance: 95,
            pendingHolds: 10,
        });
    });
});

describe('countSeries (AP-021)', () => {
    it('counts per-day hits inside the range, ignoring out-of-range dates', () => {
        const range = parseOverviewRange('7d');
        const today = daySeries(7);
        const within = today[3];
        const outside = dayKey(new Date(Date.now() - 8 * 86_400_000));
        const counts = countSeries(
            [new Date(`${within}T12:00:00Z`), new Date(`${within}T18:00:00Z`), new Date(`${outside}T12:00:00Z`)],
            range,
        );
        expect(counts[3]).toBe(2);
        expect(counts.reduce((a, b) => a + b, 0)).toBe(2);
    });
});

describe('creditMovementSeries (AP-021)', () => {
    it('buckets amounts by kind and day, aligned to the range', () => {
        const range = parseOverviewRange('30d');
        const keys = daySeries(range.days);
        const day0 = keys[keys.length - 1];
        const series = creditMovementSeries(
            [
                { id: '1', kind: 'grant', amount: 50, createdAt: `${day0}T10:00:00Z` },
                { id: '2', kind: 'settle', amount: -30, createdAt: `${day0}T11:00:00Z` },
                { id: '3', kind: 'refund', amount: 10, createdAt: '2000-01-01T00:00:00Z' },
            ],
            range,
        );
        expect(series.days).toEqual(keys);
        expect(series.series.grant).toBeTruthy();
        expect(series.series.grant[keys.length - 1]).toBe(50);
        expect(series.series.settle[keys.length - 1]).toBe(-30);
        // The ancient 'refund' is outside the range — no series entry.
        expect(series.series.refund).toBeUndefined();
    });
});
