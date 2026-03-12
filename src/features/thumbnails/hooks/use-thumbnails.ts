import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { thumbnailsService } from '../services/thumbnails.service';
import { CreateThumbnailDTO, UpdateThumbnailDTO } from '../types';
import { toast } from 'sonner';

export const thumbnailsKeys = {
    all: ['thumbnails'] as const,
    lists: () => [...thumbnailsKeys.all, 'list'] as const,
    list: (projectId: string) => [...thumbnailsKeys.lists(), projectId] as const,
    details: () => [...thumbnailsKeys.all, 'detail'] as const,
    detail: (id: string) => [...thumbnailsKeys.details(), id] as const,
};

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

    return useMutation({
        mutationFn: (data: CreateThumbnailDTO) => thumbnailsService.createThumbnail(data),
        onSuccess: (data) => {
            toast.success('Thumbnail prompt submitted');
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(data.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit thumbnail prompt');
        },
    });
};

export const useUpdateThumbnail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateThumbnailDTO }) =>
            thumbnailsService.updateThumbnail(id, data),
        onSuccess: (data) => {
            toast.success('Thumbnail updated');
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(data.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update thumbnail');
        },
    });
};

export const useDeleteThumbnail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
            thumbnailsService.deleteThumbnail(id),
        onSuccess: (_, variables) => {
            toast.success('Thumbnail deleted');
            queryClient.invalidateQueries({ queryKey: thumbnailsKeys.list(variables.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete thumbnail');
        },
    });
};
