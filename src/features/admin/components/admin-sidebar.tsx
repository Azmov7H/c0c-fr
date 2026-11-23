'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdminPermissions } from '../hooks/use-admin';
import { ADMIN_NAV_GROUPS } from '../lib/nav';

interface AdminSidebarProps {
    activeUrl: string | undefined;
    collapsed: boolean;
    onToggle: () => void;
}

/**
 * Sidebar (spec §2.2). A group with no visible item is hidden entirely; the
 * active item uses the primary token with a subtle background, never a loud
 * fill (spec §2.2).
 */
export function AdminSidebar({ activeUrl, collapsed, onToggle }: AdminSidebarProps) {
    const t = useTranslations('admin');
    const permissions = useAdminPermissions();
    const visibleGroups = ADMIN_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
            item.permissions.every((p) => permissions.includes(p)),
        ),
    })).filter((group) => group.items.length > 0);

    return (
        <div className="flex h-full flex-col">
            <div
                className={cn(
                    'flex h-16 items-center border-b',
                    collapsed ? 'justify-center' : 'justify-between px-4',
                )}
            >
                {!collapsed ? (
                    <span className="truncate text-sm font-semibold tracking-tight">
                        {t('shell.brand')}
                    </span>
                ) : null}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('shell.nav.collapse')}
                    onClick={onToggle}
                >
                    {collapsed ? '→' : '←'}
                </Button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
                {visibleGroups.map((group) => (
                    <div key={group.labelKey} className="space-y-1">
                        {!collapsed ? (
                            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {t(group.labelKey)}
                            </div>
                        ) : null}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = activeUrl === item.url;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.url}
                                        href={item.url}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                            isActive
                                                ? 'bg-primary/10 font-semibold text-foreground'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                            collapsed && 'justify-center px-2',
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {!collapsed ? (
                                            <span className="min-w-0 flex-1 truncate">
                                                {t(item.titleKey)}
                                            </span>
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </div>
    );
}
