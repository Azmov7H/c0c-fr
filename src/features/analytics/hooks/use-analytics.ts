import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import { CreateAnalyticsDTO, UpdateAnalyticsDTO } from '../types';
import { toast } from 'sonner';
import { toApiError } from '@/lib/api-error';

export const analyticsKeys = {
    all: ['analytics'] as const,
    lists: () => [...analyticsKeys.all, 'list'] as const,
    list: (projectId: string, period?: string) => [...analyticsKeys.lists(), projectId, period] as const,
    details: () => [...analyticsKeys.all, 'detail'] as const,
    detail: (id: string) => [...analyticsKeys.details(), id] as const,
};

export const useProjectAnalytics = (projectId: string, period?: string) => {
    return useQuery({
        queryKey: analyticsKeys.list(projectId, period),
        queryFn: () => analyticsService.getProjectReports(projectId, period),
        enabled: !!projectId,
    });
};

export const useAnalyticsReport = (id: string) => {
    return useQuery({
        queryKey: analyticsKeys.detail(id),
        queryFn: () => analyticsService.getReportById(id),
        enabled: !!id,
    });
};

export const useGenerateAnalytics = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: string) => analyticsService.generateInitial(projectId),
        onSuccess: (data) => {
            toast.success('AI analysis generated successfully');
            queryClient.invalidateQueries({ queryKey: analyticsKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to generate analysis').message);
        },
    });
};

export const useCreateAnalytics = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAnalyticsDTO) => analyticsService.createReport(data),
        onSuccess: (data) => {
            toast.success('Report created');
            queryClient.invalidateQueries({ queryKey: analyticsKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to create report').message);
        },
    });
};

export const useUpdateAnalytics = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAnalyticsDTO }) =>
            analyticsService.updateReport(id, data),
        onSuccess: (data, variables) => {
            toast.success('Report updated');
            queryClient.invalidateQueries({ queryKey: analyticsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: analyticsKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to update report').message);
        },
    });
};

export const useDeleteAnalytics = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => analyticsService.deleteReport(id),
        onSuccess: () => {
            toast.success('Report deleted');
            queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to delete report').message);
        },
    });
};
