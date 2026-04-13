import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
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

let socketInstance: Socket | null = null;

export function useWebSocket() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(() => {
        if (!user || socketRef.current?.connected) return;

        // Get token from cookie or session
        const userInfoCookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('auth_session='));

        const token = userInfoCookie?.split('=')[1];
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
        const wsUrl = apiUrl.replace('/api/v1', '');

        socketRef.current = io(wsUrl, {
            path: '/api/v1/ws',
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current.on('connect', () => {
            console.log('WebSocket connected');
        });

        // Handle incoming notifications
        socketRef.current.on('notification', (data: NotificationPayload) => {
            // Invalidate notification queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });

            // Show toast
            toast.info(data.title, { description: data.message });
        });

        socketRef.current.on('script:generated', () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Script Generated', {
                description: 'AI has finished generating your script.',
            });
        });

        socketRef.current.on('thumbnail:generated', () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Thumbnail Ready', {
                description: 'AI has finished generating your thumbnail.',
            });
        });

        socketRef.current.on('audio:generated', () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
            toast.success('Audio Ready', {
                description: 'AI has finished generating your audio suggestions.',
            });
        });

        socketRef.current.on('error', (message: string) => {
            toast.error('WebSocket Error', { description: message });
        });

        socketInstance = socketRef.current;
    }, [user, queryClient]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            socketInstance = null;
        }
    }, []);

    useEffect(() => {
        if (user) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [user, connect, disconnect]);

    return {
        socket: socketRef.current,
        connect,
        disconnect,
        isConnected: socketRef.current?.connected ?? false,
    };
}
