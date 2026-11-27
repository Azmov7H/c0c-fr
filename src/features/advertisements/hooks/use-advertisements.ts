'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';

import { toApiError } from '@/lib/api-error';
import { audioKeys } from '@/features/audio/hooks/use-audio';
import { mediaKeys } from '@/features/media/hooks/use-media';
import { scriptsKeys } from '@/features/scripts/hooks/use-scripts';
import { seoKeys } from '@/features/seo/hooks/use-seo';
import { advertisementsService } from '../services/advertisements.service';
import { advertisementKeys } from '../lib/query-keys';
import { renderPollIntervalMs } from '../lib/render-status';
import type {
    AdvertisementDetail,
    AdvertisementsQuery,
    PreparationResourceKind,
} from '../types';

export { advertisementKeys };

const cacheDetail = (
    queryClient: ReturnType<typeof useQueryClient>,
    detail: AdvertisementDetail
): void => {
    queryClient.setQueryData(advertisementKeys.detail(detail.advertisement.id), detail);
    queryClient.setQueryData(
        advertisementKeys.projectVideo(detail.advertisement.projectId),
        detail
    );
};

/** A preparation event can change any canonical asset behind the workspace. */
const invalidatePreparationAssets = (
    queryClient: ReturnType<typeof useQueryClient>,
    projectId: string
): void => {
    void queryClient.invalidateQueries({ queryKey: advertisementKeys.preparation(projectId) });
    void queryClient.invalidateQueries({ queryKey: scriptsKeys.list(projectId) });
    void queryClient.invalidateQueries({ queryKey: audioKeys.list(projectId) });
    void queryClient.invalidateQueries({ queryKey: seoKeys.project(projectId) });
    void queryClient.invalidateQueries({ queryKey: mediaKeys.list(projectId) });
};

export function useAdvertisements(query?: AdvertisementsQuery) {
    return useQuery({
        queryKey: advertisementKeys.list(query),
        queryFn: () => advertisementsService.list(query),
        placeholderData: keepPreviousData,
    });
}

export function useAdvertisement(id: string) {
    return useQuery({
        queryKey: advertisementKeys.detail(id),
        queryFn: () => advertisementsService.getById(id),
        enabled: !!id,
    });
}

export function useProjectVideo(projectId: string) {
    return useQuery({
        queryKey: advertisementKeys.projectVideo(projectId),
        queryFn: () => advertisementsService.getProjectVideo(projectId),
        enabled: !!projectId,
    });
}

export function useProjectPreparation(projectId: string) {
    return useQuery({
        queryKey: advertisementKeys.preparation(projectId),
        queryFn: () => advertisementsService.getProjectPreparation(projectId),
        enabled: !!projectId,
        // The worker emits preparation:updated; polling only covers a missed socket.
        refetchInterval: (query) =>
            query.state.data?.contentPackageReady === false ? 5_000 : false,
    });
}

export function useRetryPreparationResource(projectId: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (kind: PreparationResourceKind) =>
            advertisementsService.retryPreparationResource(projectId, kind),
        onSuccess: () => invalidatePreparationAssets(queryClient, projectId),
        onError: (error) => toast.error(toApiError(error, t('toast.generateFailed')).message),
    });
}

export function useInitializeProjectVideo() {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (projectId: string) => advertisementsService.initializeProjectVideo(projectId),
        onSuccess: (detail) => {
            cacheDetail(queryClient, detail);
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.lists() });
        },
        onError: (error) => toast.error(toApiError(error, t('detail.loadError')).message),
    });
}

export function useRemoveAdvertisement() {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (id: string) => advertisementsService.remove(id),
        onSuccess: () => {
            toast.success(t('toast.archived'));
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.all });
        },
        onError: (error) => toast.error(toApiError(error, t('toast.archiveFailed')).message),
    });
}

export function useConfirmLanguage(id: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (language: 'ar' | 'en') => advertisementsService.confirmLanguage(id, language),
        onSuccess: (detail) => {
            cacheDetail(queryClient, detail);
            toast.success(t('toast.languageSaved'));
        },
        onError: (error) => toast.error(toApiError(error, t('toast.languageFailed')).message),
    });
}

export function useAnalyzeAudio(id: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: () => advertisementsService.analyzeAudio(id),
        onSuccess: (detail) => {
            cacheDetail(queryClient, detail);
            toast.success(t('toast.audioAnalyzed'));
        },
        onError: (error) => toast.error(toApiError(error, t('toast.audioFailed')).message),
    });
}

export function useGenerateVideo(id: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (targetDurationSec?: number) => advertisementsService.generate(id, targetDurationSec),
        onSuccess: (result) => {
            cacheDetail(queryClient, result.detail);
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.composition(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.preview(id) });
            toast.success(t('toast.generated'));
        },
        onError: (error) => toast.error(toApiError(error, t('toast.generateFailed')).message),
    });
}

export function useGenerateAnimationVideo(projectId: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (targetDurationSec?: number) =>
            advertisementsService.generateAnimationVideo(projectId, targetDurationSec),
        onSuccess: (result) => {
            const id = result.detail.advertisement.id;
            cacheDetail(queryClient, result.detail);
            invalidatePreparationAssets(queryClient, projectId);
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.projectVideo(projectId) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.composition(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.preview(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.renderJobs(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.lists() });
            toast.success(t('toast.animationGenerated'));
        },
        onError: (error) => toast.error(toApiError(error, t('toast.generateFailed')).message),
    });
}

export function useComposition(id: string, enabled = true) {
    return useQuery({
        queryKey: advertisementKeys.composition(id),
        queryFn: () => advertisementsService.getComposition(id),
        enabled: !!id && enabled,
    });
}

export function useVideoPreview(id: string, enabled = true) {
    return useQuery({
        queryKey: advertisementKeys.preview(id),
        queryFn: () => advertisementsService.getPreview(id),
        enabled: !!id && enabled,
        retry: false,
    });
}

export function useRegenerateScene(id: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (sceneId: string) => advertisementsService.regenerateScene(id, sceneId),
        onSuccess: (detail) => {
            cacheDetail(queryClient, detail);
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.composition(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.preview(id) });
            toast.success(t('toast.sceneRegenerated'));
        },
        onError: (error) => toast.error(toApiError(error, t('toast.sceneFailed')).message),
    });
}

export function useSetVoice(id: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: ({ source, audioId }: { source: 'existing' | 'generated' | 'none'; audioId?: string }) =>
            advertisementsService.setVoice(id, source, audioId),
        onSuccess: (detail) => {
            cacheDetail(queryClient, detail);
            toast.success(t('toast.voiceSaved'));
        },
        onError: (error) => toast.error(toApiError(error, t('toast.voiceFailed')).message),
    });
}

export function useGenerateVoice(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => advertisementsService.generateVoice(id),
        onSuccess: (detail) => cacheDetail(queryClient, detail),
    });
}

export function useRenderJobs(id: string, enabled = true) {
    return useQuery({
        queryKey: advertisementKeys.renderJobs(id),
        queryFn: () => advertisementsService.listRenderJobs(id),
        enabled: !!id && enabled,
    });
}

export function useRenderJob(id: string, jobId?: string) {
    return useQuery({
        queryKey: advertisementKeys.renderJob(id, jobId ?? ''),
        queryFn: () => advertisementsService.getRenderJob(id, jobId!),
        enabled: !!id && !!jobId,
        refetchInterval: (query) => renderPollIntervalMs(query.state.data?.status),
    });
}

export function useStartRender(id: string) {
    const queryClient = useQueryClient();
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: (resolution?: '720p' | '1080p') => advertisementsService.startRender(id, resolution),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.renderJobs(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.detail(id) });
            toast.success(t('toast.renderQueued'));
        },
        onError: (error) => toast.error(toApiError(error, t('toast.renderFailed')).message),
    });
}

export function useCancelRender(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (jobId: string) => advertisementsService.cancelRender(id, jobId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.renderJobs(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.detail(id) });
        },
    });
}

export function useRetryRender(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (jobId: string) => advertisementsService.retryRender(id, jobId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.renderJobs(id) });
            void queryClient.invalidateQueries({ queryKey: advertisementKeys.detail(id) });
        },
    });
}

/** A8: download through the API client so 401 refresh/retry still applies. */
export function useDownloadRender(id: string) {
    const t = useTranslations('advertisements');
    return useMutation({
        mutationFn: async () => {
            const { blob, filename } = await advertisementsService.download(id);
            const url = URL.createObjectURL(blob);
            try {
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = filename;
                document.body.append(anchor);
                anchor.click();
                anchor.remove();
            } finally {
                URL.revokeObjectURL(url);
            }
        },
        onError: (error) =>
            toast.error(toApiError(error, t('render.downloadFailed')).message),
    });
}
