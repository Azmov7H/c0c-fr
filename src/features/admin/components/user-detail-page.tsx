'use client';

import { useTranslations } from 'next-intl';

import { formatLocaleTag } from '@/lib/format';
import { useUrlLocale } from '@/i18n/locale';
import { StatusBadge } from '@/features/admin/components/status-badge';
import type { AdminUserDetailDto } from '@/features/admin/services/users.admin.service';

interface FactProps {
    label: string;
    value: string;
}

function Fact({ label, value }: FactProps) {
    return (
        <div className="space-y-0.5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    );
}

/**
 * User detail (spec §4.2 detail page): status badges, summary facts
 * (plan, created, credits, project count), and the user's recent audit rows
 * (last 10).
 */
export function UserDetailPage({ user }: { user: AdminUserDetailDto }) {
    const t = useTranslations('admin');
    const locale = useUrlLocale();
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    const formatTime = (iso: string): string =>
        new Intl.DateTimeFormat(formatLocaleTag(locale), { year: 'numeric', month: 'short', day: 'numeric' }).format(
            new Date(iso),
        );
    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <h1 className="font-display text-3xl font-bold">{displayName}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={user.role} label={user.role} />
                    <StatusBadge status={user.suspended ? 'suspended' : 'active'} />
                    <StatusBadge status={user.subscription.status} />
                </div>
            </header>
            <dl className="grid max-w-md grid-cols-2 gap-4 sm:grid-cols-3">
                <Fact label={t('pages.users.detail.plan')} value={user.plan} />
                <Fact label={t('pages.users.detail.created')} value={formatTime(user.createdAt)} />
                <Fact
                    label={t('pages.users.detail.credits')}
                    value={user.credits ? `${user.credits.balance}` : '—'}
                />
                <Fact label={t('pages.users.detail.projects')} value={String(user.projectCount)} />
            </dl>
            <section className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">{t('pages.users.detail.audit')}</h2>
                {user.auditRows.length > 0 ? (
                    <ul className="space-y-1">
                        {user.auditRows.slice(0, 10).map((row) => (
                            <li key={`${row.action}-${row.createdAt}`} className="text-sm text-muted-foreground">
                                {row.action}
                                {row.reason ? ` — ${row.reason}` : ''}
                                {row.actor?.email ? ` (${row.actor.email})` : ''}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">{t('pages.users.detail.emptyAudit')}</p>
                )}
            </section>
        </div>
    );
}
