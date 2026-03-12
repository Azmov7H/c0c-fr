import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seoService } from '../services/seo.service';
import { UpdateSEODTO } from '../types';
import { toast } from 'sonner';

export const seoKeys = {
    all: ['seo'] as const,
    project: (projectId: string) => [...seoKeys.all, 'project', projectId] as const,
};

export const useProjectSEO = (projectId: string) => {
    return useQuery({
        queryKey: seoKeys.project(projectId),
        queryFn: () => seoService.getAnalysisByProject(projectId),
        enabled: !!projectId,
    });
};

export const useGenerateSEO = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: string) => seoService.generateInitial(projectId),
        onSuccess: (data) => {
            toast.success('SEO and Hashtags generated');
            queryClient.invalidateQueries({ queryKey: seoKeys.project(data.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to generate SEO metrics');
        },
    });
};

export const useUpdateSEO = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, projectId, data }: { id: string; projectId: string; data: UpdateSEODTO }) =>
            seoService.updateAnalysis(id, data),
        onSuccess: (_, variables) => {
            toast.success('SEO profile updated');
            queryClient.invalidateQueries({ queryKey: seoKeys.project(variables.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update SEO profile');
        },
    });
};
