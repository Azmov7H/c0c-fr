// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/store/auth-store';
import { useRealtimeStore } from '@/store/realtime-store';
import type { User } from '@/types';
import { useRealtimeStatus } from './use-realtime-status';

/**
 * RT-06 — the three-state transport read every consumer shares: logged out →
 * everything stops ('disconnected'); logged in but socket still handshaking →
 * legacy polling fallback ('connecting'); socket live → polling stops
 * ('connected'). The polling-fallback boundary in each screen depends on this
 * mapping being exact.
 */
const mockUser: User = {
    id: 'u1',
    email: 'ada@b.c',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'user',
    plan: 'starter',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useRealtimeStatus', () => {
    it('maps user×socket state onto the three transport states', () => {
        const { result } = renderHook(() => useRealtimeStatus());

        // logged out
        expect(result.current).toBe('disconnected');

        // logged in, handshake still in flight
        act(() => {
            useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });
        });
        expect(result.current).toBe('connecting');

        // socket authenticated and live
        act(() => {
            useRealtimeStore.setState({ isConnected: true });
        });
        expect(result.current).toBe('connected');

        // sign-out returns to disconnected even with a socket flag leftover
        act(() => {
            useRealtimeStore.setState({ isConnected: true });
            useAuthStore.setState({ user: null, isAuthenticated: false });
        });
        expect(result.current).toBe('disconnected');
    });
});
