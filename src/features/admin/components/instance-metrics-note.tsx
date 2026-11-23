'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

import { formatLocaleTag } from '@/lib/format';

/**
 * "since instance start · 09:12 UTC" — the instance label (spec §4.1,
 * `InstanceMetricsNote`): metrics that come from in-process `perfMetrics`
 * are labeled as process-local. `since` is the instance start Date; the
 * time is rendered in UTC with hour:minute (24-hour).
 */
export function InstanceMetricsNote({ since }: { since: Date | string }) {
    const t = useTranslations('admin');
    const locale = useLocale();
    const time = new Intl.DateTimeFormat(formatLocaleTag(locale), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
    }).format(new Date(since));
    return (
        <span className="text-xs text-muted-foreground">
            {t('components.instanceMetricsNote.label', { since: `${time} UTC` })}
        </span>
    );
}
