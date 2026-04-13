import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../services/media.service';
import { toast } from 'sonner';
import type { MediaItem } from '../services/media.service';

export const mediaKeys = {
    all: ['media'] as const,
    list: (filters: Record<string, unknown>) => [...mediaKeys.all, 'list', filters] as const,
    detail: (id: string) => [...mediaKeys.all, 'detail', id] as const,
    stats: () => [...mediaKeys.all, 'stats'] as const,
};

export function useMedia(params?: { page?: number; limit?: number; category?: string; projectId?: string; search?: string }) {
    return useQuery({
        queryKey: mediaKeys.list(params || {}),
        queryFn: () => mediaService.getMedia(params),
    });
}

export function useMediaItem(id: string) {
    return useQuery({
        queryKey: mediaKeys.detail(id),
        queryFn: () => mediaService.getById(id),
        enabled: !!id,
    });
}

export function useCreateMedia() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: Partial<MediaItem>) => mediaService.create(dto),
        onSuccess: () => {
            toast.success('Media created');
            queryClient.invalidateQueries({ queryKey: mediaKeys.all });
        },
    });
}

export function useDeleteMedia() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => mediaService.delete(id),
        onSuccess: () => {
            toast.success('Media deleted');
            queryClient.invalidateQueries({ queryKey: mediaKeys.all });
        },
    });
}

export function useMediaStats() {
    return useQuery({
        queryKey: mediaKeys.stats(),
        queryFn: () => mediaService.getStats(),
    });
}
