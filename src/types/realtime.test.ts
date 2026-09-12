import { describe, it, expect } from 'vitest';
import { getPollingIntervalMs } from '@/types/realtime';

describe('realtime polling matrix (RT-06)', () => {
    it('stops polling while the socket is connected', () => {
        expect(getPollingIntervalMs('connected', true)).toBeNull();
    });

    it('polls faster while connecting, 30s when disconnected', () => {
        expect(getPollingIntervalMs('connecting', true)).toBe(15_000);
        expect(getPollingIntervalMs('disconnected', true)).toBe(30_000);
    });

    it('never polls after logout', () => {
        expect(getPollingIntervalMs('connected', false)).toBeNull();
        expect(getPollingIntervalMs('connecting', false)).toBeNull();
        expect(getPollingIntervalMs('disconnected', false)).toBeNull();
    });
});
