import { config } from '@/config';
import apiClient, { type ApiEnvelope } from '@/services/api-client';

import type {
    AdvertisementDetail,
    AdvertisementLanguage,
    AdvertisementList,
    AdvertisementsQuery,
    GenerateAnimationVideoResult,
    GenerateVideoResult,
    PreparationResourceKind,
    ProjectPreparationState,
    ProjectVideoState,
    RenderJob,
    RenderStartResult,
    VideoPreview,
    VoiceSource,
} from '../types';

/**
 * Frontend seam for the authoritative `/api/v1/advertisements/*` and
 * `/api/v1/projects/:id/video/*` routes. Paths deliberately omit `/api/v1`:
 * the Next rewrite in `next.config.ts` adds it when proxying to the API.
 */
const unwrap = <T>(envelope: ApiEnvelope<T>, fallback: T): T => envelope.data ?? fallback;

const idempotencyKey = (operation: string): string => {
    const random =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${operation}-${random}`;
};

/** Prefer the RFC 5987 name; fall back to the ASCII header, then a safe name. */
const downloadFilename = (disposition: string): string => {
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    if (encoded) {
        try {
            return decodeURIComponent(encoded.trim().replace(/^"|"$/g, ''));
        } catch {
            // Fall through to the plain filename.
        }
    }
    const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
    return plain?.trim() || 'advertisement.mp4';
};

export const advertisementsService = {
    downloadUrl: (id: string): string =>
        `${config.apiUrl}/advertisements/${encodeURIComponent(id)}/download`,

    /** Authenticated MP4 fetch: a bare link cannot refresh an expired session. */
    download: async (id: string): Promise<{ blob: Blob; filename: string }> => {
        const response = await apiClient.get<Blob>(
            `/advertisements/${encodeURIComponent(id)}/download`,
            { responseType: 'blob' }
        );
        return {
            blob: response.data,
            filename: downloadFilename(response.headers.get('content-disposition') ?? ''),
        };
    },

    getProjectVideo: async (projectId: string): Promise<ProjectVideoState> => {
        const response = await apiClient.get<ApiEnvelope<ProjectVideoState>>(
            `/projects/${projectId}/video`
        );
        return unwrap(response.data, { initialized: false, projectId });
    },

    /** Backend-owned preparation state — one durable document per project. */
    getProjectPreparation: async (projectId: string): Promise<ProjectPreparationState> => {
        const response = await apiClient.get<ApiEnvelope<ProjectPreparationState>>(
            `/projects/${projectId}/preparation`
        );
        return unwrap(response.data, null as unknown as ProjectPreparationState);
    },

    retryPreparationResource: async (
        projectId: string,
        kind: PreparationResourceKind
    ): Promise<ProjectPreparationState> => {
        const response = await apiClient.post<ApiEnvelope<ProjectPreparationState>>(
            `/projects/${projectId}/preparation/${kind}/retry`
        );
        return unwrap(response.data, null as unknown as ProjectPreparationState);
    },

    initializeProjectVideo: async (projectId: string): Promise<AdvertisementDetail> => {
        const response = await apiClient.post<ApiEnvelope<AdvertisementDetail>>(
            `/projects/${projectId}/video/initialize`
        );
        return unwrap(response.data, null as unknown as AdvertisementDetail);
    },

    list: async (params?: AdvertisementsQuery): Promise<AdvertisementList> => {
        const response = await apiClient.get<ApiEnvelope<AdvertisementList>>('/advertisements', {
            params: {
                page: params?.page,
                limit: params?.limit,
                status: params?.status || undefined,
                search: params?.search?.trim() || undefined,
            },
        });
        return unwrap(response.data, { items: [], total: 0 });
    },

    getById: async (id: string): Promise<AdvertisementDetail> => {
        const response = await apiClient.get<ApiEnvelope<AdvertisementDetail>>(
            `/advertisements/${id}`
        );
        return unwrap(response.data, null as unknown as AdvertisementDetail);
    },

    remove: async (id: string): Promise<void> => {
        await apiClient.delete(`/advertisements/${id}`);
    },

    confirmLanguage: async (id: string, language: AdvertisementLanguage): Promise<AdvertisementDetail> => {
        const response = await apiClient.post<ApiEnvelope<AdvertisementDetail>>(
            `/advertisements/${id}/video/language`,
            { language }
        );
        return unwrap(response.data, null as unknown as AdvertisementDetail);
    },

    analyzeAudio: async (id: string): Promise<AdvertisementDetail> => {
        const response = await apiClient.post<ApiEnvelope<AdvertisementDetail>>(
            `/advertisements/${id}/video/analyze-audio`,
            {}
        );
        return unwrap(response.data, null as unknown as AdvertisementDetail);
    },

    generate: async (id: string, targetDurationSec?: number): Promise<GenerateVideoResult> => {
        const response = await apiClient.post<ApiEnvelope<GenerateVideoResult>>(
            `/advertisements/${id}/video/generate`,
            targetDurationSec ? { targetDurationSec } : {},
            { headers: { 'Idempotency-Key': idempotencyKey('ads-generate') } }
        );
        return unwrap(response.data, null as unknown as GenerateVideoResult);
    },

    /**
     * One user action, two explicitly metered server decisions: composition
     * generation from the prepared package, then the existing render route.
     */
    generateAnimationVideo: async (
        projectId: string,
        targetDurationSec?: number
    ): Promise<GenerateAnimationVideoResult> => {
        const response = await apiClient.post<ApiEnvelope<GenerateAnimationVideoResult>>(
            `/projects/${projectId}/video/generate-animation`,
            targetDurationSec ? { targetDurationSec } : {},
            { headers: { 'Idempotency-Key': idempotencyKey('ads-animation') } }
        );
        const generated = unwrap(
            response.data,
            null as unknown as GenerateAnimationVideoResult
        );
        const render = await advertisementsService.startRender(
            generated.detail.advertisement.id
        );
        return { ...generated, render };
    },

    getComposition: async (id: string): Promise<{
        composition: AdvertisementDetail['composition'];
        validationIssues: Array<{ sceneId: string; message: string }>;
        voiceLanguageMismatch: string | null;
        renderStale: boolean;
    }> => {
        const response = await apiClient.get<
            ApiEnvelope<{
                composition: AdvertisementDetail['composition'];
                validationIssues: Array<{ sceneId: string; message: string }>;
                voiceLanguageMismatch: string | null;
                renderStale: boolean;
            }>
        >(`/advertisements/${id}/video/composition`);
        return unwrap(response.data, {
            composition: null,
            validationIssues: [],
            voiceLanguageMismatch: null,
            renderStale: false,
        });
    },

    getPreview: async (id: string): Promise<VideoPreview> => {
        const response = await apiClient.get<ApiEnvelope<VideoPreview>>(
            `/advertisements/${id}/video/preview`
        );
        return unwrap(response.data, { html: '', durationSec: 0, sandbox: '' });
    },

    regenerateScene: async (id: string, sceneId: string): Promise<AdvertisementDetail> => {
        const response = await apiClient.post<ApiEnvelope<AdvertisementDetail>>(
            `/advertisements/${id}/video/scenes/${encodeURIComponent(sceneId)}/regenerate`,
            {},
            { headers: { 'Idempotency-Key': idempotencyKey('ads-scene') } }
        );
        return unwrap(response.data, null as unknown as AdvertisementDetail);
    },

    setVoice: async (id: string, source: VoiceSource, audioId?: string): Promise<AdvertisementDetail> => {
        const response = await apiClient.patch<ApiEnvelope<AdvertisementDetail>>(
            `/advertisements/${id}/voice`,
            { source, ...(audioId ? { audioId } : {}) }
        );
        return unwrap(response.data, null as unknown as AdvertisementDetail);
    },

    generateVoice: async (id: string): Promise<AdvertisementDetail> => {
        const response = await apiClient.post<ApiEnvelope<AdvertisementDetail>>(
            `/advertisements/${id}/voice/generate`,
            {},
            { headers: { 'Idempotency-Key': idempotencyKey('ads-voice') } }
        );
        return unwrap(response.data, null as unknown as AdvertisementDetail);
    },

    startRender: async (
        id: string,
        resolution: '720p' | '1080p' = '720p'
    ): Promise<RenderStartResult> => {
        const response = await apiClient.post<ApiEnvelope<RenderStartResult>>(
            `/advertisements/${id}/render`,
            { resolution, aspectRatio: '16:9' },
            { headers: { 'Idempotency-Key': idempotencyKey('ads-render') } }
        );
        return unwrap(response.data, null as unknown as RenderStartResult);
    },

    listRenderJobs: async (id: string): Promise<RenderJob[]> => {
        const response = await apiClient.get<ApiEnvelope<RenderJob[]>>(
            `/advertisements/${id}/render-jobs`
        );
        return unwrap(response.data, []);
    },

    getRenderJob: async (id: string, jobId: string): Promise<RenderJob> => {
        const response = await apiClient.get<ApiEnvelope<RenderJob>>(
            `/advertisements/${id}/render-jobs/${jobId}`
        );
        return unwrap(response.data, null as unknown as RenderJob);
    },

    cancelRender: async (id: string, jobId: string): Promise<RenderJob> => {
        const response = await apiClient.post<ApiEnvelope<RenderJob>>(
            `/advertisements/${id}/render-jobs/${jobId}/cancel`
        );
        return unwrap(response.data, null as unknown as RenderJob);
    },

    retryRender: async (id: string, jobId: string): Promise<RenderStartResult> => {
        const response = await apiClient.post<ApiEnvelope<RenderStartResult>>(
            `/advertisements/${id}/render-jobs/${jobId}/retry`,
            {},
            { headers: { 'Idempotency-Key': idempotencyKey('ads-retry') } }
        );
        return unwrap(response.data, null as unknown as RenderStartResult);
    },
};
