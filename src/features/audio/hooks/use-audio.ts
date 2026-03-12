import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { audioService } from '../services/audio.service';
import { CreateAudioSuggestionDTO, UpdateAudioSuggestionDTO } from '../types';
import { toast } from 'sonner';

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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to start audio analysis');
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
        onError: (error: any) => {
            toast.error(error.message || 'AI Audio generation failed');
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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update audio profile');
        },
    });
};

export const useDeleteAudioSuggestion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
            audioService.deleteSuggestion(id),
        onSuccess: (_, variables) => {
            toast.success('Audio profile deleted');
            queryClient.invalidateQueries({ queryKey: audioKeys.list(variables.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete audio profile');
        },
    });
};
