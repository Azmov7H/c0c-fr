import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsKeys } from '@/features/notifications/hooks/use-notifications';
import { projectKeys } from '@/features/projects/lib/query-keys';
import { scriptsKeys } from '@/features/scripts/hooks/use-scripts';
import { thumbnailsKeys } from '@/features/thumbnails/hooks/use-thumbnails';
import { audioKeys } from '@/features/audio/hooks/use-audio';
import { registerSocket } from '@/lib/socket-registry';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRealtimeStore } from '@/store/realtime-store';
import type {
    NotificationPayload,
    UnreadPayload,
    RoomErrorPayload,
    ServerToClientEvents,
    ClientToServerEvents,
    MemberChangedPayload,
    InviteChangedPayload,
    ProjectUpdatedPayload,
} from '@/types/realtime';

async function fetchSocketToken(): Promise<string | null> {
    try {
        const res = await fetch('/api/auth/ws-token', { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.data?.token ?? null;
    } catch {
        return null;
    }
}

const MAX_RECONNECT_DELAY_MS = 30_000;

export function useWebSocket() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptRef = useRef(0);
    const connectRef = useRef<() => Promise<void>>(async () => {});
    const [isConnected, setIsConnected] = useState(false);
    const setStoreConnected = useRealtimeStore((s) => s.setConnected);

    const markConnected = useCallback(
        (connected: boolean) => {
            setIsConnected(connected);
            setStoreConnected(connected);
        },
        [setStoreConnected]
    );

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;
        // Exponential backoff with cap (FE-10): 1s, 2s, 4s, … max 30s.
        const delay = Math.min(1000 * 2 ** attemptRef.current, MAX_RECONNECT_DELAY_MS);
        attemptRef.current += 1;
        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            void connectRef.current();
        }, delay);
    }, []);

    const connect = useCallback(async () => {
        if (!user || socketRef.current?.connected) return;

        // Short-lived token issued server-side (RT-01); never read the httpOnly cookie.
        const token = await fetchSocketToken();
        if (!token) {
            scheduleReconnect();
            return;
        }

        // Same-origin topology (FE-01): the socket connects to the app origin.
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const wsUrl = origin || 'http://localhost:3000';

        const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(wsUrl, {
            path: '/api/v1/ws',
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: false,
        });

        socketRef.current = socket;
        registerSocket(socket);

        socket.on('connect', () => {
            attemptRef.current = 0;
            markConnected(true);
        });

        socket.on('disconnect', () => {
            markConnected(false);
            socketRef.current = null;
            scheduleReconnect();
        });

        socket.on('connect_error', () => {
            markConnected(false);
            socketRef.current = null;
            scheduleReconnect();
        });

        socket.on('notification', (data: NotificationPayload) => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.info(data.title, { description: data.message });
        });

        // Realtime unread count (RT-04): no polling needed while connected.
        socket.on('notification:unread', (data: UnreadPayload) => {
            queryClient.setQueryData(notificationsKeys.unread(), data);
            queryClient.invalidateQueries({ queryKey: notificationsKeys.unread() });
        });

        // Scoped invalidation: generation events refresh only that project's
        // asset list, then the notification badge.
        socket.on('script:generated', (data) => {
            void queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.activity(data.projectId) });
            void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Script Generated', {
                description: 'AI has finished generating your script.',
            });
        });

        socket.on('thumbnail:generated', (data) => {
            void queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(data.projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.activity(data.projectId) });
            void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Thumbnail Ready', {
                description: 'AI has finished generating your thumbnail.',
            });
        });

        socket.on('audio:generated', (data) => {
            void queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.activity(data.projectId) });
            void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Audio Ready', {
                description: 'AI has finished generating your audio suggestions.',
            });
        });

        socket.on('project:updated', (data: ProjectUpdatedPayload) => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        });

        const refreshCollaboration = (payload: MemberChangedPayload | InviteChangedPayload) => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.members(payload.projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.invites(payload.projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.activity(payload.projectId) });
        };
        socket.on('project.member_added', refreshCollaboration);
        socket.on('project.member_removed', refreshCollaboration);
        socket.on('project.member_role_changed', refreshCollaboration);
        socket.on('project.invite_created', refreshCollaboration);
        socket.on('project.invite_accepted', refreshCollaboration);
        socket.on('project.invite_revoked', refreshCollaboration);

        // Room denial (RT-02): surface instead of silent emptiness.
        socket.on('room:error', (data: RoomErrorPayload) => {
            toast.error('Realtime unavailable for this room', { description: data.message });
        });

        socket.on('error', (message: string) => {
            toast.error('WebSocket Error', { description: message });
        });
    }, [user, queryClient, markConnected, scheduleReconnect]);

    // Always point the reconnect timer at the latest connect closure.
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    const disconnect = useCallback(() => {
        if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
        attemptRef.current = 0;
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        registerSocket(null);
        markConnected(false);
    }, [markConnected]);

    useEffect(() => {
        if (user) {
            connect();
        }

        // Cleanup disconnects the socket when `user` changes (e.g. logout).
        return () => {
            disconnect();
        };
    }, [user, connect, disconnect]);

    return {
        connect,
        disconnect,
        isConnected,
    };
}
