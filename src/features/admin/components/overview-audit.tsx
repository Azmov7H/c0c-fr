'use client';

import { useTranslations } from 'next-intl';

import { formatLocaleTag } from '@/lib/format';
import { useUrlLocale } from '@/i18n/locale';
import type { OverviewAuditRow } from '@/features/admin/lib/overview-data';

/**
 * Recent audit (spec §4.1): the last entries (limit 10), each linking to the
 * audit detail page (`/admin/audit-logs/:id`, spec §2.4 route map).
 */
export function OverviewAudit({ audits, limit = 10 }: { audits: OverviewAuditRow[]; limit?: number }) {
    const t = useTranslations('admin');
    const locale = useUrlLocale();
    if (audits.length === 0) return null;
    const formatTime = (iso: string): string =>
        new Intl.DateTimeFormat(formatLocaleTag(locale), {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    return (
        <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('pages.overview.audit')}</h2>
            <ul className="space-y-1">
                {audits.slice(0, limit).map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 flex-1 truncate text-foreground">{row.action}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                            {formatTime(row.createdAt)}
                            {row.actor?.email ? ` · ${row.actor.email}` : ''}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
