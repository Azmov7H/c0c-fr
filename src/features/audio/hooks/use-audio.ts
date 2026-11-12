import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { audioService } from '../services/audio.service';
import { CreateAudioSuggestionDTO, UpdateAudioSuggestionDTO, UploadAudioDTO, ReplaceAudioDTO } from '../types';
import { toast } from '@/lib/toast';
import { generationErrorMessage } from '@/features/billing/lib/generation-error';

export const audioKeys = {
    all: ['audio'] as const,
    lists: () => [...audioKeys.all, 'list'] as const,
    list: (projectId: string) => [...audioKeys.lists(), projectId] as const,
    details: () => [...audioKeys.all, 'detail'] as const,
    detail: (id: string) => [...audioKeys.details(), id] as const,
};

export const useProjectAudio = (projectId: string) => {
    return useQuery({
        queryKey: audioKeys.list(projectId),
        queryFn: () => audioService.getProjectSuggestions(projectId),
        enabled: !!projectId,
    });
};

/** T24: the project's current asset. Null = no asset yet (empty state). */
export const useCurrentAudio = (projectId: string) => {
    return useQuery({
        queryKey: [...audioKeys.list(projectId), 'current'] as const,
        queryFn: () => audioService.getCurrent(projectId),
        enabled: !!projectId,
    });
};

export const useAudioSuggestion = (id: string) => {
    return useQuery({
        queryKey: audioKeys.detail(id),
        queryFn: () => audioService.getSuggestionById(id),
        enabled: !!id,
    });
};

export const useCreateAudioSuggestion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAudioSuggestionDTO) => audioService.createSuggestion(data),
        onSuccess: (data) => {
            toast.success('Audio analysis started');
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, 'Failed to start audio analysis'));
        },
    });
};

export const useGenerateAudio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, scriptId }: { projectId: string, scriptId?: string }) =>
            audioService.generateAudio(projectId, scriptId),
        onSuccess: (data) => {
            toast.success('AI Audio profile generated! 🎵');
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
            queryClient.setQueryData(audioKeys.detail(data.id), data);
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, 'AI Audio generation failed'));
        },
    });
};

export const useUpdateAudioSuggestion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAudioSuggestionDTO }) =>
            audioService.updateSuggestion(id, data),
        onSuccess: (data) => {
            toast.success('Audio profile updated');
            queryClient.invalidateQueries({ queryKey: audioKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, 'Failed to update audio profile'));
        },
    });
};

/** T24: upload external audio. No optimistic UI — invalidation only. */
export const useUploadAudio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UploadAudioDTO) => audioService.uploadAudio(data),
        onSuccess: (data) => {
            toast.success('Audio uploaded');
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, 'Failed to upload audio'));
        },
    });
};

/** T24: safe replacement. Pending → success/refetch only; on failure the
 * previous asset stays current (no optimistic swap — rollback would hide
 * the real file state). */
export const useReplaceAudio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ReplaceAudioDTO }) =>
            audioService.replaceAudio(id, data),
        onSuccess: (data) => {
            toast.success('Audio replaced');
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
            queryClient.setQueryData(audioKeys.detail(data.id), data);
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, 'Replacement failed — previous audio kept'));
        },
    });
};

export const useDeleteAudioSuggestion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string; projectId: string }) =>
            audioService.deleteSuggestion(id),
        onSuccess: (_, variables) => {
            toast.success('Audio profile deleted');
            queryClient.invalidateQueries({ queryKey: audioKeys.list(variables.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, 'Failed to delete audio profile'));
        },
    });
};
