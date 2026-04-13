export type NotificationType =
    | 'project_created'
    | 'script_generated'
    | 'team_invite'
    | 'thumbnail_generated'
    | 'audio_generated'
    | 'analytics_ready'
    | 'trends_ready'
    | 'seo_ready'
    | 'error'
    | 'system'
    | 'info';

export interface Notification {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: string;
    metadata?: Record<string, unknown>;
    link?: string;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    hasMore: boolean;
}

export interface NotificationsMeta {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    unreadCount: number;
}
