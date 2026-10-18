import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trendsService } from '../services/trends.service';
import type { TrendScope, TrendWindow } from '../types';
import { toast } from 'sonner';
import { toApiError } from '@/lib/api-error';

export const trendKeys = {
    all: ['trends'] as const,
    lists: () => [...trendKeys.all, 'list'] as const,
    list: (platform?: string) => [...trendKeys.lists(), platform] as const,
    details: () => [...trendKeys.all, 'detail'] as const,
    detail: (id: string) => [...trendKeys.details(), id] as const,
    /**
     * The measured feed is keyed separately from the AI reports. They are
     * different resources with different cache lifetimes — the feed is publicly
     * cacheable for 5 minutes, a report is per-user — so sharing a key prefix
     * would let one evict the other, and would make a stale-while-revalidate feed
     * get pinned to whatever a report fetch last wrote.
     */
    feeds: () => [...trendKeys.all, 'feed'] as const,
    feed: (scope: TrendScope, window: TrendWindow) =>
        [...trendKeys.feeds(), 'global', scope, window] as const,
    forMe: (window: TrendWindow, summary: boolean) =>
        [...trendKeys.feeds(), 'for-me', window, summary] as const,
};

/**
 * Public, CDN-cached feed. `staleTime` matches the server's `s-maxage=300` so the
 * client does not refetch on every focus while the CDN is still serving the same
 * response — the two windows disagreeing produces a request storm that the cache
 * headers were specifically meant to prevent.
 */
export const useGlobalTrendFeed = (scope: TrendScope = 'global', window: TrendWindow = 7) => {
    return useQuery({
        queryKey: trendKeys.feed(scope, window),
        queryFn: () => trendsService.getGlobalFeed(scope, window),
        staleTime: 300_000,
    });
};

/**
 * Personalised feed. No `staleTime`: the server sends `private, no-store`, so the
 * ranking is per-session and refetching is expected. `summary` is opt-in because
 * it is a billable model call.
 */
export const useForMeTrendFeed = (window: TrendWindow = 7, summary = false) => {
    return useQuery({
        queryKey: trendKeys.forMe(window, summary),
        queryFn: () => trendsService.getForMeFeed(window, summary),
    });
};

export const useTrends = (platform?: string) => {
    return useQuery({
        queryKey: trendKeys.list(platform),
        queryFn: () => trendsService.getReports(platform),
    });
};

export const useTrendReport = (id: string) => {
    return useQuery({
        queryKey: trendKeys.detail(id),
        queryFn: () => trendsService.getReportById(id),
        enabled: !!id,
    });
};

export const useGenerateTrends = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (platform: string) => trendsService.generateInitial(platform),
        onSuccess: (data) => {
            toast.success(`${data.platform.toUpperCase()} Marketplace analysis complete`);
            queryClient.invalidateQueries({ queryKey: trendKeys.all });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to analyze trends').message);
        },
    });
};

export const useDeleteTrend = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => trendsService.deleteReport(id),
        onSuccess: () => {
            toast.success('Report removed');
            queryClient.invalidateQueries({ queryKey: trendKeys.all });
        },
    });
};
