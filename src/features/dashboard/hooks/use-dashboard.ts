import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    recentActivity: (limit: number) => [...dashboardKeys.all, 'recent', limit] as const,
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
