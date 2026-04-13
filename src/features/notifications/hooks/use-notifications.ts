import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../services/notifications.service';
import { toast } from 'sonner';

// Query keys
export const notificationsKeys = {
    all: ['notifications'] as const,
    list: (filters: Record<string, unknown>) => [...notificationsKeys.all, 'list', filters] as const,
    unread: () => [...notificationsKeys.all, 'unread'] as const,
};

/**
 * Get paginated notifications
 */
export function useNotifications(params?: { page?: number; limit?: number; isRead?: boolean }) {
    return useQuery({
        queryKey: notificationsKeys.list(params || {}),
        queryFn: () => notificationsService.getNotifications(params),
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Get unread notification count
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: notificationsKeys.unread(),
        queryFn: () => notificationsService.getUnreadCount(),
        staleTime: 1000 * 15, // 15 seconds
        refetchInterval: 1000 * 30, // Poll every 30 seconds
    });
}

/**
 * Mark notification as read
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationsService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        },
    });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationsService.markAllAsRead(),
        onSuccess: () => {
            toast.success('All notifications marked as read');
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        },
        onError: () => {
            toast.error('Failed to mark notifications as read');
        },
    });
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationsService.delete(id),
        onSuccess: () => {
            toast.success('Notification deleted');
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        },
    });
}
