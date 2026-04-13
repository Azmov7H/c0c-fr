import apiClient from '@/services/api-client';
import type { Notification, NotificationsResponse, NotificationsMeta } from '../types';

export const notificationsService = {
    /**
     * Get paginated notifications
     */
    async getNotifications(params?: {
        page?: number;
        limit?: number;
        isRead?: boolean;
    }): Promise<{ data: Notification[]; meta: NotificationsMeta }> {
        const { data } = await apiClient.get('/notifications', { params });
        return { data: data.data, meta: data.meta };
    },

    /**
     * Get unread count
     */
    async getUnreadCount(): Promise<number> {
        const { data } = await apiClient.get('/notifications/unread-count');
        return data.data.unreadCount;
    },

    /**
     * Mark single notification as read
     */
    async markAsRead(id: string): Promise<Notification> {
        const { data } = await apiClient.patch(`/notifications/${id}/read`);
        return data.data;
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await apiClient.patch('/notifications/read-all');
    },

    /**
     * Delete a notification
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/notifications/${id}`);
    },
};
