'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { stripLocaleFromPath } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';

interface Crumb {
    label: string;
    url?: string;
}

/**
 * Breadcrumb trail derived from the route (spec §2.3): the first crumb is
 * "Admin", then the route segments, then the viewer's display name — e.g.
 * `Admin / Users / Mina K`. The viewer's name is the last crumb because the
 * account menu already starts the header; the trail reads as "where am I, and
 * as whom".
 */
export function AdminBreadcrumbs() {
    const t = useTranslations('admin');
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);

    const crumbs: Crumb[] = [{ label: t('shell.breadcrumb.admin'), url: '/admin' }];
    const path = stripLocaleFromPath(pathname);
    if (path !== '/admin') {
        const segments = path.split('/').filter(Boolean);
        for (let i = 1; i < segments.length; i++) {
            if (segments[i] === 'admin') continue;
            const label = segments[i][0]!.toUpperCase() + segments[i].slice(1);
            crumbs.push({ label, url: `/${segments.slice(0, i + 1).join('/')}` });
        }
    }
    if (user) {
        const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        if (displayName) crumbs.push({ label: displayName });
    }

    return (
        <nav aria-label={t('shell.breadcrumb.label')} className="flex flex-wrap items-center gap-1 text-sm">
            {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                    <span key={`${index}-${crumb.label}`} className="flex items-center gap-1">
                        {index > 0 && (
                            <span aria-hidden className="text-muted-foreground/80">
                                /
                            </span>
                        )}
                        {crumb.url && !last ? (
                            <Link href={crumb.url} className="text-muted-foreground hover:text-foreground">
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className={last ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                                {crumb.label}
                            </span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
