'use client';

import type { ElementType } from 'react';

import { StatCard } from '@/components/shared/stat-card';
import { hasAdminPermission } from '@/features/admin/lib/permissions';
import type { AdminMe } from '@/features/admin/types';

export interface OverviewKpi {
    label: string;
    value: string;
    /** Backend permission that shows the KPI (spec §5.2). */
    permission: string;
    icon: ElementType;
}

/**
 * KPI row (spec §4.1): StatCards filtered by permission — "Financial cards
 * only with `overview.financial.read`; AI cards only with
 * `ai.operations.read`" (spec §5.2). Labels are pre-translated by the
 * dashboard (literal catalog keys — the i18n usage gate).
 */
export function OverviewKpis({ me, kpis }: { me: AdminMe | undefined; kpis: OverviewKpi[] }) {
    if (!me) return null;
    const visible = kpis.filter((kpi) => hasAdminPermission(me.permissions, kpi.permission));
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((kpi) => (
                <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} iconColor="text-primary" />
            ))}
        </div>
    );
}
