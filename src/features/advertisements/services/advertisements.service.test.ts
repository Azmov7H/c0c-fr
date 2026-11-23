import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '@/config';

import { advertisementsService } from './advertisements.service';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
    default: {
        get: mocks.get,
        post: mocks.post,
        patch: mocks.patch,
        delete: mocks.delete,
    },
}));

type Call = [string, unknown?, { headers?: Record<string, string> }?];

const envelope = <T>(data?: T) => ({
    success: true,
    ...(data === undefined ? {} : { data }),
});
const apiResponse = <T>(data?: T) => ({ data: envelope(data) });

beforeEach(() => {
    vi.clearAllMocks();
});

describe('advertisementsService', () => {
    it('lists advertisements through the rewritten API path and unwraps the envelope', async () => {
        const list = { items: [], total: 0 };
        mocks.get.mockResolvedValue(apiResponse(list));

        await expect(
            advertisementsService.list({ page: 2, limit: 12, status: '', search: '  projeto  ' })
        ).resolves.toEqual(list);

        expect(mocks.get).toHaveBeenCalledWith('/advertisements', {
            params: { page: 2, limit: 12, status: undefined, search: 'projeto' },
        });
    });

    it('sends a fresh idempotency key and a bounded duration when generating', async () => {
        const generated = { detail: {}, generatedBy: 'fallback' };
        mocks.post.mockResolvedValue(apiResponse(generated));

        await expect(advertisementsService.generate('ad-1', 30)).resolves.toEqual(generated);

        const [path, body, options] = mocks.post.mock.calls[0] as Call;
        expect(path).toBe('/advertisements/ad-1/video/generate');
        expect(body).toEqual({ targetDurationSec: 30 });
        expect(options?.headers?.['Idempotency-Key']).toMatch(/^ads-generate-/);
    });

    it('keeps voice selection explicit and omits audioId when it is not needed', async () => {
        mocks.patch.mockResolvedValue(apiResponse({}));

        await advertisementsService.setVoice('ad-1', 'existing', 'audio-9');
        expect(mocks.patch).toHaveBeenLastCalledWith('/advertisements/ad-1/voice', {
            source: 'existing',
            audioId: 'audio-9',
        });

        await advertisementsService.setVoice('ad-1', 'none');
        expect(mocks.patch).toHaveBeenLastCalledWith('/advertisements/ad-1/voice', {
            source: 'none',
        });
    });

    it('stamps retries with their own idempotency key', async () => {
        mocks.post.mockResolvedValue(apiResponse({ job: {}, reused: false }));

        await advertisementsService.retryRender('ad-1', 'job-1');

        const [path, body, options] = mocks.post.mock.calls[0] as Call;
        expect(path).toBe('/advertisements/ad-1/render-jobs/job-1/retry');
        expect(body).toEqual({});
        expect(options?.headers?.['Idempotency-Key']).toMatch(/^ads-retry-/);
    });

    it('falls back safely when an envelope has no data, and builds encoded download URLs', async () => {
        mocks.get.mockResolvedValue(apiResponse());

        await expect(advertisementsService.getPreview('ad-1')).resolves.toEqual({
            html: '',
            durationSec: 0,
            sandbox: '',
        });
        expect(advertisementsService.downloadUrl('ad 1')).toBe(
            `${config.apiUrl}/advertisements/ad%201/download`
        );
    });
});
