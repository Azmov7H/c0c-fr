'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

/** Anomaly row (spec §6.7 — §7.2 `AnomalyCard`): severity + kind + detail + link. */
export interface AnomalyCardItem {
    kind: string;
    userId: string;
    accountId: string | null;
    balance: number | null;
    period: string | null;
    detail: string;
}

export function AnomalyCard({
    anomaly,
    href,
    label,
}: {
    anomaly: AnomalyCardItem;
    /** Detail-page link — spec §7.2 `AnomalyCard` ("link"). */
    href?: string;
    label?: string;
}) {
    const t = useTranslations('admin');
    return (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning" className="font-normal">
                        {label ?? anomaly.kind}
                    </Badge>
                    {anomaly.balance !== null ? (
                        <span className="text-xs text-muted-foreground">
                            {t('components.anomalyCard.balance')}: {anomaly.balance}
                        </span>
                    ) : null}
                </div>
                {anomaly.detail ? (
                    <p className="text-sm text-muted-foreground">{anomaly.detail}</p>
                ) : null}
                {href ? (
                    <Link className="inline-flex items-center text-xs underline" href={href}>
                        {t('components.anomalyCard.link')}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
