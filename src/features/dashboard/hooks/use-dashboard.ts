import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { dashboardService } from '../services/dashboard.service';
import type { DashboardPreferences, DashboardWidgetId } from '../lib/widget-layout';
import { normalisePreferences } from '../lib/widget-layout';
import { toApiError } from '@/lib/api-error';

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    recentActivity: (limit: number) => [...dashboardKeys.all, 'recent', limit] as const,
    health: () => [...dashboardKeys.all, 'health'] as const,
    preferences: () => [...dashboardKeys.all, 'preferences'] as const,
};

export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: () => dashboardService.getStats(),
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useRecentActivity(limit = 10) {
    return useQuery({
        queryKey: dashboardKeys.recentActivity(limit),
        queryFn: () => dashboardService.getRecentActivity(limit),
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Real dependency health from `GET /health/ready`, which reports the actual
 * mongoose connection state. Replaces a hardcoded "All Systems Operational"
 * string that was true regardless of whether the backend existed.
 *
 * Polled rather than cached indefinitely: a status indicator that cannot go red
 * is decoration. `retry: 1` keeps a backend that is down from tripling the
 * request rate on the page that is already failing to load.
 */
export function useHealthReady() {
    return useQuery({
        queryKey: dashboardKeys.health(),
        queryFn: () => dashboardService.getHealthReady(),
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 60,
        retry: 1,
    });
}

export function useDashboardPreferences() {
    return useQuery({
        queryKey: dashboardKeys.preferences(),
        queryFn: () => dashboardService.getPreferences(),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Show/hide a widget. Optimistic because the control is a checkbox: waiting for
 * a round trip to tick a box feels broken. The server response is the truth and
 * the previous layout is restored if the write fails.
 */
export function useUpdateDashboardPreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (hiddenWidgets: DashboardWidgetId[]) =>
            dashboardService.updatePreferences(hiddenWidgets),
        onMutate: async (hiddenWidgets) => {
            await queryClient.cancelQueries({ queryKey: dashboardKeys.preferences() });
            const previous = queryClient.getQueryData<DashboardPreferences>(
                dashboardKeys.preferences()
            );
            if (previous) {
                queryClient.setQueryData<DashboardPreferences>(
                    dashboardKeys.preferences(),
                    { ...previous, hiddenWidgets }
                );
            }
            return { previous };
        },
        onError: (error, _hidden, context) => {
            if (context?.previous) {
                queryClient.setQueryData(dashboardKeys.preferences(), context.previous);
            }
            toast.error(toApiError(error, 'Could not save your dashboard layout.').message);
        },
        onSuccess: (data, hiddenWidgets) => {
            queryClient.setQueryData<DashboardPreferences>(
                dashboardKeys.preferences(),
                (current) => normalisePreferences({ ...current, ...data, hiddenWidgets })
            );
        },
    });
}
