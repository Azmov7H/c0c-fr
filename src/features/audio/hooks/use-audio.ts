import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { audioService } from '../services/audio.service';
import { uploadAudioFile } from '../lib/upload-audio-file';
import {
    CreateAudioSuggestionDTO,
    UpdateAudioSuggestionDTO,
    UploadAudioDTO,
    ReplaceAudioDTO,
    AudioUploadFileDTO,
    GenerateSoundMailDTO,
} from '../types';
import { toast } from '@/lib/toast';
import { generationErrorMessage } from '@/features/billing/lib/generation-error';

export const audioKeys = {
    all: ['audio'] as const,
    lists: () => [...audioKeys.all, 'list'] as const,
    list: (projectId: string) => [...audioKeys.lists(), projectId] as const,
    details: () => [...audioKeys.all, 'detail'] as const,
    detail: (id: string) => [...audioKeys.details(), id] as const,
};

function useGenerationSuffixes() {
    const tb = useTranslations('billing');
    return {
        credit: tb('generation.creditSuffix'),
        quota: tb('generation.quotaSuffix'),
    };
}

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
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: (data: CreateAudioSuggestionDTO) => audioService.createSuggestion(data),
        onSuccess: (data) => {
            toast.success(t('toasts.analysisStarted'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.analysisFailed'), suffixes));
        },
    });
};

export const useGenerateAudio = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: ({ projectId, scriptId }: { projectId: string, scriptId?: string }) =>
            audioService.generateAudio(projectId, scriptId),
        onSuccess: (data) => {
            toast.success(t('toasts.generated'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
            queryClient.setQueryData(audioKeys.detail(data.id), data);
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.generateFailed'), suffixes));
        },
    });
};

export const useUpdateAudioSuggestion = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAudioSuggestionDTO }) =>
            audioService.updateSuggestion(id, data),
        onSuccess: (data) => {
            toast.success(t('toasts.updated'));
            queryClient.invalidateQueries({ queryKey: audioKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.updateFailed'), suffixes));
        },
    });
};

/** T24: upload external audio. No optimistic UI — invalidation only. */
export const useUploadAudio = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();
    return useMutation({
        mutationFn: (data: UploadAudioDTO) => audioService.uploadAudio(data),
        onSuccess: (data) => {
            toast.success(t('toasts.uploaded'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.uploadFailed'), suffixes));
        },
    });
};

/** T24: safe replacement. Pending → success/refetch only; on failure the
 * previous asset stays current (no optimistic swap — rollback would hide
 * the real file state). */
export const useReplaceAudio = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ReplaceAudioDTO }) =>
            audioService.replaceAudio(id, data),
        onSuccess: (data) => {
            toast.success(t('toasts.replaced'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
            queryClient.setQueryData(audioKeys.detail(data.id), data);
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.replaceFailed'), suffixes));
        },
    });
};

/** A6-M: generated project audio message; the D8 gate is reported, not hidden. */
export const useGenerateSoundMail = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();
    return useMutation({
        mutationFn: (data: GenerateSoundMailDTO) => audioService.generateSoundMail(data),
        onSuccess: (data) => {
            toast.success(t('soundMail.toasts.generated'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
            queryClient.setQueryData(audioKeys.detail(data.id), data);
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('soundMail.toasts.generateFailed'), suffixes));
        },
    });
};

/** A6-M: upload real bytes, then persist the durable URL as an audio asset. */
export const useUploadAudioFile = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();
    return useMutation({
        mutationFn: async (data: AudioUploadFileDTO) => {
            const payload = await uploadAudioFile(data);
            return audioService.uploadAudio(payload);
        },
        onSuccess: (data) => {
            toast.success(t('toasts.uploaded'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.uploadFailed'), suffixes));
        },
    });
};

/** Replace the current layer only after the new bytes are durably uploaded. */
export const useReplaceAudioFile = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();
    return useMutation({
        mutationFn: async ({
            id,
            projectId,
            file,
            assetType,
        }: AudioUploadFileDTO & { id: string }) => {
            const uploaded = await uploadAudioFile({ projectId, file, assetType });
            return audioService.replaceAudio(id, {
                fileUrl: uploaded.fileUrl,
                fileSize: uploaded.fileSize,
                format: uploaded.format,
            });
        },
        onSuccess: (data) => {
            toast.success(t('toasts.replaced'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(data.projectId) });
            queryClient.setQueryData(audioKeys.detail(data.id), data);
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.replaceFailed'), suffixes));
        },
    });
};

export const useDeleteAudioSuggestion = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('audio');
    const suffixes = useGenerationSuffixes();

    return useMutation({
        mutationFn: ({ id }: { id: string; projectId: string }) =>
            audioService.deleteSuggestion(id),
        onSuccess: (_, variables) => {
            toast.success(t('toasts.deleted'));
            queryClient.invalidateQueries({ queryKey: audioKeys.list(variables.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(generationErrorMessage(error, t('toasts.deleteFailed'), suffixes));
        },
    });
};
