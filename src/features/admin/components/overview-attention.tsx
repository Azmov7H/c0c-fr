'use client';

import { useTranslations } from 'next-intl';

import { AnomalyCard } from './anomaly-card';
import type { OverviewAnomaly } from '@/features/admin/lib/overview-data';

/**
 * Needs attention (spec §4.1): actionable anomaly items, capped at 20
 * (spec §2.2 — "Badges (e.g. queued jobs, anomalies) are optional and
 * capped at 99+" — here the list itself is capped at 20 per spec §4.1).
 */
export function OverviewAttention({ anomalies, limit = 20 }: { anomalies: OverviewAnomaly[]; limit?: number }) {
    const t = useTranslations('admin');
    if (anomalies.length === 0) return null;
    return (
        <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('pages.overview.attention')}</h2>
            <div className="space-y-2">
                {anomalies.slice(0, limit).map((anomaly) => (
                    <AnomalyCard
                        key={anomaly.userId + anomaly.kind}
                        anomaly={anomaly}
                        href={anomaly.userId ? `/admin/users/${anomaly.userId}` : undefined}
                    />
                ))}
            </div>
        </section>
    );
}
