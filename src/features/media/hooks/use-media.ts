import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mediaService, type MediaItem, type MediaReplacement } from '../services/media.service';

export const mediaKeys = {
    all: ['media'] as const,
    lists: () => [...mediaKeys.all, 'list'] as const,
    list: (projectId: string) => [...mediaKeys.lists(), projectId] as const,
    allowance: (projectId: string) => [...mediaKeys.list(projectId), 'allowance'] as const,
};

export function useProjectMedia(projectId: string) {
    return useQuery({
        queryKey: mediaKeys.list(projectId),
        queryFn: () => mediaService.getMedia({ projectId, limit: 50 }),
        enabled: !!projectId,
    });
}

/** P07.6: the counters the backend enforced (used/limit), never computed here. */
export function useMediaAllowance(projectId: string) {
    return useQuery({
        queryKey: mediaKeys.allowance(projectId),
        queryFn: () => mediaService.getAllowance(projectId),
        enabled: !!projectId,
    });
}

export function useRegenerateMedia(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...replacement }: MediaReplacement & { id: string }) =>
            mediaService.regenerate(id, replacement),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaKeys.list(projectId) });
            queryClient.invalidateQueries({ queryKey: mediaKeys.allowance(projectId) });
        },
    });
}

export function useCreateMedia(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: Partial<MediaItem>) => mediaService.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaKeys.list(projectId) });
            queryClient.invalidateQueries({ queryKey: mediaKeys.allowance(projectId) });
        },
    });
}

/** Removes an asset — the gallery slot it held is free again. */
export function useDeleteMedia(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => mediaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaKeys.list(projectId) });
            queryClient.invalidateQueries({ queryKey: mediaKeys.allowance(projectId) });
        },
    });
}
