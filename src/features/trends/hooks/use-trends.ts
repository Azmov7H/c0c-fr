import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trendsService } from '../services/trends.service';
import { toast } from 'sonner';

export const trendKeys = {
    all: ['trends'] as const,
    lists: () => [...trendKeys.all, 'list'] as const,
    list: (platform?: string) => [...trendKeys.lists(), platform] as const,
    details: () => [...trendKeys.all, 'detail'] as const,
    detail: (id: string) => [...trendKeys.details(), id] as const,
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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to analyze trends');
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
