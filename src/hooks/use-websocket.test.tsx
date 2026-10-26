// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { audioKeys } from '@/features/audio/hooks/use-audio';
import { notificationsKeys } from '@/features/notifications/hooks/use-notifications';
import { projectKeys } from '@/features/projects/lib/query-keys';
import { scriptsKeys } from '@/features/scripts/hooks/use-scripts';
import { thumbnailsKeys } from '@/features/thumbnails/hooks/use-thumbnails';
import { useAuthStore } from '@/store/auth-store';
import { useRealtimeStore } from '@/store/realtime-store';
import type { User } from '@/types';

/**
 * T18 — the single realtime socket (FE-01/FE-10/RT-*): token-based auth, the
 * same-origin topology, exponential-backoff reconnect WITHOUT socket.io's own
 * reconnection, and the per-event React-Query invalidation map. The hook is
 * the one place a missed event silently rots a badge or a list, in a browser,
 * invisible to node tests — so every handler fires here against a fake socket.
 */
const st = vi.hoisted(() => {
    const handlers = new Map<string, (payload?: unknown) => void>();
    const socket = {
        connected: false,
        on: (event: string, cb: (payload?: unknown) => void) => {
            handlers.set(event, cb);
        },
        emit: vi.fn(),
        disconnect: vi.fn(),
    };
    const calls = { ioArgs: [] as unknown[] };
    const userBox = { user: null as unknown };
    return { handlers, socket, calls, userBox, io: vi.fn(() => socket) };
});

vi.mock('socket.io-client', () => ({ io: st.io }));
vi.mock('@/lib/toast', () => ({
    toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/features/auth/hooks/use-auth', () => ({
    useAuth: vi.fn(() => ({ user: st.userBox.user })),
}));

import { toast } from '@/lib/toast';
import { useWebSocket } from './use-websocket';

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

/** Token endpoint stub; the hook must never read the httpOnly cookie itself. */
function stubTokenEndpoint(ok = true, fail = false) {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/api/auth/ws-token')) {
            if (fail) throw new Error('offline');
            if (!ok) return new Response('{}', { status: 401 });
            return new Response(JSON.stringify({ success: true, data: { token: 'ws-1' } }), {
                status: 200,
            });
        }
        return new Response('{}', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function setup(user: User | null) {
    st.userBox.user = user;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    const setQueryData = vi.spyOn(qc, 'setQueryData');
    const rendered = renderHook(() => useWebSocket(), {
        wrapper: ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={qc}>{children}</QueryClientProvider>
        ),
    });
    return { ...rendered, invalidate, setQueryData };
}

async function connectedSetup(user: User | null = mockUser) {
    stubTokenEndpoint();
    const harness = setup(user);
    await act(async () => {}); // flush the effect's token fetch + io()
    return harness;
}

const fire = async (event: string, payload?: unknown) => {
    await act(async () => {
        st.handlers.get(event)?.(payload);
    });
};

const invalidatedKeys = (invalidate: {
    mock: { calls: Array<Array<unknown>> };
}) =>
    invalidate.mock.calls.map((call) => {
        const arg = call[0] as { queryKey?: unknown } | undefined;
        return arg?.queryKey;
    });

beforeEach(() => {
    vi.clearAllMocks(); // per-test counts: io, toasts, socket.disconnect accumulate otherwise
    st.handlers.clear();
    useRealtimeStore.setState({ isConnected: false });
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('useWebSocket', () => {
    it('connects to the app origin with the short-lived token and marks realtime connected', async () => {
        const fetchMock = stubTokenEndpoint();
        const { result } = setup(mockUser);
        await act(async () => {});

        expect(st.io.mock.calls.length).toBe(1);
        const [wsUrl, options] = st.io.mock.calls[0] as unknown as [
            string,
            { path: string; auth: { token: string }; transports: string[]; reconnection: boolean },
        ];
        expect(wsUrl).toBe(window.location.origin);
        expect(options).toEqual({
            path: '/api/v1/ws',
            auth: { token: 'ws-1' },
            transports: ['websocket', 'polling'],
            reconnection: false, // the hook owns the backoff, not socket.io
        });
        expect(fetchMock).toHaveBeenCalledWith('/api/auth/ws-token', { cache: 'no-store' });

        await fire('connect');
        expect(result.current.isConnected).toBe(true);
        expect(useRealtimeStore.getState().isConnected).toBe(true); // derived status readers see it
    });

    it('signed-out users never touch the token endpoint nor create a socket', async () => {
        const fetchMock = stubTokenEndpoint();
        setup(null);
        await act(async () => {});

        expect(fetchMock).not.toHaveBeenCalled();
        expect(st.io.mock.calls.length).toBe(0);
    });

    it('a missing token schedules its own reconnect (1s backoff) instead of dying silently', async () => {
        vi.useFakeTimers();
        const fetchMock = stubTokenEndpoint(false);
        const { unmount } = setup(mockUser);
        await act(async () => {});

        expect(st.io.mock.calls.length).toBe(0); // no socket without a token
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(fetchMock).toHaveBeenCalledTimes(2); // the retry fired

        // Unmount while a retry is pending → the timer must be cancelled (no
        // post-logout socket attempts).
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });
        const callsAtUnmount = fetchMock.mock.calls.length;
        unmount();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(32_000);
        });
        expect(fetchMock.mock.calls.length).toBe(callsAtUnmount);
    });

    it('a token endpoint that throws (offline) takes the same silent-retry path', async () => {
        vi.useFakeTimers();
        stubTokenEndpoint(true, true); // ok=true unused: the fetch itself rejects
        setup(mockUser);
        await act(async () => {});

        expect(st.io.mock.calls.length).toBe(0);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(st.io.mock.calls.length).toBe(0);
    });

    it('socket disconnect → status flips false and the backoff reconnects', async () => {
        vi.useFakeTimers();
        stubTokenEndpoint();
        const { result } = setup(mockUser);
        await act(async () => {});
        expect(st.io.mock.calls.length).toBe(1);

        await fire('connect'); // attempt counter resets on success
        await fire('disconnect');
        expect(result.current.isConnected).toBe(false);
        expect(useRealtimeStore.getState().isConnected).toBe(false);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000); // backoff restarted at 1s
        });
        expect(st.io.mock.calls.length).toBe(2); // fresh socket queueing for the new connection
    });

    it('connect_error marks the transport down the same way', async () => {
        stubTokenEndpoint();
        const { result } = setup(mockUser);
        await act(async () => {});

        await fire('connect_error');
        expect(result.current.isConnected).toBe(false);
    });

    it('every realtime event invalidates exactly the queries it drives', async () => {
        const { invalidate, setQueryData } = await connectedSetup();

        await fire('notification', { title: 'New comment', message: 'Nice!' });
        await fire('notification:unread', { count: 4 });
        await fire('script:generated', { projectId: 'p1' });
        await fire('thumbnail:generated', { projectId: 'p1' });
        await fire('audio:generated', { projectId: 'p1' });
        await fire('project:updated', { projectId: 'p1' });
        await fire('project.member_added', { projectId: 'p1' });
        await fire('room:error', { message: 'no access' });
        await fire('error', 'boom');

        const keys = invalidatedKeys(invalidate);

        // Notification badge: both the invalidate-on-message and the
        // direct-prefetch of the unread counter.
        expect(keys).toContainEqual(notificationsKeys.all);
        expect(setQueryData).toHaveBeenCalledWith(notificationsKeys.unread(), { count: 4 });

        // Generation events scope to that project's assets + activity feed.
        expect(keys).toContainEqual(scriptsKeys.list('p1'));
        expect(keys).toContainEqual(thumbnailsKeys.list('p1'));
        expect(keys).toContainEqual(audioKeys.list('p1'));
        expect(keys).toContainEqual(projectKeys.activity('p1'));
        expect(keys).toContainEqual(projectKeys.members('p1'));

        const toasts = toast as unknown as Record<string, ReturnType<typeof vi.fn>>;
        expect(toasts.info).toHaveBeenCalledWith('New comment', { description: 'Nice!' });
        expect(toasts.success).toHaveBeenCalledWith('Thumbnail Ready', expect.anything());
        expect(toasts.error).toHaveBeenCalledWith('Realtime unavailable for this room', {
            description: 'no access',
        });
        expect(toasts.error).toHaveBeenCalledWith('WebSocket Error', { description: 'boom' });
    });

    it('unmount tears the socket down and drops the realtime flag', async () => {
        const { unmount } = await connectedSetup();

        unmount();
        expect(st.socket.disconnect).toHaveBeenCalledTimes(1);
        // Post-unmount React state is not applied — the store flag is the
        // observable half of the teardown (registry cleanup has its own unit
        // file: the null-registration contract).
        expect(useRealtimeStore.getState().isConnected).toBe(false);
    });
});
