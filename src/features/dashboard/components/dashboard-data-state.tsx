'use client';

/**
 * AR-027 — the dashboard's localized four data states.
 *
 * AR-028 moved the implementation to `components/shared/localized-data-state`
 * because the settings surfaces need the same wrapper. The dashboard keeps its
 * name so its imports and tests do not churn.
 */
export { LocalizedDataState as DashboardDataState } from '@/components/shared/localized-data-state';
