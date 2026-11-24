// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';

import enAdvertisements from '../../../../messages/en/advertisements.json';
import { detailFixture, renderJobFixture } from '../../../../tests/helpers/advertisements';
import { advertisementKeys } from '../lib/query-keys';
import {
    useGenerateVideo,
    useInitializeProjectVideo,
    useRenderJob,
} from './use-advertisements';

const mocks = vi.hoisted(() => ({
    generate: vi.fn(),
    initialize: vi.fn(),
    getRenderJob: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
    confirmLanguage: vi.fn(),
    analyzeAudio: vi.fn(),
    getComposition: vi.fn(),
    getPreview: vi.fn(),
    regenerateScene: vi.fn(),
    setVoice: vi.fn(),
    generateVoice: vi.fn(),
    startRender: vi.fn(),
    listRenderJobs: vi.fn(),
    cancelRender: vi.fn(),
    retryRender: vi.fn(),
}));

vi.mock('../services/advertisements.service', () => ({
    advertisementsService: {
        getProjectVideo: vi.fn(),
        initializeProjectVideo: mocks.initialize,
        list: mocks.list,
        getById: mocks.getById,
        remove: mocks.remove,
        confirmLanguage: mocks.confirmLanguage,
        analyzeAudio: mocks.analyzeAudio,
        generate: mocks.generate,
        getComposition: mocks.getComposition,
        getPreview: mocks.getPreview,
        regenerateScene: mocks.regenerateScene,
        setVoice: mocks.setVoice,
        generateVoice: mocks.generateVoice,
        startRender: mocks.startRender,
        listRenderJobs: mocks.listRenderJobs,
        getRenderJob: mocks.getRenderJob,
        cancelRender: mocks.cancelRender,
        retryRender: mocks.retryRender,
    },
}));

vi.mock('@/lib/toast', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider locale="en" messages={{ advertisements: enAdvertisements }}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
);

beforeEach(() => {
    queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    queryClient.clear();
});

describe('advertisement hooks', () => {
    it('caches the generated detail and invalidates the preview query', async () => {
        const original = detailFixture();
        const generated = detailFixture({
            advertisement: {
                ...original.advertisement,
                compositionHash: 'hash-2',
                motionVersion: 2,
            },
        });
        mocks.generate.mockResolvedValue({ detail: generated, generatedBy: 'fallback' });
        queryClient.setQueryData(advertisementKeys.detail('ad-1'), original);
        queryClient.setQueryData(advertisementKeys.preview('ad-1'), {
            html: 'old',
            durationSec: 30,
            sandbox: 'allow-scripts',
        });

        const { result } = renderHook(() => useGenerateVideo('ad-1'), { wrapper });
        await act(async () => {
            await result.current.mutateAsync(undefined);
        });

        expect(mocks.generate).toHaveBeenCalledWith('ad-1', undefined);
        expect(queryClient.getQueryData(advertisementKeys.detail('ad-1'))).toEqual(generated);
        expect(queryClient.getQueryState(advertisementKeys.preview('ad-1'))?.isInvalidated).toBe(true);
    });

    it('seeds both detail keys when a project video is initialized', async () => {
        const detail = detailFixture();
        mocks.initialize.mockResolvedValue(detail);

        const { result } = renderHook(() => useInitializeProjectVideo(), { wrapper });
        await act(async () => {
            await result.current.mutateAsync('project-1');
        });

        expect(mocks.initialize).toHaveBeenCalledWith('project-1');
        expect(queryClient.getQueryData(advertisementKeys.detail('ad-1'))).toEqual(detail);
        expect(queryClient.getQueryData(advertisementKeys.projectVideo('project-1'))).toEqual(detail);
    });

    it('loads a render job only when a job id is supplied', async () => {
        const job = renderJobFixture({ status: 'processing-audio' });
        mocks.getRenderJob.mockResolvedValue(job);

        const active = renderHook(() => useRenderJob('ad-1', 'job-1'), { wrapper });
        await waitFor(() => expect(active.result.current.data).toEqual(job));
        expect(mocks.getRenderJob).toHaveBeenCalledWith('ad-1', 'job-1');

        const idle = renderHook(() => useRenderJob('ad-1'), { wrapper });
        await waitFor(() => expect(idle.result.current.fetchStatus).toBe('idle'));
        expect(mocks.getRenderJob).toHaveBeenCalledTimes(1);
    });
});
