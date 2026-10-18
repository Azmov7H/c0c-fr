import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    recentActivity: (limit: number) => [...dashboardKeys.all, 'recent', limit] as const,
    health: () => [...dashboardKeys.all, 'health'] as const,
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
