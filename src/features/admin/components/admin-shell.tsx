'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth-store';
import { useLogout, useLogoutAll } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

import { useAdminMe } from '../hooks/use-admin';
import { getActiveAdminNavUrl } from '../lib/active-nav';
import { detectAdminEnvironment } from '../lib/environment';
import { AdminBreadcrumbs } from './admin-breadcrumbs';
import { AdminSidebar } from './admin-sidebar';

/**
 * AdminShell — spec §2.1/§2.3: sidebar (fixed left, collapsible) + header
 * (sticky, breadcrumb, environment badge, role badge, account menu) + content
 * (`max-w-[1600px]`, `px-6 py-6`).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const t = useTranslations('admin');
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logout = useLogout();
    const logoutAll = useLogoutAll();

    const activeUrl = getActiveAdminNavUrl(pathname);
    const environment = detectAdminEnvironment();
    const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '';
    const me = useAdminMe();
    // Role labels — literal keys so the i18n usage gate can see them (A2,
    // spec §2.3: Super Admin / Finance / Admin / Support).
    const roleLabel =
        me?.role === 'super_admin'
            ? t('shell.role.superAdmin')
            : me?.role === 'finance_manager'
              ? t('shell.role.financeManager')
              : me?.role === 'admin'
                ? t('shell.role.admin')
                : me?.role === 'support_agent'
                  ? t('shell.role.supportAgent')
                  : t('shell.role.default');

    return (
        <div className="min-h-screen">
            {/* Sidebar — desktop */}
            <aside
                className={cn(
                    'fixed top-0 z-30 hidden h-screen flex-col border-e bg-sidebar transition-all lg:flex',
                    collapsed ? 'w-16' : 'w-60',
                )}
            >
                <AdminSidebar
                    activeUrl={activeUrl}
                    collapsed={collapsed}
                    onToggle={() => setCollapsed((value) => !value)}
                />
            </aside>
            {/* Sidebar — mobile drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-72 gap-0 p-0">
                    <SheetTitle className="sr-only">{t('shell.nav.title')}</SheetTitle>
                    <AdminSidebar
                        activeUrl={activeUrl}
                        collapsed={false}
                        onToggle={() => setMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>
            {/* Hamburger — mobile only */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed start-3 top-3 z-30 h-9 w-9 lg:hidden"
                aria-label={t('shell.nav.openMenu')}
                onClick={() => setMobileOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            <div className={cn('flex min-h-screen flex-col transition-[padding-inline-start]', collapsed ? 'lg:ps-16' : 'lg:ps-60')}>
                <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur">
                    <AdminBreadcrumbs />
                    <div className="ml-auto flex items-center gap-3">
                        {/* Environment badge (spec §2.3) — semantic tokens:
                            production = warning(amber), preview = info(blue),
                            development = secondary(neutral). Literal keys so
                            the i18n usage gate sees them. */}
                        <Badge
                            variant="secondary"
                            className={
                                environment === 'production'
                                    ? 'border-warning/40 bg-warning/10 text-warning'
                                    : environment === 'preview'
                                      ? 'border-info/40 bg-info/10 text-info'
                                      : undefined
                            }
                        >
                            {environment === 'production'
                                ? t('shell.environment.production')
                                : environment === 'preview'
                                  ? t('shell.environment.preview')
                                  : t('shell.environment.development')}
                        </Badge>
                        {/* Role badge (spec §2.3). */}
                        {me ? <Badge variant="secondary">{roleLabel}</Badge> : null}
                        {/* Account menu (spec §2.3). */}
                        {displayName ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 text-sm">
                                        <span className="max-md:hidden">{displayName}</span>
                                        <ChevronDownSmall className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{displayName}</span>
                                            {user?.email ? (
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            ) : null}
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push('/login')}>
                                        {t('shell.account.reAuthenticate')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => logout.mutate()}
                                        disabled={logout.isPending}
                                    >
                                        {t('shell.account.signOut')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => logoutAll.mutate()}
                                        disabled={logoutAll.isPending}
                                    >
                                        {t('shell.account.signOutEverywhere')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </div>
                </header>
                <main className="max-w-[1600px] flex-1 px-6 py-6">{children}</main>
            </div>
        </div>
    );
}

/** Small "chevron down" — lucide `ChevronDown` via an inline SVG. */
function ChevronDownSmall(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M4 6l4 4 4-4" />
        </svg>
    );
}
