import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { generationErrorMessage } from '@/features/billing/lib/generation-error';
import { toast } from '@/lib/toast';
import type { UnsplashPhoto } from '@/features/images/types';
import { thumbnailsService } from '../services/thumbnails.service';
import { CreateThumbnailDTO, UpdateThumbnailDTO } from '../types';

export const thumbnailsKeys = {
    all: ['thumbnails'] as const,
    lists: () => [...thumbnailsKeys.all, 'list'] as const,
    list: (projectId: string) => [...thumbnailsKeys.lists(), projectId] as const,
    details: () => [...thumbnailsKeys.all, 'detail'] as const,
    detail: (id: string) => [...thumbnailsKeys.details(), id] as const,
};

// Backward-compatible alias for callers using singular name.
export const thumbnailKeys = thumbnailsKeys;

function useGenerationSuffixes() {
    const tb = useTranslations('billing');
    return {
        credit: tb('generation.creditSuffix'),
        quota: tb('generation.quotaSuffix'),
    };
}

export const useProjectThumbnails = (projectId: string) => {
    return useQuery({
        queryKey: thumbnailsKeys.list(projectId),
        queryFn: () => thumbnailsService.getProjectThumbnails(projectId),
        enabled: !!projectId,
    });
};

export const useThumbnail = (id: string) => {
    return useQuery({
        queryKey: thumbnailsKeys.detail(id),
        queryFn: () => thumbnailsService.getThumbnailById(id),
        enabled: !!id,
    });
};

export const useCreateThumbnail = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('thumbnails');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: (data: CreateThumbnailDTO) => thumbnailsService.createThumbnail(data),
        onSuccess: (data) => {
            toast.success(t('toasts.submitted'));
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.submitFailed'), suffixes));
        },
    });
};

export const useUpdateThumbnail = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('thumbnails');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateThumbnailDTO }) =>
            thumbnailsService.updateThumbnail(id, data),
        onSuccess: (data) => {
            toast.success(t('toasts.updated'));
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.updateFailed'), suffixes));
        },
    });
};

/** P07.4: in-place regeneration — no new asset, no quota consume. */
export const useRegenerateThumbnail = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('thumbnails');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: ({
            id,
            prompt,
            stylePreset,
            image,
        }: {
            id: string;
            prompt?: string;
            stylePreset?: string;
            /** A new stock photo for the thumbnail, if the user picked one. */
            image?: UnsplashPhoto;
        }) => thumbnailsService.regenerateThumbnail(id, { prompt, stylePreset, image }),
        onSuccess: (data) => {
            toast.success(t('toasts.regenerated'));
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.regenerateFailed'), suffixes));
        },
    });
};

export const useDeleteThumbnail = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('thumbnails');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: ({ id }: { id: string; projectId: string }) =>
            thumbnailsService.deleteThumbnail(id),
        onSuccess: (_, variables) => {
            toast.success(t('toasts.deleted'));
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(variables.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.deleteFailed'), suffixes));
        },
    });
};
