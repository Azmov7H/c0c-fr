import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-error';
import { scriptsService } from './scripts.service';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
    default: { get: mocks.get, post: mocks.post },
}));

const envelope = <T>(data: T) => ({ data: { success: true, data } });

const job = (status: string, scriptId: string | null = null, error: string | null = null) => ({
    jobId: 'job-1',
    projectId: 'p1',
    kind: 'script',
    status,
    scriptId,
    error,
    createdAt: '2026-01-01T00:00:00.000Z',
    startedAt: null,
    finishedAt: null,
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('D5 durable script generation contract', () => {
    it('returns the 202 job handle without pretending a script exists', async () => {
        mocks.post.mockResolvedValue(
            envelope({ jobId: 'job-1', status: 'queued', projectId: 'p1' })
        );

        const result = await scriptsService.generateScript('p1');

        expect(result).toEqual({ jobId: 'job-1', status: 'queued', projectId: 'p1' });
        expect(mocks.post).toHaveBeenCalledWith('/scripts/generate', { projectId: 'p1' });
    });

    it('polls the durable job until a terminal status and exposes its script id', async () => {
        mocks.get
            .mockResolvedValueOnce(envelope(job('queued')))
            .mockResolvedValueOnce(envelope(job('processing')))
            .mockResolvedValueOnce(envelope(job('completed', 'script-9')));

        const result = await scriptsService.waitForGenerationJob('job-1', {
            intervalMs: 1,
            timeoutMs: 1000,
        });

        expect(result.status).toBe('completed');
        expect(result.scriptId).toBe('script-9');
        expect(mocks.get).toHaveBeenCalledTimes(3);
        expect(mocks.get).toHaveBeenCalledWith('/scripts/jobs/job-1');
    });

    it('returns the failed terminal status with the provider error', async () => {
        mocks.get.mockResolvedValue(envelope(job('failed', null, 'provider declined')));

        const result = await scriptsService.waitForGenerationJob('job-1', {
            intervalMs: 1,
            timeoutMs: 1000,
        });

        expect(result.status).toBe('failed');
        expect(result.error).toBe('provider declined');
    });

    it('throws a typed timeout instead of hanging forever', async () => {
        mocks.get.mockResolvedValue(envelope(job('queued')));

        const error = await scriptsService
            .waitForGenerationJob('job-1', { intervalMs: 1, timeoutMs: 1 })
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ code: 'GENERATION_TIMEOUT' });
    });
});
