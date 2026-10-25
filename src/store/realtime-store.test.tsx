// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { useRealtimeStore } from './realtime-store';

/** RT-06 — the single socket writes here; every consumer reads. */
describe('realtime-store', () => {
    beforeEach(() => {
        useRealtimeStore.setState({ isConnected: false });
    });

    it('tracks the socket transport state both ways', () => {
        useRealtimeStore.getState().setConnected(true);
        expect(useRealtimeStore.getState().isConnected).toBe(true);

        useRealtimeStore.getState().setConnected(false);
        expect(useRealtimeStore.getState().isConnected).toBe(false);
    });
});
