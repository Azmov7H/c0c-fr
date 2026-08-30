import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsKeys } from '@/features/notifications/hooks/use-notifications';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/use-auth';

interface NotificationPayload {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

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

export function useWebSocket() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(async () => {
        if (!user || socketRef.current?.connected) return;

        // Short-lived token issued server-side (RT-01); never read the httpOnly cookie.
        const token = await fetchSocketToken();
        if (!token) return;

        // Same-origin topology (FE-01): the socket connects to the app origin.
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const wsUrl = origin || 'http://localhost:3000';

        const socket = io(wsUrl, {
            path: '/api/v1/ws',
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('connect_error', () => {
            setIsConnected(false);
        });

        socket.on('notification', (data: NotificationPayload) => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.info(data.title, { description: data.message });
        });

        socket.on('script:generated', () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Script Generated', {
                description: 'AI has finished generating your script.',
            });
        });

        socket.on('thumbnail:generated', () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Thumbnail Ready', {
                description: 'AI has finished generating your thumbnail.',
            });
        });

        socket.on('audio:generated', () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Audio Ready', {
                description: 'AI has finished generating your audio suggestions.',
            });
        });

        socket.on('error', (message: string) => {
            toast.error('WebSocket Error', { description: message });
        });
    }, [user, queryClient]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsConnected(false);
    }, []);

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
