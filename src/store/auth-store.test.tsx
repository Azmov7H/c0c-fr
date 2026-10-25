// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/types';

/**
 * AC6: sign-out clears the query cache.
 *
 * Without queryClient.clear() in the auth store's logout, the previous user's
 * cached responses (projects, notifications, profile) survive the sign-out and
 * are served to the next user on the same machine — a real cross-user leak.
 * These tests pin both halves of the reviewer comment: the cache is empty
 * after logout, and a subsequent mount of the same query performs a fresh
 * request instead of reading stale cache.
 */

const mockUser: User = {
    id: 'u1',
    email: 'a@b.c',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'user',
    plan: 'starter',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

function ProjectsProbe({ queryFn }: { queryFn: () => Promise<{ id: string }[]> }) {
    const { data } = useQuery({ queryKey: ['projects'], queryFn });
    return <div data-testid="projects">{data ? data.map((p) => p.id).join(',') : 'loading'}</div>;
}

afterEach(() => {
    act(() => {
        useAuthStore.getState().logout();
    });
    vi.restoreAllMocks();
});

describe('auth-store logout (T10 AC6)', () => {
    it('setUser both signs a user in and clears them, driving isAuthenticated/isLoading', () => {
        useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });

        act(() => {
            useAuthStore.getState().setUser(mockUser);
        });
        expect(useAuthStore.getState()).toMatchObject({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
        });

        // Session initializer (or a BFF session probe) found no session.
        act(() => {
            useAuthStore.getState().setUser(null);
        });
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().user).toBeNull();
    });

    it('setLoading lets the initializer suspend without touching identity', () => {
        useAuthStore.setState({ isLoading: false, user: mockUser, isAuthenticated: true });
        useAuthStore.getState().setLoading(true);
        expect(useAuthStore.getState().isLoading).toBe(true);
        expect(useAuthStore.getState().user).toBe(mockUser);
    });

    it('clears every cached query when signing out', async () => {
        const queryClient = getQueryClient();
        queryClient.setQueryData(['projects'], [{ id: 'secret-project' }]);
        queryClient.setQueryData(['notifications'], [{ id: 'n1' }]);
        useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });

        expect(queryClient.getQueryData(['projects'])).toBeDefined();

        act(() => {
            useAuthStore.getState().logout();
        });

        expect(queryClient.getQueryData(['projects'])).toBeUndefined();
        expect(queryClient.getQueryData(['notifications'])).toBeUndefined();
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('a remount after logout fires a fresh request instead of serving cache', async () => {
        const queryClient = getQueryClient();
        const queryFn = vi.fn().mockResolvedValue([{ id: 'fresh' }]);

        useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });
        queryClient.setQueryData(['projects'], [{ id: 'old-user-data' }]);

        // First user sees their cached data without any request...
        const first = render(
            <QueryClientProvider client={queryClient}>
                <ProjectsProbe queryFn={queryFn} />
            </QueryClientProvider>
        );
        expect(screen.getByTestId('projects').textContent).toBe('old-user-data');
        expect(queryFn).not.toHaveBeenCalled();
        first.unmount();

        // ...then signs out, which must drop it.
        act(() => {
            useAuthStore.getState().logout();
        });

        // The next mount has no cache to read: it fetches again.
        render(
            <QueryClientProvider client={queryClient}>
                <ProjectsProbe queryFn={queryFn} />
            </QueryClientProvider>
        );
        await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByTestId('projects').textContent).toBe('fresh'));
    });
});
