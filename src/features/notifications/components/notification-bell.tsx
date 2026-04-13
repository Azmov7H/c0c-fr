'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/features/notifications/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const notificationIcons: Record<string, string> = {
    project_created: '📁',
    script_generated: '📝',
    team_invite: '👥',
    thumbnail_generated: '🖼️',
    audio_generated: '🎵',
    analytics_ready: '📊',
    trends_ready: '📈',
    seo_ready: '🔍',
    error: '⚠️',
    system: '⚙️',
    info: 'ℹ️',
};

export function NotificationBell() {
    const { data: unreadCount } = useUnreadCount();
    const { data, isLoading } = useNotifications({ page: 1, limit: 10 });
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    const notifications = data?.data || [];
    const unread = unreadCount || 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                >
                    <Bell className="size-5" />
                    {unread > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 size-5 flex items-center justify-center rounded-full p-0 text-[10px] font-medium"
                        >
                            {unread > 99 ? '99+' : unread}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                    <h3 className="font-semibold">Notifications</h3>
                    {unread > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <ScrollArea className="h-80">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="mb-2 size-8 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">
                                No notifications yet
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification._id}
                                    className={cn(
                                        'flex cursor-pointer flex-col gap-1 px-4 py-3',
                                        !notification.isRead && 'bg-muted/50'
                                    )}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markAsRead.mutate(notification._id);
                                        }
                                        if (notification.link) {
                                            window.location.href = notification.link;
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">
                                            {notificationIcons[notification.type] || 'ℹ️'}
                                        </span>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="size-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                        })}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
