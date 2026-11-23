import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { seoService } from '../services/seo.service';
import { UpdateSEODTO } from '../types';
import { toast } from '@/lib/toast';
import { toApiError } from '@/lib/api-error';

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
    const t = useTranslations('seo');

    return useMutation({
        mutationFn: (projectId: string) => seoService.generateInitial(projectId),
        onSuccess: (data) => {
            toast.success(t('toasts.generated'));
            queryClient.invalidateQueries({ queryKey: seoKeys.project(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, t('toasts.generateFailed')).message);
        },
    });
};

export const useUpdateSEO = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('seo');

    return useMutation({
        mutationFn: ({ id, data }: { id: string; projectId: string; data: UpdateSEODTO }) =>
            seoService.updateAnalysis(id, data),
        onSuccess: (_, variables) => {
            toast.success(t('toasts.updated'));
            queryClient.invalidateQueries({ queryKey: seoKeys.project(variables.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, t('toasts.updateFailed')).message);
        },
    });
};
